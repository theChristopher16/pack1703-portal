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

  // Redirect super admins to organizations page when accessing root path
  useEffect(() => {
    if (currentUser && location.pathname === '/') {
      const isSuperAdmin = currentUser.role === 'super-admin' || 
                          currentUser.role === 'root';
      
      if (isSuperAdmin) {
        console.log('🔐 AuthGuard: Redirecting super admin to /organizations');
        navigate('/organizations', { replace: true });
      }
    }
  }, [currentUser, location.pathname, navigate]);

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

  // Check if super admin is accessing root path - redirect to organizations
  // This must happen early, before other checks
  if (currentUser && location.pathname === '/') {
    const isSuperAdmin = currentUser.role === 'super-admin' || 
                        currentUser.role === 'root';
    
    if (isSuperAdmin) {
      return <Navigate to="/organizations" replace />;
    }
  }

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

  // If no user is authenticated, show retro-futuristic login page
  if (!currentUser) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 relative overflow-hidden">
          {/* Animated Neon Top Bar */}
          <div className="h-1 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 shadow-lg shadow-cyan-500/50 animate-pulse"></div>
          
          {/* Retro Grid Background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              linear-gradient(rgba(236, 72, 153, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 72, 153, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center bottom'
          }}></div>
          
          {/* Full-Width Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Retro-Futuristic Background Elements */}
            <div className="absolute inset-0">
              {/* Neon Rings */}
              <div className="absolute top-20 right-1/4 w-64 h-64 border-4 border-cyan-400 rounded-full animate-pulse opacity-30 shadow-2xl shadow-cyan-400/50"></div>
              <div className="absolute bottom-32 left-1/4 w-48 h-48 border-4 border-pink-500 rounded-full animate-pulse opacity-30 shadow-2xl shadow-pink-500/50" style={{ animationDelay: '1s' }}></div>
              
              {/* Geometric Shapes */}
              <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 opacity-20 rotate-45 animate-pulse shadow-2xl shadow-yellow-400/30"></div>
              <div className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 opacity-20 rotate-12 animate-pulse shadow-2xl shadow-cyan-400/30" style={{ animationDelay: '0.5s' }}></div>
              
              {/* Neon Lines */}
              <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-40 shadow-lg shadow-pink-500/50"></div>
              <div className="absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 shadow-lg shadow-cyan-400/50"></div>
              
              {/* Glowing Orbs */}
              <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-yellow-400 rounded-full blur-sm animate-pulse shadow-2xl shadow-yellow-400"></div>
              <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-cyan-400 rounded-full blur-sm animate-pulse shadow-2xl shadow-cyan-400" style={{ animationDelay: '0.7s' }}></div>
              <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-pink-500 rounded-full blur-sm animate-pulse shadow-2xl shadow-pink-500" style={{ animationDelay: '1.2s' }}></div>
              
              {/* Retro Sun/Mountains Silhouette */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-t from-pink-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl"></div>
            </div>
            
            {/* Hero Content - Retro Style */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              {/* Retro Badge */}
              <div className="inline-block mb-8 px-6 py-2 bg-gradient-to-r from-cyan-400 to-pink-500 text-white font-bold text-sm tracking-widest uppercase transform -skew-x-6 shadow-lg shadow-cyan-500/50">
                <span className="inline-block transform skew-x-6">⚡ PACK 1703 PORTAL ⚡</span>
              </div>

              {/* Main Headline - Neon Style */}
              <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black mb-6 leading-none" style={{
                textShadow: `
                  0 0 10px rgba(236, 72, 153, 0.8),
                  0 0 20px rgba(236, 72, 153, 0.6),
                  0 0 30px rgba(236, 72, 153, 0.4),
                  0 0 40px rgba(34, 211, 238, 0.3)
                `
              }}>
                <span className="block bg-gradient-to-r from-cyan-300 via-pink-400 to-yellow-300 bg-clip-text text-transparent">
                  ADVENTURE
                </span>
                <span className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                  AWAITS
                </span>
              </h1>
              
              {/* Sub-headline with retro glow */}
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-cyan-300 mb-16 max-w-4xl mx-auto leading-relaxed tracking-wide" style={{
                textShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
              }}>
                WHERE NATURE MEETS THE FUTURE
              </p>
              
              {/* Retro CTA Button */}
              <div className="mb-20">
                <button 
                  onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-black text-xl uppercase tracking-wider transform hover:scale-105 transition-all duration-300 overflow-hidden border-4 border-white shadow-2xl shadow-pink-500/50 hover:shadow-cyan-500/70"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">🚀</span>
                  <span className="relative z-10 group-hover:tracking-widest transition-all duration-300">ENTER PORTAL</span>
                  <span className="relative z-10 group-hover:translate-x-2 transition-transform duration-300">→</span>
                </button>
              </div>

              {/* Retro Scroll Indicator */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 cursor-pointer group"
                   onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="text-cyan-300 font-bold text-xs tracking-widest animate-pulse" style={{
                  textShadow: '0 0 10px rgba(34, 211, 238, 0.8)'
                }}>SCROLL</div>
                <ChevronDown className="w-6 h-6 text-pink-400 animate-bounce" style={{
                  filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.8))'
                }} />
              </div>
              
              {/* Retro Benefits Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-sm border-4 border-cyan-400 p-6 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-cyan-400/50">
                    <div className="text-5xl mb-4 filter drop-shadow-lg">👥</div>
                    <h3 className="font-black text-xl text-cyan-300 mb-2 uppercase tracking-wider" style={{
                      textShadow: '0 0 10px rgba(34, 211, 238, 0.6)'
                    }}>Community</h3>
                    <p className="text-sm text-cyan-100 font-medium">Connect with families and build lasting friendships</p>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-sm border-4 border-pink-400 p-6 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-pink-400/50">
                    <div className="text-5xl mb-4 filter drop-shadow-lg">🏕️</div>
                    <h3 className="font-black text-xl text-pink-300 mb-2 uppercase tracking-wider" style={{
                      textShadow: '0 0 10px rgba(236, 72, 153, 0.6)'
                    }}>Adventure</h3>
                    <p className="text-sm text-pink-100 font-medium">Year-round outdoor experiences and challenges</p>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-purple-900/90 to-orange-900/90 backdrop-blur-sm border-4 border-yellow-400 p-6 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-yellow-400/50">
                    <div className="text-5xl mb-4 filter drop-shadow-lg">🌟</div>
                    <h3 className="font-black text-xl text-yellow-300 mb-2 uppercase tracking-wider" style={{
                      textShadow: '0 0 10px rgba(250, 204, 21, 0.6)'
                    }}>Achievement</h3>
                    <p className="text-sm text-yellow-100 font-medium">Earn badges and grow through scouting</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Event Preview Carousel - Retro Style */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-950 via-purple-950 to-pink-950 relative overflow-hidden">
            {/* Retro Background Grid */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}></div>
            
            <div className="max-w-6xl mx-auto relative z-10">
              <div className="text-center mb-16">
                {/* Retro Title Badge */}
                <div className="inline-block mb-6 px-8 py-3 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-black text-lg uppercase tracking-widest transform -skew-x-6 shadow-2xl shadow-pink-500/50">
                  <span className="inline-block transform skew-x-6">⚡ UPCOMING MISSIONS ⚡</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black mb-6 bg-gradient-to-r from-cyan-300 via-pink-400 to-yellow-300 bg-clip-text text-transparent" style={{
                  textShadow: '0 0 30px rgba(236, 72, 153, 0.5)'
                }}>
                  SCOUT ADVENTURES
                </h2>
                <p className="text-xl text-cyan-300 max-w-3xl mx-auto font-bold" style={{
                  textShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
                }}>
                  Epic experiences that create legendary memories
                </p>
              </div>

              {/* Carousel Container */}
              <div className="relative">
                {/* Carousel Track */}
                <div 
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 carousel-container"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#ec4899 transparent' }}
                >
                  {/* Event Card 1 - Retro Style */}
                  <div className="flex-shrink-0 w-80 snap-center group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
                      <div className="relative bg-gradient-to-br from-purple-900 to-indigo-900 border-4 border-cyan-400 overflow-hidden transform group-hover:scale-105 transition-all duration-300 shadow-2xl shadow-cyan-400/50">
                        <div className="h-48 bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center relative">
                          <span className="text-7xl filter drop-shadow-2xl">🎒</span>
                          <div className="absolute top-2 right-2 px-3 py-1 bg-yellow-400 text-black font-black text-xs uppercase transform rotate-3 shadow-lg">NEW!</div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold uppercase">PACK EVENT</span>
                            <span className="text-xs text-cyan-300 font-bold">SEPT 14</span>
                          </div>
                          <h3 className="text-2xl font-black text-cyan-300 mb-3 uppercase" style={{
                            textShadow: '0 0 10px rgba(34, 211, 238, 0.6)'
                          }}>Pack Kickoff</h3>
                          <p className="text-cyan-100 mb-4 font-medium text-sm">Start the scouting year with excitement and adventure planning</p>
                          <div className="flex items-center gap-2 text-sm text-pink-400 font-bold uppercase group-hover:gap-3 transition-all duration-300">
                            <span>Launch Mission</span>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 2 */}
                  <div className="flex-shrink-0 w-80 snap-center group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
                      <div className="relative bg-gradient-to-br from-purple-900 to-pink-900 border-4 border-pink-400 overflow-hidden transform group-hover:scale-105 transition-all duration-300 shadow-2xl shadow-pink-400/50">
                        <div className="h-48 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center relative">
                          <span className="text-7xl filter drop-shadow-2xl">🚢</span>
                          <div className="absolute top-2 right-2 px-3 py-1 bg-cyan-400 text-black font-black text-xs uppercase transform -rotate-3 shadow-lg">EPIC!</div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold uppercase">OVERNIGHT</span>
                            <span className="text-xs text-pink-300 font-bold">OCT 25-26</span>
                          </div>
                          <h3 className="text-2xl font-black text-pink-300 mb-3 uppercase" style={{
                            textShadow: '0 0 10px rgba(236, 72, 153, 0.6)'
                          }}>USS Stewart</h3>
                          <p className="text-pink-100 mb-4 font-medium text-sm">Overnight adventure aboard a historic battleship</p>
                          <div className="flex items-center gap-2 text-sm text-cyan-400 font-bold uppercase group-hover:gap-3 transition-all duration-300">
                            <span>Launch Mission</span>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 3 */}
                  <div className="flex-shrink-0 w-80 snap-center group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
                      <div className="relative bg-gradient-to-br from-purple-900 to-green-900 border-4 border-green-400 overflow-hidden transform group-hover:scale-105 transition-all duration-300 shadow-2xl shadow-green-400/50">
                        <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center relative">
                          <span className="text-7xl filter drop-shadow-2xl">🏕️</span>
                          <div className="absolute top-2 right-2 px-3 py-1 bg-yellow-400 text-black font-black text-xs uppercase transform rotate-2 shadow-lg">HOT!</div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold uppercase">CAMPING</span>
                            <span className="text-xs text-green-300 font-bold">NOV 14-16</span>
                          </div>
                          <h3 className="text-2xl font-black text-green-300 mb-3 uppercase" style={{
                            textShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
                          }}>Lake Campout</h3>
                          <p className="text-green-100 mb-4 font-medium text-sm">Canoeing, stargazing, and nature exploration</p>
                          <div className="flex items-center gap-2 text-sm text-yellow-400 font-bold uppercase group-hover:gap-3 transition-all duration-300">
                            <span>Launch Mission</span>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Card 4 */}
                  <div className="flex-shrink-0 w-80 snap-center group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300"></div>
                      <div className="relative bg-gradient-to-br from-purple-900 to-orange-900 border-4 border-yellow-400 overflow-hidden transform group-hover:scale-105 transition-all duration-300 shadow-2xl shadow-yellow-400/50">
                        <div className="h-48 bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center relative">
                          <span className="text-7xl filter drop-shadow-2xl">❄️</span>
                          <div className="absolute top-2 right-2 px-3 py-1 bg-cyan-400 text-black font-black text-xs uppercase transform -rotate-2 shadow-lg">COOL!</div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-xs font-bold uppercase">PARTY</span>
                            <span className="text-xs text-yellow-300 font-bold">DEC 19</span>
                          </div>
                          <h3 className="text-2xl font-black text-yellow-300 mb-3 uppercase" style={{
                            textShadow: '0 0 10px rgba(250, 204, 21, 0.6)'
                          }}>Winter Fest</h3>
                          <p className="text-yellow-100 mb-4 font-medium text-sm">Festival of Light and holiday festivities</p>
                          <div className="flex items-center gap-2 text-sm text-pink-400 font-bold uppercase group-hover:gap-3 transition-all duration-300">
                            <span>Launch Mission</span>
                            <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Retro Navigation Dots */}
                <div className="flex justify-center gap-3 mt-12">
                  {[0, 1, 2, 3].map((index) => (
                    <button
                      key={index}
                      onClick={() => scrollToCarouselSlide(index)}
                      className={`transition-all duration-300 border-2 ${
                        activeCarouselSlide === index 
                          ? 'w-12 h-3 bg-gradient-to-r from-cyan-400 to-pink-500 border-white shadow-lg shadow-pink-500/50' 
                          : 'w-3 h-3 bg-transparent border-cyan-400 hover:bg-cyan-400/30 hover:scale-125'
                      }`}
                      aria-label={`Go to event ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Retro View All Button */}
                <div className="text-center mt-12">
                  <button className="group inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-500 text-white font-black text-lg uppercase tracking-wider shadow-2xl shadow-pink-500/50 hover:shadow-cyan-500/70 transition-all duration-300 hover:scale-105 border-4 border-white transform hover:gap-6">
                    <span>🎯</span>
                    <span>View All Missions</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">⚡</span>
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