import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import ReminderManagement from '../components/Admin/ReminderManagement';

const AdminReminders: React.FC = () => {
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
              Please log in to access the reminder management
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ReminderManagement />
      </div>
    </div>
  );
};

export default AdminReminders;