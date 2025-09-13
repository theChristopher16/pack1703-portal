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
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { authService } from './authService';

// Types
export interface VolunteerNeed {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  role: string;
  description: string;
  needed: number;
  claimed: number;
  category: 'setup' | 'food' | 'activities' | 'cleanup' | 'transportation' | 'supervision' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isActive: boolean;
  skills?: string[];
  ageRequirement?: string;
  physicalRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerSignup {
  id: string;
  needId: string;
  eventId: string;
  eventTitle: string;
  role: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone?: string;
  volunteerUserId?: string; // Link to user account if logged in
  count: number; // Number of people volunteering
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerSignupData {
  needId: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone?: string;
  count: number;
  notes?: string;
}

class VolunteerService {
  private readonly VOLUNTEER_NEEDS_COLLECTION = 'volunteer-needs';
  private readonly VOLUNTEER_SIGNUPS_COLLECTION = 'volunteer-signups';

  /**
   * Get all active volunteer needs
   */
  async getVolunteerNeeds(): Promise<VolunteerNeed[]> {
    try {
      // Check authentication
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.log('No authenticated user, skipping volunteer needs fetch');
        return [];
      }

      // Check if Firebase Auth user exists
      const firebaseAuth = getAuth();
      if (!firebaseAuth.currentUser) {
        console.log('No Firebase Auth user, skipping volunteer needs fetch');
        return [];
      }

      const needsRef = collection(db, this.VOLUNTEER_NEEDS_COLLECTION);
      const q = query(
        needsRef,
        where('isActive', '==', true),
        orderBy('eventDate', 'asc'),
        orderBy('priority', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerNeed));
    } catch (error) {
      console.error('Error fetching volunteer needs:', error);
      throw new Error('Failed to fetch volunteer needs');
    }
  }

  /**
   * Get volunteer needs for a specific event
   */
  async getVolunteerNeedsForEvent(eventId: string): Promise<VolunteerNeed[]> {
    try {
      const needsRef = collection(db, this.VOLUNTEER_NEEDS_COLLECTION);
      const q = query(
        needsRef,
        where('eventId', '==', eventId),
        where('isActive', '==', true),
        orderBy('priority', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerNeed));
    } catch (error) {
      console.error('Error fetching volunteer needs for event:', error);
      throw new Error('Failed to fetch volunteer needs for event');
    }
  }

  /**
   * Get all volunteer signups
   */
  async getVolunteerSignups(): Promise<VolunteerSignup[]> {
    try {
      // Check authentication
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.log('No authenticated user, skipping volunteer signups fetch');
        return [];
      }

      // Check if Firebase Auth user exists
      const firebaseAuth = getAuth();
      if (!firebaseAuth.currentUser) {
        console.log('No Firebase Auth user, skipping volunteer signups fetch');
        return [];
      }

      const signupsRef = collection(db, this.VOLUNTEER_SIGNUPS_COLLECTION);
      const q = query(signupsRef, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerSignup));
    } catch (error) {
      console.error('Error fetching volunteer signups:', error);
      throw new Error('Failed to fetch volunteer signups');
    }
  }

  /**
   * Get volunteer signups for a specific need
   */
  async getVolunteerSignupsForNeed(needId: string): Promise<VolunteerSignup[]> {
    try {
      const signupsRef = collection(db, this.VOLUNTEER_SIGNUPS_COLLECTION);
      const q = query(
        signupsRef,
        where('needId', '==', needId),
        where('status', '!=', 'cancelled'),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerSignup));
    } catch (error) {
      console.error('Error fetching volunteer signups for need:', error);
      throw new Error('Failed to fetch volunteer signups for need');
    }
  }

  /**
   * Get volunteer signups for the current user
   */
  async getUserVolunteerSignups(userId?: string): Promise<VolunteerSignup[]> {
    try {
      const currentUser = userId || authService.getCurrentUser()?.uid;
      if (!currentUser) {
        return [];
      }

      const signupsRef = collection(db, this.VOLUNTEER_SIGNUPS_COLLECTION);
      const q = query(
        signupsRef,
        where('volunteerUserId', '==', currentUser),
        where('status', '!=', 'cancelled'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerSignup));
    } catch (error) {
      console.error('Error fetching user volunteer signups:', error);
      throw new Error('Failed to fetch user volunteer signups');
    }
  }

  /**
   * Check if user is signed up for a specific volunteer need
   */
  async isUserSignedUpForNeed(needId: string, userId?: string): Promise<VolunteerSignup | null> {
    try {
      const currentUser = userId || authService.getCurrentUser()?.uid;
      if (!currentUser) {
        return null;
      }

      const signupsRef = collection(db, this.VOLUNTEER_SIGNUPS_COLLECTION);
      const q = query(
        signupsRef,
        where('needId', '==', needId),
        where('volunteerUserId', '==', currentUser),
        where('status', '!=', 'cancelled'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as VolunteerSignup;
    } catch (error) {
      console.error('Error checking user signup status:', error);
      return null;
    }
  }

  /**
   * Sign up for a volunteer need
   */
  async signUpForVolunteerNeed(signupData: VolunteerSignupData): Promise<string> {
    try {
      const currentUser = authService.getCurrentUser();
      
      // Get the volunteer need to validate and get additional data
      const needDoc = await getDoc(doc(db, this.VOLUNTEER_NEEDS_COLLECTION, signupData.needId));
      if (!needDoc.exists()) {
        throw new Error('Volunteer need not found');
      }

      const needData = needDoc.data() as VolunteerNeed;
      
      // Check if user is already signed up
      const existingSignup = await this.isUserSignedUpForNeed(signupData.needId);
      if (existingSignup) {
        throw new Error('You are already signed up for this volunteer role');
      }

      // Check if there are still spots available
      if (needData.claimed >= needData.needed) {
        throw new Error('This volunteer role is full');
      }

      // Create the signup
      const signupRef = collection(db, this.VOLUNTEER_SIGNUPS_COLLECTION);
      const newSignup = {
        needId: signupData.needId,
        eventId: needData.eventId,
        eventTitle: needData.eventTitle,
        role: needData.role,
        volunteerName: signupData.volunteerName,
        volunteerEmail: signupData.volunteerEmail,
        volunteerPhone: signupData.volunteerPhone,
        volunteerUserId: currentUser?.uid || null,
        count: signupData.count,
        notes: signupData.notes,
        status: 'pending' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(signupRef, newSignup);

      // Update the claimed count on the volunteer need
      await updateDoc(doc(db, this.VOLUNTEER_NEEDS_COLLECTION, signupData.needId), {
        claimed: needData.claimed + signupData.count,
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error signing up for volunteer need:', error);
      throw error;
    }
  }

  /**
   * Cancel a volunteer signup
   */
  async cancelVolunteerSignup(signupId: string): Promise<void> {
    try {
      const currentUser = authService.getCurrentUser();
      
      // Get the signup to validate ownership and get need data
      const signupDoc = await getDoc(doc(db, this.VOLUNTEER_SIGNUPS_COLLECTION, signupId));
      if (!signupDoc.exists()) {
        throw new Error('Volunteer signup not found');
      }

      const signupData = signupDoc.data() as VolunteerSignup;
      
      // Check if user owns this signup (unless they're an admin)
      if (signupData.volunteerUserId && signupData.volunteerUserId !== currentUser?.uid) {
        const userRole = currentUser?.role;
        if (userRole !== 'admin' && userRole !== 'root') {
          throw new Error('You can only cancel your own volunteer signups');
        }
      }

      // Update signup status
      await updateDoc(doc(db, this.VOLUNTEER_SIGNUPS_COLLECTION, signupId), {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });

      // Update the claimed count on the volunteer need
      const needDoc = await getDoc(doc(db, this.VOLUNTEER_NEEDS_COLLECTION, signupData.needId));
      if (needDoc.exists()) {
        const needData = needDoc.data() as VolunteerNeed;
        await updateDoc(doc(db, this.VOLUNTEER_NEEDS_COLLECTION, signupData.needId), {
          claimed: Math.max(0, needData.claimed - signupData.count),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error cancelling volunteer signup:', error);
      throw error;
    }
  }

  /**
   * Update volunteer signup status (admin only)
   */
  async updateVolunteerSignupStatus(signupId: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void> {
    try {
      await updateDoc(doc(db, this.VOLUNTEER_SIGNUPS_COLLECTION, signupId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating volunteer signup status:', error);
      throw error;
    }
  }

  /**
   * Create a new volunteer need (admin only)
   */
  async createVolunteerNeed(needData: Omit<VolunteerNeed, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const needRef = collection(db, this.VOLUNTEER_NEEDS_COLLECTION);
      const newNeed = {
        ...needData,
        claimed: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(needRef, newNeed);
      return docRef.id;
    } catch (error) {
      console.error('Error creating volunteer need:', error);
      throw error;
    }
  }

  /**
   * Update a volunteer need (admin only)
   */
  async updateVolunteerNeed(needId: string, updates: Partial<VolunteerNeed>): Promise<void> {
    try {
      await updateDoc(doc(db, this.VOLUNTEER_NEEDS_COLLECTION, needId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating volunteer need:', error);
      throw error;
    }
  }

  /**
   * Delete a volunteer need (admin only)
   */
  async deleteVolunteerNeed(needId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.VOLUNTEER_NEEDS_COLLECTION, needId));
    } catch (error) {
      console.error('Error deleting volunteer need:', error);
      throw error;
    }
  }

  /**
   * Listen to volunteer needs changes
   */
  onVolunteerNeedsChange(callback: (needs: VolunteerNeed[]) => void): Unsubscribe {
    const needsRef = collection(db, this.VOLUNTEER_NEEDS_COLLECTION);
    const q = query(
      needsRef,
      where('isActive', '==', true),
      orderBy('eventDate', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const needs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerNeed));
      callback(needs);
    });
  }

  /**
   * Listen to volunteer signups changes
   */
  onVolunteerSignupsChange(callback: (signups: VolunteerSignup[]) => void): Unsubscribe {
    const signupsRef = collection(db, this.VOLUNTEER_SIGNUPS_COLLECTION);
    const q = query(signupsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const signups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerSignup));
      callback(signups);
    });
  }

  /**
   * Listen to user's volunteer signups changes
   */
  onUserVolunteerSignupsChange(userId: string, callback: (signups: VolunteerSignup[]) => void): Unsubscribe {
    const signupsRef = collection(db, this.VOLUNTEER_SIGNUPS_COLLECTION);
    const q = query(
      signupsRef,
      where('volunteerUserId', '==', userId),
      where('status', '!=', 'cancelled'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const signups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as VolunteerSignup));
      callback(signups);
    });
  }
}

export const volunteerService = new VolunteerService();
