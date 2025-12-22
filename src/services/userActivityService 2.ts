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
  private authUnsubscribe: (() => void) | null = null;

  constructor() {
    // Listen to auth state changes to start tracking when user logs in
    this.setupAuthListener();
  }

  /**
   * Setup auth state listener to start tracking when user logs in
   */
  private setupAuthListener(): void {
    // Check if user is already authenticated
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      this.startActivityTracking();
    }

    // Listen for auth state changes
    this.authUnsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        console.log('UserActivityService: User authenticated, starting activity tracking');
        this.startActivityTracking();
      } else {
        console.log('UserActivityService: User logged out, stopping activity tracking');
        this.stopActivityTracking();
      }
    });
  }

  /**
   * Start tracking user activity
   */
  private startActivityTracking(): void {
    // Stop any existing tracking
    this.stopActivityTracking();

    // Update immediately
    this.updateActivity();

    // Set up periodic updates
    this.updateTimer = setInterval(() => {
      this.updateActivity();
    }, this.UPDATE_INTERVAL);

    // Update on user interactions (throttled)
    this.setupInteractionTracking();
  }

  /**
   * Stop tracking user activity
   */
  private stopActivityTracking(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
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
        console.log('UserActivityService: No authenticated user, skipping update');
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
        console.warn('UserActivityService: User document does not exist, cannot update activity');
        return;
      }

      // Update lastActive timestamp
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });

      console.log('UserActivityService: Updated lastActive for user', user.uid);
      this.lastUpdateTime = now;
    } catch (error) {
      console.error('UserActivityService: Error updating user activity:', error);
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
    this.stopActivityTracking();
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
  }
}

export const userActivityService = new UserActivityService();
export default userActivityService;

