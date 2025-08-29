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
  start: Timestamp;
  end: Timestamp;
  locationId: string; // Reference to /locations/{locationId}
  description: string; // Markdown allowed, sanitize on render
  packingList: string[]; // Keys into /lists or inline strings
  attachments: EventAttachment[];
  rsvpEnabled: boolean;
  capacity: number | null;
  visibility: EventVisibility;
  denTags: string[]; // e.g., ["Wolf", "Bear"]
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
