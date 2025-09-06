import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Calendar, MapPin, FileText, Users, MessageSquare, MessageCircle, ChevronDown, BarChart3, Settings, Shield, DollarSign, UserPlus, Cog } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { usePackNameConfig, useContactConfigs } from '../../hooks/useConfig';
import { useAdmin } from '../../contexts/AdminContext';
import OfflineBanner from './OfflineBanner';
import PWAInstallPrompt from '../PWAInstallPrompt/PWAInstallPrompt';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize analytics
  useAnalytics();
  
  // Load configuration values
  const { value: packName } = usePackNameConfig();
  const { primaryEmail, supportEmail, loading: contactLoading } = useContactConfigs();
  
  // Get admin context for role-based navigation
  const { state: adminState } = useAdmin();
  const isAdmin = adminState.currentUser?.role === 'super-admin' || adminState.currentUser?.role === 'root';
  const isRoot = adminState.currentUser?.role === 'root';

  // Debug navigation issues
  useEffect(() => {
    // console.log('Navigation changed to:', location.pathname);
  }, [location.pathname]);

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

  // TODO: Future analytics-based ordering
  // const getNavigationOrder = async () => {
  //   // This would fetch analytics data and return ordered navigation
  //   // const pageViews = await fetchPageViewAnalytics();
  //   // return navigation.sort((a, b) => pageViews[b.href] - pageViews[a.href]);
  // };

  // Navigation ordered by expected usage frequency for a scouting pack
  // Based on typical family priorities: communication, events, info, participation
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Chat', href: '/chat', icon: MessageCircle }, // Communication is key
    { name: 'Events', href: '/events', icon: Calendar }, // Events are crucial for families
    { name: 'Announcements', href: '/announcements', icon: MessageSquare }, // Important updates
    { name: 'Locations', href: '/locations', icon: MapPin }, // Where to go
    { name: 'Resources', href: '/resources', icon: FileText }, // Reference materials
    { name: 'Volunteer', href: '/volunteer', icon: Users }, // Participation
    { name: 'Feedback', href: '/feedback', icon: MessageSquare }, // Input
    { name: 'Analytics', href: '/analytics', icon: BarChart3 }, // Admin/advanced
  ];

  // Admin-specific navigation items
  const adminNavigation = [
    { name: 'User Management', href: '/admin/users', icon: UserPlus, roles: ['super-admin', 'root'] },
    { name: 'Cost Management', href: '/admin/cost-management', icon: DollarSign, roles: ['super-admin', 'root'] },
    { name: 'Event Management', href: '/admin/events', icon: Calendar, roles: ['super-admin', 'root'] },
    { name: 'System Settings', href: '/admin/settings', icon: Cog, roles: ['root'] },
  ];

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
              <div className="hidden sm:block">
                <h1 className="text-xl font-display font-bold text-gradient">
                  {packName}
                </h1>
                <p className="text-xs text-gray-600">Families Portal</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      // console.log('Main toolbar navigation clicked:', item.href);
                      handleNavigation(item.href);
                    }}
                    className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 group relative overflow-hidden ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50 shadow-soft'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
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
              {navigation.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      // console.log('Medium toolbar navigation clicked:', item.href);
                      handleNavigation(item.href);
                    }}
                    className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 group relative overflow-hidden ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50 shadow-soft'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
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
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-300"
                >
                  <span className="text-sm">More</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div 
                    className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-soft border border-white/50 z-50"
                    onMouseLeave={() => {
                      console.log('Mouse left dropdown, closing');
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="py-2">
                      {navigation.slice(5).map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // console.log('Dropdown navigation clicked:', item.href);
                              handleNavigation(item.href);
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                              isActive(item.href)
                                ? 'text-primary-600 bg-primary-50'
                                : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                      
                      {/* Admin Navigation Items */}
                      {isAdmin && (
                        <>
                          <div className="border-t border-gray-200 mt-2 pt-2">
                            <div className="px-4 py-2">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin</span>
                            </div>
                            {adminNavigation
                              .filter(item => !item.roles || (adminState.currentUser?.role && item.roles.includes(adminState.currentUser.role)))
                              .map((item) => {
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={item.name}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleNavigation(item.href);
                                    }}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                                      isActive(item.href)
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                  </button>
                                );
                              })}
                          </div>
                        </>
                      )}
                      
                      {/* Admin Link */}
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // console.log('Admin navigation clicked');
                            handleNavigation('/admin');
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive('/admin')
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                          }`}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Admin Portal</span>
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
                className="p-2 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-300"
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
              {navigation.map((item) => {
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
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              
              {/* Admin Link */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => {
                    handleNavigation('/admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                    isActive('/admin')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Admin Portal</span>
                </button>
              </div>
              
              {/* Admin Navigation Items for Mobile */}
              {isAdmin && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="px-3 py-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin</span>
                  </div>
                  {adminNavigation
                    .filter(item => !item.roles || (adminState.currentUser?.role && item.roles.includes(adminState.currentUser.role)))
                    .map((item) => {
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
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Contact Us</h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-medium">{packName}</p>
                <p>Houston, TX</p>
                <p>Email: <a href="mailto:cubmaster@sfpack1703.com" className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200">cubmaster@sfpack1703.com</a></p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                {navigation.slice(0, 4).map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className="block text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Resources</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigation('/resources')}
                  className="block text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  Pack Resources
                </button>
                <button
                  onClick={() => handleNavigation('/feedback')}
                  className="block text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  Feedback
                </button>
                <button
                  onClick={() => handleNavigation('/privacy')}
                  className="block text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  Privacy Policy
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>&copy; 2024 {packName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default Layout;
