import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService } from './authService';

/**
 * Service to track and update user activity
 * Updates the user document's lastActive field when users interact with the app
 */
class UserActivityService {
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000; // Update every 5 minutes
  private lastUpdateTime: number = 0;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic activity updates
    this.startActivityTracking();
  }

  /**
   * Start tracking user activity
   */
  private startActivityTracking(): void {
    // Update on page load
    this.updateActivity();

    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.updateActivity();
    }, this.UPDATE_INTERVAL);

    // Update on user interactions (throttled)
    this.setupInteractionTracking();
  }

  /**
   * Setup interaction tracking to update activity on user actions
   */
  private setupInteractionTracking(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });

    // Track user interactions (throttled to avoid too many updates)
    const throttledUpdate = this.throttle(() => {
      this.updateActivity();
    }, 60000); // Update at most once per minute on interactions

    ['click', 'keydown', 'scroll', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, throttledUpdate, { passive: true });
    });
  }

  /**
   * Throttle function to limit update frequency
   */
  private throttle(func: () => void, limit: number): () => void {
    let inThrottle: boolean;
    return function(this: any) {
      if (!inThrottle) {
        func.apply(this);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Update user's last active timestamp
   */
  async updateActivity(): Promise<void> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return;
      }

      // Throttle updates to avoid too many Firestore writes
      const now = Date.now();
      if (now - this.lastUpdateTime < 60000) { // Don't update more than once per minute
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.warn('User document does not exist, cannot update activity');
        return;
      }

      // Update lastActive timestamp
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });

      this.lastUpdateTime = now;
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  /**
   * Force an immediate activity update (for important actions)
   */
  async forceUpdateActivity(): Promise<void> {
    this.lastUpdateTime = 0; // Reset throttle
    await this.updateActivity();
  }

  /**
   * Cleanup - stop tracking
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

export const userActivityService = new UserActivityService();
export default userActivityService;

