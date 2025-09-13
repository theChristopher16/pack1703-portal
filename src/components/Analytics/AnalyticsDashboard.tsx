import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, TrendingUp, Activity, Eye, MousePointer, Smartphone } from 'lucide-react';
import { getFirestore, collection, getCountFromServer, getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import analyticsService from '../../services/analyticsService';
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

  // Load real analytics data from Firebase
  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        const db = getFirestore();
        const auth = getAuth();
        
        // Check if user is admin before running aggregation queries
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user for analytics');
          return;
        }
        
        // Get user document to check admin status
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        const isAdmin = userData?.role === 'admin' || userData?.role === 'root';
        
        if (!isAdmin) {
          console.warn('Non-admin user accessing analytics dashboard');
          // Set fallback data for non-admin users
          setAnalyticsData({
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
          return;
        }
        
        // Get total users count (only for admins)
        const usersSnapshot = await getCountFromServer(collection(db, 'users'));
        const totalUsers = usersSnapshot.data().count;
        
        // Get analytics data from service
        const analyticsData = await analyticsService.getAnalyticsData(timeRange);
        
        // Performance metrics (these would come from real performance monitoring)
        const performanceMetrics = {
          averageLoadTime: 1200, // This would be calculated from real performance data
          averageLCP: 1800,
          averageCLS: 0.08,
        };
        
        setAnalyticsData({
          totalUsers,
          activeUsers: totalUsers, // For now, assume all users are active
          pageViews: analyticsData.pageViews,
          averageSessionDuration: analyticsData.averageSessionDuration,
          topPages: analyticsData.topPages,
          deviceTypes: analyticsData.deviceTypes,
          featureUsage: analyticsData.featureUsage,
          performanceMetrics,
        });
        
      } catch (error) {
        console.error('Error loading analytics data:', error);
        // Fallback to basic data if analytics collection doesn't exist
        setAnalyticsData({
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
      }
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

  // Removed loading animation for faster page transitions

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-800 mb-4">Analytics Dashboard</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Track user engagement, performance metrics, and feature usage across the Scout Pack portal.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-1 border border-white/50 shadow-soft">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                timeRange === '7d'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                timeRange === '30d'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                timeRange === '90d'
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.totalUsers)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.activeUsers)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-gray-800">{formatNumber(analyticsData.pageViews)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold text-gray-800">{formatDuration(analyticsData.averageSessionDuration)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Pages */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
              Top Pages
            </h3>
            <div className="space-y-3">
              {analyticsData.topPages.map((page, index) => (
                <div key={page.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{page.name}</span>
                  <span className="text-sm font-medium text-gray-800">{formatNumber(page.views)} views</span>
                </div>
              ))}
            </div>
          </div>

          {/* Device Types */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Smartphone className="h-5 w-5 text-primary-600 mr-2" />
              Device Types
            </h3>
            <div className="space-y-3">
              {analyticsData.deviceTypes.map((device) => (
                <div key={device.type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{device.type}</span>
                  <span className="text-sm font-medium text-gray-800">{formatNumber(device.count)} users</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Usage */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
            Feature Usage
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyticsData.featureUsage.map((feature) => (
              <div key={feature.feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">{feature.feature}</span>
                <span className="text-sm font-medium text-gray-800">{formatNumber(feature.usage)} uses</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Monitor */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="h-5 w-5 text-primary-600 mr-2" />
            Performance Metrics
          </h3>
          <PerformanceMonitor />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
