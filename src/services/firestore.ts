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

// Firestore operations
export const firestoreService = {
  // Events
  async getEvents(): Promise<any[]> {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('startDate'), where('visibility', '==', 'public'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getEvent(eventId: string): Promise<any> {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    if (eventDoc.exists()) {
      return { id: eventDoc.id, ...eventDoc.data() };
    }
    throw new Error('Event not found');
  },

  // Locations
  async getLocations(): Promise<any[]> {
    const locationsRef = collection(db, 'locations');
    const q = query(locationsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getLocation(locationId: string): Promise<any> {
    const locationRef = doc(db, 'locations', locationId);
    const locationDoc = await getDoc(locationRef);
    if (locationDoc.exists()) {
      return { id: locationDoc.id, ...locationDoc.data() };
    }
    throw new Error('Location not found');
  },

  // Announcements
  async getAnnouncements(): Promise<any[]> {
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Seasons
  async getSeasons(): Promise<any[]> {
    const seasonsRef = collection(db, 'seasons');
    const q = query(seasonsRef, where('isActive', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Lists (packing lists, etc.)
  async getLists(): Promise<any[]> {
    const listsRef = collection(db, 'lists');
    const snapshot = await getDocs(listsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Volunteer needs
  async getVolunteerNeeds(): Promise<any[]> {
    const needsRef = collection(db, 'volunteer-needs');
    const snapshot = await getDocs(needsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

export default firestoreService;
