import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, FileText, Users, ArrowRight, Compass, MessageSquare, Download, BarChart3, Shield, MessageCircle, CreditCard, UserPlus } from 'lucide-react';
import { LoadingSpinner, SkeletonLoader } from '../components/Loading';
import { SecurityAuditService } from '../services/securityAuditService';
import { authService, UserRole } from '../services/authService';
import { heroButtonService, HeroButtonConfig } from '../services/heroButtonService';
import { usageTrackingService } from '../services/usageTrackingService';
import { useAdmin } from '../contexts/AdminContext';
import SignupModal from '../components/Auth/SignupModal';

const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [isDownloadingAudit, setIsDownloadingAudit] = useState(false);
  const [animationsTriggered, setAnimationsTriggered] = useState(false);
  const [heroButtons, setHeroButtons] = useState<HeroButtonConfig[]>([]);
  const [showSignupModal, setShowSignupModal] = useState(false);
  
  // Use AdminContext instead of direct auth service
  const { state: adminState } = useAdmin();
  const currentUser = adminState.currentUser;
  const userRole = currentUser ? (currentUser.role as UserRole) : UserRole.ANONYMOUS;

  useEffect(() => {
    // Remove artificial loading delays for better performance
    setIsLoading(false);
    setContentLoaded(true);
    
    // Trigger animations only once after initial load
    const timer = setTimeout(() => {
      setAnimationsTriggered(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Load hero buttons when user changes (via AdminContext)
  useEffect(() => {
    if (currentUser) {
      // Load personalized hero buttons for authenticated users
      loadHeroButtons(currentUser.uid, userRole);
    } else {
      // For anonymous users, use default buttons without analytics
      setHeroButtons([
        {
          name: 'Events',
          href: '/events',
          icon: 'Calendar',
          description: 'View upcoming pack events',
          color: 'blue',
          priority: 1
        },
        {
          name: 'Locations',
          href: '/locations',
          icon: 'MapPin',
          description: 'Find meeting locations',
          color: 'green',
          priority: 2
        }
      ]);
    }
  }, [currentUser, userRole]);

  // Track homepage visit
  useEffect(() => {
    if (currentUser) {
      usageTrackingService.trackComponentUsage('homepage', 'Homepage', '/');
    }
  }, [currentUser]);

  const loadHeroButtons = async (userId: string, role: UserRole) => {
    try {
      const buttons = await heroButtonService.getHeroButtons(userId, role);
      setHeroButtons(buttons);
    } catch (error) {
      console.error('Error loading hero buttons:', error);
      // Fallback to default buttons
      const fallbackButtons = await heroButtonService.getHeroButtons('anonymous', UserRole.ANONYMOUS);
      setHeroButtons(fallbackButtons);
    }
  };

  // Track hero button clicks for analytics
  const trackHeroButtonClick = async (buttonConfig: HeroButtonConfig) => {
    try {
      const componentId = buttonConfig.href.replace('/', '') || 'homepage';
      await usageTrackingService.trackComponentUsage(
        componentId, 
        buttonConfig.name, 
        buttonConfig.href
      );
    } catch (error) {
      console.error('Error tracking hero button click:', error);
    }
  };

  // Map icon names to actual icon components
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Calendar,
      MapPin,
      MessageSquare,
      Users,
      MessageCircle,
      FileText,
      BarChart3,
      Shield
    };
    return iconMap[iconName] || Calendar; // Default to Calendar if icon not found
  };

  const handleDownloadAudit = async () => {
    try {
      setIsDownloadingAudit(true);
      await SecurityAuditService.downloadAuditReport();
    } catch (error) {
      console.error('Error downloading audit:', error);
      alert('Failed to download audit report. Please try again.');
    } finally {
      setIsDownloadingAudit(false);
    }
  };

  // Get available components for the current user's role
  const quickActions = heroButtonService.getAvailableComponents(userRole).map((config, index) => ({
    name: config.name,
    description: config.description,
    href: config.href,
    icon: getIconComponent(config.icon),
    color: config.color,
    delay: `animate-delay-${(index + 1) * 100}`
  }));

  const scoutingFeatures = [
    {
      emoji: '🏕️',
      title: 'Solarpunk Spirit',
      description: 'Embracing sustainable technology and nature connection for the next generation of scouts.',
      color: 'text-primary-500',
      bgColor: 'bg-primary-50'
    },
    {
      emoji: '🌊',
      title: 'Adventure Awaits',
      description: 'From bayou explorations to stargazing nights, every event is an opportunity for discovery.',
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50'
    },
    {
      emoji: '🤝',
      title: 'Leader-Agnostic System',
      description: 'Our smart system handles the heavy lifting of organization and coordination, making leadership transitions seamless and supporting busy families who can\'t attend every meeting.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      emoji: '🌟',
      title: 'Inclusive Community',
      description: 'Every family is welcome regardless of experience level. We believe every child deserves the adventure of scouting. Open to girls and boys.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const techFeatures = [
    {
      emoji: '📱',
      title: 'Easy to Use',
      description: 'Simple, intuitive interface that works on phones, tablets, and computers. No tech expertise required.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      emoji: '🔒',
      title: 'Family Privacy',
      description: 'Your family\'s information stays private and secure. We use the same security standards as major banks - you can even download your own audit!',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      emoji: '⚡',
      title: 'Real-Time Updates',
      description: 'Get instant notifications about events, weather changes, and important updates. Never miss a thing.',
      color: 'text-accent-500',
      bgColor: 'bg-accent-50'
    },
    {
      emoji: '📊',
      title: 'Smart Organization',
      description: 'Our system automatically organizes events, tracks RSVPs, and manages volunteer needs so leaders can focus on the kids.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner
              size="xl"
              text="Loading Pack Portal..."
              variant="primary"
              className="mb-8"
            />
            <p className="text-gray-600 text-lg animate-pulse">
              Getting everything ready for you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section with Enhanced Solar-Punk Aesthetic */}
        <div className="text-center mb-20 relative overflow-hidden">
          {/* Simplified Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary-200/20 to-transparent rounded-full"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-secondary-200/20 to-transparent rounded-full"></div>
            <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-br from-accent-200/20 to-transparent rounded-full"></div>
          </div>

          {/* Main Hero Content */}
          <div className="relative z-10">
            <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium mb-6 ${animationsTriggered ? "animate-fade-in" : ""}`}>
              <span className="text-2xl mr-2">🏕️</span>
              Welcome to the Future of Scouting
            </div>
            
            <h1 className={`text-5xl md:text-7xl font-display font-bold mb-6 ${animationsTriggered ? "animate-slide-up" : ""}`}>
              <span className="text-gradient">Scout</span>
              <br />
              <span className="text-gray-900">Families Portal</span>
            </h1>
            
            <p className={`text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed ${animationsTriggered ? "animate-slide-up" : ""}`} style={{ animationDelay: '200ms' }}>
              Where technology meets tradition, and every family becomes part of an 
              <span className="text-gradient font-semibold"> adventure</span> that shapes the future.
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center ${animationsTriggered ? "animate-slide-up" : ""}`} 
                 style={{ animationDelay: '400ms' }}>
              {heroButtons.length >= 2 ? (
                <>
                  <Link
                    to={heroButtons[0].href}
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-lg rounded-2xl shadow-glow-primary hover:shadow-glow-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-0 focus:outline-none focus:ring-4 focus:ring-primary-300/50"
                    onClick={() => trackHeroButtonClick(heroButtons[0])}
                  >
                    {React.createElement(getIconComponent(heroButtons[0].icon), { 
                      className: "w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" 
                    })}
                    {heroButtons[0].name}
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                  
                  <Link
                    to={heroButtons[1].href}
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-white/90 backdrop-blur-sm border-2 border-primary-300 text-primary-600 hover:bg-primary-50 hover:border-primary-400 font-semibold text-lg rounded-2xl shadow-soft hover:shadow-glow-primary/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300/50"
                    onClick={() => trackHeroButtonClick(heroButtons[1])}
                  >
                    {React.createElement(getIconComponent(heroButtons[1].icon), { 
                      className: "w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-200" 
                    })}
                    {heroButtons[1].name}
                  </Link>
                </>
              ) : (
                // Fallback buttons while loading
                <>
                  <Link
                    to="/events"
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-lg rounded-2xl shadow-glow-primary hover:shadow-glow-primary/80 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-0 focus:outline-none focus:ring-4 focus:ring-primary-300/50"
                  >
                    <Calendar className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                    Explore Events
                    <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                  
                  <Link
                    to="/locations"
                    className="group relative inline-flex items-center justify-center px-8 py-4 bg-white/90 backdrop-blur-sm border-2 border-primary-300 text-primary-600 hover:bg-primary-50 hover:border-primary-400 font-semibold text-lg rounded-2xl shadow-soft hover:shadow-glow-primary/50 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300/50"
                  >
                    <Compass className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-200" />
                    Discover Locations
                  </Link>
                  
                  {/* Sign Up Button for Anonymous Users */}
                  {userRole === UserRole.ANONYMOUS && (
                    <button
                      onClick={() => setShowSignupModal(true)}
                      className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-semibold text-lg rounded-2xl shadow-glow-secondary hover:shadow-glow-secondary/80 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-0 focus:outline-none focus:ring-4 focus:ring-secondary-300/50"
                    >
                      <UserPlus className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                      Join Pack 1703
                      <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Register Buttons Section */}
        <div className="mb-20">
          <div className={`text-center mb-12 ${animationsTriggered ? "animate-fade-in" : ""}`}>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
              <span className="text-gradient">Join Pack 1703</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ready to start your scouting adventure? Register with our pack and pay your dues to get started!
            </p>
          </div>

          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center max-w-4xl mx-auto ${animationsTriggered ? "animate-slide-up" : ""}`} 
               style={{ animationDelay: '200ms' }}>
            
            {/* Pay Dues Button */}
            <a
              href="https://square.link/u/E3afCrTJ"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg rounded-2xl shadow-glow-green hover:shadow-glow-green/80 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-0 focus:outline-none focus:ring-4 focus:ring-green-300/50 w-full sm:w-auto"
            >
              <CreditCard className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
              Pay Annual Dues
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
            
            {/* Register with Scouting America Button */}
            <a
              href="https://my.scouting.org/VES/OnlineReg/1.0.0/?tu=UF-MB-576paa1703"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-lg rounded-2xl shadow-glow-blue hover:shadow-glow-blue/80 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-0 focus:outline-none focus:ring-4 focus:ring-blue-300/50 w-full sm:w-auto"
            >
              <UserPlus className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
              Register with Scouting America
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>

          {/* Additional Info */}
          <div className={`mt-8 text-center ${animationsTriggered ? "animate-fade-in" : ""}`} 
               style={{ animationDelay: '400ms' }}>
            <p className="text-sm text-gray-500 max-w-3xl mx-auto">
              <strong>Pack Dues:</strong> $195 per scout (includes handbook, neckerchief, and pack activities) • 
              <strong>Scouting America Registration:</strong> Required for all scouts to participate in official scouting activities • 
              <strong>Lion Scouts:</strong> Pack dues are waived for Lion scouts (kindergarten age)
            </p>
          </div>
        </div>

        {/* Quick Actions with Enhanced Cards */}
        <div className="mb-20">
          <h2 className={`text-4xl font-display font-bold text-gray-900 mb-12 text-center ${animationsTriggered ? "animate-fade-in" : ""}`}>
            <span className="text-gradient">Quick Actions</span>
          </h2>

          {!contentLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonLoader key={index} type="card" lines={2} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    to={action.href}
                    className={`group block ${animationsTriggered ? "animate-scale-in" : ""}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="card-hover bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/50 overflow-hidden relative">
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 ${action.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className={`w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow mx-auto`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-display font-semibold text-gray-900 mb-3 group-hover:text-gradient transition-all duration-300 text-center">
                          {action.name}
                        </h3>
                        
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 text-center">
                          {action.description}
                        </p>
                        
                        <div className="flex items-center justify-center text-primary-500 font-medium text-sm group-hover:text-primary-600 transition-colors duration-200">
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Scouting Features Section */}
        <div className="mb-20">
          <h2 className={`text-4xl font-display font-bold text-gray-900 mb-12 text-center ${animationsTriggered ? "animate-fade-in" : ""}`}>
            Why Choose <span className="text-gradient">Our Scout Pack</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto text-center mb-12 leading-relaxed">
            We're not just another scout pack. We're a community that believes every family deserves 
            amazing adventures, regardless of their schedule or experience level.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {scoutingFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`text-center ${animationsTriggered ? "animate-fade-in" : ""}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow mx-auto mb-6">
                  <span className="text-white" style={{ fontSize: '24px' }}>{feature.emoji}</span>
                </div>
                
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Features Section */}
        <div className="mb-20">
          <h2 className={`text-4xl font-display font-bold text-gray-900 mb-12 text-center ${animationsTriggered ? "animate-fade-in" : ""}`}>
            How Our <span className="text-gradient">System Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto text-center mb-12 leading-relaxed">
            We've built a smart system that takes care of the complicated stuff so you can focus on 
            what matters most - spending time with your family and having fun adventures.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {techFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className={`text-center ${animationsTriggered ? "animate-fade-in" : ""}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-purple-500 rounded-xl flex items-center justify-center shadow-glow mx-auto mb-6">
                  <span className="text-white" style={{ fontSize: '24px' }}>{feature.emoji}</span>
                </div>
                
                <h3 className="text-xl font-display font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Download Audit Button for Family Privacy */}
                {feature.title === 'Family Privacy' && (
                  <button
                    onClick={handleDownloadAudit}
                    disabled={isDownloadingAudit}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-xl shadow-soft hover:shadow-glow-green transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloadingAudit ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Audit
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section with Enhanced Visual Appeal */}
        <div className={`text-center ${animationsTriggered ? "animate-fade-in" : ""}`} style={{ animationDelay: '600ms' }}>
          <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-3xl p-12 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
            
            {/* Floating Elements */}
            <div className="absolute top-8 left-8 w-16 h-16 bg-white/20 rounded-full animate-float"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-white/20 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-display font-bold text-white mb-4">
                Ready to Start Your Adventure?
              </h3>
              
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Join our community of forward-thinking families who believe in the power of 
                technology, nature, and community to shape the next generation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  to="/events"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 hover:bg-gray-50 font-semibold text-lg rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-glow border-0 focus:outline-none focus:ring-4 focus:ring-white/50"
                >
                  <Calendar className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                  Explore Events
                </Link>
                
                <Link
                  to="/feedback"
                  className="group relative inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white hover:bg-white/10 font-semibold text-lg rounded-2xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-white/50"
                >
                  <MessageSquare className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                  Share Feedback
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={(user) => {
          console.log('Signup successful:', user);
          setShowSignupModal(false);
          // The user will be automatically logged in and the page will update
        }}
      />
    </div>
  );
};

export default HomePage;
