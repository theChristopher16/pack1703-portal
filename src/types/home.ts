export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; // e.g., 'lb', 'oz', 'cups', 'items', 'kg', 'g'
  category: GroceryCategory;
  location?: string; // e.g., 'pantry', 'fridge', 'freezer'
  expirationDate?: Date;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum GroceryCategory {
  PRODUCE = 'produce',
  DAIRY = 'dairy',
  MEAT = 'meat',
  BAKERY = 'bakery',
  PANTRY = 'pantry',
  FROZEN = 'frozen',
  BEVERAGES = 'beverages',
  SNACKS = 'snacks',
  CONDIMENTS = 'condiments',
  OTHER = 'other',
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  imageUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  timesUsed: number;
  lastUsed?: Date;
}

export interface RecipeUseLog {
  id: string;
  recipeId: string;
  recipeName: string;
  usedAt: Date;
  userId: string;
  groceryDeductions: {
    groceryItemId: string;
    groceryItemName: string;
    quantityUsed: number;
    unit: string;
  }[];
}

// Shopping Lists
export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  category?: GroceryCategory;
  isPurchased: boolean;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

// Meal Planning
export interface MealPlan {
  id: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string;
  recipeName?: string;
  customMeal?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tasks/Chores
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  category?: string; // e.g., 'cleaning', 'maintenance', 'shopping', 'yard work'
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Budget & Expenses
export interface BudgetCategory {
  id: string;
  name: string;
  monthlyLimit: number;
  color?: string;
  icon?: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  description: string;
  date: Date;
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  month: string; // Format: 'YYYY-MM'
  categories: {
    categoryId: string;
    categoryName: string;
    limit: number;
    spent: number;
  }[];
  totalLimit: number;
  totalSpent: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bills & Subscriptions
export enum BillFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  frequency: BillFrequency;
  dueDay: number; // Day of month (1-31) or day of week for weekly
  category: string;
  isPaid: boolean;
  lastPaidDate?: Date;
  nextDueDate: Date;
  autoPayEnabled?: boolean;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Home Maintenance
export enum MaintenanceFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUALLY = 'semiannually',
  ANNUALLY = 'annually',
}

export interface MaintenanceItem {
  id: string;
  name: string;
  category: string; // e.g., 'HVAC', 'Plumbing', 'Electrical', 'Appliances', 'Exterior', 'Yard'
  frequency: MaintenanceFrequency;
  lastCompleted?: Date;
  nextDue: Date;
  estimatedCost?: number;
  serviceProvider?: string;
  providerContact?: string;
  notes?: string;
  warrantyExpiration?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceLog {
  id: string;
  maintenanceItemId: string;
  completedDate: Date;
  cost?: number;
  performedBy?: string; // 'self' or service provider name
  notes?: string;
  nextScheduled?: Date;
  userId: string;
  createdAt: Date;
}

// Household Inventory
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  room: string;
  location: string; // Specific location in room
  quantity: number;
  purchaseDate?: Date;
  purchasePrice?: number;
  serialNumber?: string;
  modelNumber?: string;
  warrantyExpiration?: Date;
  receiptUrl?: string;
  imageUrl?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Family Calendar
export interface FamilyEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: 'appointment' | 'activity' | 'school' | 'sports' | 'other';
  assignedTo?: string[]; // Family member names
  reminder?: number; // Minutes before event
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Health & Medications
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., 'twice daily', 'as needed'
  prescribedFor: string; // Family member name
  prescribedBy?: string; // Doctor name
  startDate: Date;
  endDate?: Date;
  refillReminder?: Date;
  pharmacy?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthAppointment {
  id: string;
  type: 'doctor' | 'dentist' | 'specialist' | 'therapy' | 'other';
  provider: string;
  patientName: string;
  appointmentDate: Date;
  location?: string;
  phone?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaccinationRecord {
  id: string;
  vaccineName: string;
  patientName: string;
  dateAdministered: Date;
  nextDue?: Date;
  provider?: string;
  location?: string;
  userId: string;
  createdAt: Date;
}

// Vehicle Management
export interface Vehicle {
  id: string;
  name: string; // e.g., '2020 Honda Civic'
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  currentMileage: number;
  registrationExpiration?: Date;
  insuranceExpiration?: Date;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: string; // 'Oil Change', 'Tire Rotation', 'Brake Service', etc.
  date: Date;
  mileage: number;
  cost?: number;
  serviceProvider?: string;
  notes?: string;
  nextDueMileage?: number;
  nextDueDate?: Date;
  userId: string;
  createdAt: Date;
}

// Pet Care
export interface Pet {
  id: string;
  name: string;
  species: string; // 'dog', 'cat', 'bird', etc.
  breed?: string;
  birthDate?: Date;
  weight?: number;
  weightUnit?: 'lbs' | 'kg';
  vetName?: string;
  vetPhone?: string;
  microchipNumber?: string;
  imageUrl?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PetAppointment {
  id: string;
  petId: string;
  petName: string;
  type: 'checkup' | 'vaccination' | 'grooming' | 'surgery' | 'emergency' | 'other';
  appointmentDate: Date;
  provider: string;
  location?: string;
  cost?: number;
  notes?: string;
  userId: string;
  createdAt: Date;
}

export interface PetMedication {
  id: string;
  petId: string;
  petName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
}

// Document Vault
export enum DocumentCategory {
  IDENTIFICATION = 'identification',
  INSURANCE = 'insurance',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  MEDICAL = 'medical',
  PROPERTY = 'property',
  EDUCATION = 'education',
  TAX = 'tax',
  WARRANTY = 'warranty',
  MANUAL = 'manual',
  OTHER = 'other',
}

export interface Document {
  id: string;
  name: string;
  category: DocumentCategory;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  tags?: string[];
  expirationDate?: Date;
  isEncrypted: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cleaning Schedule
export interface CleaningTask {
  id: string;
  taskName: string;
  room: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastCompleted?: Date;
  nextDue: Date;
  assignedTo?: string;
  estimatedMinutes?: number;
  instructions?: string;
  isCompleted: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CleaningLog {
  id: string;
  taskId: string;
  taskName: string;
  room: string;
  completedDate: Date;
  completedBy: string;
  timeSpent?: number; // in minutes
  notes?: string;
  userId: string;
  createdAt: Date;
}

