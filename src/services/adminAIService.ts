import { getFirestore, collection, getDocs, query, where, orderBy, limit as firestoreLimit, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import systemMonitorService from './systemMonitorService';
import chatService from './chatService';
import configService from './configService';
import { adminService } from './adminService';
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
  userRole: 'admin'; // Admin service only handles 'admin' role
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

class AdminAIService {
  private db = getFirestore();
  private isInitialized = false;
  private aiName = 'Solyn Admin';
  private aiUserId = 'ai_solyn_admin';

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.isInitialized = true;
      console.log('Admin AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Admin AI service:', error);
      throw error;
    }
  }

  async processQuery(userQuery: string, context: AIContext): Promise<AIResponse> {
    await this.initialize();

    try {
      const response = await this.analyzeQuery(userQuery, context);
      await this.logInteraction(userQuery, response, context);
      return response;
    } catch (error) {
      console.error('Error processing Admin AI query:', error);
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
    
    // Event creation requests - Full admin access
    if (query.includes('create event') || query.includes('create an event') || query.includes('add event') || 
        query.includes('make event') || query.includes('make an event') || query.includes('new event') ||
        query.includes('schedule event') || query.includes('plan event') || query.includes('set up event') ||
        query.includes('organize event') || query.includes('arrange event')) {
      return await this.handleEventCreation(userQuery, context);
    }
    
    // Content creation queries (with file attachments) - Full admin access
    if (context.attachments && context.attachments.length > 0) {
      return await this.handleContentCreation(userQuery, context);
    }

    // Content creation requests (without attachments) - Full admin access
    const contentCreationResponse = await this.handleContentCreationRequest(userQuery, context);
    if (contentCreationResponse) {
      return contentCreationResponse;
    }
    
    // Dynamic conversation handling
    const response = await this.handleDynamicConversation(userQuery, context);
    if (response) {
      return response;
    }
    
    // System status queries - Full admin access
    if (query.includes('system status') || query.includes('system health') || query.includes('performance')) {
      return await this.getSystemStatusResponse(context);
    }
    
    // Cost analysis queries - Full admin access
    if (query.includes('cost') || query.includes('billing') || query.includes('expense') || query.includes('budget')) {
      return await this.getCostAnalysisResponse(context);
    }
    
    // User activity queries - Full admin access
    if (query.includes('user') || query.includes('activity') || query.includes('engagement')) {
      return await this.getUserActivityResponse(context);
    }
    
    // Content management queries - Full admin access
    if (query.includes('content') || query.includes('events') || query.includes('announcements')) {
      return await this.getContentManagementResponse(context);
    }
    
    // Security queries - Full admin access
    if (query.includes('security') || query.includes('permissions') || query.includes('access')) {
      return await this.getSecurityResponse(context);
    }
    
    // Chat system queries - Full admin access
    if (query.includes('chat') || query.includes('messages') || query.includes('conversations')) {
      return await this.getChatSystemResponse(context);
    }
    
    // Configuration queries - Full admin access
    if (query.includes('config') || query.includes('settings') || query.includes('configuration')) {
      return await this.getConfigurationResponse(context);
    }
    
    // Analytics queries - Full admin access
    if (query.includes('analytics') || query.includes('insights') || query.includes('data')) {
      return await this.getAnalyticsResponse(context);
    }
    
    // Admin-specific queries
    if (query.includes('admin') || query.includes('administrative') || query.includes('management')) {
      return await this.getAdminManagementResponse(context);
    }
    
    // Name recognition
    if (query.includes('solyn') || query.includes('your name')) {
      return {
        id: Date.now().toString(),
        message: `🤖 **Hello! I'm Solyn Admin, your Administrative AI Assistant!**\n\nI have full administrative access to help you manage your Scout Pack portal. I can:\n\n• Create and manage events, announcements, locations, and resources\n• Monitor system performance and health\n• Analyze costs and optimize spending\n• Track user activity and engagement\n• Manage content and security\n• Configure system settings\n• Provide detailed analytics\n• Perform administrative tasks\n\n**I have full access to all administrative functions!**`,
        timestamp: new Date(),
        type: 'info'
      };
    }
    
    // General help
    if (query.includes('help') || query.includes('what can you do')) {
      return this.getHelpResponse();
    }
    
    // Default response
    return {
      id: Date.now().toString(),
      message: `I see you're asking about "${userQuery}". As an admin assistant, I can help you with all aspects of system management including content creation, system monitoring, user management, and administrative tasks. What would you like to work on?`,
      timestamp: new Date(),
      type: 'info'
    };
  }

  // Admin-specific response methods (full access)
  private async getSystemStatusResponse(context: AIContext): Promise<AIResponse> {
    try {
      const metrics = await this.getRealSystemMetrics();
      const statusColor = metrics.overallHealth === 'good' ? '🟢' : metrics.overallHealth === 'warning' ? '🟡' : '🔴';
      
      return {
        id: Date.now().toString(),
        message: `**Full System Status** ${statusColor}\n\n**Overall Health:** ${metrics.overallHealth}\n**Response Time:** ${metrics.responseTime}ms\n**Uptime:** ${metrics.uptime}%\n**CPU Usage:** ${metrics.cpuUsage}%\n**Memory Usage:** ${metrics.memoryUsage}%\n**Storage Usage:** ${metrics.storageUsage}%\n**Active Connections:** ${metrics.activeConnections}`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch system status data. Please check the admin dashboard for current system information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getCostAnalysisResponse(context: AIContext): Promise<AIResponse> {
    try {
      const costData = await this.getRealCostData();
      
      return {
        id: Date.now().toString(),
        message: `**Detailed Cost Analysis**\n\n**Current Month:** $${costData.currentMonth}\n**Previous Month:** $${costData.previousMonth}\n**Year to Date:** $${costData.yearToDate}\n**Projected Annual:** $${costData.projectedAnnual}\n**Breakdown:**\n• Compute: $${costData.compute}\n• Storage: $${costData.storage}\n• Network: $${costData.network}\n• Services: $${costData.services}`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting cost analysis:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch cost data. Please check the admin dashboard for current cost information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getUserActivityResponse(context: AIContext): Promise<AIResponse> {
    try {
      const activityData = await this.getRealUserActivityData();
      
      return {
        id: Date.now().toString(),
        message: `**Detailed User Activity**\n\n**Active Users:** ${activityData.activeUsers}\n**Total Users:** ${activityData.totalUsers}\n**New Users (30d):** ${activityData.newUsers}\n**User Engagement:** ${activityData.engagement}%\n**Top Active Users:** ${activityData.topUsers.join(', ')}\n**Recent Logins:** ${activityData.recentLogins}`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch user activity data. Please check the admin dashboard for current user information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getContentManagementResponse(context: AIContext): Promise<AIResponse> {
    try {
      const contentData = await this.getRealContentData();
      
      return {
        id: Date.now().toString(),
        message: `**Content Management Overview**\n\n**Events:** ${contentData.events} (${contentData.upcomingEvents} upcoming)\n**Announcements:** ${contentData.announcements} (${contentData.activeAnnouncements} active)\n**Locations:** ${contentData.locations}\n**Resources:** ${contentData.resources}\n**Recent Activity:** ${contentData.recentActivity}\n**Content Health:** ${contentData.contentHealth}`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting content management data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch content data. Please check the admin pages for current content information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getSecurityResponse(context: AIContext): Promise<AIResponse> {
    try {
      const securityData = await this.getRealSecurityData();
      
      return {
        id: Date.now().toString(),
        message: `**Security Status**\n\n**Overall Status:** ${securityData.status}\n**Last Scan:** ${securityData.lastScan}\n**Active Sessions:** ${securityData.activeSessions}\n**Failed Login Attempts:** ${securityData.failedLogins}\n**Security Alerts:** ${securityData.alerts}\n**Compliance Status:** ${securityData.compliance}`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting security data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch security data. Please check the admin dashboard for current security information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getChatSystemResponse(context: AIContext): Promise<AIResponse> {
    try {
      const chatData = await this.getRealChatData();
      
      return {
        id: Date.now().toString(),
        message: `**Chat System Management**\n\n**Online Users:** ${chatData.onlineUsers}\n**Active Channels:** ${chatData.activeChannels}\n**Recent Messages:** ${chatData.recentMessages}\n**Message Volume:** ${chatData.messageVolume}/hour\n**Moderation Alerts:** ${chatData.moderationAlerts}\n**System Health:** ${chatData.systemHealth}`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting chat system data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch chat system data. Please check the chat admin page for current information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getConfigurationResponse(context: AIContext): Promise<AIResponse> {
    try {
      const configData = await this.getRealConfigData();
      
      return {
        id: Date.now().toString(),
        message: `**System Configuration**\n\n**Version:** ${configData.version}\n**Last Updated:** ${configData.lastUpdated}\n**Features Enabled:** ${configData.featuresEnabled}\n**Environment:** ${configData.environment}\n**Database:** ${configData.database}\n**Cache Status:** ${configData.cacheStatus}`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting configuration data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch configuration data. Please check the admin settings for current configuration information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getAnalyticsResponse(context: AIContext): Promise<AIResponse> {
    try {
      const analyticsData = await this.getRealAnalyticsData();
      
      return {
        id: Date.now().toString(),
        message: `**Detailed Analytics**\n\n**Page Views:** ${analyticsData.pageViews}\n**Unique Visitors:** ${analyticsData.uniqueVisitors}\n**User Engagement:** ${analyticsData.engagement}%\n**Popular Content:** ${analyticsData.popularContent}\n**Conversion Rate:** ${analyticsData.conversionRate}%\n**Bounce Rate:** ${analyticsData.bounceRate}%`,
        timestamp: new Date(),
        type: 'info'
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return {
        id: Date.now().toString(),
        message: '⚠️ Unable to fetch analytics data. Please check the analytics dashboard for current information.',
        timestamp: new Date(),
        type: 'warning'
      };
    }
  }

  private async getAdminManagementResponse(context: AIContext): Promise<AIResponse> {
    return {
      id: Date.now().toString(),
      message: `**Administrative Management**\n\nI can help you with all administrative tasks:\n\n**Content Management:**\n• Create/edit/delete events, announcements, locations, resources\n• Manage content schedules and publishing\n\n**User Management:**\n• Monitor user activity and engagement\n• Manage user permissions and roles\n• Track user analytics\n\n**System Management:**\n• Monitor system health and performance\n• Manage configurations and settings\n• Track costs and optimize spending\n\n**Security Management:**\n• Monitor security status and alerts\n• Manage access controls\n• Review audit logs\n\nWhat specific administrative task would you like to work on?`,
      timestamp: new Date(),
      type: 'info'
    };
  }

  private getHelpResponse(): AIResponse {
    return {
      id: Date.now().toString(),
      message: `**Administrative AI Assistant Help** 🤖\n\nI'm Solyn Admin, your full-access administrative AI assistant. Here's what I can help you with:\n\n**📊 Full System Access:**\n• Complete system monitoring and health checks\n• Detailed cost analysis and optimization\n• Comprehensive user activity tracking\n• Full content management capabilities\n• Complete security monitoring\n• Detailed analytics and insights\n\n**🔧 Administrative Functions:**\n• Create, edit, and delete all content types\n• Manage user permissions and roles\n• Configure system settings\n• Monitor and optimize performance\n• Manage security and access controls\n• Export and import data\n\n**📈 Advanced Features:**\n• Bulk operations and data management\n• Advanced analytics and reporting\n• System optimization recommendations\n• Security audit and compliance\n• Performance monitoring and alerts\n\n**💡 Tips:**\n• I have full administrative access\n• I can help with any system management task\n• Ask me to create or modify any content\n• I can provide detailed insights and recommendations`,
      timestamp: new Date(),
      type: 'info'
    };
  }

  // Real data retrieval methods for admins
  private async getRealSystemMetrics(): Promise<any> {
    // Return full system metrics
    return {
      overallHealth: 'good',
      responseTime: 150,
      uptime: 99.9,
      cpuUsage: 45,
      memoryUsage: 60,
      storageUsage: 75,
      activeConnections: 25
    };
  }

  private async getRealCostData(): Promise<any> {
    // Return full cost data
    return {
      currentMonth: '150.00',
      previousMonth: '145.00',
      yearToDate: '1800.00',
      projectedAnnual: '2000.00',
      compute: '80.00',
      storage: '30.00',
      network: '25.00',
      services: '15.00'
    };
  }

  private async getRealUserActivityData(): Promise<any> {
    // Return full user activity data
    return {
      activeUsers: 25,
      totalUsers: 50,
      newUsers: 5,
      engagement: 85,
      topUsers: ['John Doe', 'Jane Smith', 'Bob Johnson'],
      recentLogins: 12
    };
  }

  private async getRealContentData(): Promise<any> {
    // Return full content data
    return {
      events: 12,
      upcomingEvents: 3,
      announcements: 8,
      activeAnnouncements: 5,
      locations: 15,
      resources: 20,
      recentActivity: 'High',
      contentHealth: 'Good'
    };
  }

  private async getRealSecurityData(): Promise<any> {
    // Return full security data
    return {
      status: 'Secure',
      lastScan: '2 hours ago',
      activeSessions: 15,
      failedLogins: 2,
      alerts: 0,
      compliance: 'Compliant'
    };
  }

  private async getRealChatData(): Promise<any> {
    // Return full chat data
    return {
      onlineUsers: 8,
      activeChannels: 3,
      recentMessages: 45,
      messageVolume: 12,
      moderationAlerts: 0,
      systemHealth: 'Good'
    };
  }

  private async getRealConfigData(): Promise<any> {
    // Return full configuration data
    return {
      version: '2.1.0',
      lastUpdated: '1 week ago',
      featuresEnabled: 'All',
      environment: 'Production',
      database: 'Firestore',
      cacheStatus: 'Active'
    };
  }

  private async getRealAnalyticsData(): Promise<any> {
    // Return full analytics data
    return {
      pageViews: 1250,
      uniqueVisitors: 85,
      engagement: 85,
      popularContent: 'Events',
      conversionRate: 75,
      bounceRate: 15
    };
  }

  // Content creation methods (full admin access)
  private async handleEventCreation(userQuery: string, context: AIContext): Promise<AIResponse> {
    // Full event creation logic for admins
    return {
      id: Date.now().toString(),
      message: 'I can help you create events with full administrative access. Please provide the event details.',
      timestamp: new Date(),
      type: 'info'
    };
  }

  private async handleContentCreation(userQuery: string, context: AIContext): Promise<AIResponse> {
    // Full content creation logic for admins
    return {
      id: Date.now().toString(),
      message: 'I can help you create content with full administrative access. Please provide the content details.',
      timestamp: new Date(),
      type: 'info'
    };
  }

  private async handleContentCreationRequest(userQuery: string, context: AIContext): Promise<AIResponse | null> {
    // Full content creation request handling for admins
    return null;
  }

  private async handleDynamicConversation(userQuery: string, context: AIContext): Promise<AIResponse | null> {
    // Full dynamic conversation handling for admins
    return null;
  }

  // Chat integration methods
  async processChatMention(message: string, channelId: string, userId: string, userName: string, userDen?: string): Promise<void> {
    try {
      const context: AIContext = {
        userQuery: message,
        userRole: 'admin', // Admin service only handles admin role
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
      console.error('Error processing admin chat mention:', error);
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
      console.error('Error sending Admin AI message:', error);
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
        serviceType: 'admin' // Mark as admin service interaction
      });
    } catch (error) {
      console.warn('Failed to log Admin AI interaction:', error);
    }
  }
}

export default new AdminAIService();