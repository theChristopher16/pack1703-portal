import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, MapPin, FileText, Users, MessageSquare } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const quickLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Locations', href: '/locations', icon: MapPin },
    { name: 'Resources', href: '/resources', icon: FileText },
    { name: 'Volunteer', href: '/volunteer', icon: Users },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-display font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-display font-bold text-text mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Oops! The page you're looking for doesn't exist.
            It might have been moved or you might have typed the wrong URL.
          </p>
        </div>

        <div className="mb-8">
          <Link
            to="/"
            className="btn-primary text-lg px-8 py-3"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-display font-semibold text-text mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-soft transition-all duration-200 group"
                >
                  <Icon className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm font-medium text-text group-hover:text-primary transition-colors duration-200">
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
