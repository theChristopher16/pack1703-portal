import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { Menu, X, ChevronDown } from 'lucide-react';

const AdminNav: React.FC = () => {
  const { state, logout } = useAdmin();
  const { currentUser } = state;
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prioritize most important admin functions - limit to 6 for desktop
  const primaryNavItems = [
    { path: '/admin', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/ai', label: 'Solyn', icon: '🤖' },
    { path: '/admin/events', label: 'Events', icon: '📅' },
    { path: '/admin/locations', label: 'Locations', icon: '📍' },
    { path: '/admin/announcements', label: 'News', icon: '📢' },
    { path: '/admin/chat', label: 'Chat', icon: '💬' },
  ];

  const secondaryNavItems = [
    { path: '/admin/fundraising', label: 'Fundraising', icon: '🎯' },
    { path: '/admin/finances', label: 'Finances', icon: '💰' },
    { path: '/admin/multi-tenant', label: 'Multi-Tenant', icon: '🏢' },
    { path: '/admin/lists', label: 'Lists', icon: '📋' },
    { path: '/admin/volunteer', label: 'Volunteer', icon: '🤝' },
    { path: '/admin/seasons', label: 'Seasons', icon: '🌱' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  if (!currentUser) {
    return null;
  }

  return (
    <div className="bg-white shadow-lg border-b border-gray-200 w-full">
      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Title and primary nav */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
            
            {/* Primary navigation - limited to 6 items for desktop */}
            <div className="hidden lg:flex items-center space-x-1 flex-1 min-w-0 overflow-x-auto">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-shrink-0 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="xl:hidden">{item.label}</span>
                </Link>
              ))}
              
              {/* More dropdown for secondary items */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm rounded-md transition-all duration-200"
                >
                  <Menu className="w-4 h-4 mr-1" />
                  <span className="hidden xl:inline">More</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl border border-gray-200 z-[99999] transform opacity-100 scale-100 transition-all duration-200">
                    <div className="py-1">
                      {secondaryNavItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                            location.pathname === item.path ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <span className="mr-3">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medium screen navigation - show fewer items */}
            <div className="hidden md:flex lg:hidden items-center space-x-1 overflow-x-auto">
              {primaryNavItems.slice(0, 4).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-shrink-0 inline-flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              ))}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex-shrink-0 inline-flex items-center px-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm rounded-md transition-all duration-200"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">{currentUser.role || 'content-admin'}</div>
            </div>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-md text-sm hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white shadow-lg md:hidden">
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {[...primaryNavItems, ...secondaryNavItems].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNav;
