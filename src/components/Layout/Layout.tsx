import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAdmin } from '../../contexts/AdminContext';
import { UserRole } from '../../services/authService';
import { getNavigationByCategory, isAdminOrAbove, isRoot, ALL_NAVIGATION_ITEMS } from '../../services/navigationService';
import OfflineBanner from './OfflineBanner';
import PWAInstallPrompt from '../PWAInstallPrompt/PWAInstallPrompt';
import BackToTop from '../BackToTop/BackToTop';
import LoginModal from '../Auth/LoginModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize analytics
  useAnalytics();
  
  // Get admin context for role-based navigation
  const { state } = useAdmin();
  
  // Pack branding
  const packName = 'Cub Scout Pack 1703';
  
  // Track authentication changes from AdminContext
  useEffect(() => {
    if (state.currentUser) {
      setCurrentUser(state.currentUser);
      // Convert AdminRole to UserRole
      const roleMap: { [key: string]: UserRole } = {
        'root': UserRole.SUPER_ADMIN,
        'super-admin': UserRole.SUPER_ADMIN,
        'content-admin': UserRole.ADMIN,
        'moderator': UserRole.DEN_LEADER,
        'viewer': UserRole.PARENT,
        'ai_assistant': UserRole.AI_ASSISTANT
      };
      setUserRole(roleMap[state.currentUser.role] || UserRole.PARENT);
    } else {
      setCurrentUser(null);
      setUserRole(null);
    }
  }, [state.currentUser]);

  // REMOVED LOADING CHECK - This was causing page reloads
  // The AuthGuard already handles authentication, so we don't need to check again
  
  // Handle successful login
  const handleLoginSuccess = (user: any) => {
    console.log('Login successful:', user);
    setIsLoginModalOpen(false);
    // The AdminContext will automatically update the currentUser state
  };

  // Return paths as-is (no tenant prefixing needed)
  const prefixPath = (path: string) => {
    return path;
  };

  // Handle navigation with error recovery
  const handleNavigation = (href: string) => {
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
    
    // Force navigation even if there are issues
    try {
      navigate(prefixPath(href));
    } catch (error) {
      console.error('Navigation error, forcing redirect:', error);
      // Fallback to window.location if React Router fails
      window.location.href = prefixPath(href);
    }
  };

  
  // Separate navigation by category for better organization
  const publicNav = getNavigationByCategory(userRole || UserRole.PARENT, 'public');
  const authenticatedNav = getNavigationByCategory(userRole || UserRole.PARENT, 'authenticated');
  const adminNav = getNavigationByCategory(userRole || UserRole.PARENT, 'admin');
  const systemNav = getNavigationByCategory(userRole || UserRole.PARENT, 'system');
  
  
  
  // Combine all navigation items
  const allNavItems = [...publicNav, ...authenticatedNav, ...adminNav, ...systemNav];
  
  // Create prioritized navigation for main toolbar (prioritize main content items)
  const getMainToolbarItems = () => {
    if (currentUser) {
      // For authenticated users, prioritize main content items
      const mainContentItems = publicNav.filter(item => 
        ['Events', 'Announcements', 'Locations', 'Volunteer', 'Ecology'].includes(item.name)
      );
      const chatItem = authenticatedNav.find(item => item.name === 'Chat');
      const profileItem = authenticatedNav.find(item => item.name === 'Profile');
      const otherItems = publicNav.filter(item => 
        !['Events', 'Announcements', 'Locations', 'Volunteer', 'Ecology', 'Home'].includes(item.name)
      );
      
      // For super-admin users, include SOC Console
      const superAdminItems = userRole === UserRole.SUPER_ADMIN ? [
        ...systemNav.filter(item => ['SOC Console'].includes(item.name))
      ] : [];
      
      return [
        ...mainContentItems,
        ...(chatItem ? [chatItem] : []),
        ...(profileItem ? [profileItem] : [])
      ].slice(0, 7); // Limit to 7 items for better desktop layout (Events, Announcements, Locations, Volunteer, Ecology, Chat, Profile)
    } else {
      // For anonymous users, show public items
      return publicNav.slice(0, 4);
    }
  };
  
  const mainToolbarItems = getMainToolbarItems();
  
  // Check if user has admin privileges
  const isAdmin = userRole ? isAdminOrAbove(userRole) : false;
  const isRootUser = userRole ? isRoot(userRole) : false;


  // Organize navigation into logical groups for dropdown
  const coreFeaturesItems = publicNav.filter(item => 
    ['Events', 'Announcements', 'Locations', 'Volunteer'].includes(item.name)
  );
  
  // ALWAYS include Ecology in Core Features (bypass role filtering)
  const ecologyItem = ALL_NAVIGATION_ITEMS.find(item => item.name === 'Ecology');
  if (ecologyItem) {
    coreFeaturesItems.push(ecologyItem);
  }
  
  const navigationGroups = [
    {
      name: 'Core Features',
      items: coreFeaturesItems,
      icon: '🏠'
    },
    {
      name: 'Communication',
      items: authenticatedNav.filter(item => 
        item.href === '/chat' || item.href === '/feedback'
      ),
      icon: '💬'
    },
    {
      name: 'Account',
      items: authenticatedNav.filter(item => 
        item.href === '/profile'
      ),
      icon: '👤'
    },
    {
      name: 'Resources',
      items: authenticatedNav.filter(item => 
        item.href === '/resources' || item.href === '/data-audit'
      ),
      icon: '📚'
    },
    {
      name: 'Analytics',
      items: adminNav.filter(item => 
        item.href === '/analytics' || item.href === '/analytics/test'
      ),
      icon: '📊'
    },
    {
      name: 'Content Management',
      items: adminNav.filter(item => 
        item.href.includes('/events') || 
        item.href.includes('/announcements') || 
        item.href.includes('/locations')
      ),
      icon: '📝'
    },
    {
      name: 'User Management',
      items: adminNav.filter(item => 
        item.href.includes('/users') || 
        item.href.includes('/volunteer') ||
        false
      ),
      icon: '👥'
    },
    {
      name: 'Financial',
      items: adminNav.filter(item => 
        item.href.includes('/fundraising') || 
        item.href.includes('/finances')
      ),
      icon: '💰'
    },
    {
      name: 'Operations',
      items: adminNav.filter(item => 
        item.href.includes('/lists') || 
        item.href.includes('/seasons') ||
        item.href.includes('/chat')
      ),
      icon: '⚙️'
    },
    {
      name: 'System Administration',
      items: systemNav.filter(item => 
        item.href.includes('/ai') || 
        item.href.includes('/cost-management') ||
        item.href.includes('/multi-tenant') ||
        item.href.includes('/settings')
      ),
      icon: '🔧'
    },
    {
      name: 'Monitoring',
      items: systemNav.filter(item => 
        item.href.includes('/soc') ||
        item.href.includes('/database') ||
        item.href.includes('/system') ||
        item.href.includes('/security') ||
        item.href.includes('/permissions') ||
        item.href.includes('/api')
      ),
      icon: '📈'
    }
  ].filter(group => group.items.length > 0); // Only show groups with items

  // Debug: Log navigation groups for super-admin users
  if (userRole === UserRole.SUPER_ADMIN) {
    console.log('🔍 Super-Admin Navigation Groups Debug:', {
      navigationGroups: navigationGroups.map(group => ({
        name: group.name,
        items: group.items.map(item => ({ name: item.name, href: item.href }))
      })),
      systemNavItems: systemNav.map(item => ({ name: item.name, href: item.href }))
    });
  }


  // For mobile menu, ensure we always have content to show
  // Force Ecology to always be in Core Features for mobile
  const coreFeaturesGroup = navigationGroups.find(group => group.name === 'Core Features');
  if (coreFeaturesGroup) {
    // Ensure Ecology is in the Core Features group
    const hasEcology = coreFeaturesGroup.items.some(item => item.name === 'Ecology');
    if (!hasEcology) {
      const ecologyItem = ALL_NAVIGATION_ITEMS.find(item => item.name === 'Ecology');
      if (ecologyItem) {
        coreFeaturesGroup.items.push(ecologyItem);
      }
    }
  }
  
  const mobileNavigationGroups = navigationGroups.length > 0 ? navigationGroups : [
    {
      name: 'Navigation',
      items: publicNav.filter(item => 
        ['Events', 'Announcements', 'Locations', 'Volunteer', 'Ecology'].includes(item.name)
      ),
      icon: '🏠'
    }
  ];


  const isActive = (path: string) => {
    const prefixedPath = prefixPath(path);
    return location.pathname === prefixedPath || location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex flex-col">
      {/* Solarpunk Brand Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-card border-b border-forest-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <button 
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-solarpunk rounded-2xl flex items-center justify-center shadow-glow">
                <span className="text-white" style={{ fontSize: '24px' }}>🌱</span>
              </div>
              <div className="block min-w-0 flex-shrink">
                <h1 className="text-lg sm:text-xl font-solarpunk-display font-bold text-forest-600 truncate max-w-48 sm:max-w-64 md:max-w-none">
                  <span className="hidden sm:inline">{packName || 'Cub Scout Pack 1703'}</span>
                  <span className="sm:hidden">Pack 1703</span>
                </h1>
                <p className="text-xs text-ocean-600 truncate max-w-48 sm:max-w-64 md:max-w-none">
                  <span className="hidden sm:inline">Solarpunk Portal</span>
                  <span className="sm:hidden">Portal</span>
                </p>
              </div>
            </button>

            {/* Hamburger Menu Button - All Screen Sizes */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-white/95 backdrop-blur-sm border border-forest-200 text-forest-700 hover:bg-gradient-to-r hover:from-forest-50 hover:to-ocean-50 hover:border-forest-300 hover:text-forest-800 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Hamburger Menu - All Screen Sizes */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop - Covers everything */}
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Menu Content - Slide in from right */}
            <div 
              className="fixed top-16 right-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto"
              style={{
                maxHeight: 'calc(100vh - 64px)',
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom))'
              }}
            >
              <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Navigation Groups - Show all groups */}
                {navigationGroups.map((group, groupIndex) => (
                  <div key={group.name} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{group.icon}</span>
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                          {group.name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Group Items */}
                    <div className="bg-white">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              handleNavigation(item.href);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                              isActive(item.href)
                                ? 'text-primary-600 bg-primary-50 border-l-4 border-primary-600'
                                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Account Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Account</span>
                  </div>
                  <div className="bg-white">
                    {currentUser ? (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              const { authService } = await import('../../services/authService');
                              await authService.signOut();
                              setIsMobileMenuOpen(false);
                            } catch (error) {
                              console.error('Error logging out:', error);
                            }
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Login</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 mt-4"
                >
                  Close Menu
                </button>
              </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Solarpunk Footer */}
      <footer className="solarpunk-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-solarpunk-display font-semibold text-forest-600 mb-4">Contact Us</h3>
              <div className="space-y-2">
                <p className="text-forest-600 font-medium">{packName}</p>
                <p className="text-forest-600">Houston, TX</p>
                <p className="text-forest-600">
                  Email: <a 
                    href="mailto:cubmaster@sfpack1703.com" 
                    className="text-ocean-600 hover:text-ocean-700 font-medium transition-colors duration-200"
                  >
                    cubmaster@sfpack1703.com
                  </a>
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-solarpunk-display font-semibold text-forest-600 mb-4">Quick Links</h3>
              <div className="space-y-2">
                {mainToolbarItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className="block text-ocean-600 hover:text-ocean-700 font-medium text-left transition-colors duration-200"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-solarpunk-display font-semibold text-forest-600 mb-4">Resources</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigation('/resources')}
                  className="block text-ocean-600 hover:text-ocean-700 font-medium text-left transition-colors duration-200"
                >
                  Pack Resources
                </button>
                <button
                  onClick={() => handleNavigation('/feedback')}
                  className="block text-ocean-600 hover:text-ocean-700 font-medium text-left transition-colors duration-200"
                >
                  Feedback
                </button>
                <button
                  onClick={() => handleNavigation('/privacy')}
                  className="block text-ocean-600 hover:text-ocean-700 font-medium text-left transition-colors duration-200"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="solarpunk-footer-social">
            <a href="mailto:cubmaster@sfpack1703.com" className="solarpunk-social-link" title="Email">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </a>
            <a href="https://www.facebook.com/groups/sfpack1703" target="_blank" rel="noopener noreferrer" className="solarpunk-social-link" title="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/sfpack1703" target="_blank" rel="noopener noreferrer" className="solarpunk-social-link" title="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281c-.49 0-.875-.385-.875-.875s.385-.875.875-.875.875.385.875.875-.385.875-.875.875z"/>
              </svg>
            </a>
            <a href="https://www.scouting.org" target="_blank" rel="noopener noreferrer" className="solarpunk-social-link" title="Scouting America">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-forest-200 text-center">
            <p className="text-forest-500">&copy; 2024 {packName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Back to Top Button */}
      <BackToTop />
      
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Layout;
