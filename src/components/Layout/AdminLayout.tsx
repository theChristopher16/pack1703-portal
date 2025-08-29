import React from 'react';
import AdminNav from '../Admin/AdminNav';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { state } = useAdmin();

  // If not authenticated, show login prompt
  if (!state.isAuthenticated) {
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
            <a 
              href="/admin/login"
              className="mt-4 inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Go to Admin Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout min-h-screen bg-gray-50">
      <AdminNav />
      <main className="py-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
