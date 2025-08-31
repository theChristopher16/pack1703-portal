import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/config';
import configService from './configService';

// Cloud Function calls
export const submitRSVP = httpsCallable(functions, 'submitRSVP');
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

  // RSVP submissions
  async submitRSVP(rsvpData: any): Promise<any> {
    const rsvpRef = collection(db, 'rsvps');
    const docRef = await addDoc(rsvpRef, {
      ...rsvpData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...rsvpData };
  },

  // Feedback submissions
  async submitFeedback(feedbackData: any): Promise<any> {
    const feedbackRef = collection(db, 'feedback');
    const docRef = await addDoc(feedbackRef, {
      ...feedbackData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...feedbackData };
  },

  // Volunteer signups
  async claimVolunteerRole(claimData: any): Promise<any> {
    const signupRef = collection(db, 'volunteer-signups');
    const docRef = await addDoc(signupRef, {
      ...claimData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...claimData };
  },

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
  }
};

export default firestoreService;
