import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';
import {
  CalendarIntegration,
  SyncedCalendarEvent,
  AppleCalendarConfig,
  CalDAVCalendar,
} from '../types/calendarIntegration';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * Apple Calendar Integration Service
 * Uses CalDAV protocol to sync with iCloud Calendar
 * 
 * SETUP REQUIRED:
 * 1. User must create an app-specific password at appleid.apple.com
 * 2. Cloud function handles CalDAV communication (credentials never stored client-side)
 * 3. Events are synced to Firestore for offline access
 */
class AppleCalendarService {
  private readonly INTEGRATIONS_COLLECTION = 'calendarIntegrations';
  private readonly SYNCED_EVENTS_COLLECTION = 'syncedCalendarEvents';

  /**
   * Get user's calendar integrations
   */
  async getIntegrations(): Promise<CalendarIntegration[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, this.INTEGRATIONS_COLLECTION),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastSyncAt: data.lastSyncAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as CalendarIntegration;
    });
  }

  /**
   * Connect Apple Calendar
   * This calls a cloud function to validate credentials and fetch calendars
   */
  async connectAppleCalendar(config: AppleCalendarConfig): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Call cloud function to validate and set up connection
      const connectFunction = httpsCallable(functions, 'connectAppleCalendar');
      const result = await connectFunction({
        username: config.username,
        appSpecificPassword: config.appSpecificPassword,
        caldavUrl: config.caldavUrl || 'https://caldav.icloud.com',
      });

      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Failed to connect Apple Calendar');
      }

      // Save integration to Firestore
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, this.INTEGRATIONS_COLLECTION), {
        userId: user.uid,
        provider: 'apple',
        accountEmail: config.username,
        displayName: data.displayName || config.username,
        isConnected: true,
        syncFrequency: 'hourly',
        calendarsToSync: data.availableCalendars?.map((cal: CalDAVCalendar) => cal.id) || [],
        syncEnabled: true,
        createdAt: now,
        updatedAt: now,
      });

      // Trigger initial sync
      await this.syncCalendar(docRef.id);

      return docRef.id;
    } catch (error: any) {
      console.error('Failed to connect Apple Calendar:', error);
      throw new Error(error.message || 'Failed to connect Apple Calendar');
    }
  }

  /**
   * Disconnect calendar integration
   */
  async disconnectCalendar(integrationId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Delete integration
    await deleteDoc(doc(db, this.INTEGRATIONS_COLLECTION, integrationId));

    // Delete all synced events from this integration
    const q = query(
      collection(db, this.SYNCED_EVENTS_COLLECTION),
      where('userId', '==', user.uid),
      where('integrationId', '==', integrationId)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  /**
   * Sync calendar events from Apple Calendar
   */
  async syncCalendar(integrationId: string): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Call cloud function to fetch events
      const syncFunction = httpsCallable(functions, 'syncAppleCalendar');
      const result = await syncFunction({ integrationId });

      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || 'Failed to sync calendar');
      }

      // Update last sync time
      const integrationRef = doc(db, this.INTEGRATIONS_COLLECTION, integrationId);
      await updateDoc(integrationRef, {
        lastSyncAt: Timestamp.now(),
        errorMessage: null,
      });

      console.log(`Synced ${data.eventCount || 0} events from Apple Calendar`);
    } catch (error: any) {
      console.error('Calendar sync failed:', error);
      
      // Update integration with error
      const integrationRef = doc(db, this.INTEGRATIONS_COLLECTION, integrationId);
      await updateDoc(integrationRef, {
        errorMessage: error.message,
        updatedAt: Timestamp.now(),
      });
      
      throw error;
    }
  }

  /**
   * Get synced calendar events
   */
  async getSyncedEvents(startDate?: Date, endDate?: Date): Promise<SyncedCalendarEvent[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    let q;
    if (startDate && endDate) {
      q = query(
        collection(db, this.SYNCED_EVENTS_COLLECTION),
        where('userId', '==', user.uid),
        where('startTime', '>=', startDate),
        where('startTime', '<=', endDate)
      );
    } else {
      q = query(
        collection(db, this.SYNCED_EVENTS_COLLECTION),
        where('userId', '==', user.uid)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate(),
        endTime: data.endTime?.toDate(),
        lastSyncedAt: data.lastSyncedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as SyncedCalendarEvent;
    });
  }

  /**
   * Toggle sync for an integration
   */
  async toggleSync(integrationId: string, enabled: boolean): Promise<void> {
    const integrationRef = doc(db, this.INTEGRATIONS_COLLECTION, integrationId);
    await updateDoc(integrationRef, {
      syncEnabled: enabled,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Update which calendars to sync
   */
  async updateCalendarsToSync(integrationId: string, calendarIds: string[]): Promise<void> {
    const integrationRef = doc(db, this.INTEGRATIONS_COLLECTION, integrationId);
    await updateDoc(integrationRef, {
      calendarsToSync: calendarIds,
      updatedAt: Timestamp.now(),
    });

    // Trigger re-sync
    await this.syncCalendar(integrationId);
  }
}

const appleCalendarService = new AppleCalendarService();
export default appleCalendarService;

