import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Mail, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import pushNotificationService from '../../services/pushNotificationService';

const NotificationSettings: React.FC = () => {
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission>('default');
  const [fcmTokenRegistered, setFcmTokenRegistered] = useState(false);

  useEffect(() => {
    // Load current notification preferences
    if (currentUser) {
      setEmailNotifications(currentUser.preferences?.emailNotifications !== false);
      setPushNotifications(currentUser.preferences?.pushNotifications !== false);
      setSmsNotifications(currentUser.preferences?.smsNotifications !== false);
      
      // Check push notification status
      setPushPermissionStatus(pushNotificationService.getPermissionStatus());
      setFcmTokenRegistered(pushNotificationService.isNotificationEnabled());
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      setMessage(null);

      // Update user preferences
      await updateDoc(doc(db, 'users', currentUser.uid), {
        emailNotifications,
        pushNotifications,
        smsNotifications,
        'preferences.emailNotifications': emailNotifications,
        'preferences.pushNotifications': pushNotifications,
        'preferences.smsNotifications': smsNotifications,
      });

      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      
      // Auto-clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      const granted = await pushNotificationService.requestPermission();
      
      if (granted) {
        setPushNotifications(true);
        setPushPermissionStatus('granted');
        setFcmTokenRegistered(true);
        setMessage({ type: 'success', text: 'Push notifications enabled! You\'ll now receive real-time alerts.' });
        
        // Save preference
        await handleSave();
      } else {
        setMessage({ type: 'error', text: 'Permission denied. You can enable it later in browser settings.' });
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      setMessage({ type: 'error', text: 'Failed to enable push notifications.' });
    }
  };

  const handleDisablePushNotifications = async () => {
    try {
      await pushNotificationService.unregisterFCMToken();
      setPushNotifications(false);
      setFcmTokenRegistered(false);
      setMessage({ type: 'success', text: 'Push notifications disabled.' });
      
      // Save preference
      await handleSave();
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      setMessage({ type: 'error', text: 'Failed to disable push notifications.' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Admin Notifications</h2>
          <p className="text-sm text-gray-600">Manage how you receive admin alerts</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className={`w-5 h-5 ${emailNotifications ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive alerts via email</p>
            </div>
          </div>
          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              emailNotifications ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Smartphone className={`w-5 h-5 ${pushNotifications ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-600">
                Real-time browser notifications
                {pushPermissionStatus === 'granted' && fcmTokenRegistered && (
                  <span className="ml-2 text-green-600 font-semibold">✓ Active</span>
                )}
                {pushPermissionStatus === 'denied' && (
                  <span className="ml-2 text-red-600">✗ Blocked in browser</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!fcmTokenRegistered && pushPermissionStatus !== 'denied' && (
              <button
                onClick={handleEnablePushNotifications}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Enable
              </button>
            )}
            {fcmTokenRegistered && (
              <button
                onClick={handleDisablePushNotifications}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Disable
              </button>
            )}
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Volume2 className={`w-5 h-5 ${smsNotifications ? 'text-blue-600' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-medium text-gray-900">SMS Notifications</h3>
              <p className="text-sm text-gray-600">Text message alerts (coming soon)</p>
            </div>
          </div>
          <button
            onClick={() => setSmsNotifications(!smsNotifications)}
            disabled={true}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 opacity-50 cursor-not-allowed"
          >
            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
          </button>
        </div>
      </div>

      {/* Notification Types Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📬 You'll be notified about:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• New RSVP submissions and payments</li>
          <li>• Urgent chat messages (@admin mentions)</li>
          <li>• Account access requests</li>
          <li>• User feedback submissions</li>
          <li>• Resource submissions for review</li>
          <li>• Volunteer signups</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Help Text */}
      {pushPermissionStatus === 'denied' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Push notifications blocked:</strong> To enable, go to your browser settings and allow notifications for this site.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;

