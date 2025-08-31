import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Shield, Eye, EyeOff, Lock, Unlock, AlertTriangle, CheckCircle, XCircle, Database, FileText, Calendar, Users, Settings, Activity } from 'lucide-react';

interface PermissionAudit {
  service: string;
  accessLevel: 'read' | 'write' | 'admin';
  description: string;
  securityLevel: 'high' | 'medium' | 'low';
  lastAudit: Date;
  status: 'active' | 'review' | 'restricted';
  dataTypes: string[];
  restrictions: string[];
}

const AdminPermissionsAudit: React.FC = () => {
  const { state } = useAdmin();
  const [auditData, setAuditData] = useState<PermissionAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading audit data
    const loadAuditData = async () => {
      setIsLoading(true);
      
      // Mock audit data - in real implementation, this would come from the database
      const mockAuditData: PermissionAudit[] = [
        {
          service: 'System Monitor',
          accessLevel: 'read',
          description: 'Real-time system metrics and performance data',
          securityLevel: 'high',
          lastAudit: new Date(),
          status: 'active',
          dataTypes: ['metrics', 'performance', 'costs', 'usage'],
          restrictions: ['No user data access', 'Read-only operations']
        },
        {
          service: 'Chat System',
          accessLevel: 'read',
          description: 'Chat messages and channel management',
          securityLevel: 'medium',
          lastAudit: new Date(),
          status: 'active',
          dataTypes: ['messages', 'channels', 'reactions'],
          restrictions: ['No user personal data', 'No message deletion']
        },
        {
          service: 'Events Management',
          accessLevel: 'write',
          description: 'Create and manage events with validation',
          securityLevel: 'high',
          lastAudit: new Date(),
          status: 'active',
          dataTypes: ['events', 'locations', 'schedules'],
          restrictions: ['Requires confirmation', 'Location validation required', 'Duplicate checking']
        },
        {
          service: 'User Management',
          accessLevel: 'read',
          description: 'User activity and engagement data',
          securityLevel: 'high',
          lastAudit: new Date(),
          status: 'restricted',
          dataTypes: ['activity', 'engagement', 'analytics'],
          restrictions: ['No personal information', 'Aggregated data only', 'No individual user access']
        },
        {
          service: 'Configuration',
          accessLevel: 'read',
          description: 'System configuration and settings',
          securityLevel: 'medium',
          lastAudit: new Date(),
          status: 'active',
          dataTypes: ['settings', 'configurations', 'preferences'],
          restrictions: ['Read-only access', 'No sensitive settings']
        },
        {
          service: 'Analytics',
          accessLevel: 'read',
          description: 'Analytics and insights data',
          securityLevel: 'medium',
          lastAudit: new Date(),
          status: 'active',
          dataTypes: ['analytics', 'insights', 'trends'],
          restrictions: ['Aggregated data only', 'No individual tracking']
        },
        {
          service: 'Security Audit',
          accessLevel: 'read',
          description: 'Security status and audit reports',
          securityLevel: 'high',
          lastAudit: new Date(),
          status: 'active',
          dataTypes: ['security', 'audits', 'permissions'],
          restrictions: ['Read-only access', 'No security bypass']
        }
      ];

      setAuditData(mockAuditData);
      setIsLoading(false);
    };

    loadAuditData();
  }, []);

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'review': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'restricted': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'read': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'write': return <FileText className="w-4 h-4 text-green-500" />;
      case 'admin': return <Settings className="w-4 h-4 text-purple-500" />;
      default: return <EyeOff className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600">Access Restricted</h2>
          <p className="text-gray-500 mt-2">Please log in to view permissions audit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Permissions Audit
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive security review of Solyn's access and capabilities
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-800">{auditData.length}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Permissions</p>
                <p className="text-2xl font-bold text-green-600">
                  {auditData.filter(item => item.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Security</p>
                <p className="text-2xl font-bold text-red-600">
                  {auditData.filter(item => item.securityLevel === 'high').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Shield className="w-6 h-6 mr-3 text-blue-600" />
              Service Permissions Overview
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading permissions audit...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Security Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Types
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restrictions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.service}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getAccessLevelIcon(item.accessLevel)}
                          <span className="text-sm text-gray-900 capitalize">{item.accessLevel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSecurityLevelColor(item.securityLevel)}`}>
                          {item.securityLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm text-gray-900 capitalize">{item.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.dataTypes.map((type, typeIndex) => (
                            <span key={typeIndex} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {item.restrictions.map((restriction, restrictionIndex) => (
                            <div key={restrictionIndex} className="text-xs text-gray-600 flex items-center">
                              <Lock className="w-3 h-3 mr-1" />
                              {restriction}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Security Notes
          </h3>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>• All AI operations are logged and audited for security compliance</li>
            <li>• Write operations require explicit confirmation before execution</li>
            <li>• No access to user personal information or sensitive data</li>
            <li>• All data access is restricted to necessary operations only</li>
            <li>• Regular security reviews are conducted to maintain compliance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPermissionsAudit;
