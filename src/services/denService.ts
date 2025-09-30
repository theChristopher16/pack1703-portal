import { DEN_TYPES, DEN_INFO, ALL_DENS, INDIVIDUAL_DENS, DenType } from '../constants/dens';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';

export interface DenAssignment {
  userId: string;
  email: string;
  displayName: string;
  primaryDen?: string;
  dens: string[];
  role: string;
}

export interface DenAnnouncementTarget {
  denId: string;
  denName: string;
  userCount: number;
  users: DenAssignment[];
}

export class DenService {
  /**
   * Get all users assigned to specific dens
   */
  static async getUsersByDens(denIds: string[]): Promise<DenAssignment[]> {
    try {
      const usersRef = collection(db, 'users');
      const users: DenAssignment[] = [];
      
      // Get users where dens array contains any of the specified den IDs
      for (const denId of denIds) {
        const denQuery = query(
          usersRef,
          where('dens', 'array-contains', denId)
        );
        const denSnapshot = await getDocs(denQuery);
        
        denSnapshot.forEach(doc => {
          const userData = doc.data();
          // Avoid duplicates if user is in multiple requested dens
          if (!users.find(u => u.userId === doc.id)) {
            users.push({
              userId: doc.id,
              email: userData.email || '',
              displayName: userData.displayName || userData.firstName + ' ' + userData.lastName || 'Unknown',
              primaryDen: userData.den || userData.dens?.[0],
              dens: userData.dens || (userData.den ? [userData.den] : []),
              role: userData.role || 'parent'
            });
          }
        });
      }
      
      return users;
    } catch (error) {
      console.error('Error getting users by dens:', error);
      return [];
    }
  }

  /**
   * Get users for all dens (for announcements to everyone)
   */
  static async getAllUsers(): Promise<DenAssignment[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const users: DenAssignment[] = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          userId: doc.id,
          email: userData.email || '',
          displayName: userData.displayName || userData.firstName + ' ' + userData.lastName || 'Unknown',
          primaryDen: userData.den || userData.dens?.[0],
          dens: userData.dens || (userData.den ? [userData.den] : []),
          role: userData.role || 'parent'
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Get announcement targets for specific dens
   */
  static async getAnnouncementTargets(denIds: string[]): Promise<DenAnnouncementTarget[]> {
    const targets: DenAnnouncementTarget[] = [];
    
    for (const denId of denIds) {
      const users = await this.getUsersByDens([denId]);
      const denInfo = DEN_INFO[denId as DenType];
      
      targets.push({
        denId,
        denName: denInfo?.displayName || denId,
        userCount: users.length,
        users
      });
    }
    
    return targets;
  }

  /**
   * Update user's den assignments
   */
  static async updateUserDens(userId: string, dens: string[]): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        dens: dens,
        den: dens[0] || null, // Set primary den to first in array
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating user dens:', error);
      return false;
    }
  }

  /**
   * Get user's den assignments
   */
  static async getUserDens(userId: string): Promise<string[]> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.dens || (userData.den ? [userData.den] : []);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting user dens:', error);
      return [];
    }
  }

  /**
   * Check if user should see announcement based on target dens
   */
  static async shouldUserSeeAnnouncement(userId: string, targetDens?: string[]): Promise<boolean> {
    // If no target dens specified, show to everyone
    if (!targetDens || targetDens.length === 0) {
      return true;
    }
    
    const userDens = await this.getUserDens(userId);
    
    // Check if user's dens overlap with target dens
    return userDens.some(userDen => targetDens.includes(userDen));
  }

  /**
   * Get available dens for selection
   */
  static getAvailableDens(): Array<{id: string, name: string, emoji: string, color: string}> {
    return ALL_DENS.map(denId => ({
      id: denId,
      name: DEN_INFO[denId as DenType]?.displayName || denId,
      emoji: DEN_INFO[denId as DenType]?.emoji || '🏕️',
      color: DEN_INFO[denId as DenType]?.color || 'gray'
    }));
  }

  /**
   * Check if targetDens represents all dens (pack-wide)
   */
  static isPackWide(targetDens?: string[]): boolean {
    return !targetDens || targetDens.length === 0 || targetDens.length === INDIVIDUAL_DENS.length;
  }

  /**
   * Get display text for targeting
   */
  static getTargetingDisplayText(targetDens?: string[]): string {
    if (this.isPackWide(targetDens)) {
      return 'Pack (All Dens)';
    }
    return targetDens?.map(denId => DEN_INFO[denId as DenType]?.displayName || denId).join(', ') || '';
  }
}
