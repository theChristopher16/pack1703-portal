// Admin-specific interfaces and types for CRUD operations

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  role: AdminRole;
  permissions: AdminPermission[];
  lastLogin: Date;
  isActive: boolean;
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
    language?: string;
    timezone?: string;
  };
}

export type AdminRole = 'root' | 'super-admin' | 'content-admin' | 'moderator' | 'parent' | 'viewer';

export type AdminPermission = 
  // Season permissions
  | 'seasons:create' | 'seasons:read' | 'seasons:update' | 'seasons:delete'
  // Event permissions
  | 'events:create' | 'events:read' | 'events:update' | 'events:delete'
  // Location permissions
  | 'locations:create' | 'locations:read' | 'locations:update' | 'locations:delete'
  // Announcement permissions
  | 'announcements:create' | 'announcements:read' | 'announcements:update' | 'announcements:delete'
  // List permissions
  | 'lists:create' | 'lists:read' | 'lists:update' | 'lists:delete'
  // Volunteer need permissions
  | 'volunteer-needs:create' | 'volunteer-needs:read' | 'volunteer-needs:update' | 'volunteer-needs:delete'
  // User management permissions
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  // System permissions
  | 'system:read' | 'system:update' | 'system:delete'
  // Cost management permissions
  | 'cost:read' | 'cost:manage' | 'cost:analytics';

export interface AdminAction {
  id: string;
  userId: string;
  userEmail: string;
  action: AdminActionType;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

export type AdminActionType = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'approve' | 'reject' | 'publish' | 'unpublish'
  | 'archive' | 'restore' | 'export' | 'import';

export type EntityType = 
  | 'season' | 'event' | 'location' | 'announcement'
  | 'list' | 'volunteer-need' | 'user' | 'submission';

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: AdminActionType;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    requestId: string;
  };
  success: boolean;
  errorMessage?: string;
  duration: number; // milliseconds
}

export interface CRUDOperation<T> {
  operation: 'create' | 'read' | 'update' | 'delete';
  entity: T;
  entityId?: string;
  userId: string;
  timestamp: Date;
  metadata: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
  };
}

export interface EntityMetadata {
  id: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  version: number;
  isActive: boolean;
  isArchived: boolean;
  tags: string[];
  notes: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface AdminPermissions {
  userId: string;
  role: AdminRole;
  permissions: AdminPermission[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  isActive: boolean;
}

export interface AdminSession {
  id: string;
  userId: string;
  userEmail: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface AdminDashboardStats {
  totalEvents: number;
  totalLocations: number;
  totalAnnouncements: number;
  totalUsers: number;
  recentActivity: AdminAction[];
  pendingApprovals: number;
  systemHealth: SystemHealthStatus;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  lastChecked: Date;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration: number;
  timestamp: Date;
}

export interface AdminSearchResult<T> {
  entities: T[];
  total: number;
  page: number;
  pageSize: number;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AdminBulkOperation {
  id: string;
  operation: AdminActionType;
  entityType: EntityType;
  entityIds: string[];
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: BulkOperationResult[];
  createdAt: Date;
  completedAt?: Date;
}

export interface BulkOperationResult {
  entityId: string;
  success: boolean;
  errorMessage?: string;
  duration: number;
}

export interface AdminNotification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface AdminSettings {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  isEditable: boolean;
  validationRules?: any;
  updatedAt: Date;
  updatedBy: string;
}

export interface AdminExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'xlsx';
  entityType: EntityType;
  filters?: Record<string, any>;
  fields?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeMetadata?: boolean;
}

export interface AdminImportOptions {
  format: 'csv' | 'json' | 'xlsx';
  entityType: EntityType;
  validationMode: 'strict' | 'lenient';
  conflictResolution: 'skip' | 'overwrite' | 'merge';
  dryRun: boolean;
}

export interface AdminBackupConfig {
  id: string;
  name: string;
  description: string;
  collections: string[];
  schedule: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  isActive: boolean;
  lastBackup?: Date;
  nextBackup: Date;
  storageLocation: string;
  encryptionEnabled: boolean;
}

export interface AdminBackupJob {
  id: string;
  configId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  size?: number;
  fileCount?: number;
  errorMessage?: string;
  metadata: Record<string, any>;
}
