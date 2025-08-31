import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  HardDrive, 
  Zap, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Mail
} from 'lucide-react';
import systemMonitorService, { SystemMetrics } from '../../services/systemMonitorService';
import emailMonitorService from '../../services/emailMonitorService';

const SystemMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [emailStatus, setEmailStatus] = useState<{ isActive: boolean; lastChecked: Date | null; config: any } | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await systemMonitorService.getSystemMetrics();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load system metrics');
        console.error('Error loading metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeEmailMonitoring = async () => {
      try {
        // Initialize email monitoring
        const success = await emailMonitorService.initialize();
        if (success) {
          setEmailStatus({
            isActive: true,
            lastChecked: new Date(),
            config: {
              emailAddress: 'cubmaster@sfpack1703.com',
              checkInterval: 5
            }
          });
        } else {
          setEmailStatus({
            isActive: false,
            lastChecked: null,
            config: {
              emailAddress: 'cubmaster@sfpack1703.com',
              checkInterval: 5
            }
          });
        }
      } catch (error) {
        console.error('Failed to initialize email monitoring:', error);
        setEmailStatus({
          isActive: false,
          lastChecked: null,
          config: {
            emailAddress: 'cubmaster@sfpack1703.com',
            checkInterval: 5
          }
        });
      }
    };

    loadMetrics();
    initializeEmailMonitoring();

    // Set up real-time updates
    const unsubscribe = systemMonitorService.subscribeToMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Update email status periodically
    const emailStatusInterval = setInterval(async () => {
      try {
        const status = await emailMonitorService.getMonitoringStatus();
        setEmailStatus({
          isActive: status.isActive,
          lastChecked: status.lastChecked ? new Date(status.lastChecked) : null,
          config: {
            emailAddress: 'cubmaster@sfpack1703.com',
            checkInterval: 5
          }
        });
      } catch (error) {
        console.error('Failed to update email status:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(emailStatusInterval);
    };
  }, []);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600">Loading system metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
        <div className="flex items-center justify-center py-8 text-amber-600">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <div className="text-center">
            <p className="font-medium mb-2">Limited System Access</p>
            <p className="text-sm text-gray-600">
              Some metrics may be unavailable due to permission restrictions. 
              Contact an administrator for full access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'outage':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'outage':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const CollapsibleSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children, 
    defaultExpanded = false 
  }: {
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-white/50 shadow-soft overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors duration-200"
        >
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-3 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-6">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-semibold text-gray-800 flex items-center">
          <BarChart3 className="w-6 h-6 mr-3 text-primary-600" />
          Live System Status
        </h2>
        <span className="text-sm text-gray-500 font-normal">
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Users</p>
              <p className="text-xl font-bold">{metrics.totalUsers}</p>
              <p className="text-blue-200 text-xs">{metrics.activeUsers} active</p>
            </div>
            <Users className="w-6 h-6 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Events</p>
              <p className="text-xl font-bold">{metrics.totalEvents}</p>
              <p className="text-green-200 text-xs">Active events</p>
            </div>
            <Calendar className="w-6 h-6 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Messages</p>
              <p className="text-xl font-bold">{metrics.totalMessages}</p>
              <p className="text-purple-200 text-xs">{metrics.messagesThisMonth} this month</p>
            </div>
            <MessageSquare className="w-6 h-6 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Monthly Cost</p>
              <p className="text-xl font-bold">{formatCurrency(metrics.estimatedMonthlyCost)}</p>
              <p className="text-orange-200 text-xs">Estimated</p>
            </div>
            <DollarSign className="w-6 h-6 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        <CollapsibleSection id="performance" title="Performance & Infrastructure" icon={Zap}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Response Time:</span>
                <span className="text-gray-800 font-mono">{Math.round(metrics.averageResponseTime)}ms</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Uptime:</span>
                <span className="text-gray-800 font-mono">{metrics.uptimePercentage}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Error Rate:</span>
                <span className="text-gray-800 font-mono">{metrics.errorRate}%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Firebase Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metrics.firebaseStatus)}`}>
                  {getStatusIcon(metrics.firebaseStatus)}
                  <span className="ml-1 capitalize">{metrics.firebaseStatus}</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Project ID:</span>
                <span className="text-gray-800 font-mono bg-gray-200 px-2 py-1 rounded text-xs">pack-1703-portal</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Environment:</span>
                <span className="text-gray-800 font-mono">Production</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="email" title="Email Monitoring" icon={Mail}>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                emailStatus?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {emailStatus?.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                <span className="ml-1">{emailStatus?.isActive ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Email Address:</span>
              <span className="text-gray-800 font-mono">cubmaster@sfpack1703.com</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Last Check:</span>
              <span className="text-gray-800 font-mono">
                {emailStatus?.lastChecked ? emailStatus.lastChecked.toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="storage" title="Storage & Usage" icon={HardDrive}>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Used:</span>
              <span className="text-gray-800 font-mono">{formatBytes(metrics.storageUsed * 1024 * 1024)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Limit:</span>
              <span className="text-gray-800 font-mono">{formatBytes(metrics.storageLimit * 1024 * 1024)}</span>
            </div>
            <div className="flex justify-between items-center py-2 mb-4">
              <span className="text-gray-600 font-medium">Usage:</span>
              <span className="text-gray-800 font-mono">{metrics.storagePercentage.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${metrics.storagePercentage > 80 ? 'bg-red-500' : metrics.storagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(metrics.storagePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="content" title="Content Overview" icon={TrendingUp}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Events:</span>
                <span className="text-gray-800 font-mono">{metrics.totalEvents}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Locations:</span>
                <span className="text-gray-800 font-mono">{metrics.totalLocations}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Announcements:</span>
                <span className="text-gray-800 font-mono">{metrics.totalAnnouncements}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Messages:</span>
                <span className="text-gray-800 font-mono">{metrics.totalMessages}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="costs" title="Cost Analysis" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Firestore Database:</span>
                <span className="font-mono text-sm">{formatCurrency(metrics.costBreakdown.firestore)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">File Storage:</span>
                <span className="font-mono text-sm">{formatCurrency(metrics.costBreakdown.storage)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Web Hosting:</span>
                <span className="font-mono text-sm">{formatCurrency(metrics.costBreakdown.hosting)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Cloud Functions:</span>
                <span className="font-mono text-sm">{formatCurrency(metrics.costBreakdown.functions)}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">This Month:</span>
                <span className="font-bold text-blue-800">{formatCurrency(metrics.estimatedMonthlyCost)}</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default SystemMonitor;
