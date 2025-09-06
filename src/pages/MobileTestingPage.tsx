import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import MobileTestSuite from '../Testing/MobileTestSuite';

interface TestResults {
  navigation: boolean;
  layout: boolean;
  responsiveness: boolean;
  performance: boolean;
  accessibility: boolean;
  overall: boolean;
}

const MobileTestingPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [viewport, setViewport] = useState({ width: 375, height: 667 });
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  const devicePresets = {
    mobile: [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
      { name: 'Samsung Galaxy S21', width: 384, height: 854 }
    ],
    tablet: [
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'iPad Pro', width: 1024, height: 1366 },
      { name: 'Samsung Galaxy Tab', width: 800, height: 1280 }
    ],
    desktop: [
      { name: 'Desktop Small', width: 1024, height: 768 },
      { name: 'Desktop Medium', width: 1440, height: 900 },
      { name: 'Desktop Large', width: 1920, height: 1080 }
    ]
  };

  useEffect(() => {
    // Auto-test on component mount
    const timer = setTimeout(() => {
      setIsAutoTesting(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTestComplete = (results: TestResults) => {
    setTestResults(results);
    setIsAutoTesting(false);
  };

  const simulateViewport = (width: number, height: number) => {
    setViewport({ width, height });
    
    // Apply viewport simulation styles
    const style = document.createElement('style');
    style.id = 'viewport-simulation';
    style.textContent = `
      .viewport-simulation {
        max-width: ${width}px !important;
        max-height: ${height}px !important;
        margin: 0 auto !important;
        border: 2px solid #e5e7eb !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      
      @media (max-width: ${width}px) {
        .viewport-simulation {
          max-width: 100% !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      }
    `;
    
    // Remove existing simulation styles
    const existingStyle = document.getElementById('viewport-simulation');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    // Add class to main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.classList.add('viewport-simulation');
    }
  };

  const resetViewport = () => {
    const existingStyle = document.getElementById('viewport-simulation');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.classList.remove('viewport-simulation');
    }
    
    setViewport({ width: window.innerWidth, height: window.innerHeight });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      case 'desktop':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile Testing Suite</h1>
          <p className="text-gray-600">
            Comprehensive mobile responsiveness testing and validation tools for the Scout Families Portal.
          </p>
        </div>

        {/* Current Viewport Info */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getDeviceIcon(deviceType)}
              <div>
                <h3 className="font-semibold text-gray-900">Current Viewport</h3>
                <p className="text-sm text-gray-600">{viewport.width} × {viewport.height}px</p>
              </div>
            </div>
            <button
              onClick={resetViewport}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Device Presets */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Presets</h3>
              
              {Object.entries(devicePresets).map(([type, devices]) => (
                <div key={type} className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    {getDeviceIcon(type)}
                    <h4 className="font-medium text-gray-900 capitalize">{type}</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {devices.map((device, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setDeviceType(type as 'mobile' | 'tablet' | 'desktop');
                          simulateViewport(device.width, device.height);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs text-gray-500">{device.width} × {device.height}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Suite */}
          <div className="lg:col-span-2">
            <MobileTestSuite onTestComplete={handleTestComplete} />
            
            {/* Test Results Summary */}
            {testResults && (
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results Summary</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Navigation</span>
                      <div className={getStatusColor(testResults.navigation)}>
                        {getStatusIcon(testResults.navigation)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Mobile menu functionality and navigation links
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Layout</span>
                      <div className={getStatusColor(testResults.layout)}>
                        {getStatusIcon(testResults.layout)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Responsive design and component layouts
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Touch Interactions</span>
                      <div className={getStatusColor(testResults.responsiveness)}>
                        {getStatusIcon(testResults.responsiveness)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Touch-friendly button sizes and spacing
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Performance</span>
                      <div className={getStatusColor(testResults.performance)}>
                        {getStatusIcon(testResults.performance)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Loading times and optimization
                    </p>
                  </div>
                </div>

                {/* Overall Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Overall Status</span>
                    <div className={getStatusColor(testResults.overall)}>
                      {testResults.overall ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-semibold">Mobile Ready!</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-6 h-6" />
                          <span className="font-semibold">Needs Attention</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Testing Guidelines */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Mobile Testing Guidelines</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Navigation Testing</p>
                    <p>Verify mobile menu opens/closes properly and navigation links work without page refreshes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Layout Testing</p>
                    <p>Check that components stack properly on mobile and maintain readability</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Touch Testing</p>
                    <p>Ensure buttons are at least 44px tall and have proper spacing for touch interaction</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Performance Testing</p>
                    <p>Test on actual mobile devices and slow networks to ensure good performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTestingPage;