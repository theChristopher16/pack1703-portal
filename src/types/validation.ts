import { z } from 'zod';

// ============================================================================
// SECURITY-ENHANCED VALIDATION SCHEMAS
// ============================================================================

// Enhanced string validation with security controls
export const requiredString = z.string()
  .min(1, 'This field is required')
  .max(1000, 'Text too long')
  .refine(val => val.trim().length > 0, 'Cannot be empty')
  .refine(val => !/<[^>]*>/g.test(val), 'HTML tags are not allowed');

export const optionalString = z.string()
  .max(1000, 'Text too long')
  .optional()
  .refine(val => !val || !/<[^>]*>/g.test(val), 'HTML tags are not allowed');

// Enhanced email validation
export const emailString = z.string()
  .email('Please enter a valid email address')
  .max(254, 'Email address too long') // RFC 5321 limit
  .transform(val => val.toLowerCase().trim())
  .optional();

export const requiredEmailString = z.string()
  .email('Please enter a valid email address')
  .max(254, 'Email address too long')
  .transform(val => val.toLowerCase().trim());

// Phone validation with international support
export const phoneString = z.string()
  .regex(/^\+?[\d\s\-().]{7,20}$/, 'Please enter a valid phone number')
  .transform(val => val.replace(/[^\d+]/g, '')) // Strip formatting
  .optional();

// URL validation
export const urlString = z.string()
  .url('Please enter a valid URL')
  .max(2048, 'URL too long')
  .optional();

// Enhanced number validation
export const positiveNumber = z.number()
  .positive('Must be a positive number')
  .max(999999, 'Number too large');

export const positiveInteger = z.number()
  .int('Must be a whole number')
  .positive('Must be a positive number')
  .max(999999, 'Number too large');

export const ageNumber = z.number()
  .int('Age must be a whole number')
  .min(0, 'Age cannot be negative')
  .max(120, 'Please enter a valid age');

// Boolean validation
export const booleanValue = z.boolean();

// Safe text content (for comments, notes, etc.)
export const safeTextContent = z.string()
  .max(2000, 'Text too long (2000 character limit)')
  .transform(val => val.trim())
  .refine(val => !/<script[^>]*>.*?<\/script>/gi.test(val), 'Script tags are not allowed')
  .refine(val => !/javascript:/gi.test(val), 'JavaScript URLs are not allowed')
  .refine(val => !/data:/gi.test(val), 'Data URLs are not allowed')
  .optional();

export const requiredSafeText = z.string()
  .min(1, 'This field is required')
  .max(2000, 'Text too long (2000 character limit)')
  .transform(val => val.trim())
  .refine(val => val.length > 0, 'Cannot be empty after trimming')
  .refine(val => !/<script[^>]*>.*?<\/script>/gi.test(val), 'Script tags are not allowed')
  .refine(val => !/javascript:/gi.test(val), 'JavaScript URLs are not allowed')
  .refine(val => !/data:/gi.test(val), 'Data URLs are not allowed');

// ============================================================================
// SECURITY-ENHANCED FORM VALIDATION SCHEMAS
// ============================================================================

// Attendee validation schema
export const attendeeSchema = z.object({
  name: requiredString,
  age: ageNumber,
  den: z.string().optional(),
  isAdult: booleanValue,
});

// Enhanced RSVP form validation
export const rsvpFormSchema = z.object({
  eventId: requiredString,
  familyName: requiredString,
  email: requiredEmailString,
  phone: phoneString,
  attendees: z.array(attendeeSchema)
    .min(1, 'At least one attendee is required')
    .max(20, 'Too many attendees (maximum 20)'),
  dietaryRestrictions: safeTextContent,
  specialNeeds: safeTextContent,
  notes: safeTextContent,
  // Security metadata (added by system)
  ipHash: z.string().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.date().optional(),
}).refine(data => {
  // Validate total attendee count doesn't exceed reasonable limits
  return data.attendees.length <= 20;
}, 'Too many attendees for a single family');

// Enhanced feedback form validation
export const feedbackFormSchema = z.object({
  category: z.string().min(1, 'Please select a valid category'),
  rating: z.number().min(1, 'Please provide a rating').max(5, 'Rating must be between 1 and 5'),
  title: requiredString,
  message: requiredSafeText,
  contactEmail: emailString,
  contactName: requiredString,
  eventId: z.string().optional(),
  // Security metadata
  ipHash: z.string().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.date().optional(),
});

// Enhanced volunteer form validation  
export const volunteerFormSchema = z.object({
  volunteerNeedId: requiredString,
  volunteerName: requiredString,
  email: emailString,
  phone: phoneString,
  age: z.number().min(1, 'Please provide a valid age'),
  skills: z.array(z.string()).min(1, 'Please select at least one skill'),
  availability: requiredString,
  experience: requiredString,
  specialNeeds: safeTextContent,
  emergencyContact: safeTextContent,
  // Security metadata
  ipHash: z.string().optional(),
  userAgent: z.string().max(500).optional(),
  timestamp: z.date().optional(),
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  ipHash: z.string().min(1, 'IP hash required'),
  endpoint: z.string().min(1, 'Endpoint required'),
  timestamp: z.date(),
  count: positiveInteger,
});

// ============================================================================
// BASIC DATA VALIDATION
// ============================================================================

export const eventSchema = z.object({
  title: requiredString,
  description: requiredString,
  start: z.any(), // Will be Timestamp in practice
  end: z.any(),   // Will be Timestamp in practice
  category: z.string(),
  locationId: requiredString,
  rsvpEnabled: booleanValue,
  capacity: z.number().nullable(),
  visibility: z.string(),
  denTags: z.array(z.string())
});

export const locationSchema = z.object({
  name: requiredString,
  address: requiredString,
  geo: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  notesPublic: optionalString,
  notesPrivate: optionalString
});

export const announcementSchema = z.object({
  title: requiredString,
  body: requiredString,
  pinned: booleanValue,
  eventId: optionalString
});

// All schemas are exported individually above
