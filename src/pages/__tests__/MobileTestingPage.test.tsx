import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import MobileTestingPage from '../pages/MobileTestingPage';
import MobileTestComponent from '../components/Testing/MobileTestComponent';
import { useMobileTesting } from '../hooks/useMobileTesting';
import mobileTestingService from '../services/mobileTestingService';

// Mock the mobile testing service
jest.mock('../services/mobileTestingService', () => ({
  getDeviceCapabilities: jest.fn(() => ({
    touchSupport: true,
    gestureSupport: true,
    pointerSupport: true,
    serviceWorkerSupport: true,
    manifestSupport: true,
    offlineSupport: true,
    screenReaderSupport: true,
    reducedMotion: false,
    highContrast: false,
    darkMode: false,
    connectionType: '4g',
    memoryUsage: 50,
    frameRate: 60
  })),
  runAllTests: jest.fn(() => Promise.resolve([
    {
      id: 'test-1',
      deviceType: 'mobile',
      deviceName: 'Mobile Device',
      viewport: { width: 375, height: 667 },
      testSuite: 'responsive',
      testName: 'Viewport Dimensions',
      status: 'success',
      message: 'Viewport set to 375x667',
      details: { width: 375, height: 667 },
      timestamp: new Date(),
      userAgent: 'test-agent',
      sessionId: 'test-session'
    }
  ])),
  startTestSession: jest.fn(() => Promise.resolve('test-session')),
  endTestSession: jest.fn(() => Promise.resolve()),
  recordTestResult: jest.fn(() => Promise.resolve())
}));

// Mock the admin context
jest.mock('../contexts/AdminContext', () => ({
  useAdmin: () => ({
    state: {
      user: { role: 'admin' }
    }
  })
}));

// Mock the admin nav component
jest.mock('../components/Admin/AdminNav', () => {
  return function MockAdminNav() {
    return <div data-testid="admin-nav">Admin Navigation</div>;
  };
});

describe('MobileTestingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mobile testing dashboard', () => {
    render(<MobileTestingPage />);
    
    expect(screen.getByText('📱 Mobile Testing Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Device Selection')).toBeInTheDocument();
    expect(screen.getByText('Current Viewport')).toBeInTheDocument();
  });

  it('displays device selection buttons', () => {
    render(<MobileTestingPage />);
    
    expect(screen.getByText('iPhone 12')).toBeInTheDocument();
    expect(screen.getByText('iPhone 12 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('iPad')).toBeInTheDocument();
    expect(screen.getByText('iPad Pro')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  it('allows device selection', () => {
    render(<MobileTestingPage />);
    
    const tabletButton = screen.getByText('iPad');
    fireEvent.click(tabletButton);
    
    expect(tabletButton).toHaveClass('bg-blue-500');
  });

  it('shows run tests button', () => {
    render(<MobileTestingPage />);
    
    const runTestsButton = screen.getByText('Run Tests');
    expect(runTestsButton).toBeInTheDocument();
  });

  it('shows reset button', () => {
    render(<MobileTestingPage />);
    
    const resetButton = screen.getByText('Reset');
    expect(resetButton).toBeInTheDocument();
  });

  it('toggles admin navigation visibility', () => {
    render(<MobileTestingPage />);
    
    const toggleButton = screen.getByText('Hide Admin Nav');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Show Admin Nav')).toBeInTheDocument();
  });
});

describe('MobileTestComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mobile test component', () => {
    render(<MobileTestComponent />);
    
    expect(screen.getByText('📱 Mobile Testing')).toBeInTheDocument();
    expect(screen.getByText('Run Tests')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('shows device selector by default', () => {
    render(<MobileTestComponent />);
    
    expect(screen.getByText('Mobile')).toBeInTheDocument();
    expect(screen.getByText('Tablet')).toBeInTheDocument();
    expect(screen.getByText('Desktop')).toBeInTheDocument();
  });

  it('hides device selector when showDeviceSelector is false', () => {
    render(<MobileTestComponent showDeviceSelector={false} />);
    
    expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
    expect(screen.queryByText('Tablet')).not.toBeInTheDocument();
    expect(screen.queryByText('Desktop')).not.toBeInTheDocument();
  });

  it('shows empty state when no tests run', () => {
    render(<MobileTestComponent />);
    
    expect(screen.getByText('No tests run yet')).toBeInTheDocument();
    expect(screen.getByText('Click "Run Tests" to start mobile testing')).toBeInTheDocument();
  });

  it('calls onTestComplete when tests finish', async () => {
    const mockOnTestComplete = jest.fn();
    render(<MobileTestComponent onTestComplete={mockOnTestComplete} />);
    
    const runTestsButton = screen.getByText('Run Tests');
    fireEvent.click(runTestsButton);
    
    await waitFor(() => {
      expect(mockOnTestComplete).toHaveBeenCalled();
    });
  });
});

describe('useMobileTesting Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useMobileTesting());
    
    expect(result.current.isRunning).toBe(false);
    expect(result.current.testResults).toEqual([]);
    expect(result.current.testSessions).toEqual([]);
    expect(result.current.capabilities).toBeTruthy();
    expect(result.current.currentSession).toBeNull();
  });

  it('provides test summary utility', () => {
    const { result } = renderHook(() => useMobileTesting());
    
    const summary = result.current.getTestSummary();
    
    expect(summary).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    });
  });

  it('filters test results by suite', () => {
    const { result } = renderHook(() => useMobileTesting());
    
    const responsiveResults = result.current.getTestResultsBySuite('responsive');
    
    expect(responsiveResults).toEqual([]);
  });

  it('filters test results by status', () => {
    const { result } = renderHook(() => useMobileTesting());
    
    const successResults = result.current.getTestResultsByStatus('success');
    
    expect(successResults).toEqual([]);
  });
});

describe('MobileTestingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets device capabilities', () => {
    const capabilities = mobileTestingService.getDeviceCapabilities();
    
    expect(capabilities).toHaveProperty('touchSupport');
    expect(capabilities).toHaveProperty('gestureSupport');
    expect(capabilities).toHaveProperty('pointerSupport');
    expect(capabilities).toHaveProperty('serviceWorkerSupport');
    expect(capabilities).toHaveProperty('manifestSupport');
    expect(capabilities).toHaveProperty('offlineSupport');
    expect(capabilities).toHaveProperty('screenReaderSupport');
    expect(capabilities).toHaveProperty('reducedMotion');
    expect(capabilities).toHaveProperty('highContrast');
    expect(capabilities).toHaveProperty('darkMode');
    expect(capabilities).toHaveProperty('connectionType');
    expect(capabilities).toHaveProperty('memoryUsage');
    expect(capabilities).toHaveProperty('frameRate');
  });

  it('measures frame rate', async () => {
    const frameRate = await mobileTestingService.measureFrameRate();
    
    expect(typeof frameRate).toBe('number');
    expect(frameRate).toBeGreaterThan(0);
  });

  it('runs responsive design tests', async () => {
    const results = await mobileTestingService.testResponsiveDesign('mobile', { width: 375, height: 667 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('testSuite', 'responsive');
  });

  it('runs touch capability tests', async () => {
    const results = await mobileTestingService.testTouchCapabilities('mobile', { width: 375, height: 667 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('testSuite', 'touch');
  });

  it('runs performance tests', async () => {
    const results = await mobileTestingService.testPerformance('mobile', { width: 375, height: 667 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('testSuite', 'performance');
  });

  it('runs accessibility tests', async () => {
    const results = await mobileTestingService.testAccessibility('mobile', { width: 375, height: 667 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('testSuite', 'accessibility');
  });

  it('runs PWA capability tests', async () => {
    const results = await mobileTestingService.testPWACapabilities('mobile', { width: 375, height: 667 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('testSuite', 'pwa');
  });

  it('runs all tests', async () => {
    const results = await mobileTestingService.runAllTests('mobile', { width: 375, height: 667 });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    const suites = results.map(r => r.testSuite);
    expect(suites).toContain('responsive');
    expect(suites).toContain('touch');
    expect(suites).toContain('performance');
    expect(suites).toContain('accessibility');
    expect(suites).toContain('pwa');
  });
});

// Helper function for testing hooks
function renderHook(hook: () => any) {
  let result: any;
  
  function TestComponent() {
    result = hook();
    return null;
  }
  
  render(<TestComponent />);
  
  return { result };
}
