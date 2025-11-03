import { db, functions } from '../firebase/config';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// ============================================================================
// Charleston Wrap Integration Types & Service
// ============================================================================

/**
 * Charleston Wrap Fundraiser Data Interface
 */
export interface CharlestonWrapData {
  customerNumber: string;
  organizationName: string;
  campaign: string;
  totalRetail: number;
  totalItemsSold: number;
  totalProfit: number;
  daysRemaining: number;
  saleEndDate: string;
  fundraisingGoal: number;
  goalStatement: string;
  salesRep: {
    name: string;
    phone: string;
    email: string;
  };
  chairperson: {
    name: string;
    phone: string;
    email: string;
  };
  lastUpdated: Timestamp;
}

/**
 * Fundraising progress metrics
 */
export interface FundraisingProgress {
  percentageToGoal: number;
  amountRemaining: number;
  isGoalMet: boolean;
  projectedTotal: number;
  daysPercentageComplete: number;
}

// ============================================================================
// Generic Fundraising Types (for AdminFundraising)
// ============================================================================

export interface FundraisingCampaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  currentAmount: number;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'active' | 'completed' | 'upcoming' | 'paused';
  type: 'popcorn' | 'camping' | 'general' | 'event' | 'donation';
  participants?: number;
  maxParticipants?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FundraisingDonation {
  id: string;
  campaignId: string;
  donorName: string;
  amount: number;
  date: Timestamp;
  notes?: string;
  anonymous: boolean;
}

// ============================================================================
// Fundraising Service Class
// ============================================================================

/**
 * Fundraising Service
 * Handles both Charleston Wrap integration and generic fundraising campaigns
 */
export class FundraisingService {
  private static readonly CW_COLLECTION = 'fundraising';
  private static readonly CW_DOC = 'current';
  private static readonly CAMPAIGNS_COLLECTION = 'fundraisingCampaigns';
  private static readonly DONATIONS_COLLECTION = 'fundraisingDonations';

  // ============================================================================
  // Charleston Wrap Methods
  // ============================================================================

  /**
   * Get current Charleston Wrap fundraising data
   */
  static async getCurrentFundraising(): Promise<CharlestonWrapData | null> {
    try {
      const docRef = doc(db, this.CW_COLLECTION, this.CW_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as CharlestonWrapData;
      }

      return null;
    } catch (error) {
      console.error('Error getting fundraising data:', error);
      throw error;
    }
  }

  /**
   * Subscribe to Charleston Wrap fundraising data updates
   */
  static subscribeFundraising(
    callback: (data: CharlestonWrapData | null) => void
  ): () => void {
    const docRef = doc(db, this.CW_COLLECTION, this.CW_DOC);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as CharlestonWrapData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to fundraising data:', error);
        callback(null);
      }
    );
  }

  /**
   * Calculate fundraising progress metrics
   */
  static calculateProgress(data: CharlestonWrapData): FundraisingProgress {
    const percentageToGoal = data.fundraisingGoal > 0
      ? (data.totalProfit / data.fundraisingGoal) * 100
      : 0;

    const amountRemaining = Math.max(0, data.fundraisingGoal - data.totalProfit);
    const isGoalMet = data.totalProfit >= data.fundraisingGoal;

    // Simple projection based on current pace
    const totalCampaignDays = 30;
    const daysElapsed = totalCampaignDays - data.daysRemaining;
    const daysPercentageComplete = daysElapsed > 0
      ? (daysElapsed / totalCampaignDays) * 100
      : 0;

    const dailyAverage = daysElapsed > 0
      ? data.totalProfit / daysElapsed
      : 0;

    const projectedTotal = dailyAverage * totalCampaignDays;

    return {
      percentageToGoal: Math.min(100, Math.round(percentageToGoal)),
      amountRemaining,
      isGoalMet,
      projectedTotal: Math.round(projectedTotal),
      daysPercentageComplete: Math.round(daysPercentageComplete),
    };
  }

  /**
   * Manually trigger Charleston Wrap data sync (admin only)
   */
  static async manualSync(): Promise<{
    success: boolean;
    message: string;
    data?: CharlestonWrapData;
  }> {
    try {
      const syncFunction = httpsCallable(functions, 'manualSyncCharlestonWrap');
      const result = await syncFunction({});
      return result.data as any;
    } catch (error) {
      console.error('Error triggering manual sync:', error);
      throw error;
    }
  }

  // ============================================================================
  // Generic Campaign Methods (for AdminFundraising)
  // ============================================================================

  /**
   * Get all fundraising campaigns
   */
  static async getCampaigns(): Promise<FundraisingCampaign[]> {
    try {
      const q = query(
        collection(db, this.CAMPAIGNS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundraisingCampaign));
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return [];
    }
  }

  /**
   * Get single campaign
   */
  static async getCampaign(id: string): Promise<FundraisingCampaign | null> {
    try {
      const docRef = doc(db, this.CAMPAIGNS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FundraisingCampaign;
      }
      return null;
    } catch (error) {
      console.error('Error getting campaign:', error);
      return null;
    }
  }

  /**
   * Create new campaign
   */
  static async createCampaign(data: Partial<FundraisingCampaign>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.CAMPAIGNS_COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Update campaign
   */
  static async updateCampaign(id: string, data: Partial<FundraisingCampaign>): Promise<void> {
    try {
      const docRef = doc(db, this.CAMPAIGNS_COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  static async deleteCampaign(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.CAMPAIGNS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  /**
   * Get all donations
   */
  static async getDonations(): Promise<FundraisingDonation[]> {
    try {
      const q = query(
        collection(db, this.DONATIONS_COLLECTION),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FundraisingDonation));
    } catch (error) {
      console.error('Error getting donations:', error);
      return [];
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Format currency
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format percentage
   */
  static formatPercent(value: number): string {
    return `${Math.round(value)}%`;
  }

  /**
   * Get progress color based on percentage
   */
  static getProgressColor(percentage: number): string {
    if (percentage >= 100) return '#22c55e'; // green
    if (percentage >= 75) return '#84cc16'; // lime
    if (percentage >= 50) return '#eab308'; // yellow
    if (percentage >= 25) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  /**
   * Get urgency level based on days remaining
   */
  static getUrgencyLevel(daysRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'high';
    if (daysRemaining <= 14) return 'medium';
    return 'low';
  }
}

// Export singleton instance for AdminFundraising compatibility
export const fundraisingService = {
  getCampaigns: () => FundraisingService.getCampaigns(),
  getCampaign: (id: string) => FundraisingService.getCampaign(id),
  createCampaign: (data: Partial<FundraisingCampaign>) => FundraisingService.createCampaign(data),
  updateCampaign: (id: string, data: Partial<FundraisingCampaign>) => FundraisingService.updateCampaign(id, data),
  deleteCampaign: (id: string) => FundraisingService.deleteCampaign(id),
  getDonations: () => FundraisingService.getDonations(),
};
