import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Building2, CheckCircle, XCircle, AlertCircle, Settings, Info } from 'lucide-react';
import crossOrgSyncService from '../../services/crossOrgSyncService';
import { CrossOrgSyncPreferences, UserOrganization, SyncStatus } from '../../types/crossOrgSync';
import { useToast } from '../../contexts/ToastContext';

const OrgSyncSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<CrossOrgSyncPreferences | null>(null);
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prefs, orgs, status] = await Promise.all([
        crossOrgSyncService.getSyncPreferences(),
        crossOrgSyncService.discoverUserOrganizations(),
        crossOrgSyncService.getSyncStatus(),
      ]);
      setPreferences(prefs);
      setOrganizations(orgs);
      setSyncStatus(status);
    } catch (error: any) {
      showError('Failed to load sync settings', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      await crossOrgSyncService.triggerSync();
      showSuccess('Sync completed successfully');
      loadData();
    } catch (error: any) {
      showError('Sync failed', error.message);
    } finally {
      setSyncing(false);
    }
  };

  const updateSetting = async (updates: Partial<CrossOrgSyncPreferences>) => {
    try {
      await crossOrgSyncService.updateSyncPreferences(updates);
      setPreferences({ ...preferences!, ...updates });
      showSuccess('Settings updated');
    } catch (error: any) {
      showError('Failed to update settings', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">Cross-Organization Data Sync</p>
          <p>
            Automatically pull data from all your organizations (Cub Scouts, Boy Scouts, etc.) into your
            personal home view. Control what gets synced and from which organizations.
          </p>
        </div>
      </div>

      {/* Sync Status */}
      {syncStatus && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Sync Status</h3>
              <p className="text-sm text-gray-600">
                {syncStatus.lastSyncAt
                  ? `Last synced: ${syncStatus.lastSyncAt.toLocaleString()}`
                  : 'Never synced'}
              </p>
            </div>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus.statistics.totalOrganizations}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Events Synced</p>
              <p className="text-2xl font-bold text-green-600">{syncStatus.statistics.totalEventsSynced}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pending RSVPs</p>
              <p className="text-2xl font-bold text-purple-600">{syncStatus.statistics.pendingRSVPs}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Upcoming Events</p>
              <p className="text-2xl font-bold text-blue-600">{syncStatus.statistics.upcomingEvents}</p>
            </div>
          </div>
        </div>
      )}

      {/* Event Sync Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Event Sync Preferences</h3>
            <p className="text-sm text-gray-600">Control which events appear in your calendar</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="font-medium text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Include Events I've RSVP'd To
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Show events you've confirmed attendance for
              </p>
            </div>
            <button
              onClick={() =>
                updateSetting({
                  syncSettings: {
                    ...preferences.syncSettings,
                    events: {
                      ...preferences.syncSettings.events,
                      includeRSVPd: !preferences.syncSettings.events.includeRSVPd,
                    },
                  },
                })
              }
              className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-200 border-2 ${
                preferences.syncSettings.events.includeRSVPd
                  ? 'bg-gradient-to-r from-green-400 to-blue-500 border-green-500'
                  : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                  preferences.syncSettings.events.includeRSVPd
                    ? 'translate-x-7 bg-white'
                    : 'translate-x-1 bg-gray-400'
                }`}
              >
                {preferences.syncSettings.events.includeRSVPd && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="font-medium text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                Include Events Awaiting RSVP
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Show events you haven't responded to yet (helps you not miss deadlines)
              </p>
            </div>
            <button
              onClick={() =>
                updateSetting({
                  syncSettings: {
                    ...preferences.syncSettings,
                    events: {
                      ...preferences.syncSettings.events,
                      includePending: !preferences.syncSettings.events.includePending,
                    },
                  },
                })
              }
              className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-200 border-2 ${
                preferences.syncSettings.events.includePending
                  ? 'bg-gradient-to-r from-green-400 to-blue-500 border-green-500'
                  : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                  preferences.syncSettings.events.includePending
                    ? 'translate-x-7 bg-white'
                    : 'translate-x-1 bg-gray-400'
                }`}
              >
                {preferences.syncSettings.events.includePending && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>

          <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Include Public Events from Organizations
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Show all public events from your organizations (may add clutter)
              </p>
            </div>
            <button
              onClick={() =>
                updateSetting({
                  syncSettings: {
                    ...preferences.syncSettings,
                    events: {
                      ...preferences.syncSettings.events,
                      includePublic: !preferences.syncSettings.events.includePublic,
                    },
                  },
                })
              }
              className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-200 border-2 ${
                preferences.syncSettings.events.includePublic
                  ? 'bg-gradient-to-r from-green-400 to-blue-500 border-green-500'
                  : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                  preferences.syncSettings.events.includePublic
                    ? 'translate-x-7 bg-white'
                    : 'translate-x-1 bg-gray-400'
                }`}
              >
                {preferences.syncSettings.events.includePublic && (
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Organizations */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Your Organizations</h3>
          <p className="text-sm text-gray-600">
            Manage which organizations sync data to your home view
          </p>
        </div>

        {organizations.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No organizations found</p>
            <p className="text-sm text-gray-500 mt-2">
              Join an organization to see your events and data here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {organizations.map((org) => {
              const override = preferences.organizationOverrides[org.organizationId];
              const isEnabled = override?.enabled !== false;

              return (
                <div key={org.organizationId} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg text-gray-900">{org.organizationName}</h4>
                          {org.isActive ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Role: <span className="font-medium">{org.userRole}</span> • Joined{' '}
                          {org.joinedAt.toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {org.enabledServices.map((service) => (
                            <span
                              key={service}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const newOverride = {
                          ...preferences.organizationOverrides,
                          [org.organizationId]: {
                            enabled: !isEnabled,
                            syncServices: org.enabledServices,
                          },
                        };
                        updateSetting({ organizationOverrides: newOverride });
                      }}
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-200 border-2 ${
                        isEnabled
                          ? 'bg-gradient-to-r from-green-400 to-blue-500 border-green-500'
                          : 'bg-gray-200 border-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                          isEnabled ? 'translate-x-7 bg-white' : 'translate-x-1 bg-gray-400'
                        }`}
                      >
                        {isEnabled && (
                          <svg
                            className="w-3 h-3 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgSyncSettings;

