import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, TrendingUp, Activity, Eye, MousePointer, Smartphone } from 'lucide-react';
import PerformanceMonitor from '../Performance/PerformanceMonitor';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  pageViews: number;
  averageSessionDuration: number;
  topPages: Array<{ name: string; views: number }>;
  deviceTypes: Array<{ type: string; count: number }>;
  featureUsage: Array<{ feature: string; usage: number }>;
  performanceMetrics: {
    averageLoadTime: number;
    averageLCP: number;
    averageCLS: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    pageViews: 0,
    averageSessionDuration: 0,
    topPages: [],
    deviceTypes: [],
    featureUsage: [],
    performanceMetrics: {
      averageLoadTime: 0,
      averageLCP: 0,
      averageCLS: 0,
    },
  });

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration - in real app, this would come from Firebase Analytics
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on time range
      const multiplier = timeRange === '7d' ? 0.25 : timeRange === '30d' ? 1 : 3;
      
      setAnalyticsData({
        totalUsers: Math.floor(150 * multiplier),
        activeUsers: Math.floor(45 * multiplier),
        pageViews: Math.floor(1200 * multiplier),
        averageSessionDuration: Math.floor(180 * multiplier),
        topPages: [
          { name: 'Home', views: Math.floor(400 * multiplier) },
          { name: 'Events', views: Math.floor(350 * multiplier) },
          { name: 'Locations', views: Math.floor(250 * multiplier) },
          { name: 'Announcements', views: Math.floor(200 * multiplier) },
        ],
        deviceTypes: [
          { type: 'Mobile', count: Math.floor(80 * multiplier) },
          { type: 'Desktop', count: Math.floor(45 * multiplier) },
          { type: 'Tablet', count: Math.floor(25 * multiplier) },
        ],
        featureUsage: [
          { feature: 'Event Calendar', usage: Math.floor(85 * multiplier) },
          { feature: 'Location Map', usage: Math.floor(70 * multiplier) },
          { feature: 'Announcements', usage: Math.floor(60 * multiplier) },
          { feature: 'Search', usage: Math.floor(45 * multiplier) },
        ],
        performanceMetrics: {
          averageLoadTime: 1200,
          averageLCP: 1800,
          averageCLS: 0.08,
        },
      });
      
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, [timeRange]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics Dashboard
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Pack 1703</span> Insights
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Understand how families are engaging with the portal and identify opportunities for improvement.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-1 shadow-soft border border-white/50">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow-primary/50'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.totalUsers)}</p>
              </div>
              <Users className="w-8 h-8 text-primary-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.activeUsers)}</p>
              </div>
              <Activity className="w-8 h-8 text-secondary-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Page Views</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(analyticsData.pageViews)}</p>
              </div>
              <Eye className="w-8 h-8 text-accent-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Session</p>
                <p className="text-3xl font-bold text-gray-900">{formatDuration(analyticsData.averageSessionDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-primary-500" />
            </div>
          </div>
        </div>

        {/* Charts and Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Pages */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-primary-500 mr-2" />
              Most Popular Pages
            </h3>
            <div className="space-y-3">
              {analyticsData.topPages.map((page, index) => (
                <div key={page.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{page.name}</span>
                  </div>
                  <span className="text-gray-600">{formatNumber(page.views)} views</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Types */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 text-secondary-500 mr-2" />
              Device Usage
            </h3>
            <div className="space-y-3">
              {analyticsData.deviceTypes.map((device) => (
                <div key={device.type} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{device.type}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                        style={{ width: `${(device.count / analyticsData.totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 text-sm">{device.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Usage and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Usage */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center">
              <MousePointer className="w-5 h-5 text-accent-500 mr-2" />
              Feature Engagement
            </h3>
            <div className="space-y-3">
              {analyticsData.featureUsage.map((feature) => (
                <div key={feature.feature} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{feature.feature}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-accent-500 to-primary-500 h-2 rounded-full"
                        style={{ width: `${(feature.usage / analyticsData.totalUsers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 text-sm">{feature.usage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 text-primary-500 mr-2" />
              Performance Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Load Time</span>
                <span className={`font-bold ${
                  analyticsData.performanceMetrics.averageLoadTime < 1000 ? 'text-green-600' :
                  analyticsData.performanceMetrics.averageLoadTime < 2000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(analyticsData.performanceMetrics.averageLoadTime / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">LCP</span>
                <span className={`font-bold ${
                  analyticsData.performanceMetrics.averageLCP < 2500 ? 'text-green-600' :
                  analyticsData.performanceMetrics.averageLCP < 4000 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {(analyticsData.performanceMetrics.averageLCP / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">CLS</span>
                <span className={`font-bold ${
                  analyticsData.performanceMetrics.averageCLS < 0.1 ? 'text-green-600' :
                  analyticsData.performanceMetrics.averageCLS < 0.25 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analyticsData.performanceMetrics.averageCLS.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="mt-12 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">📈 What's Working Well</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Events page is the most popular, showing strong engagement</li>
                <li>• Mobile usage is high (53%), indicating good mobile experience</li>
                <li>• Average session duration shows families are engaged</li>
                <li>• Performance metrics are within acceptable ranges</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-accent-600 mb-2">🎯 Opportunities for Improvement</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Consider adding more interactive features to increase engagement</li>
                <li>• Resources page could benefit from more content</li>
                <li>• Monitor CLS score to ensure smooth user experience</li>
                <li>• Consider A/B testing for volunteer signup flow</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Real-time Performance Monitor */}
        <div className="mt-8">
          <PerformanceMonitor />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
