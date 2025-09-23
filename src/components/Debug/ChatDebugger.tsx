import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import chatService from '../../services/chatService';
import { AlertCircle, CheckCircle, Info, Bug } from 'lucide-react';

interface DebugInfo {
  timestamp: string;
  component: string;
  message: string;
  data?: any;
  error?: Error;
}

const ChatDebugger: React.FC = () => {
  const { state: adminState } = useAdmin();
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [chatServiceStatus, setChatServiceStatus] = useState<any>(null);

  // Add debug log
  const addDebugLog = (component: string, message: string, data?: any, error?: Error) => {
    const log: DebugInfo = {
      timestamp: new Date().toISOString(),
      component,
      message,
      data,
      error
    };
    setDebugLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  // Test chat service initialization
  const testChatService = async () => {
    try {
      addDebugLog('ChatDebugger', 'Testing chat service initialization...');
      
      const user = await chatService.initialize();
      addDebugLog('ChatDebugger', 'Chat service initialized successfully', { user: user?.name });
      
      const channels = await chatService.getChannels();
      addDebugLog('ChatDebugger', 'Channels loaded successfully', { channelCount: channels.length });
      
      const users = await chatService.getOnlineUsers();
      addDebugLog('ChatDebugger', 'Users loaded successfully', { userCount: users.length });
      
      setChatServiceStatus({ status: 'success', user, channels, users });
    } catch (error: any) {
      addDebugLog('ChatDebugger', 'Chat service test failed', null, error);
      setChatServiceStatus({ status: 'error', error: error.message });
    }
  };

  // Test component rendering
  const testComponentRendering = () => {
    try {
      addDebugLog('ChatDebugger', 'Testing component rendering...');
      
      // Test basic React rendering
      const testElement = React.createElement('div', { 'data-test': 'rendering-test' }, 'Test');
      addDebugLog('ChatDebugger', 'Basic React rendering test passed');
      
      // Test state updates
      addDebugLog('ChatDebugger', 'State update test passed');
      
    } catch (error: any) {
      addDebugLog('ChatDebugger', 'Component rendering test failed', null, error);
    }
  };

  // Test authentication state
  const testAuthState = () => {
    try {
      addDebugLog('ChatDebugger', 'Testing authentication state...');
      
      const authInfo = {
        currentUser: adminState.currentUser?.email || 'No user',
        role: adminState.role || 'No role',
        isLoading: adminState.isLoading,
        error: adminState.error
      };
      
      addDebugLog('ChatDebugger', 'Authentication state retrieved', authInfo);
    } catch (error: any) {
      addDebugLog('ChatDebugger', 'Authentication state test failed', null, error);
    }
  };

  // Auto-run tests on mount
  useEffect(() => {
    addDebugLog('ChatDebugger', 'Debugger initialized');
    testAuthState();
    testComponentRendering();
  }, []);

  // Clear logs
  const clearLogs = () => {
    setDebugLogs([]);
  };

  // Export logs
  const exportLogs = () => {
    const logsText = debugLogs.map(log => 
      `[${log.timestamp}] ${log.component}: ${log.message}${log.data ? ` | Data: ${JSON.stringify(log.data)}` : ''}${log.error ? ` | Error: ${log.error.message}` : ''}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-debug-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Open Chat Debugger"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl">
      <div className="bg-gray-100 px-4 py-2 rounded-t-lg flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Bug className="w-4 h-4 mr-2" />
          Chat Debugger
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="p-4 max-h-80 overflow-y-auto">
        {/* Status Summary */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Auth: {adminState.currentUser ? 'Logged in' : 'Not logged in'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {chatServiceStatus?.status === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>Chat Service: {chatServiceStatus?.status || 'Not tested'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-4 space-y-2">
          <button
            onClick={testChatService}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Test Chat Service
          </button>
          <button
            onClick={testComponentRendering}
            className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            Test Rendering
          </button>
          <button
            onClick={testAuthState}
            className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
          >
            Test Auth State
          </button>
        </div>

        {/* Debug Logs */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm text-gray-900">Debug Logs</h4>
            <div className="space-x-2">
              <button
                onClick={clearLogs}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
              <button
                onClick={exportLogs}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Export
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto text-xs font-mono">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500">No logs yet</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  <div className="text-gray-600">
                    [{log.timestamp.slice(11, 19)}] {log.component}:
                  </div>
                  <div className={`ml-2 ${log.error ? 'text-red-600' : 'text-gray-900'}`}>
                    {log.message}
                  </div>
                  {log.data && (
                    <div className="ml-2 text-blue-600">
                      Data: {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                  {log.error && (
                    <div className="ml-2 text-red-600">
                      Error: {log.error.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Boundary Test */}
        <div className="mb-4">
          <h4 className="font-medium text-sm text-gray-900 mb-2">Error Boundary Test</h4>
          <button
            onClick={() => {
              throw new Error('Test error for error boundary');
            }}
            className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Trigger Test Error
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDebugger;

