import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }>;
}

interface AnalyticsChartsData {
  pageViewsChart: ChartData;
  featureUsageChart: ChartData;
  deviceTypesChart: ChartData;
  hourlyActivityChart: ChartData;
  userGrowthChart: ChartData;
}

const AnalyticsCharts: React.FC = () => {
  const [chartsData, setChartsData] = useState<AnalyticsChartsData>({
    pageViewsChart: { labels: [], datasets: [] },
    featureUsageChart: { labels: [], datasets: [] },
    deviceTypesChart: { labels: [], datasets: [] },
    hourlyActivityChart: { labels: [], datasets: [] },
    userGrowthChart: { labels: [], datasets: [] }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const loadChartsData = async () => {
      try {
        const db = getFirestore();
        const auth = getAuth();
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user for analytics charts');
          return;
        }

        const now = new Date();
        const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

        // Get analytics data
        const analyticsQuery = query(
          collection(db, 'analytics'),
          orderBy('timestamp', 'desc'),
          limit(1000)
        );
        const analyticsSnapshot = await getDocs(analyticsQuery);

        const allData = analyticsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(item => {
          const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
          return itemDate >= startDate;
        });

        // Process data for charts
        const pageViews: { [key: string]: number } = {};
        const featureUsage: { [key: string]: number } = {};
        const deviceTypes: { [key: string]: number } = {};
        const hourlyActivity: { [key: string]: number } = {};
        const dailyUsers: { [key: string]: Set<string> } = {};

        allData.forEach(item => {
          const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
          const dateKey = itemDate.toISOString().split('T')[0];
          const hourKey = itemDate.getHours().toString();

          // Page views
          if ((item as any).type === 'page_view' && (item as any).page) {
            const page = (item as any).page;
            pageViews[page] = (pageViews[page] || 0) + 1;
          }

          // Feature usage
          if ((item as any).type === 'feature_usage' && (item as any).feature) {
            const feature = (item as any).feature;
            featureUsage[feature] = (featureUsage[feature] || 0) + 1;
          }

          // Device types
          if ((item as any).userAgent) {
            const userAgent = (item as any).userAgent;
            let deviceType = 'Desktop';
            if (userAgent.includes('Mobile')) deviceType = 'Mobile';
            else if (userAgent.includes('Tablet')) deviceType = 'Tablet';
            deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
          }

          // Hourly activity
          hourlyActivity[hourKey] = (hourlyActivity[hourKey] || 0) + 1;

          // Daily users
          if ((item as any).userId) {
            if (!dailyUsers[dateKey]) {
              dailyUsers[dateKey] = new Set();
            }
            dailyUsers[dateKey].add((item as any).userId);
          }
        });

        // Create chart data
        const pageViewsChart: ChartData = {
          labels: Object.keys(pageViews).slice(0, 10),
          datasets: [{
            label: 'Page Views',
            data: Object.values(pageViews).slice(0, 10),
            backgroundColor: [
              '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
              '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
            ]
          }]
        };

        const featureUsageChart: ChartData = {
          labels: Object.keys(featureUsage).slice(0, 8),
          datasets: [{
            label: 'Feature Usage',
            data: Object.values(featureUsage).slice(0, 8),
            backgroundColor: [
              '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
              '#06B6D4', '#84CC16', '#F97316'
            ]
          }]
        };

        const deviceTypesChart: ChartData = {
          labels: Object.keys(deviceTypes),
          datasets: [{
            label: 'Device Types',
            data: Object.values(deviceTypes),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
          }]
        };

        // Hourly activity chart
        const hours = Array.from({ length: 24 }, (_, i) => i.toString());
        const hourlyActivityChart: ChartData = {
          labels: hours,
          datasets: [{
            label: 'Activity',
            data: hours.map(hour => hourlyActivity[hour] || 0),
            borderColor: ['#3B82F6'],
            backgroundColor: ['rgba(59, 130, 246, 0.1)'],
            borderWidth: 2
          }]
        };

        // User growth chart
        const sortedDates = Object.keys(dailyUsers).sort();
        const userGrowthChart: ChartData = {
          labels: sortedDates.slice(-14), // Last 14 days
          datasets: [{
            label: 'Active Users',
            data: sortedDates.slice(-14).map(date => dailyUsers[date]?.size || 0),
            borderColor: ['#10B981'],
            backgroundColor: ['rgba(16, 185, 129, 0.1)'],
            borderWidth: 2
          }]
        };

        setChartsData({
          pageViewsChart,
          featureUsageChart,
          deviceTypesChart,
          hourlyActivityChart,
          userGrowthChart
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading charts data:', error);
        setIsLoading(false);
      }
    };

    loadChartsData();
  }, [timeRange]);

  const SimpleBarChart: React.FC<{ data: ChartData; title: string; icon: React.ReactNode }> = ({ data, title, icon }) => {
    const maxValue = Math.max(...data.datasets[0]?.data || [0]);
    
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center mb-4">
          {icon}
          <h4 className="text-lg font-semibold text-gray-800 ml-2">{title}</h4>
        </div>
        <div className="space-y-3">
          {data.labels.map((label, index) => {
            const value = data.datasets[0]?.data[index] || 0;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const backgroundColor = data.datasets[0]?.backgroundColor?.[index] || '#3B82F6';
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-24 text-sm text-gray-600 truncate" title={label}>
                  {label}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor
                    }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-gray-800 text-right">
                  {value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SimpleLineChart: React.FC<{ data: ChartData; title: string; icon: React.ReactNode }> = ({ data, title, icon }) => {
    const maxValue = Math.max(...data.datasets[0]?.data || [0]);
    const minValue = Math.min(...data.datasets[0]?.data || [0]);
    const range = maxValue - minValue;
    
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center mb-4">
          {icon}
          <h4 className="text-lg font-semibold text-gray-800 ml-2">{title}</h4>
        </div>
        <div className="h-48 relative">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {data.labels.map((label, index) => {
              const value = data.datasets[0]?.data[index] || 0;
              const x = (index / (data.labels.length - 1)) * 380 + 10;
              const y = range > 0 ? 190 - ((value - minValue) / range) * 180 : 100;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill={Array.isArray(data.datasets[0]?.borderColor) ? data.datasets[0]?.borderColor[0] : data.datasets[0]?.borderColor || '#3B82F6'}
                  />
                  {index > 0 && (
                    <line
                      x1={((index - 1) / (data.labels.length - 1)) * 380 + 10}
                      y1={range > 0 ? 190 - ((data.datasets[0]?.data[index - 1] || 0 - minValue) / range) * 180 : 100}
                      x2={x}
                      y2={y}
                      stroke={Array.isArray(data.datasets[0]?.borderColor) ? data.datasets[0]?.borderColor[0] : data.datasets[0]?.borderColor || '#3B82F6'}
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            {data.labels.filter((_, index) => index % Math.ceil(data.labels.length / 5) === 0).map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const SimplePieChart: React.FC<{ data: ChartData; title: string; icon: React.ReactNode }> = ({ data, title, icon }) => {
    const total = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 0;
    
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center mb-4">
          {icon}
          <h4 className="text-lg font-semibold text-gray-800 ml-2">{title}</h4>
        </div>
        <div className="space-y-3">
          {data.labels.map((label, index) => {
            const value = data.datasets[0]?.data[index] || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const backgroundColor = data.datasets[0]?.backgroundColor?.[index] || '#3B82F6';
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor }}
                />
                <div className="flex-1 text-sm text-gray-600">{label}</div>
                <div className="text-sm font-medium text-gray-800">
                  {value} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
          <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
          Analytics Charts
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={chartsData.pageViewsChart}
          title="Top Pages"
          icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
        />
        
        <SimpleBarChart
          data={chartsData.featureUsageChart}
          title="Feature Usage"
          icon={<Activity className="w-5 h-5 text-green-500" />}
        />
        
        <SimplePieChart
          data={chartsData.deviceTypesChart}
          title="Device Types"
          icon={<PieChart className="w-5 h-5 text-purple-500" />}
        />
        
        <SimpleLineChart
          data={chartsData.hourlyActivityChart}
          title="Hourly Activity"
          icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
        />
      </div>

      <div className="mt-6">
        <SimpleLineChart
          data={chartsData.userGrowthChart}
          title="User Growth (Last 14 Days)"
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
        />
      </div>
    </div>
  );
};

export default AnalyticsCharts;
