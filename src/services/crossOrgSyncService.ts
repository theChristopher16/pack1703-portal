import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  orderBy,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import authService from './authService';
import {
  UserOrganization,
  UserOrganizationMembership,
  OrgEvent,
  CrossOrgSyncPreferences,
  SyncStatus,
  AggregatedCalendarEvent,
  RSVPStatus,
  DEFAULT_SYNC_PREFERENCES,
} from '../types/crossOrgSync';

/**
 * Cross-Organization Data Synchronization Service
 * 
 * Discovers user's organizations and aggregates their data into the home view.
 */
class CrossOrgSyncService {
  private readonly MEMBERSHIPS_COLLECTION = 'userOrganizationMemberships';
  private readonly SYNC_PREFS_COLLECTION = 'crossOrgSyncPreferences';
  private readonly SYNC_STATUS_COLLECTION = 'crossOrgSyncStatus';
  private readonly USERS_COLLECTION = 'users';
  private readonly EVENTS_COLLECTION = 'events';
  private readonly RSVPS_COLLECTION = 'rsvps';

  /**
   * Discover all organizations the user is a member of
   */
  async discoverUserOrganizations(): Promise<UserOrganization[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Query crossOrganizationUsers collection to find user's organizations
      const crossOrgQuery = query(
        collection(db, 'crossOrganizationUsers'),
        where('userId', '==', user.uid)
      );
      
      const crossOrgSnapshot = await getDocs(crossOrgQuery);
      const organizations: UserOrganization[] = [];

      for (const docSnapshot of crossOrgSnapshot.docs) {
        const data = docSnapshot.data();
        
        // Get organization details
        const orgDoc = await getDoc(doc(db, 'organizations', data.organizationId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          
          organizations.push({
            organizationId: data.organizationId,
            organizationName: data.organizationName || orgData.name || 'Unknown Organization',
            organizationType: data.organizationType || orgData.orgType || 'general',
            userRole: data.role || 'member',
            joinedAt: data.joinedAt?.toDate() || new Date(),
            isActive: data.isActive !== false,
            // Infer enabled services from organization's enabled components
            enabledServices: this.inferEnabledServices(orgData.enabledComponents || []),
          });
        }
      }

      // Cache the membership data
      if (organizations.length > 0) {
        await this.cacheMembershipData(user.uid, organizations);
      }

      return organizations;
    } catch (error) {
      console.error('Failed to discover user organizations:', error);
      return [];
    }
  }

  /**
   * Get aggregated calendar events from all organizations
   */
  async getAggregatedCalendarEvents(startDate?: Date, endDate?: Date): Promise<AggregatedCalendarEvent[]> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const preferences = await this.getSyncPreferences();
    if (!preferences.enabled || !preferences.syncSettings.events.enabled) {
      return [];
    }

    const organizations = await this.discoverUserOrganizations();
    const events: AggregatedCalendarEvent[] = [];

    // Get events from each organization
    for (const org of organizations) {
      // Check if org sync is enabled
      const orgOverride = preferences.organizationOverrides?.[org.organizationId];
      if (orgOverride && !orgOverride.enabled) {
        continue;
      }

      try {
        const orgEvents = await this.getOrganizationEvents(
          org.organizationId,
          org.organizationName,
          startDate,
          endDate
        );

        // Get user's RSVPs for these events
        const eventsWithRSVP = await this.enrichEventsWithRSVP(orgEvents, user.uid);

        // Filter based on preferences
        const filteredEvents = this.filterEventsByPreferences(eventsWithRSVP, preferences);

        // Convert to aggregated format
        filteredEvents.forEach((event) => {
          events.push(this.convertToAggregatedEvent(event, org));
        });
      } catch (error) {
        console.error(`Failed to get events from ${org.organizationName}:`, error);
      }
    }

    return events;
  }

  /**
   * Get events from a specific organization
   */
  private async getOrganizationEvents(
    organizationId: string,
    organizationName: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OrgEvent[]> {
    let q = query(
      collection(db, this.EVENTS_COLLECTION),
      where('organizationId', '==', organizationId),
      where('isActive', '==', true),
      orderBy('startDate', 'desc'),
      firestoreLimit(50)
    );

    if (startDate) {
      q = query(q, where('startDate', '>=', startDate));
    }
    if (endDate) {
      q = query(q, where('startDate', '<=', endDate));
    }

    const snapshot = await getDocs(q);
    const events: OrgEvent[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        eventId: doc.id,
        organizationId,
        organizationName,
        title: data.title || 'Untitled Event',
        description: data.description,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        location: data.location,
        isPublic: data.isPublic || false,
        requiresRSVP: data.requiresRSVP !== false,
        userRSVPStatus: 'not_responded',
        rsvpDeadline: data.rsvpDeadline?.toDate(),
        tags: data.tags || [],
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return events;
  }

  /**
   * Enrich events with user's RSVP status
   */
  private async enrichEventsWithRSVP(events: OrgEvent[], userId: string): Promise<OrgEvent[]> {
    const enrichedEvents: OrgEvent[] = [];

    for (const event of events) {
      // Query for user's RSVP
      const rsvpQuery = query(
        collection(db, this.RSVPS_COLLECTION),
        where('eventId', '==', event.eventId),
        where('userId', '==', userId),
        firestoreLimit(1)
      );

      const rsvpSnapshot = await getDocs(rsvpQuery);
      
      if (!rsvpSnapshot.empty) {
        const rsvpData = rsvpSnapshot.docs[0].data();
        event.userRSVPStatus = rsvpData.status || 'not_responded';
        event.userRSVP = {
          status: rsvpData.status,
          attendees: rsvpData.attendees,
          notes: rsvpData.notes,
          submittedAt: rsvpData.createdAt?.toDate() || new Date(),
        };
      } else {
        // Check if RSVP deadline has passed
        if (event.rsvpDeadline && event.rsvpDeadline < new Date()) {
          event.userRSVPStatus = 'pending';
        } else {
          event.userRSVPStatus = 'not_responded';
        }
      }

      enrichedEvents.push(event);
    }

    return enrichedEvents;
  }

  /**
   * Filter events based on user's sync preferences
   */
  private filterEventsByPreferences(
    events: OrgEvent[],
    preferences: CrossOrgSyncPreferences
  ): OrgEvent[] {
    const { events: eventPrefs } = preferences.syncSettings;

    return events.filter((event) => {
      // Include RSVP'd events
      if (event.userRSVPStatus === 'going' && eventPrefs.includeRSVPd) {
        return true;
      }

      // Include pending/not responded events
      if (
        (event.userRSVPStatus === 'not_responded' || event.userRSVPStatus === 'pending') &&
        eventPrefs.includePending &&
        event.requiresRSVP
      ) {
        return true;
      }

      // Include public events
      if (event.isPublic && eventPrefs.includePublic) {
        return true;
      }

      return false;
    });
  }

  /**
   * Convert org event to aggregated calendar event
   */
  private convertToAggregatedEvent(
    event: OrgEvent,
    org: UserOrganization
  ): AggregatedCalendarEvent {
    const now = new Date();
    const canRSVP = event.requiresRSVP && 
                    (!event.rsvpDeadline || event.rsvpDeadline > now) &&
                    event.userRSVPStatus === 'not_responded';

    return {
      id: event.eventId,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      source: 'organization',
      sourceId: org.organizationId,
      sourceName: org.organizationName,
      eventType: 'organization',
      requiresRSVP: event.requiresRSVP,
      rsvpStatus: event.userRSVPStatus,
      rsvpDeadline: event.rsvpDeadline,
      canRSVP,
      actions: {
        canEdit: false, // User can't edit org events from home view
        canDelete: false,
        canRSVP: canRSVP,
        canViewDetails: true,
      },
      color: this.getColorForRSVPStatus(event.userRSVPStatus),
      priority: this.getPriorityForEvent(event),
    };
  }

  /**
   * Get sync preferences for current user
   */
  async getSyncPreferences(): Promise<CrossOrgSyncPreferences> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.SYNC_PREFS_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        organizationOverrides: data.organizationOverrides || {}, // Ensure this exists
        lastSyncAt: data.lastSyncAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as CrossOrgSyncPreferences;
    }

    // Return defaults if no preferences exist
    const now = new Date();
    return {
      userId: user.uid,
      ...DEFAULT_SYNC_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Update sync preferences
   */
  async updateSyncPreferences(updates: Partial<CrossOrgSyncPreferences>): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.SYNC_PREFS_COLLECTION, user.uid);
    await setDoc(docRef, {
      ...updates,
      userId: user.uid,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, this.SYNC_STATUS_COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastSyncAt: data.lastSyncAt?.toDate(),
        nextSyncAt: data.nextSyncAt?.toDate(),
        recentErrors: data.recentErrors?.map((e: any) => ({
          ...e,
          timestamp: e.timestamp?.toDate(),
        })),
      } as SyncStatus;
    }

    // Default status
    const orgs = await this.discoverUserOrganizations();
    return {
      userId: user.uid,
      isRunning: false,
      statistics: {
        totalOrganizations: orgs.length,
        activeOrganizations: orgs.filter((o) => o.isActive).length,
        totalEventsSynced: 0,
        pendingRSVPs: 0,
        upcomingEvents: 0,
        errors: 0,
      },
    };
  }

  /**
   * Trigger manual sync
   */
  async triggerSync(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // This would typically call a cloud function to perform the sync
    // For now, we'll just update the sync time
    const docRef = doc(db, this.SYNC_STATUS_COLLECTION, user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      lastSyncAt: Timestamp.now(),
      isRunning: false,
    }, { merge: true });
  }

  /**
   * Helper: Cache membership data
   */
  private async cacheMembershipData(userId: string, organizations: UserOrganization[]): Promise<void> {
    const docRef = doc(db, this.MEMBERSHIPS_COLLECTION, userId);
    await setDoc(docRef, {
      userId,
      organizations: organizations.map((org) => ({
        ...org,
        joinedAt: Timestamp.fromDate(org.joinedAt),
      })),
      lastUpdated: Timestamp.now(),
    });
  }

  /**
   * Helper: Infer enabled services from organization components
   */
  private inferEnabledServices(enabledComponents: string[]): any[] {
    const serviceMap: Record<string, string> = {
      'event-management': 'events',
      'calendar': 'calendar',
      'announcements': 'announcements',
      'gallery': 'gallery',
      'resources': 'resources',
      'fundraising': 'fundraising',
      'inventory': 'inventory',
    };

    return enabledComponents
      .map((component) => serviceMap[component])
      .filter(Boolean);
  }

  /**
   * Helper: Get color for RSVP status
   */
  private getColorForRSVPStatus(status: RSVPStatus): string {
    const colorMap: Record<RSVPStatus, string> = {
      going: '#10b981', // green
      not_going: '#ef4444', // red
      maybe: '#f59e0b', // amber
      pending: '#8b5cf6', // purple
      not_responded: '#6b7280', // gray
    };
    return colorMap[status] || '#6b7280';
  }

  /**
   * Helper: Get priority for event
   */
  private getPriorityForEvent(event: OrgEvent): 'low' | 'medium' | 'high' {
    const now = new Date();
    const daysUntilEvent = Math.ceil((event.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // High priority: RSVP deadline approaching or event within 3 days
    if (event.rsvpDeadline && event.rsvpDeadline.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return 'high';
    }
    if (daysUntilEvent <= 3 && event.userRSVPStatus === 'going') {
      return 'high';
    }

    // Medium priority: RSVP needed or event within week
    if (event.userRSVPStatus === 'not_responded' && event.requiresRSVP) {
      return 'medium';
    }
    if (daysUntilEvent <= 7) {
      return 'medium';
    }

    return 'low';
  }
}

const crossOrgSyncService = new CrossOrgSyncService();
export default crossOrgSyncService;

