import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { Menu, X } from 'lucide-react';

const AdminNav: React.FC = () => {
  const { state, logout } = useAdmin();
  const { currentUser } = state;
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prioritize most important admin functions
  const primaryNavItems = [
    { path: '/admin', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/events', label: 'Events', icon: '📅' },
    { path: '/admin/locations', label: 'Locations', icon: '📍' },
    { path: '/admin/announcements', label: 'News', icon: '📢' },
  ];

  const secondaryNavItems = [
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
    <div className="bg-white shadow-sm border-b border-gray-200 w-full">
      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Title and primary nav */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            </div>
            
            {/* Primary navigation - most important items */}
            <div className="hidden md:flex space-x-1">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* More menu button for secondary items */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Menu className="w-4 h-4 mr-1" />
                More
              </button>
            </div>

            {/* Mobile hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">{currentUser.role || 'content-admin'}</div>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown menu for secondary items */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[...primaryNavItems, ...secondaryNavItems].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
