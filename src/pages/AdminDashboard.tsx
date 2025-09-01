import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Link } from 'react-router-dom';
import { Shield, Mail } from 'lucide-react';
import DatabaseMonitor from '../components/Admin/DatabaseMonitor';
import SystemMonitor from '../components/Admin/SystemMonitor';
import InviteManagement from '../components/Admin/InviteManagement';
import AccountLinking from '../components/Admin/AccountLinking';

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
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Welcome back, <span className="font-semibold text-primary-700">{currentUser?.displayName || 'Admin'}</span>!
          </p>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Events</p>
                <p className="text-3xl font-bold">24</p>
              </div>
              <div className="text-blue-200 text-4xl">📅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Locations</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <div className="text-green-200 text-4xl">📍</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Volunteer Needs</p>
                <p className="text-3xl font-bold">18</p>
              </div>
              <div className="text-purple-200 text-4xl">🤝</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Packing Lists</p>
                <p className="text-3xl font-bold">8</p>
              </div>
              <div className="text-orange-200 text-4xl">📋</div>
            </div>
          </div>
        </div>
        
        {/* System Monitor */}
        <div className="mb-8">
          <SystemMonitor />
        </div>
        
                       {/* Database Monitor */}
               <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
                 <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6 flex items-center">
                   <span className="w-2 h-8 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full mr-4"></span>
                   Database Monitor
                 </h2>
                 <DatabaseMonitor />
               </div>

               {/* AI Permissions Audit */}
               <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft mt-8">
                 <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6 flex items-center">
                   <span className="w-2 h-8 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full mr-4"></span>
                   AI Permissions Audit
                 </h2>
                 <p className="text-gray-600 mb-4">
                   Review Solyn's access permissions and security controls
                 </p>
                 <Link
                   to="/admin/permissions-audit"
                   className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                 >
                   <Shield className="w-4 h-4 mr-2" />
                   View Permissions Audit
                 </Link>
               </div>

               {/* Account Linking */}
               <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft mt-8">
                 <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6 flex items-center">
                   <span className="w-2 h-8 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full mr-4"></span>
                   Account Security
                 </h2>
                 <p className="text-gray-600 mb-4">
                   Link your social accounts for enhanced security and easier sign-in
                 </p>
                 <AccountLinking />
               </div>

               {/* Invite Management */}
               <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft mt-8">
                 <h2 className="text-2xl font-display font-semibold text-gray-800 mb-6 flex items-center">
                   <span className="w-2 h-8 bg-gradient-to-b from-primary-500 to-secondary-500 rounded-full mr-4"></span>
                   User Invitations
                 </h2>
                 <p className="text-gray-600 mb-4">
                   Manage user invitations and track invite status
                 </p>
                 <InviteManagement />
               </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
