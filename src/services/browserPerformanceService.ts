import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface BrowserPerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Navigation Timing
  domContentLoaded?: number;
  loadComplete?: number;
  
  // Resource Timing
  resourceCount?: number;
  resourceSize?: number;
  
  // Memory Usage (if available)
  memoryUsage?: number;
  
  // Custom Metrics
  pageLoadTime?: number;
  timeToInteractive?: number;
  
  // Network
  connectionType?: string;
  effectiveType?: string;
  
  // Device Info
  deviceMemory?: number;
  hardwareConcurrency?: number;
  
  timestamp: Date;
}

class BrowserPerformanceService {
  private isInitialized = false;
  private metrics: Partial<BrowserPerformanceMetrics> = {};

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Wait for page to be fully loaded
      if (document.readyState === 'complete') {
        await this.collectMetrics();
      } else {
        window.addEventListener('load', () => {
          setTimeout(() => this.collectMetrics(), 1000); // Wait 1 second after load
        });
      }
      
      // Set up continuous monitoring
      this.setupContinuousMonitoring();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize browser performance monitoring:', error);
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: Partial<BrowserPerformanceMetrics> = {
        timestamp: new Date()
      };

      // Navigation Timing API
      if (performance.getEntriesByType) {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          metrics.domContentLoaded = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
          metrics.loadComplete = nav.loadEventEnd - nav.loadEventStart;
          metrics.pageLoadTime = nav.loadEventEnd - nav.fetchStart;
          metrics.ttfb = nav.responseStart - nav.requestStart;
        }
      }

      // Resource Timing API
      if (performance.getEntriesByType) {
        const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        metrics.resourceCount = resourceEntries.length;
        metrics.resourceSize = resourceEntries.reduce((total, entry) => {
          return total + (entry.transferSize || 0);
        }, 0);
      }

      // Memory API (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      }

      // Connection API (if available)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        metrics.connectionType = connection.type;
        metrics.effectiveType = connection.effectiveType;
      }

      // Device Memory (if available)
      if ('deviceMemory' in navigator) {
        metrics.deviceMemory = (navigator as any).deviceMemory;
      }

      // Hardware Concurrency
      metrics.hardwareConcurrency = navigator.hardwareConcurrency;

      // Calculate time to interactive (simplified)
      if (metrics.domContentLoaded && metrics.loadComplete) {
        metrics.timeToInteractive = metrics.domContentLoaded + metrics.loadComplete;
      }

      this.metrics = metrics;
      
      // Store metrics in Firebase
      await this.storeMetrics(metrics);
      
    } catch (error) {
      console.error('Error collecting browser performance metrics:', error);
    }
  }

  private setupContinuousMonitoring(): void {
    // Monitor Core Web Vitals using the web-vitals library if available
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // LCP - Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.updateMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID - First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.updateMetric('fid', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS - Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.updateMetric('cls', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // FCP - First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.updateMetric('fcp', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Monitor memory usage periodically
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / (1024 * 1024);
        this.updateMetric('memoryUsage', memoryUsage);
      }
    }, 30000); // Every 30 seconds
  }

  private async updateMetric(metricName: string, value: number): Promise<void> {
    try {
      this.metrics = { ...this.metrics, [metricName]: value };
      
      // Store individual metric updates
      await this.storeMetric(metricName, value);
    } catch (error) {
      console.warn(`Failed to update metric ${metricName}:`, error);
    }
  }

  private async storeMetrics(metrics: Partial<BrowserPerformanceMetrics>): Promise<void> {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const db = getFirestore();
      
      await addDoc(collection(db, 'performance_metrics'), {
        type: 'browser_performance',
        ...metrics,
        userId: auth.currentUser.uid,
        userAgent: navigator.userAgent,
        url: window.location.href,
        page: window.location.pathname,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.warn('Failed to store browser performance metrics:', error);
    }
  }

  private async storeMetric(metricName: string, value: number): Promise<void> {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return;

      const db = getFirestore();
      
      await addDoc(collection(db, 'performance_metrics'), {
        type: 'browser_metric',
        metric: metricName,
        value: value,
        userId: auth.currentUser.uid,
        userAgent: navigator.userAgent,
        url: window.location.href,
        page: window.location.pathname,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.warn(`Failed to store metric ${metricName}:`, error);
    }
  }

  getCurrentMetrics(): Partial<BrowserPerformanceMetrics> {
    return { ...this.metrics };
  }

  // Public method to manually collect metrics
  async collectMetricsNow(): Promise<BrowserPerformanceMetrics | null> {
    try {
      await this.collectMetrics();
      return this.metrics as BrowserPerformanceMetrics;
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      return null;
    }
  }

  // Get performance score based on Core Web Vitals
  getPerformanceScore(): number {
    const { lcp, fid, cls } = this.metrics;
    let score = 100;

    // LCP scoring (Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s)
    if (lcp) {
      if (lcp > 4000) score -= 30;
      else if (lcp > 2500) score -= 15;
    }

    // FID scoring (Good: < 100ms, Needs Improvement: 100-300ms, Poor: > 300ms)
    if (fid) {
      if (fid > 300) score -= 25;
      else if (fid > 100) score -= 10;
    }

    // CLS scoring (Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25)
    if (cls) {
      if (cls > 0.25) score -= 25;
      else if (cls > 0.1) score -= 10;
    }

    return Math.max(0, score);
  }
}

const browserPerformanceService = new BrowserPerformanceService();
export default browserPerformanceService;
