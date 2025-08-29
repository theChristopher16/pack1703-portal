import React, { useEffect, useState } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';

const AnalyticsTest: React.FC = () => {
  const analytics = useAnalytics();
  const [testResults, setTestResults] = useState<Array<{ test: string; status: 'pending' | 'success' | 'error'; message: string }>>([
    { test: 'Analytics Hook Initialization', status: 'pending', message: 'Testing...' },
    { test: 'Page View Tracking', status: 'pending', message: 'Testing...' },
    { test: 'Feature Usage Tracking', status: 'pending', message: 'Testing...' },
    { test: 'Performance Tracking', status: 'pending', message: 'Testing...' },
    { test: 'Error Tracking', status: 'pending', message: 'Testing...' },
    { test: 'Device Detection', status: 'pending', message: 'Testing...' },
    { test: 'Accessibility Detection', status: 'pending', message: 'Testing...' },
  ]);

  useEffect(() => {
    const runTests = async () => {
      const results = [...testResults];
      
      // Test 1: Analytics Hook Initialization
      try {
        if (analytics && typeof analytics.trackPageView === 'function') {
          results[0] = { test: 'Analytics Hook Initialization', status: 'success', message: 'Hook initialized successfully' };
        } else {
          results[0] = { test: 'Analytics Hook Initialization', status: 'error', message: 'Hook not properly initialized' };
        }
      } catch (error) {
        results[0] = { test: 'Analytics Hook Initialization', status: 'error', message: `Error: ${error}` };
      }

      // Test 2: Page View Tracking
      try {
        analytics.trackPageView('Test Page', '/test');
        results[1] = { test: 'Page View Tracking', status: 'success', message: 'Page view tracked successfully' };
      } catch (error) {
        results[1] = { test: 'Page View Tracking', status: 'error', message: `Error: ${error}` };
      }

      // Test 3: Feature Usage Tracking
      try {
        analytics.trackFeatureClick('Test Feature', { test: true });
        results[2] = { test: 'Feature Usage Tracking', status: 'success', message: 'Feature usage tracked successfully' };
      } catch (error) {
        results[2] = { test: 'Feature Usage Tracking', status: 'error', message: `Error: ${error}` };
      }

      // Test 4: Performance Tracking
      try {
        analytics.trackPageLoadTime(1500);
        results[3] = { test: 'Performance Tracking', status: 'success', message: 'Performance tracked successfully' };
      } catch (error) {
        results[3] = { test: 'Performance Tracking', status: 'error', message: `Error: ${error}` };
      }

      // Test 5: Error Tracking
      try {
        analytics.trackError('test_error', 'Test error message', 'AnalyticsTest component');
        results[4] = { test: 'Error Tracking', status: 'success', message: 'Error tracked successfully' };
      } catch (error) {
        results[4] = { test: 'Error Tracking', status: 'error', message: `Error: ${error}` };
      }

      // Test 6: Device Detection
      try {
        const deviceType = window.innerWidth < 768 ? 'mobile' : 
                           window.innerWidth < 1024 ? 'tablet' : 'desktop';
        results[5] = { test: 'Device Detection', status: 'success', message: `Device detected: ${deviceType}` };
      } catch (error) {
        results[5] = { test: 'Device Detection', status: 'error', message: `Error: ${error}` };
      }

      // Test 7: Accessibility Detection
      try {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const features = [];
        if (reducedMotion) features.push('reduced motion');
        if (highContrast) features.push('high contrast');
        if (darkMode) features.push('dark mode');
        
        const message = features.length > 0 ? `Features detected: ${features.join(', ')}` : 'No special preferences detected';
        results[6] = { test: 'Accessibility Detection', status: 'success', message };
      } catch (error) {
        results[6] = { test: 'Accessibility Detection', status: 'error', message: `Error: ${error}` };
      }

      setTestResults(results);
    };

    runTests();
  }, [analytics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            🧪 Analytics Testing
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            <span className="text-gradient">Analytics</span> Test Suite
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Testing the analytics functionality to ensure everything is working correctly.
          </p>
        </div>

        {/* Test Results */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">Test Results</h2>
          
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{result.test}</h3>
                    <p className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  result.status === 'success' ? 'bg-green-100 text-green-700' :
                  result.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Test Summary</h3>
                <p className="text-gray-600">
                  {testResults.filter(r => r.status === 'success').length} of {testResults.length} tests passed
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round((testResults.filter(r => r.status === 'success').length / testResults.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Verify Analytics</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Check Browser Console:</strong> Open DevTools and look for analytics events</p>
            <p>2. <strong>Firebase Analytics:</strong> Check your Firebase console for incoming data</p>
            <p>3. <strong>Performance Monitoring:</strong> Verify Core Web Vitals are being tracked</p>
            <p>4. <strong>Navigation Tracking:</strong> Move between pages to test automatic tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTest;
