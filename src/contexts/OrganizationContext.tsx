import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { OrganizationBranding, OrganizationType, ComponentId } from '../types/organization';

interface OrganizationContextType {
  orgSlug: string | null;
  isPack1703: boolean;
  prefixPath: (path: string) => string;
  organizationId: string | null;
  organizationName: string | null;
  orgType: OrganizationType | null;
  enabledComponents: ComponentId[] | null;
  branding: OrganizationBranding | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
  orgSlug: null,
  isPack1703: false,
  prefixPath: (path: string) => path,
  organizationId: null,
  organizationName: null,
  orgType: null,
  enabledComponents: null,
  branding: null,
});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  // Return default context if not available (for pages outside org context)
  if (!context) {
    return {
      orgSlug: null,
      isPack1703: false,
      prefixPath: (path: string) => path,
      organizationId: null,
      organizationName: null,
      orgType: null,
      enabledComponents: null,
      branding: null,
    };
  }
  return context;
};

interface OrganizationProviderProps {
  children: React.ReactNode;
  orgSlug?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  branding?: OrganizationBranding | null;
  orgType?: OrganizationType | null;
  enabledComponents?: ComponentId[] | null;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ 
  children, 
  orgSlug: providedSlug,
  organizationId: providedOrgId,
  organizationName: providedOrgName,
  branding: providedBranding,
  orgType: providedOrgType,
  enabledComponents: providedEnabledComponents
}) => {
  const location = useLocation();
  const params = useParams<{ orgSlug?: string }>();
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(providedOrgId || null);
  const [organizationName, setOrganizationName] = useState<string | null>(providedOrgName || null);
  const [branding, setBranding] = useState<OrganizationBranding | null>(providedBranding || null);
  const [orgType, setOrgType] = useState<OrganizationType | null>(providedOrgType || null);
  const [enabledComponents, setEnabledComponents] = useState<ComponentId[] | null>(providedEnabledComponents || null);

  useEffect(() => {
    // Check if we're in an organization route
    const pathOrgSlug = params.orgSlug;
    
    // Check if we're accessing Pack 1703 via sessionStorage flag or route
    const pack1703Access = sessionStorage.getItem('pack1703_access') === 'true';
    
    if (providedSlug) {
      setOrgSlug(providedSlug);
    } else if (pathOrgSlug) {
      setOrgSlug(pathOrgSlug);
    } else if (location.pathname.startsWith('/pack1703/')) {
      // We're accessing Pack 1703 via slug route
      setOrgSlug('pack1703');
    } else if (pack1703Access && location.pathname === '/') {
      // We're accessing Pack 1703 at root
      setOrgSlug('pack1703');
    } else {
      setOrgSlug(null);
    }
  }, [location.pathname, params.orgSlug, providedSlug]);

  const isPack1703 = orgSlug === 'pack1703' || orgSlug === null;

  const prefixPath = (path: string): string => {
    // Don't prefix if no org slug
    if (!orgSlug) return path;
    
    // Don't prefix if already prefixed
    if (path.startsWith(`/${orgSlug}/`) || path.startsWith(`/${orgSlug}?`)) {
      return path;
    }
    
    // Don't prefix absolute paths (external URLs)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Don't prefix public routes and platform admin routes that shouldn't be org-specific
    const publicRoutes = [
      '/reset-password', 
      '/password-setup', 
      '/join', 
      '/organizations', 
      '/pack1703',
      '/copse-admin',      // Copse admin panel is platform-level, not org-specific
      '/appcheck-debug',   // Debug tools are platform-level
      '/role-debug',       // Debug tools are platform-level
      '/test-copse-login'  // Test pages are platform-level
    ];
    if (publicRoutes.some(route => path.startsWith(route))) {
      return path;
    }
    
    // Prefix with org slug
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${orgSlug}/${cleanPath}`;
  };

  return (
    <OrganizationContext.Provider value={{ 
      orgSlug, 
      isPack1703, 
      prefixPath,
      organizationId,
      organizationName,
      orgType,
      enabledComponents,
      branding
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

