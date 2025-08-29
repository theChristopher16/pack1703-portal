import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics';
import app from '../firebase/config';

// Initialize Firebase Analytics
const analytics = getAnalytics(app);

// Analytics event types
export interface AnalyticsEvent {
  eventName: string;
  parameters?: Record<string, string | number | boolean>;
  timestamp?: number;
}

// Page view tracking
export const trackPageView = (pageName: string, pagePath: string) => {
  try {
    logEvent(analytics, 'page_view', {
      page_name: pageName,
      page_path: pagePath,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Feature usage tracking
export const trackFeatureUsage = (featureName: string, action: string, details?: Record<string, any>) => {
  try {
    logEvent(analytics, 'feature_usage', {
      feature_name: featureName,
      action: action,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Performance tracking
export const trackPerformance = (metricName: string, value: number, unit: string = 'ms') => {
  try {
    logEvent(analytics, 'performance_metric', {
      metric_name: metricName,
      value: value,
      unit: unit,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Error tracking
export const trackError = (errorType: string, errorMessage: string, context?: string) => {
  try {
    logEvent(analytics, 'error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context: context,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// User engagement tracking
export const trackEngagement = (action: string, duration?: number, page?: string) => {
  try {
    logEvent(analytics, 'user_engagement', {
      action: action,
      duration: duration,
      page: page,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Conversion tracking
export const trackConversion = (conversionType: string, value: number, details?: Record<string, any>) => {
  try {
    logEvent(analytics, 'conversion', {
      conversion_type: conversionType,
      value: value,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Track feature clicks
export const trackFeatureClick = (featureName: string, parameters?: Record<string, any>) => {
  try {
    logEvent(analytics, 'feature_click', {
      feature_name: featureName,
      ...parameters,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Session tracking
export const trackSessionStart = () => {
  try {
    logEvent(analytics, 'session_start', {
      timestamp: Date.now(),
      session_id: generateSessionId(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

export const trackSessionEnd = (duration: number, pagesVisited: number) => {
  try {
    logEvent(analytics, 'session_end', {
      duration: duration,
      pages_visited: pagesVisited,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Generate a simple session ID (no PII)
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Privacy-focused user properties (no PII)
export const setPrivacySafeUserProperties = (properties: {
  isReturningUser?: boolean;
  preferredLanguage?: string;
  deviceType?: string;
  accessibilityFeatures?: string[];
}) => {
  try {
    setUserProperties(analytics, {
      is_returning_user: properties.isReturningUser?.toString() || 'false',
      preferred_language: properties.preferredLanguage || 'en',
      device_type: properties.deviceType || 'unknown',
      accessibility_features: properties.accessibilityFeatures?.join(',') || 'none',
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Track component interactions
export const trackComponentInteraction = (componentName: string, action: string, details?: Record<string, any>) => {
  try {
    logEvent(analytics, 'component_interaction', {
      component_name: componentName,
      action: action,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Track search behavior
export const trackSearch = (searchTerm: string, resultsCount: number, filters?: Record<string, any>) => {
  try {
    logEvent(analytics, 'search_performed', {
      search_term: searchTerm,
      results_count: resultsCount,
      filters: filters ? JSON.stringify(filters) : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Track navigation patterns
export const trackNavigation = (fromPage: string, toPage: string, navigationMethod: string) => {
  try {
    logEvent(analytics, 'navigation', {
      from_page: fromPage,
      to_page: toPage,
      navigation_method: navigationMethod,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Track accessibility interactions
export const trackAccessibility = (feature: string, action: string, details?: Record<string, any>) => {
  try {
    logEvent(analytics, 'accessibility_interaction', {
      feature: feature,
      action: action,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// Track RSVP submissions specifically
export const trackRSVPSubmission = (eventId: string, success: boolean, details?: Record<string, any>) => {
  try {
    logEvent(analytics, 'rsvp_submission', {
      event_id: eventId,
      success: success,
      attendees_count: details?.attendees || 0,
      timestamp: Date.now(),
      ...details
    });
  } catch (error) {
    console.warn('RSVP tracking error:', error);
  }
};

// Export analytics instance for direct use if needed
export { analytics };
