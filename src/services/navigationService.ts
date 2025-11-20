import { UserRole } from '../services/authService';
import { OrganizationType, ComponentId } from '../types/organization';
import { 
  Home, 
  Calendar, 
  MapPin, 
  FileText, 
  Users, 
  MessageSquare, 
  MessageCircle, 
  BarChart3, 
  DollarSign, 
  UserPlus, 
  Cog, 
  Shield,
  Monitor,
  Target,
  List,
  Sprout,
  Bot,
  Activity,
  CreditCard,
  User,
  Leaf,
  MousePointer,
  Building2,
  Store,
  ShoppingCart,
  Package,
  Network,
  StickyNote
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: UserRole[];
  category: 'public' | 'authenticated' | 'admin' | 'system';
  description?: string;
  // Organization types that can access this feature
  // If undefined, available to all org types
  orgTypes?: OrganizationType[];
  // Component ID required for this navigation item
  // If undefined, item doesn't require a specific component
  componentId?: ComponentId;
  // If true, this route should always go to Pack 1703 (not org-prefixed)
  // Used for platform-wide admin tools
  isPlatformRoute?: boolean;
}

// Define all navigation items organized by role hierarchy
// Order: Parent → Volunteer → Admin → Super Admin
export const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
  // PARENT LEVEL (all users)
  {
    name: 'Home',
    href: '/',
    icon: Home,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Main dashboard and overview'
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Upcoming pack events and activities',
    componentId: 'calendar'
  },
  {
    name: 'Announcements',
    href: '/announcements',
    icon: MessageSquare,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Pack news and updates',
    componentId: 'announcements'
  },
  {
    name: 'Locations',
    href: '/locations',
    icon: MapPin,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Meeting places and venues',
    componentId: 'locations'
  },
  {
    name: 'Notes',
    href: '/notes',
    icon: StickyNote,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Organization notes and reminders',
    componentId: 'notes'
  },
  {
    name: 'Volunteer',
    href: '/volunteer',
    icon: Users,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Volunteer opportunities',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'volunteer'
  },
  {
    name: 'Ecology',
    href: '/ecology',
    icon: Leaf,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Environmental monitoring and education',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'ecology'
  },
  {
    name: 'Fundraising',
    href: '/fundraising',
    icon: Target,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Active fundraising campaign progress',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'fundraising'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Manage your profile and account settings',
    componentId: 'profile'
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageCircle,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Pack communication hub',
    componentId: 'chat'
  },
  {
    name: 'Resources',
    href: '/resources',
    icon: FileText,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Pack resources and documents',
    componentId: 'resources'
  },
  {
    name: 'Gallery',
    href: '/gallery',
    icon: FileText,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COPSE_ADMIN],
    category: 'authenticated',
    description: 'Photo gallery with memories',
    componentId: 'gallery'
  },
  {
    name: 'Dues',
    href: '/dues',
    icon: CreditCard,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'National and Pack dues information',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'dues'
  },
  {
    name: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Share feedback and suggestions',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT]
  },

  // STOREFRONT COMPONENTS (storefront organizations only)
  {
    name: 'Products',
    href: '/products',
    icon: Store,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Product catalog and inventory',
    orgTypes: [OrganizationType.STOREFRONT],
    componentId: 'products'
  },
  {
    name: 'Shopping Cart',
    href: '/cart',
    icon: ShoppingCart,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Shopping cart functionality',
    orgTypes: [OrganizationType.STOREFRONT],
    componentId: 'cart'
  },
  {
    name: 'Checkout',
    href: '/checkout',
    icon: CreditCard,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Payment and checkout process',
    orgTypes: [OrganizationType.STOREFRONT],
    componentId: 'checkout'
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: Package,
    roles: [UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Order management and tracking',
    orgTypes: [OrganizationType.STOREFRONT],
    componentId: 'orders'
  },

  // VOLUNTEER LEVEL (den leaders and above)
  {
    name: 'Data Audit',
    href: '/data-audit',
    icon: Shield,
    roles: [UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Privacy and data transparency',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT]
  },

  // ADMIN LEVEL (pack administrators and above)
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Usage analytics and insights',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'analytics'
  },
  {
    name: 'User Management',
    href: '/users',
    icon: UserPlus,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage user accounts and roles',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'userManagement'
  },
  {
    name: 'Fundraising',
    href: '/fundraising',
    icon: Target,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Fundraising campaigns and tracking',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'fundraising'
  },
  {
    name: 'Finances',
    href: '/finances',
    icon: CreditCard,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Financial tracking and reporting',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'finances'
  },
  {
    name: 'Seasons',
    href: '/seasons',
    icon: Sprout,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage scouting seasons',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'seasons'
  },
  {
    name: 'Lists',
    href: '/lists',
    icon: List,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage pack lists and inventories',
    orgTypes: [OrganizationType.PACK, OrganizationType.TROOP, OrganizationType.CREW, OrganizationType.POST, OrganizationType.COUNCIL, OrganizationType.DISTRICT],
    componentId: 'lists'
  },
  {
    name: 'Cost Management',
    href: '/pack1703/cost-management',
    icon: DollarSign,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'System cost monitoring',
    isPlatformRoute: true
  },

  // SUPER ADMIN LEVEL (system administrators only - routes to Pack 1703)
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'Multi-tenant organization management',
    isPlatformRoute: true
  },
  {
    name: 'Solyn AI',
    href: '/pack1703/ai',
    icon: Bot,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'AI assistant management',
    isPlatformRoute: true
  },
  {
    name: 'SOC Console',
    href: '/pack1703/soc',
    icon: Monitor,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'Security Operations Center',
    isPlatformRoute: true
  },
  {
    name: 'System Settings',
    href: '/pack1703/settings',
    icon: Cog,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'System configuration',
    isPlatformRoute: true
  },
  {
    name: 'System Monitor',
    href: '/pack1703/system',
    icon: Activity,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'System health monitoring',
    isPlatformRoute: true
  },
  {
    name: 'User Interactions',
    href: '/pack1703/user-interactions',
    icon: MousePointer,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'Detailed user interaction analytics and behavior tracking',
    isPlatformRoute: true
  },
  {
    name: 'Copse Network Admin',
    href: '/copse-admin',
    icon: Network,
    roles: [UserRole.SUPER_ADMIN, UserRole.COPSE_ADMIN],
    category: 'system',
    description: 'Enterprise network administration and cross-organizational management',
    isPlatformRoute: true
  },
];

// Helper function to get navigation items for a specific role
export const getNavigationForRole = (role: UserRole): NavigationItem[] => {
  return ALL_NAVIGATION_ITEMS.filter(item => item.roles.includes(role));
};

// Helper function to get navigation items by category
export const getNavigationByCategory = (role: UserRole, category: 'public' | 'authenticated' | 'admin' | 'system'): NavigationItem[] => {
  return ALL_NAVIGATION_ITEMS.filter(item => 
    item.roles.includes(role) && item.category === category
  );
};

// Helper function to check if user has access to a specific route
export const hasAccessToRoute = (role: UserRole, route: string): boolean => {
  return ALL_NAVIGATION_ITEMS.some(item => 
    item.href === route && item.roles.includes(role)
  );
};

// Helper function to get the highest role level for a user
export const getRoleLevel = (role: UserRole): number => {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.HOME]: 0,
    [UserRole.PARENT]: 1,
    [UserRole.DEN_LEADER]: 2,
    [UserRole.AI_ASSISTANT]: 2.5,
    [UserRole.ADMIN]: 3,
    [UserRole.SUPER_ADMIN]: 5,
    [UserRole.COPSE_ADMIN]: 6
  };
  return hierarchy[role] || 0;
};

// Helper function to check if user role is admin or above
export const isAdminOrAbove = (role: UserRole): boolean => {
  return getRoleLevel(role) >= getRoleLevel(UserRole.ADMIN);
};

// Helper function to check if user role is root
export const isRoot = (role: UserRole): boolean => {
  return role === UserRole.SUPER_ADMIN;
};

// Helper function to get navigation items for a specific role and organization type
export const getNavigationForRoleAndOrg = (role: UserRole, orgType?: OrganizationType | null): NavigationItem[] => {
  return ALL_NAVIGATION_ITEMS.filter(item => {
    // Check if user has the required role
    if (!item.roles.includes(role)) {
      return false;
    }
    
    // If no orgTypes specified, item is available to all org types
    if (!item.orgTypes) {
      return true;
    }
    
    // If orgType is not provided or null, default to PACK for backward compatibility
    const currentOrgType = orgType || OrganizationType.PACK;
    
    // Check if current org type is in the allowed list
    return item.orgTypes.includes(currentOrgType);
  });
};

// Helper function to filter navigation items by organization type
export const filterNavigationByOrgType = (items: NavigationItem[], orgType?: OrganizationType | null): NavigationItem[] => {
  return items.filter(item => {
    // If no orgTypes specified, item is available to all org types
    if (!item.orgTypes) {
      return true;
    }
    
    // If orgType is not provided or null, default to PACK for backward compatibility
    const currentOrgType = orgType || OrganizationType.PACK;
    
    // Check if current org type is in the allowed list
    return item.orgTypes.includes(currentOrgType);
  });
};

// Helper function to filter navigation items by enabled components
export const filterNavigationByEnabledComponents = (
  items: NavigationItem[], 
  enabledComponents?: ComponentId[] | null
): NavigationItem[] => {
  return items.filter(item => {
    // If item doesn't require a specific component, it's always available (Home, etc.)
    if (!item.componentId) {
      return true;
    }
    
    // If enabledComponents is explicitly null or undefined (not set), allow all for backward compatibility
    // This handles orgs that don't have the enabledComponents field yet
    if (enabledComponents === null || enabledComponents === undefined) {
      return true;
    }
    
    // If enabledComponents is an empty array, org has components system but nothing enabled
    // Only show items that don't require a component
    if (enabledComponents.length === 0) {
      return false;
    }
    
    // Check if the required component is in the enabled list
    return enabledComponents.includes(item.componentId);
  });
};

// Helper function to filter navigation by both org type AND enabled components
export const filterNavigationByOrg = (
  items: NavigationItem[],
  orgType?: OrganizationType | null,
  enabledComponents?: ComponentId[] | null
): NavigationItem[] => {
  // First filter by org type
  let filtered = filterNavigationByOrgType(items, orgType);
  
  // Then filter by enabled components
  filtered = filterNavigationByEnabledComponents(filtered, enabledComponents);
  
  return filtered;
};
