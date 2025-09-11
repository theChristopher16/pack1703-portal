import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Settings } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { usePackNameConfig } from '../../hooks/useConfig';
import { useAdmin } from '../../contexts/AdminContext';
import { authService, UserRole } from '../../services/authService';
import { getNavigationForRole, getNavigationByCategory, isAdminOrAbove, isRoot } from '../../services/navigationService';
import OfflineBanner from './OfflineBanner';
import PWAInstallPrompt from '../PWAInstallPrompt/PWAInstallPrompt';
import BackToTop from '../BackToTop/BackToTop';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ANONYMOUS);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize analytics
  useAnalytics();
  
  // Load configuration values
  const { value: packName } = usePackNameConfig();
  
  // Get admin context for role-based navigation
  const { state } = useAdmin();

  // Track authentication changes from AdminContext
  useEffect(() => {
    if (state.currentUser) {
      setCurrentUser(state.currentUser);
      // Convert AdminRole to UserRole
      const roleMap: { [key: string]: UserRole } = {
        'root': UserRole.ROOT,
        'admin': UserRole.ADMIN,
        'volunteer': UserRole.VOLUNTEER,
        'parent': UserRole.PARENT,
        'anonymous': UserRole.ANONYMOUS
      };
      setUserRole(roleMap[state.currentUser.role] || UserRole.PARENT);
    } else {
      setCurrentUser(null);
      setUserRole(UserRole.ANONYMOUS);
    }
  }, [state.currentUser]);

  // Debug navigation issues
  useEffect(() => {
    console.log('Layout: Navigation updated - User:', currentUser?.email || 'No user', 'Role:', userRole);
  }, [currentUser, userRole, location.pathname]);

  // Handle navigation with error recovery
  const handleNavigation = (href: string) => {
    // console.log('Attempting navigation to:', href);
    
    // Close dropdown if open
    setIsDropdownOpen(false);
    
    // Add a small delay to ensure dropdown closes before navigation
    setTimeout(() => {
      // Force navigation even if there are issues
      try {
        // console.log('Executing navigation to:', href);
        navigate(href);
      } catch (error) {
        console.error('Navigation error, forcing redirect:', error);
        // Fallback to window.location if React Router fails
        window.location.href = href;
      }
    }, 100);
  };

  
  // Separate navigation by category for better organization
  const publicNav = getNavigationByCategory(userRole, 'public');
  const authenticatedNav = getNavigationByCategory(userRole, 'authenticated');
  const adminNav = getNavigationByCategory(userRole, 'admin');
  const systemNav = getNavigationByCategory(userRole, 'system');
  
  // Combine all navigation items
  const allNavItems = [...publicNav, ...authenticatedNav, ...adminNav, ...systemNav];
  
  // Check if user has admin privileges
  const isAdmin = isAdminOrAbove(userRole);
  const isRootUser = isRoot(userRole);

  // Organize navigation into logical groups for dropdown
  const navigationGroups = [
    {
      name: 'Core Features',
      items: publicNav.slice(0, 4), // First 4 public items go in main toolbar
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
        item.href.includes('/admin/events') || 
        item.href.includes('/admin/announcements') || 
        item.href.includes('/admin/locations')
      ),
      icon: '📝'
    },
    {
      name: 'User Management',
      items: adminNav.filter(item => 
        item.href.includes('/admin/users') || 
        item.href.includes('/admin/volunteer') ||
        item.href.includes('/admin/permissions-audit')
      ),
      icon: '👥'
    },
    {
      name: 'Financial',
      items: adminNav.filter(item => 
        item.href.includes('/admin/fundraising') || 
        item.href.includes('/admin/finances')
      ),
      icon: '💰'
    },
    {
      name: 'Operations',
      items: adminNav.filter(item => 
        item.href.includes('/admin/lists') || 
        item.href.includes('/admin/seasons') ||
        item.href.includes('/admin/chat')
      ),
      icon: '⚙️'
    },
    {
      name: 'System Administration',
      items: systemNav.filter(item => 
        item.href.includes('/admin/ai') || 
        item.href.includes('/admin/cost-management') ||
        item.href.includes('/admin/multi-tenant') ||
        item.href.includes('/admin/settings')
      ),
      icon: '🔧'
    },
    {
      name: 'Monitoring',
      items: systemNav.filter(item => 
        item.href.includes('/admin/soc') ||
        item.href.includes('/admin/database') ||
        item.href.includes('/admin/system') ||
        item.href.includes('/admin/performance') ||
        item.href.includes('/admin/security') ||
        item.href.includes('/admin/permissions') ||
        item.href.includes('/admin/api')
      ),
      icon: '📈'
    }
  ].filter(group => group.items.length > 0); // Only show groups with items

  // Debug navigation
  useEffect(() => {
    console.log('Layout: Navigation updated', {
      userRole,
      currentUser: currentUser?.email || 'No user',
      publicItems: publicNav.length,
      authenticatedItems: authenticatedNav.length,
      adminItems: adminNav.length,
      systemItems: systemNav.length,
      totalItems: allNavItems.length
    });
  }, [userRole, currentUser, publicNav, authenticatedNav, adminNav, systemNav]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 flex flex-col">
      {/* Enhanced Header with Solar-Punk Aesthetic */}
      <header className="bg-white/90 backdrop-blur-md shadow-soft border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white" style={{ fontSize: '24px' }}>🏕️</span>
              </div>
              <div className="block">
                <h1 className="text-lg sm:text-xl font-display font-bold text-gradient">
                  {packName || 'Cub Scout Pack 1703'}
                </h1>
                <p className="text-xs footer-text">Families Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {allNavItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      // console.log('Main toolbar navigation clicked:', item.href);
                      window.location.href = item.href;
                    }}
                    className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 group relative overflow-hidden ${
                      isActive(item.href)
                        ? 'nav-text-active bg-primary-50 shadow-soft'
                        : 'nav-text-inactive hover:nav-text-active hover:bg-primary-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-100/50 to-secondary-100/50 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-xl"></div>
                  </button>
                );
              })}
            </nav>

            {/* Medium Screen Navigation (shorter names) */}
            <nav className="hidden md:flex lg:hidden items-center space-x-1">
              {allNavItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      // console.log('Medium toolbar navigation clicked:', item.href);
                      window.location.href = item.href;
                    }}
                    className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 group relative overflow-hidden ${
                      isActive(item.href)
                        ? 'nav-text-active bg-primary-50 shadow-soft'
                        : 'nav-text-inactive hover:nav-text-active hover:bg-primary-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-100/50 to-secondary-100/50 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-xl"></div>
                  </button>
                );
              })}
            </nav>

            {/* More Dropdown for Additional Navigation Items */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <button 
                  onClick={() => {
                    console.log('More button clicked, current state:', isDropdownOpen);
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl font-medium nav-text-inactive hover:nav-text-active hover:bg-primary-50/50 transition-all duration-300"
                >
                  <span className="text-sm">More</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Enhanced Dropdown Menu with Organized Groups */}
                {isDropdownOpen && (
                  <div 
                    className="absolute top-full right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-soft border border-white/50 z-50 max-h-96 overflow-y-auto"
                    onMouseLeave={() => {
                      console.log('Mouse left dropdown, closing');
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="py-2 max-h-96 overflow-y-auto">
                      {/* Navigation Groups */}
                      {navigationGroups.map((group, groupIndex) => (
                        <div key={group.name} className="mb-2">
                          {/* Group Header */}
                          <div className="px-4 py-2 border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{group.icon}</span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                {group.name}
                              </span>
                            </div>
                          </div>
                          
                          {/* Group Items */}
                          <div className="py-1">
                            {group.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.name}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = item.href;
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    isActive(item.href)
                                      ? 'text-primary-600 bg-primary-50'
                                      : 'nav-text-inactive hover:nav-text-active hover:bg-primary-50/50'
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
                      
                      {/* Login/Admin Link */}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (currentUser) {
                              window.location.href = '/admin';
                            } else {
                              window.location.href = '/admin/login';
                            }
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive('/admin')
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                          }`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>{currentUser ? 'Admin Portal' : 'Login'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl nav-text-inactive hover:nav-text-active hover:bg-primary-50/50 transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50">
            <div className="px-4 py-2 space-y-1">
              {/* Public and Authenticated Navigation */}
              {allNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      handleNavigation(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'nav-text-inactive hover:nav-text-active hover:bg-primary-50/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              
              {/* Login/Admin Link */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => {
                    // If user is already logged in, go to admin dashboard
                    // If not logged in, go to login page
                    if (currentUser) {
                      handleNavigation('/admin');
                    } else {
                      handleNavigation('/admin/login');
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isActive('/admin')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>{currentUser ? 'Admin Portal' : 'Login'}</span>
                </button>
              </div>
              
              {/* Admin Navigation Items for Mobile */}
              {isAdmin && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="px-3 py-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin</span>
                  </div>
                  {adminNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          handleNavigation(item.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                          isActive(item.href)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* System Navigation Items for Mobile (Root only) */}
              {isRootUser && systemNav.length > 0 && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="px-3 py-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">System</span>
                  </div>
                  {systemNav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          handleNavigation(item.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                          isActive(item.href)
                            ? 'text-red-600 bg-red-50'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary-50 to-secondary-50 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-display font-semibold footer-heading mb-4">Contact Us</h3>
              <div className="space-y-2">
                <p className="footer-text font-medium">{packName}</p>
                <p className="footer-text">Houston, TX</p>
                <p className="footer-text">
                  Email: <a 
                    href="mailto:cubmaster@sfpack1703.com" 
                    className="footer-link"
                  >
                    cubmaster@sfpack1703.com
                  </a>
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-display font-semibold footer-heading mb-4">Quick Links</h3>
              <div className="space-y-2">
                {allNavItems.slice(0, 4).map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className="block footer-link text-left"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-display font-semibold footer-heading mb-4">Resources</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigation('/resources')}
                  className="block footer-link text-left"
                >
                  Pack Resources
                </button>
                <button
                  onClick={() => handleNavigation('/feedback')}
                  className="block footer-link text-left"
                >
                  Feedback
                </button>
                <button
                  onClick={() => handleNavigation('/privacy')}
                  className="block footer-link text-left"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="footer-copyright">&copy; 2024 {packName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default Layout;
