import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from '../Admin/AdminNav';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { state } = useAdmin();
  const navigate = useNavigate();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!state.isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [state.isAuthenticated, navigate]);

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
    </div>
  );
};

export default AdminLayout;
