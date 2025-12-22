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

export interface RoomNote {
  id: string;
  content: string;
  category: 'general' | 'maintenance' | 'paint' | 'furniture' | 'renovation' | 'cleaning' | 'issues';
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  type: 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'garage' | 'basement' | 'attic' | 'office' | 'other';
  floor?: number;
  notes?: string; // Legacy field - will migrate to roomNotes
  roomNotes?: RoomNote[];
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'feet' | 'meters';
  };
  squareFootage?: number;
  paintColors?: {
    walls?: string;
    trim?: string;
    ceiling?: string;
  };
  flooringType?: string;
  windowCount?: number;
  lastCleaned?: Date;
  lastMaintenance?: Date;
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
  sharedHouseholdId?: string; // Reference to associated SharedHousehold
  
  // House details
  propertyDetails?: {
    yearBuilt?: number;
    squareFootage?: number;
    lotSize?: number;
    stories?: number;
    propertyType?: 'single-family' | 'condo' | 'townhouse' | 'apartment' | 'other';
    heatingType?: string;
    coolingType?: string;
    roofType?: string;
    roofAge?: number;
    exteriorType?: string;
  };
  
  // Utilities & Services
  utilities?: {
    wifiNetwork?: string;
    wifiPassword?: string;
    electricProvider?: string;
    gasProvider?: string;
    waterProvider?: string;
    internetProvider?: string;
    securitySystem?: string;
  };
  
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

