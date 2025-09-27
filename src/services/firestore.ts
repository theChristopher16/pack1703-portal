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
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
// import configService from './configService';

// Cloud Function calls
export const submitRSVP = httpsCallable(functions, 'submitRSVP');
export const getRSVPCount = httpsCallable(functions, 'getRSVPCount');
export const deleteRSVP = httpsCallable(functions, 'deleteRSVP');
export const getRSVPData = httpsCallable(functions, 'getRSVPData');
export const submitFeedback = httpsCallable(functions, 'submitFeedback');
export const claimVolunteerRole = httpsCallable(functions, 'claimVolunteerRole');
export const generateICSFeed = httpsCallable(functions, 'generateICSFeed');
export const getWeatherData = httpsCallable(functions, 'getWeatherData');



// Helper function to generate IP hash for rate limiting
export const generateIPHash = async (): Promise<string> => {
  try {
    // In production, this would be done server-side
    // For now, we'll use a simple hash of user agent + timestamp
    const data = navigator.userAgent + Date.now().toString();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Fallback to simple hash
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

// Safe Firestore wrapper that throws errors instead of using mock data
const safeFirestoreCall = async <T>(firestoreCall: () => Promise<T>): Promise<T> => {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );
    
    const result = await Promise.race([
      firestoreCall(),
      timeoutPromise
    ]);
    
    return result;
  } catch (error) {
    console.error('Firestore call failed:', error);
    throw error;
  }
};

// Firestore operations
export const firestoreService = {
  // Events
  async getEvents(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('startDate'), where('visibility', '==', 'public'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  async getEvent(eventId: string): Promise<any> {
    return safeFirestoreCall(async () => {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        return { id: eventDoc.id, ...eventDoc.data() };
      }
      throw new Error('Event not found');
    });
  },

  // Locations
  async getLocations(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const locationsRef = collection(db, 'locations');
      const q = query(locationsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  async getLocation(locationId: string): Promise<any> {
    return safeFirestoreCall(async () => {
      const locationRef = doc(db, 'locations', locationId);
      const locationDoc = await getDoc(locationRef);
      if (locationDoc.exists()) {
        return { id: locationDoc.id, ...locationDoc.data() };
      }
      throw new Error('Location not found');
    });
  },

  // Announcements
  async getAnnouncements(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const announcementsRef = collection(db, 'announcements');
      const q = query(announcementsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Seasons
  async getSeasons(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const seasonsRef = collection(db, 'seasons');
      const q = query(seasonsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Lists (packing lists, etc.)
  async getLists(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const listsRef = collection(db, 'lists');
      const snapshot = await getDocs(listsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // Volunteer needs
  async getVolunteerNeeds(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const needsRef = collection(db, 'volunteer-needs');
      const q = query(needsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  // RSVP submissions - Use Cloud Function for enhanced security
  async submitRSVP(rsvpData: any): Promise<any> {
    try {
      const submitRSVPFunction = httpsCallable(functions, 'submitRSVP');
      const result = await submitRSVPFunction(rsvpData);
      return result.data;
    } catch (error) {
      console.error('Failed to submit RSVP via Cloud Function:', error);
      throw error;
    }
  },

  // Delete RSVP - Use Cloud Function for enhanced security
  async deleteRSVP(rsvpId: string): Promise<any> {
    try {
      const deleteRSVPFunction = httpsCallable(functions, 'deleteRSVP');
      const result = await deleteRSVPFunction({ rsvpId });
      return result.data;
    } catch (error) {
      console.error('Failed to delete RSVP via Cloud Function:', error);
      throw error;
    }
  },

  // Get RSVP count for an event
  async getRSVPCount(eventId: string): Promise<number> {
    try {
      const result = await getRSVPCount({ eventId });
      const data = result.data as any;
      return data.success ? data.rsvpCount : 0;
    } catch (error) {
      console.error('Failed to get RSVP count:', error);
      return 0;
    }
  },

  // Delete an RSVP
  async deleteRSVP(rsvpId: string): Promise<any> {
    try {
      const result = await deleteRSVP({ rsvpId });
      return result.data;
    } catch (error) {
      console.error('Failed to delete RSVP:', error);
      throw error;
    }
  },

  async getRSVPData(eventId: string): Promise<any> {
    try {
      const result = await getRSVPData({ eventId });
      return result.data;
    } catch (error) {
      console.error('Failed to get RSVP data:', error);
      throw error;
    }
  },

  // Feedback submissions - Use Cloud Function for enhanced security
  async submitFeedback(feedbackData: any): Promise<any> {
    try {
      const submitFeedbackFunction = httpsCallable(functions, 'submitFeedback');
      const result = await submitFeedbackFunction(feedbackData);
      return result.data;
    } catch (error) {
      console.error('Failed to submit feedback via Cloud Function:', error);
      throw error;
    }
  },

  // Volunteer signups - Use Cloud Function for enhanced security
  async claimVolunteerRole(claimData: any): Promise<any> {
    try {
      const claimVolunteerRoleFunction = httpsCallable(functions, 'claimVolunteerRole');
      const result = await claimVolunteerRoleFunction(claimData);
      return result.data;
    } catch (error) {
      console.error('Failed to claim volunteer role via Cloud Function:', error);
      throw error;
    }
  },

  // AI Content Creation Methods

  // AI Content Creation Methods
  async createEvent(eventData: any): Promise<any> {
    try {
      const eventsRef = collection(db, 'events');
      const docRef = await addDoc(eventsRef, {
        ...eventData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'ai_solyn'
      });
      return { id: docRef.id, ...eventData };
    } catch (error) {
      console.error('Failed to create event in Firestore:', error);
      throw error;
    }
  },

  async createAnnouncement(announcementData: any): Promise<any> {
    try {
      const announcementsRef = collection(db, 'announcements');
      const docRef = await addDoc(announcementsRef, {
        ...announcementData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'ai_solyn'
      });
      return { id: docRef.id, ...announcementData };
    } catch (error) {
      console.error('Failed to create announcement in Firestore:', error);
      throw error;
    }
  },

  async updateAnnouncement(announcementId: string, updateData: any): Promise<void> {
    try {
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Failed to update announcement in Firestore:', error);
      throw error;
    }
  },

  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      const announcementRef = doc(db, 'announcements', announcementId);
      await deleteDoc(announcementRef);
    } catch (error) {
      console.error('Failed to delete announcement in Firestore:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Failed to delete event in Firestore:', error);
      throw error;
    }
  },

  async deleteLocation(locationId: string): Promise<void> {
    try {
      const locationRef = doc(db, 'locations', locationId);
      await deleteDoc(locationRef);
    } catch (error) {
      console.error('Failed to delete location in Firestore:', error);
      throw error;
    }
  },

  async createLocation(locationData: any): Promise<any> {
    try {
      const locationsRef = collection(db, 'locations');
      const docRef = await addDoc(locationsRef, {
        ...locationData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'ai_solyn'
      });
      return { id: docRef.id, ...locationData };
    } catch (error) {
      console.error('Failed to create location in Firestore:', error);
      throw error;
    }
  },

  async createResource(resourceData: any): Promise<any> {
    try {
      const resourcesRef = collection(db, 'resources');
      const docRef = await addDoc(resourcesRef, {
        ...resourceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'ai_solyn'
      });
      return { id: docRef.id, ...resourceData };
    } catch (error) {
      console.error('Failed to create resource in Firestore:', error);
      throw error;
    }
  },

  // User Settings and Account Management
  async getLinkedAccounts(userId: string): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const accountsRef = collection(db, 'users', userId, 'linkedAccounts');
      const snapshot = await getDocs(accountsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },

  async getUserSettings(userId: string): Promise<any> {
    return safeFirestoreCall(async () => {
      const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      }
      return null;
    });
  },

  async updateUserSettings(userId: string, settings: any): Promise<void> {
    return safeFirestoreCall(async () => {
      const settingsRef = doc(db, 'users', userId, 'settings', 'preferences');
      await addDoc(collection(db, 'users', userId, 'settings'), {
        ...settings,
        updatedAt: Timestamp.now()
      });
    });
  },

  async linkAccount(userId: string, provider: string, accountData: any): Promise<void> {
    return safeFirestoreCall(async () => {
      const accountsRef = collection(db, 'users', userId, 'linkedAccounts');
      await addDoc(accountsRef, {
        provider,
        email: accountData.email,
        linkedAt: Timestamp.now(),
        isActive: true,
        ...accountData
      });
    });
  },

  async unlinkAccount(userId: string, provider: string): Promise<void> {
    return safeFirestoreCall(async () => {
      const accountsRef = collection(db, 'users', userId, 'linkedAccounts');
      const q = query(accountsRef, where('provider', '==', provider));
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await addDoc(collection(db, 'users', userId, 'linkedAccounts'), {
          ...doc.data(),
          isActive: false,
          unlinkedAt: Timestamp.now()
        });
      }
    });
  }
};

export default firestoreService;
