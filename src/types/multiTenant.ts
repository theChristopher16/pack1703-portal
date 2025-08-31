// Multi-Tenant Architecture Types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  organizationCount: number;
  settings: CategorySettings;
}

export interface CategorySettings {
  allowCrossOrganizationCollaboration: boolean;
  requireApprovalForCollaboration: boolean;
  maxOrganizationsPerCategory: number;
  allowedFeatures: string[];
  customFields: Record<string, any>;
}

export interface Organization {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  memberCount: number;
  settings: OrganizationSettings;
  metadata: OrganizationMetadata;
}

export interface OrganizationSettings {
  allowPublicAccess: boolean;
  requireInvitation: boolean;
  allowCrossOrganizationChat: boolean;
  allowCrossOrganizationEvents: boolean;
  allowCrossOrganizationResources: boolean;
  customBranding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    favicon?: string;
  };
  features: {
    events: boolean;
    locations: boolean;
    announcements: boolean;
    resources: boolean;
    chat: boolean;
    analytics: boolean;
    fundraising: boolean;
    finances: boolean;
    volunteer: boolean;
    ai: boolean;
  };
}

export interface OrganizationMetadata {
  type: 'scout_pack' | 'sports_team' | 'community_group' | 'school' | 'church' | 'other';
  size: 'small' | 'medium' | 'large';
  region: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface CrossOrganizationCollaboration {
  id: string;
  sourceOrganizationId: string;
  targetOrganizationId: string;
  type: 'event' | 'resource' | 'chat' | 'fundraising' | 'volunteer';
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  participants: string[];
  settings: CollaborationSettings;
}

export interface CollaborationSettings {
  allowPublicViewing: boolean;
  requireApproval: boolean;
  maxParticipants: number;
  allowChat: boolean;
  allowFileSharing: boolean;
  allowResourceSharing: boolean;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdBy: string;
  createdAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

export interface CrossOrganizationUser {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
  metadata: {
    displayName: string;
    email: string;
    photoURL?: string;
    organizationName: string;
  };
}

// AI Collaboration Types
export interface AICollaborationSession {
  id: string;
  organizationIds: string[];
  participants: string[];
  topic: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  messages: AICollaborationMessage[];
  sharedResources: string[];
  outcomes: AICollaborationOutcome[];
}

export interface AICollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  organizationId: string;
  content: string;
  type: 'text' | 'file' | 'link' | 'ai_response';
  timestamp: Date;
  metadata: {
    displayName: string;
    organizationName: string;
    aiGenerated: boolean;
  };
}

export interface AICollaborationOutcome {
  id: string;
  sessionId: string;
  type: 'event' | 'resource' | 'announcement' | 'decision' | 'action_item';
  title: string;
  description: string;
  assignedTo: string[];
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

// Multi-tenant context types
export interface MultiTenantState {
  currentCategory: Category | null;
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  availableCategories: Category[];
  crossOrganizationCollaborations: CrossOrganizationCollaboration[];
  aiCollaborationSessions: AICollaborationSession[];
  isLoading: boolean;
  error: string | null;
}

export type MultiTenantAction = 
  | { type: 'SET_CURRENT_CATEGORY'; payload: Category | null }
  | { type: 'SET_CURRENT_ORGANIZATION'; payload: Organization | null }
  | { type: 'SET_USER_ORGANIZATIONS'; payload: Organization[] }
  | { type: 'SET_AVAILABLE_CATEGORIES'; payload: Category[] }
  | { type: 'SET_CROSS_ORGANIZATION_COLLABORATIONS'; payload: CrossOrganizationCollaboration[] }
  | { type: 'SET_AI_COLLABORATION_SESSIONS'; payload: AICollaborationSession[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };
