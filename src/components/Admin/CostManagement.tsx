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
  Shield
} from 'lucide-react';
import { costManagementService, UsageMetrics, CostAlert } from '../../services/costManagementService';
import { useAdmin } from '../../contexts/AdminContext';

interface CostManagementProps {
  className?: string;
}

const CostManagement: React.FC<CostManagementProps> = ({ className = '' }) => {
  const { hasPermission } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [currentUsage, setCurrentUsage] = useState<UsageMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<UsageMetrics[]>([]);
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [firebaseEstimate, setFirebaseEstimate] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  if (!hasPermission('cost:read')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access cost management features.</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadCostData();
  }, []);

  const loadCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      const report = await costManagementService.getCostReport();
      
      setCurrentUsage(report.current);
      setHistoricalData(report.historical);
      setAlerts(report.alerts);
      setFirebaseEstimate(report.firebaseEstimate);
    } catch (err) {
      setError('Failed to load cost data. Please try again.');
      console.error('Error loading cost data:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await costManagementService.acknowledgeAlert(alertId);
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
                Cost Management
              </h1>
              <p className="text-gray-600 mt-2">Monitor API usage and infrastructure costs</p>
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

        {/* Cost Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
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

        {/* Current Usage Overview */}
        {currentUsage && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentUsage.costs.total.daily)}
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
                    {formatCurrency(currentUsage.costs.total.monthly)}
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
                    {Object.values(currentUsage.requests).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Date(currentUsage.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Detailed Cost Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* API Costs */}
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
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6 mb-8">
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

        {/* Historical Data Chart Placeholder */}
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
    </div>
  );
};

export default CostManagement;
