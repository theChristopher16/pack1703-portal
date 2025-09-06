import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import mobileTestingService, { MobileTestResult, DeviceCapabilities } from '../../services/mobileTestingService';

interface MobileTestComponentProps {
  onTestComplete?: (results: MobileTestResult[]) => void;
  showDeviceSelector?: boolean;
  showResults?: boolean;
  autoRun?: boolean;
  className?: string;
}

const MobileTestComponent: React.FC<MobileTestComponentProps> = ({
  onTestComplete,
  showDeviceSelector = true,
  showResults = true,
  autoRun = false,
  className = ''
}) => {
  const [selectedDevice, setSelectedDevice] = useState<string>('mobile');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<MobileTestResult[]>([]);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);

  const devices = [
    { id: 'mobile', name: 'Mobile', width: 375, height: 667, icon: <Smartphone className="w-4 h-4" /> },
    { id: 'tablet', name: 'Tablet', width: 768, height: 1024, icon: <Tablet className="w-4 h-4" /> },
    { id: 'desktop', name: 'Desktop', width: 1920, height: 1080, icon: <Monitor className="w-4 h-4" /> }
  ];

  useEffect(() => {
    // Get device capabilities on mount
    setCapabilities(mobileTestingService.getDeviceCapabilities());
    
    if (autoRun) {
      runTests();
    }
  }, [autoRun]);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      const device = devices.find(d => d.id === selectedDevice);
      if (!device) return;

      const results = await mobileTestingService.runAllTests(
        selectedDevice,
        { width: device.width, height: device.height }
      );

      setTestResults(results);
      onTestComplete?.(results);
    } catch (error) {
      console.error('Error running mobile tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTests = () => {
    setTestResults([]);
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

  const getTestSummary = () => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'success').length;
    const failed = testResults.filter(r => r.status === 'error').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;

    return { total, passed, failed, warnings };
  };

  const summary = getTestSummary();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📱 Mobile Testing</h3>
        <div className="flex space-x-2">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            <Play className="w-4 h-4 mr-1" />
            {isRunning ? 'Testing...' : 'Run Tests'}
          </button>
          <button
            onClick={resetTests}
            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </button>
        </div>
      </div>

      {/* Device Selector */}
      {showDeviceSelector && (
        <div className="mb-4">
          <div className="flex space-x-2">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device.id)}
                className={`flex items-center px-3 py-2 rounded-md border text-sm transition-colors ${
                  selectedDevice === device.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {device.icon}
                <span className="ml-1">{device.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <div className="flex space-x-4">
              <span className="text-gray-600">Total: {summary.total}</span>
              <span className="text-green-600">Passed: {summary.passed}</span>
              <span className="text-red-600">Failed: {summary.failed}</span>
              <span className="text-yellow-600">Warnings: {summary.warnings}</span>
            </div>
            <div className="text-gray-500">
              {selectedDevice.toUpperCase()} Device
            </div>
          </div>
        </div>
      )}

      {/* Device Capabilities */}
      {capabilities && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Device Capabilities</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              {capabilities.touchSupport ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
              <span>Touch Support</span>
            </div>
            <div className="flex items-center space-x-2">
              {capabilities.serviceWorkerSupport ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
              <span>Service Worker</span>
            </div>
            <div className="flex items-center space-x-2">
              {capabilities.manifestSupport ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
              <span>Manifest</span>
            </div>
            <div className="flex items-center space-x-2">
              {capabilities.offlineSupport ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
              <span>Offline Support</span>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {showResults && testResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {testResults.map((result, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
              {getStatusIcon(result.status)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {result.testName}
                </div>
                <div className={`text-xs ${getStatusColor(result.status)}`}>
                  {result.message}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {result.testSuite}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isRunning && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Running tests...</span>
        </div>
      )}

      {/* Empty State */}
      {!isRunning && testResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Smartphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No tests run yet</p>
          <p className="text-sm">Click "Run Tests" to start mobile testing</p>
        </div>
      )}
    </div>
  );
};

export default MobileTestComponent;
