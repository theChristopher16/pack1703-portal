// Organization types and component definitions for multi-tenancy
export enum OrganizationType {
  PACK = 'pack',                    // Cub Scout Pack (like Pack 1703)
  STOREFRONT = 'storefront',        // Storefront/Spirit Store
  TROOP = 'troop',                  // Boy Scout Troop
  CREW = 'crew',                    // Venturing Crew
  POST = 'post',                    // Sea Scout Ship
  COUNCIL = 'council',              // Council-level organization
  DISTRICT = 'district'             // District-level organization
}

// Base components available to all organization types
export const BASE_COMPONENTS = {
  chat: {
    id: 'chat',
    name: 'Chat',
    description: 'Real-time communication hub',
    icon: '💬',
    category: 'communication'
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Events and activities calendar',
    icon: '📅',
    category: 'content'
  },
  announcements: {
    id: 'announcements',
    name: 'Announcements',
    description: 'News and updates',
    icon: '📢',
    category: 'content'
  },
  locations: {
    id: 'locations',
    name: 'Locations',
    description: 'Meeting places and venues',
    icon: '📍',
    category: 'content'
  },
  resources: {
    id: 'resources',
    name: 'Resources',
    description: 'Documents and files',
    icon: '📚',
    category: 'content'
  },
  gallery: {
    id: 'gallery',
    name: 'Photo Gallery',
    description: 'Photo gallery with approval workflow',
    icon: '📸',
    category: 'content'
  },
  profile: {
    id: 'profile',
    name: 'Profile',
    description: 'User profiles and settings',
    icon: '👤',
    category: 'user'
  }
} as const;

// Pack-specific components
export const PACK_COMPONENTS = {
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Usage analytics and insights',
    icon: '📊',
    category: 'pack'
  },
  userManagement: {
    id: 'userManagement',
    name: 'User Management',
    description: 'Manage user accounts and roles',
    icon: '👥',
    category: 'pack'
  },
  finances: {
    id: 'finances',
    name: 'Finances',
    description: 'Financial tracking and reporting',
    icon: '💳',
    category: 'pack'
  },
  seasons: {
    id: 'seasons',
    name: 'Seasons',
    description: 'Manage scouting seasons',
    icon: '🌱',
    category: 'pack'
  },
  lists: {
    id: 'lists',
    name: 'Lists',
    description: 'Manage pack lists and inventories',
    icon: '📋',
    category: 'pack'
  },
  volunteer: {
    id: 'volunteer',
    name: 'Volunteer',
    description: 'Volunteer opportunities and management',
    icon: '🤝',
    category: 'pack'
  },
  ecology: {
    id: 'ecology',
    name: 'Ecology',
    description: 'Environmental monitoring and education',
    icon: '🌿',
    category: 'pack'
  },
  fundraising: {
    id: 'fundraising',
    name: 'Fundraising',
    description: 'Fundraising campaigns and tracking',
    icon: '🎯',
    category: 'pack'
  },
  dues: {
    id: 'dues',
    name: 'Dues',
    description: 'National and Pack dues information',
    icon: '💵',
    category: 'pack'
  }
} as const;

// Storefront-specific components
export const STOREFRONT_COMPONENTS = {
  products: {
    id: 'products',
    name: 'Products',
    description: 'Product catalog and inventory',
    icon: '🛍️',
    category: 'storefront'
  },
  orders: {
    id: 'orders',
    name: 'Orders',
    description: 'Order management and tracking',
    icon: '📦',
    category: 'storefront'
  },
  cart: {
    id: 'cart',
    name: 'Shopping Cart',
    description: 'Shopping cart functionality',
    icon: '🛒',
    category: 'storefront'
  },
  checkout: {
    id: 'checkout',
    name: 'Checkout',
    description: 'Payment and checkout process',
    icon: '💳',
    category: 'storefront'
  }
} as const;

// Component categories
export type ComponentCategory = 'communication' | 'content' | 'user' | 'pack' | 'storefront';

// All components organized by category
export const ALL_COMPONENTS = {
  ...BASE_COMPONENTS,
  ...PACK_COMPONENTS,
  ...STOREFRONT_COMPONENTS
} as const;

export type ComponentId = keyof typeof ALL_COMPONENTS;

// Get available components for an organization type
export function getAvailableComponents(orgType: OrganizationType): ComponentId[] {
  const base = Object.keys(BASE_COMPONENTS) as ComponentId[];
  
  switch (orgType) {
    case OrganizationType.STOREFRONT:
      return [...base, ...Object.keys(STOREFRONT_COMPONENTS) as ComponentId[]];
    case OrganizationType.PACK:
    case OrganizationType.TROOP:
    case OrganizationType.CREW:
    case OrganizationType.POST:
    case OrganizationType.COUNCIL:
    case OrganizationType.DISTRICT:
      return [...base, ...Object.keys(PACK_COMPONENTS) as ComponentId[]];
    default:
      return base;
  }
}

// Get component by ID
export function getComponent(componentId: ComponentId) {
  return ALL_COMPONENTS[componentId];
}

// Get components by category
export function getComponentsByCategory(category: ComponentCategory): ComponentId[] {
  return Object.entries(ALL_COMPONENTS)
    .filter(([_, component]) => component.category === category)
    .map(([id]) => id as ComponentId);
}

// Organization type display names
export const ORGANIZATION_TYPE_NAMES: Record<OrganizationType, string> = {
  [OrganizationType.PACK]: 'Cub Scout Pack',
  [OrganizationType.STOREFRONT]: 'Storefront / Spirit Store',
  [OrganizationType.TROOP]: 'Boy Scout Troop',
  [OrganizationType.CREW]: 'Venturing Crew',
  [OrganizationType.POST]: 'Sea Scout Ship',
  [OrganizationType.COUNCIL]: 'Council',
  [OrganizationType.DISTRICT]: 'District'
};

// Organization type descriptions
export const ORGANIZATION_TYPE_DESCRIPTIONS: Record<OrganizationType, string> = {
  [OrganizationType.PACK]: 'Cub Scout Pack organization with dens, events, and activities',
  [OrganizationType.STOREFRONT]: 'Storefront or Spirit Store for selling merchandise and products',
  [OrganizationType.TROOP]: 'Boy Scout Troop organization',
  [OrganizationType.CREW]: 'Venturing Crew organization',
  [OrganizationType.POST]: 'Sea Scout Ship organization',
  [OrganizationType.COUNCIL]: 'Council-level organization',
  [OrganizationType.DISTRICT]: 'District-level organization'
};

// Organization branding interface
export interface OrganizationBranding {
  name: string;
  displayName?: string; // Optional display name (e.g., "Pack 1703" vs "Cub Scout Pack 1703")
  shortName?: string; // Short name for mobile/navbar (e.g., "Pack 1703")
  logo?: string; // URL to logo image
  favicon?: string; // URL to favicon
  primaryColor?: string; // Primary brand color (hex)
  secondaryColor?: string; // Secondary brand color (hex)
  email?: string; // Contact email
  website?: string; // Organization website
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  description?: string; // Organization description/tagline
}

// Organization interface (matches Firestore schema)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  orgType: OrganizationType;
  enabledComponents: ComponentId[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  memberCount?: number;
  eventCount?: number;
  locationCount?: number;
  billingAccountId?: string;
  billingAccountLabel?: string;
  billingAccountCreatedAt?: Date;
  billingAccountLinkedAt?: Date;
  // Branding fields
  branding?: OrganizationBranding;
}

// Extended organization interface with branding (for UI)
export interface OrganizationWithBranding extends Organization {
  branding: OrganizationBranding;
}
