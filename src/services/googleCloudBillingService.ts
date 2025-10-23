import { getAuth } from 'firebase/auth';

export interface BillingAccount {
  name: string;
  displayName: string;
  open: boolean;
  masterBillingAccount?: string;
}

export interface ServiceCost {
  serviceId: string;
  serviceName: string;
  cost: number;
  currency: string;
  usage: {
    amount: number;
    unit: string;
  };
}

export interface BillingData {
  billingAccountId: string;
  totalCost: number;
  currency: string;
  period: {
    startDate: string;
    endDate: string;
  };
  services: ServiceCost[];
  lastUpdated: Date;
}

class GoogleCloudBillingService {
  private auth = getAuth();
  private readonly BILLING_API_BASE = 'https://cloudbilling.googleapis.com/v1';

  /**
   * Check if user has billing access
   */
  private hasBillingAccess(): boolean {
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
      console.log(`✅ Billing access granted via email: ${email}`);
      return true;
    }
    
    console.log(`❌ Billing access denied for user: ${email}`);
    return false;
  }

  /**
   * Get billing accounts for the project
   */
  async getBillingAccounts(): Promise<BillingAccount[]> {
    if (!this.hasBillingAccess()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      // Get Firebase project ID
      const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'pack1703-rsvp';
      
      // In a real implementation, you would call the Google Cloud Billing API
      // For now, return mock data based on typical Firebase/GCP usage
      return [
        {
          name: `billingAccounts/${projectId}-billing`,
          displayName: 'Pack 1703 Portal Billing Account',
          open: true
        }
      ];
    } catch (error) {
      console.error('Error fetching billing accounts:', error);
      throw new Error('Failed to fetch billing accounts');
    }
  }

  /**
   * Get cost data for a specific period
   * 
   * TODO: Implement Google Cloud Billing API integration
   * This requires:
   * 1. Setting up Cloud Billing API access in GCP Console
   * 2. Configuring service account with billing viewer role
   * 3. Implementing API calls to cloudbilling.googleapis.com
   * 
   * See: https://cloud.google.com/billing/docs/how-to/billing-api
   */
  async getCostData(
    billingAccountId: string,
    startDate: string,
    endDate: string
  ): Promise<BillingData> {
    if (!this.hasBillingAccess()) {
      throw new Error('Access denied: Admin privileges required');
    }

    // Google Cloud Billing API not yet integrated
    // Return empty data structure - no fake/mock data
    console.warn('Google Cloud Billing API not implemented - returning empty billing data');
    
    return {
      billingAccountId,
      totalCost: 0,
      currency: 'USD',
      period: {
        startDate,
        endDate
      },
      services: [],
      lastUpdated: new Date()
    };
  }

  /**
   * Get current month's cost data
   */
  async getCurrentMonthCosts(): Promise<BillingData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const billingAccounts = await this.getBillingAccounts();
    if (billingAccounts.length === 0) {
      throw new Error('No billing accounts found');
    }

    return this.getCostData(
      billingAccounts[0].name,
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0]
    );
  }

  /**
   * Get cost trends for the last N months
   */
  async getCostTrends(months: number = 6): Promise<BillingData[]> {
    const billingAccounts = await this.getBillingAccounts();
    if (billingAccounts.length === 0) {
      throw new Error('No billing accounts found');
    }

    const trends: BillingData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      try {
        const costData = await this.getCostData(
          billingAccounts[0].name,
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        );
        trends.push(costData);
      } catch (error) {
        console.warn(`Failed to fetch cost data for ${startOfMonth.toISOString()}:`, error);
        // Add empty data point to maintain timeline
        trends.push({
          billingAccountId: billingAccounts[0].name,
          totalCost: 0,
          currency: 'USD',
          period: {
            startDate: startOfMonth.toISOString().split('T')[0],
            endDate: endOfMonth.toISOString().split('T')[0]
          },
          services: [],
          lastUpdated: new Date()
        });
      }
    }

    return trends;
  }

  /**
   * Get cost breakdown by service category
   */
  async getServiceCategoryBreakdown(): Promise<Record<string, number>> {
    try {
      const costData = await this.getCurrentMonthCosts();
      const breakdown: Record<string, number> = {
        'Database': 0,
        'Compute': 0,
        'Storage': 0,
        'Networking': 0,
        'Security': 0,
        'Monitoring': 0,
        'Other': 0
      };

      costData.services.forEach(service => {
        const serviceName = service.serviceName.toLowerCase();
        
        if (serviceName.includes('firestore') || serviceName.includes('database')) {
          breakdown.Database += service.cost;
        } else if (serviceName.includes('function') || serviceName.includes('compute')) {
          breakdown.Compute += service.cost;
        } else if (serviceName.includes('storage') || serviceName.includes('hosting')) {
          breakdown.Storage += service.cost;
        } else if (serviceName.includes('networking') || serviceName.includes('pub/sub')) {
          breakdown.Networking += service.cost;
        } else if (serviceName.includes('auth') || serviceName.includes('secret')) {
          breakdown.Security += service.cost;
        } else if (serviceName.includes('monitoring') || serviceName.includes('logging')) {
          breakdown.Monitoring += service.cost;
        } else {
          breakdown.Other += service.cost;
        }
      });

      return breakdown;
    } catch (error) {
      console.error('Error getting service category breakdown:', error);
      return {};
    }
  }
}

// Export singleton instance
export const googleCloudBillingService = new GoogleCloudBillingService();
