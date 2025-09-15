import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Eye, 
  FileText, 
  Shield, 
  Database, 
  Calendar,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Lock,
  Globe
} from 'lucide-react';
import { dataAuditService, UserDataAudit, PublicDataAudit } from '../../services/dataAuditService';
import { authService } from '../../services/authService';

interface DataAuditComponentProps {
  className?: string;
}

const DataAuditComponent: React.FC<DataAuditComponentProps> = ({ className = '' }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [userAudit, setUserAudit] = useState<UserDataAudit | null>(null);
  const [publicAudit, setPublicAudit] = useState<PublicDataAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'export'>('overview');

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  // Load audit data
  useEffect(() => {
    const loadAuditData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (currentUser) {
          // Load user-specific audit
          const audit = await dataAuditService.generateUserDataAudit();
          setUserAudit(audit);
        } else {
          // Load public audit
          const audit = await dataAuditService.generatePublicDataAudit();
          setPublicAudit(audit);
        }
      } catch (err) {
        console.error('Error loading audit data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };

    loadAuditData();
  }, [currentUser]);

  const handleDownloadUserData = async () => {
    try {
      setLoading(true);
      const jsonData = await dataAuditService.exportUserDataAsJSON();
      
      // Create and download file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to download data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPublicData = async () => {
    try {
      setLoading(true);
      const jsonData = await dataAuditService.exportPublicDataAsJSON();
      
      // Create and download file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `public-data-audit-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading public data:', err);
      setError(err instanceof Error ? err.message : 'Failed to download data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profile': return <Shield className="h-4 w-4" />;
      case 'events': return <Calendar className="h-4 w-4" />;
      case 'volunteerSignups': return <Users className="h-4 w-4" />;
      case 'feedback': return <MessageSquare className="h-4 w-4" />;
      case 'chatMessages': return <MessageSquare className="h-4 w-4" />;
      case 'rsvps': return <CheckCircle className="h-4 w-4" />;
      case 'analytics': return <Database className="h-4 w-4" />;
      case 'systemLogs': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profile': return 'bg-blue-100 text-blue-800';
      case 'events': return 'bg-green-100 text-green-800';
      case 'volunteerSignups': return 'bg-purple-100 text-purple-800';
      case 'feedback': return 'bg-yellow-100 text-yellow-800';
      case 'chatMessages': return 'bg-indigo-100 text-indigo-800';
      case 'rsvps': return 'bg-emerald-100 text-emerald-800';
      case 'analytics': return 'bg-orange-100 text-orange-800';
      case 'systemLogs': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !userAudit && !publicAudit) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft ${className}`}>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-3 text-lg text-gray-600">Loading your data audit...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-6 w-6 mr-3" />
          <div>
            <h3 className="text-lg font-semibold">Error Loading Data Audit</h3>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {currentUser ? 'Your Data Audit' : 'Public Data Audit'}
              </h2>
              <p className="text-sm text-gray-600">
                {currentUser 
                  ? 'Complete overview of all data we store about you'
                  : 'Overview of publicly accessible data'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentUser ? (
              <button
                onClick={handleDownloadUserData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download My Data
              </button>
            ) : (
              <button
                onClick={handleDownloadPublicData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download Public Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'details'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'export'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Download className="h-4 w-4 inline mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {currentUser && userAudit ? (
              <>
                {/* User Data Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Lock className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-800">Your Personal Data</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{userAudit.dataSummary.totalRecords}</div>
                      <div className="text-sm text-blue-600">Total Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userAudit.dataSummary.dataRetention.oldestRecord 
                          ? (typeof userAudit.dataSummary.dataRetention.oldestRecord === 'string' 
                              ? userAudit.dataSummary.dataRetention.oldestRecord.split('T')[0]
                              : new Date(userAudit.dataSummary.dataRetention.oldestRecord).toISOString().split('T')[0])
                          : 'N/A'}
                      </div>
                      <div className="text-sm text-blue-600">Oldest Record</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userAudit.dataSummary.dataRetention.newestRecord 
                          ? (typeof userAudit.dataSummary.dataRetention.newestRecord === 'string' 
                              ? userAudit.dataSummary.dataRetention.newestRecord.split('T')[0]
                              : new Date(userAudit.dataSummary.dataRetention.newestRecord).toISOString().split('T')[0])
                          : 'N/A'}
                      </div>
                      <div className="text-sm text-blue-600">Newest Record</div>
                    </div>
                  </div>
                </div>

                {/* Data Categories */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Categories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(userAudit.dataSummary.categoriesCount).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          {getCategoryIcon(category)}
                          <span className="ml-3 font-medium text-gray-800 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : publicAudit ? (
              <>
                {/* Public Data Summary */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Globe className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-800">Public Data</h3>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    This data is publicly accessible and does not require authentication to view.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(publicAudit.publicDataTypes).map(([type, data]) => (
                      <div key={type} className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800 capitalize">{type}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {data.count}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{data.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {currentUser && userAudit ? (
              <div className="space-y-4">
                {Object.entries(userAudit.dataCategories).map(([category, data]) => (
                  <div key={category} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {getCategoryIcon(category)}
                        <h3 className="ml-3 text-lg font-semibold text-gray-800 capitalize">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                        {Array.isArray(data) ? data.length : 1} record{Array.isArray(data) && data.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {Array.isArray(data) && data.length > 0 ? (
                      <div className="space-y-2">
                        {data.slice(0, 3).map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                            <pre className="whitespace-pre-wrap text-gray-700">
                              {JSON.stringify(item, null, 2)}
                            </pre>
                          </div>
                        ))}
                        {data.length > 3 && (
                          <p className="text-sm text-gray-500 italic">
                            ... and {data.length - 3} more records
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm">
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : publicAudit ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Info className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-800">Data Retention Policy</h3>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">{publicAudit.dataRetention.description}</p>
                  <p className="text-sm text-blue-600">Retention Period: {publicAudit.dataRetention.retentionPeriod}</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Shield className="h-5 w-5 text-gray-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-800">Privacy Policy</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Last Updated: {publicAudit.privacyPolicy.lastUpdated}
                  </p>
                  <a 
                    href={publicAudit.privacyPolicy.url}
                    className="text-sm text-primary-600 hover:text-primary-700 underline"
                  >
                    View Privacy Policy
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="text-center">
              <Download className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {currentUser ? 'Download Your Data' : 'Download Public Data'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {currentUser 
                  ? 'Get a complete copy of all data we store about you in JSON format.'
                  : 'Get a copy of all publicly accessible data in JSON format.'
                }
              </p>
              <button
                onClick={currentUser ? handleDownloadUserData : handleDownloadPublicData}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                {currentUser ? 'Download My Data' : 'Download Public Data'}
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800">Data Export Information</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    The downloaded file will contain all your data in JSON format. 
                    This file is for your personal use and should be kept secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAuditComponent;
