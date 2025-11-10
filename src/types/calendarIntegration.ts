export interface CalendarIntegration {
  id: string;
  userId: string;
  provider: 'apple' | 'google' | 'outlook';
  accountEmail: string;
  displayName: string;
  isConnected: boolean;
  lastSyncAt?: Date;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  calendarsToSync: string[]; // Calendar IDs to sync
  syncEnabled: boolean;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncedCalendarEvent {
  id: string;
  externalEventId: string; // Original event ID from Apple Calendar
  integrationId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  provider: 'apple' | 'google' | 'outlook';
  userId: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppleCalendarConfig {
  username: string; // Apple ID email
  appSpecificPassword: string; // App-specific password for CalDAV
  caldavUrl?: string; // Usually https://caldav.icloud.com (defaults if not provided)
}

// Apple Calendar uses CalDAV protocol
export interface CalDAVCalendar {
  id: string;
  name: string;
  color?: string;
  description?: string;
  isDefault: boolean;
}

