import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestore';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Key, 
  Unlink, 
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

interface AccountLink {
  provider: 'google' | 'apple' | 'microsoft';
  email: string;
  linkedAt: Date;
  isActive: boolean;
}

interface AdminSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
  };
}

const AdminSettings: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser } = state;
  const [activeTab, setActiveTab] = useState('account');
  const [linkedAccounts, setLinkedAccounts] = useState<AccountLink[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    notifications: { email: true, push: false, sms: false },
    security: { twoFactorAuth: false, sessionTimeout: 30, passwordExpiry: 90 },
    appearance: { theme: 'light', compactMode: false }
  });
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [accountToUnlink, setAccountToUnlink] = useState<AccountLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.uid) {
        console.warn('No current user found');
        return;
      }
      
      // Load linked accounts
      const accounts = await firestoreService.getLinkedAccounts(currentUser.uid);
      setLinkedAccounts(accounts);
      
      // Load user settings
      const userSettings = await firestoreService.getUserSettings(currentUser.uid);
      if (userSettings) {
        setSettings(prev => ({ ...prev, ...userSettings }));
      }
    } catch (error) {
      console.error('Error loading account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (provider: 'google' | 'apple' | 'microsoft') => {
    try {
      setSaving(true);
      
      switch (provider) {
        case 'google':
          await authService.linkGoogleAccount();
          break;
        case 'apple':
          await authService.linkAppleAccount();
          break;
        case 'microsoft':
          await authService.linkMicrosoftAccount();
          break;
      }
      
      // Reload account data
      await loadAccountData();
    } catch (error) {
      console.error(`Error linking ${provider} account:`, error);
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkAccount = async () => {
    if (!accountToUnlink) return;
    
    try {
      setSaving(true);
      await authService.unlinkAccount(accountToUnlink.provider);
      
      // Reload account data
      await loadAccountData();
      setShowUnlinkModal(false);
      setAccountToUnlink(null);
    } catch (error) {
      console.error('Error unlinking account:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      if (!currentUser?.uid) {
        console.warn('No current user found');
        return;
      }
      
      await firestoreService.updateUserSettings(currentUser.uid, settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{currentUser?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{currentUser?.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {currentUser?.lastLogin ? new Date(currentUser.lastLogin).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Linked Accounts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Linked Accounts</h3>
              <div className="space-y-4">
                {linkedAccounts.length === 0 ? (
                  <p className="text-gray-500">No accounts linked yet.</p>
                ) : (
                  linkedAccounts.map((account) => (
                    <div key={account.provider} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {account.provider === 'google' && <Globe className="w-4 h-4" />}
                          {account.provider === 'apple' && <Key className="w-4 h-4" />}
                          {account.provider === 'microsoft' && <Shield className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{account.provider}</p>
                          <p className="text-sm text-gray-500">{account.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Linked
                        </span>
                        <button
                          onClick={() => {
                            setAccountToUnlink(account);
                            setShowUnlinkModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          <Unlink className="w-4 h-4 mr-1" />
                          Unlink
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Link New Account */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Link New Account</h4>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleLinkAccount('google')}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Google
                    </button>
                    <button
                      onClick={() => handleLinkAccount('apple')}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Apple
                    </button>
                    <button
                      onClick={() => handleLinkAccount('microsoft')}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Microsoft
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Push Notifications</label>
                  <p className="text-sm text-gray-500">Receive push notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">SMS Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Two-Factor Authentication</label>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, twoFactorAuth: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password Expiry (days)</label>
                <input
                  type="number"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, passwordExpiry: parseInt(e.target.value) }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={settings.appearance.theme}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    appearance: { ...prev.appearance, theme: e.target.value as 'light' | 'dark' | 'auto' }
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Compact Mode</label>
                  <p className="text-sm text-gray-500">Use a more compact layout</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.appearance.compactMode}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    appearance: { ...prev.appearance, compactMode: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Unlink Account Modal */}
      {showUnlinkModal && accountToUnlink && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Unlink Account</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to unlink your {accountToUnlink.provider} account ({accountToUnlink.email})?
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowUnlinkModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlinkAccount}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Unlinking...' : 'Unlink Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
