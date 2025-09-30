import React, { useState, useEffect } from 'react';
import { Users, Clock, TrendingUp, Target, Calendar, BarChart3 } from 'lucide-react';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface UserEngagementData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  sessionsPerUser: number;
  bounceRate: number;
  topUserActions: Array<{ action: string; count: number }>;
  userRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  engagementTrends: Array<{ date: string; activeUsers: number; sessions: number }>;
}

const UserEngagementMetrics: React.FC = () => {
  const [engagementData, setEngagementData] = useState<UserEngagementData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    returningUsers: 0,
    averageSessionDuration: 0,
    sessionsPerUser: 0,
    bounceRate: 0,
    topUserActions: [],
    userRetention: { day1: 0, day7: 0, day30: 0 },
    engagementTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const loadEngagementData = async () => {
      try {
        const db = getFirestore();
        const auth = getAuth();
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user for engagement metrics');
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

        // Get users data
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);

        const allData = analyticsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(item => {
          const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
          return itemDate >= startDate;
        });

        // Calculate metrics
        const uniqueUsers = new Set<string>();
        const userSessions = new Map<string, number>();
        const sessionDurations: number[] = [];
        const userActions: { [key: string]: number } = {};
        const userFirstVisit = new Map<string, Date>();
        const userLastVisit = new Map<string, Date>();

        allData.forEach(item => {
          const userId = (item as any).userId;
          if (userId) {
            uniqueUsers.add(userId);
            
            // Track sessions
            if ((item as any).type === 'session_start') {
              userSessions.set(userId, (userSessions.get(userId) || 0) + 1);
            }
            
            // Track session duration
            if ((item as any).type === 'session_end' && (item as any).duration) {
              sessionDurations.push((item as any).duration);
            }
            
            // Track user actions
            if ((item as any).action) {
              const action = (item as any).action;
              userActions[action] = (userActions[action] || 0) + 1;
            }
            
            // Track first and last visit
            const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
            if (!userFirstVisit.has(userId) || itemDate < userFirstVisit.get(userId)!) {
              userFirstVisit.set(userId, itemDate);
            }
            if (!userLastVisit.has(userId) || itemDate > userLastVisit.get(userId)!) {
              userLastVisit.set(userId, itemDate);
            }
          }
        });

        // Calculate retention (simplified)
        const totalUsers = usersSnapshot.size;
        const activeUsers = uniqueUsers.size;
        const newUsers = Array.from(userFirstVisit.values()).filter(date => 
          date >= startDate
        ).length;
        const returningUsers = activeUsers - newUsers;

        // Calculate session metrics
        const totalSessions = Array.from(userSessions.values()).reduce((a, b) => a + b, 0);
        const averageSessionDuration = sessionDurations.length > 0 
          ? Math.floor(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
          : 0;
        const sessionsPerUser = activeUsers > 0 ? totalSessions / activeUsers : 0;

        // Calculate bounce rate (sessions with only 1 page view)
        const singlePageSessions = Array.from(userSessions.values()).filter(count => count === 1).length;
        const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0;

        // Top user actions
        const topUserActions = Object.entries(userActions)
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Generate engagement trends (simplified)
        const engagementTrends = [];
        for (let i = daysAgo; i >= 0; i--) {
          const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          
          const dayUsers = new Set<string>();
          const daySessions = new Set<string>();
          
          allData.forEach(item => {
            const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
            if (itemDate >= dayStart && itemDate < dayEnd) {
              const userId = (item as any).userId;
              if (userId) {
                dayUsers.add(userId);
                if ((item as any).type === 'session_start') {
                  daySessions.add(`${userId}_${itemDate.toDateString()}`);
                }
              }
            }
          });
          
          engagementTrends.push({
            date: dayStart.toISOString().split('T')[0],
            activeUsers: dayUsers.size,
            sessions: daySessions.size
          });
        }

        setEngagementData({
          totalUsers,
          activeUsers,
          newUsers,
          returningUsers,
          averageSessionDuration,
          sessionsPerUser: Math.round(sessionsPerUser * 10) / 10,
          bounceRate: Math.round(bounceRate * 10) / 10,
          topUserActions,
          userRetention: { day1: 0, day7: 0, day30: 0 }, // TODO: Calculate real retention rates
          engagementTrends
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading engagement data:', error);
        setIsLoading(false);
      }
    };

    loadEngagementData();
  }, [timeRange]);

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Users className="h-5 w-5 text-primary-600 mr-2" />
          User Engagement Metrics
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

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-blue-800">{engagementData.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active Users</p>
                  <p className="text-2xl font-bold text-green-800">{engagementData.activeUsers}</p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">New Users</p>
                  <p className="text-2xl font-bold text-purple-800">{engagementData.newUsers}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Returning Users</p>
                  <p className="text-2xl font-bold text-orange-800">{engagementData.returningUsers}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Session Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Avg Session Duration</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatDuration(engagementData.averageSessionDuration)}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-gray-500" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Sessions per User</p>
                  <p className="text-xl font-bold text-gray-800">
                    {engagementData.sessionsPerUser}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 text-gray-500" />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Bounce Rate</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatPercentage(engagementData.bounceRate)}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-gray-500" />
              </div>
            </div>
          </div>

          {/* Top User Actions */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">Top User Actions</h4>
            <div className="space-y-2">
              {engagementData.topUserActions.length > 0 ? (
                engagementData.topUserActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{action.action}</span>
                    <span className="text-sm font-medium text-gray-800">{action.count} times</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No user actions recorded</p>
              )}
            </div>
          </div>

          {/* User Retention */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">User Retention</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 font-medium">Day 1</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatPercentage(engagementData.userRetention.day1)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 font-medium">Day 7</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatPercentage(engagementData.userRetention.day7)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-600 font-medium">Day 30</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatPercentage(engagementData.userRetention.day30)}
                </p>
              </div>
            </div>
          </div>

          {/* Engagement Trends */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Engagement Trends</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {engagementData.engagementTrends.slice(-7).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm text-gray-600">{trend.date}</span>
                    <div className="flex space-x-4">
                      <span className="text-sm text-blue-600">
                        {trend.activeUsers} users
                      </span>
                      <span className="text-sm text-green-600">
                        {trend.sessions} sessions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserEngagementMetrics;
