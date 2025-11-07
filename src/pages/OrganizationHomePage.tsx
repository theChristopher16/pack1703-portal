import React from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { OrganizationType, ComponentId, getComponent, ORGANIZATION_TYPE_NAMES } from '../types/organization';
import { 
  MessageSquare, 
  Calendar, 
  Megaphone, 
  MapPin, 
  FolderOpen,
  Image as ImageIcon,
  User,
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  UserPlus,
  DollarSign,
  Sprout,
  List,
  Users,
  Leaf,
  Target,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface OrganizationHomePageProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    orgType: OrganizationType;
    enabledComponents: ComponentId[];
    description?: string;
    branding?: {
      displayName?: string;
      shortName?: string;
      description?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
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
    gallery: <ImageIcon className="w-6 h-6" />,
    profile: <User className="w-6 h-6" />,
    products: <Store className="w-6 h-6" />,
    orders: <Package className="w-6 h-6" />,
    cart: <ShoppingCart className="w-6 h-6" />,
    checkout: <CreditCard className="w-6 h-6" />,
    analytics: <BarChart3 className="w-6 h-6" />,
    userManagement: <UserPlus className="w-6 h-6" />,
    finances: <DollarSign className="w-6 h-6" />,
    seasons: <Sprout className="w-6 h-6" />,
    lists: <List className="w-6 h-6" />,
    volunteer: <Users className="w-6 h-6" />,
    ecology: <Leaf className="w-6 h-6" />,
    fundraising: <Target className="w-6 h-6" />,
    dues: <DollarSign className="w-6 h-6" />,
  };

  const handleComponentClick = (componentId: ComponentId) => {
    console.log('Navigating to component:', componentId);
    navigate(`/${componentId}`);
  };

  // Get display name and description
  const displayName = organization.branding?.displayName || organization.name;
  const shortDescription = organization.branding?.description || organization.description || 
    `Welcome to ${organization.name} - ${ORGANIZATION_TYPE_NAMES[organization.orgType]}`;

  // Group components by category
  const baseComponents = organization.enabledComponents.filter(
    comp => ['chat', 'calendar', 'announcements', 'locations', 'resources', 'profile'].includes(comp)
  );
  const storefrontComponents = organization.enabledComponents.filter(
    comp => ['products', 'orders', 'cart', 'checkout'].includes(comp)
  );
  const managementComponents = organization.enabledComponents.filter(
    comp => !baseComponents.includes(comp) && !storefrontComponents.includes(comp)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-emerald-200/30 animate-float">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="absolute top-1/3 right-10 text-teal-200/30 animate-float-delayed">
          <Zap className="w-40 h-40" />
        </div>
        <div className="absolute bottom-20 left-1/4 text-cyan-200/30 animate-float">
          <Sparkles className="w-36 h-36" />
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-300/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-300/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Organization Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm tracking-widest uppercase rounded-xl shadow-lg mb-8">
              <Sprout className="w-5 h-5" />
              <span>{ORGANIZATION_TYPE_NAMES[organization.orgType]}</span>
            </div>

            {/* Organization Name */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-solarpunk-display font-black text-emerald-900 mb-6 leading-tight">
              {displayName}
            </h1>

            {/* Description */}
            <p className="text-xl sm:text-2xl text-emerald-700 mb-12 max-w-4xl mx-auto leading-relaxed">
              {shortDescription}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-16">
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-emerald-200/50 min-w-[160px]">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {organization.enabledComponents.length}
                </div>
                <div className="text-sm font-medium text-emerald-700 uppercase tracking-wide">
                  Active Tools
                </div>
              </div>
              
              {storefrontComponents.length > 0 && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-teal-200/50 min-w-[160px]">
                  <div className="text-4xl font-bold text-teal-600 mb-2">
                    <Store className="w-10 h-10 mx-auto" />
                  </div>
                  <div className="text-sm font-medium text-teal-700 uppercase tracking-wide">
                    Store Enabled
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Components Section */}
          {organization.enabledComponents.length > 0 ? (
            <div className="space-y-12">
              {/* Base Components */}
              {baseComponents.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-emerald-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    Essential Tools
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {baseComponents.map((compId) => {
                      const comp = getComponent(compId);
                      return (
                        <button
                          key={compId}
                          onClick={() => handleComponentClick(compId)}
                          className="group relative bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left border-2 border-emerald-200 hover:border-emerald-400 overflow-hidden"
                        >
                          {/* Hover gradient */}
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/10 group-hover:to-teal-400/10 transition-all duration-300" />
                          
                          <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                {componentIcons[compId]}
                              </div>
                              <ArrowRight className="w-6 h-6 text-emerald-400 group-hover:translate-x-1 transition-transform duration-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-emerald-900 mb-2 group-hover:text-emerald-600 transition-colors duration-300">
                              {comp.name}
                            </h3>
                            <p className="text-emerald-700 leading-relaxed">
                              {comp.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Storefront Components */}
              {storefrontComponents.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-teal-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    Store & Shopping
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {storefrontComponents.map((compId) => {
                      const comp = getComponent(compId);
                      return (
                        <button
                          key={compId}
                          onClick={() => handleComponentClick(compId)}
                          className="group relative bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 text-left text-white hover:scale-105 overflow-hidden"
                        >
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                          
                          <div className="relative">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300">
                              {componentIcons[compId]}
                            </div>
                            <h3 className="text-xl font-bold mb-2">
                              {comp.name}
                            </h3>
                            <p className="text-white/90 text-sm leading-relaxed">
                              {comp.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Management Components */}
              {managementComponents.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold text-cyan-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    Management & More
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {managementComponents.map((compId) => {
                      const comp = getComponent(compId);
                      return (
                        <button
                          key={compId}
                          onClick={() => handleComponentClick(compId)}
                          className="group relative bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-left border-2 border-cyan-200 hover:border-cyan-400 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-blue-400/0 group-hover:from-cyan-400/10 group-hover:to-blue-400/10 transition-all duration-300" />
                          
                          <div className="relative">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                {componentIcons[compId]}
                              </div>
                              <ArrowRight className="w-6 h-6 text-cyan-400 group-hover:translate-x-1 transition-transform duration-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-cyan-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">
                              {comp.name}
                            </h3>
                            <p className="text-cyan-700 leading-relaxed">
                              {comp.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mb-6 shadow-xl">
                <FolderOpen className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-emerald-900 mb-4">Getting Started</h3>
              <p className="text-xl text-emerald-700 max-w-2xl mx-auto">
                This organization is being set up. Components will appear here once they're enabled.
              </p>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-20 text-center">
            <div className="inline-block bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-emerald-200">
              <p className="text-emerald-700 text-lg">
                Need help getting started? Contact your organization administrator.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(-5deg);
          }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default OrganizationHomePage;
