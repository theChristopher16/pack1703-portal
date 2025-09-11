import React from 'react';
import { Navigate } from 'react-router-dom';
import RootAccountLinker from '../components/Auth/RootAccountLinker';
import { useAdmin } from '../contexts/AdminContext';
import { UserRole } from '../services/authService';

const RootAccountSetup: React.FC = () => {
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  const userRole = (currentUser?.role as UserRole) || UserRole.ANONYMOUS;

  // Only allow root users to access this page
  if (userRole !== UserRole.ROOT) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSetupComplete = () => {
    // Redirect to admin dashboard after setup
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Root Account Setup
          </h1>
          <p className="text-gray-600">
            Create additional root accounts for system administration
          </p>
        </div>
        
        <RootAccountLinker onSetupComplete={handleSetupComplete} />
      </div>
    </div>
  );
};

export default RootAccountSetup;
