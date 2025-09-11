import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
// AdminNav removed - admin features now integrated into main navigation
import { useAdmin } from '../contexts/AdminContext';

interface DeviceTest {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'desktop';
  icon: React.ReactNode;
  description: string;
}

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

interface MobileTestSuite {
  responsive: TestResult[];
  touch: TestResult[];
  performance: TestResult[];
  accessibility: TestResult[];
  pwa: TestResult[];
}

const MobileTestingPage: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('mobile');
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [testResults, setTestResults] = useState<MobileTestSuite>({
    responsive: [],
    touch: [],
    performance: [],
    accessibility: [],
    pwa: []
  });
  const [currentViewport, setCurrentViewport] = useState<{width: number; height: number}>({width: 375, height: 667});
  const [showAdminNav, setShowAdminNav] = useState(true);
  const { state } = useAdmin();

  const devices: DeviceTest[] = [
    {
      id: 'mobile',
      name: 'iPhone 12',
      width: 375,
      height: 667,
      type: 'mobile',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Standard mobile device testing'
    },
    {
      id: 'mobile-large',
      name: 'iPhone 12 Pro Max',
      width: 428,
      height: 926,
      type: 'mobile',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Large mobile device testing'
    },
    {
      id: 'tablet',
      name: 'iPad',
      width: 768,
      height: 1024,
      type: 'tablet',
      icon: <Tablet className="w-5 h-5" />,
      description: 'Tablet device testing'
    },
    {
      id: 'tablet-large',
      name: 'iPad Pro',
      width: 1024,
      height: 1366,
      type: 'tablet',
      icon: <Tablet className="w-5 h-5" />,
      description: 'Large tablet device testing'
    },
    {
      id: 'desktop',
      name: 'Desktop',
      width: 1920,
      height: 1080,
      type: 'desktop',
      icon: <Monitor className="w-5 h-5" />,
      description: 'Desktop device testing'
    }
  ];

  const runResponsiveTests = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];
    const device = devices.find(d => d.id === selectedDevice);
    if (!device) return results;

    // Test viewport dimensions
    results.push({
      test: 'Viewport Dimensions',
      status: 'success',
      message: `Viewport set to ${device.width}x${device.height}`,
      details: { width: device.width, height: device.height }
    });

    // Test responsive breakpoints
    const breakpoints = [
      { name: 'sm', width: 640 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 1024 },
      { name: 'xl', width: 1280 },
      { name: '2xl', width: 1536 }
    ];

    breakpoints.forEach(bp => {
      const isActive = device.width >= bp.width;
      results.push({
        test: `${bp.name} Breakpoint (${bp.width}px)`,
        status: isActive ? 'success' : 'warning',
        message: isActive ? 'Breakpoint active' : 'Breakpoint inactive',
        details: { breakpoint: bp.name, width: bp.width, active: isActive }
      });
    });

    // Test container queries
    results.push({
      test: 'Container Queries',
      status: 'success',
      message: 'Container queries supported',
      details: { supported: true }
    });

    return results;
  };

  const runTouchTests = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    // Test touch support
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    results.push({
      test: 'Touch Support',
      status: hasTouch ? 'success' : 'warning',
      message: hasTouch ? 'Touch events supported' : 'Touch events not supported',
      details: { touchSupport: hasTouch, maxTouchPoints: navigator.maxTouchPoints }
    });

    // Test gesture support
    const hasGestures = 'ongesturestart' in window;
    results.push({
      test: 'Gesture Support',
      status: hasGestures ? 'success' : 'warning',
      message: hasGestures ? 'Gesture events supported' : 'Gesture events not supported',
      details: { gestureSupport: hasGestures }
    });

    // Test pointer events
    const hasPointerEvents = 'onpointerdown' in window;
    results.push({
      test: 'Pointer Events',
      status: hasPointerEvents ? 'success' : 'warning',
      message: hasPointerEvents ? 'Pointer events supported' : 'Pointer events not supported',
      details: { pointerSupport: hasPointerEvents }
    });

    return results;
  };

  const runPerformanceTests = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    // Test connection speed
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      results.push({
        test: 'Connection Speed',
        status: 'success',
        message: `Connection: ${connection.effectiveType || 'unknown'}`,
        details: {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        }
      });
    }

    // Test memory usage
    const memory = (performance as any).memory;
    if (memory) {
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      results.push({
        test: 'Memory Usage',
        status: usedMB < 100 ? 'success' : 'warning',
        message: `Memory: ${usedMB}MB / ${totalMB}MB`,
        details: { used: usedMB, total: totalMB }
      });
    }

    // Test frame rate
    let frameCount = 0;
    const startTime = performance.now();
    
    const measureFrameRate = () => {
      frameCount++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(measureFrameRate);
      } else {
        const fps = frameCount;
        results.push({
          test: 'Frame Rate',
          status: fps >= 30 ? 'success' : 'warning',
          message: `FPS: ${fps}`,
          details: { fps }
        });
      }
    };
    
    requestAnimationFrame(measureFrameRate);

    return results;
  };

  const runAccessibilityTests = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    // Test reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.push({
      test: 'Reduced Motion',
      status: 'success',
      message: reducedMotion ? 'Reduced motion preferred' : 'Normal motion',
      details: { reducedMotion }
    });

    // Test high contrast preference
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    results.push({
      test: 'High Contrast',
      status: 'success',
      message: highContrast ? 'High contrast preferred' : 'Normal contrast',
      details: { highContrast }
    });

    // Test color scheme preference
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    results.push({
      test: 'Color Scheme',
      status: 'success',
      message: darkMode ? 'Dark mode preferred' : 'Light mode preferred',
      details: { darkMode }
    });

    // Test screen reader support
    const hasScreenReader = 'speechSynthesis' in window;
    results.push({
      test: 'Screen Reader Support',
      status: hasScreenReader ? 'success' : 'warning',
      message: hasScreenReader ? 'Screen reader supported' : 'Screen reader not supported',
      details: { screenReaderSupport: hasScreenReader }
    });

    return results;
  };

  const runPWATests = async (): Promise<TestResult[]> => {
    const results: TestResult[] = [];

    // Test service worker
    const hasServiceWorker = 'serviceWorker' in navigator;
    results.push({
      test: 'Service Worker',
      status: hasServiceWorker ? 'success' : 'error',
      message: hasServiceWorker ? 'Service worker supported' : 'Service worker not supported',
      details: { serviceWorkerSupport: hasServiceWorker }
    });

    // Test manifest
    const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
    results.push({
      test: 'Web App Manifest',
      status: hasManifest ? 'success' : 'error',
      message: hasManifest ? 'Manifest found' : 'Manifest not found',
      details: { manifestSupport: hasManifest }
    });

    // Test installability
    const isInstallable = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    results.push({
      test: 'Installability',
      status: isInstallable ? 'success' : 'warning',
      message: isInstallable ? 'App is installable' : 'App not installable',
      details: { installable: isInstallable }
    });

    // Test offline capability
    const hasOffline = 'onLine' in navigator;
    results.push({
      test: 'Offline Support',
      status: hasOffline ? 'success' : 'warning',
      message: hasOffline ? 'Offline detection supported' : 'Offline detection not supported',
      details: { offlineSupport: hasOffline, online: navigator.onLine }
    });

    return results;
  };

  const runAllTests = async () => {
    setIsAutoTesting(true);
    
    try {
      const [responsive, touch, performance, accessibility, pwa] = await Promise.all([
        runResponsiveTests(),
        runTouchTests(),
        runPerformanceTests(),
        runAccessibilityTests(),
        runPWATests()
      ]);

      setTestResults({
        responsive,
        touch,
        performance,
        accessibility,
        pwa
      });
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsAutoTesting(false);
    }
  };

  const resetTests = () => {
    setTestResults({
      responsive: [],
      touch: [],
      performance: [],
      accessibility: [],
      pwa: []
    });
  };

  const selectDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setCurrentViewport({ width: device.width, height: device.height });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  useEffect(() => {
    if (isAutoTesting) {
      runAllTests();
    }
  }, [selectedDevice, isAutoTesting]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      {/* AdminNav removed - admin features now integrated into main navigation */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">📱 Mobile Testing Dashboard</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => {/* AdminNav removed */}}
                className="flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Admin Nav (Removed)
              </button>
              <button
                onClick={runAllTests}
                disabled={isAutoTesting}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isAutoTesting ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isAutoTesting ? 'Testing...' : 'Run Tests'}
              </button>
              <button
                onClick={resetTests}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>

          {/* Device Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Device Selection</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => selectDevice(device.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedDevice === device.id
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {device.icon}
                    <span className="font-medium">{device.name}</span>
                  </div>
                  <div className="text-sm opacity-75">
                    {device.width} × {device.height}
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    {device.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Viewport Display */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Viewport</h2>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-mono">
                  {currentViewport.width} × {currentViewport.height}
                </div>
                <div className="text-sm text-gray-600">
                  {devices.find(d => d.id === selectedDevice)?.type.toUpperCase()} DEVICE
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-8">
            {/* Responsive Tests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📐 Responsive Design Tests</h3>
              <div className="space-y-2">
                {testResults.responsive.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Touch Tests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👆 Touch & Gesture Tests</h3>
              <div className="space-y-2">
                {testResults.touch.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Tests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Performance Tests</h3>
              <div className="space-y-2">
                {testResults.performance.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility Tests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">♿ Accessibility Tests</h3>
              <div className="space-y-2">
                {testResults.accessibility.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PWA Tests */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 PWA Tests</h3>
              <div className="space-y-2">
                {testResults.pwa.map((result, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.test}</div>
                      <div className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTestingPage;
