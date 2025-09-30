import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PieChart, 
  BarChart3,
  AlertTriangle,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { FinancialDashboard as FinancialDashboardType, FinancialTransaction } from '../../types/finance';
import { financeService } from '../../services/financeService';

interface FinancialDashboardProps {
  className?: string;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ className = '' }) => {
  const [dashboardData, setDashboardData] = useState<FinancialDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeService.getFinancialDashboard();
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load financial dashboard');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 ${className}`}>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-soft mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(dashboardData.overview.totalBalance)}</p>
            </div>
            <Wallet className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        {/* Monthly Income */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Monthly Income</p>
              <p className="text-3xl font-bold">{formatCurrency(dashboardData.overview.monthlyIncome)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Monthly Expenses</p>
              <p className="text-3xl font-bold">{formatCurrency(dashboardData.overview.monthlyExpenses)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </div>

        {/* Net Income */}
        <div className={`bg-gradient-to-br ${
          dashboardData.overview.netIncome >= 0 
            ? 'from-emerald-500 to-emerald-600' 
            : 'from-red-500 to-red-600'
        } text-white rounded-2xl p-6 shadow-soft`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                dashboardData.overview.netIncome >= 0 ? 'text-emerald-100' : 'text-red-100'
              }`}>
                Net Income
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(dashboardData.overview.netIncome)}
              </p>
            </div>
            {getTrendIcon(dashboardData.overview.netIncome)}
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Budget Utilization</h3>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-bold text-gray-900">
              {formatPercentage(dashboardData.overview.budgetUtilization)}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className={`h-4 rounded-full transition-all duration-300 ${
              dashboardData.overview.budgetUtilization >= 100 
                ? 'bg-red-500' 
                : dashboardData.overview.budgetUtilization >= 90 
                ? 'bg-orange-500' 
                : dashboardData.overview.budgetUtilization >= 75 
                ? 'bg-yellow-500' 
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(dashboardData.overview.budgetUtilization, 100)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData.recentTransactions.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-2">💳</div>
              <p className="text-gray-600">No recent transactions</p>
            </div>
          ) : (
            dashboardData.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}>
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {transaction.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {transaction.date.toDate().toLocaleDateString()} • {transaction.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Budget Alerts */}
      {dashboardData.budgetAlerts.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Budget Alerts
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.budgetAlerts.map((alert) => (
              <div key={alert.id} className={`p-6 ${
                alert.severity === 'high' ? 'bg-red-50' : 
                alert.severity === 'medium' ? 'bg-orange-50' : 'bg-yellow-50'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'high' ? 'text-red-500' : 
                    alert.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      alert.severity === 'high' ? 'text-red-900' : 
                      alert.severity === 'medium' ? 'text-orange-900' : 'text-yellow-900'
                    }`}>
                      {alert.budgetName}
                    </p>
                    <p className={`text-sm ${
                      alert.severity === 'high' ? 'text-red-700' : 
                      alert.severity === 'medium' ? 'text-orange-700' : 'text-yellow-700'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Progress */}
      {dashboardData.goalProgress.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Financial Goals
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dashboardData.goalProgress.map((goal) => (
              <div key={goal.goalId} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{goal.goalName}</h4>
                  <span className="text-sm font-medium text-gray-600">
                    {formatPercentage(goal.progress)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatCurrency(goal.currentAmount)} raised</span>
                  <span>{goal.daysRemaining} days left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Monthly Trends
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.monthlyTrends.slice(-3).map((trend, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{trend.month}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Income:</span>
                    <span className="font-medium text-green-600">{formatCurrency(trend.income)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-medium text-red-600">{formatCurrency(trend.expenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-900">Net:</span>
                    <span className={`font-bold ${getTrendColor(trend.net)}`}>
                      {formatCurrency(trend.net)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
