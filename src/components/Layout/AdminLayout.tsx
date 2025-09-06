import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../Admin/AdminNav';
import BackToTop from '../BackToTop/BackToTop';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { state } = useAdmin();
  const navigate = useNavigate();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [state.isAuthenticated, state.isLoading, navigate]);

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!state.isAuthenticated) {
    return null;
  }

  return (
    <div className="admin-layout min-h-screen bg-gray-50">
      <AdminNav />
      <main className="py-6">
        {children}
      </main>
      <BackToTop />
    </div>
  );
};

export default AdminLayout;
