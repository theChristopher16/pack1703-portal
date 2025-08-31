import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Calendar, MapPin, FileText, Users, MessageSquare, MessageCircle, Sparkles, ChevronDown, BarChart3, Settings } from 'lucide-react';
import { LoadingSpinner } from '../Loading';
import { useAnalytics } from '../../hooks/useAnalytics';
import { usePackNameConfig, useContactConfigs } from '../../hooks/useConfig';
import OfflineBanner from './OfflineBanner';
import PWAInstallPrompt from '../PWAInstallPrompt/PWAInstallPrompt';
import CyclingScoutIcon from '../ui/CyclingScoutIcon';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const location = useLocation();
  
  // Initialize analytics
  useAnalytics();
  
  // Load configuration values
  const { value: packName } = usePackNameConfig();
  const { primaryEmail, supportEmail, loading: contactLoading } = useContactConfigs();

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

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
                <CyclingScoutIcon size={24} interval={2000} className="text-white" />
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
              {navigation.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
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
                  </Link>
                );
              })}
            </nav>

            {/* Medium Screen Navigation (shorter names) */}
            <nav className="hidden md:flex lg:hidden items-center space-x-1">
              {navigation.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-xl font-medium transition-all duration-300 group relative overflow-hidden ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50 shadow-soft'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{item.name}</span>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-100/50 to-secondary-100/50 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 rounded-xl"></div>
                  </Link>
                );
              })}
            </nav>

            {/* More Dropdown for Additional Navigation Items */}
            <div className="hidden md:flex items-center">
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-xl font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50/50 transition-all duration-300">
                  <span className="text-sm">More</span>
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-soft border border-white/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                  <div className="py-2">
                    {navigation.slice(4).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive(item.href)
                              ? 'text-primary-600 bg-primary-50'
                              : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                    
                    {/* Admin Link */}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <Link
                        to="/admin"
                        className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          isActive('/admin')
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Admin Portal</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:text-primary-600 hover:bg-primary-50/50 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-slide-down">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Admin Link */}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive('/admin')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50/50'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Admin Portal</span>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content with Enhanced Loading */}
      <main className="flex-1">
        {isPageLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner
                size="lg"
                text="Loading..."
                variant="primary"
                className="mb-4"
              />
              <div className="flex items-center justify-center space-x-2 text-primary-500">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Enhanced Footer with Solar-Punk Elements */}
      <footer className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-5"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-500/10 rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-secondary-500/10 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand Section */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-gradient">
                      Pack 1703
                    </h3>
                    <p className="text-gray-300 text-sm">Families Portal</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                  Where technology meets tradition, and every family becomes part of an adventure 
                  that shapes the future. Join our community of forward-thinking scouts.
                </p>
                
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-xl flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer">
                    <span className="text-white font-bold text-sm">I</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-display font-semibold text-primary-400 mb-4">
                  Quick Links
                </h3>
                <ul className="space-y-3">
                  {navigation.slice(1).map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm flex items-center space-x-2 group"
                      >
                        <span className="w-1 h-1 bg-primary-400 rounded-full group-hover:scale-150 transition-transform duration-200"></span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      to="/privacy"
                      className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm flex items-center space-x-2 group"
                    >
                      <span className="w-1 h-1 bg-primary-400 rounded-full group-hover:scale-150 transition-transform duration-200"></span>
                      <span>Privacy Policy</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact & Support */}
              <div>
                <h3 className="text-lg font-display font-semibold text-primary-400 mb-4">
                  Get Support
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/feedback"
                      className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm flex items-center space-x-2 group"
                    >
                      <span className="w-1 h-1 bg-primary-400 rounded-full group-hover:scale-150 transition-transform duration-200"></span>
                      <span>Send Feedback</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/volunteer"
                      className="text-gray-300 hover:text-primary-400 transition-colors duration-200 text-sm flex items-center space-x-2 group"
                    >
                      <span className="w-1 h-1 bg-primary-400 rounded-full group-hover:scale-150 transition-transform duration-200"></span>
                      <span>Volunteer</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-700 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm text-center md:text-left">
                  © 2025 {packName}. All rights reserved. Built with ❤️ and ☀️ for the future.
                </p>
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400 text-sm">Solar-Punk Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <OfflineBanner />
      <PWAInstallPrompt />
    </div>
  );
};

export default Layout;
