import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';

export interface MobileTestResult {
  id: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceName: string;
  viewport: {
    width: number;
    height: number;
  };
  testSuite: 'responsive' | 'touch' | 'performance' | 'accessibility' | 'pwa';
  testName: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
  timestamp: Date;
  userAgent: string;
  sessionId: string;
}

export interface MobileTestSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  deviceType: string;
  viewport: {
    width: number;
    height: number;
  };
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  testResults: MobileTestResult[];
}

export interface DeviceCapabilities {
  touchSupport: boolean;
  gestureSupport: boolean;
  pointerSupport: boolean;
  serviceWorkerSupport: boolean;
  manifestSupport: boolean;
  offlineSupport: boolean;
  screenReaderSupport: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
  connectionType: string;
  memoryUsage: number;
  frameRate: number;
}

class MobileTestingService {
  private db = getFirestore();
  private currentSession: MobileTestSession | null = null;

  /**
   * Start a new mobile testing session
   */
  async startTestSession(deviceType: string, viewport: { width: number; height: number }): Promise<string> {
    const sessionId = `mobile-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      deviceType,
      viewport,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      warningTests: 0,
      testResults: []
    };

    try {
      await addDoc(collection(this.db, 'mobileTestSessions'), {
        ...this.currentSession,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error starting test session:', error);
    }

    return sessionId;
  }

  /**
   * End the current test session
   */
  async endTestSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();

    try {
      await addDoc(collection(this.db, 'mobileTestSessions'), {
        ...this.currentSession,
        endTime: serverTimestamp(),
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending test session:', error);
    }

    this.currentSession = null;
  }

  /**
   * Record a test result
   */
  async recordTestResult(result: Omit<MobileTestResult, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active test session');
      return;
    }

    const testResult: MobileTestResult = {
      ...result,
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.currentSession.id
    };

    this.currentSession.testResults.push(testResult);
    this.currentSession.totalTests++;

    switch (result.status) {
      case 'success':
        this.currentSession.passedTests++;
        break;
      case 'error':
        this.currentSession.failedTests++;
        break;
      case 'warning':
        this.currentSession.warningTests++;
        break;
    }

    try {
      await addDoc(collection(this.db, 'mobileTestResults'), {
        ...testResult,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error recording test result:', error);
    }
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const memory = (performance as any).memory;

    return {
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      gestureSupport: 'ongesturestart' in window,
      pointerSupport: 'onpointerdown' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      manifestSupport: document.querySelector('link[rel="manifest"]') !== null,
      offlineSupport: 'onLine' in navigator,
      screenReaderSupport: 'speechSynthesis' in window,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      connectionType: connection?.effectiveType || 'unknown',
      memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0,
      frameRate: 0 // Will be measured separately
    };
  }

  /**
   * Measure frame rate
   */
  async measureFrameRate(): Promise<number> {
    return new Promise((resolve) => {
      let frameCount = 0;
      const startTime = performance.now();
      
      const measureFrame = () => {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(measureFrame);
        } else {
          resolve(frameCount);
        }
      };
      
      requestAnimationFrame(measureFrame);
    });
  }

  /**
   * Helper method to create and record test results
   */
  private async createAndRecordTestResult(
    deviceType: string,
    viewport: { width: number; height: number },
    testSuite: 'responsive' | 'touch' | 'performance' | 'accessibility' | 'pwa',
    testName: string,
    status: 'success' | 'error' | 'warning',
    message: string,
    details?: any
  ): Promise<MobileTestResult> {
    const result = {
      deviceType: deviceType as 'mobile' | 'tablet' | 'desktop',
      deviceName: `${deviceType} Device`,
      viewport,
      testSuite,
      testName,
      status,
      message,
      details,
      userAgent: navigator.userAgent
    };

    await this.recordTestResult(result);
    
    return {
      ...result,
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.currentSession?.id || ''
    };
  }

  /**
   * Test responsive design
   */
  async testResponsiveDesign(deviceType: string, viewport: { width: number; height: number }): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    const capabilities = this.getDeviceCapabilities();

    // Test viewport dimensions
    const viewportResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'responsive',
      'Viewport Dimensions',
      'success',
      `Viewport set to ${viewport.width}x${viewport.height}`,
      { width: viewport.width, height: viewport.height }
    );
    results.push(viewportResult);

    // Test responsive breakpoints
    const breakpoints = [
      { name: 'sm', width: 640 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 1024 },
      { name: 'xl', width: 1280 },
      { name: '2xl', width: 1536 }
    ];

    for (const bp of breakpoints) {
      const isActive = viewport.width >= bp.width;
      const breakpointResult = await this.createAndRecordTestResult(
        deviceType,
        viewport,
        'responsive',
        `${bp.name} Breakpoint (${bp.width}px)`,
        isActive ? 'success' : 'warning',
        isActive ? 'Breakpoint active' : 'Breakpoint inactive',
        { breakpoint: bp.name, width: bp.width, active: isActive }
      );
      results.push(breakpointResult);
    }

    return results;
  }

  /**
   * Test touch capabilities
   */
  async testTouchCapabilities(deviceType: string, viewport: { width: number; height: number }): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    const capabilities = this.getDeviceCapabilities();

    // Test touch support
    const touchResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'touch',
      'Touch Support',
      capabilities.touchSupport ? 'success' : 'warning',
      capabilities.touchSupport ? 'Touch events supported' : 'Touch events not supported',
      { touchSupport: capabilities.touchSupport, maxTouchPoints: navigator.maxTouchPoints }
    );
    results.push(touchResult);

    // Test gesture support
    const gestureResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'touch',
      'Gesture Support',
      capabilities.gestureSupport ? 'success' : 'warning',
      capabilities.gestureSupport ? 'Gesture events supported' : 'Gesture events not supported',
      { gestureSupport: capabilities.gestureSupport }
    );
    results.push(gestureResult);

    // Test pointer events
    const pointerResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'touch',
      'Pointer Events',
      capabilities.pointerSupport ? 'success' : 'warning',
      capabilities.pointerSupport ? 'Pointer events supported' : 'Pointer events not supported',
      { pointerSupport: capabilities.pointerSupport }
    );
    results.push(pointerResult);

    return results;
  }

  /**
   * Test performance metrics
   */
  async testPerformance(deviceType: string, viewport: { width: number; height: number }): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    const capabilities = this.getDeviceCapabilities();
    const frameRate = await this.measureFrameRate();

    // Test connection speed
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      const connectionResult = await this.createAndRecordTestResult(
        deviceType,
        viewport,
        'performance',
        'Connection Speed',
        'success',
        `Connection: ${connection.effectiveType || 'unknown'}`,
        {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        }
      );
      results.push(connectionResult);
    }

    // Test memory usage
    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      const memoryResult = await this.createAndRecordTestResult(
        deviceType,
        viewport,
        'performance',
        'Memory Usage',
        usedMB < 100 ? 'success' : 'warning',
        `Memory: ${usedMB}MB / ${totalMB}MB`,
        { used: usedMB, total: totalMB }
      );
      results.push(memoryResult);
    }

    // Test frame rate
    const frameRateResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'performance',
      'Frame Rate',
      frameRate >= 30 ? 'success' : 'warning',
      `FPS: ${frameRate}`,
      { fps: frameRate }
    );
    results.push(frameRateResult);

    return results;
  }

  /**
   * Test accessibility features
   */
  async testAccessibility(deviceType: string, viewport: { width: number; height: number }): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    const capabilities = this.getDeviceCapabilities();

    // Test reduced motion preference
    const motionResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'accessibility',
      'Reduced Motion',
      'success',
      capabilities.reducedMotion ? 'Reduced motion preferred' : 'Normal motion',
      { reducedMotion: capabilities.reducedMotion }
    );
    results.push(motionResult);

    // Test high contrast preference
    const contrastResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'accessibility',
      'High Contrast',
      'success',
      capabilities.highContrast ? 'High contrast preferred' : 'Normal contrast',
      { highContrast: capabilities.highContrast }
    );
    results.push(contrastResult);

    // Test color scheme preference
    const colorResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'accessibility',
      'Color Scheme',
      'success',
      capabilities.darkMode ? 'Dark mode preferred' : 'Light mode preferred',
      { darkMode: capabilities.darkMode }
    );
    results.push(colorResult);

    // Test screen reader support
    const screenReaderResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'accessibility',
      'Screen Reader Support',
      capabilities.screenReaderSupport ? 'success' : 'warning',
      capabilities.screenReaderSupport ? 'Screen reader supported' : 'Screen reader not supported',
      { screenReaderSupport: capabilities.screenReaderSupport }
    );
    results.push(screenReaderResult);

    return results;
  }

  /**
   * Test PWA capabilities
   */
  async testPWACapabilities(deviceType: string, viewport: { width: number; height: number }): Promise<MobileTestResult[]> {
    const results: MobileTestResult[] = [];
    const capabilities = this.getDeviceCapabilities();

    // Test service worker
    const serviceWorkerResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'pwa',
      'Service Worker',
      capabilities.serviceWorkerSupport ? 'success' : 'error',
      capabilities.serviceWorkerSupport ? 'Service worker supported' : 'Service worker not supported',
      { serviceWorkerSupport: capabilities.serviceWorkerSupport }
    );
    results.push(serviceWorkerResult);

    // Test manifest
    const manifestResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'pwa',
      'Web App Manifest',
      capabilities.manifestSupport ? 'success' : 'error',
      capabilities.manifestSupport ? 'Manifest found' : 'Manifest not found',
      { manifestSupport: capabilities.manifestSupport }
    );
    results.push(manifestResult);

    // Test installability
    const isInstallable = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    const installabilityResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'pwa',
      'Installability',
      isInstallable ? 'success' : 'warning',
      isInstallable ? 'App is installable' : 'App not installable',
      { installable: isInstallable }
    );
    results.push(installabilityResult);

    // Test offline capability
    const offlineResult = await this.createAndRecordTestResult(
      deviceType,
      viewport,
      'pwa',
      'Offline Support',
      capabilities.offlineSupport ? 'success' : 'warning',
      capabilities.offlineSupport ? 'Offline detection supported' : 'Offline detection not supported',
      { offlineSupport: capabilities.offlineSupport, online: navigator.onLine }
    );
    results.push(offlineResult);

    return results;
  }

  /**
   * Run all mobile tests
   */
  async runAllTests(deviceType: string, viewport: { width: number; height: number }): Promise<MobileTestResult[]> {
    const sessionId = await this.startTestSession(deviceType, viewport);
    
    try {
      const [responsive, touch, performance, accessibility, pwa] = await Promise.all([
        this.testResponsiveDesign(deviceType, viewport),
        this.testTouchCapabilities(deviceType, viewport),
        this.testPerformance(deviceType, viewport),
        this.testAccessibility(deviceType, viewport),
        this.testPWACapabilities(deviceType, viewport)
      ]);

      const allResults = [...responsive, ...touch, ...performance, ...accessibility, ...pwa];
      
      // Record all results
      for (const result of allResults) {
        await this.recordTestResult(result);
      }

      return allResults;
    } finally {
      await this.endTestSession();
    }
  }

  /**
   * Get test session history
   */
  async getTestSessionHistory(limit: number = 10): Promise<MobileTestSession[]> {
    try {
      const q = query(
        collection(this.db, 'mobileTestSessions'),
        orderBy('startTime', 'desc'),
        firestoreLimit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate(),
        testResults: doc.data().testResults || []
      })) as MobileTestSession[];
    } catch (error) {
      console.error('Error getting test session history:', error);
      return [];
    }
  }

  /**
   * Get test results by session
   */
  async getTestResultsBySession(sessionId: string): Promise<MobileTestResult[]> {
    try {
      const q = query(
        collection(this.db, 'mobileTestResults'),
        where('sessionId', '==', sessionId),
        orderBy('timestamp', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as MobileTestResult[];
    } catch (error) {
      console.error('Error getting test results by session:', error);
      return [];
    }
  }
}

const mobileTestingService = new MobileTestingService();
export default mobileTestingService;
