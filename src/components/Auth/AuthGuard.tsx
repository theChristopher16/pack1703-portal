import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import SocialLogin from './SocialLogin';
import AccountRequestModal from './AccountRequestModal';
import { UserPlus } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { state } = useAdmin();
  const { currentUser, isLoading } = state;
  const [showAccountRequestModal, setShowAccountRequestModal] = useState(false);

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
      </>
    );
  }

  // User is authenticated, render the app
  return <>{children}</>;
};

export default AuthGuard;
