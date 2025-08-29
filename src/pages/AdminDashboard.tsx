import React from 'react';
import { useAdmin } from '../contexts/AdminContext';

const AdminDashboard: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser, isAuthenticated } = state;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Admin Access Required
            </h1>
            <p className="text-gray-600">
              Please log in to access the admin dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Welcome back, {currentUser?.displayName || 'Admin'}!
          </p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-6">
            Admin System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Firebase Connection
              </h3>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Admin Features
              </h3>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
