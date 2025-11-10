/**
 * Cross-Organization Data Synchronization
 * 
 * Enables users to aggregate data from all their organizations into their personal home view.
 * Supports calendar events, RSVPs, tasks, and other shared data.
 */

export type OrgServiceType = 
  | 'calendar' 
  | 'events' 
  | 'rsvp' 
  | 'announcements' 
  | 'documents' 
  | 'gallery' 
  | 'resources'
  | 'fundraising'
  | 'inventory';

export interface UserOrganization {
  organizationId: string;
  organizationName: string;
  organizationType: string; // 'cub_scout', 'boy_scout', 'sports', etc.
  userRole: string;
  joinedAt: Date;
  isActive: boolean;
  enabledServices: OrgServiceType[];
}

export interface UserOrganizationMembership {
  userId: string;
  organizations: UserOrganization[];
  lastUpdated: Date;
}

/**
 * Event RSVP Status from Organizations
 */
export type RSVPStatus = 'going' | 'not_going' | 'maybe' | 'pending' | 'not_responded';

export interface OrgEvent {
  eventId: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isPublic: boolean;
  requiresRSVP: boolean;
  // User's RSVP status for this event
  userRSVPStatus: RSVPStatus;
  rsvpDeadline?: Date;
  // User's specific RSVP details
  userRSVP?: {
    status: 'going' | 'not_going' | 'maybe';
    attendees?: number;
    notes?: string;
    submittedAt: Date;
  };
  // Event metadata
  tags?: string[];
  isRecurring: boolean;
  recurringPattern?: string;
  createdBy: string;
  createdAt: Date;
}

export interface SyncedOrgData {
  userId: string;
  organizationId: string;
  organizationName: string;
  dataType: 'event' | 'announcement' | 'document' | 'resource';
  data: any; // Flexible data structure based on dataType
  syncedAt: Date;
  lastModified: Date;
}

/**
 * Sync Preferences - User controls what data to sync
 */
export interface CrossOrgSyncPreferences {
  userId: string;
  enabled: boolean;
  syncSettings: {
    events: {
      enabled: boolean;
      includeRSVPd: boolean; // Include events user has RSVP'd to
      includePending: boolean; // Include events awaiting RSVP
      includePublic: boolean; // Include public events from orgs
      autoDeclineAfterDeadline: boolean; // Auto-mark as not going after RSVP deadline
    };
    announcements: {
      enabled: boolean;
      includePinned: boolean;
      includeImportant: boolean;
    };
    documents: {
      enabled: boolean;
      autoDownload: boolean;
    };
    resources: {
      enabled: boolean;
    };
  };
  // Organization-specific overrides
  organizationOverrides: {
    [organizationId: string]: {
      enabled: boolean;
      syncServices: OrgServiceType[];
    };
  };
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregated calendar view combining all sources
 */
export interface AggregatedCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  source: 'home' | 'organization' | 'phone';
  sourceId: string; // organizationId, 'home', or integration id
  sourceName: string;
  eventType: 'personal' | 'family' | 'organization' | 'synced';
  
  // RSVP information (if applicable)
  requiresRSVP: boolean;
  rsvpStatus?: RSVPStatus;
  rsvpDeadline?: Date;
  canRSVP: boolean; // Can user still RSVP?
  
  // Actions user can take
  actions: {
    canEdit: boolean;
    canDelete: boolean;
    canRSVP: boolean;
    canViewDetails: boolean;
  };
  
  // Visual styling hints
  color?: string;
  icon?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Sync status and statistics
 */
export interface SyncStatus {
  userId: string;
  isRunning: boolean;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  statistics: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalEventsSynced: number;
    pendingRSVPs: number;
    upcomingEvents: number;
    errors: number;
  };
  recentErrors?: {
    organizationId: string;
    organizationName: string;
    error: string;
    timestamp: Date;
  }[];
}

export const DEFAULT_SYNC_PREFERENCES: Omit<CrossOrgSyncPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  enabled: true,
  syncSettings: {
    events: {
      enabled: true,
      includeRSVPd: true,
      includePending: true,
      includePublic: false, // Off by default to avoid clutter
      autoDeclineAfterDeadline: false,
    },
    announcements: {
      enabled: true,
      includePinned: true,
      includeImportant: true,
    },
    documents: {
      enabled: false, // Off by default for privacy
      autoDownload: false,
    },
    resources: {
      enabled: false,
    },
  },
  organizationOverrides: {},
  syncFrequency: 'hourly',
};

