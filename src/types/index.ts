// Export all Firestore data types
export * from './firestore';

// Export validation schemas
export * from './validation';

// Re-export commonly used types for convenience
export type {
  Season,
  Event,
  Location,
  Announcement,
  PackingList,
  Submission,
  VolunteerNeed,
  EventStats,
  WeatherData
} from './firestore';

export type {
  EventCategory,
  EventVisibility,
  SubmissionKind,
  FirestoreDocument,
  FirestoreCollection,
  ApiResponse,
  PaginatedResponse
} from './firestore';

export type {
  RSVPFormData,
  FeedbackFormData,
  VolunteerFormData
} from './firestore';

// Re-export commonly used validation schemas
export {
  rsvpFormSchema,
  feedbackFormSchema,
  volunteerFormSchema,
  eventSchema,
  locationSchema,
  announcementSchema
} from './validation';
