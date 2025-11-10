export interface HouseholdMember {
  id: string;
  name: string;
  relationship: string; // 'self', 'spouse', 'child', 'parent', 'other'
  birthDate?: Date;
  email?: string;
  phone?: string;
  allergies?: string[];
  medicalNotes?: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'garage' | 'basement' | 'attic' | 'office' | 'other';
  floor?: number;
  notes?: string;
}

export interface HouseholdProfile {
  id: string;
  userId: string;
  householdName: string;
  address?: string;
  members: HouseholdMember[];
  rooms: Room[];
  hasVehicles: boolean;
  hasPets: boolean;
  monthlyBudget?: number;
  budgetCategories?: string[];
  setupCompleted: boolean;
  setupCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_BUDGET_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Insurance',
  'Housing',
  'Dining Out',
  'Shopping',
  'Subscriptions',
  'Other',
];

export const DEFAULT_ROOMS = [
  { name: 'Living Room', type: 'living' as const },
  { name: 'Kitchen', type: 'kitchen' as const },
  { name: 'Master Bedroom', type: 'bedroom' as const },
  { name: 'Bathroom', type: 'bathroom' as const },
  { name: 'Garage', type: 'garage' as const },
];

