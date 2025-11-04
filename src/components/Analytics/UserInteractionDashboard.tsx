import React, { useState, useEffect } from 'react';
import { 
  MousePointer, 
  Navigation, 
  Users, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  RefreshCw,
  Eye,
  User,
  Calendar,
  MessageSquare,
  Heart,
  Download,
  FileText,
  UserPlus,
  Leaf,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import userInteractionService, { UserInteractionEvent } from '../../services/userInteractionService';
import { useAdmin } from '../../contexts/AdminContext';
import { SuperUserOnly } from '../Auth/RoleGuard';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from '../../hooks/useNavigate';
import { Lock } from 'lucide-react';

interface InteractionAnalytics {
  totalInteractions: number;
  uniqueUsers: number;
  buttonClicks: Array<{ eventName: string; count: number; users: string[] }>;
  pageViews: Array<{ page: string; count: number; uniqueUsers: number }>;
  topInteractiveComponents: Array<{ componentName: string; interactions: number; uniqueUsers: number }>;
  userActivity: Array<{ userId: string; userEmail: string; interactionCount: number; lastActive: any }>;
  recentActivity: UserInteractionEvent[];
}

interface RealServiceData {
  events: {
    total: number;
    upcoming: number;
    totalRSVPs: number;
    recentRSVPs: Array<{ eventTitle: string; userName: string; status: string; timestamp: any }>;
  };
  announcements: {
    total: number;
    recent: number;
    totalViews: number;
    recentViews: Array<{ title: string; views: number; createdAt: any }>;
  };
  resources: {
    total: number;
    downloads: number;
    recentDownloads: Array<{ name: string; downloadCount: number }>;
  };
  feedback: {
    total: number;
    pending: number;
    resolved: number;
    recent: Array<{ category: string; status: string; timestamp: any }>;
  };
  volunteer: {
    totalOpportunities: number;
    totalSignups: number;
    recentSignups: Array<{ opportunityName: string; userName: string; timestamp: any }>;
  };
  ecology: {
    totalReadings: number;
    recentReadings: number;
    cameraImages: number;
    deviceStatus: string;
  };
}

const UserInteractionDashboard: React.FC = () => {
  const { state } = useAdmin();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<InteractionAnalytics | null>(null);
  const [serviceData, setServiceData] = useState<RealServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'clicks' | 'navigation' | 'users' | 'components' | 'services'>('overview');

  // Super-admin only check
  const isSuperAdmin = state.currentUser?.role === 'super-admin' || state.currentUser?.role === 'root';

  // Redirect non-super-admins
  useEffect(() => {
    if (state.currentUser && !isSuperAdmin) {
      console.warn('Access denied: User Interactions page is restricted to super-admins only');
      navigate('/');
    }
  }, [state.currentUser, isSuperAdmin, navigate]);

  const loadRealServiceData = async () => {
    try {
      console.log('🔍 Loading real service data...');
      const db = getFirestore();
      const now = new Date();
      const daysAgo = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      console.log('📅 Time range:', timeRange, 'Start date:', startDate);

      // Fetch data from all services in parallel
      const [
        eventsSnapshot,
        upcomingEventsSnapshot,
        rsvpsSnapshot,
        announcementsSnapshot,
        resourcesSnapshot,
        feedbackSnapshot,
        pendingFeedbackSnapshot,
        resolvedFeedbackSnapshot,
        volunteerOpportunitiesSnapshot,
        volunteerSignupsSnapshot,
        bme680Snapshot,
        cameraImagesSnapshot
      ] = await Promise.all([
        getDocs(collection(db, 'events')),
        getDocs(query(collection(db, 'events'), where('date', '>=', now))),
        getDocs(collection(db, 'rsvps')),
        getDocs(collection(db, 'announcements')),
        getDocs(collection(db, 'resources')),
        getDocs(collection(db, 'feedback')),
        getDocs(query(collection(db, 'feedback'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'feedback'), where('status', '==', 'resolved'))),
        getDocs(collection(db, 'volunteer-needs')),
        getDocs(collection(db, 'volunteer-signups')),
        getDocs(query(collection(db, 'bme680_readings'), orderBy('timestamp', 'desc'), limit(100))),
        getDocs(collection(db, 'camera_images'))
      ]);

      // Process Events & RSVPs
      const recentRSVPs = rsvpsSnapshot.docs
        .slice(0, 10)
        .map(doc => {
          const data = doc.data();
          return {
            eventTitle: data.eventTitle || 'Unknown Event',
            userName: data.userName || data.userEmail || 'Unknown User',
            status: data.status || 'unknown',
            timestamp: data.createdAt || data.timestamp
          };
        });

      // Process Announcements
      const recentAnnouncements = announcementsSnapshot.docs
        .slice(0, 10)
        .map(doc => {
          const data = doc.data();
          return {
            title: data.title || 'Untitled',
            views: data.views || 0,
            createdAt: data.createdAt
          };
        });

      // Process Resources
      const resourceDownloads = resourcesSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            name: data.name || 'Unknown Resource',
            downloadCount: data.downloadCount || 0
          };
        })
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 10);

      // Process Feedback
      const recentFeedback = feedbackSnapshot.docs
        .slice(0, 10)
        .map(doc => {
          const data = doc.data();
          return {
            category: data.category || 'General',
            status: data.status || 'pending',
            timestamp: data.createdAt || data.timestamp
          };
        });

      // Process Volunteer Signups
      const recentVolunteerSignups = volunteerSignupsSnapshot.docs
        .slice(0, 10)
        .map(doc => {
          const data = doc.data();
          return {
            opportunityName: data.opportunityName || 'Unknown Opportunity',
            userName: data.userName || data.userEmail || 'Unknown User',
            timestamp: data.createdAt || data.timestamp
          };
        });

      // Process Ecology Data
      const recentBME680Count = bme680Snapshot.docs.filter(doc => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
        return timestamp >= startDate;
      }).length;

      const newServiceData = {
        events: {
          total: eventsSnapshot.size,
          upcoming: upcomingEventsSnapshot.size,
          totalRSVPs: rsvpsSnapshot.size,
          recentRSVPs
        },
        announcements: {
          total: announcementsSnapshot.size,
          recent: announcementsSnapshot.docs.filter(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
            return createdAt >= startDate;
          }).length,
          totalViews: recentAnnouncements.reduce((sum, a) => sum + a.views, 0),
          recentViews: recentAnnouncements
        },
        resources: {
          total: resourcesSnapshot.size,
          downloads: resourceDownloads.reduce((sum, r) => sum + r.downloadCount, 0),
          recentDownloads: resourceDownloads
        },
        feedback: {
          total: feedbackSnapshot.size,
          pending: pendingFeedbackSnapshot.size,
          resolved: resolvedFeedbackSnapshot.size,
          recent: recentFeedback
        },
        volunteer: {
          totalOpportunities: volunteerOpportunitiesSnapshot.size,
          totalSignups: volunteerSignupsSnapshot.size,
          recentSignups: recentVolunteerSignups
        },
        ecology: {
          totalReadings: bme680Snapshot.size,
          recentReadings: recentBME680Count,
          cameraImages: cameraImagesSnapshot.size,
          deviceStatus: recentBME680Count > 0 ? 'online' : 'offline'
        }
      };

      setServiceData(newServiceData);

      console.log('✅ Loaded real service data from Firebase');
      console.log('📊 Service Data Summary:', {
        events: newServiceData.events.total,
        announcements: newServiceData.announcements.total,
        resources: newServiceData.resources.total,
        feedback: newServiceData.feedback.total,
        volunteer: newServiceData.volunteer.totalOpportunities,
        ecology: newServiceData.ecology.totalReadings
      });
    } catch (err) {
      console.error('❌ Error loading real service data:', err);
      // Set empty data structure so UI can still render with zeros
      setServiceData({
        events: { total: 0, upcoming: 0, totalRSVPs: 0, recentRSVPs: [] },
        announcements: { total: 0, recent: 0, totalViews: 0, recentViews: [] },
        resources: { total: 0, downloads: 0, recentDownloads: [] },
        feedback: { total: 0, pending: 0, resolved: 0, recent: [] },
        volunteer: { totalOpportunities: 0, totalSignups: 0, recentSignups: [] },
        ecology: { totalReadings: 0, recentReadings: 0, cameraImages: 0, deviceStatus: 'offline' }
      });
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Starting analytics load...');
      
      // Load interaction analytics and real service data in parallel
      const interactionDataPromise = userInteractionService.getInteractionAnalytics(timeRange)
        .then(data => {
          console.log('✅ Interaction analytics loaded:', {
            totalInteractions: data.totalInteractions,
            uniqueUsers: data.uniqueUsers,
            buttonClicksCount: data.buttonClicks.length
          });
          return data;
        })
        .catch(err => {
          console.error('❌ Error getting interaction analytics:', err);
          throw err;
        });
      
      // Load both in parallel but handle errors separately
      const [interactionData] = await Promise.all([
        interactionDataPromise,
        loadRealServiceData()
      ]);
      
      setAnalytics(interactionData);
      console.log('✅ All analytics loaded successfully');
    } catch (err) {
      console.error('❌ Error loading interaction analytics:', err);
      setError('Failed to load analytics data');
      // Set empty analytics structure so UI can still render
      setAnalytics({
        totalInteractions: 0,
        uniqueUsers: 0,
        buttonClicks: [],
        pageViews: [],
        topInteractiveComponents: [],
        userActivity: [],
        recentActivity: []
      });
      // Still try to load service data even if interaction analytics fail
      loadRealServiceData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatUserEmail = (email: string) => {
    if (!email || email === 'unknown') return 'Unknown User';
    return email;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'attending':
      case 'resolved':
      case 'online':
        return 'bg-forest-100 text-forest-800';
      case 'pending':
      case 'maybe':
        return 'bg-solar-100 text-solar-800';
      case 'not_attending':
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-ocean-100 text-ocean-800';
    }
  };


  // Show access denied for non-super-admins
  if (state.currentUser && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center">
        <div className="text-center solarpunk-card p-12 max-w-md animate-solarpunk-fade-in">
          <div className="p-4 bg-gradient-to-br from-terracotta-400 to-solar-400 rounded-2xl w-20 h-20 mx-auto mb-6 shadow-glow flex items-center justify-center">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-solarpunk-display font-bold text-forest-800 mb-2">Super-Admin Access Required</h1>
          <p className="text-forest-600 font-solarpunk-body mb-6">
            This page is restricted to super-administrators only. You will be redirected to the homepage.
          </p>
          <button
            onClick={() => navigate('/')}
            className="solarpunk-btn-primary"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center">
        <div className="text-center solarpunk-card p-12 animate-solarpunk-pulse">
          <RefreshCw className="h-12 w-12 text-forest-600 animate-spin mx-auto mb-4" />
          <p className="text-forest-700 font-solarpunk-body font-semibold">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center">
        <div className="text-center solarpunk-card p-12">
          <div className="text-terracotta-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-solarpunk-display font-bold text-forest-800 mb-2">Error Loading Data</h1>
          <p className="text-forest-600 font-solarpunk-body mb-6">{error}</p>
          <button
            onClick={loadAnalytics}
            className="solarpunk-btn-primary"
          >
            <RefreshCw className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - Solarpunk Style */}
        <div className="mb-8 animate-solarpunk-fade-in">
          <div className="solarpunk-card">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-solarpunk-display font-bold text-forest-800 flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-forest-400 to-ocean-400 rounded-2xl shadow-glow">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <span className="solarpunk-text-gradient">User Interaction Analytics</span>
                </h1>
                <p className="text-forest-600 font-solarpunk-body mt-2 ml-16">
                  Comprehensive insights from all services across your portal
                </p>
              </div>
              <div className="flex gap-4 w-full lg:w-auto">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '1d' | '7d' | '30d')}
                  className="flex-1 lg:flex-none border-2 border-forest-200 rounded-xl px-4 py-2 bg-white/80 backdrop-blur-sm text-forest-700 font-solarpunk-body font-medium focus:border-forest-400 focus:ring-2 focus:ring-forest-200 transition-all"
                >
                  <option value="1d">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <button
                  onClick={loadAnalytics}
                  disabled={loading}
                  className="solarpunk-btn-secondary disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation - Solarpunk Style */}
          <div className="border-b-2 border-forest-200/50 mt-6">
            <nav className="-mb-0.5 flex space-x-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'services', label: 'Real Services', icon: BarChart3 },
                { id: 'clicks', label: 'Button Clicks', icon: MousePointer },
                { id: 'navigation', label: 'Navigation', icon: Navigation },
                { id: 'users', label: 'User Activity', icon: Users },
                { id: 'components', label: 'Components', icon: Eye }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-solarpunk-body font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-700 border-b-2 border-forest-500 shadow-md'
                      : 'text-forest-600 hover:bg-white/60 hover:text-forest-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {analytics && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics - Solarpunk Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="solarpunk-story-card group animate-solarpunk-slide-up">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-br from-ocean-400 to-sky-400 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                          <MousePointer className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-solarpunk-body font-medium text-ocean-600">Total Interactions</p>
                          <p className="text-2xl font-solarpunk-display font-bold text-forest-700">{analytics.totalInteractions.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="solarpunk-story-card group animate-solarpunk-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-br from-forest-400 to-ocean-400 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-solarpunk-body font-medium text-forest-600">Unique Users</p>
                          <p className="text-2xl font-solarpunk-display font-bold text-forest-700">{analytics.uniqueUsers}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="solarpunk-story-card group animate-solarpunk-slide-up" style={{ animationDelay: '200ms' }}>
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-br from-solar-400 to-terracotta-400 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                          <Navigation className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-solarpunk-body font-medium text-solar-600">Page Views</p>
                          <p className="text-2xl font-solarpunk-display font-bold text-forest-700">{analytics.pageViews.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="solarpunk-story-card group animate-solarpunk-slide-up" style={{ animationDelay: '300ms' }}>
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-br from-forest-400 to-solar-400 rounded-xl shadow-glow group-hover:scale-110 transition-transform">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-solarpunk-body font-medium text-forest-600">Interactive Components</p>
                          <p className="text-2xl font-solarpunk-display font-bold text-forest-700">{analytics.topInteractiveComponents.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity - Solarpunk Style */}
                <div className="solarpunk-card animate-solarpunk-slide-up" style={{ animationDelay: '400ms' }}>
                  <div className="mb-4">
                    <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Recent Activity</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.recentActivity.slice(0, 20).map((activity, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatUserEmail(activity.userEmail || '')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {activity.eventName}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {activity.page || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTimestamp(activity.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Button Clicks Tab */}
            {activeTab === 'clicks' && (
              <div className="solarpunk-card">
                <div className="mb-4">
                  <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Button Click Analytics</h3>
                  <p className="text-sm text-forest-600 font-solarpunk-body mt-1">Most clicked buttons and their usage patterns</p>
                </div>
                {analytics.buttonClicks.length === 0 ? (
                  <div className="p-12 text-center">
                    <MousePointer className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <p className="text-forest-600 font-solarpunk-body">No button click data available for this time period</p>
                    <p className="text-sm text-forest-500 mt-2">Button interactions will appear here once users start clicking buttons in the app</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Button Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Click Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.buttonClicks.map((click, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {click.eventName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {click.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {click.users.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, (click.count / Math.max(...analytics.buttonClicks.map(c => c.count))) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {Math.round((click.count / analytics.totalInteractions) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Tab */}
            {activeTab === 'navigation' && (
              <div className="solarpunk-card">
                <div className="mb-4">
                  <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Page Navigation Analytics</h3>
                  <p className="text-sm text-forest-600 font-solarpunk-body mt-1">How users navigate through the application</p>
                </div>
                {analytics.pageViews.length === 0 ? (
                  <div className="p-12 text-center">
                    <Navigation className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <p className="text-forest-600 font-solarpunk-body">No navigation data available for this time period</p>
                    <p className="text-sm text-forest-500 mt-2">Page views will appear here once users start navigating the app</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popularity</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.pageViews.map((page, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {page.page}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {page.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {page.uniqueUsers}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, (page.count / Math.max(...analytics.pageViews.map(p => p.count))) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {Math.round((page.count / analytics.totalInteractions) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="solarpunk-card">
                <div className="mb-4">
                  <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">User Activity</h3>
                  <p className="text-sm text-forest-600 font-solarpunk-body mt-1">Individual user interaction patterns</p>
                </div>
                {analytics.userActivity.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <p className="text-forest-600 font-solarpunk-body">No user activity data available for this time period</p>
                    <p className="text-sm text-forest-500 mt-2">User interactions will appear here once activity is tracked</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Level</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.userActivity.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatUserEmail(user.userEmail)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.userId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.interactionCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimestamp(user.lastActive)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.interactionCount > 50 ? 'bg-green-100 text-green-800' :
                              user.interactionCount > 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.interactionCount > 50 ? 'High' :
                               user.interactionCount > 20 ? 'Medium' : 'Low'}
                            </span>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Components Tab */}
            {activeTab === 'components' && (
              <div className="solarpunk-card">
                <div className="mb-4">
                  <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Component Interaction Analytics</h3>
                  <p className="text-sm text-forest-600 font-solarpunk-body mt-1">Most interactive components and their usage</p>
                </div>
                {analytics.topInteractiveComponents.length === 0 ? (
                  <div className="p-12 text-center">
                    <Eye className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <p className="text-forest-600 font-solarpunk-body">No component interaction data available for this time period</p>
                    <p className="text-sm text-forest-500 mt-2">Component interactions will appear here once users start interacting with app components</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interactions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Users</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popularity</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.topInteractiveComponents.map((component, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {component.componentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {component.interactions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {component.uniqueUsers}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-purple-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, (component.interactions / Math.max(...analytics.topInteractiveComponents.map(c => c.interactions))) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">
                                {Math.round((component.interactions / analytics.totalInteractions) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Real Services Tab - NEW! */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {!serviceData ? (
                  <div className="solarpunk-card p-12 text-center">
                    <RefreshCw className="h-12 w-12 text-forest-600 animate-spin mx-auto mb-4" />
                    <p className="text-forest-700 font-solarpunk-body font-semibold">Loading service data...</p>
                  </div>
                ) : (
                  <>
                    {/* Service Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Events Card */}
                  <div className="solarpunk-story-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-forest-400 to-ocean-400 rounded-xl mr-3 shadow-glow">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Events</h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Total Events:</span>
                          <span className="text-xl font-bold text-forest-700">{serviceData.events.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-ocean-600">Upcoming:</span>
                          <span className="text-lg font-semibold text-ocean-700">{serviceData.events.upcoming}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Total RSVPs:</span>
                          <span className="text-lg font-semibold text-forest-700">{serviceData.events.totalRSVPs}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Announcements Card */}
                  <div className="solarpunk-story-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-ocean-400 to-sky-400 rounded-xl mr-3 shadow-glow">
                            <MessageSquare className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Announcements</h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Total:</span>
                          <span className="text-xl font-bold text-forest-700">{serviceData.announcements.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-ocean-600">Recent ({timeRange}):</span>
                          <span className="text-lg font-semibold text-ocean-700">{serviceData.announcements.recent}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Total Views:</span>
                          <span className="text-lg font-semibold text-forest-700">{serviceData.announcements.totalViews}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resources Card */}
                  <div className="solarpunk-story-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-solar-400 to-terracotta-400 rounded-xl mr-3 shadow-glow">
                            <Download className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Resources</h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Total Resources:</span>
                          <span className="text-xl font-bold text-forest-700">{serviceData.resources.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-solar-600">Downloads:</span>
                          <span className="text-lg font-semibold text-solar-700">{serviceData.resources.downloads}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Card */}
                  <div className="solarpunk-story-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-forest-400 to-solar-400 rounded-xl mr-3 shadow-glow">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Feedback</h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Total:</span>
                          <span className="text-xl font-bold text-forest-700">{serviceData.feedback.total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-solar-600">Pending:</span>
                          <span className="text-lg font-semibold text-solar-700">{serviceData.feedback.pending}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Resolved:</span>
                          <span className="text-lg font-semibold text-forest-700">{serviceData.feedback.resolved}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Volunteer Card */}
                  <div className="solarpunk-story-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-ocean-400 to-forest-400 rounded-xl mr-3 shadow-glow">
                            <UserPlus className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Volunteer</h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Opportunities:</span>
                          <span className="text-xl font-bold text-forest-700">{serviceData.volunteer.totalOpportunities}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-ocean-600">Signups:</span>
                          <span className="text-lg font-semibold text-ocean-700">{serviceData.volunteer.totalSignups}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ecology Card */}
                  <div className="solarpunk-story-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-forest-400 to-ocean-400 rounded-xl mr-3 shadow-glow">
                            <Leaf className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-lg font-solarpunk-display font-bold text-forest-800">Ecology</h3>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(serviceData.ecology.deviceStatus)}`}>
                          {serviceData.ecology.deviceStatus === 'online' ? (
                            <><CheckCircle className="w-3 h-3 inline mr-1" />Online</>
                          ) : (
                            <><AlertCircle className="w-3 h-3 inline mr-1" />Offline</>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Total Readings:</span>
                          <span className="text-xl font-bold text-forest-700">{serviceData.ecology.totalReadings}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-ocean-600">Recent ({timeRange}):</span>
                          <span className="text-lg font-semibold text-ocean-700">{serviceData.ecology.recentReadings}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-forest-600">Camera Images:</span>
                          <span className="text-lg font-semibold text-forest-700">{serviceData.ecology.cameraImages}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent RSVPs */}
                  <div className="solarpunk-card">
                    <div className="mb-4">
                      <h3 className="text-lg font-solarpunk-display font-bold text-forest-800 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-forest-600" />
                        Recent Event RSVPs
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {serviceData.events.recentRSVPs.slice(0, 5).map((rsvp, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-forest-50 to-ocean-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-forest-700">{rsvp.eventTitle}</p>
                            <p className="text-xs text-ocean-600">{rsvp.userName}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(rsvp.status)}`}>
                            {rsvp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Volunteer Signups */}
                  <div className="solarpunk-card">
                    <div className="mb-4">
                      <h3 className="text-lg font-solarpunk-display font-bold text-forest-800 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-ocean-600" />
                        Recent Volunteer Signups
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {serviceData.volunteer.recentSignups.slice(0, 5).map((signup, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-ocean-50 to-forest-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-ocean-700">{signup.opportunityName}</p>
                            <p className="text-xs text-forest-600">{signup.userName}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(signup.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Downloaded Resources */}
                  <div className="solarpunk-card">
                    <div className="mb-4">
                      <h3 className="text-lg font-solarpunk-display font-bold text-forest-800 flex items-center gap-2">
                        <Download className="w-5 h-5 text-solar-600" />
                        Most Downloaded Resources
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {serviceData.resources.recentDownloads.slice(0, 5).map((resource, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-solar-50 to-terracotta-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-forest-700 truncate">{resource.name}</p>
                          </div>
                          <span className="text-lg font-bold text-solar-700 ml-3">{resource.downloadCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Feedback */}
                  <div className="solarpunk-card">
                    <div className="mb-4">
                      <h3 className="text-lg font-solarpunk-display font-bold text-forest-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-forest-600" />
                        Recent Feedback
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {serviceData.feedback.recent.slice(0, 5).map((feedback, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-forest-50 to-solar-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-forest-700">{feedback.category}</p>
                            <p className="text-xs text-gray-500">{formatTimestamp(feedback.timestamp)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(feedback.status)}`}>
                            {feedback.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserInteractionDashboard;
