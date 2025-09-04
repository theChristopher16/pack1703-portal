import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// AI Configuration
interface AIConfig {
  accountId: string;
  email: string;
  secretToken: string;
  permissions: string[];
  createdAt: string;
}

// AI Request Helper Class
export class AIAuthService {
  private static instance: AIAuthService;
  private aiConfig: AIConfig | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AIAuthService {
    if (!AIAuthService.instance) {
      AIAuthService.instance = new AIAuthService();
    }
    return AIAuthService.instance;
  }

  // Initialize AI configuration
  async initialize(): Promise<void> {
    try {
      // Try to load AI config from localStorage or config file
      const storedConfig = localStorage.getItem('ai-config');
      if (storedConfig) {
        this.aiConfig = JSON.parse(storedConfig);
        this.isInitialized = true;
        return;
      }

      // If no stored config, try to load from file
      const response = await fetch('/ai-config.json');
      if (response.ok) {
        this.aiConfig = await response.json();
        localStorage.setItem('ai-config', JSON.stringify(this.aiConfig));
        this.isInitialized = true;
        return;
      }

      console.warn('No AI configuration found. AI features will be disabled.');
    } catch (error) {
      console.error('Error initializing AI auth service:', error);
    }
  }

  // Check if AI is available
  isAIAvailable(): boolean {
    return this.isInitialized && this.aiConfig !== null;
  }

  // Get AI configuration
  getAIConfig(): AIConfig | null {
    return this.aiConfig;
  }

  // Make authenticated AI request to cloud function
  async makeAIRequest<T = any>(functionName: string, data: any): Promise<T> {
    if (!this.isAIAvailable()) {
      throw new Error('AI not available - configuration not found');
    }

    try {
      // Create a unique request ID
      const requestId = crypto.randomUUID();
      
      // Use Firebase Functions with AI context in data
      const callableFunction = httpsCallable(functions, functionName);
      
      // Pass the AI context in the data
      const requestData = {
        ...data,
        _aiContext: {
          token: this.aiConfig!.secretToken,
          requestId: requestId,
          accountId: this.aiConfig!.accountId,
          email: this.aiConfig!.email
        }
      };

      const result = await callableFunction(requestData);
      return result.data as T;

    } catch (error) {
      console.error(`AI request to ${functionName} failed:`, error);
      throw error;
    }
  }

  // AI-specific function calls
  async generateContent(type: string, prompt: string, context?: any): Promise<any> {
    return this.makeAIRequest('aiGenerateContent', {
      type,
      prompt,
      context
    });
  }

  async testConnection(): Promise<any> {
    return this.makeAIRequest('testAIConnection', {});
  }

  async executeSystemCommand(command: string): Promise<any> {
    return this.makeAIRequest('systemCommand', { command });
  }

  async createEvent(eventData: any): Promise<any> {
    return this.makeAIRequest('adminCreateEvent', eventData);
  }

  async updateEvent(eventData: any): Promise<any> {
    return this.makeAIRequest('adminUpdateEvent', eventData);
  }

  async deleteEvent(eventId: string): Promise<any> {
    return this.makeAIRequest('adminDeleteEvent', { eventId });
  }

  // Check if current user is AI
  isCurrentUserAI(): boolean {
    // This would be set by the cloud functions when AI authentication is used
    return false; // Default to false for regular users
  }

  // Get AI usage statistics
  async getAIUsageStats(): Promise<any> {
    // This would query the aiUsage collection
    return this.makeAIRequest('getAIUsageStats', {});
  }
}

// Export singleton instance
export const aiAuthService = AIAuthService.getInstance();

// Convenience functions for common AI operations
export const aiService = {
  // Initialize AI service
  initialize: () => aiAuthService.initialize(),
  
  // Check availability
  isAvailable: () => aiAuthService.isAIAvailable(),
  
  // Content generation
  generateContent: (type: string, prompt: string, context?: any) => 
    aiAuthService.generateContent(type, prompt, context),
  
  // System operations
  testConnection: () => aiAuthService.testConnection(),
  executeCommand: (command: string) => aiAuthService.executeSystemCommand(command),
  
  // Event management
  createEvent: (eventData: any) => aiAuthService.createEvent(eventData),
  updateEvent: (eventData: any) => aiAuthService.updateEvent(eventData),
  deleteEvent: (eventId: string) => aiAuthService.deleteEvent(eventId),
  
  // Utility
  getConfig: () => aiAuthService.getAIConfig(),
  getUsageStats: () => aiAuthService.getAIUsageStats()
};