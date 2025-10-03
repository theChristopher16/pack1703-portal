import { collection, doc, getDoc, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase/config';
import { useTenant } from '../contexts/TenantContext';

export function useTenantIdFromSlug(slug?: string) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const ref = doc(db, 'tenant_slugs', slug);
        const snap = await getDoc(ref);
        const data = snap.data() as any;
        setTenantId((data && data.tenantId) || slug);
      } catch {
        setTenantId(slug);
      }
    })();
  }, [slug]);
  return tenantId;
}

export function useEvents(upcomingOnly = true) {
  const { tenantId } = useTenant();
  const base = useMemo(() => collection(db, `tenants/${tenantId}/events`), [tenantId]);
  const q = useMemo(() => {
    if (!upcomingOnly) return base;
    // NOTE: Keep it simple; consumers can refine queries as needed
    return base;
  }, [base, upcomingOnly]);
  return { collectionRef: q };
}


