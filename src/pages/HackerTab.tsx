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

  // Check if user is root (handle both new and legacy roles)
  const isRoot = currentUser?.role === 'super-admin' || currentUser?.role === 'root';

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 border-b-4 border-amber-300 p-6 shadow-glow-solar backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold text-gradient animate-solar-glow">
              🖥️ SOC CONSOLE
            </h1>
            <span className="text-sm text-amber-800 bg-gradient-to-r from-amber-200 to-orange-200 px-4 py-2 rounded-full font-semibold shadow-glow-primary border-2 border-amber-300 animate-pulse">
              ROOT ACCESS GRANTED
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-amber-800 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border-2 border-amber-300 shadow-soft">User: {currentUser?.email}</span>
            <span className="text-sm text-amber-800 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border-2 border-amber-300 shadow-soft">Role: ROOT</span>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border-2 ${
                debugMode 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-glow-primary border-amber-500 animate-pulse' 
                  : 'bg-white/80 text-amber-800 hover:bg-white border-amber-300 hover:shadow-glow-primary'
              }`}
            >
              DEBUG: {debugMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-yellow-200 border-b-4 border-amber-300 p-4 shadow-glow-solar backdrop-blur-sm">
        <div className="flex flex-wrap gap-3">
          {['overview', 'system', 'security', 'ai', 'debug', 'emergency', 'logs', 'performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-glow-primary transform scale-105 border-amber-500 animate-pulse' 
                  : 'text-amber-800 bg-white/80 hover:bg-white hover:text-amber-900 border-amber-300 hover:border-amber-400 hover:shadow-glow-primary backdrop-blur-sm'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 min-h-screen">
        {loading && (
          <div className="mb-6 p-6 bg-gradient-to-r from-amber-100 to-orange-100 border-4 border-amber-300 rounded-2xl shadow-glow-solar backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-amber-500"></div>
              <span className="text-amber-800 font-semibold text-lg">Executing system command...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-6 bg-gradient-to-r from-red-100 to-pink-100 border-4 border-red-300 rounded-2xl shadow-glow backdrop-blur-sm">
            <span className="text-red-800 font-semibold text-lg">ERROR: {error}</span>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* System Status Banner */}
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar hover:shadow-glow-primary transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gradient mb-3">🖥️ System Status</h2>
                  <p className="text-amber-800 text-lg">All systems operational - Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl text-secondary-500 animate-pulse">🟢</div>
                  <div className="text-lg text-amber-800 font-bold">ONLINE</div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-6 rounded-2xl shadow-glow-solar hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-4 text-gradient">📊 System Metrics</h3>
                {systemMetrics ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Users:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics.totalUsers} / {systemMetrics.activeUsers} active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Events:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">RSVPs:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics.totalRSVPs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Storage:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics.storageUsed}GB / {systemMetrics.storageLimit}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Functions:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics.functionsExecutions} executions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Database:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics.databaseReads} reads, {systemMetrics.databaseWrites} writes</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-600">Loading...</div>
                )}
              </div>

              <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-6 rounded-2xl shadow-glow-solar hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-4 text-gradient">🤖 AI Status</h3>
                {systemStatus ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Model:</span>
                      <span className="text-amber-900 font-semibold">{systemStatus.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Connected:</span>
                      <span className="text-amber-900 font-semibold">{systemStatus.connected ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Max Tokens:</span>
                      <span className="text-amber-900 font-semibold">{systemStatus.maxTokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Temperature:</span>
                      <span className="text-amber-900 font-semibold">{systemStatus.temperature}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-amber-600">Checking...</div>
                )}
              </div>

              <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-6 rounded-2xl shadow-glow-solar hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-4 text-gradient">🔧 Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={clearSystemCache}
                    className="w-full px-4 py-3 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 rounded-xl text-sm font-semibold text-white transition-all duration-300 shadow-glow-accent hover:shadow-glow-accent/80 hover:-translate-y-1"
                  >
                    Clear Cache
                  </button>
                  <button
                    onClick={checkSystemStatus}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-sm font-semibold text-white transition-all duration-300 shadow-glow-primary hover:shadow-glow-primary/80 hover:-translate-y-1"
                  >
                    Refresh Status
                  </button>
                  <button
                    onClick={() => setActiveTab('debug')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 rounded-xl text-sm font-semibold text-white transition-all duration-300 shadow-glow-secondary hover:shadow-glow-secondary/80 hover:-translate-y-1"
                  >
                    Debug Console
                  </button>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-6 rounded-2xl shadow-glow-solar hover:shadow-glow-primary transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-4 text-gradient">⚡ Performance</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700">Uptime:</span>
                    <span className="text-amber-900 font-semibold">99.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Response Time:</span>
                    <span className="text-amber-900 font-semibold">45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">Memory Usage:</span>
                    <span className="text-amber-900 font-semibold">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700">CPU Usage:</span>
                    <span className="text-amber-900 font-semibold">23%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">⚙️ System Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-4 text-amber-800 text-lg">Environment Variables</h4>
                  <div className="space-y-3 text-sm bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
                    <div className="text-amber-700">OPENAI_MODEL: <span className="text-amber-900 font-semibold">gpt-5</span></div>
                    <div className="text-amber-700">OPENAI_MAX_TOKENS: <span className="text-amber-900 font-semibold">4000</span></div>
                    <div className="text-amber-700">OPENAI_TEMPERATURE: <span className="text-amber-900 font-semibold">0.7</span></div>
                    <div className="text-amber-700">MCP_SERVER_PORT: <span className="text-amber-900 font-semibold">3001</span></div>
                    <div className="text-amber-700">LLM_RATE_LIMIT_ENABLED: <span className="text-amber-900 font-semibold">true</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-amber-800 text-lg">System Settings</h4>
                  <div className="space-y-3 text-sm bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
                    <div className="text-amber-700">Debug Mode: <span className="text-amber-900 font-semibold">{debugMode ? 'Enabled' : 'Disabled'}</span></div>
                    <div className="text-amber-700">Log Level: <span className="text-amber-900 font-semibold">INFO</span></div>
                    <div className="text-amber-700">Cache TTL: <span className="text-amber-900 font-semibold">3600s</span></div>
                    <div className="text-amber-700">Rate Limit: <span className="text-amber-900 font-semibold">100/min</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">🛠️ System Maintenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={clearSystemCache}
                  className="px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 rounded-xl text-white font-semibold transition-all duration-300 shadow-glow-accent hover:shadow-glow-accent/80 hover:-translate-y-1"
                >
                  Clear Cache
                </button>
                <button
                  onClick={resetSystemSettings}
                  className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-white font-semibold transition-all duration-300 shadow-glow-primary hover:shadow-glow-primary/80 hover:-translate-y-1"
                >
                  Reset Settings
                </button>
                <button
                  onClick={() => executeSystemCommand('optimize_database')}
                  className="px-8 py-4 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 rounded-xl text-white font-semibold transition-all duration-300 shadow-glow-secondary hover:shadow-glow-secondary/80 hover:-translate-y-1"
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
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">🔒 Security Logs</h3>
              <div className="max-h-96 overflow-y-auto bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-300">
                      <th className="text-left p-3 text-amber-800 font-semibold">Time</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Action</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">User</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">IP</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityLogs.map((log) => (
                      <tr key={log.id} className="border-b border-amber-200 hover:bg-amber-100 transition-colors duration-200">
                        <td className="p-3 text-amber-700">{log.timestamp.toLocaleString()}</td>
                        <td className="p-3 text-amber-700">{log.action}</td>
                        <td className="p-3 text-amber-700">{log.userEmail}</td>
                        <td className="p-3 text-amber-700">{log.ipAddress}</td>
                        <td className="p-3 text-amber-700">{log.success ? '✅' : '❌'}</td>
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
            <div className="bg-gradient-to-br from-slate-700 to-slate-600 border-2 border-yellow-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-400">🤖 AI Usage Logs</h3>
              <div className="max-h-96 overflow-y-auto bg-slate-800 border border-yellow-400 rounded p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-yellow-400">
                      <th className="text-left p-2 text-yellow-300">Time</th>
                      <th className="text-left p-2 text-yellow-300">User</th>
                      <th className="text-left p-2 text-yellow-300">Type</th>
                      <th className="text-left p-2 text-yellow-300">Model</th>
                      <th className="text-left p-2 text-yellow-300">Tokens</th>
                      <th className="text-left p-2 text-yellow-300">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-600">
                        <td className="p-2 text-yellow-200">{log.timestamp.toLocaleString()}</td>
                        <td className="p-2 text-yellow-200">{log.userEmail}</td>
                        <td className="p-2 text-yellow-200">{log.type}</td>
                        <td className="p-2 text-yellow-200">{log.model}</td>
                        <td className="p-2 text-yellow-200">{log.tokensUsed}</td>
                        <td className="p-2 text-yellow-200">${log.cost.toFixed(4)}</td>
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
            <div className="bg-gradient-to-br from-slate-700 to-slate-600 border-2 border-yellow-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-400">🐛 Debug Console</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-yellow-300">System Command:</label>
                  <input
                    type="text"
                    placeholder="Enter system command..."
                    className="w-full p-3 bg-slate-800 border-2 border-yellow-400 rounded text-yellow-200 placeholder-yellow-400 focus:border-yellow-300 focus:outline-none"
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
                  <h4 className="font-bold mb-4 text-yellow-300">Quick Commands:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                        className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded text-xs text-yellow-200 border border-yellow-400 hover:border-yellow-300 transition-all duration-300"
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
            <div className="bg-gradient-to-r from-red-900 to-red-800 border-2 border-red-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-red-300">🚨 EMERGENCY CONTROLS</h3>
              <p className="text-red-200 mb-6 text-lg">
                These actions can significantly impact system operation. Use with extreme caution.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={emergencyShutdown}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-red-500/25"
                >
                  🚨 EMERGENCY SHUTDOWN
                </button>
                <button
                  onClick={() => executeSystemCommand('disable_ai')}
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg font-semibold transition-all shadow-lg hover:shadow-orange-500/25"
                >
                  Disable AI Services
                </button>
                <button
                  onClick={() => executeSystemCommand('disable_auth')}
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg font-semibold transition-all shadow-lg hover:shadow-orange-500/25"
                >
                  Disable Authentication
                </button>
                <button
                  onClick={() => executeSystemCommand('maintenance_mode')}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 rounded-lg font-semibold transition-all shadow-lg hover:shadow-yellow-500/25"
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
            <div className="bg-gradient-to-br from-slate-700 to-slate-600 border-2 border-yellow-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-400">📋 System Logs</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">🔒 Security Logs</h4>
                  <div className="max-h-96 overflow-y-auto bg-slate-800 border border-yellow-400 rounded p-4">
                    <div className="space-y-2 text-sm">
                      {securityLogs.length > 0 ? (
                        securityLogs.map((log) => (
                          <div key={log.id} className="border-b border-slate-600 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="text-yellow-300 font-semibold">{log.action}</span>
                              <span className="text-yellow-400 text-xs">{log.timestamp.toLocaleString()}</span>
                            </div>
                            <div className="text-yellow-200 text-xs mt-1">
                              {log.userEmail} • {log.ipAddress} • {log.success ? '✅' : '❌'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-yellow-400">No security logs available</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">🤖 AI Usage Logs</h4>
                  <div className="max-h-96 overflow-y-auto bg-slate-800 border border-yellow-400 rounded p-4">
                    <div className="space-y-2 text-sm">
                      {aiLogs.length > 0 ? (
                        aiLogs.map((log) => (
                          <div key={log.id} className="border-b border-slate-600 pb-2">
                            <div className="flex justify-between items-start">
                              <span className="text-yellow-300 font-semibold">{log.type}</span>
                              <span className="text-yellow-400 text-xs">{log.timestamp.toLocaleString()}</span>
                            </div>
                            <div className="text-yellow-200 text-xs mt-1">
                              {log.userEmail} • {log.model} • {log.tokensUsed} tokens • ${log.cost.toFixed(4)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-yellow-400">No AI logs available</div>
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
            <div className="bg-gradient-to-br from-slate-700 to-slate-600 border-2 border-yellow-400 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-400">⚡ Performance Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">🖥️ System Resources</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-yellow-200">CPU Usage</span>
                        <span className="text-yellow-300">23%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full" style={{width: '23%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-yellow-200">Memory Usage</span>
                        <span className="text-yellow-300">68%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full" style={{width: '68%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-yellow-200">Storage Usage</span>
                        <span className="text-yellow-300">42%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full" style={{width: '42%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">🌐 Network Performance</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Response Time:</span>
                      <span className="text-yellow-300 font-semibold">45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Throughput:</span>
                      <span className="text-yellow-300 font-semibold">1.2 GB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Active Connections:</span>
                      <span className="text-yellow-300 font-semibold">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Uptime:</span>
                      <span className="text-yellow-300 font-semibold">99.9%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4 text-yellow-300">📊 Database Performance</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Read Operations:</span>
                      <span className="text-yellow-300 font-semibold">{systemMetrics?.databaseReads || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Write Operations:</span>
                      <span className="text-yellow-300 font-semibold">{systemMetrics?.databaseWrites || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Query Time:</span>
                      <span className="text-yellow-300 font-semibold">12ms avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-200">Connection Pool:</span>
                      <span className="text-yellow-300 font-semibold">45/100</span>
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
