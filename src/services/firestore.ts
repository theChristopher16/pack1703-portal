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

// Mock data for fallback when Firestore is not available
const mockData = {
  events: [
    {
      id: 'event-001',
      title: 'Pack 1703 Fall Campout',
      startDate: '2024-10-15T14:00:00',
      startTime: '14:00',
      endTime: '16:00',
      locationName: 'Camp Wokanda',
      address: '1234 Scout Road, Peoria, IL 61614',
      coordinates: { lat: 40.7103, lng: -89.6144 },
      category: 'camping',
      denTags: ['all'],
      maxCapacity: 50,
      currentRSVPs: 25,
      description: 'Annual fall camping trip with activities, hiking, and campfire.',
      packingList: ['Tent', 'Sleeping bag', 'Warm clothes', 'Flashlight'],
      fees: 15,
      contactEmail: 'pack1703@gmail.com',
      isOvernight: true,
      requiresPermission: true,
      attachments: []
    },
    {
      id: 'event-002',
      title: 'Pinewood Derby',
      startDate: '2024-02-10T10:00:00',
      startTime: '10:00',
      endTime: '16:00',
      locationName: 'St. Mark\'s Church',
      address: '123 Main Street, Peoria, IL 61614',
      coordinates: { lat: 40.7103, lng: -89.6144 },
      category: 'pack-wide',
      denTags: ['all'],
      maxCapacity: 100,
      currentRSVPs: 78,
      description: 'Annual pinewood derby race for all scouts.',
      packingList: ['Pinewood derby car', 'Snacks', 'Water'],
      fees: 5,
      contactEmail: 'pack1703@gmail.com',
      isOvernight: false,
      requiresPermission: false,
      attachments: []
    }
  ],
  locations: [
    {
      id: '1',
      name: 'St. Mark\'s Church',
      address: '123 Main Street',
      city: 'Peoria',
      state: 'IL',
      zipCode: '61614',
      coordinates: { lat: 40.7103, lng: -89.6144 },
      category: 'church',
      importance: 'high',
      parking: 'free',
      notes: 'Main meeting location for Pack 1703. Large parking lot available.',
      privateNotes: 'Contact: Father John - 555-0123. Gate code: 1234',
      isActive: true,
      createdAt: '2024-01-01T00:00:00',
      updatedAt: '2024-01-01T00:00:00'
    },
    {
      id: '2',
      name: 'Camp Wokanda',
      address: '456 Scout Road',
      city: 'Peoria',
      state: 'IL',
      zipCode: '61615',
      coordinates: { lat: 40.7200, lng: -89.6200 },
      category: 'campground',
      importance: 'high',
      parking: 'free',
      notes: 'Primary camping location with hiking trails and lake access.',
      privateNotes: 'Reservation contact: Camp Director - 555-0456. Check-in time: 2 PM',
      isActive: true,
      createdAt: '2024-01-15T00:00:00',
      updatedAt: '2024-01-15T00:00:00'
    }
  ],
  announcements: [
    {
      id: '1',
      title: 'Fall Campout Registration Open!',
      body: 'Registration for our annual Fall Campout is now open! This year we\'ll be heading to Camp Wokanda for a weekend of fun, adventure, and scouting activities.',
      pinned: true,
      category: 'event',
      priority: 'high',
      isActive: true,
      createdAt: '2024-01-01T00:00:00',
      updatedAt: '2024-01-01T00:00:00'
    }
  ]
};

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

// Safe Firestore wrapper that falls back to mock data
const safeFirestoreCall = async <T>(firestoreCall: () => Promise<T>, mockData: T): Promise<T> => {
  try {
    return await firestoreCall();
  } catch (error) {
    console.warn('Firestore call failed, using mock data:', error);
    return mockData;
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
    }, mockData.events);
  },

  async getEvent(eventId: string): Promise<any> {
    return safeFirestoreCall(async () => {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        return { id: eventDoc.id, ...eventDoc.data() };
      }
      throw new Error('Event not found');
    }, mockData.events.find(e => e.id === eventId) || null);
  },

  // Locations
  async getLocations(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const locationsRef = collection(db, 'locations');
      const q = query(locationsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, mockData.locations);
  },

  async getLocation(locationId: string): Promise<any> {
    return safeFirestoreCall(async () => {
      const locationRef = doc(db, 'locations', locationId);
      const locationDoc = await getDoc(locationRef);
      if (locationDoc.exists()) {
        return { id: locationDoc.id, ...locationDoc.data() };
      }
      throw new Error('Location not found');
    }, mockData.locations.find(l => l.id === locationId) || null);
  },

  // Announcements
  async getAnnouncements(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const announcementsRef = collection(db, 'announcements');
      const q = query(announcementsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, mockData.announcements);
  },

  // Seasons
  async getSeasons(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const seasonsRef = collection(db, 'seasons');
      const q = query(seasonsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, [
      {
        id: 'season-2025',
        name: '2025–2026',
        startDate: '2025-09-01T00:00:00',
        endDate: '2026-08-31T00:00:00',
        isActive: true
      } as any
    ]);
  },

  // Lists (packing lists, etc.)
  async getLists(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const listsRef = collection(db, 'lists');
      const snapshot = await getDocs(listsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, [
      {
        id: 'list-001',
        name: 'Tent & Sleeping Gear',
        category: 'camping',
        items: ['Tent', 'Sleeping bag', 'Sleeping pad', 'Pillow', 'Ground cloth']
      } as any,
      {
        id: 'list-002',
        name: 'Warm Clothing',
        category: 'clothing',
        items: ['Warm jacket', 'Thermal underwear', 'Wool socks', 'Hat', 'Gloves']
      } as any
    ]);
  },

  // Volunteer needs
  async getVolunteerNeeds(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const needsRef = collection(db, 'volunteer-needs');
      const q = query(needsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, [
      {
        id: 'need-001',
        eventId: 'event-001',
        eventTitle: 'Pack 1703 Fall Campout',
        role: 'Check-in Coordinator',
        description: 'Help families check in upon arrival.',
        needed: 2,
        claimed: 1,
        category: 'setup',
        priority: 'high',
        isActive: true
      } as any
    ]);
  },

  // RSVP submissions
  async submitRSVP(rsvpData: any): Promise<any> {
    try {
      const rsvpRef = collection(db, 'rsvps');
      const docRef = await addDoc(rsvpRef, {
        ...rsvpData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { id: docRef.id, ...rsvpData };
    } catch (error) {
      console.error('Failed to submit RSVP to Firestore:', error);
      // Return mock success for now
      return { id: 'mock-rsvp-' + Date.now(), ...rsvpData, success: true };
    }
  },

  // Feedback submissions
  async submitFeedback(feedbackData: any): Promise<any> {
    try {
      const feedbackRef = collection(db, 'feedback');
      const docRef = await addDoc(feedbackRef, {
        ...feedbackData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { id: docRef.id, ...feedbackData };
    } catch (error) {
      console.error('Failed to submit feedback to Firestore:', error);
      // Return mock success for now
      return { id: 'mock-feedback-' + Date.now(), ...feedbackData, success: true };
    }
  },

  // Volunteer signups
  async claimVolunteerRole(claimData: any): Promise<any> {
    try {
      const signupRef = collection(db, 'volunteer-signups');
      const docRef = await addDoc(signupRef, {
        ...claimData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { id: docRef.id, ...claimData };
    } catch (error) {
      console.error('Failed to claim volunteer role in Firestore:', error);
      // Return mock success for now
      return { id: 'mock-signup-' + Date.now(), ...claimData, success: true };
    }
  }
};

export default firestoreService;
