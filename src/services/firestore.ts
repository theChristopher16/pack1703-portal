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
import { emailService } from './emailService';
import { Location } from '../types/firestore';
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
// Payment functions
export const createRSVPPayment = httpsCallable(functions, 'createRSVPPayment');
export const completeRSVPPayment = httpsCallable(functions, 'completeRSVPPayment');



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

// Client-side cache for events
let eventsCache: { data: any[]; timestamp: number } | null = null;
const EVENTS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Firestore operations
export const firestoreService = {
  // Events
  async getEvents(): Promise<any[]> {
    // Check cache first
    if (eventsCache && (Date.now() - eventsCache.timestamp) < EVENTS_CACHE_DURATION) {
      console.log('📦 Using cached events data');
      return eventsCache.data;
    }

    return safeFirestoreCall(async () => {
      const eventsRef = collection(db, 'events');
      // Use composite index for better performance: visibility + startDate
      const q = query(
        eventsRef, 
        where('visibility', 'in', ['public', null]), // Filter at database level
        orderBy('startDate')
      );
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Enrich events with location coordinates
      const enrichedEvents = await this.enrichEventsWithLocationData(events);
      
      // Update cache
      eventsCache = { data: enrichedEvents, timestamp: Date.now() };
      console.log('💾 Cached events data with location coordinates');
      
      return enrichedEvents;
    });
  },

  async getEvent(eventId: string): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        return { success: true, event: { id: eventDoc.id, ...eventDoc.data() } };
      }
      return { success: false, error: 'Event not found' };
    } catch (error) {
      console.error('Error getting event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Clear events cache (call when events are updated)
  clearEventsCache(): void {
    eventsCache = null;
    console.log('🗑️ Cleared events cache');
  },

  // Enrich events with location data including coordinates
  async enrichEventsWithLocationData(events: any[]): Promise<any[]> {
    try {
      // Get all unique location IDs from events
      const locationIds = [...new Set(events
        .map(event => event.locationId)
        .filter(id => id && id !== 'RwI4opwHcUx3GKKF7Ten') // Exclude default location
      )];

      if (locationIds.length === 0) {
        console.log('📍 No location IDs to enrich');
        return events;
      }

      // Fetch all locations in batch
      const locationPromises = locationIds.map(async (locationId) => {
        try {
          const locationRef = doc(db, 'locations', locationId);
          const locationDoc = await getDoc(locationRef);
          if (locationDoc.exists()) {
            return { id: locationDoc.id, ...locationDoc.data() };
          }
          return null;
        } catch (error) {
          console.warn(`Failed to fetch location ${locationId}:`, error);
          return null;
        }
      });

      const locations = (await Promise.all(locationPromises)).filter(Boolean);
      console.log(`📍 Fetched ${locations.length} locations for events`);

      // Create a map for quick lookup
      const locationMap = new Map(locations.map(loc => [loc!.id, loc!]));

      // Enrich events with location data
      const enrichedEvents = events.map(event => {
        if (event.locationId && locationMap.has(event.locationId)) {
          const location = locationMap.get(event.locationId) as Location | undefined;
          if (location) {
            return {
              ...event,
              locationName: location.name,
              address: location.address,
              coordinates: location.geo ? { lat: location.geo.lat, lng: location.geo.lng } : undefined
            };
          }
        }
        return event;
      });

      return enrichedEvents;
    } catch (error) {
      console.error('Error enriching events with location data:', error);
      return events; // Return original events if enrichment fails
    }
  },

  // Locations
  async getLocations(): Promise<any[]> {
    return safeFirestoreCall(async () => {
      const locationsRef = collection(db, 'locations');
      // Temporarily remove onleOrder to avoid index issues when no data exists
      const snapshot = await getDocs(locationsRef);
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

  // Update RSVP - Use Cloud Function for enhanced security
  async updateRSVP(rsvpId: string, updateData: any): Promise<any> {
    try {
      const updateRSVPFunction = httpsCallable(functions, 'updateRSVP');
      const result = await updateRSVPFunction({ rsvpId, updateData });
      return result.data;
    } catch (error) {
      console.error('Failed to update RSVP via Cloud Function:', error);
      throw error;
    }
  },

  // Fix USS Stewart location
  async fixUSSStewartLocation(): Promise<any> {
    try {
      const fixLocationFunction = httpsCallable(functions, 'fixUSSStewartLocation');
      const result = await fixLocationFunction({});
      return result.data;
    } catch (error) {
      console.error('Failed to fix USS Stewart location via Cloud Function:', error);
      throw error;
    }
  },

  // Get user's RSVPs
  async getUserRSVPs(): Promise<any> {
    try {
      const getUserRSVPsFunction = httpsCallable(functions, 'getUserRSVPs');
      const result = await getUserRSVPsFunction({});
      return result.data;
    } catch (error) {
      console.error('Failed to get user RSVPs via Cloud Function:', error);
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

  async createAnnouncement(announcementData: any, testMode: boolean = false): Promise<any> {
    try {
      // Use the new cloud function that creates announcement and sends emails in one call
      // This works like the registration system (approveAccountRequest)
      console.log('📧 Creating announcement with emails via Cloud Function...');
      const createAnnouncementWithEmailsFunction = httpsCallable(functions, 'createAnnouncementWithEmails');
      const result = await createAnnouncementWithEmailsFunction({
        announcementData: {
          ...announcementData,
          createdBy: 'ai_solyn',
          testMode: testMode
        },
        testMode
      });
      
      console.log('✅ Announcement created via Cloud Function:', result.data);
      
      // TODO: SMS notifications are currently disabled - coming soon
      // The cloud function handles email sending, SMS will be added later
      
      return result.data;
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
      console.log('🗑️ Firestore: Attempting to delete location with ID:', locationId);
      const locationRef = doc(db, 'locations', locationId);
      await deleteDoc(locationRef);
      console.log('🗑️ Firestore: Successfully deleted location with ID:', locationId);
    } catch (error) {
      console.error('❌ Firestore: Failed to delete location with ID:', locationId, error);
      throw error;
    }
  },

  async createLocation(locationData: any): Promise<any> {
    try {
      const locationsRef = collection(db, 'locations');
      
      // Filter out undefined values to prevent Firestore errors
      const cleanLocationData = Object.fromEntries(
        Object.entries(locationData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(locationsRef, {
        ...cleanLocationData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'ai_solyn'
      });
      return { id: docRef.id, ...cleanLocationData };
    } catch (error) {
      console.error('Failed to create location in Firestore:', error);
      throw error;
    }
  },

  async updateLocation(locationId: string, locationData: any): Promise<void> {
    try {
      const locationRef = doc(db, 'locations', locationId);
      await updateDoc(locationRef, {
        ...locationData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Failed to update location in Firestore:', error);
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
  },

  // Send announcement emails to users (respecting preferences and test mode)
  async sendAnnouncementEmailsViaCloudFunction(announcement: any, testMode: boolean = false): Promise<void> {
    try {
      console.log('📧 Calling Cloud Function sendAnnouncementEmails with:', { announcement, testMode });
      const sendAnnouncementEmailsFunction = httpsCallable(functions, 'sendAnnouncementEmails');
      const result = await sendAnnouncementEmailsFunction({
        announcement,
        testMode
      });
      
      console.log('📧 Cloud Function email result:', result.data);
      
    } catch (error) {
      console.error('❌ Failed to send announcement emails via Cloud Function:', error);
      console.error('❌ Error details:', error);
      throw error;
    }
  },

  async sendAnnouncementEmails(announcement: any, testMode: boolean = false): Promise<void> {
    try {
      // Get users based on announcement targeting
      let targetUsers: any[] = [];
      
      if (announcement.targetDens && announcement.targetDens.length > 0) {
        // Get users for specific dens
        for (const denId of announcement.targetDens) {
          const denUsersQuery = query(
            collection(db, 'users'),
            where('status', '==', 'approved'),
            where('dens', 'array-contains', denId)
          );
          const denUsersSnapshot = await getDocs(denUsersQuery);
          
          denUsersSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            // Avoid duplicates if user is in multiple targeted dens
            if (!targetUsers.find(u => u.id === userDoc.id)) {
              targetUsers.push({ id: userDoc.id, ...userData });
            }
          });
        }
      } else {
        // Get all approved users (no specific targeting)
        const usersQuery = query(
          collection(db, 'users'),
          where('status', '==', 'approved')
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.forEach((userDoc) => {
          targetUsers.push({ id: userDoc.id, ...userDoc.data() });
        });
      }
      
      const emailPromises: Promise<boolean>[] = [];
      const testEmails = ['christopher@smithstation.io', 'welcome-test@smithstation.io'];
      
      targetUsers.forEach((userData) => {
        // Skip if no email
        if (!userData.email) return;
        
        // In test mode, only send to test emails
        if (testMode && !testEmails.includes(userData.email)) {
          console.log(`🧪 Test mode: Skipping ${userData.email}`);
          return;
        }
        
        // Check user email preferences
        const emailEnabled = userData.preferences?.emailNotifications !== false; // Default to true if not set
        
        if (!emailEnabled) {
          console.log(`📧 Email disabled for ${userData.email}, skipping`);
          return;
        }
        
        emailPromises.push(
          emailService.sendAnnouncementEmail(userData.email, announcement)
        );
      });
      
      // Send all emails in parallel
      const results = await Promise.allSettled(emailPromises);
      
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;
      
      const failed = results.length - successful;
      
      const modeText = testMode ? ' (TEST MODE)' : '';
      console.log(`📧 Announcement emails sent${modeText}: ${successful} successful, ${failed} failed`);
      
    } catch (error) {
      console.error('Error sending announcement emails:', error);
      throw error;
    }
  },

  // Send announcement SMS to users (respecting preferences and test mode)
  async sendAnnouncementSMSViaCloudFunction(announcement: any, testMode: boolean = false): Promise<void> {
    try {
      console.log('📱 Calling Cloud Function sendAnnouncementSMS with:', { announcement, testMode });
      const sendAnnouncementSMSFunction = httpsCallable(functions, 'sendAnnouncementSMS');
      const result = await sendAnnouncementSMSFunction({
        announcement,
        testMode
      });
      
      console.log('📱 Cloud Function SMS result:', result.data);
    } catch (error) {
      console.error('❌ Error calling sendAnnouncementSMS Cloud Function:', error);
      console.error('❌ Error details:', error);
      throw error;
    }
  },

  async sendAnnouncementSMS(announcement: any, testMode: boolean = false): Promise<void> {
    try {
      // Import SMS service
      const { smsService } = await import('./smsService');
      
      // Get users based on announcement targeting
      let targetUsers: any[] = [];
      
      if (announcement.targetDens && announcement.targetDens.length > 0) {
        // Get users for specific dens
        for (const denId of announcement.targetDens) {
          const denUsersQuery = query(
            collection(db, 'users'),
            where('status', '==', 'approved'),
            where('dens', 'array-contains', denId)
          );
          const denUsersSnapshot = await getDocs(denUsersQuery);
          
          denUsersSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            // Avoid duplicates if user is in multiple targeted dens
            if (!targetUsers.find(u => u.id === userDoc.id)) {
              targetUsers.push({ id: userDoc.id, ...userData });
            }
          });
        }
      } else {
        // Get all approved users (no specific targeting)
        const usersQuery = query(
          collection(db, 'users'),
          where('status', '==', 'approved')
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.forEach((userDoc) => {
          targetUsers.push({ id: userDoc.id, ...userDoc.data() });
        });
      }
      
      const smsPromises: Promise<any>[] = [];
      const testPhones = ['+15551234567', '+15559876543']; // Test phone numbers
      
      targetUsers.forEach((userData) => {
        // Skip if no phone number
        if (!userData.phone) return;
        
        // In test mode, only send to test phones
        if (testMode && !testPhones.includes(userData.phone)) {
          console.log(`🧪 Test mode: Skipping ${userData.phone}`);
          return;
        }
        
        // Check user SMS preferences
        const smsEnabled = userData.preferences?.smsNotifications === true;
        
        if (!smsEnabled) {
          console.log(`📱 SMS disabled for ${userData.phone}, skipping`);
          return;
        }
        
        // Format phone number
        const formattedPhone = smsService.formatPhoneNumber(userData.phone);
        
        // Validate phone number
        if (!smsService.isValidPhoneNumber(formattedPhone)) {
          console.warn(`📱 Invalid phone number for user ${userData.id}: ${userData.phone}`);
          return;
        }
        
        smsPromises.push(
          smsService.sendAnnouncementSMS(formattedPhone, announcement)
        );
      });
      
      // Send all SMS messages in parallel
      const results = await Promise.allSettled(smsPromises);
      
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success === true
      ).length;
      
      const failed = results.length - successful;
      
      const modeText = testMode ? ' (TEST MODE)' : '';
      console.log(`📱 Announcement SMS sent${modeText}: ${successful} successful, ${failed} failed`);
      
    } catch (error) {
      console.error('Error sending announcement SMS:', error);
      throw error;
    }
  }
};

export default firestoreService;
