import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAdmin } from '../contexts/AdminContext';
import { OrganizationType, ComponentId, getComponent, OrganizationBranding, Organization } from '../types/organization';
import Layout from '../components/Layout/Layout';
import { AuthenticatedOnly } from '../components/Auth/RoleGuard';
import { OrganizationProvider } from '../contexts/OrganizationContext';

// Import component pages
import HomePage from '../pages/HomePage';
import EventsPage from '../pages/EventsPage';
import UnifiedAnnouncementsPage from '../pages/UnifiedAnnouncementsPage';
import LocationsPage from '../pages/LocationsPage';
import ResourcesPage from '../pages/ResourcesPage';
import UnifiedChat from '../components/Chat/UnifiedChat';
import UserProfile from '../pages/UserProfile';
import NotFoundPage from '../pages/NotFoundPage';
import OrganizationHomePage from '../pages/OrganizationHomePage';

// Placeholder components for storefront features (to be implemented)
const StorefrontProductsPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-display font-bold text-ink mb-4">Products</h1>
      <p className="text-lg text-forest-600">Storefront products page coming soon...</p>
    </div>
  </div>
);

const StorefrontOrdersPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-display font-bold text-ink mb-4">Orders</h1>
      <p className="text-lg text-forest-600">Storefront orders page coming soon...</p>
    </div>
  </div>
);

const StorefrontCartPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-display font-bold text-ink mb-4">Shopping Cart</h1>
      <p className="text-lg text-forest-600">Storefront cart page coming soon...</p>
    </div>
  </div>
);

const StorefrontCheckoutPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-display font-bold text-ink mb-4">Checkout</h1>
      <p className="text-lg text-forest-600">Storefront checkout page coming soon...</p>
    </div>
  </div>
);

// Helper function to create default branding from organization data
function createDefaultBranding(org: Organization): OrganizationBranding {
  // If org already has branding, use it (this shouldn't happen, but handle it gracefully)
  if (org.branding) {
    return org.branding;
  }
  
  // Create default branding from organization data
  return {
    name: org.name,
    displayName: org.name,
    shortName: org.name.length > 20 ? org.name.substring(0, 20) + '...' : org.name,
    description: org.description,
    // Other branding fields (email, website, socialLinks) are optional and undefined by default
  };
}

interface OrganizationRouterProps {
  children?: React.ReactNode;
}

const OrganizationRouter: React.FC<OrganizationRouterProps> = ({ children }) => {
  const { orgSlug, componentSlug } = useParams<{ orgSlug: string; componentSlug?: string }>();
  const navigate = useNavigate();
  const { state } = useAdmin();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgSlug) {
      setIsLoading(false);
      return;
    }

    const loadOrganization = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query organizations by slug
        const orgsRef = collection(db, 'organizations');
        const q = query(orgsRef, where('slug', '==', orgSlug));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Organization not found');
          setIsLoading(false);
          return;
        }

        const orgDoc = snapshot.docs[0];
        const data = orgDoc.data();

        if (!data.isActive) {
          setError('Organization is not active');
          setIsLoading(false);
          return;
        }

        const org: Organization = {
          id: orgDoc.id,
          name: data.name || '',
          slug: data.slug || '',
          orgType: (data.orgType as OrganizationType) || OrganizationType.PACK,
          enabledComponents: data.enabledComponents || [],
          isActive: data.isActive,
          description: data.description || '',
          branding: data.branding || undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          memberCount: data.memberCount || 0,
          eventCount: data.eventCount || 0,
          locationCount: data.locationCount || 0,
          billingAccountId: data.billingAccountId,
          billingAccountLabel: data.billingAccountLabel,
          billingAccountCreatedAt: data.billingAccountCreatedAt?.toDate(),
          billingAccountLinkedAt: data.billingAccountLinkedAt?.toDate(),
        };

        setOrganization(org);

        // Don't auto-redirect - let user see the homepage
        // The homepage will show available components
      } catch (err: any) {
        console.error('Error loading organization:', err);
        setError(err.message || 'Failed to load organization');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [orgSlug, componentSlug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-700">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-display font-bold text-ink mb-4">Organization Not Found</h1>
              <p className="text-lg text-forest-600 mb-6">{error || 'The requested organization could not be found.'}</p>
              <button
                onClick={() => navigate('/organizations')}
                className="solarpunk-btn-primary"
              >
                Back to Organizations
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Validate component access - redirect if component is not enabled
  if (componentSlug && !organization.enabledComponents.includes(componentSlug as ComponentId)) {
    // Component not enabled - redirect to organization homepage
    return <Navigate to={`/${orgSlug}`} replace />;
  }

  // Create branding from organization data
  const branding = organization.branding || createDefaultBranding(organization);

  // Component mapping - these will be rendered within OrganizationProvider
  const getComponentJSX = (compId: ComponentId): React.ReactNode => {
    switch (compId) {
      case 'chat':
        return <Layout><AuthenticatedOnly><UnifiedChat /></AuthenticatedOnly></Layout>;
      case 'calendar':
        return <Layout><AuthenticatedOnly><EventsPage /></AuthenticatedOnly></Layout>;
      case 'announcements':
        return <Layout><AuthenticatedOnly><UnifiedAnnouncementsPage /></AuthenticatedOnly></Layout>;
      case 'locations':
        return <Layout><AuthenticatedOnly><LocationsPage /></AuthenticatedOnly></Layout>;
      case 'resources':
        return <Layout><AuthenticatedOnly><ResourcesPage /></AuthenticatedOnly></Layout>;
      case 'profile':
        return <Layout><AuthenticatedOnly><UserProfile /></AuthenticatedOnly></Layout>;
      case 'products':
        return <Layout><AuthenticatedOnly><StorefrontProductsPage /></AuthenticatedOnly></Layout>;
      case 'orders':
        return <Layout><AuthenticatedOnly><StorefrontOrdersPage /></AuthenticatedOnly></Layout>;
      case 'cart':
        return <Layout><AuthenticatedOnly><StorefrontCartPage /></AuthenticatedOnly></Layout>;
      case 'checkout':
        return <Layout><AuthenticatedOnly><StorefrontCheckoutPage /></AuthenticatedOnly></Layout>;
      default:
        return null;
    }
  };

  // Wrap everything in OrganizationProvider first
  const wrappedContent = (
    <OrganizationProvider 
      orgSlug={organization.slug}
      organizationId={organization.id}
      organizationName={organization.name}
      branding={branding}
      orgType={organization.orgType}
    >
      {!componentSlug ? (
        // If no component specified, show organization homepage
        organization.enabledComponents.length > 0 ? (
          <Layout>
            <OrganizationHomePage organization={organization} />
          </Layout>
        ) : (
          <Layout>
            <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h1 className="text-4xl font-display font-bold text-ink mb-4">Welcome to {organization.name}</h1>
                  <p className="text-lg text-forest-600 mb-6">
                    This organization doesn't have any components enabled yet.
                  </p>
                </div>
              </div>
            </div>
          </Layout>
        )
      ) : (
        // Render the requested component
        getComponentJSX(componentSlug as ComponentId) || (
          <Layout>
            <NotFoundPage />
          </Layout>
        )
      )}
    </OrganizationProvider>
  );

  return wrappedContent;
};

export default OrganizationRouter;

