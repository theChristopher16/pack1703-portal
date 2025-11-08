import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useNavigate } from '../../hooks/useNavigate';
import { Menu, X, Settings, LogOut, User } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAdmin } from '../../contexts/AdminContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { UserRole } from '../../services/authService';
import { getNavigationByCategory, isAdminOrAbove, isRoot, ALL_NAVIGATION_ITEMS, filterNavigationByOrg } from '../../services/navigationService';
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
  
  // Get organization context for path prefixing and branding
  const { prefixPath: orgPrefixPath, branding, organizationName, isPack1703, orgType, enabledComponents } = useOrganization();
  
  // Organization branding - use branding from context or fallback to Pack 1703 defaults
  const packName = branding?.displayName || organizationName || (isPack1703 ? 'Cub Scout Pack 1703' : 'Organization');
  const shortName = branding?.shortName || organizationName || (isPack1703 ? 'Pack 1703' : 'Org');
  const contactEmail = branding?.email || (isPack1703 ? 'cubmaster@sfpack1703.com' : null);
  const orgWebsite = branding?.website;
  const socialLinks = branding?.socialLinks;
  
  // Track authentication changes from AdminContext
  useEffect(() => {
    if (state.currentUser) {
      setCurrentUser(state.currentUser);
      // Convert AdminRole to UserRole
      const roleMap: { [key: string]: UserRole } = {
        'root': UserRole.COPSE_ADMIN,
        'copse-admin': UserRole.COPSE_ADMIN,  // CRITICAL: Map copse-admin
        'super-admin': UserRole.SUPER_ADMIN,
        'content-admin': UserRole.ADMIN,
        'moderator': UserRole.DEN_LEADER,
        'viewer': UserRole.PARENT,
        'parent': UserRole.PARENT,
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

  // Return paths with organization prefix if needed
  const prefixPath = (path: string) => {
    return orgPrefixPath(path);
  };

  // Handle navigation with error recovery
  const handleNavigation = (href: string, isPlatformRoute: boolean = false) => {
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
    
    // Platform routes (like /copse-admin, /organizations) should NOT be prefixed
    const finalPath = isPlatformRoute ? href : prefixPath(href);
    
    // Force navigation even if there are issues
    try {
      navigate(finalPath);
    } catch (error) {
      console.error('Navigation error, forcing redirect:', error);
      // Fallback to window.location if React Router fails
      window.location.href = finalPath;
    }
  };

  
  // Check if we're on a platform-level page (Copse Network level, not org-specific)
  const isPlatformRoute = location.pathname === '/organizations' || 
                         location.pathname === '/copse-admin' ||
                         location.pathname === '/test-copse-login';
  
  // Get all navigation items filtered by user role, organization type, and enabled components
  const getUserNavigationItems = () => {
    if (!userRole) return [];
    
    // First filter by role
    const roleFilteredItems = ALL_NAVIGATION_ITEMS.filter(item => item.roles.includes(userRole));
    
    // If we're on a platform route, ONLY show platform routes
    if (isPlatformRoute) {
      return roleFilteredItems.filter(item => item.isPlatformRoute === true);
    }
    
    // When in an organization context
    // Show org-specific items + platform routes for super admins/copse admins (so they can navigate back)
    const isSuperUser = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COPSE_ADMIN;
    const orgSpecificItems = roleFilteredItems.filter(item => !item.isPlatformRoute);
    const filteredOrgItems = filterNavigationByOrg(orgSpecificItems, orgType, enabledComponents);
    
    // Add platform routes for super users so they can navigate back to Organizations/Copse Admin
    if (isSuperUser) {
      const platformItems = roleFilteredItems.filter(item => item.isPlatformRoute === true);
      return [...filteredOrgItems, ...platformItems];
    }
    
    return filteredOrgItems;
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

  // Create dynamic navigation groups based on item categories
  // This is fully modular - new navigation items automatically go to the right group
  const navigationGroups = [
    {
      name: 'Main',
      items: deduplicatedNavItems.filter(item => item.category === 'public')
    },
    {
      name: 'My Account',
      items: deduplicatedNavItems.filter(item => item.category === 'authenticated')
    },
    {
      name: 'Management',
      items: deduplicatedNavItems.filter(item => item.category === 'admin')
    },
    {
      name: 'System',
      items: deduplicatedNavItems.filter(item => item.category === 'system')
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
                  <span className="hidden sm:inline">{packName}</span>
                  <span className="sm:hidden">{shortName}</span>
                </h1>
                <p className="text-xs text-ocean-600 truncate max-w-48 sm:max-w-64 md:max-w-none">
                  🌳 Copse Network
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
                              handleNavigation(item.href, item.isPlatformRoute);
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
                
                {/* Account Section - Combined User Info, Orgs, and Logout */}
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
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-forest-100/50">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forest-400 to-ocean-400 flex items-center justify-center text-white font-bold text-xs shadow-glow flex-shrink-0">
                              {currentUser.displayName?.charAt(0)?.toUpperCase() || currentUser.email?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-forest-800 truncate text-xs">
                                {currentUser.displayName || currentUser.email}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(() => {
                                  const userRoles = currentUser.roles || [currentUser.role];
                                  const roleColors: Record<string, string> = {
                                    'copse_admin': 'bg-pink-100 text-pink-700 border-pink-200',
                                    'super_admin': 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                    'admin': 'bg-purple-100 text-purple-700 border-purple-200',
                                    'den_leader': 'bg-green-100 text-green-700 border-green-200',
                                    'parent': 'bg-blue-100 text-blue-700 border-blue-200'
                                  };
                                  return userRoles.map((role: string) => (
                                    <span 
                                      key={role}
                                      className={`text-[10px] px-1.5 py-0.5 rounded-full border ${roleColors[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                                    >
                                      {role.replace('_', ' ')}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Organization Switcher - For Copse Admin/Super Admin */}
                        {(userRole === UserRole.COPSE_ADMIN || userRole === UserRole.SUPER_ADMIN) && (
                          <div className="px-4 py-2 border-b border-forest-100/50">
                            <div className="space-y-1">
                              <button
                                onClick={() => {
                                  navigate('/copse-admin');
                                  setIsMobileMenuOpen(false);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-forest-50/50 transition-colors text-purple-700 hover:text-purple-900 font-medium"
                              >
                                🌐 Copse Network
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/pack1703');
                                  setIsMobileMenuOpen(false);
                                }}
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-forest-50/50 transition-colors text-forest-700 hover:text-forest-900"
                              >
                                🏕️ Pack 1703
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Logout Button */}
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
                {orgWebsite && (
                  <p className="text-forest-600">
                    Website: <a 
                      href={orgWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ocean-600 hover:text-ocean-700 font-medium transition-colors duration-200"
                    >
                      {orgWebsite}
                    </a>
                  </p>
                )}
                {contactEmail && (
                  <p className="text-forest-600">
                    Email: <a 
                      href={`mailto:${contactEmail}`}
                      className="text-ocean-600 hover:text-ocean-700 font-medium transition-colors duration-200"
                    >
                      {contactEmail}
                    </a>
                  </p>
                )}
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
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="solarpunk-social-link" title="Email">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </a>
            )}
            {socialLinks?.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="solarpunk-social-link" title="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {socialLinks?.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="solarpunk-social-link" title="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {socialLinks?.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="solarpunk-social-link" title="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
            {socialLinks?.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="solarpunk-social-link" title="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            )}
            {/* Fallback to Pack 1703 social links if no branding */}
            {isPack1703 && !socialLinks && (
              <>
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
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </>
            )}
            {/* Always show Scouting America link */}
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
