import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import SocialLogin from './SocialLogin';
import AccountRequestModal from './AccountRequestModal';
import { UserPlus, Key } from 'lucide-react';
import { authService, SocialProvider } from '../../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { state } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = state;
  const [showAccountRequestModal, setShowAccountRequestModal] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // If user is trying to access admin routes without admin privileges
  if (currentUser && location.pathname.startsWith('/admin') && (currentUser.role as any) !== 'admin') {
    return <Navigate to="/" replace />;
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
                <div className="flex gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
                  <div className="w-3 h-3 bg-forest-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-forest-200 rounded-full"></div>
                  <div className="w-3 h-3 bg-forest-200 rounded-full"></div>
                  <div className="w-3 h-3 bg-forest-200 rounded-full"></div>
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
                <p className="text-teal-700 mb-4">
                  New to Pack 1703? Request account access to join our scouting community
                </p>
                <button 
                  onClick={() => setShowAccountRequestModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-moss to-teal text-white font-semibold rounded-brand shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <UserPlus className="w-5 h-5" />
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