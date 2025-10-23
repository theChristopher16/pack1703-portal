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
  // External API Costs
  api: {
    // Google Services
    googleMaps: number;
    googlePlaces: number;
    
    // Weather Services
    openWeather: number;
    
    // Communication Services
    phoneValidation: number;
    tenor: number; // GIF service
    recaptcha: number;
    
    // Additional Services
    emailService: number; // SendGrid/EmailJS
  };
  
  // Firebase Infrastructure
  firebase: {
    firestore: number;
    storage: number;
    hosting: number;
    functions: number;
    auth: number;
    appCheck: number;
    analytics: number;
  };
  
  // Google Cloud Services
  gcp: {
    secretManager: number;
    monitoring: number;
    logging: number;
    scheduler: number;
    pubsub: number;
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
    // Google Services
    googleMaps: number;
    googlePlaces: number;
    
    // Weather Services
    openWeather: number;
    
    // Communication Services
    phoneValidation: number;
    tenor: number;
    recaptcha: number;
    
    // Additional Services
    emailService: number;
    
    // Firebase/GCP Operations
    firestoreReads: number;
    firestoreWrites: number;
    firestoreDeletes: number;
    functionInvocations: number;
    storageOperations: number;
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
    const hasEmailAccess = email.includes('admin') || 
           email.includes('cubmaster') || 
           email.includes('denleader') ||
                          email.includes('root') ||
                          email.includes('christophersmith'); // Add your specific email
    
    // Also check if user has custom claims for admin access
    // Note: customClaims are not directly accessible on the client
    // We'll rely on the admin context for role checking
    
    if (hasEmailAccess) {
      console.log(`✅ Cost management access granted via email: ${email}`);
      return true;
    }
    
    console.log(`❌ Cost management access denied for user: ${email}`);
    return false;
  }

  /**
   * Track API usage for cost monitoring with alerts
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
          // Google Services
          googleMaps: 0,
          googlePlaces: 0,
          
          // Weather Services
          openWeather: 0,
          
          // Communication Services
          phoneValidation: 0,
          tenor: 0,
          recaptcha: 0,
          
          // Additional Services
          emailService: 0,
          
          // Firebase/GCP Operations
          firestoreReads: 0,
          firestoreWrites: 0,
          firestoreDeletes: 0,
          functionInvocations: 0,
          storageOperations: 0
        },
        costs: {
          api: {
            // Google Services
            googleMaps: 0,
            googlePlaces: 0,
            
            // Weather Services
            openWeather: 0,
            
            // Communication Services
            phoneValidation: 0,
            tenor: 0,
            recaptcha: 0,
            
            // Additional Services
            emailService: 0
          },
          firebase: {
            firestore: 0,
            storage: 0,
            hosting: 0,
            functions: 0,
            auth: 0,
            appCheck: 0,
            analytics: 0
          },
          gcp: {
            secretManager: 0,
            monitoring: 0,
            logging: 0,
            scheduler: 0,
            pubsub: 0
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

      // Check for cost alerts
      await this.checkCostAlertsForService(currentData, service, cost);
      currentData.lastUpdated = serverTimestamp();

      // Save to Firestore
      await setDoc(usageRef, currentData);

      // Update API status tracking
      this.updateApiStatus(service, userRole);

    } catch (error) {
      console.error('Error tracking API usage:', error);
    }
  }

  /**
   * Check for cost alerts and create them if thresholds are exceeded
   */
  private async checkCostAlertsForService(usageData: any, service: string, cost: number): Promise<void> {
    try {
      const dailyBudget = 5.00; // $5 daily budget
      const monthlyBudget = 150.00; // $150 monthly budget
      const serviceBudget = 2.00; // $2 per service per day

      // Daily budget alert
      if (usageData.costs.total.daily > dailyBudget) {
        await this.createCostAlert({
          type: 'critical',
          message: `Daily budget exceeded: $${usageData.costs.total.daily.toFixed(2)} (Budget: $${dailyBudget})`,
          service: 'total',
          cost: usageData.costs.total.daily
        });
      }

      // Monthly budget alert
      if (usageData.costs.total.monthly > monthlyBudget) {
        await this.createCostAlert({
          type: 'warning',
          message: `Monthly budget at risk: $${usageData.costs.total.monthly.toFixed(2)} (Budget: $${monthlyBudget})`,
          service: 'total',
          cost: usageData.costs.total.monthly
        });
      }

      // Service-specific budget alert
      const serviceCost = usageData.costs.api[service] || 0;
      if (serviceCost > serviceBudget) {
        await this.createCostAlert({
          type: 'warning',
          message: `${service} usage high: $${serviceCost.toFixed(2)} (Budget: $${serviceBudget})`,
          service: service,
          cost: serviceCost
        });
      }
    } catch (error) {
      console.error('Error checking cost alerts:', error);
    }
  }

  /**
   * Create a cost alert in Firestore
   */
  private async createCostAlert(alertData: {
    type: 'critical' | 'warning' | 'info';
    message: string;
    service: string;
    cost: number;
  }): Promise<void> {
    try {
      const alertRef = doc(collection(this.db, 'cost-alerts'));
      await setDoc(alertRef, {
        ...alertData,
        id: alertRef.id,
        date: serverTimestamp(),
        acknowledged: false
      });
    } catch (error) {
      console.error('Error creating cost alert:', error);
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
            // Google Services
            googleMaps: 0,
            googlePlaces: 0,
            
            // Weather Services
            openWeather: 0,
            
            // Communication Services
            phoneValidation: 0,
            tenor: 0,
            recaptcha: 0,
            
            // Additional Services
            emailService: 0,
            
            // Firebase/GCP Operations
            firestoreReads: 0,
            firestoreWrites: 0,
            firestoreDeletes: 0,
            functionInvocations: 0,
            storageOperations: 0
          },
          costs: {
            api: {
              // Google Services
              googleMaps: 0,
              googlePlaces: 0,
              
              // Weather Services
              openWeather: 0,
              
              // Communication Services
              phoneValidation: 0,
              tenor: 0,
              recaptcha: 0,
              
              // Additional Services
              emailService: 0
            },
            firebase: {
              firestore: 0,
              storage: 0,
              hosting: 0,
              functions: 0,
              auth: 0,
              appCheck: 0,
              analytics: 0
            },
            gcp: {
              secretManager: 0,
              monitoring: 0,
              logging: 0,
              scheduler: 0,
              pubsub: 0
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
   * Estimate Firebase and GCP infrastructure costs with real data
   */
  async estimateFirebaseCosts(): Promise<CostBreakdown['firebase']> {
    if (!this.hasAdminAccess()) {
      return {
        firestore: 0,
        storage: 0,
        hosting: 0,
        functions: 0,
        auth: 0,
        appCheck: 0,
        analytics: 0
      };
    }

    try {
      // Get real collection counts for estimation
      const collections = [
        'events', 'locations', 'announcements', 'chat-messages', 'users', 
        'cost-tracking', 'cost-alerts', 'api-usage', 'system-logs'
      ];
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

      // Estimate costs based on real usage patterns
      const estimatedReads = totalDocuments * 15; // 15 reads per document per month (increased for real usage)
      const estimatedWrites = totalDocuments * 3; // 3 writes per document per month
      const estimatedDeletes = Math.floor(totalDocuments * 0.05); // 5% deletion rate

      // Firebase pricing (2024 rates)
      const firestoreReadCost = (estimatedReads / 100000) * 0.06; // $0.06 per 100k reads
      const firestoreWriteCost = (estimatedWrites / 100000) * 0.18; // $0.18 per 100k writes
      const firestoreDeleteCost = (estimatedDeletes / 100000) * 0.02; // $0.02 per 100k deletes
      const firestoreTotal = firestoreReadCost + firestoreWriteCost + firestoreDeleteCost;

      // Storage cost (estimate based on real usage)
      const storageBytes = 100 * 1024 * 1024; // 100MB (increased estimate)
      const storageCost = (storageBytes / (1024 * 1024 * 1024)) * 0.026; // $0.026 per GB

      // Hosting cost (Blaze plan)
      const hostingCost = 0.026; // $0.026 per GB transferred

      // Functions cost (based on real usage)
      const functionInvocations = estimatedWrites * 3; // 3 function calls per write (increased for real usage)
      const functionCost = (functionInvocations / 1000000) * 0.40; // $0.40 per million invocations

      // Auth cost (free tier for most usage)
      const authCost = 0.00; // Free tier

      // App Check cost (free tier)
      const appCheckCost = 0.00; // Free tier

      // Analytics cost (free tier)
      const analyticsCost = 0.00; // Free tier

      return {
        firestore: firestoreTotal,
        storage: storageCost,
        hosting: hostingCost,
        functions: functionCost,
        auth: authCost,
        appCheck: appCheckCost,
        analytics: analyticsCost
      };
    } catch (error) {
      console.error('Error estimating Firebase costs:', error);
      return {
        firestore: 0,
        storage: 0,
        hosting: 0,
        functions: 0,
        auth: 0,
        appCheck: 0,
        analytics: 0
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
   * Estimate GCP infrastructure costs
   */
  async estimateGCPCosts(): Promise<CostBreakdown['gcp']> {
    if (!this.hasAdminAccess()) {
      return {
        secretManager: 0,
        monitoring: 0,
        logging: 0,
        scheduler: 0,
        pubsub: 0
      };
    }

    try {
      // Estimate based on real usage patterns
      const secretManagerCost = 0.06; // $0.06 per secret per month
      const monitoringCost = 0.258; // $0.258 per metric per month (estimated 100 metrics)
      const loggingCost = 0.50; // $0.50 per GB per month (estimated 2GB logs)
      const schedulerCost = 0.10; // $0.10 per job per month (estimated 1 scheduled job)
      const pubsubCost = 0.40; // $0.40 per million messages (estimated 1M messages)

      return {
        secretManager: secretManagerCost,
        monitoring: monitoringCost,
        logging: loggingCost,
        scheduler: schedulerCost,
        pubsub: pubsubCost
      };
    } catch (error) {
      console.error('Error estimating GCP costs:', error);
      return {
        secretManager: 0,
        monitoring: 0,
        logging: 0,
        scheduler: 0,
        pubsub: 0
      };
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
    gcpEstimate: CostBreakdown['gcp'];
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
          auth: 0,
          appCheck: 0,
          analytics: 0
        },
        gcpEstimate: {
          secretManager: 0,
          monitoring: 0,
          logging: 0,
          scheduler: 0,
          pubsub: 0
        }
      };
    }

    const [current, historical, alerts, firebaseEstimate, gcpEstimate] = await Promise.all([
      this.getCurrentUsage(),
      this.getHistoricalUsage(30),
      this.getCostAlerts(),
      this.estimateFirebaseCosts(),
      this.estimateGCPCosts()
    ]);

    return {
      current,
      historical,
      alerts,
      firebaseEstimate,
      gcpEstimate
    };
  }

  /**
   * Get real API usage statistics from Firestore
   */
  async getRealApiUsageStats(): Promise<Record<string, any>> {
    if (!this.hasAdminAccess()) {
      return {};
    }

    try {
      // Get API usage data from the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const usageQuery = query(
        collection(this.db, 'cost-tracking'),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0])
      );

      const querySnapshot = await getDocs(usageQuery);
      const stats: Record<string, any> = {
        googleMaps: { requests: 0, cost: 0, status: 'active' },
        openWeather: { requests: 0, cost: 0, status: 'active' },
        googlePlaces: { requests: 0, cost: 0, status: 'active' },
        phoneValidation: { requests: 0, cost: 0, status: 'active' },
        tenor: { requests: 0, cost: 0, status: 'active' },
        emailService: { requests: 0, cost: 0, status: 'active' }
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.requests && data.costs) {
          Object.keys(stats).forEach(service => {
            if (data.requests[service] !== undefined) {
              stats[service].requests += data.requests[service] || 0;
              stats[service].cost += data.costs.api?.[service] || 0;
            }
          });
        }
      });

      // Return real data only - no sample/fallback data
      if (querySnapshot.size === 0) {
        console.log('No API usage data found in cost-tracking collection');
      }

      return stats;
    } catch (error) {
      console.error('Error fetching real API usage stats:', error);
      // Return empty stats on error - no fake data
      return {};
    }
  }

  /**
   * Check for cost alerts with real thresholds based on actual usage
   */
  async checkRealTimeCostAlerts(): Promise<CostAlert[]> {
    if (!this.hasAdminAccess()) {
      return [];
    }

    const alerts: CostAlert[] = [];
    const currentUsage = await this.getCurrentUsage();
    const firebaseEstimate = await this.estimateFirebaseCosts();

    if (!currentUsage) {
      return alerts;
    }

    // Define realistic thresholds based on typical usage
    const thresholds = {
      daily: {
        warning: 2.00,    // $2 per day
        critical: 5.00    // $5 per day
      },
      monthly: {
        warning: 50.00,   // $50 per month
        critical: 100.00  // $100 per month
      },
      service: {
        googleMaps: 1.00,     // $1 per day for Google Maps
        openWeather: 0.50,    // $0.50 per day for weather
        firestore: 3.00       // $3 per day for Firestore
      }
    };

    // Check daily budget alerts
    if (currentUsage.costs.total.daily >= thresholds.daily.critical) {
      alerts.push({
        id: `daily-critical-${Date.now()}`,
        type: 'critical',
        message: `Critical: Daily costs have exceeded $${thresholds.daily.critical}. Current cost: $${currentUsage.costs.total.daily.toFixed(2)}`,
        threshold: thresholds.daily.critical,
        current: currentUsage.costs.total.daily,
        date: new Date(),
        acknowledged: false
      });
    } else if (currentUsage.costs.total.daily >= thresholds.daily.warning) {
      alerts.push({
        id: `daily-warning-${Date.now()}`,
        type: 'warning',
        message: `Warning: Daily costs have exceeded $${thresholds.daily.warning}. Current cost: $${currentUsage.costs.total.daily.toFixed(2)}`,
        threshold: thresholds.daily.warning,
        current: currentUsage.costs.total.daily,
        date: new Date(),
        acknowledged: false
      });
    }

    // Check monthly budget alerts
    if (currentUsage.costs.total.monthly >= thresholds.monthly.critical) {
      alerts.push({
        id: `monthly-critical-${Date.now()}`,
        type: 'critical',
        message: `Critical: Monthly costs have exceeded $${thresholds.monthly.critical}. Current cost: $${currentUsage.costs.total.monthly.toFixed(2)}`,
        threshold: thresholds.monthly.critical,
        current: currentUsage.costs.total.monthly,
        date: new Date(),
        acknowledged: false
      });
    } else if (currentUsage.costs.total.monthly >= thresholds.monthly.warning) {
      alerts.push({
        id: `monthly-warning-${Date.now()}`,
        type: 'warning',
        message: `Warning: Monthly costs have exceeded $${thresholds.monthly.warning}. Current cost: $${currentUsage.costs.total.monthly.toFixed(2)}`,
        threshold: thresholds.monthly.warning,
        current: currentUsage.costs.total.monthly,
        date: new Date(),
        acknowledged: false
      });
    }

    // Check service-specific alerts
    Object.entries(thresholds.service).forEach(([service, threshold]) => {
      const serviceCost = currentUsage.costs.api[service as keyof typeof currentUsage.costs.api] || 0;
      if (serviceCost >= threshold) {
        alerts.push({
          id: `service-${service}-${Date.now()}`,
          type: 'warning',
          message: `${service} usage high: $${serviceCost.toFixed(2)} (Threshold: $${threshold})`,
          threshold: threshold,
          current: serviceCost,
          date: new Date(),
          acknowledged: false
        });
      }
    });

    // Check for unusual usage spikes
    const totalRequests = Object.values(currentUsage.requests).reduce((sum, count) => sum + count, 0);
    if (totalRequests > 1000) { // More than 1000 requests in a day
      alerts.push({
        id: `usage-spike-${Date.now()}`,
        type: 'warning',
        message: `High usage detected: ${totalRequests} API requests today`,
        threshold: 1000,
        current: totalRequests,
        date: new Date(),
        acknowledged: false
      });
    }

    // Check Firebase storage usage
    if (firebaseEstimate.storage > 2.00) { // More than $2 for storage
      alerts.push({
        id: `storage-high-${Date.now()}`,
        type: 'warning',
        message: `Firebase Storage costs high: $${firebaseEstimate.storage.toFixed(2)}`,
        threshold: 2.00,
        current: firebaseEstimate.storage,
        date: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Create and save cost alerts to Firestore
   */
  async createAndSaveAlerts(): Promise<void> {
    if (!this.hasAdminAccess()) {
      return;
    }

    try {
      const alerts = await this.checkRealTimeCostAlerts();
      
      // Save new alerts to Firestore
      for (const alert of alerts) {
        const alertRef = doc(collection(this.db, 'cost-alerts'));
        await setDoc(alertRef, {
          ...alert,
          id: alertRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      console.log(`Created ${alerts.length} cost alerts`);
    } catch (error) {
      console.error('Error creating and saving alerts:', error);
    }
  }

  /**
   * Get cost alerts with smart filtering
   */
  async getSmartCostAlerts(): Promise<CostAlert[]> {
    if (!this.hasAdminAccess()) {
      return [];
    }

    try {
      // Get alerts from the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const alertsQuery = query(
        collection(this.db, 'cost-alerts'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        where('acknowledged', '==', false)
      );
      
      const querySnapshot = await getDocs(alertsQuery);
      const alerts: CostAlert[] = [];

      querySnapshot.forEach((doc) => {
        alerts.push(doc.data() as CostAlert);
      });

      // Sort by severity and date
      return alerts.sort((a, b) => {
        if (a.type === 'critical' && b.type !== 'critical') return -1;
        if (b.type === 'critical' && a.type !== 'critical') return 1;
        return b.date.getTime() - a.date.getTime();
      });
    } catch (error) {
      console.error('Error fetching smart cost alerts:', error);
      return [];
    }
  }

  /**
   * Clear cache (for testing or forcing refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.lastCacheTime = 0;
  }
}

// Export singleton instance with lazy initialization
let _costManagementService: CostManagementService | null = null;

export const costManagementService = {
  get instance(): CostManagementService {
    if (!_costManagementService) {
      _costManagementService = new CostManagementService();
    }
    return _costManagementService;
  }
};
