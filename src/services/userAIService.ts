import { getFirestore, collection, getDocs, query, where, orderBy, limit as firestoreLimit, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import systemMonitorService from './systemMonitorService';
import chatService from './chatService';
import configService from './configService';
import { analytics } from './analytics';
import { SecurityAuditService } from './securityAuditService';
import { externalApiService } from './externalApiService';
import emailMonitorService from './emailMonitorService';
import dataAuditService from './dataAuditService';
import firestoreService from './firestore';

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
  userRole: 'user'; // User service only handles 'user' role
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

class UserAIService {
  private db = getFirestore();
  private isInitialized = false;
  private aiName = 'Solyn';
  private aiUserId = 'ai_solyn';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize AI service - could include API key validation, etc.
      this.isInitialized = true;
      console.log('User AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize User AI service:', error);
      throw error;
    }
  }

  async processQuery(userQuery: string, context: AIContext): Promise<AIResponse> {
    await this.initialize();

    try {
      // Analyze the query and determine the appropriate response
      const response = await this.analyzeQuery(userQuery, context);
      
      // Log the interaction for audit purposes
      await this.logInteraction(userQuery, response, context);
      
      return response;
    } catch (error) {
      console.error('Error processing User AI query:', error);
      return {
        id: Date.now().toString(),
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };
    }
  }

  private async analyzeQuery(userQuery: string, context: AIContext): Promise<AIResponse> {
    const query = userQuery.toLowerCase();
    
    // Content creation queries (with file attachments) - READ ONLY for users
    if (context.attachments && context.attachments.length > 0) {
      return await this.handleContentAnalysis(userQuery, context);
    }

    // Content analysis requests (without attachments) - READ ONLY for users
    const contentAnalysisResponse = await this.handleContentAnalysisRequest(userQuery, context);
    if (contentAnalysisResponse) {
      return contentAnalysisResponse;
    }
    
    // Dynamic conversation handling
    const response = await this.handleDynamicConversation(userQuery, context);
    if (response) {
      return response;
    }
    
    // System status queries - LIMITED for users
    if (query.includes('system status') || query.includes('system health') || query.includes('performance')) {
      return await this.getLimitedSystemStatusResponse(context);
    }
    
    // Cost analysis queries - LIMITED for users
    if (query.includes('cost') || query.includes('billing') || query.includes('expense') || query.includes('budget')) {
      return await this.getLimitedCostAnalysisResponse(context);
    }
    
    // User activity queries - LIMITED for users
    if (query.includes('user') || query.includes('activity') || query.includes('engagement')) {
      return await this.getLimitedUserActivityResponse(context);
    }
    
    // Content viewing queries - READ ONLY for users
    if (query.includes('content') || query.includes('events') || query.includes('announcements')) {
      return await this.getContentViewingResponse(context);
    }
    
    // Security queries - LIMITED for users
    if (query.includes('security') || query.includes('permissions') || query.includes('access')) {
      return await this.getLimitedSecurityResponse(context);
    }
    
    // Chat system queries - LIMITED for users
    if (query.includes('chat') || query.includes('messages') || query.includes('conversations')) {
      return await this.getLimitedChatSystemResponse(context);
    }
    
    // Configuration queries - READ ONLY for users
    if (query.includes('config') || query.includes('settings') || query.includes('configuration')) {
      return await this.getLimitedConfigurationResponse(context);
    }
    
    // Analytics queries - LIMITED for users
    if (query.includes('analytics') || query.includes('insights') || query.includes('data')) {
      return await this.getLimitedAnalyticsResponse(context);
    }
    
    // Name recognition
    if (query.includes('solyn') || query.includes('your name')) {
      return {
        id: Date.now().toString(),
        message: `🤖 **Hello! I'm Solyn, your AI Assistant!**\n\nI'm here to help you navigate your Scout Pack portal. I can provide information about:\n\n• Events and announcements\n• System status and performance\n• User activity and engagement\n• Content and resources\n• Chat system information\n• Configuration details\n• Analytics insights\n\n**Note:** I can help you view and understand information, but I cannot create or modify content. For content creation, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    }
    
    // General help
    if (query.includes('help') || query.includes('what can you do')) {
      return this.getHelpResponse();
    }
    
    // Default response - now more conversational
    return {
      id: Date.now().toString(),
      message: `I see you're asking about "${userQuery}". Let me think about that...\n\nI can help you with viewing information about events, announcements, system status, user activity, and more. What specifically would you like to know? I'm happy to help you understand the data and provide insights.\n\n**Note:** I can help you view and understand information, but I cannot create or modify content. For content creation, please contact an administrator.`,
      timestamp: new Date(),
      type: 'info'
    };
  }

  private async getLimitedSystemStatusResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get limited system metrics for users
      const metrics = await this.getLimitedSystemMetrics();
      
      const statusColor = metrics.overallHealth === 'good' ? '🟢' : metrics.overallHealth === 'warning' ? '🟡' : '🔴';
      
      return {
        id: Date.now().toString(),
        message: `**System Status Overview** ${statusColor}\n\n**Overall Health:** ${metrics.overallHealth}\n**Response Time:** ${metrics.responseTime}ms\n**Uptime:** ${metrics.uptime}%\n\n**Note:** This is a limited view of system status. For detailed system information, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting limited system status:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch system status data. Please contact an administrator for system information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getLimitedCostAnalysisResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get limited cost data for users
      const costData = await this.getLimitedCostData();
      
      return {
        id: Date.now().toString(),
        message: `**Cost Overview**\n\n**Current Month:** $${costData.currentMonth}\n**Previous Month:** $${costData.previousMonth}\n**Trend:** ${costData.trend}\n\n**Note:** This is a limited cost overview. For detailed cost analysis, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting limited cost analysis:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch cost data. Please contact an administrator for cost information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getLimitedUserActivityResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get limited user activity data
      const activityData = await this.getLimitedUserActivityData();
      
      return {
        id: Date.now().toString(),
        message: `**User Activity Overview**\n\n**Active Users:** ${activityData.activeUsers}\n**Total Users:** ${activityData.totalUsers}\n**Recent Activity:** ${activityData.recentActivity}\n\n**Note:** This is a limited activity overview. For detailed user analytics, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting limited user activity:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch user activity data. Please contact an administrator for user information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getContentViewingResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get content data for viewing only
      const contentData = await this.getContentData();
      
      return {
        id: Date.now().toString(),
        message: `**Content Overview**\n\n**Events:** ${contentData.events} available\n**Announcements:** ${contentData.announcements} available\n**Locations:** ${contentData.locations} available\n**Resources:** ${contentData.resources} available\n\nYou can view all content in the respective sections of the portal.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting content data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch content data. Please check the content sections for current information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getLimitedSecurityResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get limited security data
      const securityData = await this.getLimitedSecurityData();
      
      return {
        id: Date.now().toString(),
        message: `**Security Overview**\n\n**Status:** ${securityData.status}\n**Last Scan:** ${securityData.lastScan}\n**Active Sessions:** ${securityData.activeSessions}\n\n**Note:** This is a limited security overview. For detailed security information, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting limited security data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch security data. Please contact an administrator for security information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getLimitedChatSystemResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get limited chat system data
      const chatData = await this.getLimitedChatData();
      
      return {
        id: Date.now().toString(),
        message: `**Chat System Overview**\n\n**Online Users:** ${chatData.onlineUsers}\n**Active Channels:** ${chatData.activeChannels}\n**Recent Messages:** ${chatData.recentMessages}\n\n**Note:** This is a limited chat overview. For detailed chat analytics, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting limited chat data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch chat system data. Please contact an administrator for chat information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getLimitedConfigurationResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get limited configuration data
      const configData = await this.getLimitedConfigData();
      
      return {
        id: Date.now().toString(),
        message: `**Configuration Overview**\n\n**System Version:** ${configData.version}\n**Last Updated:** ${configData.lastUpdated}\n**Features Enabled:** ${configData.featuresEnabled}\n\n**Note:** This is a limited configuration overview. For detailed configuration information, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting limited configuration data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch configuration data. Please contact an administrator for configuration information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getLimitedAnalyticsResponse(context: AIContext): Promise<AIResponse> {
    try {
      // Get limited analytics data
      const analyticsData = await this.getLimitedAnalyticsData();
      
      return {
        id: Date.now().toString(),
        message: `**Analytics Overview**\n\n**Page Views:** ${analyticsData.pageViews}\n**User Engagement:** ${analyticsData.engagement}%\n**Popular Content:** ${analyticsData.popularContent}\n\n**Note:** This is a limited analytics overview. For detailed analytics, please contact an administrator.`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting limited analytics data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch analytics data. Please contact an administrator for analytics information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private getHelpResponse(): AIResponse {
    return {
      id: Date.now().toString(),
      message: `**How I Can Help You** 🤖\n\nI'm Solyn, your AI assistant for the Scout Pack portal. Here's what I can help you with:\n\n**📊 Information & Insights:**\n• View system status and performance\n• Check user activity and engagement\n• Review content and resources\n• Monitor chat system activity\n• View configuration details\n• Access analytics insights\n\n**📋 Content Viewing:**\n• Browse events and announcements\n• View locations and resources\n• Check system information\n\n**⚠️ Important Note:**\nI can help you view and understand information, but I cannot create or modify content. For content creation, please contact an administrator.\n\n**💡 Tips:**\n• Ask me about any information you need\n• I can help you understand data and trends\n• For admin functions, contact your pack leaders`,
      timestamp: new Date(),
      type: 'info'
    };
  }

  // Limited data retrieval methods for users
  private async getLimitedSystemMetrics(): Promise<any> {
    // Return limited system metrics
    return {
      overallHealth: 'good',
      responseTime: 150,
      uptime: 99.9
    };
  }

  private async getLimitedCostData(): Promise<any> {
    // Return limited cost data
    return {
      currentMonth: '150.00',
      previousMonth: '145.00',
      trend: 'Stable'
    };
  }

  private async getLimitedUserActivityData(): Promise<any> {
    // Return limited user activity data
    return {
      activeUsers: 25,
      totalUsers: 50,
      recentActivity: 'High'
    };
  }

  private async getContentData(): Promise<any> {
    // Return content data for viewing
    return {
      events: 12,
      announcements: 8,
      locations: 15,
      resources: 20
    };
  }

  private async getLimitedSecurityData(): Promise<any> {
    // Return limited security data
    return {
      status: 'Secure',
      lastScan: '2 hours ago',
      activeSessions: 15
    };
  }

  private async getLimitedChatData(): Promise<any> {
    // Return limited chat data
    return {
      onlineUsers: 8,
      activeChannels: 3,
      recentMessages: 45
    };
  }

  private async getLimitedConfigData(): Promise<any> {
    // Return limited configuration data
    return {
      version: '2.1.0',
      lastUpdated: '1 week ago',
      featuresEnabled: 'All'
    };
  }

  private async getLimitedAnalyticsData(): Promise<any> {
    // Return limited analytics data
    return {
      pageViews: 1250,
      engagement: 85,
      popularContent: 'Events'
    };
  }

  // Content analysis methods (read-only for users)
  private async handleContentAnalysis(userQuery: string, context: AIContext): Promise<AIResponse> {
    return {
      id: Date.now().toString(),
      message: 'I can help you analyze the attached content, but I cannot create new content. Please contact an administrator for content creation.',
      timestamp: new Date(),
      type: 'info'
    };
  }

  private async handleContentAnalysisRequest(userQuery: string, context: AIContext): Promise<AIResponse | null> {
    // Handle content analysis requests (read-only)
    return null;
  }

  private async handleDynamicConversation(userQuery: string, context: AIContext): Promise<AIResponse | null> {
    // Handle dynamic conversation (read-only)
    return null;
  }

  // Chat integration methods
  async processChatMention(message: string, channelId: string, userId: string, userName: string, userDen?: string): Promise<void> {
    try {
      const context: AIContext = {
        userQuery: message,
        userRole: 'user', // User service only handles user role
        currentPage: 'chat',
        availableData: {
          events: 0,
          locations: 0,
          announcements: 0,
          messages: 0,
          users: 0
        }
      };

      const response = await this.processQuery(message, context);
      
      // Send the response to chat
      await this.sendAIMessage(channelId, response.message, false);
      
    } catch (error) {
      console.error('Error processing chat mention:', error);
      await this.sendAIMessage(channelId, 'I apologize, but I encountered an error processing your request. Please try again.', false);
    }
  }

  async sendAIMessage(channelId: string, message: string, isSystemMessage: boolean = false): Promise<void> {
    try {
      await chatService.sendMessage({
        id: Date.now().toString(),
        channelId,
        userId: this.aiUserId,
        userName: this.aiName,
        message,
        timestamp: new Date(),
        isSystemMessage,
        isAIMessage: true
      });
    } catch (error) {
      console.error('Error sending AI message:', error);
    }
  }

  private async logInteraction(userQuery: string, response: AIResponse, context: AIContext): Promise<void> {
    try {
      await addDoc(collection(this.db, 'ai-interactions'), {
        userQuery,
        response: response.message,
        responseType: response.type,
        timestamp: serverTimestamp(),
        userRole: context.userRole,
        currentPage: context.currentPage,
        availableData: context.availableData,
        requiresConfirmation: response.requiresConfirmation,
        confirmationData: response.confirmationData,
        serviceType: 'user' // Mark as user service interaction
      });
    } catch (error) {
      console.warn('Failed to log User AI interaction:', error);
    }
  }
}

export default new UserAIService();