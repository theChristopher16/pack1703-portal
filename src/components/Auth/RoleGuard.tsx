import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOrganization } from '../../contexts/OrganizationContext';
import { UserRole, authService } from '../../services/authService';
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
    'root': UserRole.COPSE_ADMIN,         // Root users are Copse admins
    'super-admin': UserRole.SUPER_ADMIN,  // Super-admin maps to SUPER_ADMIN
    'copse-admin': UserRole.COPSE_ADMIN,  // Copse admin role
    'content-admin': UserRole.ADMIN,      // Content-admin maps to ADMIN
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

  // Check specific role requirements (multi-role aware)
  if (requiredRole) {
    const currentAppUser = authService.getCurrentUser();
    const hasRequiredRole = currentAppUser ? authService.hasRole(requiredRole, currentAppUser) : false;
    
    if (!hasRequiredRole) {
      console.log('🔒 RoleGuard: User does not have required role, redirecting to home', { 
        requiredRole, 
        userRole, 
        userRoles: currentAppUser ? authService.getUserRoles(currentAppUser) : [],
        currentUserRole: currentUser?.role,
        fallbackPath: prefixedFallbackPath 
      });
      return <Navigate to={prefixedFallbackPath} replace />;
    }
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const currentAppUser = authService.getCurrentUser();
    const hasAnyRequiredRole = currentAppUser ? authService.hasAnyRole(requiredRoles, currentAppUser) : false;
    
    if (!hasAnyRequiredRole) {
      console.log('🔒 RoleGuard: User does not have any required roles, redirecting to home', { 
        requiredRoles, 
        userRole, 
        userRoles: currentAppUser ? authService.getUserRoles(currentAppUser) : [],
        currentUserRole: currentUser?.role,
        fallbackPath: prefixedFallbackPath 
      });
      return <Navigate to={prefixedFallbackPath} replace />;
    }
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
  
  // Check if user has admin role (multi-role aware)
  const currentAppUser = authService.getCurrentUser();
  const isAdmin = currentAppUser ? authService.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.COPSE_ADMIN, UserRole.ADMIN], currentAppUser) : false;
  
  if (!isAdmin) {
    console.log('🔒 AdminOnly: User is not admin, redirecting to home', { 
      currentUserRole: currentUser?.role,
      userRoles: currentAppUser ? authService.getUserRoles(currentAppUser) : [],
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
  
  // Check if user has super user role (multi-role aware)
  const currentAppUser = authService.getCurrentUser();
  const isSuperUser = currentAppUser ? authService.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.COPSE_ADMIN], currentAppUser) : false;
  
  if (!isSuperUser) {
    console.log('🔒 SuperUserOnly: User is not super user, redirecting to home', { 
      currentUserRole: currentUser?.role,
      userRoles: currentAppUser ? authService.getUserRoles(currentAppUser) : [],
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
      requiredRoles={[UserRole.PARENT, UserRole.DEN_LEADER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COPSE_ADMIN, UserRole.AI_ASSISTANT]} 
      fallbackPath={prefixedFallbackPath}
    >
      {children}
    </RoleGuard>
  );
};

export const CopseAdminOnly: React.FC<{ children: React.ReactNode; fallbackPath?: string }> = ({ 
  children, 
  fallbackPath = '/' 
}) => {
  const { state } = useAdmin();
  const currentUser = state.currentUser;
  const { prefixPath } = useOrganization();
  const prefixedFallbackPath = prefixPath(fallbackPath);
  
  // Check if user has copse admin or super admin role (multi-role aware)
  const currentAppUser = authService.getCurrentUser();
  const isCopseAdmin = currentAppUser ? authService.hasAnyRole([UserRole.COPSE_ADMIN, UserRole.SUPER_ADMIN], currentAppUser) : false;
  
  if (!isCopseAdmin) {
    console.log('🔒 CopseAdminOnly: User is not Copse admin, redirecting to home', { 
      currentUserRole: currentUser?.role,
      userRoles: currentAppUser ? authService.getUserRoles(currentAppUser) : [],
      isCopseAdmin,
      fallbackPath: prefixedFallbackPath 
    });
    return <Navigate to={prefixedFallbackPath} replace />;
  }
  
  return <>{children}</>;
};

export default RoleGuard;
