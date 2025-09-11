import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, MapPin, FileText, Users, MessageSquare, Quote } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const [randomQuote, setRandomQuote] = useState<{ text: string; author: string } | null>(null);

  // Inspiring scouting quotes
  const scoutingQuotes = [
    { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
    { text: "Be Prepared... the meaning of the motto is that a scout must prepare himself by previous thinking out and practicing how to act on any accident or emergency so that he is never taken by surprise.", author: "Robert Baden-Powell" },
    { text: "Leave this world a little better than you found it.", author: "Robert Baden-Powell" },
    { text: "A scout is never taken by surprise; he knows exactly what to do when anything unexpected happens.", author: "Robert Baden-Powell" },
    { text: "The most important single ingredient in the formula of success is knowing how to get along with people.", author: "Theodore Roosevelt" },
    { text: "The real way to get happiness is by giving out happiness to other people.", author: "Robert Baden-Powell" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Character is doing the right thing when nobody's looking.", author: "J.C. Watts" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
    { text: "A scout smiles and whistles under all circumstances.", author: "Robert Baden-Powell" },
    { text: "The purpose of life is not to be happy. It is to be useful, to be honorable, to be compassionate, to have it make some difference that you have lived and lived well.", author: "Ralph Waldo Emerson" },
    { text: "The best preparation for tomorrow is doing your best today.", author: "H. Jackson Brown Jr." },
    { text: "Leadership and learning are indispensable to each other.", author: "John F. Kennedy" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
  ];

  useEffect(() => {
    // Pick a random quote when component mounts
    const randomIndex = Math.floor(Math.random() * scoutingQuotes.length);
    setRandomQuote(scoutingQuotes[randomIndex]);
  }, []);

  const quickLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Locations', href: '/locations', icon: MapPin },
    { name: 'Resources', href: '/resources', icon: FileText },
    { name: 'Volunteer', href: '/volunteer', icon: Users },
    { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Oops! The page you're looking for doesn't exist.
            It might have been moved or you might have typed the wrong URL.
          </p>
          
          {/* Inspiring Quote */}
          {randomQuote && (
            <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-white/50 shadow-soft">
              <div className="flex items-start space-x-3">
                <Quote className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <blockquote className="text-lg text-gray-800 italic mb-2">
                    "{randomQuote.text}"
                  </blockquote>
                  <cite className="text-sm text-blue-600 font-medium">
                    — {randomQuote.author}
                  </cite>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 shadow-soft hover:shadow-lg transform hover:scale-[1.02] text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className="flex flex-col items-center p-4 bg-white/95 backdrop-blur-md rounded-xl border border-white/50 shadow-soft hover:shadow-lg transition-all duration-200 group"
                >
                  <Icon className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
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
