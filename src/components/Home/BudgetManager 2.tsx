import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  Target,
} from 'lucide-react';
import homeService from '../../services/homeService';
import { Expense, Budget, BudgetCategory, SavingsGoal } from '../../types/home';
import { useToast } from '../../contexts/ToastContext';

const BudgetManager: React.FC = () => {
  const [activeView, setActiveView] = useState<'expenses' | 'budget' | 'goals'>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, budgetData, categoriesData, goalsData] = await Promise.all([
        homeService.getExpenses(selectedMonth),
        homeService.getBudget(selectedMonth),
        homeService.getBudgetCategories(),
        homeService.getSavingsGoals(),
      ]);
      setExpenses(expensesData);
      setBudget(budgetData);
      setCategories(categoriesData);
      setGoals(goalsData);
    } catch (error: any) {
      showError('Failed to load data', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await homeService.deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
      showSuccess('Expense deleted');
    } catch (error: any) {
      showError('Failed to delete expense', error.message);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await homeService.deleteSavingsGoal(id);
      setGoals(goals.filter((g) => g.id !== id));
      showSuccess('Goal deleted');
    } catch (error: any) {
      showError('Failed to delete goal', error.message);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetProgress = budget ? (budget.totalSpent / budget.totalLimit) * 100 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Switcher */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('expenses')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === 'expenses'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveView('budget')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === 'budget'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Budget
            </button>
            <button
              onClick={() => setActiveView('goals')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === 'goals'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Savings Goals
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            {activeView === 'expenses' && (
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Expense
              </button>
            )}
            {activeView === 'goals' && (
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Goal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {activeView === 'expenses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Spent</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">${totalExpenses.toFixed(2)}</p>
          </div>

          {budget && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Budget Remaining</span>
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-800">
                  ${(budget.totalLimit - budget.totalSpent).toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Budget Progress</span>
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-800">{budgetProgress.toFixed(0)}%</p>
                  <p className="text-sm text-gray-600">used</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      budgetProgress > 100
                        ? 'bg-red-500'
                        : budgetProgress > 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Content based on active view */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              categories={categories}
              onEdit={(expense) => {
                setEditingExpense(expense);
                setShowExpenseModal(true);
              }}
              onDelete={handleDeleteExpense}
            />
          )}

          {activeView === 'budget' && (
            <BudgetView budget={budget} categories={categories} selectedMonth={selectedMonth} />
          )}

          {activeView === 'goals' && (
            <GoalsView
              goals={goals}
              onEdit={(goal) => {
                setEditingGoal(goal);
                setShowGoalModal(true);
              }}
              onDelete={handleDeleteGoal}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showExpenseModal && (
          <ExpenseModal
            expense={editingExpense}
            categories={categories}
            onClose={() => {
              setShowExpenseModal(false);
              setEditingExpense(null);
            }}
            onSave={() => {
              loadData();
              setShowExpenseModal(false);
              setEditingExpense(null);
            }}
          />
        )}

        {showGoalModal && (
          <GoalModal
            goal={editingGoal}
            onClose={() => {
              setShowGoalModal(false);
              setEditingGoal(null);
            }}
            onSave={() => {
              loadData();
              setShowGoalModal(false);
              setEditingGoal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Expenses View Component
interface ExpensesViewProps {
  expenses: Expense[];
  categories: BudgetCategory[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, categories, onEdit, onDelete }) => {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No expenses recorded</h3>
        <p className="text-gray-500">Start tracking your expenses this month</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">{expense.description}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {expense.categoryName}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-800">
                  ${expense.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => onEdit(expense)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Budget View Component
interface BudgetViewProps {
  budget: Budget | null;
  categories: BudgetCategory[];
  selectedMonth: string;
}

const BudgetView: React.FC<BudgetViewProps> = ({ budget, categories, selectedMonth }) => {
  if (!budget) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No budget set for this month</h3>
        <p className="text-gray-500">Create a budget to start tracking your spending</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {budget.categories.map((cat) => {
        const progress = cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0;
        return (
          <div key={cat.categoryId} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">{cat.categoryName}</h3>
              <span className="text-sm text-gray-600">
                ${cat.spent.toFixed(2)} / ${cat.limit.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  progress > 100
                    ? 'bg-red-500'
                    : progress > 80
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {progress > 100 ? `${(progress - 100).toFixed(0)}% over budget` : `${(100 - progress).toFixed(0)}% remaining`}
            </p>
          </div>
        );
      })}
    </div>
  );
};

// Goals View Component
interface GoalsViewProps {
  goals: SavingsGoal[];
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, onEdit, onDelete }) => {
  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No savings goals</h3>
        <p className="text-gray-500">Set a savings goal to track your progress</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {goals.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        return (
          <div key={goal.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{goal.name}</h3>
                {goal.description && <p className="text-sm text-gray-600 mt-1">{goal.description}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(goal)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(goal.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-800">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>${goal.currentAmount.toFixed(2)}</span>
                <span>${goal.targetAmount.toFixed(2)}</span>
              </div>
              {goal.deadline && (
                <p className="text-xs text-gray-500 mt-2">
                  Deadline: {new Date(goal.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Expense Modal (simplified version - full implementation would be more complex)
interface ExpenseModalProps {
  expense: Expense | null;
  categories: BudgetCategory[];
  onClose: () => void;
  onSave: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ expense, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    amount: expense?.amount || 0,
    categoryId: expense?.categoryId || '',
    description: expense?.description || '',
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: expense?.paymentMethod || '',
    notes: expense?.notes || '',
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const category = categories.find((c) => c.id === formData.categoryId);
      const expenseData = {
        amount: Number(formData.amount),
        categoryId: formData.categoryId,
        categoryName: category?.name || 'Uncategorized',
        description: formData.description,
        date: new Date(formData.date),
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes || undefined,
      };

      if (expense) {
        await homeService.updateExpense(expense.id, expenseData);
        showSuccess('Expense updated');
      } else {
        await homeService.addExpense(expenseData);
        showSuccess('Expense added');
      }

      onSave();
    } catch (error: any) {
      showError('Failed to save expense', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="What did you buy?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Credit Card, Cash, Debit"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : expense ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Goal Modal (simplified)
interface GoalModalProps {
  goal: SavingsGoal | null;
  onClose: () => void;
  onSave: () => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    targetAmount: goal?.targetAmount || 0,
    currentAmount: goal?.currentAmount || 0,
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
    description: goal?.description || '',
  });
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const goalData = {
        name: formData.name,
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount),
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        description: formData.description || undefined,
      };

      if (goal) {
        await homeService.updateSavingsGoal(goal.id, goalData);
        showSuccess('Goal updated');
      } else {
        await homeService.addSavingsGoal(goalData);
        showSuccess('Goal created');
      }

      onSave();
    } catch (error: any) {
      showError('Failed to save goal', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {goal ? 'Edit Savings Goal' : 'Create Savings Goal'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Emergency Fund, Vacation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.targetAmount || ''}
                  onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentAmount || ''}
                  onChange={(e) => setFormData({ ...formData, currentAmount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {saving ? 'Saving...' : goal ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BudgetManager;

