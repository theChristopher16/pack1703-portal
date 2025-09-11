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
  Zap
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
    roles: [UserRole.ANONYMOUS, UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Main dashboard and overview'
  },
  {
    name: 'Events',
    href: '/events',
    icon: Calendar,
    roles: [UserRole.ANONYMOUS, UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Upcoming pack events and activities'
  },
  {
    name: 'Announcements',
    href: '/announcements',
    icon: MessageSquare,
    roles: [UserRole.ANONYMOUS, UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Pack news and updates'
  },
  {
    name: 'Locations',
    href: '/locations',
    icon: MapPin,
    roles: [UserRole.ANONYMOUS, UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Meeting places and venues'
  },
  {
    name: 'Volunteer',
    href: '/volunteer',
    icon: Users,
    roles: [UserRole.ANONYMOUS, UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'public',
    description: 'Volunteer opportunities'
  },

  // AUTHENTICATED ITEMS (require login)
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageCircle,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Pack communication hub'
  },
  {
    name: 'Resources',
    href: '/resources',
    icon: FileText,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Pack resources and documents'
  },
  {
    name: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    roles: [UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Share feedback and suggestions'
  },
  {
    name: 'Data Audit',
    href: '/data-audit',
    icon: Shield,
    roles: [UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT],
    category: 'authenticated',
    description: 'Privacy and data transparency'
  },

  // ADMIN ITEMS (admin and above)
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Usage analytics and insights'
  },
  {
    name: 'Event Management',
    href: '/admin/events',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Create and manage events'
  },
  {
    name: 'News Management',
    href: '/admin/announcements',
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Manage announcements and news'
  },
  {
    name: 'Location Management',
    href: '/admin/locations',
    icon: MapPin,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Manage pack locations'
  },
  {
    name: 'Volunteer Management',
    href: '/admin/volunteer',
    icon: HandHeart,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Manage volunteer opportunities'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: UserPlus,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Manage user accounts and roles'
  },
  {
    name: 'Fundraising',
    href: '/admin/fundraising',
    icon: Target,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Fundraising campaigns and tracking'
  },
  {
    name: 'Finances',
    href: '/admin/finances',
    icon: CreditCard,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Financial tracking and reporting'
  },
  {
    name: 'Seasons',
    href: '/admin/seasons',
    icon: Sprout,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Manage scouting seasons'
  },
  {
    name: 'Lists',
    href: '/admin/lists',
    icon: List,
    roles: [UserRole.ADMIN, UserRole.ROOT],
    category: 'admin',
    description: 'Manage pack lists and inventories'
  },

  // SYSTEM ITEMS (root only)
  {
    name: 'Solyn AI',
    href: '/admin/ai',
    icon: Bot,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'AI assistant management'
  },
  {
    name: 'SOC Console',
    href: '/admin/soc',
    icon: Monitor,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'Security Operations Center'
  },
  {
    name: 'Multi-Tenant',
    href: '/admin/multi-tenant',
    icon: Building,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'Multi-pack management'
  },
  {
    name: 'Cost Management',
    href: '/admin/cost-management',
    icon: DollarSign,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'System cost monitoring'
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Cog,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'System configuration'
  },
  {
    name: 'Database Monitor',
    href: '/admin/database',
    icon: Database,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'Database performance monitoring'
  },
  {
    name: 'System Monitor',
    href: '/admin/system',
    icon: Activity,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'System health monitoring'
  },
  {
    name: 'Performance Monitor',
    href: '/admin/performance',
    icon: TrendingUp,
    roles: [UserRole.ROOT],
    category: 'system',
    description: 'Application performance tracking'
  },
  {
    name: 'Permissions Audit',
    href: '/admin/permissions-audit',
    icon: Eye,
    roles: [UserRole.ADMIN, UserRole.ROOT],
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
    [UserRole.ANONYMOUS]: 0,
    [UserRole.PARENT]: 1,
    [UserRole.VOLUNTEER]: 2,
    [UserRole.AI_ASSISTANT]: 2.5,
    [UserRole.ADMIN]: 3,
    [UserRole.ROOT]: 4
  };
  return hierarchy[role] || 0;
};

// Helper function to check if user role is admin or above
export const isAdminOrAbove = (role: UserRole): boolean => {
  return getRoleLevel(role) >= getRoleLevel(UserRole.ADMIN);
};

// Helper function to check if user role is root
export const isRoot = (role: UserRole): boolean => {
  return role === UserRole.ROOT;
};
