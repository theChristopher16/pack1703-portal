import React from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { OrganizationType, ComponentId, getComponent, ORGANIZATION_TYPE_NAMES } from '../types/organization';
import { 
  MessageSquare, 
  Calendar, 
  Megaphone, 
  MapPin, 
  FolderOpen, 
  User,
  Store,
  Package,
  ShoppingCart,
  CreditCard
} from 'lucide-react';

interface OrganizationHomePageProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    orgType: OrganizationType;
    enabledComponents: ComponentId[];
    description?: string;
  };
}

const OrganizationHomePage: React.FC<OrganizationHomePageProps> = ({ organization }) => {
  const navigate = useNavigate();

  // Component icon mapping
  const componentIcons: Record<ComponentId, React.ReactNode> = {
    chat: <MessageSquare className="w-6 h-6" />,
    calendar: <Calendar className="w-6 h-6" />,
    announcements: <Megaphone className="w-6 h-6" />,
    locations: <MapPin className="w-6 h-6" />,
    resources: <FolderOpen className="w-6 h-6" />,
    profile: <User className="w-6 h-6" />,
    products: <Store className="w-6 h-6" />,
    orders: <Package className="w-6 h-6" />,
    cart: <ShoppingCart className="w-6 h-6" />,
    checkout: <CreditCard className="w-6 h-6" />,
  };

  const handleComponentClick = (componentId: ComponentId) => {
    navigate(`/${organization.slug}/${componentId}`);
  };

  // Group components by category
  const baseComponents = organization.enabledComponents.filter(
    comp => ['chat', 'calendar', 'announcements', 'locations', 'resources', 'profile'].includes(comp)
  );
  const storefrontComponents = organization.enabledComponents.filter(
    comp => ['products', 'orders', 'cart', 'checkout'].includes(comp)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-ink mb-4">
            Welcome to {organization.name}
          </h1>
          <p className="text-xl text-forest-600 mb-2">
            {ORGANIZATION_TYPE_NAMES[organization.orgType]}
          </p>
          {organization.description && (
            <p className="text-lg text-forest-500 max-w-2xl mx-auto">
              {organization.description}
            </p>
          )}
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Base Components */}
          {baseComponents.length > 0 && (
            <>
              {baseComponents.map((compId) => {
                const comp = getComponent(compId);
                return (
                  <button
                    key={compId}
                    onClick={() => handleComponentClick(compId)}
                    className="solarpunk-card group hover:shadow-xl transition-all duration-300 text-left p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-forest-400 to-ocean-400 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                        {componentIcons[compId]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-ink mb-1">
                          {comp.name}
                        </h3>
                        <p className="text-sm text-forest-600">
                          {comp.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Storefront Components */}
          {storefrontComponents.length > 0 && (
            <>
              {storefrontComponents.map((compId) => {
                const comp = getComponent(compId);
                return (
                  <button
                    key={compId}
                    onClick={() => handleComponentClick(compId)}
                    className="solarpunk-card group hover:shadow-xl transition-all duration-300 text-left p-6 border-2 border-solar-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-solar-400 to-ocean-400 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                        {componentIcons[compId]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-ink mb-1">
                          {comp.name}
                        </h3>
                        <p className="text-sm text-forest-600">
                          {comp.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Empty State */}
          {organization.enabledComponents.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="inline-block p-4 bg-forest-100 rounded-full mb-4">
                <FolderOpen className="w-12 h-12 text-forest-600" />
              </div>
              <h3 className="text-2xl font-semibold text-ink mb-2">No Components Available</h3>
              <p className="text-forest-600">
                This organization doesn't have any components enabled yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationHomePage;

