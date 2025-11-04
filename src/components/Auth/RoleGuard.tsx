import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganization } from '../../contexts/OrganizationContext';
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
  
  // Map AdminContext role back to UserRole enum
  const roleMap: { [key: string]: UserRole } = {
    'root': UserRole.SUPER_ADMIN,
    'super-admin': UserRole.SUPER_ADMIN,  // Fixed: super-admin should map to SUPER_ADMIN, not ADMIN
    'content-admin': UserRole.ADMIN,      // Added: content-admin maps to ADMIN
    'moderator': UserRole.DEN_LEADER,
    'viewer': UserRole.PARENT,
    'ai_assistant': UserRole.AI_ASSISTANT
  };
  
  const userRole = currentUser?.role ? roleMap[currentUser.role] || UserRole.PARENT : undefined;

  // REMOVED LOADING CHECK - This was causing redirects
  // The AuthGuard already handles authentication, so we don't need to check again
  
  // Prefix fallback path with organization slug if needed
  const { prefixPath } = useOrganization();
  const prefixedFallbackPath = prefixPath(fallbackPath);
  
  // If no user is authenticated, redirect to home (which will show login)
  if (!currentUser || !userRole) {
    console.log('🔒 RoleGuard: No user or role, redirecting to home', { currentUser, userRole });
    return <Navigate to={prefixedFallbackPath} replace />;
  }

  // Check if user has access to the route
  if (route && !hasAccessToRoute(userRole, route)) {
    return <Navigate to={prefixedFallbackPath} replace />;
  }

  // Check specific role requirements
  if (requiredRole && userRole !== requiredRole) {
    console.log('🔒 RoleGuard: Role mismatch, redirecting to home', { 
      requiredRole, 
      userRole, 
      currentUserRole: currentUser?.role,
      fallbackPath: prefixedFallbackPath 
    });
    return <Navigate to={prefixedFallbackPath} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    console.log('🔒 RoleGuard: User not in required roles, redirecting to home', { 
      requiredRoles, 
      userRole, 
      currentUserRole: currentUser?.role,
      fallbackPath: prefixedFallbackPath 
    });
    return <Navigate to={prefixedFallbackPath} replace />;
  }

  return <>{children}</>;
};

// Convenience components for common role checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => {
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  const { prefixPath } = useOrganization();
  const prefixedFallbackPath = prefixPath(fallbackPath);
  
  // Check if user has admin role (either 'super-admin', 'content-admin', or 'root')
  const isAdmin = currentUser?.role === 'super-admin' || currentUser?.role === 'content-admin' || currentUser?.role === 'root';
  
  if (!isAdmin) {
    console.log('🔒 AdminOnly: User is not admin, redirecting to home', { 
      currentUserRole: currentUser?.role,
      isAdmin,
      fallbackPath: prefixedFallbackPath 
    });
    return <Navigate to={prefixedFallbackPath} replace />;
  }
  
  return <>{children}</>;
};

export const RootOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => {
  const { prefixPath } = useOrganization();
  const prefixedFallbackPath = prefixPath(fallbackPath);
  
  return (
    <RoleGuard 
      requiredRole={UserRole.SUPER_ADMIN} 
      fallbackPath={prefixedFallbackPath}
    >
      {children}
    </RoleGuard>
  );
};

export const SuperUserOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => {
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  const { prefixPath } = useOrganization();
  const prefixedFallbackPath = prefixPath(fallbackPath);
  
  // Check if user has super user role (super-admin or root)
  const isSuperUser = currentUser?.role === 'super-admin' || 
                     currentUser?.role === 'root';
  
  if (!isSuperUser) {
    console.log('🔒 SuperUserOnly: User is not super user, redirecting to home', { 
      currentUserRole: currentUser?.role,
      isSuperUser,
      fallbackPath: prefixedFallbackPath 
    });
    return <Navigate to={prefixedFallbackPath} replace />;
  }
  
  return <>{children}</>;
};

export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => {
  const { prefixPath } = useOrganization();
  const prefixedFallbackPath = prefixPath(fallbackPath);
  
  return (
    <RoleGuard 
      requiredRoles={[UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AI_ASSISTANT]} 
      fallbackPath={prefixedFallbackPath}
    >
      {children}
    </RoleGuard>
  );
};

export default RoleGuard;
