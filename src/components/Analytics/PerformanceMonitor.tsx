import React, { useEffect, useRef } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';

interface PerformanceMonitorProps {
  pageName: string;
  children: React.ReactNode;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ pageName, children }) => {
  const { trackPageLoadTime, trackPerformance, trackComponentError } = useAnalytics();
  const pageLoadStartTime = useRef<number>(Date.now());
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // Track page load start
    const startTime = performance.now();
    pageLoadStartTime.current = startTime;

    // Track when page becomes interactive
    const trackInteractive = () => {
      const interactiveTime = performance.now() - startTime;
      trackPerformance('time_to_interactive', interactiveTime);
    };

    // Track when page is fully loaded
    const trackFullyLoaded = () => {
      const loadTime = performance.now() - startTime;
      trackPageLoadTime(loadTime);
    };

    // Track Core Web Vitals if available
    if ('PerformanceObserver' in window) {
      try {
        // Track Largest Contentful Paint (LCP)
        observerRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            trackPerformance('lcp', lastEntry.startTime);
          }
        });
        observerRef.current.observe({ entryTypes: ['largest-contentful-paint'] });

        // Track First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              trackPerformance('fid', entry.processingStart - entry.startTime);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Track Cumulative Layout Shift (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          trackPerformance('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Track First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          if (firstEntry) {
            trackPerformance('fcp', firstEntry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['first-contentful-paint'] });

      } catch (error) {
        trackComponentError('PerformanceMonitor', error as Error, 'Core Web Vitals tracking');
      }
    }

    // Track DOM content loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackInteractive);
    } else {
      trackInteractive();
    }

    // Track window load
    if (document.readyState === 'complete') {
      trackFullyLoaded();
    } else {
      window.addEventListener('load', trackFullyLoaded);
    }

    // Track scroll depth
    let maxScrollDepth = 0;
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        trackPerformance('scroll_depth', maxScrollDepth, 'percent');
      }
    };

    window.addEventListener('scroll', trackScrollDepth, { passive: true });

    // Track time on page
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - pageLoadStartTime.current;
      trackPerformance('time_on_page', timeOnPage);
    };

    // Track time on page every 30 seconds
    const timeInterval = setInterval(trackTimeOnPage, 30000);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      document.removeEventListener('DOMContentLoaded', trackInteractive);
      window.removeEventListener('load', trackFullyLoaded);
      window.removeEventListener('scroll', trackScrollDepth);
      clearInterval(timeInterval);
      
      // Final time on page tracking
      const finalTimeOnPage = Date.now() - pageLoadStartTime.current;
      trackPerformance('final_time_on_page', finalTimeOnPage);
    };
  }, [pageName, trackPageLoadTime, trackPerformance, trackComponentError]);

  // Track component render time
  useEffect(() => {
    const renderTime = performance.now() - pageLoadStartTime.current;
    trackPerformance(`${pageName}_render_time`, renderTime);
  }, [pageName, trackPerformance]);

  return <>{children}</>;
};

export default PerformanceMonitor;
