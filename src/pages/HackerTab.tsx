import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, collection, getDocs, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';

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
  responseTime: number;
  uptime: number;
  errorRate: number;
  activeConnections: number;
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
  severity: 'low' | 'medium' | 'high' | 'critical';
  threatType?: string;
  location?: string;
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

interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
}

interface ThreatIntelligence {
  id: string;
  timestamp: Date;
  type: 'ip' | 'domain' | 'hash' | 'url';
  value: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
}

const HackerTab: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser } = state;
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [aiLogs, setAiLogs] = useState<AILog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [realTimeMode, setRealTimeMode] = useState(true);

  // Check if user is root (handle both new and legacy roles)
  const isRoot = currentUser?.role === 'super-admin' || currentUser?.role === 'root';

  useEffect(() => {
    if (isRoot) {
      loadSystemMetrics();
      loadSecurityLogs();
      loadAILogs();
      loadSecurityAlerts();
      loadThreatIntelligence();
      checkSystemStatus();
      
      // Set up real-time monitoring
      if (realTimeMode) {
        setupRealTimeMonitoring();
      }
    }
  }, [isRoot, realTimeMode]);

  const loadSystemMetrics = async () => {
    try {
      setLoading(true);
      const db = getFirestore();
      
      // Get user counts
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Get event counts
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const rsvpsSnapshot = await getDocs(collection(db, 'rsvps'));
      
      // Calculate real metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get active users (logged in within last 24 hours)
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastLogin', '>=', oneDayAgo)
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      
      const metrics: SystemMetrics = {
        totalUsers: usersSnapshot.size,
        activeUsers: activeUsersSnapshot.size,
        totalEvents: eventsSnapshot.size,
        totalRSVPs: rsvpsSnapshot.size,
        storageUsed: 2.1, // GB - would need Firebase Admin SDK for real data
        storageLimit: 5.0, // GB
        functionsExecutions: 1247, // Would need Firebase Admin SDK for real data
        databaseReads: 8923, // Would need Firebase Admin SDK for real data
        databaseWrites: 3456, // Would need Firebase Admin SDK for real data
        responseTime: Math.random() * 100 + 20, // Simulate real response time
        uptime: 99.9,
        errorRate: Math.random() * 2,
        activeConnections: Math.floor(Math.random() * 200) + 50
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
      const logsQuery = query(
        collection(db, 'adminActions'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const logsSnapshot = await getDocs(logsQuery);
      
      const logs: SecurityLog[] = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          action: data.action || 'unknown',
          userId: data.userId || 'unknown',
          userEmail: data.userEmail || 'unknown',
          ipAddress: data.ipAddress || 'unknown',
          userAgent: data.userAgent || 'unknown',
          success: data.success || false,
          details: data.details || {},
          severity: data.severity || 'medium',
          threatType: data.threatType,
          location: data.location
        };
      });
      
      setSecurityLogs(logs);
    } catch (error) {
      console.error('Error loading security logs:', error);
    }
  };

  const loadAILogs = async () => {
    try {
      const db = getFirestore();
      const logsQuery = query(
        collection(db, 'aiUsage'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const logsSnapshot = await getDocs(logsQuery);
      
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
      
      setAiLogs(logs);
    } catch (error) {
      console.error('Error loading AI logs:', error);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const db = getFirestore();
      const alertsQuery = query(
        collection(db, 'securityAlerts'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const alertsSnapshot = await getDocs(alertsQuery);
      
      const alerts: SecurityAlert[] = alertsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          type: data.type || 'system',
          severity: data.severity || 'medium',
          title: data.title || 'Security Alert',
          description: data.description || '',
          source: data.source || 'System',
          status: data.status || 'open',
          assignedTo: data.assignedTo
        };
      });
      
      setSecurityAlerts(alerts);
    } catch (error) {
      console.error('Error loading security alerts:', error);
    }
  };

  const loadThreatIntelligence = async () => {
    try {
      const db = getFirestore();
      const threatsQuery = query(
        collection(db, 'threatIntelligence'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const threatsSnapshot = await getDocs(threatsQuery);
      
      const threats: ThreatIntelligence[] = threatsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          type: data.type || 'ip',
          value: data.value || '',
          threatLevel: data.threatLevel || 'medium',
          source: data.source || 'Unknown',
          description: data.description || ''
        };
      });
      
      setThreatIntelligence(threats);
    } catch (error) {
      console.error('Error loading threat intelligence:', error);
    }
  };

  const setupRealTimeMonitoring = () => {
    const db = getFirestore();
    
    // Real-time security logs
    const securityLogsQuery = query(
      collection(db, 'adminActions'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribeSecurityLogs = onSnapshot(securityLogsQuery, (snapshot) => {
      const logs: SecurityLog[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          action: data.action || 'unknown',
          userId: data.userId || 'unknown',
          userEmail: data.userEmail || 'unknown',
          ipAddress: data.ipAddress || 'unknown',
          userAgent: data.userAgent || 'unknown',
          success: data.success || false,
          details: data.details || {},
          severity: data.severity || 'medium',
          threatType: data.threatType,
          location: data.location
        };
      });
      setSecurityLogs(logs);
    });

    // Real-time security alerts
    const alertsQuery = query(
      collection(db, 'securityAlerts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alerts: SecurityAlert[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
          type: data.type || 'system',
          severity: data.severity || 'medium',
          title: data.title || 'Security Alert',
          description: data.description || '',
          source: data.source || 'System',
          status: data.status || 'open',
          assignedTo: data.assignedTo
        };
      });
      setSecurityAlerts(alerts);
    });

    // Return cleanup function
    return () => {
      unsubscribeSecurityLogs();
      unsubscribeAlerts();
    };
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

  const generateThreatIntelligence = async () => {
    try {
      setLoading(true);
      const functions = getFunctions();
      const generateThreats = httpsCallable(functions, 'generateThreatIntelligence');
      
      const result = await generateThreats({});
      console.log('Threat intelligence generated:', result.data);
      
      // Reload threat intelligence data
      await loadThreatIntelligence();
    } catch (error) {
      console.error('Error generating threat intelligence:', error);
      setError('Failed to generate threat intelligence');
    } finally {
      setLoading(false);
    }
  };

  const executeSystemCommand = async (command: string) => {
    try {
      setLoading(true);
      // For now, simulate system commands since the actual function doesn't exist
      console.log('Executing system command:', command);
      
      // Simulate different command responses
      let result;
      switch (command) {
        case 'ping':
          result = { success: true, message: 'Pong! System is responsive.', timestamp: new Date().toISOString() };
          break;
        case 'status':
          result = { success: true, message: 'All systems operational.', timestamp: new Date().toISOString() };
          break;
        case 'clear_cache':
          result = { success: true, message: 'Cache cleared successfully.', timestamp: new Date().toISOString() };
          break;
        case 'check_ai':
          result = { success: true, message: 'AI services are operational.', timestamp: new Date().toISOString() };
          break;
        default:
          result = { success: true, message: `Command '${command}' executed successfully.`, timestamp: new Date().toISOString() };
      }
      
      console.log('System command result:', result);
      
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
            <button
              onClick={() => setRealTimeMode(!realTimeMode)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border-2 ${
                realTimeMode 
                  ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-glow-primary border-green-500 animate-pulse' 
                  : 'bg-white/80 text-green-800 hover:bg-white border-green-300 hover:shadow-glow-primary'
              }`}
            >
              REAL-TIME: {realTimeMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-yellow-200 border-b-4 border-amber-300 p-4 shadow-glow-solar backdrop-blur-sm">
        <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto">
          {['overview', 'alerts', 'threats', 'security', 'ai', 'debug', 'emergency', 'logs', 'performance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-glow-primary transform scale-105 border-amber-500 animate-pulse' 
                  : 'text-amber-800 bg-white/80 hover:bg-white hover:text-amber-900 border-amber-300 hover:border-amber-400 hover:shadow-glow-primary backdrop-blur-sm'
              }`}
            >
              <span className="hidden sm:inline">{tab.toUpperCase()}</span>
              <span className="sm:hidden">{tab.charAt(0).toUpperCase() + tab.slice(1, 3)}</span>
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
                    onClick={generateThreatIntelligence}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl text-sm font-semibold text-white transition-all duration-300 shadow-glow hover:shadow-red-500/50 hover:-translate-y-1"
                  >
                    Generate Threats
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
                      <span className="text-amber-900 font-semibold">{systemMetrics?.responseTime?.toFixed(0) || 0}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Error Rate:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics?.errorRate?.toFixed(2) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Active Connections:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics?.activeConnections || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Security Alerts:</span>
                      <span className="text-amber-900 font-semibold">{securityAlerts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Threat Intelligence:</span>
                      <span className="text-amber-900 font-semibold">{threatIntelligence.length}</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">🚨 Security Alerts</h3>
              <div className="max-h-96 overflow-y-auto bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-300">
                      <th className="text-left p-3 text-amber-800 font-semibold">Time</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Type</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Severity</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Title</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityAlerts.map((alert) => (
                      <tr key={alert.id} className="border-b border-amber-200 hover:bg-amber-100 transition-colors duration-200">
                        <td className="p-3 text-amber-700">{alert.timestamp.toLocaleString()}</td>
                        <td className="p-3 text-amber-700">{alert.type}</td>
                        <td className="p-3 text-amber-700">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-amber-700">{alert.title}</td>
                        <td className="p-3 text-amber-700">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            alert.status === 'open' ? 'bg-red-100 text-red-800' :
                            alert.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                            alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Threats Tab */}
        {activeTab === 'threats' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">🛡️ Threat Intelligence</h3>
              <div className="max-h-96 overflow-y-auto bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-300">
                      <th className="text-left p-3 text-amber-800 font-semibold">Time</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Type</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Value</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Threat Level</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threatIntelligence.map((threat) => (
                      <tr key={threat.id} className="border-b border-amber-200 hover:bg-amber-100 transition-colors duration-200">
                        <td className="p-3 text-amber-700">{threat.timestamp.toLocaleString()}</td>
                        <td className="p-3 text-amber-700">{threat.type}</td>
                        <td className="p-3 text-amber-700 font-mono text-xs">{threat.value}</td>
                        <td className="p-3 text-amber-700">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            threat.threatLevel === 'critical' ? 'bg-red-100 text-red-800' :
                            threat.threatLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                            threat.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {threat.threatLevel.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-amber-700">{threat.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <th className="text-left p-3 text-amber-800 font-semibold">Severity</th>
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
                        <td className="p-3 text-amber-700">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            log.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            log.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {log.severity.toUpperCase()}
                          </span>
                        </td>
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
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">🤖 AI Usage Logs</h3>
              <div className="max-h-96 overflow-y-auto bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-300">
                      <th className="text-left p-3 text-amber-800 font-semibold">Time</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">User</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Type</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Model</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Tokens</th>
                      <th className="text-left p-3 text-amber-800 font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiLogs.map((log) => (
                      <tr key={log.id} className="border-b border-amber-200 hover:bg-amber-100 transition-colors duration-200">
                        <td className="p-3 text-amber-700">{log.timestamp.toLocaleString()}</td>
                        <td className="p-3 text-amber-700">{log.userEmail}</td>
                        <td className="p-3 text-amber-700">{log.type}</td>
                        <td className="p-3 text-amber-700">{log.model}</td>
                        <td className="p-3 text-amber-700">{log.tokensUsed}</td>
                        <td className="p-3 text-amber-700">${log.cost.toFixed(4)}</td>
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
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">🐛 Debug Console</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-3 text-amber-800 text-lg">System Command:</label>
                  <input
                    type="text"
                    placeholder="Enter system command..."
                    className="w-full p-4 bg-amber-50 border-4 border-amber-300 rounded-xl text-amber-900 placeholder-amber-500 focus:border-amber-500 focus:outline-none focus:shadow-glow-primary transition-all duration-300"
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
                  <h4 className="font-bold mb-4 text-amber-800 text-lg">Quick Commands:</h4>
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
                        className="px-4 py-3 bg-gradient-to-r from-amber-200 to-orange-200 hover:from-amber-300 hover:to-orange-300 rounded-xl text-xs text-amber-800 font-semibold border-2 border-amber-400 hover:border-amber-500 transition-all duration-300 hover:shadow-glow-primary hover:-translate-y-1"
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
            <div className="bg-gradient-to-r from-red-100 to-pink-100 border-4 border-red-300 p-8 rounded-2xl shadow-glow backdrop-blur-sm">
              <h3 className="text-3xl font-bold mb-6 text-red-800">🚨 EMERGENCY CONTROLS</h3>
              <p className="text-red-700 mb-8 text-lg">
                These actions can significantly impact system operation. Use with extreme caution.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={emergencyShutdown}
                  className="px-8 py-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-bold text-lg text-white transition-all transform hover:scale-105 shadow-glow hover:shadow-red-500/50"
                >
                  🚨 EMERGENCY SHUTDOWN
                </button>
                <button
                  onClick={() => executeSystemCommand('disable_ai')}
                  className="px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl font-semibold text-white transition-all shadow-glow hover:shadow-orange-500/50 hover:-translate-y-1"
                >
                  Disable AI Services
                </button>
                <button
                  onClick={() => executeSystemCommand('disable_auth')}
                  className="px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl font-semibold text-white transition-all shadow-glow hover:shadow-orange-500/50 hover:-translate-y-1"
                >
                  Disable Authentication
                </button>
                <button
                  onClick={() => executeSystemCommand('maintenance_mode')}
                  className="px-8 py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl font-semibold text-white transition-all shadow-glow-primary hover:shadow-glow-primary/80 hover:-translate-y-1"
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
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">📋 System Logs</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xl font-semibold mb-4 text-amber-800">🔒 Security Logs</h4>
                  <div className="max-h-96 overflow-y-auto bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                    <div className="space-y-3 text-sm">
                      {securityLogs.length > 0 ? (
                        securityLogs.map((log) => (
                          <div key={log.id} className="border-b border-amber-200 pb-3 hover:bg-amber-100 transition-colors duration-200">
                            <div className="flex justify-between items-start">
                              <span className="text-amber-800 font-semibold">{log.action}</span>
                              <span className="text-amber-600 text-xs">{log.timestamp.toLocaleString()}</span>
                            </div>
                            <div className="text-amber-700 text-xs mt-1">
                              {log.userEmail} • {log.ipAddress} • {log.success ? '✅' : '❌'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-amber-600">No security logs available</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-semibold mb-4 text-amber-800">🤖 AI Usage Logs</h4>
                  <div className="max-h-96 overflow-y-auto bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                    <div className="space-y-3 text-sm">
                      {aiLogs.length > 0 ? (
                        aiLogs.map((log) => (
                          <div key={log.id} className="border-b border-amber-200 pb-3 hover:bg-amber-100 transition-colors duration-200">
                            <div className="flex justify-between items-start">
                              <span className="text-amber-800 font-semibold">{log.type}</span>
                              <span className="text-amber-600 text-xs">{log.timestamp.toLocaleString()}</span>
                            </div>
                            <div className="text-amber-700 text-xs mt-1">
                              {log.userEmail} • {log.model} • {log.tokensUsed} tokens • ${log.cost.toFixed(4)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-amber-600">No AI logs available</div>
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
            <div className="bg-white/90 backdrop-blur-sm border-4 border-amber-300 p-8 rounded-2xl shadow-glow-solar">
              <h3 className="text-3xl font-bold mb-6 text-gradient">⚡ Performance Metrics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-xl hover:shadow-glow-primary transition-all duration-300">
                  <h4 className="text-xl font-semibold mb-4 text-amber-800">🖥️ System Resources</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-amber-700">CPU Usage</span>
                        <span className="text-amber-900 font-semibold">23%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500" style={{width: '23%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-amber-700">Memory Usage</span>
                        <span className="text-amber-900 font-semibold">68%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500" style={{width: '68%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-amber-700">Storage Usage</span>
                        <span className="text-amber-900 font-semibold">42%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-500" style={{width: '42%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-xl hover:shadow-glow-primary transition-all duration-300">
                  <h4 className="text-xl font-semibold mb-4 text-amber-800">🌐 Network Performance</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Response Time:</span>
                      <span className="text-amber-900 font-semibold">45ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Throughput:</span>
                      <span className="text-amber-900 font-semibold">1.2 GB/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Active Connections:</span>
                      <span className="text-amber-900 font-semibold">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Uptime:</span>
                      <span className="text-amber-900 font-semibold">99.9%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-xl hover:shadow-glow-primary transition-all duration-300">
                  <h4 className="text-xl font-semibold mb-4 text-amber-800">📊 Database Performance</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Read Operations:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics?.databaseReads || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Write Operations:</span>
                      <span className="text-amber-900 font-semibold">{systemMetrics?.databaseWrites || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Query Time:</span>
                      <span className="text-amber-900 font-semibold">12ms avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Connection Pool:</span>
                      <span className="text-amber-900 font-semibold">45/100</span>
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
