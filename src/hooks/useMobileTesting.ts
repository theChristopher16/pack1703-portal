import { useState, useEffect, useCallback } from 'react';
import mobileTestingService, { MobileTestResult, MobileTestSession, DeviceCapabilities } from '../services/mobileTestingService';

export interface UseMobileTestingReturn {
  // State
  isRunning: boolean;
  testResults: MobileTestResult[];
  testSessions: MobileTestSession[];
  capabilities: DeviceCapabilities | null;
  currentSession: MobileTestSession | null;
  
  // Actions
  runTests: (deviceType: string, viewport: { width: number; height: number }) => Promise<MobileTestResult[]>;
  runResponsiveTests: (deviceType: string, viewport: { width: number; height: number }) => Promise<MobileTestResult[]>;
  runTouchTests: (deviceType: string, viewport: { width: number; height: number }) => Promise<MobileTestResult[]>;
  runPerformanceTests: (deviceType: string, viewport: { width: number; height: number }) => Promise<MobileTestResult[]>;
  runAccessibilityTests: (deviceType: string, viewport: { width: number; height: number }) => Promise<MobileTestResult[]>;
  runPWATests: (deviceType: string, viewport: { width: number; height: number }) => Promise<MobileTestResult[]>;
  resetTests: () => void;
  loadTestHistory: (limit?: number) => Promise<void>;
  loadTestResultsBySession: (sessionId: string) => Promise<void>;
  
  // Utilities
  getTestSummary: () => {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  getTestResultsBySuite: (suite: string) => MobileTestResult[];
  getTestResultsByStatus: (status: string) => MobileTestResult[];
}

export const useMobileTesting = (): UseMobileTestingReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<MobileTestResult[]>([]);
  const [testSessions, setTestSessions] = useState<MobileTestSession[]>([]);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [currentSession, setCurrentSession] = useState<MobileTestSession | null>(null);

  // Initialize capabilities on mount
  useEffect(() => {
    setCapabilities(mobileTestingService.getDeviceCapabilities());
  }, []);

  // Run all tests
  const runTests = useCallback(async (
    deviceType: string, 
    viewport: { width: number; height: number }
  ): Promise<MobileTestResult[]> => {
    setIsRunning(true);
    try {
      const results = await mobileTestingService.runAllTests(deviceType, viewport);
      setTestResults(results);
      return results;
    } catch (error) {
      console.error('Error running mobile tests:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run responsive tests
  const runResponsiveTests = useCallback(async (
    deviceType: string, 
    viewport: { width: number; height: number }
  ): Promise<MobileTestResult[]> => {
    setIsRunning(true);
    try {
      const results = await mobileTestingService.testResponsiveDesign(deviceType, viewport);
      setTestResults(prev => [...prev, ...results]);
      return results;
    } catch (error) {
      console.error('Error running responsive tests:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run touch tests
  const runTouchTests = useCallback(async (
    deviceType: string, 
    viewport: { width: number; height: number }
  ): Promise<MobileTestResult[]> => {
    setIsRunning(true);
    try {
      const results = await mobileTestingService.testTouchCapabilities(deviceType, viewport);
      setTestResults(prev => [...prev, ...results]);
      return results;
    } catch (error) {
      console.error('Error running touch tests:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run performance tests
  const runPerformanceTests = useCallback(async (
    deviceType: string, 
    viewport: { width: number; height: number }
  ): Promise<MobileTestResult[]> => {
    setIsRunning(true);
    try {
      const results = await mobileTestingService.testPerformance(deviceType, viewport);
      setTestResults(prev => [...prev, ...results]);
      return results;
    } catch (error) {
      console.error('Error running performance tests:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run accessibility tests
  const runAccessibilityTests = useCallback(async (
    deviceType: string, 
    viewport: { width: number; height: number }
  ): Promise<MobileTestResult[]> => {
    setIsRunning(true);
    try {
      const results = await mobileTestingService.testAccessibility(deviceType, viewport);
      setTestResults(prev => [...prev, ...results]);
      return results;
    } catch (error) {
      console.error('Error running accessibility tests:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run PWA tests
  const runPWATests = useCallback(async (
    deviceType: string, 
    viewport: { width: number; height: number }
  ): Promise<MobileTestResult[]> => {
    setIsRunning(true);
    try {
      const results = await mobileTestingService.testPWACapabilities(deviceType, viewport);
      setTestResults(prev => [...prev, ...results]);
      return results;
    } catch (error) {
      console.error('Error running PWA tests:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Reset tests
  const resetTests = useCallback(() => {
    setTestResults([]);
    setCurrentSession(null);
  }, []);

  // Load test history
  const loadTestHistory = useCallback(async (limit: number = 10): Promise<void> => {
    try {
      const sessions = await mobileTestingService.getTestSessionHistory(limit);
      setTestSessions(sessions);
    } catch (error) {
      console.error('Error loading test history:', error);
    }
  }, []);

  // Load test results by session
  const loadTestResultsBySession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      const results = await mobileTestingService.getTestResultsBySession(sessionId);
      setTestResults(results);
    } catch (error) {
      console.error('Error loading test results by session:', error);
    }
  }, []);

  // Get test summary
  const getTestSummary = useCallback(() => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'success').length;
    const failed = testResults.filter(r => r.status === 'error').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;

    return { total, passed, failed, warnings };
  }, [testResults]);

  // Get test results by suite
  const getTestResultsBySuite = useCallback((suite: string): MobileTestResult[] => {
    return testResults.filter(r => r.testSuite === suite);
  }, [testResults]);

  // Get test results by status
  const getTestResultsByStatus = useCallback((status: string): MobileTestResult[] => {
    return testResults.filter(r => r.status === status);
  }, [testResults]);

  return {
    // State
    isRunning,
    testResults,
    testSessions,
    capabilities,
    currentSession,
    
    // Actions
    runTests,
    runResponsiveTests,
    runTouchTests,
    runPerformanceTests,
    runAccessibilityTests,
    runPWATests,
    resetTests,
    loadTestHistory,
    loadTestResultsBySession,
    
    // Utilities
    getTestSummary,
    getTestResultsBySuite,
    getTestResultsByStatus
  };
};

export default useMobileTesting;
