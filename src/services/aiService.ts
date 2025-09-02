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

// Main AI Service - Uses Factory Pattern to route to appropriate service
import aiServiceFactory from './aiServiceFactory';
import type { AIResponse, AIContext } from './aiServiceFactory';

// Re-export types for backward compatibility
export type { AIResponse, AIContext, ValidationCheck, FileAttachment } from './aiServiceFactory';

// Main AI Service class that acts as a facade to the factory
class AIService {
  /**
   * Process a query using the appropriate AI service based on user role
   * @param userQuery - The user's query
   * @param context - The AI context including user role
   * @returns AI response from the appropriate service
   */
  async processQuery(userQuery: string, context: AIContext): Promise<AIResponse> {
    return await aiServiceFactory.processQuery(userQuery, context);
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
  async processChatMention(
    message: string, 
    channelId: string, 
    userId: string, 
    userName: string, 
    userDen?: string
  ): Promise<void> {
    await aiServiceFactory.processChatMention(message, channelId, userId, userName, userDen);
  }

  /**
   * Send an AI message using the appropriate service
   * @param channelId - The chat channel ID
   * @param message - The message to send
   * @param isSystemMessage - Whether this is a system message
   * @param userRole - The user role to determine which service to use
   * @returns Promise<void>
   */
  async sendAIMessage(
    channelId: string, 
    message: string, 
    isSystemMessage: boolean = false,
    userRole: 'admin' | 'user' = 'user'
  ): Promise<void> {
    await aiServiceFactory.sendAIMessage(channelId, message, isSystemMessage, userRole);
  }

  /**
   * Get service information for debugging/monitoring
   * @param userRole - The user role
   * @returns Service information
   */
  getServiceInfo(userRole: 'admin' | 'user') {
    return aiServiceFactory.getServiceInfo(userRole);
  }

  /**
   * Get the appropriate AI service directly (for advanced usage)
   * @param userRole - The role of the user ('admin' or 'user')
   * @returns The appropriate AI service instance
   */
  getAIService(userRole: 'admin' | 'user') {
    return aiServiceFactory.getAIService(userRole);
  }
}

// Export singleton instance for backward compatibility
export default new AIService();
