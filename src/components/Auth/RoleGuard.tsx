import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserRole } from '../../services/authService';
import { hasAccessToRoute, isAdminOrAbove, isRoot } from '../../services/navigationService';
import { useAdmin } from '../../contexts/AdminContext';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  route?: string;
  fallbackPath?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredRoles,
  route,
  fallbackPath = '/'
}) => {
  // Get current user from admin context
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  const userRole = currentUser?.role as UserRole;

  // Show loading spinner while authentication state is being determined
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, redirect to home (which will show login)
  if (!currentUser || !userRole) {
    return <Navigate to="/" replace />;
  }

  // Check if user has access to the route
  if (route && !hasAccessToRoute(userRole, route)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check specific role requirements
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

// Convenience components for common role checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => (
  <RoleGuard 
    requiredRoles={[UserRole.ADMIN, UserRole.ROOT]} 
    fallbackPath={fallbackPath}
  >
    {children}
  </RoleGuard>
);

export const RootOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => (
  <RoleGuard 
    requiredRole={UserRole.ROOT} 
    fallbackPath={fallbackPath}
  >
    {children}
  </RoleGuard>
);

export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => (
  <RoleGuard 
    requiredRoles={[UserRole.PARENT, UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.ROOT, UserRole.AI_ASSISTANT]} 
    fallbackPath={fallbackPath}
  >
    {children}
  </RoleGuard>
);

export default RoleGuard;
