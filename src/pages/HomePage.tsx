import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, FileText, Users, ArrowRight, Compass, MessageSquare, Download, BarChart3, Shield, MessageCircle, CreditCard, UserPlus, Leaf, Sun, Mountain, Waves } from 'lucide-react';
import { LoadingSpinner, SkeletonLoader } from '../components/Loading';
import { dataAuditService } from '../services/dataAuditService';
import { authService, UserRole } from '../services/authService';
import { heroButtonService, HeroButtonConfig } from '../services/heroButtonService';
import { usageTrackingService } from '../services/usageTrackingService';
import { useAdmin } from '../contexts/AdminContext';
import AccountRequestModal from '../components/Auth/AccountRequestModal';
import { useUserInteraction } from '../hooks/useUserInteraction';

const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [isDownloadingAudit, setIsDownloadingAudit] = useState(false);
  const [animationsTriggered, setAnimationsTriggered] = useState(false);
  const [heroButtons, setHeroButtons] = useState<HeroButtonConfig[]>([]);
  const [showAccountRequestModal, setShowAccountRequestModal] = useState(false);
  
  // Use AdminContext instead of direct auth service
  const { state: adminState } = useAdmin();
  const currentUser = adminState.currentUser;
  const userRole = currentUser ? (currentUser.role as UserRole) : null;

  // Initialize user interaction tracking for this page
  const { trackUserAction } = useUserInteraction({
    componentName: 'HomePage',
    componentPath: '/',
    trackComponentView: true
  });

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
    if (currentUser && userRole) {
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
      const fallbackButtons = await heroButtonService.getHeroButtons('parent', UserRole.PARENT);
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
      Shield,
      Leaf,
      Sun,
      Mountain,
      Waves
    };
    return iconMap[iconName] || Calendar; // Default to Calendar if icon not found
  };

  const handleDownloadAudit = async () => {
    try {
      setIsDownloadingAudit(true);
      
      // Check if user is logged in
      if (currentUser) {
        // Use user-specific data audit
        const jsonData = await dataAuditService.exportUserDataAsJSON();
        
        // Create and download file
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `my-data-audit-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Use public data audit for non-logged-in users
        const jsonData = await dataAuditService.exportPublicDataAsJSON();
        
        // Create and download file
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `public-data-audit-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading audit:', error);
      alert('Failed to download audit report. Please try again.');
    } finally {
      setIsDownloadingAudit(false);
    }
  };

  // Get available components for the current user's role
  const quickActions = userRole ? heroButtonService.getAvailableComponents(userRole).map((config, index) => ({
    name: config.name,
    description: config.description,
    href: config.href,
    icon: getIconComponent(config.icon),
    color: config.color,
    delay: `animate-delay-${(index + 1) * 100}`
  })) : [];

  const solarpunkFeatures = [
    {
      emoji: '🌱',
      title: 'Sustainable Future',
      description: 'Building tomorrow\'s leaders through eco-conscious adventures and renewable energy education.',
      color: 'text-forest-600',
      bgColor: 'bg-forest-50',
      icon: Leaf
    },
    {
      emoji: '☀️',
      title: 'Solar-Powered Adventures',
      description: 'Harnessing the power of the sun for camping, hiking, and outdoor exploration activities.',
      color: 'text-solar-600',
      bgColor: 'bg-solar-50',
      icon: Sun
    },
    {
      emoji: '🏔️',
      title: 'Nature Connection',
      description: 'Deep wilderness experiences that teach respect for our planet and sustainable living practices.',
      color: 'text-earth-600',
      bgColor: 'bg-earth-50',
      icon: Mountain
    },
    {
      emoji: '🌊',
      title: 'Water Wisdom',
      description: 'Learning about water conservation, marine ecosystems, and the importance of clean waterways.',
      color: 'text-ocean-600',
      bgColor: 'bg-ocean-50',
      icon: Waves
    }
  ];

  const techFeatures = [
    {
      emoji: '📱',
      title: 'Smart Technology',
      description: 'Using cutting-edge tools to enhance outdoor experiences while staying connected to nature.',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50'
    },
    {
      emoji: '🔒',
      title: 'Privacy First',
      description: 'Your family\'s data stays secure with transparent privacy practices and downloadable audits.',
      color: 'text-forest-600',
      bgColor: 'bg-forest-50'
    },
    {
      emoji: '⚡',
      title: 'Real-Time Updates',
      description: 'Instant notifications about weather changes, event updates, and emergency communications.',
      color: 'text-solar-600',
      bgColor: 'bg-solar-50'
    },
    {
      emoji: '📊',
      title: 'Smart Organization',
      description: 'AI-powered event management that adapts to your family\'s schedule and preferences.',
      color: 'text-terracotta-600',
      bgColor: 'bg-terracotta-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner
              size="xl"
              text="Loading Solarpunk Portal..."
              variant="primary"
              className="mb-8"
            />
            <p className="text-forest-600 text-lg animate-pulse">
              Connecting to the future of scouting...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30">
      {/* Solarpunk Hero Section */}
      <section className="solarpunk-hero">
        <div className="solarpunk-hero-content">
          <div className={`inline-flex items-center px-6 py-3 bg-solar/20 backdrop-blur-sm text-ink rounded-full text-sm font-medium mb-8 border border-solar/40 ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}>
            <span className="text-2xl mr-3">🌱</span>
            Welcome to the Solarpunk Future of Scouting
          </div>
          
          <h1 className={`solarpunk-hero-title ${animationsTriggered ? "animate-solarpunk-slide-up" : ""}`}>
            <span className="solarpunk-text-gradient">Explore the Future</span>
            <br />
            <span className="text-white">of Scouting</span>
          </h1>
          
          <p className={`solarpunk-hero-subtitle ${animationsTriggered ? "animate-solarpunk-slide-up" : ""}`} style={{ animationDelay: '200ms' }}>
            Where sustainable technology meets outdoor adventure, creating the next generation of 
            <span className="text-solar-400 font-semibold"> eco-conscious leaders</span>.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center ${animationsTriggered ? "animate-solarpunk-slide-up" : ""}`} 
               style={{ animationDelay: '400ms' }}>
            {heroButtons.length >= 2 ? (
              <>
                <Link
                  to={heroButtons[0].href}
                  className="solarpunk-btn-primary"
                  onClick={() => trackHeroButtonClick(heroButtons[0])}
                >
                  {React.createElement(getIconComponent(heroButtons[0].icon), { 
                    className: "w-5 h-5" 
                  })}
                  {heroButtons[0].name}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                <Link
                  to={heroButtons[1].href}
                  className="solarpunk-btn-secondary"
                  onClick={() => trackHeroButtonClick(heroButtons[1])}
                >
                  {React.createElement(getIconComponent(heroButtons[1].icon), { 
                    className: "w-5 h-5" 
                  })}
                  {heroButtons[1].name}
                </Link>
              </>
            ) : (
              // Fallback buttons while loading
              <>
                <Link
                  to="/events"
                  className="solarpunk-btn-primary"
                >
                  <Calendar className="w-5 h-5" />
                  Explore Events
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                <Link
                  to="/locations"
                  className="solarpunk-btn-secondary"
                >
                  <Compass className="w-5 h-5" />
                  Discover Locations
                </Link>
                
                {/* Request Account Button for Anonymous Users */}
                {!userRole && (
                  <button
                    onClick={() => setShowAccountRequestModal(true)}
                    className="solarpunk-btn-solar"
                  >
                    <UserPlus className="w-5 h-5" />
                    Request Account Access
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Segmented Controls Section */}
      <section className="solarpunk-section">
        <div className={`text-center mb-12 ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}>
          <h2 className="solarpunk-section-title">
            <span className="solarpunk-text-gradient">Explore Your Adventure</span>
          </h2>
          <p className="solarpunk-section-subtitle">
            Discover events, locations, and resources tailored to your scouting journey
          </p>
        </div>

        {/* Segmented Control */}
        <div className={`max-w-4xl mx-auto ${animationsTriggered ? "animate-solarpunk-slide-up" : ""}`} 
             style={{ animationDelay: '200ms' }}>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Link
                to="/events"
                className="solarpunk-segmented-btn solarpunk-segmented-btn-active"
                onClick={() => trackUserAction('segmented_control', 'events')}
              >
                <Calendar className="w-5 h-5" />
                <span>Events</span>
                <span className="text-xs opacity-75">Adventures & Activities</span>
              </Link>
              
              <Link
                to="/locations"
                className="solarpunk-segmented-btn"
                onClick={() => trackUserAction('segmented_control', 'locations')}
              >
                <MapPin className="w-5 h-5" />
                <span>Locations</span>
                <span className="text-xs opacity-75">Places to Explore</span>
              </Link>
              
              <Link
                to="/resources"
                className="solarpunk-segmented-btn"
                onClick={() => trackUserAction('segmented_control', 'resources')}
              >
                <FileText className="w-5 h-5" />
                <span>Resources</span>
                <span className="text-xs opacity-75">Tools & Guides</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stories & News Section */}
      <section className="solarpunk-section">
        <div className={`text-center mb-12 ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}>
          <h2 className="solarpunk-section-title">
            <span className="solarpunk-text-gradient">Pack Stories</span>
          </h2>
          <p className="solarpunk-section-subtitle">
            Discover the adventures, achievements, and eco-projects that make Pack 1703 special
          </p>
        </div>

        {/* Stories Carousel */}
        <div className={`max-w-6xl mx-auto ${animationsTriggered ? "animate-solarpunk-slide-up" : ""}`} 
             style={{ animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Story Card 1 */}
            <div className="solarpunk-story-card">
              <div className="solarpunk-story-image">
                <div className="w-full h-48 bg-gradient-to-br from-forest-400 to-ocean-400 rounded-t-2xl flex items-center justify-center">
                  <span className="text-6xl">🌱</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-solar-100 text-solar-800 text-xs font-semibold rounded-full">Eco Project</span>
                  <span className="text-sm text-forest-600">2 days ago</span>
                </div>
                <h3 className="text-xl font-solarpunk-display font-bold text-forest-800 mb-3">
                  Solar-Powered Camp Kitchen
                </h3>
                <p className="text-forest-600 mb-4">
                  Our Webelos den built a portable solar kitchen for camping trips, reducing our carbon footprint while teaching sustainable living.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ocean-600 font-medium">Read More →</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-forest-500">12 scouts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story Card 2 */}
            <div className="solarpunk-story-card">
              <div className="solarpunk-story-image">
                <div className="w-full h-48 bg-gradient-to-br from-sky-400 to-terracotta-400 rounded-t-2xl flex items-center justify-center">
                  <span className="text-6xl">🏕️</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-forest-100 text-forest-800 text-xs font-semibold rounded-full">Adventure</span>
                  <span className="text-sm text-forest-600">1 week ago</span>
                </div>
                <h3 className="text-xl font-solarpunk-display font-bold text-forest-800 mb-3">
                  Wilderness Survival Badge
                </h3>
                <p className="text-forest-600 mb-4">
                  Bear scouts completed their wilderness survival training, learning essential skills for safe outdoor adventures.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ocean-600 font-medium">Read More →</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-forest-500">8 scouts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Story Card 3 */}
            <div className="solarpunk-story-card">
              <div className="solarpunk-story-image">
                <div className="w-full h-48 bg-gradient-to-br from-terracotta-400 to-solar-400 rounded-t-2xl flex items-center justify-center">
                  <span className="text-6xl">🤝</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-ocean-100 text-ocean-800 text-xs font-semibold rounded-full">Service</span>
                  <span className="text-sm text-forest-600">2 weeks ago</span>
                </div>
                <h3 className="text-xl font-solarpunk-display font-bold text-forest-800 mb-3">
                  Community Garden Project
                </h3>
                <p className="text-forest-600 mb-4">
                  Pack 1703 partnered with local community to create a sustainable garden, teaching kids about food systems and environmental stewardship.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ocean-600 font-medium">Read More →</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-forest-500">25 scouts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View All Stories Button */}
          <div className="text-center mt-8">
            <button className="solarpunk-btn-secondary">
              <FileText className="w-5 h-5" />
              View All Stories
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Register Buttons Section */}
      <section className="solarpunk-section">
        <div className={`text-center mb-12 ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}>
          <h2 className="solarpunk-section-title">
            <span className="solarpunk-text-gradient">Join Pack 1703</span>
          </h2>
          <p className="solarpunk-section-subtitle">
            Ready to start your solarpunk scouting adventure? Register with our pack and pay your dues to get started!
          </p>
        </div>

        <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center max-w-4xl mx-auto ${animationsTriggered ? "animate-solarpunk-slide-up" : ""}`} 
             style={{ animationDelay: '200ms' }}>
          
          {/* Pay Dues Button */}
          <a
            href="https://square.link/u/E3afCrTJ"
            target="_blank"
            rel="noopener noreferrer"
            className="solarpunk-btn-primary w-full sm:w-auto"
          >
            <CreditCard className="w-5 h-5" />
            Pay Annual Dues
            <ArrowRight className="w-5 h-5" />
          </a>
          
          {/* Register with Scouting America Button */}
          <a
            href="https://my.scouting.org/VES/OnlineReg/1.0.0/?tu=UF-MB-576paa1703"
            target="_blank"
            rel="noopener noreferrer"
            className="solarpunk-btn-solar w-full sm:w-auto"
          >
            <UserPlus className="w-5 h-5" />
            Register with Scouting America
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        {/* Additional Info */}
        <div className={`mt-8 text-center ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`} 
             style={{ animationDelay: '400ms' }}>
          <p className="text-sm text-forest-600 max-w-3xl mx-auto">
            <strong>Pack Dues:</strong> $195 per scout (includes handbook, neckerchief, and pack activities) • 
            <strong>Scouting America Registration:</strong> Required for all scouts to participate in official scouting activities • 
            <strong>Lion Scouts:</strong> Pack dues are waived for Lion scouts (kindergarten age)
          </p>
        </div>
      </section>

      {/* Quick Actions with Solarpunk Cards */}
      <section className="solarpunk-section">
        <h2 className={`solarpunk-section-title ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}>
          <span className="solarpunk-text-gradient">Quick Actions</span>
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
                  className={`group block ${animationsTriggered ? "animate-solarpunk-slide-up" : ""}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="solarpunk-card">
                    <div className="text-center">
                      <div className={`w-16 h-16 bg-gradient-${action.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow mx-auto`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-solarpunk-display font-semibold text-ink mb-3 group-hover:text-gradient-solarpunk transition-all duration-300 text-center">
                        {action.name}
                      </h3>
                      
                      <p className="text-forest-600 text-sm leading-relaxed mb-4 text-center">
                        {action.description}
                      </p>
                      
                      <div className="flex items-center justify-center text-forest-500 font-medium text-sm group-hover:text-forest-600 transition-colors duration-200">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Solarpunk Features Section */}
      <section className="solarpunk-section">
        <h2 className={`solarpunk-section-title ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}>
          Why Choose <span className="solarpunk-text-gradient">Our Solarpunk Pack</span>?
        </h2>
        <p className="solarpunk-section-subtitle">
          We're not just another scout pack. We're a community that believes in sustainable technology, 
          environmental stewardship, and preparing the next generation for a brighter future.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {solarpunkFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`text-center ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="w-16 h-16 bg-gradient-solarpunk rounded-2xl flex items-center justify-center shadow-glow mx-auto mb-6 animate-solarpunk-float">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-solarpunk-display font-semibold text-ink mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-forest-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technology Features Section */}
      <section className="solarpunk-section">
        <h2 className={`solarpunk-section-title ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}>
          How Our <span className="solarpunk-text-gradient">Solarpunk System</span> Works
        </h2>
        <p className="solarpunk-section-subtitle">
          We've built a smart, sustainable system that takes care of the complicated stuff so you can focus on 
          what matters most - connecting with nature and building lasting memories.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {techFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`text-center ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="w-16 h-16 bg-gradient-nature rounded-2xl flex items-center justify-center shadow-glow mx-auto mb-6 animate-solarpunk-pulse">
                <span className="text-white" style={{ fontSize: '24px' }}>{feature.emoji}</span>
              </div>
              
              <h3 className="text-xl font-solarpunk-display font-semibold text-ink mb-4">
                {feature.title}
              </h3>
              
              <p className="text-forest-600 leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Download Audit Button for Family Privacy */}
              {feature.title === 'Privacy First' && (
                <button
                  onClick={handleDownloadAudit}
                  disabled={isDownloadingAudit}
                  className="solarpunk-btn-secondary text-sm px-4 py-2"
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
      </section>

      {/* CTA Section with Solarpunk Visual Appeal */}
      <section className={`solarpunk-section ${animationsTriggered ? "animate-solarpunk-fade-in" : ""}`} style={{ animationDelay: '600ms' }}>
        <div className="bg-gradient-solarpunk rounded-3xl p-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 solarpunk-bg-pattern opacity-20"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-8 left-8 w-16 h-16 bg-white/20 rounded-full animate-solarpunk-float"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 bg-white/20 rounded-full animate-solarpunk-float" style={{ animationDelay: '3s' }}></div>
          
          <div className="relative z-10">
            <h3 className="text-3xl font-solarpunk-display font-bold text-white mb-4">
              Ready to Start Your Solarpunk Adventure?
            </h3>
            
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join our community of forward-thinking families who believe in the power of 
              sustainable technology, environmental stewardship, and outdoor adventure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/events"
                className="solarpunk-btn-primary bg-white text-forest-600 hover:bg-forest-50"
              >
                <Calendar className="w-5 h-5" />
                Explore Events
              </Link>
              
              <Link
                to="/feedback"
                className="solarpunk-btn-secondary bg-white/95 text-forest-700 border-forest-200 hover:bg-forest-50 hover:text-forest-800"
              >
                <MessageSquare className="w-5 h-5" />
                Share Feedback
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Account Request Modal */}
      <AccountRequestModal
        isOpen={showAccountRequestModal}
        onClose={() => setShowAccountRequestModal(false)}
        onSuccess={(requestId) => {
          console.log('Account request submitted:', requestId);
          setShowAccountRequestModal(false);
          // Show success message or redirect
        }}
      />
    </div>
  );
};

export default HomePage;