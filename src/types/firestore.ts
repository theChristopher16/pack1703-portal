// Firestore Data Models for Pack 1703 Families Portal
// Based on the comprehensive requirements from ROADMAP.md

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// SEASON MANAGEMENT
// ============================================================================

export interface Season {
  id: string;
  name: string; // e.g., "2025–2026"
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// EVENTS
// ============================================================================

export type EventCategory = 'pack' | 'den' | 'campout' | 'overnight' | 'service' | 'meeting';
export type EventVisibility = 'public' | 'link-only';

export interface Event {
  id: string;
  seasonId: string; // Reference to /seasons/{seasonId}
  title: string;
  category: EventCategory;
  startDate: Timestamp; // Updated to match Cloud Function data
  endDate: Timestamp;   // Updated to match Cloud Function data
  startTime: string;    // Added time fields from Cloud Function
  endTime: string;      // Added time fields from Cloud Function
  locationId: string; // Reference to /locations/{locationId}
  description: string; // Markdown allowed, sanitize on render
  packingList: string[]; // Keys into /lists or inline strings
  attachments: EventAttachment[];
  rsvpEnabled: boolean;
  capacity: number | null;
  visibility: EventVisibility;
  denTags: string[]; // e.g., ["Wolf", "Bear"]
  currentParticipants: number; // Added from Cloud Function
  createdBy: string; // Added from Cloud Function
  status: string; // Added from Cloud Function
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

export interface EventAttachment {
  name: string;
  url: string;
  type: string; // MIME type
  size?: number; // File size in bytes
}

// ============================================================================
// LOCATIONS
// ============================================================================

export type LocationCategory = 'park' | 'school' | 'church' | 'community center' | 'campground' | 'other';

export interface Location {
  id: string;
  name: string;
  address: string;
  category?: LocationCategory;
  geo?: GeoLocation; // Optional for locations without coordinates
  notesPublic?: string; // Public notes visible to all
  notesPrivate?: string; // Private notes hidden from client
  parking?: ParkingInfo;
  driveTime?: string; // e.g., "15 min from downtown"
  gateCode?: string; // Access code if applicable
  amenities?: string[]; // Available facilities
  specialInstructions?: string; // Special access or usage instructions
  contactInfo?: string; // Contact person or information
  isImportant?: boolean; // Marked as important/favorite location
  operatingHours?: OperatingHours; // Operating hours for the location
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface ParkingInfo {
  imageUrl?: string;
  text?: string;
  instructions?: string;
}

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  specialHours?: SpecialHours[]; // Holiday hours, special events, etc.
  timezone?: string; // e.g., "America/Chicago"
  notes?: string; // Additional notes about hours
}

export interface DayHours {
  open: string; // e.g., "09:00"
  close: string; // e.g., "17:00"
  isClosed?: boolean; // If true, location is closed this day
}

export interface SpecialHours {
  date: string; // e.g., "2024-12-25"
  name: string; // e.g., "Christmas Day"
  hours?: DayHours;
  isClosed?: boolean;
  notes?: string;
}

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export interface Announcement {
  id: string;
  title: string;
  body: string; // Markdown allowed, sanitize on render
  pinned: boolean;
  eventId?: string; // Optional reference to /events/{eventId}
  attachments?: AnnouncementAttachment[];
  targetDens?: string[]; // Array of den IDs this announcement targets (empty = all dens)
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  createdBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AnnouncementAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

// ============================================================================
// PACKING LISTS
// ============================================================================

export interface PackingList {
  id: string;
  title: string;
  items: PackingListItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PackingListItem {
  label: string;
  optional?: boolean;
  category?: string; // e.g., "clothing", "gear", "food"
}

// ============================================================================
// SUBMISSIONS (Write-only via Cloud Functions)
// ============================================================================

export type SubmissionKind = 'rsvp' | 'feedback' | 'question' | 'volunteer';

export interface Submission {
  id: string;
  kind: SubmissionKind;
  payload: SubmissionPayload;
  eventId?: string; // Reference to /events/{eventId} if applicable
  meta: SubmissionMetadata;
}

export interface SubmissionPayload {
  // RSVP specific fields
  familyName?: string;
  attendees?: number;
  email?: string;
  phone?: string;
  comments?: string;
  allergies?: string;
  
  // Feedback specific fields
  category?: 'bug' | 'suggestion' | 'general';
  message?: string;
  
  // Volunteer specific fields
  role?: string;
  quantity?: number;
}

export interface SubmissionMetadata {
  userAgent: string;
  ipHash: string; // Salted hash for rate limiting
  createdAt: Timestamp;
  source: 'web' | 'mobile';
}

// ============================================================================
// VOLUNTEER NEEDS
// ============================================================================

export interface VolunteerNeed {
  id: string;
  eventId: string; // Reference to /events/{eventId}
  role: string;
  needed: number;
  claimed: number;
  description?: string;
  requirements?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// EVENT STATISTICS (Aggregated data for performance)
// ============================================================================

export interface EventStats {
  id: string; // Same as eventId
  eventId: string; // Reference to /events/{eventId}
  rsvpCount: number;
  rsvpByDen: Record<string, number>; // denTag -> count
  volunteerCount: number;
  volunteerByRole: Record<string, number>; // role -> count
  lastUpdated: Timestamp;
}

// ============================================================================
// WEATHER DATA (Cached from Open-Meteo)
// ============================================================================

export interface WeatherData {
  id: string; // Generated from lat,lng,timestamp
  lat: number;
  lng: number;
  timestamp: Timestamp;
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  precipitation: {
    chance: number;
    amount?: number;
  };
  uv: number;
  conditions: string;
  expiresAt: Timestamp; // Cache expiration
}

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

export interface Configuration {
  id: string;
  category: ConfigCategory;
  key: string;
  value: string | number | boolean | string[];
  description: string;
  isEditable: boolean;
  validationRules?: ConfigValidationRules;
  defaultValue?: string | number | boolean | string[];
  updatedAt: Timestamp;
  updatedBy: string;
  createdAt: Timestamp;
  createdBy: string;
}

export type ConfigCategory = 
  | 'contact' 
  | 'email' 
  | 'system' 
  | 'display' 
  | 'security' 
  | 'notifications'
  | 'integrations';

export interface ConfigValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex pattern
  allowedValues?: string[];
  type: 'string' | 'email' | 'url' | 'phone' | 'number' | 'boolean' | 'array';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type FirestoreDocument<T> = T & { id: string };

export type FirestoreCollection<T> = FirestoreDocument<T>[];

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface RSVPFormData {
  familyName: string;
  attendees: number;
  email?: string;
  phone?: string;
  comments?: string;
  allergies?: string;
}

export interface FeedbackFormData {
  category: 'bug' | 'suggestion' | 'general';
  message: string;
  email?: string;
  contactOk: boolean;
}

export interface VolunteerFormData {
  role: string;
  quantity: number;
  notes?: string;
  contactOk: boolean;
}
