import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Wallet,
  Banknote,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Target
} from 'lucide-react';
import { 
  FinancialTransaction, 
  TransactionType, 
  TransactionCategory, 
  PaymentMethod,
  TransactionStatus 
} from '../types/finance';
import { financeService } from '../services/financeService';
import { TransactionModal, BudgetManager, FinancialDashboard } from '../components/Finance';
import ReceiptViewer from '../components/Finance/ReceiptViewer';


const AdminFinances: React.FC = () => {
  const { addNotification, state } = useAdmin();
  const { currentUser } = state;
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'reports' | 'analytics'>('dashboard');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Fetch financial data from database
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        
        // Initialize financial system if user is admin
        if (currentUser) {
          await financeService.initializeFinancialSystem(currentUser.uid);
        }
        
        // Fetch transactions
        const transactionsData = await financeService.getTransactions();
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching financial data:', error);
        addNotification('error', 'Error', 'Failed to load financial data');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [currentUser, addNotification]);

  const handleCreateTransaction = () => {
    setModalMode('create');
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setModalMode('edit');
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await financeService.deleteTransaction(transactionId);
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        addNotification('success', 'Transaction Deleted', 'Financial transaction has been successfully deleted.');
      } catch (error) {
        addNotification('error', 'Delete Failed', 'Failed to delete transaction. Please try again.');
      }
    }
  };

  const handleViewReceipts = (transaction: FinancialTransaction) => {
    if (transaction.attachments && transaction.attachments.length > 0) {
      setSelectedReceipts(transaction.attachments);
      setIsReceiptViewerOpen(true);
    } else {
      addNotification('info', 'No Receipts', 'No receipts attached to this transaction.');
    }
  };

  const handleTransactionSuccess = async () => {
    // Refresh transactions after create/update
    try {
      const transactionsData = await financeService.getTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      fundraising: 'bg-orange-100 text-orange-800',
      dues: 'bg-blue-100 text-blue-800',
      camping: 'bg-green-100 text-green-800',
      equipment: 'bg-purple-100 text-purple-800',
      supplies: 'bg-yellow-100 text-yellow-800',
      events: 'bg-pink-100 text-pink-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Financial Management
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Manage pack finances, track transactions, and monitor budgets
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Income</p>
                <p className="text-3xl font-bold">${totalIncome.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                <p className="text-3xl font-bold">${totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Net Balance</p>
                <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  ${netBalance.toLocaleString()}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Budget Used</p>
                <p className="text-3xl font-bold">0%</p>
              </div>
              <PieChart className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-2 mb-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-shrink-0 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-shrink-0 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'transactions'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <Receipt className="w-4 h-4" />
                Transactions
              </div>
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`flex-shrink-0 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'budgets'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <PieChart className="w-4 h-4" />
                Budgets
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-shrink-0 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <Download className="w-4 h-4" />
                Reports
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-shrink-0 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-soft'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </div>
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <FinancialDashboard />
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {/* Controls */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as TransactionType | 'all')}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as TransactionCategory | 'all')}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="dues">Dues</option>
                    <option value="camping">Camping</option>
                    <option value="equipment">Equipment</option>
                    <option value="supplies">Supplies</option>
                    <option value="events">Events</option>
                    <option value="general">General</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as TransactionStatus | 'all')}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateTransaction}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-soft"
                >
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Recent Transactions</h2>
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              transaction.type === 'income' 
                                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            }`}>
                              <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(transaction.type)}`}>
                                  {transaction.type}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(transaction.category)}`}>
                                  {transaction.category}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                                  {transaction.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {transaction.date.toDate().toLocaleDateString()} • {transaction.paymentMethod}
                                {transaction.reference && ` • Ref: ${transaction.reference}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {transaction.attachments && transaction.attachments.length > 0 && (
                                <button
                                  onClick={() => handleViewReceipts(transaction)}
                                  className="text-gray-400 hover:text-green-600 transition-colors p-1"
                                  title="View Receipts"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' 
                        ? 'No transactions match your filters' 
                        : 'No transactions yet'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Add your first transaction to get started'}
                    </p>
                    {!searchTerm && filterType === 'all' && filterCategory === 'all' && filterStatus === 'all' && (
                      <button
                        onClick={handleCreateTransaction}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-soft"
                      >
                        Add Your First Transaction
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Budgets Tab */}
        {activeTab === 'budgets' && (
          <BudgetManager />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Financial Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-soft flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Transactions
                  </button>
                  <button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-soft flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Generate Report
                  </button>
                  <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-soft flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Import Data
                  </button>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total Transactions:</span>
                    <span className="text-sm font-medium text-gray-900">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">This Month:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {transactions.filter(t => t.date.toDate().getMonth() === new Date().getMonth()).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Average Transaction:</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${transactions.length > 0 ? (Math.abs(totalIncome + totalExpenses) / transactions.length).toFixed(2) : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Financial Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Income:</span>
                    <span className="text-sm font-medium text-green-600">${totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Expenses:</span>
                    <span className="text-sm font-medium text-red-600">${totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium text-gray-900">Net:</span>
                    <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${netBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4">Budget Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total Allocated:</span>
                    <span className="text-sm font-medium text-gray-900">$0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Total Spent:</span>
                    <span className="text-sm font-medium text-gray-900">$0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Utilization:</span>
                    <span className="text-sm font-medium text-gray-900">0%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
        mode={modalMode}
        onSuccess={handleTransactionSuccess}
      />

      <ReceiptViewer
        attachments={selectedReceipts}
        isOpen={isReceiptViewerOpen}
        onClose={() => setIsReceiptViewerOpen(false)}
      />
    </div>
  );
};

export default AdminFinances;
