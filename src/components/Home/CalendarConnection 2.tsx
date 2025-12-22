import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react';
import appleCalendarService from '../../services/appleCalendarService';
import { CalendarIntegration } from '../../types/calendarIntegration';
import { useToast } from '../../contexts/ToastContext';

const CalendarConnection: React.FC = () => {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await appleCalendarService.getIntegrations();
      setIntegrations(data);
    } catch (error: any) {
      showError('Failed to load calendar connections', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!window.confirm('Disconnect this calendar? All synced events will be removed.')) return;

    try {
      await appleCalendarService.disconnectCalendar(integrationId);
      setIntegrations(integrations.filter((i) => i.id !== integrationId));
      showSuccess('Calendar disconnected');
    } catch (error: any) {
      showError('Failed to disconnect calendar', error.message);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      await appleCalendarService.syncCalendar(integrationId);
      showSuccess('Calendar synced successfully');
      loadIntegrations(); // Reload to get updated sync time
    } catch (error: any) {
      showError('Failed to sync calendar', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">Connect Your Apple Calendar</p>
          <p className="mb-2">
            Sync your iPhone/iPad calendar events to see them alongside your home and organization events.
          </p>
          <p className="text-xs text-blue-700">
            <strong>Setup Required:</strong> You'll need to create an app-specific password at{' '}
            <a
              href="https://appleid.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              appleid.apple.com
            </a>
            {' '}(Account Settings → Security → App-Specific Passwords)
          </p>
        </div>
      </div>

      {/* Connected Calendars */}
      {integrations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No calendars connected</h3>
          <p className="text-gray-500 mb-6">Connect your Apple Calendar to sync your events</p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Connect Apple Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Calendar
            </button>
          </div>

          {integrations.map((integration) => (
            <div
              key={integration.id}
              className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                integration.isConnected ? 'border-green-400' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      integration.provider === 'apple'
                        ? 'bg-gradient-to-br from-gray-800 to-gray-600'
                        : 'bg-blue-500'
                    }`}
                  >
                    <Calendar className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-gray-800">
                        {integration.provider === 'apple' ? 'Apple Calendar' : integration.provider}
                      </h3>
                      {integration.isConnected ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Disconnected
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600">{integration.accountEmail}</p>

                    {integration.lastSyncAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last synced: {integration.lastSyncAt.toLocaleString()}
                      </p>
                    )}

                    {integration.errorMessage && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {integration.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(integration.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Sync now"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sync Settings */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto-Sync</p>
                    <p className="text-xs text-gray-500">
                      Automatically sync every {integration.syncFrequency}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      appleCalendarService.toggleSync(integration.id, !integration.syncEnabled);
                      setIntegrations(
                        integrations.map((i) =>
                          i.id === integration.id ? { ...i, syncEnabled: !i.syncEnabled } : i
                        )
                      );
                    }}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-all duration-200 border-2 ${
                      integration.syncEnabled
                        ? 'bg-gradient-to-r from-green-400 to-blue-500 border-green-500'
                        : 'bg-gray-200 border-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
                        integration.syncEnabled ? 'translate-x-7 bg-white' : 'translate-x-1 bg-gray-400'
                      }`}
                    >
                      {integration.syncEnabled && (
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
          ))}
        </div>
      )}

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <ConnectAppleCalendarModal
            onClose={() => setShowConnectModal(false)}
            onSuccess={() => {
              loadIntegrations();
              setShowConnectModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Connect Apple Calendar Modal
interface ConnectAppleCalendarModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ConnectAppleCalendarModal: React.FC<ConnectAppleCalendarModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    appSpecificPassword: '',
  });
  const [connecting, setConnecting] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);

    try {
      await appleCalendarService.connectAppleCalendar(formData);
      showSuccess('Apple Calendar connected successfully!');
      onSuccess();
    } catch (error: any) {
      showError('Connection failed', error.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-gray-800 to-gray-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Connect Apple Calendar</h2>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-900 mb-2">📝 Before You Start</h4>
            <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
              <li>
                Go to{' '}
                <a
                  href="https://appleid.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-yellow-900"
                >
                  appleid.apple.com
                </a>
              </li>
              <li>Sign in with your Apple ID</li>
              <li>Go to <strong>Security</strong> section</li>
              <li>Click <strong>App-Specific Passwords</strong></li>
              <li>Generate a password for "Home Management"</li>
              <li>Copy the password and paste it below</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apple ID Email *</label>
              <input
                type="email"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="your-email@icloud.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                App-Specific Password *
              </label>
              <input
                type="password"
                required
                value={formData.appSpecificPassword}
                onChange={(e) =>
                  setFormData({ ...formData, appSpecificPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="xxxx-xxxx-xxxx-xxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use an app-specific password, not your regular Apple ID password
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                🔒 <strong>Privacy:</strong> Your credentials are encrypted and stored securely. We only
                read your calendar events - we never modify or delete anything.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connecting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CalendarConnection;

