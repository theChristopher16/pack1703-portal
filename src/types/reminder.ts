import { Timestamp } from 'firebase/firestore';

// ============================================================================
// REMINDER SYSTEM TYPES
// ============================================================================

export type ReminderType = 
  | 'event_deadline'      // Event registration deadlines
  | 'volunteer_needed'    // Volunteer signup reminders
  | 'payment_due'         // Payment deadlines
  | 'preparation'         // Event preparation reminders
  | 'follow_up'           // General follow-up reminders
  | 'custom';             // Custom admin-defined reminders

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ReminderStatus = 
  | 'pending'      // Scheduled but not sent
  | 'sent'         // Reminder has been sent
  | 'acknowledged' // Recipient has acknowledged
  | 'completed'    // Task has been completed
  | 'cancelled'    // Reminder was cancelled
  | 'failed';      // Failed to send

export type ReminderChannel = 'email' | 'push' | 'sms' | 'chat' | 'in_app';

export type ReminderFrequency = 
  | 'once'         // Send once
  | 'daily'        // Send daily until acknowledged
  | 'weekly'       // Send weekly until acknowledged
  | 'custom';      // Custom schedule

// ============================================================================
// REMINDER INTERFACES
// ============================================================================

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  
  // Recipients
  recipientIds: string[];           // User IDs to send reminders to
  recipientRoles?: string[];        // Roles to send reminders to (e.g., ['den_leader', 'parent'])
  recipientDens?: string[];         // Specific dens to target
  
  // Scheduling
  scheduledFor: Timestamp;          // When to send the reminder
  dueDate?: Timestamp;              // When the task is due
  frequency: ReminderFrequency;     // How often to send
  customSchedule?: string;           // Cron expression for custom frequency
  
  // Channels
  channels: ReminderChannel[];      // How to send the reminder
  
  // Content
  message: string;                  // The reminder message
  actionUrl?: string;               // URL to direct users to
  actionText?: string;              // Text for the action button
  
  // Related entities
  relatedEventId?: string;          // Related event
  relatedLocationId?: string;       // Related location
  relatedAnnouncementId?: string;   // Related announcement
  
  // Metadata
  createdBy: string;                // Admin who created the reminder
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sentAt?: Timestamp;               // When the reminder was sent
  acknowledgedAt?: Timestamp;       // When acknowledged
  completedAt?: Timestamp;          // When completed
  
  // Tracking
  sendAttempts: number;             // Number of send attempts
  lastSendAttempt?: Timestamp;      // Last attempt timestamp
  errorMessage?: string;            // Error if sending failed
  
  // Settings
  allowAcknowledgment: boolean;     // Whether users can acknowledge
  requireConfirmation: boolean;     // Whether confirmation is required
  autoEscalate: boolean;            // Whether to escalate if not acknowledged
  escalationDelay?: number;         // Hours to wait before escalating
}

export interface ReminderTemplate {
  id: string;
  name: string;
  description: string;
  type: ReminderType;
  priority: ReminderPriority;
  frequency: ReminderFrequency;
  channels: ReminderChannel[];
  
  // Template content
  titleTemplate: string;            // Template for title (supports variables)
  messageTemplate: string;           // Template for message (supports variables)
  actionTextTemplate?: string;      // Template for action text
  
  // Variables
  variables: ReminderVariable[];    // Available variables for this template
  
  // Settings
  allowAcknowledgment: boolean;
  requireConfirmation: boolean;
  autoEscalate: boolean;
  escalationDelay?: number;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface ReminderVariable {
  name: string;                     // Variable name (e.g., 'event_title')
  displayName: string;              // Display name (e.g., 'Event Title')
  description: string;              // Description of the variable
  type: 'string' | 'date' | 'number' | 'url' | 'email';
  required: boolean;
  defaultValue?: string;
  validation?: string;              // Regex or validation rule
}

export interface ReminderRecipient {
  userId: string;
  email: string;
  displayName?: string;
  role: string;
  den?: string;
  familyId?: string;
  channels: ReminderChannel[];
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
}

export interface ReminderDelivery {
  id: string;
  reminderId: string;
  recipientId: string;
  channel: ReminderChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface ReminderAcknowledgment {
  id: string;
  reminderId: string;
  userId: string;
  acknowledgedAt: Timestamp;
  response?: string;                // Optional response from user
  completed?: boolean;              // Whether they completed the task
  notes?: string;                   // Additional notes
}

export interface ReminderEscalation {
  id: string;
  reminderId: string;
  escalatedAt: Timestamp;
  escalatedBy: string;              // Admin who escalated
  reason: string;
  newRecipients?: string[];         // Additional recipients
  newPriority?: ReminderPriority;   // New priority level
  notes?: string;
}

// ============================================================================
// REMINDER STATISTICS
// ============================================================================

export interface ReminderStats {
  total: number;
  pending: number;
  sent: number;
  acknowledged: number;
  completed: number;
  failed: number;
  overdue: number;
  
  byPriority: Record<ReminderPriority, number>;
  byType: Record<ReminderType, number>;
  byChannel: Record<ReminderChannel, number>;
  
  averageResponseTime?: number;      // Average time to acknowledgment (hours)
  completionRate?: number;          // Percentage of completed reminders
  escalationRate?: number;          // Percentage of escalated reminders
}

export interface ReminderAnalytics {
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  stats: ReminderStats;
  trends: {
    daily: ReminderStats[];
    weekly: ReminderStats[];
    monthly: ReminderStats[];
  };
  topRecipients: {
    userId: string;
    displayName: string;
    reminderCount: number;
    responseRate: number;
  }[];
  topTemplates: {
    templateId: string;
    templateName: string;
    usageCount: number;
    successRate: number;
  }[];
}

// ============================================================================
// REMINDER CONFIGURATION
// ============================================================================

export interface ReminderConfig {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  isEditable: boolean;
  validationRules?: any;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface ReminderSettings {
  // General settings
  defaultChannels: ReminderChannel[];
  defaultFrequency: ReminderFrequency;
  defaultPriority: ReminderPriority;
  
  // Escalation settings
  enableAutoEscalation: boolean;
  defaultEscalationDelay: number;   // Hours
  escalationRecipients: string[];   // Admin IDs for escalation
  
  // Delivery settings
  maxRetryAttempts: number;
  retryDelay: number;               // Minutes
  batchSize: number;                // Max reminders per batch
  
  // Notification settings
  enableDeliveryNotifications: boolean;
  enableFailureNotifications: boolean;
  enableEscalationNotifications: boolean;
  
  // Time settings
  businessHours: {
    start: string;                  // "09:00"
    end: string;                    // "17:00"
    timezone: string;               // "America/New_York"
  };
  
  // Rate limiting
  maxRemindersPerHour: number;
  maxRemindersPerDay: number;
  maxRemindersPerUser: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ReminderResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ReminderListResponse extends ReminderResponse<Reminder[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    type?: ReminderType;
    priority?: ReminderPriority;
    status?: ReminderStatus;
    recipientId?: string;
    dateRange?: {
      start: Timestamp;
      end: Timestamp;
    };
  };
}

export interface ReminderStatsResponse extends ReminderResponse<ReminderStats> {
  period: {
    start: Timestamp;
    end: Timestamp;
  };
}

export interface ReminderAnalyticsResponse extends ReminderResponse<ReminderAnalytics> {
  generatedAt: Timestamp;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ReminderFilter = {
  type?: ReminderType;
  priority?: ReminderPriority;
  status?: ReminderStatus;
  recipientId?: string;
  createdBy?: string;
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  search?: string;
};

export type ReminderSort = {
  field: 'createdAt' | 'scheduledFor' | 'dueDate' | 'priority' | 'status' | 'title';
  direction: 'asc' | 'desc';
};

export type ReminderBulkAction = {
  action: 'send' | 'cancel' | 'reschedule' | 'escalate' | 'delete';
  reminderIds: string[];
  data?: any;
};