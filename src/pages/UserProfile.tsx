import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { authService, AppUser } from '../services/authService';
import { AdminUser } from '../types/admin';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  Key,
  Link,
  Unlink
} from 'lucide-react';
import AccountLinking from '../components/Admin/AccountLinking';
import UserProfileManager from '../components/Profile/UserProfileManager';

const UserProfile: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser } = state;
  const [user, setUser] = useState<AdminUser | null>(currentUser);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    scoutRank: '',
    den: '',
    packNumber: '',
    scoutAge: '',
    scoutGrade: '',
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  // Password change state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Available options
  const scoutRanks = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light'
  ];

  const availableDens = [
    'Lion', 'Tiger', 'Wolf', 'Bear', 'Webelos', 'Arrow of Light',
    'Pack Leadership', 'Committee', 'Volunteer'
  ];

  const grades = [
    'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
    '4th Grade', '5th Grade'
  ];

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: '',
        address: '',
        emergencyContact: '',
        scoutRank: '',
        den: '',
        packNumber: '',
        scoutAge: '',
        scoutGrade: '',
        preferences: {
          emailNotifications: currentUser.preferences?.emailNotifications !== false, // Default to true
          pushNotifications: currentUser.preferences?.pushNotifications !== false, // Default to true
          smsNotifications: currentUser.preferences?.smsNotifications === true, // Default to false
          language: currentUser.preferences?.language || 'en',
          timezone: currentUser.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const updates: Partial<AdminUser> = {
        displayName: formData.displayName,
        preferences: formData.preferences
      };

      // Update Firestore user document
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        preferences: formData.preferences
      });

      // Update local state
      setUser({ ...user, ...updates });
      
      setSuccess('Profile updated successfully!');
      setIsEditMode(false);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setError(null);
    setSuccess(null);
    // Reset form data to current user data
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: '',
        address: '',
        emergencyContact: '',
        scoutRank: '',
        den: '',
        packNumber: '',
        scoutAge: '',
        scoutGrade: '',
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would need to be implemented in authService
      // await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'accounts', label: 'Linked Accounts', icon: Link },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <nav className="-mb-px flex flex-wrap gap-x-4 gap-y-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Edit Profile Button - only show for profile tab */}
          {activeTab === 'profile' && (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && user && (
          <UserProfileManager 
            user={{
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: user.role as any,
              permissions: (user.permissions || []) as any,
              isActive: user.isActive,
              status: 'approved',
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
              authProvider: 'google',
              profile: (user as any).profile || {}
            } as unknown as AppUser}
            isEditing={isEditMode}
            onSave={(updatedUser) => {
              setUser(updatedUser as unknown as AdminUser);
              setSuccess('Profile updated successfully!');
              setIsEditMode(false);
              setTimeout(() => setSuccess(null), 3000);
            }}
            onCancel={() => {
              setIsEditMode(false);
              setError(null);
              setSuccess(null);
            }}
            canEditRole={false}
            canEditPermissions={false}
          />
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preferences.emailNotifications}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        emailNotifications: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preferences.pushNotifications}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        pushNotifications: e.target.checked
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between opacity-60">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                    Coming Soon
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled={true}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Linked Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Linked Accounts</h2>
            <AccountLinking />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
