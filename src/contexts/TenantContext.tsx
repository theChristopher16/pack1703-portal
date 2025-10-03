import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAdmin } from './AdminContext';

export type TenantTheme = {
  primary?: string;
  accent?: string;
  logoUrl?: string;
};

export type TenantConfig = {
  name: string;
  packNumber: string;
  slug: string;
  theme?: TenantTheme;
  features?: Record<string, boolean>;
};

type TenantContextValue = {
  tenantId: string;
  cfg: TenantConfig | null;
  roles: string[];
  can: (perm: string) => boolean;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider');
  return ctx;
}

function useApplyTheme(theme?: TenantTheme) {
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--color-primary', theme?.primary ?? '#166534');
    r.setProperty('--color-accent', theme?.accent ?? '#eab308');
  }, [theme]);
}

async function fetchTenantIdForSlug(slug: string): Promise<string | null> {
  try {
    const ref = doc(db, 'tenant_slugs', slug);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { tenantId?: string };
      return data?.tenantId ?? null;
    }
    return null;
  } catch (e) {
    console.warn('Failed to resolve tenantId for slug', slug, e);
    return null;
  }
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantSlug } = useParams();
  const { state: adminState } = useAdmin();

  const [tenantId, setTenantId] = useState<string>('pack-1703');
  const [cfg, setCfg] = useState<TenantConfig | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  // Resolve slug -> tenantId
  useEffect(() => {
    let mounted = true;
    // Derive slug from URL first segment to avoid route context mismatches
    const pathFirst = (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : '') || '';
    const fallbackSlug = pathFirst || tenantSlug || 'pack-1703';
    const slug = fallbackSlug.toLowerCase();
    fetchTenantIdForSlug(slug).then((resolved) => {
      if (!mounted) return;
      setTenantId(resolved || slug);
    }).catch(() => {
      if (!mounted) return;
      setTenantId(slug);
    });
    return () => {
      mounted = false;
    };
  }, [tenantSlug]);

  // Subscribe to tenant config
  useEffect(() => {
    // Defer until authenticated to satisfy Firestore rules
    const uid = adminState?.currentUser?.uid || auth.currentUser?.uid;
    if (!tenantId || !uid) return;
    const ref = doc(db, 'tenants', tenantId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as TenantConfig;
        setCfg({ ...data, slug: data.slug || tenantId });
      } else {
        setCfg(null);
      }
    }, (err) => {
      console.warn('Tenant config subscription error', err);
      setCfg(null);
    });
    return () => unsub();
  }, [tenantId, adminState?.currentUser?.uid]);

  // Subscribe to membership roles for current user
  useEffect(() => {
    const uid = adminState?.currentUser?.uid || auth.currentUser?.uid;
    if (!tenantId || !uid) {
      setRoles([]);
      return;
    }
    const ref = doc(db, 'tenants', tenantId, 'memberships', uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any;
      const nextRoles = Array.isArray(data?.roles) ? data.roles as string[] : [];
      setRoles(nextRoles);
    }, (err) => {
      console.warn('Membership roles subscription error', err);
      setRoles([]);
    });
    return () => unsub();
  }, [tenantId, adminState?.currentUser?.uid]);

  const can = useMemo(() => {
    const isSuper = roles.includes('root') || roles.includes('super-admin') || roles.includes('TENANT_ADMIN');
    return (perm: string) => {
      if (isSuper) return true;
      // Simple permissive fallback: allow if role name matches perm or a generic admin role exists
      if (roles.includes('admin')) return true;
      return roles.includes(perm);
    };
  }, [roles]);

  useApplyTheme(cfg?.theme);

  const value = useMemo<TenantContextValue>(() => ({ tenantId, cfg, roles, can }), [tenantId, cfg, roles, can]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantProvider;


