/**
 * Smart Shopping System
 * 
 * Enables automatic shopping cart management with multiple providers.
 * Integrates with grocery inventory to auto-add low-stock items.
 */

export type ShoppingProvider = 'amazon' | 'walmart' | 'target' | 'instacart' | 'costco' | 'custom';

export interface ShoppingProviderConfig {
  id: string;
  userId: string;
  householdId: string;
  provider: ShoppingProvider;
  providerName: string; // Display name
  isEnabled: boolean;
  isPrimary: boolean;
  accountLinked: boolean;
  accountEmail?: string;
  // API credentials (stored securely)
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    partnerTag?: string; // For Amazon Associates
    customApiUrl?: string;
  };
  preferences: {
    autoAddToCart: boolean;
    preferredCategories?: string[];
    maxPriceThreshold?: number; // Only auto-add if price below threshold
    minStockThreshold?: number; // Trigger auto-add when stock falls below this
    substituteAllowed: boolean; // Allow substitutes for out-of-stock items
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingCartItem {
  id: string;
  householdId: string;
  productId: string; // Provider's product ID
  provider: ShoppingProvider;
  name: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number; // For showing discounts
  quantity: number;
  unit?: string; // oz, lb, count, etc.
  category?: string;
  // Link to grocery item if auto-added
  groceryItemId?: string;
  isAutoAdded: boolean; // Was it automatically added?
  addedBy: string; // userId
  addedAt: Date;
  // Product details
  details: {
    size?: string;
    weight?: string;
    dimensions?: string;
    ingredients?: string[];
    nutrition?: Record<string, any>;
    rating?: number;
    reviewCount?: number;
    availability: 'in_stock' | 'out_of_stock' | 'limited' | 'pre_order';
    estimatedDelivery?: Date;
  };
  notes?: string;
}

export interface ShoppingCart {
  id: string;
  householdId: string;
  items: ShoppingCartItem[];
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  primaryProvider: ShoppingProvider;
  // Grouped by provider for multi-provider carts
  itemsByProvider: Record<ShoppingProvider, ShoppingCartItem[]>;
  updatedAt: Date;
}

export interface ProductSearchResult {
  productId: string;
  provider: ShoppingProvider;
  name: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'pre_order';
  category?: string;
  url: string; // Deep link to product page
}

export interface OrderHistory {
  id: string;
  householdId: string;
  provider: ShoppingProvider;
  orderId: string; // Provider's order ID
  orderDate: Date;
  deliveryDate?: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  items: ShoppingCartItem[];
  total: number;
  trackingNumber?: string;
  trackingUrl?: string;
}

/**
 * Amazon Product Advertising API Configuration
 * https://webservices.amazon.com/paapi5/documentation/
 */
export interface AmazonPAAPIConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string; // Associate tracking ID
  region: 'us-east-1' | 'eu-west-1' | 'us-west-2' | 'ap-northeast-1';
  marketplace: 'www.amazon.com' | 'www.amazon.co.uk' | 'www.amazon.de' | 'www.amazon.co.jp';
}

/**
 * Auto-shopping rules
 */
export interface AutoShoppingRule {
  id: string;
  householdId: string;
  groceryItemId: string;
  groceryItemName: string;
  isEnabled: boolean;
  trigger: {
    type: 'low_stock' | 'out_of_stock' | 'schedule';
    stockThreshold?: number; // For low_stock trigger
    scheduleFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly'; // For schedule trigger
    nextRunDate?: Date;
  };
  productMapping: {
    provider: ShoppingProvider;
    productId: string;
    productName: string;
    quantityToOrder: number;
  };
  lastTriggered?: Date;
  timesTriggered: number;
  createdAt: Date;
  updatedAt: Date;
}

export const SUPPORTED_PROVIDERS: { value: ShoppingProvider; label: string; icon: string }[] = [
  { value: 'amazon', label: 'Amazon', icon: '📦' },
  { value: 'walmart', label: 'Walmart', icon: '🛒' },
  { value: 'target', label: 'Target', icon: '🎯' },
  { value: 'instacart', label: 'Instacart', icon: '🥕' },
  { value: 'costco', label: 'Costco', icon: '🏪' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

