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

