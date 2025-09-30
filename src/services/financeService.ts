// Finance Service for Pack 1703 Portal
// Comprehensive financial data management and operations

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  FinancialTransaction, 
  BudgetCategory, 
  FinancialAccount,
  FinancialReport,
  FinancialGoal,
  RecurringTransaction,
  FinancialSettings,
  FinancialDashboard,
  FinancialAnalytics,
  TransactionType,
  TransactionCategory,
  PaymentMethod,
  TransactionStatus,
  BudgetPeriod,
  BudgetStatus,
  AccountType,
  AccountStatus,
  GoalType,
  GoalStatus,
  RecurrenceType,
  RecurrenceStatus,
  ExportOptions,
  ImportResult
} from '../types/finance';

class FinanceService {
  private readonly COLLECTIONS = {
    TRANSACTIONS: 'financial-transactions',
    BUDGETS: 'budget-categories',
    ACCOUNTS: 'financial-accounts',
    REPORTS: 'financial-reports',
    GOALS: 'financial-goals',
    RECURRING: 'recurring-transactions',
    SETTINGS: 'financial-settings'
  };

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  async getTransactions(filters?: {
    type?: TransactionType;
    category?: TransactionCategory;
    status?: TransactionStatus;
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<FinancialTransaction[]> {
    try {
      const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
      
      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.startDate) {
        constraints.push(where('date', '>=', Timestamp.fromDate(filters.startDate)));
      }
      if (filters?.endDate) {
        constraints.push(where('date', '<=', Timestamp.fromDate(filters.endDate)));
      }
      if (filters?.limit) {
        constraints.push(limit(filters.limit));
      }

      const q = query(collection(db, this.COLLECTIONS.TRANSACTIONS), ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FinancialTransaction));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  }

  async getTransaction(id: string): Promise<FinancialTransaction | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.TRANSACTIONS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as FinancialTransaction;
      }
      return null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction');
    }
  }

  async createTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanTransaction = Object.fromEntries(
        Object.entries(transaction).filter(([_, value]) => value !== undefined)
      );

      const transactionData = {
        ...cleanTransaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.TRANSACTIONS), transactionData);
      
      // Update account balance if applicable
      if (transaction.accountId) {
        if (transaction.type === 'income') {
          await this.updateAccountBalance(transaction.accountId, transaction.amount, 'credit');
        } else if (transaction.type === 'expense') {
          await this.updateAccountBalance(transaction.accountId, transaction.amount, 'debit');
        }
      } else {
        // If no account specified, use default account
        const accounts = await this.getAccounts();
        const defaultAccount = accounts.find(a => a.name === 'Pack 1703 Main Account') || accounts[0];
        if (defaultAccount) {
          if (transaction.type === 'income') {
            await this.updateAccountBalance(defaultAccount.id, transaction.amount, 'credit');
          } else if (transaction.type === 'expense') {
            await this.updateAccountBalance(defaultAccount.id, transaction.amount, 'debit');
          }
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  async updateTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<void> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const docRef = doc(db, this.COLLECTIONS.TRANSACTIONS, id);
      const updateData = {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      const transaction = await this.getTransaction(id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Reverse account balance if applicable
      if (transaction.accountId) {
        if (transaction.type === 'income') {
          await this.updateAccountBalance(transaction.accountId, transaction.amount, 'debit');
        } else if (transaction.type === 'expense') {
          await this.updateAccountBalance(transaction.accountId, transaction.amount, 'credit');
        }
      } else {
        // If no account specified, use default account
        const accounts = await this.getAccounts();
        const defaultAccount = accounts.find(a => a.name === 'Pack 1703 Main Account') || accounts[0];
        if (defaultAccount) {
          if (transaction.type === 'income') {
            await this.updateAccountBalance(defaultAccount.id, transaction.amount, 'debit');
          } else if (transaction.type === 'expense') {
            await this.updateAccountBalance(defaultAccount.id, transaction.amount, 'credit');
          }
        }
      }

      const docRef = doc(db, this.COLLECTIONS.TRANSACTIONS, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  // ============================================================================
  // BUDGET MANAGEMENT
  // ============================================================================

  async getBudgets(filters?: {
    status?: BudgetStatus;
    fiscalYear?: string;
    isActive?: boolean;
  }): Promise<BudgetCategory[]> {
    try {
      const constraints: QueryConstraint[] = [orderBy('name')];
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.fiscalYear) {
        constraints.push(where('fiscalYear', '==', filters.fiscalYear));
      }
      if (filters?.isActive !== undefined) {
        constraints.push(where('isActive', '==', filters.isActive));
      }

      const q = query(collection(db, this.COLLECTIONS.BUDGETS), ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BudgetCategory));
    } catch (error) {
      console.error('Error fetching budgets:', error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  }

  async createBudget(budget: Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const budgetData = {
        ...budget,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.BUDGETS), budgetData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating budget:', error);
      throw new Error('Failed to create budget');
    }
  }

  async updateBudget(id: string, updates: Partial<BudgetCategory>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.BUDGETS, id);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating budget:', error);
      throw new Error('Failed to update budget');
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.BUDGETS, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw new Error('Failed to delete budget');
    }
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  async getAccounts(): Promise<FinancialAccount[]> {
    try {
      const q = query(collection(db, this.COLLECTIONS.ACCOUNTS), orderBy('name'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FinancialAccount));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  }

  async createAccount(account: Omit<FinancialAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const accountData = {
        ...account,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS.ACCOUNTS), accountData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error('Failed to create account');
    }
  }

  async updateAccount(id: string, updates: Partial<FinancialAccount>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTIONS.ACCOUNTS, id);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating account:', error);
      throw new Error('Failed to update account');
    }
  }

  private async updateAccountBalance(accountId: string, amount: number, type: 'credit' | 'debit'): Promise<void> {
    try {
      const account = await this.getAccount(accountId);
      if (!account) return;

      const adjustment = type === 'credit' ? amount : -amount;
      const newBalance = account.currentBalance + adjustment;
      const newAvailableBalance = account.availableBalance + adjustment;

      await this.updateAccount(accountId, {
        currentBalance: newBalance,
        availableBalance: newAvailableBalance
      });
    } catch (error) {
      console.error('Error updating account balance:', error);
    }
  }

  async getAccount(id: string): Promise<FinancialAccount | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS.ACCOUNTS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as FinancialAccount;
      }
      return null;
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  }

  // ============================================================================
  // FINANCIAL DASHBOARD
  // ============================================================================

  async getFinancialDashboard(): Promise<FinancialDashboard> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Ensure default account exists
      await this.ensureDefaultAccount();

      // Get recent transactions
      const recentTransactions = await this.getTransactions({ limit: 10 });

      // Get all transactions for balance calculation
      const allTransactions = await this.getTransactions();
      const totalIncome = allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Get monthly income and expenses
      const monthlyIncome = await this.getTransactions({
        type: 'income',
        startDate: startOfMonth,
        endDate: endOfMonth
      });
      const monthlyExpenses = await this.getTransactions({
        type: 'expense',
        startDate: startOfMonth,
        endDate: endOfMonth
      });

      const monthlyIncomeTotal = monthlyIncome.reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpensesTotal = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

      // Calculate total balance: starting balance + income - expenses
      const accounts = await this.getAccounts();
      const defaultAccount = accounts.find(a => a.name === 'Pack 1703 Main Account') || accounts[0];
      const startingBalance = defaultAccount?.currentBalance || 10000; // Default $10,000
      const totalBalance = startingBalance + totalIncome - totalExpenses;

      // Get budgets for utilization
      const budgets = await this.getBudgets({ status: 'active' });
      const totalBudgetAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
      const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
      const budgetUtilization = totalBudgetAllocated > 0 ? (totalBudgetSpent / totalBudgetAllocated) * 100 : 0;

      // Get upcoming recurring transactions
      const upcomingRecurring = await this.getUpcomingRecurringTransactions();

      // Get budget alerts
      const budgetAlerts = await this.getBudgetAlerts();

      // Get goal progress
      const goalProgress = await this.getGoalProgress();

      // Get monthly trends
      const monthlyTrends = await this.getMonthlyTrends();

      return {
        overview: {
          totalBalance,
          monthlyIncome: monthlyIncomeTotal,
          monthlyExpenses: monthlyExpensesTotal,
          netIncome: monthlyIncomeTotal - monthlyExpensesTotal,
          budgetUtilization
        },
        recentTransactions,
        upcomingRecurring,
        budgetAlerts,
        goalProgress,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching financial dashboard:', error);
      // Return default dashboard instead of throwing error
      return {
        overview: {
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          netIncome: 0,
          budgetUtilization: 0
        },
        recentTransactions: [],
        upcomingRecurring: [],
        budgetAlerts: [],
        goalProgress: [],
        monthlyTrends: []
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async ensureDefaultAccount(): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        // Create default account with $10,000 starting balance
        await this.createAccount({
          name: 'Pack 1703 Main Account',
          type: 'checking',
          currentBalance: 10000,
          availableBalance: 10000,
          startingBalance: 10000,
          status: 'active',
          isDefault: true,
          notes: 'Main checking account for Pack 1703 operations',
          bankName: 'Pack 1703',
          accountNumber: 'PACK1703-001',
          routingNumber: '000000000',
          createdBy: 'system'
        });
      }
    } catch (error) {
      console.error('Error ensuring default account:', error);
    }
  }

  private async getUpcomingRecurringTransactions(): Promise<RecurringTransaction[]> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, this.COLLECTIONS.RECURRING),
        where('status', '==', 'active'),
        where('nextDueDate', '<=', Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))), // Next 30 days
        orderBy('nextDueDate')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as RecurringTransaction));
    } catch (error) {
      console.error('Error fetching upcoming recurring transactions:', error);
      return [];
    }
  }

  private async getBudgetAlerts(): Promise<any[]> {
    try {
      const budgets = await this.getBudgets({ status: 'active' });
      const alerts = [];

      for (const budget of budgets) {
        const utilization = (budget.spent / budget.allocated) * 100;
        
        if (utilization >= 100) {
          alerts.push({
            id: `over-budget-${budget.id}`,
            budgetId: budget.id,
            budgetName: budget.name,
            type: 'over_budget',
            message: `${budget.name} is over budget by $${(budget.spent - budget.allocated).toLocaleString()}`,
            severity: 'high' as const,
            createdAt: Timestamp.now()
          });
        } else if (utilization >= 90) {
          alerts.push({
            id: `near-limit-${budget.id}`,
            budgetId: budget.id,
            budgetName: budget.name,
            type: 'near_limit',
            message: `${budget.name} is at ${utilization.toFixed(1)}% of budget`,
            severity: 'medium' as const,
            createdAt: Timestamp.now()
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
      return [];
    }
  }

  private async getGoalProgress(): Promise<any[]> {
    try {
      const q = query(collection(db, this.COLLECTIONS.GOALS), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data() as FinancialGoal;
        const now = new Date();
        const targetDate = data.targetDate.toDate();
        const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          goalId: doc.id,
          goalName: data.name,
          currentAmount: data.currentAmount,
          targetAmount: data.targetAmount,
          progress: (data.currentAmount / data.targetAmount) * 100,
          daysRemaining: Math.max(0, daysRemaining)
        };
      });
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      return [];
    }
  }

  private async getMonthlyTrends(): Promise<any[]> {
    try {
      const trends = [];
      const now = new Date();
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthTransactions = await this.getTransactions({
          startDate: startOfMonth,
          endDate: endOfMonth
        });
        
        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        trends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          income,
          expenses,
          net: income - expenses
        });
      }
      
      return trends;
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      return [];
    }
  }

  // ============================================================================
  // INITIALIZATION & SETUP
  // ============================================================================

  async initializeFinancialSystem(userId: string): Promise<void> {
    try {
      // Create default account if none exists
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        await this.createAccount({
          name: 'Pack 1703 Main Account',
          type: 'checking',
          currentBalance: 10000, // Starting with $10,000 as requested
          availableBalance: 10000,
          startingBalance: 10000,
          status: 'active',
          isDefault: true,
          createdBy: userId
        });
      }

      // Create default budgets if none exist
      const budgets = await this.getBudgets();
      if (budgets.length === 0) {
        const defaultBudgets = [
          {
            name: 'Camping & Events',
            category: 'camping' as TransactionCategory,
            allocated: 3000,
            spent: 0,
            committed: 0,
            remaining: 3000,
            period: 'yearly' as BudgetPeriod,
            startDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 0, 1)),
            endDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 11, 31)),
            fiscalYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            status: 'active' as BudgetStatus,
            isRecurring: true,
            createdBy: userId
          },
          {
            name: 'Equipment & Supplies',
            category: 'equipment' as TransactionCategory,
            allocated: 2000,
            spent: 0,
            committed: 0,
            remaining: 2000,
            period: 'yearly' as BudgetPeriod,
            startDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 0, 1)),
            endDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 11, 31)),
            fiscalYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            status: 'active' as BudgetStatus,
            isRecurring: true,
            createdBy: userId
          },
          {
            name: 'Fundraising',
            category: 'fundraising' as TransactionCategory,
            allocated: 1500,
            spent: 0,
            committed: 0,
            remaining: 1500,
            period: 'yearly' as BudgetPeriod,
            startDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 0, 1)),
            endDate: Timestamp.fromDate(new Date(new Date().getFullYear(), 11, 31)),
            fiscalYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            status: 'active' as BudgetStatus,
            isRecurring: true,
            createdBy: userId
          }
        ];

        for (const budget of defaultBudgets) {
          await this.createBudget(budget);
        }
      }
    } catch (error) {
      console.error('Error initializing financial system:', error);
      throw new Error('Failed to initialize financial system');
    }
  }
}

export const financeService = new FinanceService();
