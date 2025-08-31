import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  HardDrive, 
  Zap, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import systemMonitorService, { SystemMetrics } from '../../services/systemMonitorService';

const SystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await systemMonitorService.getSystemMetrics();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load system metrics');
        console.error('Error loading metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();

    // Set up real-time updates
    const unsubscribe = systemMonitorService.subscribeToMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600">Loading system metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>{error || 'Unable to load system metrics'}</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'outage':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'outage':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
      <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6 flex items-center">
        <BarChart3 className="w-6 h-6 mr-3 text-primary-600" />
        Live System Status
        <span className="ml-auto text-sm text-gray-500 font-normal">
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
        </span>
      </h2>

      {/* Current Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Active Users</p>
              <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              <p className="text-blue-200 text-xs">of {metrics.totalUsers} total</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Events</p>
              <p className="text-2xl font-bold">{metrics.totalEvents}</p>
              <p className="text-green-200 text-xs">Active events</p>
            </div>
            <Calendar className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Messages</p>
              <p className="text-2xl font-bold">{metrics.totalMessages}</p>
              <p className="text-purple-200 text-xs">{metrics.messagesThisMonth} this month</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Monthly Cost</p>
              <p className="text-2xl font-bold">{formatCurrency(metrics.estimatedMonthlyCost)}</p>
              <p className="text-orange-200 text-xs">Estimated</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance & Infrastructure */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Performance
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Response Time:</span>
                <span className="text-gray-800 font-mono">{Math.round(metrics.averageResponseTime)}ms</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Uptime:</span>
                <span className="text-gray-800 font-mono">{metrics.uptimePercentage}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Error Rate:</span>
                <span className="text-gray-800 font-mono">{metrics.errorRate}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Infrastructure
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Firebase Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metrics.firebaseStatus)}`}>
                  {getStatusIcon(metrics.firebaseStatus)}
                  <span className="ml-1 capitalize">{metrics.firebaseStatus}</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Project ID:</span>
                <span className="text-gray-800 font-mono bg-gray-200 px-2 py-1 rounded text-xs">pack-1703-portal</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Environment:</span>
                <span className="text-gray-800 font-mono">Production</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage & Usage */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <HardDrive className="w-5 h-5 mr-2 text-green-500" />
              Storage Usage
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Used:</span>
                <span className="text-gray-800 font-mono">{formatBytes(metrics.storageUsed * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Limit:</span>
                <span className="text-gray-800 font-mono">{formatBytes(metrics.storageLimit * 1024 * 1024)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Usage:</span>
                <span className="text-gray-800 font-mono">{metrics.storagePercentage.toFixed(2)}%</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${metrics.storagePercentage > 80 ? 'bg-red-500' : metrics.storagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(metrics.storagePercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              Content Overview
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Events:</span>
                <span className="text-gray-800 font-mono">{metrics.totalEvents}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Locations:</span>
                <span className="text-gray-800 font-mono">{metrics.totalLocations}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Announcements:</span>
                <span className="text-gray-800 font-mono">{metrics.totalAnnouncements}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Messages:</span>
                <span className="text-gray-800 font-mono">{metrics.totalMessages}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Cost Breakdown
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Firestore:</span>
                <span className="text-gray-800 font-mono">{formatCurrency(metrics.costBreakdown.firestore)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Storage:</span>
                <span className="text-gray-800 font-mono">{formatCurrency(metrics.costBreakdown.storage)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Hosting:</span>
                <span className="text-gray-800 font-mono">{formatCurrency(metrics.costBreakdown.hosting)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Functions:</span>
                <span className="text-gray-800 font-mono">{formatCurrency(metrics.costBreakdown.functions)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 font-semibold">Total Monthly:</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(metrics.estimatedMonthlyCost)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              User Activity
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Total Users:</span>
                <span className="text-gray-800 font-mono">{metrics.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Active Users:</span>
                <span className="text-gray-800 font-mono">{metrics.activeUsers}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">New This Month:</span>
                <span className="text-gray-800 font-mono">{metrics.newUsersThisMonth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
