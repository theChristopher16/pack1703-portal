import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
}

const AdminNav: React.FC = () => {
  const { state } = useAdmin();
  const { currentUser } = state;
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Add debug message function
  const addDebugMessage = (message: string) => {
    console.log(message);
    setDebugMessages(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Keyboard event handler for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setDropdownOpen(!dropdownOpen);
    } else if (event.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      
      // Don't close if clicking on navigation items or dropdown content
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Check if the click is on a navigation link
        const isNavLink = target instanceof Element && (
          target.closest('a[href]') || 
          target.closest('[role="button"]') ||
          target.closest('button')
        );
        
        if (!isNavLink) {
          console.log('Click outside detected, closing dropdown');
          setDropdownOpen(false);
        }
      }
    };

    if (dropdownOpen) {
      // Use a small delay to prevent immediate closing on navigation clicks
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prioritize most important admin functions - limit to 5 items for desktop to prevent overflow
  const primaryNavItems: NavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/ai', label: 'Solyn', icon: '🤖' },
    { path: '/admin/events', label: 'Events', icon: '📅' },
    { path: '/admin/announcements', label: 'News', icon: '📢' },
    { path: '/admin/chat', label: 'Chat', icon: '💬' },
  ];

  // Add SOC Console for root users only
  const socNavItem: NavItem = { path: '/admin/soc', label: 'SOC Console', icon: '🖥️' };
  
  // Show SOC Console in primary nav for root users (but limit to 5 total)
  const navItems = currentUser?.role === 'root' 
    ? [primaryNavItems[0], primaryNavItems[1], primaryNavItems[2], primaryNavItems[3], primaryNavItems[4], socNavItem] // Dashboard, Solyn, Events, News, Chat, SOC Console
    : primaryNavItems;

  const secondaryNavItems: NavItem[] = [
    { path: '/admin/locations', label: 'Locations', icon: '📍' },
    { path: '/admin/fundraising', label: 'Fundraising', icon: '🎯' },
    { path: '/admin/finances', label: 'Finances', icon: '💰' },
    { path: '/admin/cost-management', label: 'Cost Management', icon: '📊', roles: ['admin', 'root'] },
    { path: '/admin/multi-tenant', label: 'Multi-Tenant', icon: '🏢' },
    { path: '/admin/lists', label: 'Lists', icon: '📋' },
    { path: '/admin/volunteer', label: 'Volunteer', icon: '🤝' },
    { path: '/admin/seasons', label: 'Seasons', icon: '🌱' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div>
      {/* Debug Panel - Only show on mobile or when debugging */}
      {debugMessages.length > 0 && (
        <div className="bg-yellow-100 border-b border-yellow-300 p-2 text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <strong>Debug:</strong> {debugMessages.join(' | ')}
          </div>
        </div>
      )}
      
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/admin" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">Admin Portal</span>
            </Link>
          </div>
          
          {/* Primary navigation - limited to 5 items for desktop */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 min-w-0">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addDebugMessage(`Nav clicked: ${item.label} (${item.path})`);
                  // Force navigation
                  window.location.href = item.path;
                }}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('More button clicked, current state:', dropdownOpen);
                  setDropdownOpen(!dropdownOpen);
                }}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm rounded-md transition-all duration-200 border border-gray-200"
              >
                <Menu className="w-4 h-4 mr-1" />
                <span className="hidden xl:inline">More</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-xl border border-gray-200 z-50">
                  <div className="py-1">
                    {secondaryNavItems
                      .filter(item => !item.roles || (currentUser?.role && item.roles.includes(currentUser.role)))
                      .map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addDebugMessage(`Dropdown clicked: ${item.label} (${item.path})`);
                          setDropdownOpen(false);
                          // Force navigation
                          window.location.href = item.path;
                        }}
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

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {dropdownOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addDebugMessage(`Mobile nav clicked: ${item.label} (${item.path})`);
                    setDropdownOpen(false);
                    // Force navigation
                    window.location.href = item.path;
                  }}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              {/* Mobile secondary items */}
              {secondaryNavItems
                .filter(item => !item.roles || (currentUser?.role && item.roles.includes(currentUser.role)))
                .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addDebugMessage(`Mobile secondary clicked: ${item.label} (${item.path})`);
                    setDropdownOpen(false);
                    // Force navigation
                    window.location.href = item.path;
                  }}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
    </div>
  );
};

export default AdminNav;
