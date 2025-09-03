import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Calendar,
  Clock,
  Zap,
  Database,
  HardDrive,
  Globe,
  Code,
  Shield,
  Activity,
  BarChart,
  PieChart,
  TrendingUp as TrendingUpIcon,
  Settings,
  Lightbulb,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { costManagementService, UsageMetrics, CostAlert } from '../../services/costManagementService';
import { useAdmin } from '../../contexts/AdminContext';
import systemMonitorService from '../../services/systemMonitorService';
import { UserRole } from '../../services/authService';

interface CostManagementProps {
  className?: string;
}

const CostManagement: React.FC<CostManagementProps> = ({ className = '' }) => {
  const { state } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [currentUsage, setCurrentUsage] = useState<UsageMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<UsageMetrics[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [firebaseEstimate, setFirebaseEstimate] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [error, setError] = useState<string | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'alerts' | 'optimization'>('overview');

  useEffect(() => {
    // Load cost data for admin users (ADMIN and ROOT roles)
    if (state.currentUser?.isAdmin || state.currentUser?.role === UserRole.ADMIN || state.currentUser?.role === UserRole.ROOT) {
      loadCostData();
    }
  }, [state.currentUser]);

  // Check admin access - allow access to ADMIN and ROOT roles
  if (!state.currentUser?.isAdmin && state.currentUser?.role !== UserRole.ADMIN && state.currentUser?.role !== UserRole.ROOT) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access cost management features.</p>
            <p className="text-sm text-gray-500 mt-2">Admin or Root access required</p>
          </div>
        </div>
      </div>
    );
  }

  const loadCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [report, metrics] = await Promise.all([
        costManagementService.instance.getCostReport(),
        systemMonitorService.getSystemMetrics()
      ]);
      
      setCurrentUsage(report.current);
      setHistoricalData(report.historical);
      setAlerts(report.alerts);
      setFirebaseEstimate(report.firebaseEstimate);
      setSystemMetrics(metrics);
    } catch (err) {
      setError('Failed to load cost data. Please try again.');
      console.error('Error loading cost data:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await costManagementService.instance.acknowledgeAlert(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getCostTrend = (current: number, previous: number) => {
    if (previous === 0) return 'neutral';
    return current > previous ? 'up' : current < previous ? 'down' : 'neutral';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cost management data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadCostData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                Cost Management & Analysis
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive monitoring of API usage, infrastructure costs, and optimization recommendations</p>
            </div>
            <button
              onClick={loadCostData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart },
                { id: 'breakdown', label: 'Cost Breakdown', icon: PieChart },
                { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
                { id: 'optimization', label: 'Optimization', icon: Lightbulb }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Cost Alerts */}
            {alerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-red-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Cost Alerts
                </h2>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getAlertColor(alert.type)} flex items-center justify-between`}
                    >
                      <div className="flex items-center">
                        {getAlertIcon(alert.type)}
                        <span className="ml-3 font-medium">{alert.message}</span>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-sm px-3 py-1 bg-white/50 rounded hover:bg-white/70 transition-colors"
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentUsage ? formatCurrency(currentUsage.costs.total.daily) : '$0.00'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Estimate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentUsage ? formatCurrency(currentUsage.costs.total.monthly) : '$0.00'}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentUsage ? Object.values(currentUsage.requests).reduce((sum, count) => sum + count, 0) : 0}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Health</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {systemMetrics ? `${systemMetrics.storagePercentage?.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Cost Targets
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Budget:</span>
                    <span className="text-sm font-medium">$5.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Budget:</span>
                    <span className="text-sm font-medium">$150.00</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((currentUsage?.costs.total.daily || 0) / 5 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUpIcon className="w-5 h-5 mr-2 text-green-600" />
                  Cost Trends
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">vs Yesterday:</span>
                    <div className="flex items-center">
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">+12%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">vs Last Week:</span>
                    <div className="flex items-center">
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-sm font-medium text-red-600">-5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Set Cost Alerts
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Export Report
                  </button>
                  <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Optimize Usage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="space-y-8">
            {/* API Costs Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  API Costs
                </h3>
                <div className="space-y-3">
                  {currentUsage && Object.entries(currentUsage.costs.api).map(([service, cost]) => (
                    <div key={service} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {service.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatCurrency(cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Firebase Infrastructure */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-green-600" />
                  Firebase Infrastructure
                </h3>
                <div className="space-y-3">
                  {firebaseEstimate && Object.entries(firebaseEstimate).map(([service, cost]) => (
                    <div key={service} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-700 capitalize flex items-center">
                        {service === 'firestore' && <Database className="w-4 h-4 mr-2" />}
                        {service === 'storage' && <HardDrive className="w-4 h-4 mr-2" />}
                        {service === 'hosting' && <Globe className="w-4 h-4 mr-2" />}
                        {service === 'functions' && <Code className="w-4 h-4 mr-2" />}
                        {service === 'auth' && <Shield className="w-4 h-4 mr-2" />}
                        {service.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatCurrency(cost as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            {currentUsage && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                  API Usage Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {Object.entries(currentUsage.requests).map(([service, count]) => (
                    <div key={service} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-600 capitalize">
                        {service.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Data Chart */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                Cost Trends (Last 30 Days)
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Chart visualization coming soon</p>
                  <p className="text-sm">Historical data: {historicalData.length} days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Cost Alerts & Notifications
              </h3>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getAlertColor(alert.type)} flex items-center justify-between`}
                    >
                      <div className="flex items-center">
                        {getAlertIcon(alert.type)}
                        <div className="ml-3">
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(alert.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-sm px-3 py-1 bg-white/50 rounded hover:bg-white/70 transition-colors"
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No active cost alerts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                  Optimization Recommendations
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Reduce OpenAI Usage</h4>
                    <p className="text-sm text-blue-700">
                      Consider implementing response caching to reduce API calls by up to 40%.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Optimize Storage</h4>
                    <p className="text-sm text-green-700">
                      Clean up unused files to reduce Firebase Storage costs.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Batch API Calls</h4>
                    <p className="text-sm text-purple-700">
                      Group multiple API requests to reduce overhead costs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-600" />
                  Cost Reduction Targets
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Monthly Cost:</span>
                    <span className="font-medium">{currentUsage ? formatCurrency(currentUsage.costs.total.monthly) : '$0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Monthly Cost:</span>
                    <span className="font-medium text-green-600">$100.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Potential Savings:</span>
                    <span className="font-medium text-green-600">
                      {currentUsage ? formatCurrency(currentUsage.costs.total.monthly - 100) : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CostManagement;
