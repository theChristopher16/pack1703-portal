import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import SocialLogin from './SocialLogin';
import AccountRequestModal from './AccountRequestModal';
import { UserPlus, Key } from 'lucide-react';
import { authService, SocialProvider } from '../../services/authService';
import { DEN_INFO, DEN_TYPES } from '../../constants/dens';

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
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isLoading, setIsLoading] = useState<SocialProvider | null>(null);

  const handleSocialLogin = async (provider: SocialProvider) => {
    setIsLoading(provider);
    try {
      await authService.signInWithSocial(provider);
    } catch (error: any) {
      console.error(`${provider} sign-in error:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  const handleEmailSignIn = () => {
    setShowEmailModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setResetMessage('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setResetMessage(null);

    try {
      await authService.sendPasswordResetEmail(resetEmail);
      setResetMessage('Password reset email sent! Check your inbox for instructions.');
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setResetMessage(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOpenResetPassword = () => {
    setShowResetPassword(true);
    setResetMessage(null);
  };

  const handleCloseResetPassword = () => {
    setShowResetPassword(false);
    setResetEmail('');
    setResetMessage(null);
  };

  // REMOVED LOADING SCREEN - User requested to remove it
  // The loading screen was causing page reloads and poor UX
  
  // If no user is authenticated, show login page
  if (!currentUser) {
    return (
      <>
        <div className="min-h-screen bg-fog">
          {/* Hero Section - Primary User Actions */}
          <div className="bg-gradient-to-br from-moss/10 via-teal/5 to-moss/5 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="mx-auto w-20 h-20 bg-gradient-brand rounded-brand flex items-center justify-center mb-6 shadow-card">
                  <span className="text-white text-3xl">🏕️</span>
                </div>
                <h1 className="text-4xl font-display font-bold text-ink mb-3">
                  Welcome to Pack 1703
                </h1>
                <p className="text-lg text-teal-700 mb-2">
                  Scouting for Every Age - Kindergarten through 5th Grade
                </p>
                <p className="text-teal-600 max-w-3xl mx-auto">
                  Join our vibrant scouting community where your child will learn life skills, build character, and create lasting friendships through outdoor adventures, community service, and exciting activities.
                </p>
              </div>

              {/* Primary Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Sign In */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-moss to-teal rounded-brand flex items-center justify-center mx-auto mb-6">
                    <span className="text-white text-2xl">🔑</span>
                  </div>
                  <h3 className="text-xl font-semibold text-ink mb-3">Sign In</h3>
                  <p className="text-teal-700 mb-6">Access your pack activities and connect with the community</p>
                  
                  {/* Clean Login Options */}
                  <div className="space-y-4">
                    {/* Google Sign In */}
                    <button 
                      onClick={() => handleSocialLogin(SocialProvider.GOOGLE)}
                      disabled={isLoading === SocialProvider.GOOGLE}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-cloud text-teal hover:bg-moss/5 hover:border-moss rounded-md transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading === SocialProvider.GOOGLE ? (
                        <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      <span className="font-medium text-sm">
                        {isLoading === SocialProvider.GOOGLE ? 'Signing in...' : 'Sign in with Google'}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-cloud"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-teal-500">or</span>
                      </div>
                    </div>

                    {/* Email Sign In */}
                    <button 
                      onClick={handleEmailSignIn}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-moss text-white hover:bg-moss-600 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                      </svg>
                      <span className="font-medium text-sm">Sign in with Email & Password</span>
                    </button>
                  </div>
                </div>

                {/* Request Access */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-8 text-center">
                  <div 
                    className="w-16 h-16 rounded-brand flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'linear-gradient(135deg, #4C6F7A 0%, #6BAA75 100%)' }}
                  >
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink mb-3">New Scout Family?</h3>
                  <p className="text-teal-700 mb-6">Join Pack 1703 and start your scouting journey today!</p>
                  <button
                    onClick={() => setShowAccountRequestModal(true)}
                    className="w-full text-white py-3 px-6 rounded-md transition-colors font-medium text-lg hover:opacity-90"
                    style={{ backgroundColor: '#4C6F7A' }}
                  >
                    Request Account Access
                  </button>
                </div>

                {/* Password Reset */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-8 text-center">
                  <div 
                    className="w-16 h-16 rounded-brand flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'linear-gradient(135deg, #F6C945 0%, #6BAA75 100%)' }}
                  >
                    <Key className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink mb-3">Forgot Password?</h3>
                  <p className="text-teal-700 mb-6">Reset your password quickly and securely</p>
                  <button
                    onClick={handleOpenResetPassword}
                    className="w-full text-ink py-3 px-6 rounded-md transition-colors font-medium text-lg hover:opacity-90"
                    style={{ backgroundColor: '#F6C945' }}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Den Showcase Section */}
          <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-display font-bold text-ink mb-4">
                  Scouting for Every Age Group
                </h2>
                <p className="text-lg text-teal-700">
                  Our pack serves scouts from Kindergarten through 5th grade with age-appropriate activities and adventures
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {[
                  DEN_TYPES.LION,
                  DEN_TYPES.TIGER, 
                  DEN_TYPES.WOLF,
                  DEN_TYPES.BEAR,
                  DEN_TYPES.WEBELOS,
                  DEN_TYPES.ARROW_OF_LIGHT
                ].map((denType) => {
                  const denInfo = DEN_INFO[denType];
                  return (
                    <div key={denType} className="bg-gradient-to-br from-white to-fog/30 rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                      <div className="text-4xl mb-4">{denInfo.emoji}</div>
                      <h3 className="text-xl font-semibold text-ink mb-2">{denInfo.displayName}</h3>
                      <p className="text-sm text-teal-700 font-medium mb-2">{denInfo.grade}</p>
                      <p className="text-sm text-teal-600">{denInfo.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Event Types Section */}
          <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-moss/5 to-teal/5">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-display font-bold text-ink mb-4">
                  Exciting Activities & Events
                </h2>
                <p className="text-lg text-teal-700">
                  Year-round adventures that build character, friendships, and life skills
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {/* September - Kickoff */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-moss to-teal rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🎒</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Pack Kickoff</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">Sept 14</p>
                  <p className="text-sm text-teal-700">Start the scouting year with excitement and meeting new friends</p>
                </div>

                {/* October - USS Stewart Sleepover */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-moss to-teal rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🚢</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">USS Stewart Sleepover</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">Oct 25-26</p>
                  <p className="text-sm text-teal-700">Overnight adventure aboard a historic battleship</p>
                </div>

                {/* November - Double Lake Campout */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🏕️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Double Lake Campout</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">Nov 14-16</p>
                  <p className="text-sm text-teal-700">Canoeing, stargazing, and campfire adventures</p>
                </div>

                {/* December - Winter Celebration */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">❄️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Winter Celebration</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">Dec 19</p>
                  <p className="text-sm text-teal-700">Festival of Light and holiday festivities</p>
                </div>

                {/* January - Pinewood Derby */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🏁</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Pinewood Derby</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">Jan 18, 25 & Feb 1</p>
                  <p className="text-sm text-teal-700">Build, test, and race your custom cars</p>
                </div>

                {/* March - Rocket Launch */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🚀</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Rocket Launch</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">March 1</p>
                  <p className="text-sm text-teal-700">Build and launch your own rockets</p>
                </div>

                {/* March - Brazos Bend */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🎣</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Brazos Bend Adventure</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">March 27-28</p>
                  <p className="text-sm text-teal-700">Fishing, ranger talks, and nature exploration</p>
                </div>

                {/* April - Tia-Piah Powwow */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-moss/80 to-teal/80 rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🌎</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Tia-Piah Powwow</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">April 26</p>
                  <p className="text-sm text-teal-700">Cultural exchange, dance, and sun-art banners</p>
                </div>

                {/* May - Bovay Scout Ranch */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-moss to-teal rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">🏹</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Bovay Scout Ranch</h3>
                  <p className="text-sm text-teal-700 font-medium mb-1">May</p>
                  <p className="text-sm text-teal-700">Archery, fishing, and solar oven cooking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-display font-bold text-ink mb-4">
                  What You'll Get Access To
                </h2>
                <p className="text-lg text-teal-700">
                  Once you're signed in, you'll have access to all these features
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Events */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-moss to-teal rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">📅</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Events & Activities</h3>
                  <p className="text-sm text-teal-700 mb-4">View upcoming pack meetings, outings, and special events</p>
                  <div className="bg-moss/10 text-moss px-3 py-1 rounded-full text-sm font-medium">
                    Available after login
                  </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">📢</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Announcements</h3>
                  <p className="text-sm text-teal-700 mb-4">Stay updated with important pack news and updates</p>
                  <div className="bg-moss/10 text-moss px-3 py-1 rounded-full text-sm font-medium">
                    Available after login
                  </div>
                </div>

                {/* RSVPs */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">✋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">RSVP & Sign-ups</h3>
                  <p className="text-sm text-teal-700 mb-4">Respond to events and volunteer for activities</p>
                  <div className="bg-teal/10 text-teal px-3 py-1 rounded-full text-sm font-medium">
                    Available after login
                  </div>
                </div>

                {/* Community */}
                <div className="bg-white rounded-brand shadow-card border border-cloud p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-moss/80 to-teal/80 rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">👥</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink mb-2">Community</h3>
                  <p className="text-sm text-teal-700 mb-4">Connect with other scout families and leadership</p>
                  <div className="bg-moss/10 text-moss px-3 py-1 rounded-full text-sm font-medium">
                    Available after login
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* New Scout Parents Section */}
          <div className="bg-gradient-to-r from-moss/10 to-teal/10 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-display font-bold text-ink mb-4">
                  New to Scouting?
                </h3>
                <p className="text-lg text-teal-700 max-w-3xl mx-auto">
                  Pack 1703 welcomes new families! Here's what makes scouting special and how we support new families every step of the way.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Left Column - What We Offer */}
                <div className="space-y-6">
                  <div className="bg-white rounded-brand shadow-card border border-cloud p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-moss to-teal rounded-brand flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl">🌟</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-ink mb-2">Character & Values</h4>
                        <p className="text-sm text-teal-700">We build character through the Scout Law: trustworthy, loyal, helpful, friendly, courteous, kind, obedient, cheerful, thrifty, brave, clean, and reverent.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-brand shadow-card border border-cloud p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl">👨‍👩‍👧‍👦</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-ink mb-2">Family-Centered</h4>
                        <p className="text-sm text-teal-700">Cub Scouting is family scouting. Parents are our partners and participate in activities with their children.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-brand shadow-card border border-cloud p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal to-moss rounded-brand flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl">🏅</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-ink mb-2">Personal Growth</h4>
                        <p className="text-sm text-teal-700">Age-appropriate advancement program that builds confidence, leadership skills, and a sense of achievement.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Call to Action */}
                <div className="bg-gradient-to-br from-moss/5 to-teal/5 rounded-brand p-8 border border-moss/20">
                  <h4 className="text-xl font-semibold text-ink mb-4">Ready to Start Your Scouting Adventure?</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-moss rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">1</span>
                      </div>
                      <p className="text-sm text-teal-700">Request access to our portal to learn more about our pack</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-moss rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">2</span>
                      </div>
                      <p className="text-sm text-teal-700">Attend a pack meeting to see scouting in action</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-moss rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">3</span>
                      </div>
                      <p className="text-sm text-teal-700">Join our welcoming community and start the journey!</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-moss/20">
                    <p className="text-sm text-teal-700 mb-4">
                      <strong>Questions?</strong> Our leadership team is here to help new families get started. 
                      Just request access and we'll reach out to welcome you!
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 rounded-brand p-6 text-center">
                  <div className="w-12 h-12 bg-moss/10 rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-moss text-xl">📅</span>
                  </div>
                  <h4 className="font-semibold text-ink mb-2">Never Miss an Event</h4>
                  <p className="text-sm text-teal-700">Get reminders and RSVP to all pack activities through our portal</p>
                </div>
                <div className="bg-white/80 rounded-brand p-6 text-center">
                  <div className="w-12 h-12 bg-sun/10 rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-sun text-xl">📢</span>
                  </div>
                  <h4 className="font-semibold text-ink mb-2">Stay Connected</h4>
                  <p className="text-sm text-teal-700">Receive important announcements and updates directly</p>
                </div>
                <div className="bg-white/80 rounded-brand p-6 text-center">
                  <div className="w-12 h-12 bg-teal/10 rounded-brand flex items-center justify-center mx-auto mb-4">
                    <span className="text-teal text-xl">🤝</span>
                  </div>
                  <h4 className="font-semibold text-ink mb-2">Build Community</h4>
                  <p className="text-sm text-teal-700">Connect with other scout families and pack leadership</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-teal/5 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm text-teal-600 mb-2">
                <strong>Pack 1703</strong> - Building tomorrow's leaders through scouting adventures
              </p>
              <p className="text-sm text-teal-600">
                Secure sign-in with Google or email. By continuing, you agree to our{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="text-moss hover:text-moss-600 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="text-moss hover:text-moss-600 font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Account Request Modal */}
        <AccountRequestModal
          isOpen={showAccountRequestModal}
          onClose={() => setShowAccountRequestModal(false)}
          onSuccess={(requestId) => {
            console.log('Account request submitted:', requestId);
            setShowAccountRequestModal(false);
          }}
        />

        {/* Password Reset Modal */}
        {showResetPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-brand p-6 w-full max-w-md shadow-card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-ink">Reset Password</h3>
                <button
                  onClick={handleCloseResetPassword}
                  className="text-teal-400 hover:text-teal-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-teal-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-cloud rounded-md focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors duration-200"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {resetMessage && (
                  <div className={`p-3 rounded-xl ${
                    resetMessage.includes('sent') 
                      ? 'bg-moss/10 border border-moss/20 text-moss' 
                      : 'bg-teal/10 border border-teal/20 text-teal'
                  }`}>
                    <p className="text-sm">{resetMessage}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseResetPassword}
                    className="flex-1 px-4 py-2 border border-cloud text-teal bg-white hover:bg-fog transition-colors rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 bg-moss text-white rounded-md hover:bg-moss-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Email Sign-In Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-brand p-6 w-full max-w-md shadow-card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-ink">Sign in with Email</h3>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-teal-400 hover:text-teal-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <SocialLogin 
                onSuccess={() => {
                  console.log('Authentication successful');
                  setShowEmailModal(false);
                }}
                onError={(error: string) => {
                  console.error('Authentication error:', error);
                }}
                showEmailOption={true}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // User is authenticated, allow access
  return <>{children}</>;
};

export default AuthGuard;
