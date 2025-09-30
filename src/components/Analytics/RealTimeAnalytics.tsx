import React, { useState, useEffect } from 'react';
import { Activity, Users, Eye, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface RealTimeMetric {
  id: string;
  type: 'page_view' | 'feature_usage' | 'session_start' | 'session_end' | 'user_action';
  timestamp: any;
  page?: string;
  feature?: string;
  action?: string;
  userId?: string;
  userEmail?: string;
  userAgent?: string;
  duration?: number;
  metadata?: any;
}

interface RealTimeStats {
  activeUsers: number;
  pageViewsLastHour: number;
  featureUsageLastHour: number;
  averageSessionDuration: number;
  topPages: Array<{ name: string; count: number }>;
  topFeatures: Array<{ name: string; count: number }>;
  recentActivity: RealTimeMetric[];
}

const RealTimeAnalytics: React.FC = () => {
  const [stats, setStats] = useState<RealTimeStats>({
    activeUsers: 0,
    pageViewsLastHour: 0,
    featureUsageLastHour: 0,
    averageSessionDuration: 0,
    topPages: [],
    topFeatures: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const db = getFirestore();
    const auth = getAuth();
    
    // Check if user is admin
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user for real-time analytics');
      return;
    }

    // Set up real-time listener for analytics data
    const analyticsQuery = query(
      collection(db, 'analytics'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(analyticsQuery, (snapshot) => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const allData: RealTimeMetric[] = [];
      const pageViews: RealTimeMetric[] = [];
      const featureUsage: RealTimeMetric[] = [];
      const sessions: RealTimeMetric[] = [];
      const activeUserIds = new Set<string>();

      snapshot.docs.forEach(doc => {
        const data = doc.data() as RealTimeMetric;
        data.id = doc.id;
        allData.push(data);

        // Filter data from last hour
        const itemDate = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (itemDate >= oneHourAgo) {
          if (data.type === 'page_view') {
            pageViews.push(data);
            if (data.userId) activeUserIds.add(data.userId);
          } else if (data.type === 'feature_usage') {
            featureUsage.push(data);
            if (data.userId) activeUserIds.add(data.userId);
          } else if (data.type === 'session_end') {
            sessions.push(data);
          }
        }
      });

      // Calculate top pages
      const pageCounts: { [key: string]: number } = {};
      pageViews.forEach(item => {
        const pageName = item.page || 'Unknown';
        pageCounts[pageName] = (pageCounts[pageName] || 0) + 1;
      });

      // Calculate top features
      const featureCounts: { [key: string]: number } = {};
      featureUsage.forEach(item => {
        const featureName = item.feature || 'Unknown';
        featureCounts[featureName] = (featureCounts[featureName] || 0) + 1;
      });

      // Calculate average session duration
      const sessionDurations = sessions.map(item => item.duration || 0);
      const averageSessionDuration = sessionDurations.length > 0 
        ? Math.floor(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
        : 0;

      setStats({
        activeUsers: activeUserIds.size,
        pageViewsLastHour: pageViews.length,
        featureUsageLastHour: featureUsage.length,
        averageSessionDuration,
        topPages: Object.entries(pageCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topFeatures: Object.entries(featureCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        recentActivity: allData.slice(0, 10)
      });

      setLastUpdated(new Date());
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp: any): string => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'Unknown';
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'page_view': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'feature_usage': return <Activity className="w-4 h-4 text-green-500" />;
      case 'session_start': return <Users className="w-4 h-4 text-purple-500" />;
      case 'session_end': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Activity className="h-5 w-5 text-primary-600 mr-2" />
          Real-Time Analytics
        </h3>
        <div className="flex items-center space-x-2">
          {isLoading && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
          <span className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Active Users</p>
              <p className="text-2xl font-bold text-blue-800">{stats.activeUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Page Views (1h)</p>
              <p className="text-2xl font-bold text-green-800">{stats.pageViewsLastHour}</p>
            </div>
            <Eye className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Feature Usage (1h)</p>
              <p className="text-2xl font-bold text-purple-800">{stats.featureUsageLastHour}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Avg Session</p>
              <p className="text-2xl font-bold text-orange-800">
                {formatDuration(stats.averageSessionDuration)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3">Top Pages (Last Hour)</h4>
          <div className="space-y-2">
            {stats.topPages.length > 0 ? (
              stats.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{page.name}</span>
                  <span className="text-sm font-medium text-gray-800">{page.count} views</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No page views in the last hour</p>
            )}
          </div>
        </div>

        {/* Top Features */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3">Top Features (Last Hour)</h4>
          <div className="space-y-2">
            {stats.topFeatures.length > 0 ? (
              stats.topFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{feature.name}</span>
                  <span className="text-sm font-medium text-gray-800">{feature.count} uses</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No feature usage in the last hour</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Recent Activity</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">
                    {activity.type === 'page_view' && `Viewed ${activity.page}`}
                    {activity.type === 'feature_usage' && `Used ${activity.feature}`}
                    {activity.type === 'session_start' && 'Session started'}
                    {activity.type === 'session_end' && `Session ended (${formatDuration(activity.duration || 0)})`}
                    {activity.type === 'user_action' && `Action: ${activity.action}`}
                  </p>
                  <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;

