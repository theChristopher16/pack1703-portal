import { 
  API_KEYS, 
  API_CONFIG, 
  API_STATUS, 
  getApiKey, 
  getApiConfig, 
  getApiStatus, 
  setApiStatus,
  isValidApiKey,
  validateApiKeys,
  estimateApiCosts,
  FEATURE_FLAGS
} from '../config/apiKeys';
import { authService } from './authService';

export interface ApiKeyUsage {
  service: string;
  type: 'ADMIN' | 'USER';
  requests: number;
  cost: number;
  lastUsed: Date;
}

export interface ApiKeyValidation {
  isValid: boolean;
  service: string;
  type: 'ADMIN' | 'USER';
  error?: string;
}

class ApiKeyService {
  private usageHistory: ApiKeyUsage[] = [];

  /**
   * Get API key based on user role and service
   */
  getApiKey(service: string, userRole?: string): string {
    // Determine if user should get admin or user key
    const isAdmin = this.isAdminUser(userRole);
    const keyType = isAdmin ? 'ADMIN' : 'USER';
    
    return getApiKey(keyType, service);
  }

  /**
   * Get API configuration based on user role and service
   */
  getApiConfig(service: string, userRole?: string) {
    const isAdmin = this.isAdminUser(userRole);
    const configType = isAdmin ? 'ADMIN' : 'USER';
    
    return getApiConfig(configType, service);
  }

  /**
   * Check if user has access to a specific API service
   */
  hasAccess(service: string, userRole?: string): boolean {
    const isAdmin = this.isAdminUser(userRole);
    const keyType = isAdmin ? 'ADMIN' : 'USER';
    const apiKey = getApiKey(keyType, service);
    
    return isValidApiKey(apiKey);
  }

  /**
   * Check if a specific feature is enabled for the user
   */
  isFeatureEnabled(feature: string, userRole?: string): boolean {
    const isAdmin = this.isAdminUser(userRole);
    
    // Admin features
    if (isAdmin && feature.startsWith('ADMIN_')) {
      return FEATURE_FLAGS[feature as keyof typeof FEATURE_FLAGS] || false;
    }
    
    // User features
    if (feature.startsWith('USER_')) {
      return FEATURE_FLAGS[feature as keyof typeof FEATURE_FLAGS] || false;
    }
    
    // Shared features
    return FEATURE_FLAGS[feature as keyof typeof FEATURE_FLAGS] || false;
  }

  /**
   * Track API usage for cost monitoring
   */
  trackUsage(service: string, userRole?: string, cost: number = 0): void {
    const isAdmin = this.isAdminUser(userRole);
    const keyType = isAdmin ? 'ADMIN' : 'USER';
    
    // Update status
    const currentStatus = getApiStatus(keyType, service);
    if (currentStatus) {
      setApiStatus(keyType, service, {
        ...currentStatus,
        requestsToday: currentStatus.requestsToday + 1,
        lastCheck: new Date(),
      });
    }
    
    // Track usage history
    this.usageHistory.push({
      service,
      type: keyType,
      requests: 1,
      cost,
      lastUsed: new Date(),
    });
  }

  /**
   * Get usage statistics
   */
  getUsageStats(userRole?: string) {
    const isAdmin = this.isAdminUser(userRole);
    const keyType = isAdmin ? 'ADMIN' : 'USER';
    
    const stats = {
      today: {
        requests: 0,
        cost: 0,
        services: {} as Record<string, { requests: number; cost: number }>,
      },
      thisMonth: {
        requests: 0,
        cost: 0,
        services: {} as Record<string, { requests: number; cost: number }>,
      },
      history: this.usageHistory.filter(usage => usage.type === keyType),
    };
    
    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.usageHistory
      .filter(usage => usage.type === keyType && usage.lastUsed >= today)
      .forEach(usage => {
        stats.today.requests += usage.requests;
        stats.today.cost += usage.cost;
        
        if (!stats.today.services[usage.service]) {
          stats.today.services[usage.service] = { requests: 0, cost: 0 };
        }
        stats.today.services[usage.service].requests += usage.requests;
        stats.today.services[usage.service].cost += usage.cost;
      });
    
    // Calculate this month's stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    this.usageHistory
      .filter(usage => usage.type === keyType && usage.lastUsed >= thisMonth)
      .forEach(usage => {
        stats.thisMonth.requests += usage.requests;
        stats.thisMonth.cost += usage.cost;
        
        if (!stats.thisMonth.services[usage.service]) {
          stats.thisMonth.services[usage.service] = { requests: 0, cost: 0 };
        }
        stats.thisMonth.services[usage.service].requests += usage.requests;
        stats.thisMonth.services[usage.service].cost += usage.cost;
      });
    
    return stats;
  }

  /**
   * Validate all API keys
   */
  validateAllKeys() {
    return validateApiKeys();
  }

  /**
   * Get cost estimates
   */
  getCostEstimates() {
    return estimateApiCosts();
  }

  /**
   * Check if user is admin based on role
   */
  private isAdminUser(userRole?: string): boolean {
    if (!userRole) {
      // Try to get current user's role
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        // This would need to be implemented in authService
        // For now, we'll assume root users are admin
        return currentUser.email === 'christophersmithm16@gmail.com';
      }
      return false;
    }
    
    // Check if role is admin-level
    const adminRoles = ['root', 'admin', 'committee_member'];
    return adminRoles.includes(userRole.toLowerCase());
  }

  /**
   * Get available services for user role
   */
  getAvailableServices(userRole?: string): string[] {
    const isAdmin = this.isAdminUser(userRole);
    const keyType = isAdmin ? 'ADMIN' : 'USER';
    
    const services = [];
    
    // Check each service
    const serviceKeys = Object.keys(API_KEYS[keyType]);
    for (const service of serviceKeys) {
      if (this.hasAccess(service, userRole)) {
        services.push(service);
      }
    }
    
    return services;
  }

  /**
   * Get service limits for user role
   */
  getServiceLimits(service: string, userRole?: string) {
    const config = this.getApiConfig(service, userRole);
    return {
      maxRequestsPerDay: config?.maxRequestsPerDay || 0,
      costPerRequest: config?.costPerRequest || 0,
      allowedModels: (config as any)?.allowedModels || [],
      maxTokensPerRequest: (config as any)?.maxTokensPerRequest || 0,
    };
  }

  /**
   * Check if service is within limits
   */
  isWithinLimits(service: string, userRole?: string): boolean {
    const config = this.getApiConfig(service, userRole);
    const status = getApiStatus(this.isAdminUser(userRole) ? 'ADMIN' : 'USER', service);
    
    if (!config || !status) return false;
    
    return status.requestsToday < config.maxRequestsPerDay;
  }

  /**
   * Reset daily usage counters
   */
  resetDailyUsage(): void {
    // Reset admin usage
    Object.keys(API_STATUS.ADMIN).forEach(service => {
      setApiStatus('ADMIN', service, { requestsToday: 0, errorsToday: 0 });
    });
    
    // Reset user usage
    Object.keys(API_STATUS.USER).forEach(service => {
      setApiStatus('USER', service, { requestsToday: 0, errorsToday: 0 });
    });
    
    // Reset shared usage - manually update the shared status
    API_STATUS.PHONE_VALIDATION.requestsToday = 0;
    API_STATUS.PHONE_VALIDATION.errorsToday = 0;
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();
