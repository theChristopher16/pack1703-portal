import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService, UserRole } from './authService';

export interface ComponentUsage {
  userId: string;
  componentId: string;
  componentName: string;
  componentPath: string;
  userRole: UserRole;
  usageCount: number;
  lastUsed: any; // Firestore timestamp
  firstUsed: any; // Firestore timestamp
}

export interface UserUsageStats {
  userId: string;
  userRole: UserRole;
  totalPageViews: number;
  mostUsedComponents: ComponentUsage[];
  lastActive: any; // Firestore timestamp
}

export interface ComponentAnalytics {
  componentId: string;
  componentName: string;
  componentPath: string;
  totalUsage: number;
  uniqueUsers: number;
  averageUsagePerUser: number;
  lastUsed: any; // Firestore timestamp
}

class UsageTrackingService {
  private readonly COLLECTION_NAME = 'usageTracking';
  private readonly USER_STATS_COLLECTION = 'userUsageStats';
  private readonly COMPONENT_ANALYTICS_COLLECTION = 'componentAnalytics';

  /**
   * Track component usage for the current user
   */
  async trackComponentUsage(componentId: string, componentName: string, componentPath: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.log('No authenticated user, skipping usage tracking');
        return;
      }

      const userRole = currentUser.role || UserRole.ANONYMOUS;
      const userId = currentUser.uid;

      // Create or update component usage record
      const usageRef = doc(db, this.COLLECTION_NAME, `${userId}_${componentId}`);
      
      const usageData = {
        userId,
        componentId,
        componentName,
        componentPath,
        userRole,
        usageCount: increment(1),
        lastUsed: serverTimestamp(),
        firstUsed: serverTimestamp() // This will only be set on first creation
      };

      // Check if this is the first time using this component
      const existingDoc = await getDoc(usageRef);
      if (!existingDoc.exists()) {
        // First time - set firstUsed timestamp
        await setDoc(usageRef, {
          ...usageData,
          usageCount: 1,
          firstUsed: serverTimestamp()
        });
      } else {
        // Update existing usage
        await updateDoc(usageRef, {
          usageCount: increment(1),
          lastUsed: serverTimestamp()
        });
      }

      // Update user stats
      await this.updateUserStats(userId, userRole);

      // Update component analytics
      await this.updateComponentAnalytics(componentId, componentName, componentPath);

    } catch (error) {
      console.error('Error tracking component usage:', error);
      // Don't throw error - usage tracking should not break the app
    }
  }

  /**
   * Get the most used components for a specific user
   */
  async getUserMostUsedComponents(userId: string, limitCount: number = 10): Promise<ComponentUsage[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('usageCount', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ComponentUsage);
    } catch (error) {
      console.error('Error getting user most used components:', error);
      return [];
    }
  }

  /**
   * Get the most used components for a specific role
   */
  async getRoleMostUsedComponents(userRole: UserRole, limitCount: number = 10): Promise<ComponentUsage[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userRole', '==', userRole),
        orderBy('usageCount', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ComponentUsage);
    } catch (error) {
      console.error('Error getting role most used components:', error);
      return [];
    }
  }

  /**
   * Get user's most used components based on their role and personal usage
   */
  async getUserPersonalizedComponents(userId: string, userRole: UserRole): Promise<ComponentUsage[]> {
    try {
      // Get user's personal usage
      const userComponents = await this.getUserMostUsedComponents(userId, 5);
      
      // If user has no personal usage, fall back to role-based popular components
      if (userComponents.length === 0) {
        return await this.getRoleMostUsedComponents(userRole, 5);
      }

      // Combine personal usage with role-based popular components
      const roleComponents = await this.getRoleMostUsedComponents(userRole, 3);
      
      // Merge and deduplicate, prioritizing personal usage
      const combined = [...userComponents];
      roleComponents.forEach(roleComp => {
        if (!combined.find(comp => comp.componentId === roleComp.componentId)) {
          combined.push(roleComp);
        }
      });

      return combined.slice(0, 5);
    } catch (error) {
      console.error('Error getting personalized components:', error);
      return [];
    }
  }

  /**
   * Update user statistics
   */
  private async updateUserStats(userId: string, userRole: UserRole): Promise<void> {
    try {
      const userStatsRef = doc(db, this.USER_STATS_COLLECTION, userId);
      
      await setDoc(userStatsRef, {
        userId,
        userRole,
        totalPageViews: increment(1),
        lastActive: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  /**
   * Update component analytics
   */
  private async updateComponentAnalytics(componentId: string, componentName: string, componentPath: string): Promise<void> {
    try {
      const analyticsRef = doc(db, this.COMPONENT_ANALYTICS_COLLECTION, componentId);
      
      await setDoc(analyticsRef, {
        componentId,
        componentName,
        componentPath,
        totalUsage: increment(1),
        lastUsed: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating component analytics:', error);
    }
  }

  /**
   * Get component analytics for admin dashboard and hero buttons
   */
  async getComponentAnalytics(limitCount: number = 20): Promise<ComponentAnalytics[]> {
    try {
      // Get component analytics from the analytics collection
      const analyticsQuery = query(
        collection(db, this.COMPONENT_ANALYTICS_COLLECTION),
        orderBy('totalUsage', 'desc'),
        limit(limitCount)
      );

      const analyticsSnapshot = await getDocs(analyticsQuery);
      const analytics = analyticsSnapshot.docs.map(doc => doc.data() as ComponentAnalytics);

      // For each component, get unique user count from usage tracking
      const enrichedAnalytics = await Promise.all(
        analytics.map(async (analytics) => {
          try {
            const usageQuery = query(
              collection(db, this.COLLECTION_NAME),
              where('componentId', '==', analytics.componentId)
            );
            const usageSnapshot = await getDocs(usageQuery);
            
            const uniqueUsers = new Set();
            usageSnapshot.docs.forEach(doc => {
              const data = doc.data();
              uniqueUsers.add(data.userId);
            });

            return {
              ...analytics,
              uniqueUsers: uniqueUsers.size,
              averageUsagePerUser: uniqueUsers.size > 0 ? analytics.totalUsage / uniqueUsers.size : 0
            };
          } catch (error) {
            console.error(`Error getting unique users for ${analytics.componentId}:`, error);
            return {
              ...analytics,
              uniqueUsers: 0,
              averageUsagePerUser: 0
            };
          }
        })
      );

      // Sort by total usage (most used components first)
      return enrichedAnalytics.sort((a, b) => b.totalUsage - a.totalUsage);
    } catch (error) {
      console.error('Error getting component analytics:', error);
      return [];
    }
  }

  /**
   * Get user usage statistics
   */
  async getUserUsageStats(userId: string): Promise<UserUsageStats | null> {
    try {
      const userStatsRef = doc(db, this.USER_STATS_COLLECTION, userId);
      const docSnap = await getDoc(userStatsRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserUsageStats;
      }
      return null;
    } catch (error) {
      console.error('Error getting user usage stats:', error);
      return null;
    }
  }
}

export const usageTrackingService = new UsageTrackingService();
