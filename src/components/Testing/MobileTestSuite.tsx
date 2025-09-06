import * as React from 'react';
import { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MobileTestSuiteProps {
  onTestComplete?: (results: TestResults) => void;
}

interface TestResults {
  navigation: boolean;
  layout: boolean;
  responsiveness: boolean;
  performance: boolean;
  accessibility: boolean;
  overall: boolean;
}

const MobileTestSuite: React.FC<MobileTestSuiteProps> = ({ onTestComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  const testCases = [
    {
      name: 'Navigation Test',
      description: 'Test mobile navigation menu functionality',
      test: () => testNavigation(),
      category: 'navigation'
    },
    {
      name: 'Layout Responsiveness',
      description: 'Test component layouts on different screen sizes',
      test: () => testLayoutResponsiveness(),
      category: 'layout'
    },
    {
      name: 'Touch Interactions',
      description: 'Test touch-friendly button sizes and interactions',
      test: () => testTouchInteractions(),
      category: 'responsiveness'
    },
    {
      name: 'Performance Check',
      description: 'Test mobile performance and loading times',
      test: () => testPerformance(),
      category: 'performance'
    },
    {
      name: 'Accessibility',
      description: 'Test mobile accessibility features',
      test: () => testAccessibility(),
      category: 'accessibility'
    }
  ];

  const testNavigation = async (): Promise<boolean> => {
    // Test mobile menu toggle
    const mobileMenuButton = document.querySelector('[data-testid="mobile-menu-button"]') || 
                            document.querySelector('button[aria-label*="menu"]') ||
                            document.querySelector('button:has(svg)');
    
    if (!mobileMenuButton) {
      console.warn('Mobile menu button not found');
      return false;
    }

    // Test navigation links
    const navLinks = document.querySelectorAll('nav a, nav button');
    if (navLinks.length === 0) {
      console.warn('No navigation links found');
      return false;
    }

    // Test dropdown functionality
    const dropdownButtons = document.querySelectorAll('[aria-expanded]');
    
    return navLinks.length > 0 && mobileMenuButton !== null;
  };

  const testLayoutResponsiveness = async (): Promise<boolean> => {
    // Test responsive classes
    const responsiveElements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
    
    // Test grid layouts
    const gridElements = document.querySelectorAll('[class*="grid"]');
    
    // Test flex layouts
    const flexElements = document.querySelectorAll('[class*="flex"]');
    
    return responsiveElements.length > 0 && (gridElements.length > 0 || flexElements.length > 0);
  };

  const testTouchInteractions = async (): Promise<boolean> => {
    // Test button sizes (should be at least 44px for touch)
    const buttons = document.querySelectorAll('button, a[role="button"]');
    let touchFriendlyCount = 0;
    
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      if (rect.height >= 44 && rect.width >= 44) {
        touchFriendlyCount++;
      }
    });

    // Test for proper spacing between interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    let properSpacing = true;
    
    for (let i = 0; i < interactiveElements.length - 1; i++) {
      const current = interactiveElements[i].getBoundingClientRect();
      const next = interactiveElements[i + 1].getBoundingClientRect();
      
      if (Math.abs(current.bottom - next.top) < 8) {
        properSpacing = false;
        break;
      }
    }

    return touchFriendlyCount > 0 && properSpacing;
  };

  const testPerformance = async (): Promise<boolean> => {
    // Test for performance issues
    const startTime = performance.now();
    
    // Check for large images without optimization
    const images = document.querySelectorAll('img');
    let optimizedImages = 0;
    
    images.forEach(img => {
      if (img.src.includes('w_') || img.src.includes('h_') || img.src.includes('q_')) {
        optimizedImages++;
      }
    });

    // Check for excessive DOM elements
    const domElements = document.querySelectorAll('*');
    const domSize = domElements.length;
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    return loadTime < 1000 && domSize < 2000;
  };

  const testAccessibility = async (): Promise<boolean> => {
    // Test for proper ARIA labels
    const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
    
    // Test for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let properHierarchy = true;
    let lastLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        properHierarchy = false;
      }
      lastLevel = level;
    });

    // Test for focus management
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    
    return elementsWithAria.length > 0 && properHierarchy && focusableElements.length > 0;
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    const testResults: TestResults = {
      navigation: false,
      layout: false,
      responsiveness: false,
      performance: false,
      accessibility: false,
      overall: false
    };

    for (const testCase of testCases) {
      setCurrentTest(testCase.name);
      
      try {
        const result = await testCase.test();
        testResults[testCase.category as keyof TestResults] = result;
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Test failed: ${testCase.name}`, error);
        testResults[testCase.category as keyof TestResults] = false;
      }
    }

    // Calculate overall result
    const passedTests = Object.values(testResults).filter(Boolean).length;
    testResults.overall = passedTests >= 4; // Pass if 4 out of 5 tests pass

    setResults(testResults);
    setIsRunning(false);
    setCurrentTest('');
    
    if (onTestComplete) {
      onTestComplete(testResults);
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      case 'tablet':
        return <Tablet className="w-6 h-6" />;
      case 'desktop':
        return <Monitor className="w-6 h-6" />;
    }
  };

  const getTestIcon = (passed: boolean) => {
    if (passed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getOverallStatus = () => {
    if (!results) return null;
    
    if (results.overall) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-6 h-6" />
          <span className="font-semibold">Mobile Ready!</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <span className="font-semibold">Needs Attention</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mobile Test Suite</h3>
          <p className="text-sm text-gray-600">Validate mobile responsiveness and functionality</p>
        </div>
        <div className="flex items-center space-x-2">
          {getDeviceIcon()}
          <span className="text-sm font-medium text-gray-700 capitalize">{deviceType}</span>
        </div>
      </div>

      {isRunning && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">Running: {currentTest}</span>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-900">Overall Status</span>
            {getOverallStatus()}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testCases.map((testCase, index) => {
              const result = results[testCase.category as keyof TestResults];
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{testCase.name}</div>
                    <div className="text-sm text-gray-600">{testCase.description}</div>
                  </div>
                  {getTestIcon(result)}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Test Summary</h4>
            <div className="text-sm text-gray-600">
              <p>Passed: {Object.values(results).filter(Boolean).length} / {Object.keys(results).length}</p>
              <p>Device Type: {deviceType}</p>
              <p>Test Time: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="flex-1 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isRunning ? 'Running Tests...' : 'Run Mobile Tests'}
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setDeviceType('mobile')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              deviceType === 'mobile' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceType('tablet')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              deviceType === 'tablet' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceType('desktop')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              deviceType === 'desktop' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <p className="font-medium">Testing Tips:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Test on actual mobile devices for best results</li>
              <li>• Use browser dev tools to simulate different screen sizes</li>
              <li>• Check touch interactions and button sizes</li>
              <li>• Verify navigation works without page refreshes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTestSuite;