import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { authService } from './authService';
import { DenService } from './denService';

export interface UserPinnedAnnouncement {
  id: string;
  userId: string; // Firebase Auth UID for logged-in users, or cookie-based ID for anonymous
  announcementId: string;
  pinnedAt: Date;
  userType: 'authenticated' | 'anonymous';
}

class UserAnnouncementService {
  private readonly COLLECTION_NAME = 'user-pinned-announcements';
  private readonly COOKIE_NAME = 'pack1703_anonymous_user_id';

  // Generate or get anonymous user ID from cookie
  private getAnonymousUserId(): string {
    let anonymousId = this.getCookie(this.COOKIE_NAME);
    if (!anonymousId) {
      anonymousId = this.generateAnonymousId();
      this.setCookie(this.COOKIE_NAME, anonymousId, 365); // 1 year
    }
    return anonymousId;
  }

  // Get current user ID (authenticated or anonymous)
  private getCurrentUserId(): { userId: string; userType: 'authenticated' | 'anonymous' } {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      return { userId: currentUser.uid, userType: 'authenticated' };
    } else {
      return { userId: this.getAnonymousUserId(), userType: 'anonymous' };
    }
  }

  // Cookie utilities
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private generateAnonymousId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Check if an announcement is pinned by the current user
  async isAnnouncementPinned(announcementId: string): Promise<boolean> {
    try {
      const { userId, userType } = this.getCurrentUserId();
      
      const pinnedRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        pinnedRef,
        where('userId', '==', userId),
        where('announcementId', '==', announcementId),
        where('userType', '==', userType)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if announcement is pinned:', error);
      return false;
    }
  }

  // Pin an announcement for the current user
  async pinAnnouncement(announcementId: string): Promise<void> {
    try {
      const { userId, userType } = this.getCurrentUserId();
      
      // Check if already pinned
      const isPinned = await this.isAnnouncementPinned(announcementId);
      if (isPinned) {
        console.log('Announcement already pinned by user');
        return;
      }

      // Add to user's pinned announcements
      const pinnedRef = collection(db, this.COLLECTION_NAME);
      await addDoc(pinnedRef, {
        userId,
        announcementId,
        userType,
        pinnedAt: Timestamp.now()
      });

      console.log(`Announcement ${announcementId} pinned for user ${userId}`);
    } catch (error) {
      console.error('Error pinning announcement:', error);
      throw error;
    }
  }

  // Unpin an announcement for the current user
  async unpinAnnouncement(announcementId: string): Promise<void> {
    try {
      const { userId, userType } = this.getCurrentUserId();
      
      // Find the pinned announcement document
      const pinnedRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        pinnedRef,
        where('userId', '==', userId),
        where('announcementId', '==', announcementId),
        where('userType', '==', userType)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('Announcement not pinned by user');
        return;
      }

      // Delete the pinned announcement document
      const docToDelete = snapshot.docs[0];
      await deleteDoc(doc(db, this.COLLECTION_NAME, docToDelete.id));

      console.log(`Announcement ${announcementId} unpinned for user ${userId}`);
    } catch (error) {
      console.error('Error unpinning announcement:', error);
      throw error;
    }
  }

  // Toggle pin status for an announcement
  async togglePinAnnouncement(announcementId: string): Promise<boolean> {
    try {
      const isPinned = await this.isAnnouncementPinned(announcementId);
      
      if (isPinned) {
        await this.unpinAnnouncement(announcementId);
        return false; // Now unpinned
      } else {
        await this.pinAnnouncement(announcementId);
        return true; // Now pinned
      }
    } catch (error) {
      console.error('Error toggling pin status:', error);
      throw error;
    }
  }

  // Get all pinned announcement IDs for the current user
  async getUserPinnedAnnouncementIds(): Promise<string[]> {
    try {
      const { userId, userType } = this.getCurrentUserId();
      
      const pinnedRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        pinnedRef,
        where('userId', '==', userId),
        where('userType', '==', userType),
        orderBy('pinnedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().announcementId);
    } catch (error) {
      console.error('Error getting user pinned announcements:', error);
      return [];
    }
  }

  // Get user-specific announcement data with pin status
  async getAnnouncementsWithPinStatus(): Promise<any[]> {
    try {
      // Get all announcements
      const announcementsRef = collection(db, 'announcements');
      const announcementsQuery = query(announcementsRef, orderBy('createdAt', 'desc'), limit(50));
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const allAnnouncements = announcementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get current user
      const currentUser = await authService.getCurrentUser();
      let userDens: string[] = [];
      
      if (currentUser) {
        // Get user's den assignments
        userDens = await DenService.getUserDens(currentUser.uid);
      }

      // Filter announcements based on user's den assignments
      const filteredAnnouncements = allAnnouncements.filter(announcement => {
        // If announcement has no targetDens, show to everyone
        if (!(announcement as any).targetDens || (announcement as any).targetDens.length === 0) {
          return true;
        }
        
        // If user is not logged in or has no den assignments, don't show den-specific announcements
        if (!currentUser || userDens.length === 0) {
          return false;
        }
        
        // Check if user's dens overlap with announcement's target dens
        return userDens.some(userDen => (announcement as any).targetDens.includes(userDen));
      });

      // Get user's pinned announcement IDs
      const pinnedIds = await this.getUserPinnedAnnouncementIds();

      // Add user-specific pin status to each announcement
      return filteredAnnouncements.map(announcement => ({
        ...announcement,
        pinned: pinnedIds.includes(announcement.id)
      }));
    } catch (error) {
      console.error('Error getting announcements with pin status:', error);
      return [];
    }
  }
}

export const userAnnouncementService = new UserAnnouncementService();
