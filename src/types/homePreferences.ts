export interface HomeFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  category: 'essential' | 'financial' | 'organization' | 'health' | 'maintenance';
}

export interface HomePreferences {
  id: string;
  userId: string;
  features: {
    // Existing features
    groceries: boolean;
    recipes: boolean;
    shoppingLists: boolean;
    mealPlanner: boolean;
    tasks: boolean;
    
    // New features
    budget: boolean;
    bills: boolean;
    maintenance: boolean;
    inventory: boolean;
    familyCalendar: boolean;
    health: boolean;
    vehicles: boolean;
    pets: boolean;
    documents: boolean;
    cleaning: boolean;
    unifiedCalendar: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_HOME_PREFERENCES: Omit<HomePreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  features: {
    // Existing - enabled by default
    groceries: true,
    recipes: true,
    shoppingLists: true,
    mealPlanner: true,
    tasks: true,
    
    // New - disabled by default (user can enable as needed)
    budget: false,
    bills: false,
    maintenance: false,
    inventory: false,
    familyCalendar: false,
    health: false,
    vehicles: false,
    pets: false,
    documents: false,
    cleaning: false,
    unifiedCalendar: false,
  },
};

export const HOME_FEATURES: Record<string, { name: string; description: string; category: string; icon: string }> = {
  groceries: {
    name: 'Groceries',
    description: 'Track your grocery inventory with expiration dates',
    category: 'essential',
    icon: 'ShoppingBasket',
  },
  recipes: {
    name: 'Recipes',
    description: 'Manage recipes and automatically deduct ingredients',
    category: 'essential',
    icon: 'Book',
  },
  shoppingLists: {
    name: 'Shopping Lists',
    description: 'Create and manage shopping lists',
    category: 'essential',
    icon: 'ShoppingCart',
  },
  mealPlanner: {
    name: 'Meal Planner',
    description: 'Plan meals for the week with a calendar view',
    category: 'essential',
    icon: 'Calendar',
  },
  tasks: {
    name: 'Tasks & Chores',
    description: 'Manage household tasks with a kanban board',
    category: 'essential',
    icon: 'CheckSquare',
  },
  budget: {
    name: 'Budget & Expenses',
    description: 'Track budgets, expenses, and spending patterns',
    category: 'financial',
    icon: 'DollarSign',
  },
  bills: {
    name: 'Bills & Subscriptions',
    description: 'Manage recurring bills and subscriptions',
    category: 'financial',
    icon: 'CreditCard',
  },
  maintenance: {
    name: 'Home Maintenance',
    description: 'Schedule and track home maintenance tasks',
    category: 'maintenance',
    icon: 'Wrench',
  },
  inventory: {
    name: 'Household Inventory',
    description: 'Track valuable items and important documents',
    category: 'organization',
    icon: 'Package',
  },
  familyCalendar: {
    name: 'Family Calendar',
    description: 'Shared family calendar for appointments and events',
    category: 'organization',
    icon: 'CalendarDays',
  },
  health: {
    name: 'Health & Medications',
    description: 'Track medications, appointments, and health records',
    category: 'health',
    icon: 'Heart',
  },
  vehicles: {
    name: 'Vehicle Management',
    description: 'Track vehicle maintenance and expenses',
    category: 'maintenance',
    icon: 'Car',
  },
  pets: {
    name: 'Pet Care',
    description: 'Manage pet health, appointments, and supplies',
    category: 'health',
    icon: 'PawPrint',
  },
  documents: {
    name: 'Document Vault',
    description: 'Securely store important documents',
    category: 'organization',
    icon: 'FileText',
  },
  cleaning: {
    name: 'Cleaning Schedule',
    description: 'Room-by-room cleaning checklists and schedules',
    category: 'maintenance',
    icon: 'Sparkles',
  },
  unifiedCalendar: {
    name: 'Unified Calendar',
    description: 'View all events from organizations and home in one place',
    category: 'organization',
    icon: 'CalendarRange',
  },
};

