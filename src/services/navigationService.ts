import { UserRole } from '../services/authService';
import { 
  Home, 
  Calendar, 
  MapPin, 
  FileText, 
  Users, 
  MessageSquare, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  DollarSign, 
  UserPlus, 
  Cog, 
  Shield,
  Monitor,
  Building,
  Target,
  List,
  HandHeart,
  Sprout,
  Bot,
  Database,
  Activity,
  TrendingUp,
  CreditCard,
  Award,
  Globe,
  Lock,
  Eye,
  Zap,
  User,
  Leaf
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: UserRole[];
  category: 'public' | 'authenticated' | 'admin' | 'system';
  description?: string;
}

// Define all navigation items with role-based access
export const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
  // PUBLIC ITEMS (visible to everyone)
  {
    name: 'Home',
    href: '/',
    icon: Home,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Main dashboard and overview'
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Upcoming pack events and activities'
  },
  {
    name: 'Announcements',
    href: '/announcements',
    icon: MessageSquare,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Pack news and updates'
  },
  {
    name: 'Locations',
    href: '/locations',
    icon: MapPin,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Meeting places and venues'
  },
  {
    name: 'Volunteer',
    href: '/volunteer',
    icon: Users,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Volunteer opportunities'
  },
  {
    name: 'Ecology',
    href: '/ecology',
    icon: Leaf,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Environmental monitoring and education'
  },

  // AUTHENTICATED ITEMS (require login)
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Manage your profile and account settings'
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageCircle,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Pack communication hub'
  },
  {
    name: 'Resources',
    href: '/resources',
    icon: FileText,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Pack resources and documents'
  },
  {
    name: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Share feedback and suggestions'
  },
  {
    name: 'Data Audit',
    href: '/data-audit',
    icon: Shield,
    roles: [UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Privacy and data transparency'
  },

  // ADMIN ITEMS (admin and above)
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Usage analytics and insights'
  },
  {
    name: 'Event Management',
    href: '/events',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Create and manage events'
  },
  {
    name: 'News Management',
    href: '/announcements',
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage announcements and news'
  },
  {
    name: 'Location Management',
    href: '/locations',
    icon: MapPin,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage pack locations'
  },
  {
    name: 'Volunteer Management',
    href: '/volunteer',
    icon: HandHeart,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage volunteer opportunities'
  },
  {
    name: 'User Management',
    href: '/users',
    icon: UserPlus,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage user accounts and roles'
  },
  {
    name: 'Fundraising',
    href: '/fundraising',
    icon: Target,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Fundraising campaigns and tracking'
  },
  {
    name: 'Finances',
    href: '/finances',
    icon: CreditCard,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Financial tracking and reporting'
  },
  {
    name: 'Seasons',
    href: '/seasons',
    icon: Sprout,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage scouting seasons'
  },
  {
    name: 'Lists',
    href: '/lists',
    icon: List,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Manage pack lists and inventories'
  },
  {
    name: 'Feedback Management',
    href: '/feedback',
    icon: MessageSquare,
    roles: [UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'Review and respond to feedback'
  },

  // SYSTEM ITEMS (root only)
  {
    name: 'Solyn AI',
    href: '/ai',
    icon: Bot,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'AI assistant management'
  },
  {
    name: 'SOC Console',
    href: '/soc',
    icon: Monitor,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'Security Operations Center'
  },
  {
    name: 'Multi-Tenant',
    href: '/multi-tenant',
    icon: Building,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'Multi-pack management'
  },
  {
    name: 'Cost Management',
    href: '/cost-management',
    icon: DollarSign,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'System cost monitoring'
  },
  {
    name: 'System Settings',
    href: '/settings',
    icon: Cog,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'System configuration'
  },
  {
    name: 'Database Monitor',
    href: '/database',
    icon: Database,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'Database performance monitoring'
  },
  {
    name: 'System Monitor',
    href: '/system',
    icon: Activity,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'System health monitoring'
  },
  {
    name: 'Performance Monitor',
    href: '/performance',
    icon: TrendingUp,
    roles: [UserRole.SUPER_ADMIN],
    category: 'system',
    description: 'Application performance tracking'
  },
  {
    name: 'Permissions Audit',
    href: '/permissions-audit',
    icon: Eye,
    roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    category: 'admin',
    description: 'User permissions audit'
  }
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
    [UserRole.PARENT]: 1,
    [UserRole.VOLUNTEER]: 2,
    [UserRole.AI_ASSISTANT]: 2.5,
    [UserRole.ADMIN]: 3,
    [UserRole.SUPER_ADMIN]: 5
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
