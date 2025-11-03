import { db, functions } from '../firebase';
import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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

/**
 * Fundraising Service
 * Handles all fundraising data operations
 */
export class FundraisingService {
  private static readonly COLLECTION = 'fundraising';
  private static readonly CURRENT_DOC = 'current';

  /**
   * Get current fundraising data
   */
  static async getCurrentFundraising(): Promise<CharlestonWrapData | null> {
    try {
      const docRef = doc(db, this.COLLECTION, this.CURRENT_DOC);
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
   * Subscribe to fundraising data updates
   */
  static subscribeFundraising(
    callback: (data: CharlestonWrapData | null) => void
  ): () => void {
    const docRef = doc(db, this.COLLECTION, this.CURRENT_DOC);

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
    // Assumes total campaign is 30 days
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
   * Manually trigger data sync (admin only)
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
