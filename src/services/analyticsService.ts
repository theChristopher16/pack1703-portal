import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
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
      
      await addDoc(collection(this.db, 'analytics'), {
        ...event,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || null,
        timestamp: serverTimestamp(),
        sessionId: this.sessionStartTime,
        userAgent: event.userAgent || navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
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
      metadata
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

      // Get page views
      const pageViewsQuery = query(
        collection(this.db, 'analytics'),
        where('timestamp', '>=', startDate),
        where('type', '==', 'page_view')
      );
      const pageViewsSnapshot = await getDocs(pageViewsQuery);

      // Get feature usage
      const featureQuery = query(
        collection(this.db, 'analytics'),
        where('timestamp', '>=', startDate),
        where('type', '==', 'feature_usage')
      );
      const featureSnapshot = await getDocs(featureQuery);

      // Get session data
      const sessionQuery = query(
        collection(this.db, 'analytics'),
        where('timestamp', '>=', startDate),
        where('type', '==', 'session_end')
      );
      const sessionSnapshot = await getDocs(sessionQuery);

      // Process page views
      const pageCounts: { [key: string]: number } = {};
      pageViewsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const pageName = data.page || 'Unknown';
        pageCounts[pageName] = (pageCounts[pageName] || 0) + 1;
      });

      // Process feature usage
      const featureCounts: { [key: string]: number } = {};
      featureSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const featureName = data.feature || 'Unknown';
        featureCounts[featureName] = (featureCounts[featureName] || 0) + 1;
      });

      // Process device types
      const deviceCounts: { [key: string]: number } = {};
      pageViewsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userAgent = data.userAgent || '';
        let deviceType = 'Desktop';
        if (userAgent.includes('Mobile')) deviceType = 'Mobile';
        else if (userAgent.includes('Tablet')) deviceType = 'Tablet';
        deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
      });

      // Calculate session duration
      const sessionDurations = sessionSnapshot.docs.map(doc => doc.data().duration || 0);
      const averageSessionDuration = sessionDurations.length > 0 
        ? Math.floor(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
        : 0;

      return {
        pageViews: pageViewsSnapshot.size,
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
