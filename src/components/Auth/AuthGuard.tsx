import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import SocialLogin from './SocialLogin';
import AccountRequestModal from './AccountRequestModal';
import { UserPlus, Key } from 'lucide-react';
import { authService } from '../../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { state } = useAdmin();
  const location = useLocation();
  const { currentUser, isLoading } = state;
  const [showAccountRequestModal, setShowAccountRequestModal] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Pack 1703 Portal
              </h2>
              <p className="text-gray-600 mb-8">
                Please sign in to access the pack portal
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <SocialLogin 
                onSuccess={() => {
                  // Authentication success will be handled by AdminContext
                  console.log('Authentication successful');
                }}
                onError={(error: string) => {
                  console.error('Authentication error:', error);
                }}
                showEmailOption={true}
              />
            </div>

            {/* Password Reset Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Forgot your password?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email to receive a reset link
                </p>
              </div>
              
              <button
                onClick={handleOpenResetPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Key className="w-5 h-5" />
                Reset Password
              </button>
            </div>

            {/* Account Request Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Don't have an account?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Request access to join Pack 1703
                </p>
              </div>
              
              <button
                onClick={() => setShowAccountRequestModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <UserPlus className="w-5 h-5" />
                Request Account Access
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Having trouble signing in? Contact your pack leadership for assistance.
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
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Reset Password</h3>
                <button
                  onClick={handleCloseResetPassword}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                {resetMessage && (
                  <div className={`p-3 rounded-xl ${
                    resetMessage.includes('sent') 
                      ? 'bg-green-50 border border-green-200 text-green-600' 
                      : 'bg-red-50 border border-red-200 text-red-600'
                  }`}>
                    <p className="text-sm">{resetMessage}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseResetPassword}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // User is authenticated
  const isSuper = state.currentUser?.role === 'super_admin' || state.currentUser?.role === 'root' || state.currentUser?.role === 'super-admin';
  if (isSuper) {
    // If a default tenant is set and we're on home, go straight to that tenant
    const defaultTenantSlug = localStorage.getItem('defaultTenantSlug');
    if (location.pathname === '/' && defaultTenantSlug) {
      return <Navigate to={`/${defaultTenantSlug}/`} replace />;
    }
    // If no default and we're on home, send to tenant management (admin entry)
    if (location.pathname === '/') {
      return <Navigate to="/multi-tenant" replace />;
    }
  }
  return <>{children}</>;
};

export default AuthGuard;
