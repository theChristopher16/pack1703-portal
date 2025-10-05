import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAdmin } from '../../contexts/AdminContext';

interface Props {
  children: React.ReactNode;
}

const TenantAccessGuard: React.FC<Props> = ({ children }) => {
  const { tenantId, roles } = useTenant();
  const { state } = useAdmin();
  const location = useLocation();
  const { tenantSlug } = useParams();

  const platformRole = state.currentUser?.role as any;
  const isSuper = platformRole === 'super_admin' || platformRole === 'super-admin';
  const isTenantAdmin = roles.includes('TENANT_ADMIN') || roles.includes('super-admin');

  if (isSuper || isTenantAdmin) return <>{children}</>;

  // Redirect non-members to tenant selector
  return <Navigate to={tenantSlug ? `/${tenantSlug}/multi-tenant` : '/multi-tenant'} state={{ from: location }} replace />;
};

export default TenantAccessGuard;


