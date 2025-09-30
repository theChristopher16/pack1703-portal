import { getFirestore, collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface AnalyticsEvent {
  type: 'page_view' | 'feature_usage' | 'session_start' | 'session_end' | 'user_action';
  page?: string;
  feature?: string;
  action?: string;
  userAgent?: string;
  duration?: number;
  metadata?: any;
}

class AnalyticsService {
  private db = getFirestore();
  private auth = getAuth();
  private sessionStartTime: number | null = null;

  constructor() {
    this.initializeSession();
  }

  private initializeSession() {
    this.sessionStartTime = Date.now();
          this.trackEvent({
        type: 'session_start',
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language
        }
      });
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const user = this.auth.currentUser;
      
      // Only track analytics if user is authenticated
      if (!user) {
        console.log('Analytics tracking skipped - user not authenticated');
        return;
      }
      
      await addDoc(collection(this.db, 'analytics'), {
        ...event,
        userId: user.uid,
        userEmail: user.email || null,
        timestamp: serverTimestamp(),
        sessionId: this.sessionStartTime,
        userAgent: event.userAgent || navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  async trackPageView(pageName: string): Promise<void> {
    await this.trackEvent({
      type: 'page_view',
      page: pageName,
      userAgent: navigator.userAgent
    });
  }

  async trackFeatureUsage(featureName: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      type: 'feature_usage',
      feature: featureName,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        page: window.location.pathname
      }
    });
  }

  // Track specific features with enhanced metadata
  async trackChatUsage(action: string, metadata?: any): Promise<void> {
    await this.trackFeatureUsage('chat', {
      action,
      ...metadata
    });
  }

  async trackEventInteraction(action: string, eventId?: string, metadata?: any): Promise<void> {
    await this.trackFeatureUsage('events', {
      action,
      eventId,
      ...metadata
    });
  }

  async trackLocationInteraction(action: string, locationId?: string, metadata?: any): Promise<void> {
    await this.trackFeatureUsage('locations', {
      action,
      locationId,
      ...metadata
    });
  }

  async trackAdminAction(action: string, target?: string, metadata?: any): Promise<void> {
    await this.trackFeatureUsage('admin', {
      action,
      target,
      ...metadata
    });
  }

  async trackUserAction(action: string, metadata?: any): Promise<void> {
    await this.trackEvent({
      type: 'user_action',
      action,
      metadata
    });
  }

  async endSession(): Promise<void> {
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      await this.trackEvent({
        type: 'session_end',
        duration
      });
      this.sessionStartTime = null;
    }
  }

  // Get analytics data for dashboard
  async getAnalyticsData(timeRange: '7d' | '30d' | '90d'): Promise<any> {
    try {
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      console.log('AnalyticsService - Time range:', timeRange, 'Start date:', startDate);

      // Get all analytics data and filter in memory to avoid composite index requirements
      const analyticsQuery = query(
        collection(this.db, 'analytics'),
        orderBy('timestamp', 'desc'),
        limit(1000) // Limit to recent data to avoid performance issues
      );
      const analyticsSnapshot = await getDocs(analyticsQuery);
      console.log('AnalyticsService - Total analytics documents:', analyticsSnapshot.docs.length);

      // Filter data in memory
      const allData = analyticsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(item => {
        const itemDate = (item as any).timestamp?.toDate ? (item as any).timestamp.toDate() : new Date((item as any).timestamp);
        return itemDate >= startDate;
      });
      console.log('AnalyticsService - Filtered data count:', allData.length);

      // Separate by type
      const pageViews = allData.filter(item => (item as any).type === 'page_view');
      const featureUsage = allData.filter(item => (item as any).type === 'feature_usage');
      const sessions = allData.filter(item => (item as any).type === 'session_end');
      console.log('AnalyticsService - Page views:', pageViews.length, 'Feature usage:', featureUsage.length, 'Sessions:', sessions.length);
      console.log('AnalyticsService - Feature usage data:', featureUsage);
      console.log('AnalyticsService - Session durations:', sessions.map(s => (s as any).duration));

      // Process page views
      const pageCounts: { [key: string]: number } = {};
      pageViews.forEach(item => {
        const pageName = (item as any).page || 'Unknown';
        pageCounts[pageName] = (pageCounts[pageName] || 0) + 1;
      });

      // Process feature usage
      const featureCounts: { [key: string]: number } = {};
      featureUsage.forEach(item => {
        const featureName = (item as any).feature || 'Unknown';
        featureCounts[featureName] = (featureCounts[featureName] || 0) + 1;
      });
      console.log('AnalyticsService - Feature counts:', featureCounts);

      // Process device types
      const deviceCounts: { [key: string]: number } = {};
      pageViews.forEach(item => {
        const userAgent = (item as any).userAgent || '';
        let deviceType = 'Desktop';
        if (userAgent.includes('Mobile')) deviceType = 'Mobile';
        else if (userAgent.includes('Tablet')) deviceType = 'Tablet';
        deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
      });

      // Calculate session duration (convert milliseconds to seconds)
      const sessionDurations = sessions.map(item => (item as any).duration || 0);
      console.log('AnalyticsService - Raw session durations (ms):', sessionDurations.slice(0, 5));
      const averageSessionDuration = sessionDurations.length > 0 
        ? Math.floor(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length / 1000)
        : 0;
      console.log('AnalyticsService - Average session duration (seconds):', averageSessionDuration);

      const result = {
        pageViews: pageViews.length,
        topPages: Object.entries(pageCounts)
          .map(([name, views]) => ({ name, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 4),
        featureUsage: Object.entries(featureCounts)
          .map(([feature, usage]) => ({ feature, usage }))
          .sort((a, b) => b.usage - a.usage)
          .slice(0, 4),
        deviceTypes: Object.entries(deviceCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        averageSessionDuration
      };
      console.log('AnalyticsService - Final result:', result);
      return result;
    } catch (error) {
      console.error('Error getting analytics data:', error);
      return {
        pageViews: 0,
        topPages: [],
        featureUsage: [],
        deviceTypes: [],
        averageSessionDuration: 0
      };
    }
  }
}

const analyticsService = new AnalyticsService();

// Track page views automatically
if (typeof window !== 'undefined') {
  // Track initial page load
  analyticsService.trackPageView(window.location.pathname);

  // Track navigation changes
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function(...args) {
    originalPushState.apply(window.history, args);
    analyticsService.trackPageView(window.location.pathname);
  };

  window.history.replaceState = function(...args) {
    originalReplaceState.apply(window.history, args);
    analyticsService.trackPageView(window.location.pathname);
  };

  // Track page unload to end session
  window.addEventListener('beforeunload', () => {
    analyticsService.endSession();
  });
}

export default analyticsService;
