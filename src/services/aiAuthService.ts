import { UserRole, Permission } from './authService';

/**
 * AI Authentication Service
 * 
 * This service manages AI-specific authentication and permissions.
 * The AI has its own dedicated role with specific permissions for automation.
 */

export interface AIUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole.AI_ASSISTANT;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastActivityAt: Date;
}

class AIAuthService {
  private aiUser: AIUser | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAIUser();
  }

  /**
   * Initialize the AI user with appropriate permissions
   */
  private initializeAIUser(): void {
    this.aiUser = {
      uid: 'ai_solyn',
      email: 'ai@pack1703.com',
      displayName: 'Solyn (AI Assistant)',
      role: UserRole.AI_ASSISTANT,
      permissions: [
        // Content Management (Full Access)
        Permission.READ_CONTENT,
        Permission.CREATE_CONTENT,
        Permission.UPDATE_CONTENT,
        Permission.DELETE_CONTENT,
        
        // Event Management (Full Access)
        Permission.EVENT_MANAGEMENT,
        Permission.SCOUT_EVENTS,
        Permission.DEN_EVENTS,
        Permission.FAMILY_EVENTS,
        
        // Location Management (Full Access)
        Permission.LOCATION_MANAGEMENT,
        
        // Announcement Management (Full Access)
        Permission.ANNOUNCEMENT_MANAGEMENT,
        Permission.DEN_ANNOUNCEMENTS,
        
        // Pack Management (Full Access)
        Permission.PACK_MANAGEMENT,
        Permission.ALL_DEN_ACCESS,
        
        // Scout Content (Full Access)
        Permission.SCOUT_CONTENT,
        Permission.DEN_CONTENT,
        
        // Chat (Full Access for AI interactions)
        Permission.CHAT_READ,
        Permission.CHAT_WRITE,
        Permission.CHAT_MANAGEMENT,
        Permission.SCOUT_CHAT,
        Permission.DEN_CHAT_MANAGEMENT,
        
        // System Access (Read Only)
        Permission.SYSTEM_CONFIG,
        
        // Analytics and Monitoring
        Permission.COST_ANALYTICS,
        Permission.COST_ALERTS,
        Permission.COST_MANAGEMENT,
        
        // Financial Management (Read Only for AI)
        Permission.FINANCIAL_MANAGEMENT,
        
        // Fundraising Management (Read Only for AI)
        Permission.FUNDRAISING_MANAGEMENT,
        
        // Family Management (Read Only for AI)
        Permission.FAMILY_MANAGEMENT,
        Permission.FAMILY_RSVP,
        Permission.FAMILY_VOLUNTEER,
        
        // Den Members (Read Only for AI)
        Permission.DEN_MEMBERS
      ],
      isActive: true,
      createdAt: new Date(),
      lastActivityAt: new Date()
    };
    this.isInitialized = true;
  }

  /**
   * Get the AI user
   */
  getAIUser(): AIUser | null {
    if (!this.isInitialized) {
      this.initializeAIUser();
    }
    return this.aiUser;
  }

  /**
   * Check if AI has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    if (!this.aiUser) return false;
    return this.aiUser.permissions.includes(permission);
  }

  /**
   * Check if AI can access a specific collection
   */
  canAccessCollection(collection: string): boolean {
    const allowedCollections = [
      'events',
      'announcements', 
      'locations',
      'resources',
      'packLists',
      'ai-interactions',
      'ai-confirmations',
      'usageTracking',
      'componentAnalytics',
      'analytics',
      'performance_metrics',
      'cost-tracking'
    ];
    
    return allowedCollections.includes(collection);
  }

  /**
   * Check if AI can perform a specific action
   */
  canPerformAction(action: string, resource: string): boolean {
    // AI cannot manage users, tenants, or chat history
    const restrictedActions = ['user_management', 'tenant_management', 'chat_history_management'];
    const restrictedResources = ['users', 'tenants', 'chat-messages', 'chat-users', 'chat-channels'];
    
    if (restrictedActions.includes(action) || restrictedResources.includes(resource)) {
      return false;
    }

    // AI can create, read, update content
    const allowedActions = ['create', 'read', 'update', 'analyze', 'monitor'];
    return allowedActions.includes(action);
  }

  /**
   * Update AI activity timestamp
   */
  updateActivity(): void {
    if (this.aiUser) {
      this.aiUser.lastActivityAt = new Date();
    }
  }

  /**
   * Get AI user context for services
   */
  getAIContext(): { user: AIUser; permissions: Permission[] } {
    if (!this.aiUser) {
      this.initializeAIUser();
    }
    
    return {
      user: this.aiUser!,
      permissions: this.aiUser!.permissions
    };
  }
}

export const aiAuthService = new AIAuthService();
