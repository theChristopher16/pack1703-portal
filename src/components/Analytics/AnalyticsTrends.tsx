import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface AnalyticsTrendsData {
  trends: TrendData[];
  dailyTrends: Array<{
    date: string;
    pageViews: number;
    activeUsers: number;
    sessions: number;
    featureUsage: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    pageViews: number;
    activeUsers: number;
    sessions: number;
    featureUsage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    pageViews: number;
    activeUsers: number;
    sessions: number;
    featureUsage: number;
  }>;
}

const AnalyticsTrends: React.FC = () => {
  const [trendsData, setTrendsData] = useState<AnalyticsTrendsData>({
    trends: [],
    dailyTrends: [],
    weeklyTrends: [],
    monthlyTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const loadTrendsData = async () => {
      try {
        const db = getFirestore();
        const auth = getAuth();
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user for analytics trends');
          return;
        }

        const now = new Date();
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        const previousStartDate = new Date(startDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

        // Get current period data
        const currentQuery = query(
          collection(db, 'analytics'),
          orderBy('timestamp', 'desc'),
          limit(2000)
        );
        const currentSnapshot = await getDocs(currentQuery);

        // Get previous period data
        const previousQuery = query(
          collection(db, 'analytics'),
          orderBy('timestamp', 'desc'),
          limit(2000)
        );
        const previousSnapshot = await getDocs(previousQuery);

        // Process current period data
        const currentData = currentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(item => {
          const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
          return itemDate >= startDate;
        });

        // Process previous period data
        const previousData = previousSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(item => {
          const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
          return itemDate >= previousStartDate && itemDate < startDate;
        });

        // Calculate metrics for both periods
        const currentMetrics = calculateMetrics(currentData);
        const previousMetrics = calculateMetrics(previousData);

        // Calculate trends
        const trends: TrendData[] = [
          {
            metric: 'Page Views',
            current: currentMetrics.pageViews,
            previous: previousMetrics.pageViews,
            change: currentMetrics.pageViews - previousMetrics.pageViews,
            changePercentage: previousMetrics.pageViews > 0 
              ? ((currentMetrics.pageViews - previousMetrics.pageViews) / previousMetrics.pageViews) * 100 
              : 0,
            trend: currentMetrics.pageViews > previousMetrics.pageViews ? 'up' : 
                   currentMetrics.pageViews < previousMetrics.pageViews ? 'down' : 'stable'
          },
          {
            metric: 'Active Users',
            current: currentMetrics.activeUsers,
            previous: previousMetrics.activeUsers,
            change: currentMetrics.activeUsers - previousMetrics.activeUsers,
            changePercentage: previousMetrics.activeUsers > 0 
              ? ((currentMetrics.activeUsers - previousMetrics.activeUsers) / previousMetrics.activeUsers) * 100 
              : 0,
            trend: currentMetrics.activeUsers > previousMetrics.activeUsers ? 'up' : 
                   currentMetrics.activeUsers < previousMetrics.activeUsers ? 'down' : 'stable'
          },
          {
            metric: 'Sessions',
            current: currentMetrics.sessions,
            previous: previousMetrics.sessions,
            change: currentMetrics.sessions - previousMetrics.sessions,
            changePercentage: previousMetrics.sessions > 0 
              ? ((currentMetrics.sessions - previousMetrics.sessions) / previousMetrics.sessions) * 100 
              : 0,
            trend: currentMetrics.sessions > previousMetrics.sessions ? 'up' : 
                   currentMetrics.sessions < previousMetrics.sessions ? 'down' : 'stable'
          },
          {
            metric: 'Feature Usage',
            current: currentMetrics.featureUsage,
            previous: previousMetrics.featureUsage,
            change: currentMetrics.featureUsage - previousMetrics.featureUsage,
            changePercentage: previousMetrics.featureUsage > 0 
              ? ((currentMetrics.featureUsage - previousMetrics.featureUsage) / previousMetrics.featureUsage) * 100 
              : 0,
            trend: currentMetrics.featureUsage > previousMetrics.featureUsage ? 'up' : 
                   currentMetrics.featureUsage < previousMetrics.featureUsage ? 'down' : 'stable'
          }
        ];

        // Generate daily trends
        const dailyTrends = generateDailyTrends(currentData, daysAgo);

        // Generate weekly trends
        const weeklyTrends = generateWeeklyTrends(currentData, daysAgo);

        // Generate monthly trends
        const monthlyTrends = generateMonthlyTrends(currentData, daysAgo);

        setTrendsData({
          trends,
          dailyTrends,
          weeklyTrends,
          monthlyTrends
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading trends data:', error);
        setIsLoading(false);
      }
    };

    loadTrendsData();
  }, [timeRange]);

  const calculateMetrics = (data: any[]) => {
    const pageViews = data.filter(item => (item as any).type === 'page_view').length;
    const featureUsage = data.filter(item => (item as any).type === 'feature_usage').length;
    const sessions = data.filter(item => (item as any).type === 'session_start').length;
    const activeUsers = new Set(data.map(item => (item as any).userId).filter(Boolean)).size;

    return { pageViews, featureUsage, sessions, activeUsers };
  };

  const generateDailyTrends = (data: any[], days: number) => {
    const trends: Array<{
      date: string;
      pageViews: number;
      activeUsers: number;
      sessions: number;
      featureUsage: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const dayData = data.filter(item => {
        const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
        return itemDate.toISOString().split('T')[0] === dateKey;
      });

      const metrics = calculateMetrics(dayData);
      trends.push({
        date: dateKey,
        ...metrics
      });
    }

    return trends;
  };

  const generateWeeklyTrends = (data: any[], days: number) => {
    const trends: Array<{
      week: string;
      pageViews: number;
      activeUsers: number;
      sessions: number;
      featureUsage: number;
    }> = [];

    const weeks = Math.ceil(days / 7);
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekData = data.filter(item => {
        const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
        return itemDate >= weekStart && itemDate <= weekEnd;
      });

      const metrics = calculateMetrics(weekData);
      trends.push({
        week: `Week ${weeks - i}`,
        ...metrics
      });
    }

    return trends;
  };

  const generateMonthlyTrends = (data: any[], days: number) => {
    const trends: Array<{
      month: string;
      pageViews: number;
      activeUsers: number;
      sessions: number;
      featureUsage: number;
    }> = [];

    const months = Math.ceil(days / 30);
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const monthData = data.filter(item => {
        const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
        return itemDate >= monthStart && itemDate <= monthEnd;
      });

      const metrics = calculateMetrics(monthData);
      trends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        ...metrics
      });
    }

    return trends;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
          Analytics Trends
        </h3>
        <div className="flex space-x-2">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as '7d' | '30d' | '90d')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {trendsData.trends.map((trend, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{trend.metric}</span>
              {getTrendIcon(trend.trend)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {trend.current.toLocaleString()}
            </div>
            <div className={`text-sm ${getTrendColor(trend.trend)}`}>
              {trend.change >= 0 ? '+' : ''}{trend.change.toLocaleString()} 
              ({trend.changePercentage >= 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Daily Trends */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Daily Trends</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {trendsData.dailyTrends.slice(-7).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm text-gray-600">{trend.date}</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-blue-600">{trend.pageViews} views</span>
                  <span className="text-green-600">{trend.activeUsers} users</span>
                  <span className="text-purple-600">{trend.sessions} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Trends */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Weekly Trends</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {trendsData.weeklyTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm text-gray-600">{trend.week}</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-blue-600">{trend.pageViews} views</span>
                  <span className="text-green-600">{trend.activeUsers} users</span>
                  <span className="text-purple-600">{trend.sessions} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div>
        <h4 className="text-md font-semibold text-gray-800 mb-3">Monthly Trends</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {trendsData.monthlyTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm text-gray-600">{trend.month}</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-blue-600">{trend.pageViews} views</span>
                  <span className="text-green-600">{trend.activeUsers} users</span>
                  <span className="text-purple-600">{trend.sessions} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTrends;
