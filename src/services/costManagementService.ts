import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  API_STATUS, 
  API_CONFIG, 
  estimateApiCosts,
  getApiStatus,
  setApiStatus 
} from '../config/apiKeys';

export interface CostBreakdown {
  // API Costs
  api: {
    openai: number;
    googleMaps: number;
    openWeather: number;
    googlePlaces: number;
    phoneValidation: number;
    tenor: number;
    recaptcha: number;
  };
  
  // Firebase Infrastructure
  firebase: {
    firestore: number;
    storage: number;
    hosting: number;
    functions: number;
    auth: number;
  };
  
  // Totals
  total: {
    daily: number;
    monthly: number;
    yearly: number;
  };
}

export interface UsageMetrics {
  date: string;
  requests: {
    openai: number;
    googleMaps: number;
    openWeather: number;
    googlePlaces: number;
    phoneValidation: number;
    tenor: number;
    recaptcha: number;
  };
  costs: CostBreakdown;
  lastUpdated: Date;
}

export interface CostAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  threshold: number;
  current: number;
  date: Date;
  acknowledged: boolean;
}

class CostManagementService {
  private db = getFirestore();
  private auth = getAuth();
  private cache: UsageMetrics | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastCacheTime = 0;

  /**
   * Check if user has admin access to cost management
   */
  private hasAdminAccess(): boolean {
    const user = this.auth.currentUser;
    if (!user) return false;
    
    // Check for admin indicators in email
    const email = user.email?.toLowerCase() || '';
    return email.includes('admin') || 
           email.includes('cubmaster') || 
           email.includes('denleader') ||
           email.includes('root');
  }

  /**
   * Track API usage for cost monitoring
   */
  async trackApiUsage(service: string, userRole?: string, cost: number = 0): Promise<void> {
    if (!this.hasAdminAccess()) {
      console.warn('Non-admin user attempted to track API usage');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(this.db, 'cost-tracking', today);
      
      // Get current usage data
      const usageDoc = await getDoc(usageRef);
      const currentData = usageDoc.exists() ? usageDoc.data() : {
        date: today,
        requests: {
          openai: 0,
          googleMaps: 0,
          openWeather: 0,
          googlePlaces: 0,
          phoneValidation: 0,
          tenor: 0,
          recaptcha: 0
        },
        costs: {
          api: {
            openai: 0,
            googleMaps: 0,
            openWeather: 0,
            googlePlaces: 0,
            phoneValidation: 0,
            tenor: 0,
            recaptcha: 0
          },
          firebase: {
            firestore: 0,
            storage: 0,
            hosting: 0,
            functions: 0,
            auth: 0
          },
          total: {
            daily: 0,
            monthly: 0,
            yearly: 0
          }
        },
        lastUpdated: serverTimestamp()
      };

      // Update requests count
      if (currentData.requests[service] !== undefined) {
        currentData.requests[service] += 1;
      }

      // Update costs
      if (currentData.costs.api[service] !== undefined) {
        currentData.costs.api[service] += cost;
      }

      // Recalculate totals
      const apiCosts = Object.values(currentData.costs.api).reduce((sum: number, cost: any) => sum + (cost as number), 0);
      const firebaseCosts = Object.values(currentData.costs.firebase).reduce((sum: number, cost: any) => sum + (cost as number), 0);
      
      currentData.costs.total.daily = apiCosts + firebaseCosts;
      currentData.costs.total.monthly = currentData.costs.total.daily * 30;
      currentData.costs.total.yearly = currentData.costs.total.daily * 365;
      currentData.lastUpdated = serverTimestamp();

      // Save to Firestore
      await setDoc(usageRef, currentData);

      // Update API status tracking
      this.updateApiStatus(service, userRole);

      // Check for cost alerts
      await this.checkCostAlerts(currentData.costs.total.daily);

    } catch (error) {
      console.error('Error tracking API usage:', error);
    }
  }

  /**
   * Update API status tracking
   */
  private updateApiStatus(service: string, userRole?: string): void {
    const isAdmin = userRole?.includes('admin') || userRole?.includes('cubmaster') || userRole?.includes('denleader');
    const keyType = isAdmin ? 'ADMIN' : 'USER';
    
    const currentStatus = getApiStatus(keyType, service);
    if (currentStatus) {
      setApiStatus(keyType, service, {
        ...currentStatus,
        requestsToday: currentStatus.requestsToday + 1,
        lastCheck: new Date(),
      });
    }
  }

  /**
   * Get current usage metrics (admin only)
   */
  async getCurrentUsage(): Promise<UsageMetrics | null> {
    if (!this.hasAdminAccess()) {
      console.warn('Non-admin user attempted to access cost management');
      return null;
    }

    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && (now - this.lastCacheTime) < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(this.db, 'cost-tracking', today);
      const usageDoc = await getDoc(usageRef);

      if (usageDoc.exists()) {
        const data = usageDoc.data() as UsageMetrics;
        this.cache = data;
        this.lastCacheTime = now;
        return data;
      } else {
        // Return default structure if no data exists
        const defaultData: UsageMetrics = {
          date: today,
          requests: {
            openai: 0,
            googleMaps: 0,
            openWeather: 0,
            googlePlaces: 0,
            phoneValidation: 0,
            tenor: 0,
            recaptcha: 0
          },
          costs: {
            api: {
              openai: 0,
              googleMaps: 0,
              openWeather: 0,
              googlePlaces: 0,
              phoneValidation: 0,
              tenor: 0,
              recaptcha: 0
            },
            firebase: {
              firestore: 0,
              storage: 0,
              hosting: 0,
              functions: 0,
              auth: 0
            },
            total: {
              daily: 0,
              monthly: 0,
              yearly: 0
            }
          },
          lastUpdated: new Date()
        };
        
        this.cache = defaultData;
        this.lastCacheTime = now;
        return defaultData;
      }
    } catch (error) {
      console.error('Error fetching current usage:', error);
      return null;
    }
  }

  /**
   * Get historical usage data (admin only)
   */
  async getHistoricalUsage(days: number = 30): Promise<UsageMetrics[]> {
    if (!this.hasAdminAccess()) {
      console.warn('Non-admin user attempted to access historical cost data');
      return [];
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const usageQuery = query(
        collection(this.db, 'cost-tracking'),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0])
      );

      const querySnapshot = await getDocs(usageQuery);
      const historicalData: UsageMetrics[] = [];

      querySnapshot.forEach((doc) => {
        historicalData.push(doc.data() as UsageMetrics);
      });

      return historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error fetching historical usage:', error);
      return [];
    }
  }

  /**
   * Estimate Firebase infrastructure costs
   */
  async estimateFirebaseCosts(): Promise<CostBreakdown['firebase']> {
    if (!this.hasAdminAccess()) {
      return {
        firestore: 0,
        storage: 0,
        hosting: 0,
        functions: 0,
        auth: 0
      };
    }

    try {
      // Get collection counts for estimation
      const collections = ['events', 'locations', 'announcements', 'chat-messages', 'users'];
      const counts = await Promise.all(
        collections.map(async (collectionName) => {
          try {
            const snapshot = await getDocs(collection(this.db, collectionName));
            return snapshot.size;
          } catch {
            return 0;
          }
        })
      );

      const totalDocuments = counts.reduce((sum, count) => sum + count, 0);

      // Estimate costs based on usage
      const estimatedReads = totalDocuments * 10; // 10 reads per document per month
      const estimatedWrites = totalDocuments * 2; // 2 writes per document per month
      const estimatedDeletes = Math.floor(totalDocuments * 0.1); // 10% deletion rate

      // Firebase pricing (2024 rates)
      const firestoreReadCost = (estimatedReads / 100000) * 0.06; // $0.06 per 100k reads
      const firestoreWriteCost = (estimatedWrites / 100000) * 0.18; // $0.18 per 100k writes
      const firestoreDeleteCost = (estimatedDeletes / 100000) * 0.02; // $0.02 per 100k deletes
      const firestoreTotal = firestoreReadCost + firestoreWriteCost + firestoreDeleteCost;

      // Storage cost (estimate 50MB)
      const storageBytes = 50 * 1024 * 1024; // 50MB
      const storageCost = (storageBytes / (1024 * 1024 * 1024)) * 0.026; // $0.026 per GB

      // Hosting cost (free tier for most usage)
      const hostingCost = 0.00; // Free tier

      // Functions cost
      const functionInvocations = estimatedWrites * 2; // 2 function calls per write
      const functionCost = (functionInvocations / 1000000) * 0.40; // $0.40 per million invocations

      // Auth cost (free tier)
      const authCost = 0.00; // Free tier

      return {
        firestore: firestoreTotal,
        storage: storageCost,
        hosting: hostingCost,
        functions: functionCost,
        auth: authCost
      };
    } catch (error) {
      console.error('Error estimating Firebase costs:', error);
      return {
        firestore: 0,
        storage: 0,
        hosting: 0,
        functions: 0,
        auth: 0
      };
    }
  }

  /**
   * Check for cost alerts
   */
  private async checkCostAlerts(dailyCost: number): Promise<void> {
    if (!this.hasAdminAccess()) return;

    const alertsRef = collection(this.db, 'cost-alerts');
    
    // Define thresholds
    const thresholds = {
      warning: 5.00, // $5/day
      critical: 25.00 // $25/day
    };

    let alertType: 'warning' | 'critical' | null = null;
    let message = '';

    if (dailyCost >= thresholds.critical) {
      alertType = 'critical';
      message = `Critical: Daily costs have exceeded $${thresholds.critical}. Current cost: $${dailyCost.toFixed(2)}`;
    } else if (dailyCost >= thresholds.warning) {
      alertType = 'warning';
      message = `Warning: Daily costs have exceeded $${thresholds.warning}. Current cost: $${dailyCost.toFixed(2)}`;
    }

    if (alertType) {
      const alertData: CostAlert = {
        id: Date.now().toString(),
        type: alertType,
        message,
        threshold: thresholds[alertType],
        current: dailyCost,
        date: new Date(),
        acknowledged: false
      };

      try {
        await setDoc(doc(alertsRef, alertData.id), alertData);
      } catch (error) {
        console.error('Error creating cost alert:', error);
      }
    }
  }

  /**
   * Get cost alerts (admin only)
   */
  async getCostAlerts(): Promise<CostAlert[]> {
    if (!this.hasAdminAccess()) {
      return [];
    }

    try {
      const alertsQuery = query(
        collection(this.db, 'cost-alerts'),
        where('acknowledged', '==', false)
      );
      
      const querySnapshot = await getDocs(alertsQuery);
      const alerts: CostAlert[] = [];

      querySnapshot.forEach((doc) => {
        alerts.push(doc.data() as CostAlert);
      });

      return alerts.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error fetching cost alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge cost alert (admin only)
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    if (!this.hasAdminAccess()) return;

    try {
      const alertRef = doc(this.db, 'cost-alerts', alertId);
      await updateDoc(alertRef, {
        acknowledged: true,
        acknowledgedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  /**
   * Get comprehensive cost report (admin only)
   */
  async getCostReport(): Promise<{
    current: UsageMetrics | null;
    historical: UsageMetrics[];
    alerts: CostAlert[];
    firebaseEstimate: CostBreakdown['firebase'];
  }> {
    if (!this.hasAdminAccess()) {
      return {
        current: null,
        historical: [],
        alerts: [],
        firebaseEstimate: {
          firestore: 0,
          storage: 0,
          hosting: 0,
          functions: 0,
          auth: 0
        }
      };
    }

    const [current, historical, alerts, firebaseEstimate] = await Promise.all([
      this.getCurrentUsage(),
      this.getHistoricalUsage(30),
      this.getCostAlerts(),
      this.estimateFirebaseCosts()
    ]);

    return {
      current,
      historical,
      alerts,
      firebaseEstimate
    };
  }

  /**
   * Clear cache (for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.lastCacheTime = 0;
  }
}

// Export singleton instance
export const costManagementService = new CostManagementService();
