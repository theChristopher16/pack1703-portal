import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Settings, LogOut, User } from 'lucide-react';
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
  
  // Note: Password setup check removed from Layout to avoid blocking UI
  // The check will be handled at the auth service level or in AuthGuard

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

  
  // Get all navigation items filtered by user role
  const getUserNavigationItems = () => {
    if (!userRole) return [];
    return ALL_NAVIGATION_ITEMS.filter(item => item.roles.includes(userRole));
  };

  const allNavItems = getUserNavigationItems();
  
  // Deduplicate navigation items by name (prefer first occurrence)
  const deduplicatedNavItems = Array.from(
    allNavItems.reduce((map, item) => {
      if (!map.has(item.name)) {
        map.set(item.name, item);
      }
      return map;
    }, new Map<string, typeof allNavItems[0]>()).values()
  );
  
  // Check if user has admin privileges
  const isAdmin = userRole ? isAdminOrAbove(userRole) : false;
  const isRootUser = userRole ? isRoot(userRole) : false;

  // Create simple navigation groups based on available items
  const navigationGroups = [
    {
      name: 'Main',
      items: deduplicatedNavItems.filter(item => 
        ['Home', 'Events', 'Announcements', 'Locations', 'Volunteer', 'Ecology', 'Fundraising'].includes(item.name)
      )
    },
    {
      name: 'My Account',
      items: deduplicatedNavItems.filter(item => 
        ['Profile', 'Chat', 'Resources', 'Feedback'].includes(item.name)
      )
    },
    {
      name: 'Management',
      items: deduplicatedNavItems.filter(item => 
        ['Analytics', 'User Management', 'Finances', 'Seasons', 'Lists'].includes(item.name)
      )
    },
    {
      name: 'System',
      items: deduplicatedNavItems.filter(item => 
        ['Organizations', 'Solyn AI', 'SOC Console', 'System Settings', 'System Monitor', 'Cost Management', 'User Interactions'].includes(item.name)
      )
    }
  ].filter(group => group.items.length > 0);

  // Get main toolbar items (first group)
  const mainToolbarItems = navigationGroups.length > 0 ? navigationGroups[0].items : [];

  const isActive = (path: string) => {
    const prefixedPath = prefixPath(path);
    return location.pathname === prefixedPath || location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex flex-col">
      {/* Solarpunk Brand Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-card border-b border-forest-200/50 sticky top-0 z-40">
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
              onClick={(e) => {
                e.stopPropagation();
                console.log('Hamburger button clicked, toggling menu');
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="p-2 rounded-xl bg-white/95 backdrop-blur-sm border border-forest-200 text-forest-700 hover:bg-gradient-to-r hover:from-forest-50 hover:to-ocean-50 hover:border-forest-300 hover:text-forest-800 transition-all duration-300 relative z-[102]"
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

        {/* Hamburger Menu - Rendered via Portal */}
        {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-[9998]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu Panel - Solarpunk Style */}
            <div className="fixed top-16 right-0 bottom-0 w-80 bg-gradient-to-br from-white/95 via-forest-50/50 to-solar-50/30 backdrop-blur-xl shadow-2xl border-l border-forest-200/50 z-[9999] overflow-y-auto animate-solarpunk-slide-up">
              <div className="p-6">
                {navigationGroups.map((group, groupIndex) => (
                  <div key={group.name} className="mb-6" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                    <h3 className="text-xs font-solarpunk-display font-bold text-forest-600 uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-forest-400 to-ocean-400 rounded-full"></div>
                      {group.name}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              handleNavigation(item.href);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                              isActive(item.href)
                                ? 'bg-gradient-to-r from-forest-100 to-ocean-100 text-forest-700 shadow-md border border-forest-200/50'
                                : 'text-forest-600 hover:bg-white/80 hover:shadow-md hover:border hover:border-forest-200/30 hover:scale-[1.02]'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg ${
                              isActive(item.href)
                                ? 'bg-gradient-to-br from-forest-400 to-ocean-400 text-white shadow-glow'
                                : 'bg-forest-100 text-forest-600 group-hover:bg-gradient-to-br group-hover:from-forest-300 group-hover:to-ocean-300 group-hover:text-white'
                            } transition-all duration-300`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-solarpunk-body">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Account Section - Solarpunk Style */}
                <div className="bg-white/60 backdrop-blur-sm border border-forest-200/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="bg-gradient-to-r from-forest-100 to-ocean-100 px-4 py-3 border-b border-forest-200/50">
                    <span className="text-sm font-solarpunk-display font-bold text-forest-700 uppercase tracking-wide flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Account
                    </span>
                  </div>
                  <div className="bg-white/80">
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
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50/50 transition-all duration-200 group"
                        >
                          <div className="p-1.5 rounded-lg bg-terracotta-100 text-terracotta-600 group-hover:bg-terracotta-200 transition-all duration-200">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setIsLoginModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-ocean-600 hover:text-ocean-700 hover:bg-ocean-50/50 transition-all duration-200 group"
                      >
                        <div className="p-1.5 rounded-lg bg-ocean-100 text-ocean-600 group-hover:bg-ocean-200 transition-all duration-200">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span>Login</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Close Button - Solarpunk Style */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full mt-6 bg-gradient-to-r from-forest-100 to-ocean-100 hover:from-forest-200 hover:to-ocean-200 text-forest-700 font-solarpunk-display font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg border border-forest-200/50"
                >
                  Close Menu
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-0">
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
