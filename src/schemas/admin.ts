import { z } from 'zod';

// Base validation schemas
export const baseEntitySchema = z.object({
  id: z.string().optional(),
  createdAt: z.date().optional(),
  createdBy: z.string().optional(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional(),
  version: z.number().optional(),
  isActive: z.boolean().default(true),
  isArchived: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// Season schemas
export const createSeasonSchema = z.object({
  name: z.string().min(1, 'Season name is required').max(50, 'Season name too long'),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean().default(false),
}).merge(baseEntitySchema);

export const updateSeasonSchema = createSeasonSchema.partial().extend({
  id: z.string(),
});

export const deleteSeasonSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  archiveInstead: z.boolean().default(false),
});

// Event schemas
export const createEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(100, 'Event title too long'),
  description: z.string().min(1, 'Event description is required').max(1000, 'Event description too long'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  locationId: z.string().min(1, 'Location is required'),
  category: z.string().min(1, 'Category is required'),
  denTags: z.array(z.string()).default([]),
  maxCapacity: z.number().min(1, 'Max capacity must be at least 1').optional(),
  fees: z.number().min(0, 'Fees cannot be negative').optional(),
  contactEmail: z.string().email('Invalid email format').optional(),
  isOvernight: z.boolean().default(false),
  requiresPermission: z.boolean().default(false),
  packingList: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url('Invalid URL'),
    type: z.string().min(1, 'Type is required'),
  })).default([]),
  visibility: z.string().min(1, 'Visibility is required').default('draft'),
  seasonId: z.string().min(1, 'Season is required'),
  isElective: z.boolean().optional(),
  electiveOptions: z.object({
    flexibleDates: z.boolean().optional(),
    noBeltLoop: z.boolean().optional(),
    casualAttendance: z.boolean().optional(),
    familyFriendly: z.boolean().optional(),
    communicationNotes: z.string().optional(),
    leadershipNotes: z.string().optional(),
  }).optional(),
}).merge(baseEntitySchema);

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string(),
});

export const deleteEventSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  archiveInstead: z.boolean().default(false),
});

// Location schemas
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100, 'Location name too long'),
  address: z.string().min(1, 'Address is required').max(200, 'Address too long'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  category: z.string().min(1, 'Category is required'),
  importance: z.string().min(1, 'Importance is required').default('medium'),
  parkingInfo: z.string().optional(),
  gateCode: z.string().optional(),
  isPublicNote: z.boolean().default(false),
  privateNotes: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  accessibility: z.array(z.string()).default([]),
  maxCapacity: z.number().min(1).optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }).optional(),
}).merge(baseEntitySchema);

export const updateLocationSchema = createLocationSchema.partial().extend({
  id: z.string(),
});

export const deleteLocationSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  archiveInstead: z.boolean().default(false),
});

// Announcement schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Announcement title is required').max(100, 'Announcement title too long'),
  content: z.string().min(1, 'Announcement content is required').max(2000, 'Announcement content too long'),
  category: z.string().min(1, 'Category is required').default('general'),
  priority: z.string().min(1, 'Priority is required').default('normal'),
  isPinned: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  targetAudience: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url('Invalid URL'),
    type: z.string().min(1, 'Type is required'),
  })).default([]),
  linkedEventId: z.string().optional(),
  expiresAt: z.date().optional(),
  tags: z.array(z.string()).default([]),
}).merge(baseEntitySchema);

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  id: z.string(),
});

export const deleteAnnouncementSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  archiveInstead: z.boolean().default(false),
});

// List schemas (packing lists, etc.)
export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100, 'List name too long'),
  description: z.string().min(1, 'List description is required').max(500, 'List description too long'),
  type: z.string().min(1, 'Type is required'),
  category: z.string().min(1, 'Category is required'),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    isRequired: z.boolean().default(true),
    quantity: z.number().min(1).default(1),
    category: z.string().optional(),
  })),
  isPublic: z.boolean().default(true),
  linkedEventId: z.string().optional(),
  seasonId: z.string().min(1, 'Season is required'),
}).merge(baseEntitySchema);

export const updateListSchema = createListSchema.partial().extend({
  id: z.string(),
});

export const deleteListSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  archiveInstead: z.boolean().default(false),
});

// Volunteer need schemas
export const createVolunteerNeedSchema = z.object({
  title: z.string().min(1, 'Volunteer need title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  eventId: z.string().min(1, 'Event is required'),
  role: z.string().min(1, 'Role is required'),
  quantityNeeded: z.number().min(1, 'Quantity must be at least 1'),
  quantityClaimed: z.number().min(0).default(0),
  requirements: z.array(z.string()).default([]),
  isUrgent: z.boolean().default(false),
  deadline: z.date().optional(),
  contactInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  compensation: z.string().optional(),
  trainingRequired: z.boolean().default(false),
  trainingDetails: z.string().optional(),
}).merge(baseEntitySchema);

export const updateVolunteerNeedSchema = createVolunteerNeedSchema.partial().extend({
  id: z.string(),
});

export const deleteVolunteerNeedSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  archiveInstead: z.boolean().default(false),
});

// Admin user schemas
export const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  role: z.string().min(1, 'Role is required'),
  permissions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
}).merge(baseEntitySchema);

export const updateAdminUserSchema = createAdminUserSchema.partial().extend({
  id: z.string(),
});

export const deleteAdminUserSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
  archiveInstead: z.boolean().default(false),
});

// Bulk operation schemas
export const bulkOperationSchema = z.object({
  operation: z.string().min(1, 'Operation is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityIds: z.array(z.string()).min(1, 'At least one entity ID is required'),
  options: z.object({
    skipValidation: z.boolean().default(false),
    dryRun: z.boolean().default(false),
    notifyUsers: z.boolean().default(false),
  }).optional(),
});

// Search and filter schemas
export const adminSearchSchema = z.object({
  query: z.string().optional(),
  entityType: z.string().min(1, 'Entity type is required').optional(),
  filters: z.record(z.string(), z.any()).optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.string().min(1, 'Sort order is required').default('desc'),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
});

// Export/Import schemas
export const exportOptionsSchema = z.object({
  format: z.string().min(1, 'Format is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  filters: z.record(z.string(), z.any()).optional(),
  fields: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
  includeMetadata: z.boolean().default(false),
});

export const importOptionsSchema = z.object({
  format: z.string().min(1, 'Format is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  validationMode: z.string().min(1, 'Validation mode is required').default('strict'),
  conflictResolution: z.string().min(1, 'Conflict resolution is required').default('skip'),
  dryRun: z.boolean().default(true),
  notifyOnCompletion: z.boolean().default(false),
});

// Validation result schemas
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
    severity: z.string().min(1, 'Severity is required'),
  })),
  warnings: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
    suggestion: z.string().optional(),
  })),
});

// Admin action schemas
export const adminActionSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string(),
  entityName: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
});

// Audit log schemas
export const auditLogSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string(),
  entityName: z.string(),
  oldValues: z.record(z.string(), z.any()).optional(),
  newValues: z.record(z.string(), z.any()).optional(),
  metadata: z.object({
    ipAddress: z.string(),
    userAgent: z.string(),
    sessionId: z.string(),
    requestId: z.string(),
  }),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  duration: z.number(),
});

// Export all schemas
export const adminSchemas = {
  // Season schemas
  createSeason: createSeasonSchema,
  updateSeason: updateSeasonSchema,
  deleteSeason: deleteSeasonSchema,
  
  // Event schemas
  createEvent: createEventSchema,
  updateEvent: updateEventSchema,
  deleteEvent: deleteEventSchema,
  
  // Location schemas
  createLocation: createLocationSchema,
  updateLocation: updateLocationSchema,
  deleteLocation: deleteLocationSchema,
  
  // Announcement schemas
  createAnnouncement: createAnnouncementSchema,
  updateAnnouncement: updateAnnouncementSchema,
  deleteAnnouncement: deleteAnnouncementSchema,
  
  // List schemas
  createList: createListSchema,
  updateList: updateListSchema,
  deleteList: deleteListSchema,
  
  // Volunteer need schemas
  createVolunteerNeed: createVolunteerNeedSchema,
  updateVolunteerNeed: updateVolunteerNeedSchema,
  deleteVolunteerNeed: deleteVolunteerNeedSchema,
  
  // Admin user schemas
  createAdminUser: createAdminUserSchema,
  updateAdminUser: updateAdminUserSchema,
  deleteAdminUser: deleteAdminUserSchema,
  
  // Operation schemas
  bulkOperation: bulkOperationSchema,
  adminSearch: adminSearchSchema,
  exportOptions: exportOptionsSchema,
  importOptions: importOptionsSchema,
  validationResult: validationResultSchema,
  adminAction: adminActionSchema,
  auditLog: auditLogSchema,
};
