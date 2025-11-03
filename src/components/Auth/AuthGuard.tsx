import React, { useState, useRef, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import SocialLogin from './SocialLogin';
import AccountRequestModal from './AccountRequestModal';
import { UserPlus, ChevronDown } from 'lucide-react';
import { authService } from '../../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { state } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = state;
  const [showAccountRequestModal, setShowAccountRequestModal] = useState(false);
  const [activeCarouselSlide, setActiveCarouselSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Track scroll position to update active carousel dot
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const cardWidth = 320; // w-80 = 320px
      const gap = 32; // gap-8 = 32px
      const scrollLeft = carousel.scrollLeft;
      const slideIndex = Math.round(scrollLeft / (cardWidth + gap));
      setActiveCarouselSlide(slideIndex);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle carousel navigation
  const scrollToCarouselSlide = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 320; // 80 (w-80) * 4 = 320px
      const gap = 32; // gap-8 = 32px
      const scrollPosition = index * (cardWidth + gap);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setActiveCarouselSlide(index);
    }
  };

  // If user is trying to access admin routes without admin privileges
  if (currentUser && location.pathname.startsWith('/admin') && (currentUser.role as any) !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // If user is authenticated but not approved, show pending approval page
  if (currentUser && currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Pending Approval</h1>
            <p className="text-lg text-gray-600">
              Your account has been created successfully and is awaiting approval from pack leadership.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">
              You'll receive an email notification once your account has been reviewed and approved by our pack administrators.
              This typically takes 24-48 hours.
            </p>
            <p className="text-sm text-gray-600">
              If you have any questions, please contact the pack leadership at{' '}
              <a href="mailto:cubmaster@sfpack1703.com" className="text-blue-600 hover:underline">
                cubmaster@sfpack1703.com
              </a>
            </p>
          </div>
          <button
            onClick={() => authService.signOut()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // If user is denied, show access denied page
  if (currentUser && currentUser.status === 'denied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-lg text-gray-600">
              Your account request has been denied by pack leadership.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-4">
              If you believe this is an error or would like more information, please contact pack leadership.
            </p>
            <p className="text-sm text-gray-600">
              Contact:{' '}
              <a href="mailto:cubmaster@sfpack1703.com" className="text-blue-600 hover:underline">
                cubmaster@sfpack1703.com
              </a>
            </p>
          </div>
          <button
            onClick={() => authService.signOut()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // If no user is authenticated, show enhanced login page
  if (!currentUser) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-fog via-forest-50/30 to-solar-50/30">
          {/* Dynamic Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-sky-400 via-solar-400 to-forest-400 animate-pulse"></div>
          
          {/* Full-Width Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Thematic Background Illustration */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100/50 via-forest-50/30 to-solar-50/30">
              {/* Mountain Silhouettes */}
              <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-forest-200/20 to-transparent">
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-forest-300/10 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-40 bg-gradient-to-t from-forest-400/10 to-transparent"></div>
              </div>
              
              {/* Solar Panel Silhouettes */}
              <div className="absolute top-1/4 right-1/4 w-32 h-16 bg-gradient-to-br from-solar-200/20 to-solar-300/20 rounded-lg transform rotate-12"></div>
              <div className="absolute top-1/3 right-1/3 w-24 h-12 bg-gradient-to-br from-solar-200/15 to-solar-300/15 rounded-lg transform -rotate-6"></div>
              
              {/* Tree Silhouettes */}
              <div className="absolute bottom-1/4 left-1/4 w-8 h-16 bg-gradient-to-t from-forest-400/20 to-transparent rounded-full"></div>
              <div className="absolute bottom-1/3 left-1/3 w-6 h-12 bg-gradient-to-t from-forest-500/15 to-transparent rounded-full"></div>
              <div className="absolute bottom-1/5 right-1/5 w-10 h-20 bg-gradient-to-t from-forest-300/20 to-transparent rounded-full"></div>
              
              {/* Subtle Texture Overlay */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, rgba(45, 80, 22, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(244, 208, 63, 0.1) 0%, transparent 50%),
                                radial-gradient(circle at 40% 40%, rgba(93, 173, 226, 0.1) 0%, transparent 50%)`
              }}></div>
            </div>
            
            {/* Hero Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              {/* Main Headline */}
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-solarpunk-display font-black text-forest-800 mb-6 leading-tight">
                <span className="block">Join the</span>
                <span className="block bg-gradient-to-r from-forest-600 via-ocean-600 to-solar-600 bg-clip-text text-transparent">
                  Adventure
                </span>
              </h1>
              
              {/* Sub-headline */}
              <p className="text-xl sm:text-2xl lg:text-3xl font-solarpunk-display font-medium text-forest-700 mb-12 max-w-4xl mx-auto leading-relaxed">
                Where nature meets technology and tradition
              </p>
              
              {/* Single Clear CTA */}
              <div className="mb-16">
                <button 
                  onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group inline-flex items-center gap-4 px-12 py-6 bg-white text-forest-800 font-solarpunk-display font-bold text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-forest-50 hover:to-ocean-50 border-2 border-forest-200 hover:border-forest-400"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-forest-500 to-ocean-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🔑</span>
                  </div>
                  <span className="group-hover:tracking-wider transition-all duration-300">Sign In / Join Pack 1703</span>
                  <div className="w-6 h-6 bg-gradient-to-br from-forest-500 to-ocean-500 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <span className="text-white text-sm">→</span>
                  </div>
                </button>
              </div>

              {/* Enhanced Scroll Indicator */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce cursor-pointer group"
                   onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="relative flex items-center justify-center">
                  {/* Pulsing background circle */}
                  <div className="absolute w-12 h-12 bg-forest-400/20 rounded-full animate-ping"></div>
                  {/* Main circle with gradient */}
                  <div className="relative w-10 h-10 bg-gradient-to-br from-forest-400 to-ocean-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <ChevronDown className="w-6 h-6 text-white group-hover:translate-y-0.5 transition-transform duration-300" />
                  </div>
                </div>
                {/* Progress line */}
                <div className="w-0.5 h-12 bg-gradient-to-b from-forest-400/60 to-transparent rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Benefits List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-forest-200/30 hover:bg-white/80 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-forest-400 to-forest-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">👥</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-solarpunk-display font-semibold text-forest-700 mb-1">Connect with Families</h3>
                    <p className="text-sm text-forest-600">Build lasting friendships</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-forest-200/30 hover:bg-white/80 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🏕️</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-solarpunk-display font-semibold text-forest-700 mb-1">Discover Adventures</h3>
                    <p className="text-sm text-forest-600">Local outdoor experiences</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-forest-200/30 hover:bg-white/80 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-solar-400 to-solar-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🌱</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-solarpunk-display font-semibold text-forest-700 mb-1">Earn Eco-Badges</h3>
                    <p className="text-sm text-forest-600">Sustainable achievements</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Event Preview Carousel */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl font-solarpunk-display font-bold text-forest-800 mb-6">
                  Upcoming Adventures
                </h2>
                <p className="text-xl text-forest-600 max-w-3xl mx-auto">
                  Year-round adventures that build character, nurture growth, and create lasting memories
                </p>
              </div>

              {/* Carousel Container */}
              <div className="relative">
                {/* Carousel Track */}
                <div 
                  ref={carouselRef}
                  className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-4 carousel-container"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* Event Card 1 */}
                  <div className="flex-shrink-0 w-80 snap-center">
                    <div className="bg-white rounded-3xl shadow-xl border border-forest-200/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <div className="h-48 bg-gradient-to-br from-forest-400 to-ocean-400 flex items-center justify-center">
                        <span className="text-6xl">🎒</span>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-forest-100 text-forest-800 text-xs font-semibold rounded-full">Pack Event</span>
                          <span className="text-sm text-forest-600">Sept 14</span>
                        </div>
                        <h3 className="text-xl font-solarpunk-display font-bold text-forest-800 mb-3">Pack Kickoff</h3>
                        <p className="text-forest-600 mb-4">Start the scouting year with excitement, new friendships, and adventure planning</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ocean-600 font-medium">Learn More →</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-forest-500">All Dens</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 2 */}
                  <div className="flex-shrink-0 w-80 snap-center">
                    <div className="bg-white rounded-3xl shadow-xl border border-forest-200/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <div className="h-48 bg-gradient-to-br from-ocean-400 to-sky-400 flex items-center justify-center">
                        <span className="text-6xl">🚢</span>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-ocean-100 text-ocean-800 text-xs font-semibold rounded-full">Overnight</span>
                          <span className="text-sm text-forest-600">Oct 25-26</span>
                        </div>
                        <h3 className="text-xl font-solarpunk-display font-bold text-forest-800 mb-3">USS Stewart Sleepover</h3>
                        <p className="text-forest-600 mb-4">Overnight adventure aboard a historic battleship with maritime history and teamwork</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ocean-600 font-medium">Learn More →</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-forest-500">Webelos+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 3 */}
                  <div className="flex-shrink-0 w-80 snap-center">
                    <div className="bg-white rounded-3xl shadow-xl border border-forest-200/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <div className="h-48 bg-gradient-to-br from-sky-400 to-terracotta-400 flex items-center justify-center">
                        <span className="text-6xl">🏕️</span>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-semibold rounded-full">Camping</span>
                          <span className="text-sm text-forest-600">Nov 14-16</span>
                        </div>
                        <h3 className="text-xl font-solarpunk-display font-bold text-forest-800 mb-3">Double Lake Campout</h3>
                        <p className="text-forest-600 mb-4">Canoeing, stargazing, campfire adventures, and nature exploration</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ocean-600 font-medium">Learn More →</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-forest-500">All Ages</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 4 */}
                  <div className="flex-shrink-0 w-80 snap-center">
                    <div className="bg-white rounded-3xl shadow-xl border border-forest-200/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <div className="h-48 bg-gradient-to-br from-terracotta-400 to-solar-400 flex items-center justify-center">
                        <span className="text-6xl">❄️</span>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-terracotta-100 text-terracotta-800 text-xs font-semibold rounded-full">Celebration</span>
                          <span className="text-sm text-forest-600">Dec 19</span>
                        </div>
                        <h3 className="text-xl font-solarpunk-display font-bold text-forest-800 mb-3">Winter Celebration</h3>
                        <p className="text-forest-600 mb-4">Festival of Light and holiday festivities with community spirit</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-ocean-600 font-medium">Learn More →</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-forest-500">All Families</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {[0, 1, 2, 3].map((index) => (
                    <button
                      key={index}
                      onClick={() => scrollToCarouselSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                        activeCarouselSlide === index 
                          ? 'bg-forest-400 w-8' 
                          : 'bg-forest-200 hover:bg-forest-300'
                      }`}
                      aria-label={`Go to event ${index + 1}`}
                    />
                  ))}
                </div>

                {/* View All Events Button */}
                <div className="text-center mt-8">
                  <button className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-forest-500 to-ocean-500 text-white font-solarpunk-display font-semibold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <span>View All Events</span>
                    <span className="text-xl">→</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Login Section */}
          <div id="login-section" className="bg-gradient-to-br from-moss/10 via-teal/5 to-moss/5 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-display font-bold text-ink mb-4">
                  Ready to Access the Portal?
                </h2>
                <p className="text-lg text-teal-700">
                  Sign in to access event details, RSVP for adventures, and connect with your scouting community
                </p>
              </div>

              <div className="bg-white rounded-brand shadow-card border border-cloud p-8">
                <SocialLogin 
                  onSuccess={() => navigate('/')}
                  onError={(error) => console.error('Login error:', error)}
                  showEmailOption={true}
                />
              </div>

              {/* Account Request Section */}
              <div className="text-center mt-8">
                <p className="text-white mb-4 font-medium text-lg">
                  New to Pack 1703? Request account access to join our scouting community
                </p>
                <button 
                  onClick={() => setShowAccountRequestModal(true)}
                  className="force-white-text inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-teal-700 transition-all duration-200 hover:scale-105 transform"
                  style={{ 
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <UserPlus className="w-6 h-6" />
                  Request Account Access
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Request Modal */}
        {showAccountRequestModal && (
          <AccountRequestModal
            isOpen={showAccountRequestModal}
            onClose={() => setShowAccountRequestModal(false)}
            onSuccess={() => {
              setShowAccountRequestModal(false);
              // Could show a success message here
            }}
          />
        )}
      </>
    );
  }

  // User is authenticated, allow access
  return <>{children}</>;
};

export default AuthGuard;