/**
 * Household Sharing System
 * 
 * Enables multiple users to share access to the same household resources.
 * Supports:
 * - Multiple adults per household (parents, grandparents, etc.)
 * - Children linked to scout profiles across organizations
 * - Multiple households per child (shared custody)
 * - Multiple residences per user
 */

export type HouseholdMemberRole = 'owner' | 'admin' | 'member' | 'child';

export interface HouseholdMember {
  userId: string;
  email: string;
  displayName: string;
  role: HouseholdMemberRole;
  joinedAt: Date;
  addedBy: string; // userId who added this member
  permissions: HouseholdPermissions;
  // Link to scout profile if this is a child
  scoutProfileId?: string;
  organizationIds?: string[]; // Organizations this child is in
}

export interface HouseholdPermissions {
  canManageMembers: boolean;
  canManageGroceries: boolean;
  canManageRecipes: boolean;
  canManageBudget: boolean;
  canManageTasks: boolean;
  canManageMaintenance: boolean;
  canManageCalendar: boolean;
  canViewOnly: boolean;
}

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  householdName: string;
  invitedEmail: string;
  invitedBy: string; // userId
  invitedByName: string;
  role: HouseholdMemberRole;
  permissions: HouseholdPermissions;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
}

export interface SharedHousehold {
  id: string;
  name: string;
  address?: string;
  ownerId: string; // Primary owner
  members: HouseholdMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserHouseholds {
  userId: string;
  primaryHouseholdId?: string;
  households: {
    householdId: string;
    householdName: string;
    role: HouseholdMemberRole;
    isPrimary: boolean;
  }[];
}

/**
 * Child Profile - Links to scout profiles across organizations
 */
export interface ChildProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  // Households this child is part of (supports shared custody)
  households: {
    householdId: string;
    householdName: string;
    isPrimaryCustody: boolean;
    custodySchedule?: string; // e.g., "Week on/week off", "Weekends", etc.
  }[];
  // Scout/Organization linkages
  scoutProfiles: {
    organizationId: string;
    organizationName: string;
    profileId: string; // ID in that organization's system
    rank?: string;
    den?: string;
    patrolName?: string;
  }[];
  parentUserIds: string[]; // Users who are parents/guardians
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shopping Provider Configuration
 */
export type ShoppingProvider = 'amazon' | 'walmart' | 'target' | 'instacart' | 'costco' | 'custom';

export interface ShoppingProviderConfig {
  provider: ShoppingProvider;
  isEnabled: boolean;
  isPrimary: boolean;
  accountLinked: boolean;
  accountEmail?: string;
  apiKey?: string;
  customUrl?: string; // For custom providers
  preferences: {
    autoAddToCart: boolean;
    preferredCategories?: string[];
    priceThreshold?: number; // Only auto-add if price below threshold
  };
}

export interface UserShoppingProviders {
  userId: string;
  householdId: string;
  providers: ShoppingProviderConfig[];
  defaultProvider: ShoppingProvider;
  updatedAt: Date;
}

export const DEFAULT_PERMISSIONS: HouseholdPermissions = {
  canManageMembers: false,
  canManageGroceries: true,
  canManageRecipes: true,
  canManageBudget: false,
  canManageTasks: true,
  canManageMaintenance: false,
  canManageCalendar: true,
  canViewOnly: false,
};

export const OWNER_PERMISSIONS: HouseholdPermissions = {
  canManageMembers: true,
  canManageGroceries: true,
  canManageRecipes: true,
  canManageBudget: true,
  canManageTasks: true,
  canManageMaintenance: true,
  canManageCalendar: true,
  canViewOnly: false,
};

export const ADMIN_PERMISSIONS: HouseholdPermissions = {
  canManageMembers: true,
  canManageGroceries: true,
  canManageRecipes: true,
  canManageBudget: true,
  canManageTasks: true,
  canManageMaintenance: true,
  canManageCalendar: true,
  canViewOnly: false,
};

export const CHILD_PERMISSIONS: HouseholdPermissions = {
  canManageMembers: false,
  canManageGroceries: false,
  canManageRecipes: false,
  canManageBudget: false,
  canManageTasks: true, // Can mark their own tasks complete
  canManageMaintenance: false,
  canManageCalendar: false,
  canViewOnly: true,
};

