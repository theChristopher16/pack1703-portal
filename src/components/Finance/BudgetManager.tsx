import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react';
import { BudgetCategory, BudgetPeriod, BudgetStatus, TransactionCategory } from '../../types/finance';
import { financeService } from '../../services/financeService';
import { useAdmin } from '../../contexts/AdminContext';

interface BudgetManagerProps {
  className?: string;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ className = '' }) => {
  const { state } = useAdmin();
  const { currentUser } = state;
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const budgetsData = await financeService.getBudgets({ status: 'active' });
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEditBudget = (budget: BudgetCategory) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (window.confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
      try {
        await financeService.deleteBudget(budgetId);
        await fetchBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetStatusIcon = (budget: BudgetCategory) => {
    const utilization = (budget.spent / budget.allocated) * 100;
    
    if (utilization >= 100) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else if (utilization >= 90) {
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    } else {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading budgets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Budget Management</h2>
            <p className="text-gray-600 mt-1">Track and manage your pack's budget allocations</p>
          </div>
          <button
            onClick={handleCreateBudget}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-soft"
          >
            <Plus className="w-4 h-4" />
            Add Budget
          </button>
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="p-6">
        {budgets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No budgets yet</h3>
            <p className="text-gray-600 mb-6">Create your first budget to start tracking expenses</p>
            <button
              onClick={handleCreateBudget}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const utilization = (budget.spent / budget.allocated) * 100;
              const remaining = budget.allocated - budget.spent - budget.committed;

              return (
                <div key={budget.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors duration-200">
                  {/* Budget Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getBudgetStatusIcon(budget)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{budget.category.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Budget Amounts */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Allocated:</span>
                      <span className="font-medium text-gray-900">${budget.allocated.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Spent:</span>
                      <span className="font-medium text-red-600">${budget.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Committed:</span>
                      <span className="font-medium text-orange-600">${budget.committed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">Remaining:</span>
                      <span className={`font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Usage:</span>
                      <span className={`text-sm font-medium ${getProgressTextColor(utilization)}`}>
                        {Math.round(utilization)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getProgressColor(utilization)} transition-all duration-300`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Budget Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{budget.fiscalYear}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="w-4 h-4" />
                      <span className="capitalize">{budget.period}</span>
                    </div>
                  </div>

                  {/* Budget Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 shadow-soft">
                      View Details
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 shadow-soft">
                      Add Expense
                    </button>
                  </div>

                  {/* Budget Alerts */}
                  {utilization >= 90 && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      utilization >= 100 
                        ? 'bg-red-50 border border-red-200' 
                        : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${
                          utilization >= 100 ? 'text-red-600' : 'text-orange-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          utilization >= 100 ? 'text-red-700' : 'text-orange-700'
                        }`}>
                          {utilization >= 100 
                            ? 'Over budget!' 
                            : 'Approaching budget limit'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Summary */}
      {budgets.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${budgets.reduce((sum, b) => sum + b.allocated, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Allocated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                ${budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                ${budgets.reduce((sum, b) => sum + b.committed, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Committed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${budgets.reduce((sum, b) => sum + (b.allocated - b.spent - b.committed), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-lg w-full border border-white/50 shadow-soft">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </h3>
              <p className="text-gray-600 mb-6">
                Budget creation/editing form will be implemented here.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-soft"
                >
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
