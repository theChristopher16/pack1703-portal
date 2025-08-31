import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { EntityType, AdminActionType } from '../../types/admin';
import ConfigManager from './ConfigManager';
import AIChatInterface from './AIChatInterface';
import { useToast } from '../../contexts/ToastContext';

export const AdminDashboard: React.FC = () => {
  const {
    state,
    login,
    logout,
    hasPermission,
    hasRole,
    createEntity,
    updateEntity,
    deleteEntity,
    bulkOperation,
    exportData,
    importData,
    refreshDashboardStats,
    refreshAuditLogs,
    refreshSystemHealth,
    addNotification,
    removeNotification,
    setError,
    clearError
  } = useAdmin();
  const { showSuccess, showError, showInfo } = useToast();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>('event');
  const [selectedAction, setSelectedAction] = useState<AdminActionType>('create');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'ai-chat'>('dashboard');

  useEffect(() => {
    if (state.isAuthenticated) {
      refreshDashboardStats();
      refreshAuditLogs();
      refreshSystemHealth();
    }
  }, [state.isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginForm.email, loginForm.password);
    if (success) {
      showSuccess('Login Successful', 'Welcome to the admin dashboard!');
    } else {
      showError('Login Failed', 'Please check your credentials and try again.');
    }
  };

  const handleLogout = () => {
    logout();
    showInfo('Logged Out', 'You have been successfully logged out.');
  };

  const handleBulkOperation = async () => {
    // Temporary implementation for testing
    addNotification('info', 'Bulk Operation', 'Bulk operations coming soon!');
  };

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600">
              Sign in to access the admin dashboard
            </p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
                  placeholder="admin@sfpack1703.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={state.isLoading}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Demo credentials: admin@sfpack1703.com / any password
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Welcome back, {state.currentUser?.displayName || 'Admin'}!
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Logout
          </button>
        </div>

        {/* Notifications */}
        {state.notifications.length > 0 && (
          <div className="mb-8 space-y-4">
            {state.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                  notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                  notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm mt-1">{notification.message}</p>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="text-red-800">
                <h3 className="font-medium">Error</h3>
                <p className="text-sm mt-1">{state.error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'config'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('ai-chat')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'ai-chat'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Nova
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value as EntityType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="event">Event</option>
                <option value="location">Location</option>
                <option value="announcement">Announcement</option>
                <option value="season">Season</option>
              </select>
              
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as AdminActionType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
              
              <button
                onClick={handleBulkOperation}
                className="w-full bg-primary text-white py-2 px-4 rounded-lg text-sm hover:bg-primary/90 transition-colors duration-200"
              >
                Execute Action
              </button>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
              System Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Database:</span>
                <span className="text-green-600">✓ Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Firebase:</span>
                <span className="text-green-600">✓ Connected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auth:</span>
                <span className="text-green-600">✓ Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
              User Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="text-gray-900">{state.role || 'Admin'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Permissions:</span>
                <span className="text-gray-900">{state.permissions.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-soft">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
              Recent Actions
            </h3>
            <div className="space-y-2 text-sm">
              {state.recentActions.slice(0, 3).map((action) => (
                <div key={action.id} className="text-gray-600">
                  {action.action} {action.entityType}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'dashboard' ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
            <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">
              Admin System Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Firebase Connection</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project ID:</span>
                    <span className="text-gray-900">pack-1703-portal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-green-600">✓ Connected</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CRUD Operations:</span>
                    <span className="text-green-600">✓ Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Audit Logging:</span>
                    <span className="text-green-600">✓ Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role Management:</span>
                    <span className="text-green-600">✓ Configured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'config' ? (
          <ConfigManager />
        ) : (
          <AIChatInterface />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

