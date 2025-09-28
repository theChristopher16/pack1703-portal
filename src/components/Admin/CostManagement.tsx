import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Zap,
  Database,
  Globe,
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
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { costManagementService, UsageMetrics, CostAlert } from '../../services/costManagementService';
import { useAdmin } from '../../contexts/AdminContext';
import systemMonitorService from '../../services/systemMonitorService';
import { useToast } from '../../contexts/ToastContext';
import { googleCloudBillingService, BillingData } from '../../services/googleCloudBillingService';

interface CostManagementProps {
  className?: string;
}

const CostManagement: React.FC<CostManagementProps> = ({ className = '' }) => {
  const { state } = useAdmin();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentUsage, setCurrentUsage] = useState<UsageMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<UsageMetrics[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [firebaseEstimate, setFirebaseEstimate] = useState<any>(null);
  const [gcpEstimate, setGcpEstimate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'alerts' | 'optimization'>('overview');
  const [realApiStats, setRealApiStats] = useState<any>(null);
  const [billingData, setBillingData] = useState<BillingData | null>(null);

  useEffect(() => {
    // Load cost data for admin users (admin, root and super-admin roles)
    if (state.currentUser?.isAdmin || state.currentUser?.role === 'super-admin' || state.currentUser?.role === 'content-admin') {
      loadCostData();
    }
  }, [state.currentUser]);

  // Check admin access - show toast and redirect if not authorized
  useEffect(() => {
    if (!state.currentUser?.isAdmin && state.currentUser?.role !== 'super-admin' && state.currentUser?.role !== 'content-admin') {
      showError('Access Denied', 'You don\'t have permission to access cost management features. Admin or Root access required.');
      // Redirect to admin dashboard after showing toast
      setTimeout(() => {
        window.history.back();
      }, 2000);
    }
  }, [state.currentUser, showError]);

  // Don't render if user doesn't have access
  if (!state.currentUser?.isAdmin && state.currentUser?.role !== 'root' && state.currentUser?.role !== 'super-admin' && state.currentUser?.role !== 'content-admin') {
    return null;
  }

  const loadCostData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading cost data...');

      const [report, metrics, apiStats, billing, smartAlerts] = await Promise.all([
        costManagementService.instance.getCostReport(),
        systemMonitorService.getSystemMetrics(),
        costManagementService.instance.getRealApiUsageStats(),
        googleCloudBillingService.getCurrentMonthCosts().catch(err => {
          console.warn('Failed to fetch billing data:', err);
          return null;
        }),
        costManagementService.instance.getSmartCostAlerts()
      ]);
      
      console.log('📊 Cost data loaded:', {
        report: report.current,
        apiStats,
        billing,
        smartAlerts: smartAlerts.length
      });
      
      setCurrentUsage(report.current);
      setHistoricalData(report.historical);
      setAlerts(smartAlerts.length > 0 ? smartAlerts : report.alerts);
      setFirebaseEstimate(report.firebaseEstimate);
      setGcpEstimate(report.gcpEstimate);
      setSystemMetrics(metrics);
      setRealApiStats(apiStats);
      setBillingData(billing);

      // Create new alerts based on current usage
      await costManagementService.instance.createAndSaveAlerts();
      
      console.log('✅ Cost data loading complete');
    } catch (err) {
      setError('Failed to load cost data. Please try again.');
      console.error('❌ Error loading cost data:', err);
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
                <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  ✨ UPDATED - Real Data
                </span>
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  📊 Live Tracking
                </span>
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
                      className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          {getAlertIcon(alert.type)}
                          <div className="ml-3 flex-1">
                            <p className="font-medium">{alert.message}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm">
                              <span className="text-gray-600">
                                Threshold: {formatCurrency(alert.threshold)}
                              </span>
                              <span className="text-gray-600">
                                Current: {formatCurrency(alert.current)}
                              </span>
                              <span className="text-gray-500">
                                {new Date(alert.date).toLocaleDateString()}
                              </span>
                            </div>
                            {alert.current > alert.threshold && (
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    alert.type === 'critical' ? 'bg-red-600' : 'bg-yellow-600'
                                  }`}
                                  style={{ 
                                    width: `${Math.min((alert.current / alert.threshold) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-sm px-3 py-1 bg-white/50 rounded hover:bg-white/70 transition-colors ml-4"
                        >
                          Acknowledge
                        </button>
                      </div>
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
                      {billingData ? formatCurrency(billingData.totalCost / 30) : 
                       currentUsage ? formatCurrency(currentUsage.costs.total.daily) : '$0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {billingData ? 'Based on monthly billing data' : 'Estimated from usage'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {billingData ? formatCurrency(billingData.totalCost) : 
                       currentUsage ? formatCurrency(currentUsage.costs.total.monthly) : '$0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {billingData ? 'Real billing data' : 'Estimated from usage'}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">API Requests (7 days)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {realApiStats ? Object.values(realApiStats).reduce((sum: number, stats: any) => sum + (stats.requests || 0), 0) : 
                       currentUsage ? Object.values(currentUsage.requests).reduce((sum, count) => sum + count, 0) : 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {realApiStats ? 'Real usage data' : 'Estimated from tracking'}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* External API Costs */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-600" />
                  External APIs
                </h3>
                <div className="space-y-3">
                  {currentUsage && Object.entries(currentUsage.costs.api).map(([service, cost]) => (
                    <div key={service} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {service === 'googleMaps' && '🗺️ Google Maps'}
                        {service === 'googlePlaces' && '🏢 Google Places'}
                        {service === 'openWeather' && '🌤️ OpenWeather'}
                        {service === 'phoneValidation' && '📞 Phone Validation'}
                        {service === 'tenor' && '🎬 Tenor GIFs'}
                        {service === 'gemini' && '🤖 Gemini AI'}
                        {service === 'emailService' && '📧 Email Service'}
                        {service === 'openai' && '🧠 OpenAI'}
                        {!['googleMaps', 'googlePlaces', 'openWeather', 'phoneValidation', 'tenor', 'gemini', 'emailService', 'openai'].includes(service) && service.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatCurrency(cost as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Firebase Infrastructure */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-green-600" />
                  Firebase Services
                </h3>
                <div className="space-y-3">
                  {firebaseEstimate && Object.entries(firebaseEstimate).map(([service, cost]) => (
                    <div key={service} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-700 capitalize flex items-center">
                        {service === 'firestore' && '📊 Firestore'}
                        {service === 'storage' && '💾 Storage'}
                        {service === 'hosting' && '🌐 Hosting'}
                        {service === 'functions' && '⚡ Functions'}
                        {service === 'auth' && '🔐 Auth'}
                        {service === 'appCheck' && '🛡️ App Check'}
                        {service === 'analytics' && '📈 Analytics'}
                        {!['firestore', 'storage', 'hosting', 'functions', 'auth', 'appCheck', 'analytics'].includes(service) && service.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatCurrency(cost as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Cloud Platform Services */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-purple-600" />
                  GCP Services
                </h3>
                <div className="space-y-3">
                  {gcpEstimate && Object.entries(gcpEstimate).map(([service, cost]) => (
                    <div key={service} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-700 capitalize flex items-center">
                        {service === 'secretManager' && '🔑 Secret Manager'}
                        {service === 'monitoring' && '📊 Monitoring'}
                        {service === 'logging' && '📝 Logging'}
                        {service === 'scheduler' && '⏰ Scheduler'}
                        {service === 'pubsub' && '📡 Pub/Sub'}
                        {!['secretManager', 'monitoring', 'logging', 'scheduler', 'pubsub'].includes(service) && service.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-mono text-gray-900">
                        {formatCurrency(cost as number)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Real API Usage Statistics */}
            {realApiStats && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-600" />
                  Real API Usage (Last 7 Days)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {Object.entries(realApiStats).map(([service, stats]: [string, any]) => (
                    <div key={service} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{stats.requests || 0}</div>
                      <div className="text-xs text-gray-600 mb-1">
                        {service === 'googleMaps' && '🗺️ Google Maps'}
                        {service === 'googlePlaces' && '🏢 Google Places'}
                        {service === 'openWeather' && '🌤️ OpenWeather'}
                        {service === 'phoneValidation' && '📞 Phone Validation'}
                        {service === 'tenor' && '🎬 Tenor GIFs'}
                        {service === 'gemini' && '🤖 Gemini AI'}
                        {service === 'emailService' && '📧 Email Service'}
                        {!['googleMaps', 'googlePlaces', 'openWeather', 'phoneValidation', 'tenor', 'gemini', 'emailService'].includes(service) && service}
                      </div>
                      <div className="text-xs font-medium text-green-600">
                        {formatCurrency(stats.cost || 0)}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                        stats.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {stats.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Firebase/GCP Operations */}
            {currentUsage && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-600" />
                  Firebase/GCP Operations
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-900">{currentUsage.requests.firestoreReads || 0}</div>
                    <div className="text-xs text-blue-700">📖 Firestore Reads</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-900">{currentUsage.requests.firestoreWrites || 0}</div>
                    <div className="text-xs text-green-700">✍️ Firestore Writes</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-900">{currentUsage.requests.firestoreDeletes || 0}</div>
                    <div className="text-xs text-red-700">🗑️ Firestore Deletes</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-900">{currentUsage.requests.functionInvocations || 0}</div>
                    <div className="text-xs text-yellow-700">⚡ Function Calls</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-900">{currentUsage.requests.storageOperations || 0}</div>
                    <div className="text-xs text-purple-700">💾 Storage Ops</div>
                  </div>
                </div>
              </div>
            )}

            {/* Google Cloud Billing Data */}
            {billingData && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-600" />
                  Google Cloud Billing (Current Month)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">Total Monthly Cost</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(billingData.totalCost)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {billingData.services.map((service) => (
                        <div key={service.serviceId} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">
                            {service.serviceName}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-mono text-gray-900">
                              {formatCurrency(service.cost)}
                            </span>
                            <div className="text-xs text-gray-500">
                              {service.usage.amount.toLocaleString()} {service.usage.unit}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                    <div className="space-y-3">
                      {billingData.services
                        .sort((a, b) => b.cost - a.cost)
                        .slice(0, 5)
                        .map((service) => {
                          const percentage = (service.cost / billingData.totalCost) * 100;
                          return (
                            <div key={service.serviceId} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">{service.serviceName}</span>
                                <span className="font-mono text-gray-900">{formatCurrency(service.cost)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {percentage.toFixed(1)}% of total
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Historical Data Chart */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                Cost Trends (Last 30 Days)
              </h3>
              <div className="h-64">
                {historicalData && historicalData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                      <Line 
                        type="monotone" 
                        dataKey="totalCost" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No historical data available</p>
                      <p className="text-sm text-gray-400">Data will appear as usage is tracked</p>
                    </div>
                  </div>
                )}
                {billingData && (
                  <p className="text-sm text-blue-600 mt-2 text-center">
                    Real billing data: {formatCurrency(billingData.totalCost)} this month
                  </p>
                )}
              </div>
            </div>

            {/* Cost Distribution Pie Chart */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                Cost Distribution
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  {billingData && billingData.services && billingData.services.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={billingData.services.map((service, index) => ({
                            name: service.serviceName,
                            value: service.cost,
                            fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8]
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={false}
                        >
                          {billingData.services.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No cost data available</p>
                        <p className="text-sm text-gray-400">Cost distribution will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Service Breakdown</h4>
                  {billingData && billingData.services ? (
                    billingData.services.map((service, index) => (
                      <div key={service.serviceId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8] }}
                          ></div>
                          <span className="text-sm text-gray-700">{service.serviceName}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(service.cost)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <p>No service data available</p>
                    </div>
                  )}
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
                      className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          {getAlertIcon(alert.type)}
                          <div className="ml-3 flex-1">
                            <p className="font-medium">{alert.message}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm">
                              <span className="text-gray-600">
                                Threshold: {formatCurrency(alert.threshold)}
                              </span>
                              <span className="text-gray-600">
                                Current: {formatCurrency(alert.current)}
                              </span>
                              <span className="text-gray-500">
                                {new Date(alert.date).toLocaleDateString()}
                              </span>
                            </div>
                            {alert.current > alert.threshold && (
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    alert.type === 'critical' ? 'bg-red-600' : 'bg-yellow-600'
                                  }`}
                                  style={{ 
                                    width: `${Math.min((alert.current / alert.threshold) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-sm px-3 py-1 bg-white/50 rounded hover:bg-white/70 transition-colors ml-4"
                        >
                          Acknowledge
                        </button>
                      </div>
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
                    <h4 className="font-medium text-blue-900 mb-2">🤖 Optimize AI Usage</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Current Gemini usage can be optimized with response caching and prompt optimization.
                    </p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• Implement response caching for common queries</li>
                      <li>• Use shorter, more focused prompts</li>
                      <li>• Batch similar requests together</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">🗺️ Reduce Google Maps Costs</h4>
                    <p className="text-sm text-green-700 mb-2">
                      Google Maps API is the highest cost service. Optimize usage patterns.
                    </p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• Cache location data for 24 hours</li>
                      <li>• Use static maps for non-interactive displays</li>
                      <li>• Implement client-side geocoding caching</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">📊 Optimize Firebase Usage</h4>
                    <p className="text-sm text-purple-700 mb-2">
                      Reduce Firestore read/write operations through better data structure.
                    </p>
                    <ul className="text-xs text-purple-600 space-y-1">
                      <li>• Implement pagination for large collections</li>
                      <li>• Use composite indexes efficiently</li>
                      <li>• Batch write operations</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">⚡ Function Optimization</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      Reduce Cloud Function invocations and execution time.
                    </p>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      <li>• Combine related operations</li>
                      <li>• Use background functions for non-urgent tasks</li>
                      <li>• Optimize function cold starts</li>
                    </ul>
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
                    <span className="font-medium text-green-600">$200.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Potential Savings:</span>
                    <span className="font-medium text-green-600">
                      {currentUsage ? formatCurrency(Math.max(0, currentUsage.costs.total.monthly - 200)) : '$0.00'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min((currentUsage?.costs.total.monthly || 0) / 200 * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {currentUsage ? 
                      `${((currentUsage.costs.total.monthly / 200) * 100).toFixed(1)}% of target budget used` : 
                      '0% of target budget used'
                    }
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
