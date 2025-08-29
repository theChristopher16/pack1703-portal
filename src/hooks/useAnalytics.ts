import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackPageView,
  trackFeatureUsage,
  trackPerformance,
  trackError,
  trackEngagement,
  trackConversion,
  trackSessionStart,
  trackSessionEnd,
  trackComponentInteraction,
  trackSearch,
  trackNavigation,
  trackAccessibility,
  setPrivacySafeUserProperties,
} from '../services/analytics';

export const useAnalytics = () => {
  const location = useLocation();
  const sessionStartTime = useRef<number>(Date.now());
  const pagesVisited = useRef<number>(0);
  const lastPage = useRef<string>('');

  // Track page views automatically
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    const pagePath = location.pathname;
    
    // Track navigation if this isn't the first page
    if (lastPage.current && lastPage.current !== pagePath) {
      trackNavigation(lastPage.current, pagePath, 'navigation');
    }
    
    // Track page view
    trackPageView(pageName, pagePath);
    pagesVisited.current += 1;
    lastPage.current = pagePath;
    
    // Track engagement (time spent on previous page)
    if (lastPage.current !== pagePath) {
      const timeOnPage = Date.now() - sessionStartTime.current;
      trackEngagement('page_view', timeOnPage, lastPage.current);
    }
    
    // Reset timer for new page
    sessionStartTime.current = Date.now();
  }, [location.pathname]);

  // Track session start on mount
  useEffect(() => {
    trackSessionStart();
    
    // Set privacy-safe user properties
    setPrivacySafeUserProperties({
      deviceType: getDeviceType(),
      preferredLanguage: navigator.language || 'en',
      accessibilityFeatures: getAccessibilityFeatures(),
    });

    // Track session end on unmount
    return () => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      trackSessionEnd(sessionDuration, pagesVisited.current);
    };
  }, []);

  // Helper function to get page name from path
  const getPageName = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'Home';
      case '/events':
        return 'Events';
      case '/locations':
        return 'Locations';
      case '/announcements':
        return 'Announcements';
      case '/resources':
        return 'Resources';
      case '/volunteer':
        return 'Volunteer';
      case '/feedback':
        return 'Feedback';
      case '/privacy':
        return 'Privacy Policy';
      default:
        return 'Unknown Page';
    }
  };

  // Helper function to get device type
  const getDeviceType = (): string => {
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  };

  // Helper function to detect accessibility features
  const getAccessibilityFeatures = (): string[] => {
    const features: string[] = [];
    
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      features.push('reduced_motion');
    }
    
    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      features.push('high_contrast');
    }
    
    // Check for dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      features.push('dark_mode');
    }
    
    return features.length > 0 ? features : ['none'];
  };

  // Performance tracking
  const trackPageLoadTime = useCallback((loadTime: number) => {
    trackPerformance('page_load_time', loadTime);
  }, []);

  const trackComponentLoadTime = useCallback((componentName: string, loadTime: number) => {
    trackPerformance(`${componentName}_load_time`, loadTime);
  }, []);

  // Error tracking
  const trackComponentError = useCallback((componentName: string, error: Error, context?: string) => {
    trackError('component_error', error.message, `${componentName}: ${context || 'unknown'}`);
  }, []);

  // Feature usage tracking
  const trackFeatureClick = useCallback((featureName: string, details?: Record<string, any>) => {
    trackFeatureUsage(featureName, 'click', details);
  }, []);

  const trackFeatureView = useCallback((featureName: string, details?: Record<string, any>) => {
    trackFeatureUsage(featureName, 'view', details);
  }, []);

  // Search tracking
  const trackSearchQuery = useCallback((searchTerm: string, resultsCount: number, filters?: Record<string, any>) => {
    trackSearch(searchTerm, resultsCount, filters);
  }, []);

  // Component interaction tracking
  const trackComponentAction = useCallback((componentName: string, action: string, details?: Record<string, any>) => {
    trackComponentInteraction(componentName, action, details);
  }, []);

  // Accessibility tracking
  const trackAccessibilityAction = useCallback((feature: string, action: string, details?: Record<string, any>) => {
    trackAccessibility(feature, action, details);
  }, []);

  // Conversion tracking
  const trackRSVPSubmission = useCallback((eventId: string, success: boolean, details?: Record<string, any>) => {
    trackConversion('rsvp_submission', success ? 1 : 0, { eventId, ...details });
  }, []);

  const trackVolunteerSignup = useCallback((roleId: string, success: boolean, details?: Record<string, any>) => {
    trackConversion('volunteer_signup', success ? 1 : 0, { roleId, ...details });
  }, []);

  const trackFeedbackSubmission = useCallback((success: boolean, details?: Record<string, any>) => {
    trackConversion('feedback_submission', success ? 1 : 0, details);
  }, []);

  // Engagement tracking
  const trackTimeOnPage = useCallback((page: string, duration: number) => {
    trackEngagement('time_on_page', duration, page);
  }, []);

  const trackScrollDepth = useCallback((page: string, depth: number) => {
    trackEngagement('scroll_depth', depth, page);
  }, []);

  return {
    // Page tracking
    trackPageView,
    trackPageLoadTime,
    
    // Component tracking
    trackComponentLoadTime,
    trackComponentError,
    trackComponentAction,
    
    // Feature tracking
    trackFeatureClick,
    trackFeatureView,
    
    // Search tracking
    trackSearchQuery,
    
    // Accessibility tracking
    trackAccessibilityAction,
    
    // Conversion tracking
    trackRSVPSubmission,
    trackVolunteerSignup,
    trackFeedbackSubmission,
    
    // Engagement tracking
    trackTimeOnPage,
    trackScrollDepth,
    
    // Performance tracking
    trackPerformance,
    
    // Error tracking
    trackError,
  };
};
