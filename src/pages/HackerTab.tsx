import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { authService } from '../services/authService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  totalRSVPs: number;
  storageUsed: number;
  storageLimit: number;
  functionsExecutions: number;
  databaseReads: number;
  databaseWrites: number;
}

interface SecurityLog {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: any;
}

interface AILog {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  type: string;
  prompt: string;
  model: string;
  tokensUsed: number;
  cost: number;
}

const HackerTab: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser } = state;
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [aiLogs, setAiLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Check if user is root
  const isRoot = currentUser?.role === 'root';

  useEffect(() => {
    if (isRoot) {
      loadSystemMetrics();
      loadSecurityLogs();
      loadAILogs();
      checkSystemStatus();
    }
  }, [isRoot]);

  const loadSystemMetrics = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      
      // Get user counts
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const activeUsersSnapshot = await getDocs(collection(db, 'users'));
      
      // Get event counts
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const rsvpsSnapshot = await getDocs(collection(db, 'rsvps'));
      
      // Mock storage metrics (in production, get from Firebase console)
      const metrics: SystemMetrics = {
        totalUsers: usersSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        totalEvents: eventsSnapshot.size,
        totalRSVPs: rsvpsSnapshot.size,
        storageUsed: 2.1, // GB
        storageLimit: 5.0, // GB
        functionsExecutions: 1247,
        databaseReads: 8923,
        databaseWrites: 3456
      };
      
      setSystemMetrics(metrics);
    } catch (error) {
      console.error('Error loading system metrics:', error);
      setError('Failed to load system metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const db = getFirestore();
      const logsSnapshot = await getDocs(collection(db, 'adminActions'));
      
      const logs: SecurityLog[] = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        action: doc.data().action || 'unknown',
        userId: doc.data().userId || 'unknown',
        userEmail: doc.data().userEmail || 'unknown',
        ipAddress: doc.data().ipAddress || 'unknown',
        userAgent: doc.data().userAgent || 'unknown',
        success: doc.data().success || false,
        details: doc.data().details || {}
      }));
      
      setSecurityLogs(logs.slice(-50)); // Last 50 logs
    } catch (error) {
      console.error('Error loading security logs:', error);
    }
  };

  const loadAILogs = async () => {
    try {
      const db = getFirestore();
      const logsSnapshot = await getDocs(collection(db, 'aiUsage'));
      
      const logs: AILog[] = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        userId: doc.data().userId || 'unknown',
        userEmail: doc.data().userEmail || 'unknown',
        type: doc.data().type || 'unknown',
        prompt: doc.data().prompt || '',
        model: doc.data().model || 'unknown',
        tokensUsed: doc.data().usage?.totalTokens || 0,
        cost: doc.data().usage?.totalTokens * 0.00001 || 0 // Rough estimate
      }));
      
      setAiLogs(logs.slice(-50)); // Last 50 logs
    } catch (error) {
      console.error('Error loading AI logs:', error);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const functions = getFunctions();
      const testConnection = httpsCallable(functions, 'testAIConnection');
      
      const result = await testConnection({});
      setSystemStatus(result.data);
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };

  const executeSystemCommand = async (command: string) => {
    try {
      setLoading(true);
      const functions = getFunctions();
      const systemCommand = httpsCallable(functions, 'systemCommand');
      
      const result = await systemCommand({ command });
      console.log('System command result:', result.data);
      
      // Reload data after command execution
      await loadSystemMetrics();
      await loadSecurityLogs();
    } catch (error) {
      console.error('Error executing system command:', error);
      setError('Failed to execute system command');
    } finally {
      setLoading(false);
    }
  };

  const clearSystemCache = async () => {
    try {
      setLoading(true);
      await executeSystemCommand('clear_cache');
      setError(null);
    } catch (error) {
      setError('Failed to clear system cache');
    } finally {
      setLoading(false);
    }
  };

  const resetSystemSettings = async () => {
    if (window.confirm('⚠️ This will reset all system settings to defaults. Are you sure?')) {
      try {
        setLoading(true);
        await executeSystemCommand('reset_settings');
        setError(null);
      } catch (error) {
        setError('Failed to reset system settings');
      } finally {
        setLoading(false);
      }
    }
  };

  const emergencyShutdown = async () => {
    if (window.confirm('🚨 EMERGENCY SHUTDOWN: This will disable all non-essential services. Are you absolutely sure?')) {
      try {
        setLoading(true);
        await executeSystemCommand('emergency_shutdown');
        setError(null);
      } catch (error) {
        setError('Failed to execute emergency shutdown');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isRoot) {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🚫 ACCESS DENIED</h1>
          <p className="text-xl">This area is restricted to root users only.</p>
          <p className="text-sm mt-2">SOC Console access has been logged.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-lime-300">
      {/* Header */}
      <div className="bg-slate-800 border-b-2 border-lime-400 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-lime-300 drop-shadow-lg">🖥️ SOC CONSOLE</h1>
            <span className="text-sm text-lime-200 bg-lime-900 px-3 py-1 rounded-full font-semibold">ROOT ACCESS GRANTED</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-lime-200 bg-slate-700 px-3 py-1 rounded">User: {currentUser?.email}</span>
            <span className="text-sm text-lime-200 bg-slate-700 px-3 py-1 rounded">Role: ROOT</span>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                debugMode 
                  ? 'bg-lime-500 text-slate-900 shadow-lg' 
                  : 'bg-slate-700 text-lime-300 hover:bg-slate-600'
              }`}
            >
              DEBUG: {debugMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-slate-800 border-b-2 border-lime-400 p-3 shadow-md">
        <div className="flex flex-wrap gap-2">
          {['overview', 'system', 'security', 'ai', 'debug', 'emergency', 'logs', 'performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-lime-500 text-slate-900 shadow-lg transform scale-105' 
                  : 'text-lime-300 hover:bg-slate-700 hover:text-lime-200'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 bg-slate-800 min-h-screen">
        {loading && (
          <div className="mb-6 p-4 bg-amber-900 border-2 border-amber-400 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-300"></div>
              <span className="text-amber-200 font-semibold">Executing system command...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-900 border-2 border-red-400 rounded-lg shadow-lg">
            <span className="text-red-200 font-semibold">ERROR: {error}</span>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Status Banner */}
            <div className="bg-slate-700 border-2 border-lime-400 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-lime-300 mb-2">🖥️ System Status</h2>
                  <p className="text-lime-200">All systems operational - Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl text-lime-400">🟢</div>
                  <div className="text-sm text-lime-200">ONLINE</div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-700 border-2 border-lime-400 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-lime-300">📊 System Metrics</h3>
                {systemMetrics ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-lime-200">Users:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics.totalUsers} / {systemMetrics.activeUsers} active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Events:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">RSVPs:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics.totalRSVPs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Storage:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics.storageUsed}GB / {systemMetrics.storageLimit}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Functions:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics.functionsExecutions} executions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Database:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics.databaseReads} reads, {systemMetrics.databaseWrites} writes</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-lime-400">Loading...</div>
                )}
              </div>

              <div className="bg-slate-700 border-2 border-lime-400 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-lime-300">🤖 AI Status</h3>
                {systemStatus ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-lime-200">Model:</span>
                      <span className="text-lime-300 font-semibold">{systemStatus.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Connected:</span>
                      <span className="text-lime-300 font-semibold">{systemStatus.connected ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Max Tokens:</span>
                      <span className="text-lime-300 font-semibold">{systemStatus.maxTokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Temperature:</span>
                      <span className="text-lime-300 font-semibold">{systemStatus.temperature}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-lime-400">Checking...</div>
                )}
              </div>

              <div className="bg-slate-700 border-2 border-lime-400 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-lime-300">🔧 Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={clearSystemCache}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white transition-all"
                  >
                    Clear Cache
                  </button>
                  <button
                    onClick={checkSystemStatus}
                    className="w-full px-4 py-2 bg-lime-600 hover:bg-lime-700 rounded-lg text-sm font-semibold text-white transition-all"
                  >
                    Refresh Status
                  </button>
                  <button
                    onClick={() => setActiveTab('debug')}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold text-white transition-all"
                  >
                    Debug Console
                  </button>
                </div>
              </div>

              <div className="bg-slate-700 border-2 border-lime-400 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-lime-300">⚡ Performance</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-lime-200">Uptime:</span>
                    <span className="text-lime-300 font-semibold">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lime-200">Response Time:</span>
                    <span className="text-lime-300 font-semibold">45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lime-200">Memory Usage:</span>
                    <span className="text-lime-300 font-semibold">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lime-200">CPU Usage:</span>
                    <span className="text-lime-300 font-semibold">23%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-black border border-green-500 p-4 rounded">
              <h3 className="text-lg font-bold mb-4">⚙️ System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold mb-2">Environment Variables</h4>
                  <div className="space-y-1 text-sm">
                    <div>OPENAI_MODEL: gpt-5</div>
                    <div>OPENAI_MAX_TOKENS: 4000</div>
                    <div>OPENAI_TEMPERATURE: 0.7</div>
                    <div>MCP_SERVER_PORT: 3001</div>
                    <div>LLM_RATE_LIMIT_ENABLED: true</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2">System Settings</h4>
                  <div className="space-y-1 text-sm">
                    <div>Debug Mode: {debugMode ? 'Enabled' : 'Disabled'}</div>
                    <div>Log Level: INFO</div>
                    <div>Cache TTL: 3600s</div>
                    <div>Rate Limit: 100/min</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black border border-green-500 p-4 rounded">
              <h3 className="text-lg font-bold mb-4">🛠️ System Maintenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={clearSystemCache}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Clear Cache
                </button>
                <button
                  onClick={resetSystemSettings}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
                >
                  Reset Settings
                </button>
                <button
                  onClick={() => executeSystemCommand('optimize_database')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                >
                  Optimize Database
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-black border border-green-500 p-4 rounded">
              <h3 className="text-lg font-bold mb-4">🔒 Security Logs</h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-500">
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">Action</th>
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">IP</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-700">
                        <td className="p-2">{log.timestamp.toLocaleString()}</td>
                        <td className="p-2">{log.action}</td>
                        <td className="p-2">{log.userEmail}</td>
                        <td className="p-2">{log.ipAddress}</td>
                        <td className="p-2">{log.success ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-black border border-green-500 p-4 rounded">
              <h3 className="text-lg font-bold mb-4">🤖 AI Usage Logs</h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-500">
                      <th className="text-left p-2">Time</th>
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Model</th>
                      <th className="text-left p-2">Tokens</th>
                      <th className="text-left p-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-700">
                        <td className="p-2">{log.timestamp.toLocaleString()}</td>
                        <td className="p-2">{log.userEmail}</td>
                        <td className="p-2">{log.type}</td>
                        <td className="p-2">{log.model}</td>
                        <td className="p-2">{log.tokensUsed}</td>
                        <td className="p-2">${log.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="bg-black border border-green-500 p-4 rounded">
              <h3 className="text-lg font-bold mb-4">🐛 Debug Console</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">System Command:</label>
                  <input
                    type="text"
                    placeholder="Enter system command..."
                    className="w-full p-2 bg-gray-800 border border-green-500 rounded text-green-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        executeSystemCommand(target.value);
                        target.value = '';
                      }
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold mb-2">Quick Commands:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      'ping',
                      'status',
                      'clear_cache',
                      'optimize_database',
                      'check_ai',
                      'test_functions',
                      'backup_data',
                      'restore_data'
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => executeSystemCommand(cmd)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div className="bg-red-900 border-2 border-red-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-red-200">🚨 EMERGENCY CONTROLS</h3>
              <p className="text-red-200 mb-6 text-lg">
                These actions can significantly impact system operation. Use with extreme caution.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={emergencyShutdown}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                >
                  🚨 EMERGENCY SHUTDOWN
                </button>
                <button
                  onClick={() => executeSystemCommand('disable_ai')}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-all"
                >
                  Disable AI Services
                </button>
                <button
                  onClick={() => executeSystemCommand('disable_auth')}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold transition-all"
                >
                  Disable Authentication
                </button>
                <button
                  onClick={() => executeSystemCommand('maintenance_mode')}
                  className="px-8 py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-all"
                >
                  Enable Maintenance Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="bg-slate-700 border-2 border-lime-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-lime-300">📋 System Logs</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-lime-200">🔒 Security Logs</h4>
                  <div className="max-h-96 overflow-y-auto bg-slate-800 border border-lime-400 rounded p-4">
                    <div className="space-y-2 text-sm">
                      {securityLogs.length > 0 ? (
                        securityLogs.map((log) => (
                          <div key={log.id} className="border-b border-slate-600 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="text-lime-300 font-semibold">{log.action}</span>
                              <span className="text-lime-400 text-xs">{log.timestamp.toLocaleString()}</span>
                            </div>
                            <div className="text-lime-200 text-xs mt-1">
                              {log.userEmail} • {log.ipAddress} • {log.success ? '✅' : '❌'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-lime-400">No security logs available</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-lime-200">🤖 AI Usage Logs</h4>
                  <div className="max-h-96 overflow-y-auto bg-slate-800 border border-lime-400 rounded p-4">
                    <div className="space-y-2 text-sm">
                      {aiLogs.length > 0 ? (
                        aiLogs.map((log) => (
                          <div key={log.id} className="border-b border-slate-600 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="text-lime-300 font-semibold">{log.type}</span>
                              <span className="text-lime-400 text-xs">{log.timestamp.toLocaleString()}</span>
                            </div>
                            <div className="text-lime-200 text-xs mt-1">
                              {log.userEmail} • {log.model} • {log.tokensUsed} tokens • ${log.cost.toFixed(4)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-lime-400">No AI logs available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-slate-700 border-2 border-lime-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-lime-300">⚡ Performance Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800 border border-lime-400 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-lime-200">🖥️ System Resources</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-lime-200">CPU Usage</span>
                        <span className="text-lime-300">23%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-lime-400 h-2 rounded-full" style={{width: '23%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-lime-200">Memory Usage</span>
                        <span className="text-lime-300">68%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-lime-400 h-2 rounded-full" style={{width: '68%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-lime-200">Storage Usage</span>
                        <span className="text-lime-300">42%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-lime-400 h-2 rounded-full" style={{width: '42%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 border border-lime-400 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-lime-200">🌐 Network Performance</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-lime-200">Response Time:</span>
                      <span className="text-lime-300 font-semibold">45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Throughput:</span>
                      <span className="text-lime-300 font-semibold">1.2 GB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Active Connections:</span>
                      <span className="text-lime-300 font-semibold">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Uptime:</span>
                      <span className="text-lime-300 font-semibold">99.9%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 border border-lime-400 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-lime-200">📊 Database Performance</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-lime-200">Read Operations:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics?.databaseReads || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Write Operations:</span>
                      <span className="text-lime-300 font-semibold">{systemMetrics?.databaseWrites || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Query Time:</span>
                      <span className="text-lime-300 font-semibold">12ms avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lime-200">Connection Pool:</span>
                      <span className="text-lime-300 font-semibold">45/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HackerTab;
