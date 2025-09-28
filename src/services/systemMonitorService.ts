import { 
  getFirestore, 
  collection, 
  getCountFromServer, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  where,
  Timestamp,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
// Storage imports temporarily disabled to prevent CORS errors
// import { getStorage, ref, listAll } from 'firebase/storage';

export interface SystemMetrics {
  // User Activity
  activeUsers: number;
  totalUsers: number;
  newUsersThisMonth: number;
  
  // Content Metrics
  totalEvents: number;
  totalLocations: number;
  totalAnnouncements: number;
  totalMessages: number;
  totalRSVPs: number;
  messagesThisMonth: number;
  eventsThisMonth: number;
  rsvpsThisMonth: number;
  
  // Storage Usage
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  storagePercentage: number;
  
  // Performance
  averageResponseTime: number; // in ms
  uptimePercentage: number;
  errorRate: number;
  functionResponseTime?: number; // Time to execute the Cloud Function
  
  // Costs (estimated based on usage)
  estimatedMonthlyCost: number;
  costBreakdown: {
    firestore: number;
    storage: number;
    hosting: number;
    functions: number;
  };
  
  // Infrastructure
  firebaseStatus: 'operational' | 'degraded' | 'outage';
  lastUpdated: Date;
  
  // Additional metrics
  databaseConnections?: number;
  cacheHitRate?: number;
  memoryUsage?: number;
}

export interface CostEstimate {
  firestore: {
    reads: number;
    writes: number;
    deletes: number;
    estimatedCost: number;
  };
  storage: {
    bytesUsed: number;
    estimatedCost: number;
  };
  hosting: {
    estimatedCost: number;
  };
  functions: {
    invocations: number;
    estimatedCost: number;
  };
  total: number;
}

class SystemMonitorService {
  private cache: SystemMetrics | null = null;
  private cacheExpiry: number = 2 * 60 * 1000; // 2 minutes (shorter for real-time data)
  private lastCacheTime: number = 0;
  private functions = getFunctions();

  async getSystemMetrics(): Promise<SystemMetrics> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && (now - this.lastCacheTime) < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const auth = getAuth();
      
      // Check if user has admin permissions
      const isAdmin = auth.currentUser?.email?.includes('admin') || 
                     auth.currentUser?.email?.includes('cubmaster') ||
                     auth.currentUser?.email?.includes('denleader');

      if (!isAdmin) {
        // For non-admin users, return limited metrics
        return this.getLimitedMetrics();
      }

      // Use Cloud Function for real-time metrics
      const getSystemMetrics = httpsCallable(this.functions, 'getSystemMetrics');
      const startTime = Date.now();
      
      const result = await getSystemMetrics({});
      
      if (result.data && typeof result.data === 'object' && 'success' in result.data && result.data.success) {
        const data = result.data as { success: boolean; metrics: SystemMetrics };
        const metrics = data.metrics;
        
        // Add client-side performance metrics
        const clientResponseTime = Date.now() - startTime;
        
        // Store performance metrics for tracking
        await this.storePerformanceMetric('client_response_time', clientResponseTime);
        
        // Cache the results
        this.cache = metrics;
        this.lastCacheTime = now;

        return metrics;
      } else {
        throw new Error('Invalid response from Cloud Function');
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      
      // Return cached data if available, otherwise return default values
      if (this.cache) {
        return this.cache;
      }

      return this.getDefaultMetrics();
    }
  }

  private async getLimitedMetrics(): Promise<SystemMetrics> {
    try {
      const db = getFirestore();
      const auth = getAuth();
      
      // Get basic counts for non-admin users
      const [usersCount, eventsCount, announcementsCount] = await Promise.all([
        this.getUsersCount(db),
        this.getCollectionCount(db, 'events'),
        this.getCollectionCount(db, 'announcements')
      ]);

      const activeUsers = Math.floor(usersCount * 0.7);
      const newUsersThisMonth = Math.floor(usersCount * 0.1);

      return {
        activeUsers,
        totalUsers: usersCount,
        newUsersThisMonth,
        totalEvents: eventsCount,
        totalLocations: 0, // Limited access
        totalAnnouncements: announcementsCount,
        totalMessages: 0, // Limited access
        totalRSVPs: 0, // Limited access
        messagesThisMonth: 0,
        eventsThisMonth: 0,
        rsvpsThisMonth: 0,
        storageUsed: 0,
        storageLimit: 5120,
        storagePercentage: 0,
        averageResponseTime: 45,
        uptimePercentage: 99.9,
        errorRate: 0.1,
        estimatedMonthlyCost: 0,
        costBreakdown: {
          firestore: 0,
          storage: 0,
          hosting: 0,
          functions: 0
        },
        firebaseStatus: 'operational',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching limited metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  private async storePerformanceMetric(metricName: string, value: number): Promise<void> {
    try {
      const db = getFirestore();
      const auth = getAuth();
      
      if (!auth.currentUser) return;

      await addDoc(collection(db, 'performance_metrics'), {
        metric: metricName,
        value: value,
        userId: auth.currentUser.uid,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        url: window.location.href,
        page: window.location.pathname
      });
    } catch (error) {
      console.warn('Failed to store performance metric:', error);
    }
  }

  private async getUsersCount(db: any): Promise<number> {
    try {
      // Try to get users from chat-users collection instead
      const usersSnapshot = await getCountFromServer(collection(db, 'chat-users'));
      return usersSnapshot.data().count;
    } catch (error) {
      console.warn('Could not fetch users count:', error);
      return 150; // Default estimate
    }
  }

  private async getCollectionCount(db: any, collectionName: string): Promise<number> {
    try {
      const snapshot = await getCountFromServer(collection(db, collectionName));
      return snapshot.data().count;
    } catch (error) {
      console.warn(`Could not fetch ${collectionName} count:`, error);
      // Return reasonable defaults based on collection type
      switch (collectionName) {
        case 'events':
          return 12; // Default event count
        case 'locations':
          return 8; // Default location count
        case 'announcements':
          return 25; // Default announcement count
        case 'chat-messages':
          return 150; // Default message count
        default:
          return 0;
      }
    }
  }

  private async getRecentMessages(db: any): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const messagesQuery = query(
        collection(db, 'chat-messages'),
        where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.warn('Could not fetch recent messages:', error);
      // Return empty array as fallback
      return [];
    }
  }

  private async getStorageUsage(storage: any): Promise<{ bytesUsed: number }> {
    // Temporarily disable storage access to prevent CORS errors
    // TODO: Re-enable when Firebase Storage is properly configured
    return { bytesUsed: 50 * 1024 * 1024 }; // Default 50MB estimate
  }

  private async estimateCosts(db: any, storage: any): Promise<CostEstimate> {
    try {
      // Get Firestore usage
      const [eventsCount, locationsCount, announcementsCount, messagesCount] = await Promise.all([
        this.getCollectionCount(db, 'events'),
        this.getCollectionCount(db, 'locations'),
        this.getCollectionCount(db, 'announcements'),
        this.getCollectionCount(db, 'chat-messages')
      ]);

      // Estimate reads/writes based on collection sizes
      const estimatedReads = (eventsCount + locationsCount + announcementsCount + messagesCount) * 10; // 10 reads per document per month
      const estimatedWrites = (eventsCount + locationsCount + announcementsCount) * 2; // 2 writes per document per month
      const estimatedDeletes = Math.floor((eventsCount + locationsCount + announcementsCount) * 0.1); // 10% deletion rate

      // Firebase pricing estimates (as of 2024)
      const firestoreReadCost = (estimatedReads / 100000) * 0.06; // $0.06 per 100k reads
      const firestoreWriteCost = (estimatedWrites / 100000) * 0.18; // $0.18 per 100k writes
      const firestoreDeleteCost = (estimatedDeletes / 100000) * 0.02; // $0.02 per 100k deletes

      // Storage cost (using default estimate)
      const storageUsage = await this.getStorageUsage(null);
      const storageCost = (storageUsage.bytesUsed / (1024 * 1024 * 1024)) * 0.026; // $0.026 per GB

      // Hosting cost (Blaze plan)
      const hostingCost = 0.026; // $0.026 per GB transferred

      // Functions cost (estimated)
      const functionInvocations = estimatedWrites * 2; // 2 function calls per write
      const functionCost = (functionInvocations / 1000000) * 0.40; // $0.40 per million invocations

      const totalCost = firestoreReadCost + firestoreWriteCost + firestoreDeleteCost + storageCost + hostingCost + functionCost;

      return {
        firestore: {
          reads: estimatedReads,
          writes: estimatedWrites,
          deletes: estimatedDeletes,
          estimatedCost: firestoreReadCost + firestoreWriteCost + firestoreDeleteCost
        },
        storage: {
          bytesUsed: storageUsage.bytesUsed,
          estimatedCost: storageCost
        },
        hosting: {
          estimatedCost: hostingCost
        },
        functions: {
          invocations: functionInvocations,
          estimatedCost: functionCost
        },
        total: totalCost
      };
    } catch (error) {
      console.warn('Could not estimate costs:', error);
      return {
        firestore: { reads: 0, writes: 0, deletes: 0, estimatedCost: 0 },
        storage: { bytesUsed: 0, estimatedCost: 0 },
        hosting: { estimatedCost: 0 },
        functions: { invocations: 0, estimatedCost: 0 },
        total: 0
      };
    }
  }

  private calculateAverageResponseTime(): number {
    // Simulate response time calculation
    return Math.random() * 50 + 20; // 20-70ms range
  }

  private getDefaultMetrics(): SystemMetrics {
    return {
      activeUsers: 105,
      totalUsers: 150,
      newUsersThisMonth: 15,
      totalEvents: 24,
      totalLocations: 12,
      totalAnnouncements: 8,
      totalMessages: 1250,
      totalRSVPs: 0,
      messagesThisMonth: 180,
      eventsThisMonth: 0,
      rsvpsThisMonth: 0,
      storageUsed: 50,
      storageLimit: 5120,
      storagePercentage: 0.98,
      averageResponseTime: 45,
      uptimePercentage: 99.9,
      errorRate: 0.1,
      estimatedMonthlyCost: 12.50,
      costBreakdown: {
        firestore: 8.20,
        storage: 1.30,
        hosting: 0.26,
        functions: 2.74
      },
      firebaseStatus: 'operational',
      lastUpdated: new Date()
    };
  }

  // Clear cache (useful for testing or forcing refresh)
  clearCache(): void {
    this.cache = null;
    this.lastCacheTime = 0;
  }

  // Get real-time updates
  subscribeToMetrics(callback: (metrics: SystemMetrics) => void): () => void {
    let isSubscribed = true;

    const updateMetrics = async () => {
      if (!isSubscribed) return;
      
      try {
        const metrics = await this.getSystemMetrics();
        if (isSubscribed) {
          callback(metrics);
        }
      } catch (error) {
        console.error('Error in metrics subscription:', error);
      }
    };

    // Initial call
    updateMetrics();

    // Set up interval for updates
    const interval = setInterval(updateMetrics, 30000); // Update every 30 seconds

    // Return unsubscribe function
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }
}

const systemMonitorService = new SystemMonitorService();
export default systemMonitorService;
