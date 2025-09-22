import { UserRole } from './authService';
import { ComponentUsage } from './usageTrackingService';

export interface HeroButtonConfig {
  name: string;
  description: string;
  href: string;
  icon: any; // Lucide React icon component
  color: string;
  priority: number; // Higher number = higher priority
}

export interface RoleBasedComponents {
  [key: string]: HeroButtonConfig;
}

class HeroButtonService {
  // Define all available components with their configurations
  private readonly ALL_COMPONENTS: RoleBasedComponents = {
    events: {
      name: 'Explore Events',
      description: 'Discover upcoming pack activities and Houston-area adventures',
      href: '/events',
      icon: 'Calendar', // Will be imported dynamically
      color: 'bg-gradient-to-br from-primary-400 to-primary-500',
      priority: 10
    },
    locations: {
      name: 'Find Locations',
      description: 'Discover Houston-area meeting spots and adventure destinations',
      href: '/locations',
      icon: 'MapPin',
      color: 'bg-gradient-to-br from-secondary-400 to-secondary-500',
      priority: 9
    },
    announcements: {
      name: 'Announcements',
      description: 'Stay updated with latest news and important updates',
      href: '/announcements',
      icon: 'MessageSquare',
      color: 'bg-gradient-to-br from-accent-400 to-accent-500',
      priority: 8
    },
    volunteer: {
      name: 'Volunteer',
      description: 'Join our community and make a difference',
      href: '/volunteer',
      icon: 'Users',
      color: 'bg-gradient-to-br from-secondary-500 to-accent-500',
      priority: 7
    },
    chat: {
      name: 'Chat',
      description: 'Connect with other families and stay in touch',
      href: '/chat',
      icon: 'MessageCircle',
      color: 'bg-gradient-to-br from-accent-500 to-primary-500',
      priority: 6
    },
    resources: {
      name: 'Resources',
      description: 'Access packing lists and helpful guides',
      href: '/resources',
      icon: 'FileText',
      color: 'bg-gradient-to-br from-primary-500 to-secondary-500',
      priority: 5
    },
    feedback: {
      name: 'Feedback',
      description: 'Share your thoughts and suggestions',
      href: '/feedback',
      icon: 'MessageSquare',
      color: 'bg-gradient-to-br from-accent-400 to-primary-400',
      priority: 4
    },
    analytics: {
      name: 'Analytics',
      description: 'View system performance and usage statistics',
      href: '/analytics',
      icon: 'BarChart3',
      color: 'bg-gradient-to-br from-purple-500 to-accent-500',
      priority: 3
    },
    dataAudit: {
      name: 'Data Audit',
      description: 'Download your personal data and privacy information',
      href: '/data-audit',
      icon: 'Shield',
      color: 'bg-gradient-to-br from-green-500 to-accent-500',
      priority: 2
    }
  };

  // Role-based component access permissions
  private readonly ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    [UserRole.PARENT]: ['events', 'locations', 'announcements', 'volunteer', 'chat', 'resources', 'feedback'],
    [UserRole.VOLUNTEER]: ['events', 'locations', 'announcements', 'volunteer', 'chat', 'resources', 'feedback', 'dataAudit'],
    [UserRole.AI_ASSISTANT]: ['events', 'locations', 'announcements', 'volunteer', 'chat', 'resources', 'feedback', 'dataAudit'],
    [UserRole.ADMIN]: ['events', 'locations', 'announcements', 'volunteer', 'chat', 'resources', 'feedback', 'dataAudit', 'analytics'],
    [UserRole.ROOT]: ['events', 'locations', 'announcements', 'volunteer', 'chat', 'resources', 'feedback', 'dataAudit', 'analytics']
  };

  // Role-based default priorities (when no usage data is available)
  private readonly ROLE_DEFAULT_PRIORITIES: Record<UserRole, string[]> = {
    [UserRole.PARENT]: ['events', 'chat'],
    [UserRole.VOLUNTEER]: ['events', 'volunteer'],
    [UserRole.AI_ASSISTANT]: ['events', 'announcements'],
    [UserRole.ADMIN]: ['events', 'analytics'],
    [UserRole.ROOT]: ['events', 'analytics']
  };

  /**
   * Get the top 2 hero buttons based on system-wide usage analytics
   */
  async getHeroButtons(userId: string, userRole: UserRole): Promise<HeroButtonConfig[]> {
    try {
      // Import usage tracking service dynamically to avoid circular dependencies
      const { usageTrackingService } = await import('./usageTrackingService');
      
      // Get system-wide component analytics (most used across all users)
      const systemAnalytics = await usageTrackingService.getComponentAnalytics(10);
      
      // Get allowed components for this role
      const allowedComponents = this.ROLE_PERMISSIONS[userRole] || [];
      
      // Filter system analytics to only include components accessible to this role
      const accessibleAnalytics = systemAnalytics.filter(analytics => 
        allowedComponents.includes(analytics.componentId)
      );

      // If we have system-wide usage data, use the top 2
      if (accessibleAnalytics.length >= 2) {
        return accessibleAnalytics.slice(0, 2).map(analytics => 
          this.ALL_COMPONENTS[analytics.componentId]
        );
      }

      // Fall back to role-based defaults if no system data
      const defaultComponents = this.ROLE_DEFAULT_PRIORITIES[userRole] || ['events', 'locations'];
      return defaultComponents.slice(0, 2).map(compId => this.ALL_COMPONENTS[compId]);

    } catch (error) {
      console.error('Error getting hero buttons:', error);
      
      // Ultimate fallback to safe defaults
      const fallbackComponents = ['events', 'locations'];
      return fallbackComponents.map(compId => this.ALL_COMPONENTS[compId]);
    }
  }

  /**
   * Get all available components for a role (for quick actions section)
   */
  getAvailableComponents(userRole: UserRole): HeroButtonConfig[] {
    const allowedComponents = this.ROLE_PERMISSIONS[userRole] || [];
    
    return allowedComponents
      .map(compId => this.ALL_COMPONENTS[compId])
      .filter(Boolean)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get component configuration by ID
   */
  getComponentConfig(componentId: string): HeroButtonConfig | null {
    return this.ALL_COMPONENTS[componentId] || null;
  }

  /**
   * Check if a component is accessible to a role
   */
  isComponentAccessible(componentId: string, userRole: UserRole): boolean {
    const allowedComponents = this.ROLE_PERMISSIONS[userRole] || [];
    return allowedComponents.includes(componentId);
  }

  /**
   * Get role-specific component recommendations
   */
  getRoleRecommendations(userRole: UserRole): HeroButtonConfig[] {
    const recommendations: Record<UserRole, string[]> = {
      [UserRole.PARENT]: ['events', 'chat', 'volunteer'],
      [UserRole.VOLUNTEER]: ['events', 'volunteer', 'announcements'],
      [UserRole.AI_ASSISTANT]: ['events', 'announcements', 'chat'],
      [UserRole.ADMIN]: ['events', 'analytics', 'announcements'],
      [UserRole.ROOT]: ['analytics', 'events', 'dataAudit']
    };

    const recommendedIds = recommendations[userRole] || ['events', 'locations'];
    return recommendedIds.map(compId => this.ALL_COMPONENTS[compId]).filter(Boolean);
  }
}

export const heroButtonService = new HeroButtonService();
