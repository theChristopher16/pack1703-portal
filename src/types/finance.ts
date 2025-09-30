// Financial Data Models for Pack 1703 Portal
// Comprehensive financial tracking and management system

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// FINANCIAL TRANSACTIONS
// ============================================================================

export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';
export type TransactionCategory = 
  | 'fundraising' 
  | 'dues' 
  | 'camping' 
  | 'equipment' 
  | 'supplies' 
  | 'events' 
  | 'food' 
  | 'transportation'
  | 'insurance'
  | 'training'
  | 'awards'
  | 'administrative'
  | 'bank_fees'
  | 'refund'
  | 'donation'
  | 'general';

export type PaymentMethod = 'cash' | 'check' | 'card' | 'online' | 'transfer' | 'paypal' | 'venmo' | 'other';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'reconciled';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number; // Always positive, use type to determine income/expense
  description: string;
  date: Timestamp;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  reference?: string; // Check number, transaction ID, etc.
  notes?: string;
  tags?: string[]; // Additional categorization
  attachments?: string[]; // URLs to receipts, documents
  accountId?: string; // Associated account ID
  createdBy: string; // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedBy?: string; // User ID of approver
  approvedAt?: Timestamp;
  reconciledBy?: string; // User ID who reconciled
  reconciledAt?: Timestamp;
}

// ============================================================================
// BUDGET MANAGEMENT
// ============================================================================

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type BudgetStatus = 'active' | 'inactive' | 'archived' | 'draft';

export interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  category: TransactionCategory;
  allocated: number; // Budgeted amount
  spent: number; // Actual spent amount
  committed: number; // Committed but not yet spent
  remaining: number; // Calculated: allocated - spent - committed
  period: BudgetPeriod;
  startDate: Timestamp;
  endDate: Timestamp;
  fiscalYear: string; // e.g., "2025-2026"
  status: BudgetStatus;
  isRecurring: boolean;
  parentCategoryId?: string; // For sub-categories
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// ACCOUNT MANAGEMENT
// ============================================================================

export type AccountType = 'checking' | 'savings' | 'money_market' | 'cd' | 'investment' | 'petty_cash';
export type AccountStatus = 'active' | 'inactive' | 'closed';

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  bankName?: string;
  accountNumber?: string; // Masked for security
  routingNumber?: string; // Masked for security
  currentBalance: number;
  availableBalance: number; // Balance minus pending transactions
  startingBalance: number; // Balance when account was added
  status: AccountStatus;
  isDefault: boolean; // Default account for transactions
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

export interface FinancialReport {
  id: string;
  name: string;
  type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'budget_variance' | 'custom';
  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  generatedBy: string;
  generatedAt: Timestamp;
  data: ReportData;
  isPublic: boolean; // Can be shared with non-admins
  notes?: string;
}

export interface ReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  categories: CategorySummary[];
  trends: TrendData[];
  comparisons?: ComparisonData[];
}

export interface CategorySummary {
  category: TransactionCategory;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface TrendData {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

export interface ComparisonData {
  name: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

// ============================================================================
// FINANCIAL GOALS & TARGETS
// ============================================================================

export type GoalType = 'savings' | 'fundraising' | 'expense_reduction' | 'debt_payoff';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface FinancialGoal {
  id: string;
  name: string;
  description?: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  startDate: Timestamp;
  targetDate: Timestamp;
  status: GoalStatus;
  progress: number; // Percentage complete
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// RECURRING TRANSACTIONS
// ============================================================================

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type RecurrenceStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface RecurringTransaction {
  id: string;
  name: string;
  description?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  recurrence: RecurrenceType;
  interval: number; // Every X days/weeks/months
  startDate: Timestamp;
  endDate?: Timestamp;
  nextDueDate: Timestamp;
  status: RecurrenceStatus;
  isAutomatic: boolean; // Auto-create transactions
  paymentMethod: PaymentMethod;
  tags?: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// FINANCIAL SETTINGS & CONFIGURATION
// ============================================================================

export interface FinancialSettings {
  id: string;
  defaultAccount: string; // Account ID
  currency: string; // Default: 'USD'
  fiscalYearStart: number; // Month (1-12)
  requireApproval: boolean; // Require approval for transactions over threshold
  approvalThreshold: number; // Amount requiring approval
  autoReconcile: boolean; // Automatically reconcile transactions
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackup?: Timestamp;
  notifications: {
    budgetAlerts: boolean;
    lowBalanceAlerts: boolean;
    largeTransactionAlerts: boolean;
    goalProgressAlerts: boolean;
  };
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// FINANCIAL DASHBOARD DATA
// ============================================================================

export interface FinancialDashboard {
  overview: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netIncome: number;
    budgetUtilization: number;
  };
  recentTransactions: FinancialTransaction[];
  upcomingRecurring: RecurringTransaction[];
  budgetAlerts: BudgetAlert[];
  goalProgress: GoalProgress[];
  monthlyTrends: MonthlyTrend[];
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  type: 'over_budget' | 'near_limit' | 'unusual_spending';
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Timestamp;
}

export interface GoalProgress {
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  progress: number;
  daysRemaining: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

// ============================================================================
// FINANCIAL ANALYTICS
// ============================================================================

export interface FinancialAnalytics {
  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  metrics: {
    totalTransactions: number;
    averageTransactionSize: number;
    largestTransaction: number;
    mostActiveCategory: TransactionCategory;
    cashFlowTrend: 'increasing' | 'decreasing' | 'stable';
    budgetEfficiency: number; // Percentage of budget used effectively
  };
  insights: string[]; // AI-generated insights
  recommendations: string[]; // AI-generated recommendations
}

// ============================================================================
// EXPORT/IMPORT TYPES
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dateRange: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  includeCategories: TransactionCategory[];
  includeAccounts: string[];
  includeAttachments: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ImportError[];
  summary: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  data: any;
}
