import userAIService from './userAIService';
import adminAIService from './adminAIService';

export interface AIResponse {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  data?: any;
  requiresConfirmation?: boolean;
  confirmationData?: {
    action: string;
    entityType: string;
    entityData: any;
    validationChecks: ValidationCheck[];
    resourcesToCreate?: any[];
  };
}

export interface ValidationCheck {
  type: 'location' | 'contact' | 'date' | 'content' | 'duplicate';
  status: 'pending' | 'passed' | 'failed' | 'warning' | 'info';
  message: string;
  data?: any;
}

export interface AIContext {
  userQuery: string;
  userRole: 'admin' | 'user';
  currentPage: string;
  availableData: {
    events: number;
    locations: number;
    announcements: number;
    messages: number;
    users: number;
  };
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  content?: string;
}

class AIServiceFactory {
  private static instance: AIServiceFactory;

  private constructor() {}

  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  /**
   * Get the appropriate AI service based on user role
   * @param userRole - The role of the user ('admin' or 'user')
   * @returns The appropriate AI service instance
   */
  public getAIService(userRole: 'admin' | 'user') {
    switch (userRole) {
      case 'admin':
        return adminAIService;
      case 'user':
        return userAIService;
      default:
        // Default to user service for safety
        console.warn(`Unknown user role: ${userRole}, defaulting to user service`);
        return userAIService;
    }
  }

  /**
   * Process a query using the appropriate AI service based on user role
   * @param userQuery - The user's query
   * @param context - The AI context including user role
   * @returns AI response from the appropriate service
   */
  public async processQuery(userQuery: string, context: AIContext): Promise<AIResponse> {
    const service = this.getAIService(context.userRole);
    return await service.processQuery(userQuery, context);
  }

  /**
   * Process a chat mention using the appropriate AI service based on user role
   * @param message - The chat message
   * @param channelId - The chat channel ID
   * @param userId - The user ID
   * @param userName - The user name
   * @param userDen - The user's den (used to determine role)
   * @returns Promise<void>
   */
  public async processChatMention(
    message: string, 
    channelId: string, 
    userId: string, 
    userName: string, 
    userDen?: string
  ): Promise<void> {
    const userRole = this.determineUserRole(userDen);
    const service = this.getAIService(userRole);
    
    await service.processChatMention(message, channelId, userId, userName, userDen);
  }

  /**
   * Determine user role based on den
   * @param userDen - The user's den
   * @returns 'admin' or 'user'
   */
  private determineUserRole(userDen?: string): 'admin' | 'user' {
    if (!userDen) return 'user';
    
    // Admin roles: pack-leader, cubmaster, and den leaders
    const adminRoles = ['pack-leader', 'cubmaster', 'lion', 'tiger', 'wolf', 'bear', 'webelos', 'arrow-of-light'];
    
    return adminRoles.includes(userDen) ? 'admin' : 'user';
  }

  /**
   * Send an AI message using the appropriate service
   * @param channelId - The chat channel ID
   * @param message - The message to send
   * @param isSystemMessage - Whether this is a system message
   * @param userRole - The user role to determine which service to use
   * @returns Promise<void>
   */
  public async sendAIMessage(
    channelId: string, 
    message: string, 
    isSystemMessage: boolean = false,
    userRole: 'admin' | 'user' = 'user'
  ): Promise<void> {
    const service = this.getAIService(userRole);
    await service.sendAIMessage(channelId, message, isSystemMessage);
  }

  /**
   * Get service information for debugging/monitoring
   * @param userRole - The user role
   * @returns Service information
   */
  public getServiceInfo(userRole: 'admin' | 'user') {
    const service = this.getAIService(userRole);
    return {
      userRole,
      serviceType: userRole === 'admin' ? 'AdminAIService' : 'UserAIService',
      capabilities: userRole === 'admin' ? 'Full administrative access' : 'Limited user access',
      canCreateContent: userRole === 'admin',
      canViewSystemData: true,
      canViewDetailedAnalytics: userRole === 'admin'
    };
  }
}

// Export singleton instance
export default AIServiceFactory.getInstance();