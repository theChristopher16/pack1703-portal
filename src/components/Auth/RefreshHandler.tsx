import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface RefreshHandlerProps {
  children: React.ReactNode;
}

const RefreshHandler: React.FC<RefreshHandlerProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    const handleRefreshAuth = async () => {
      try {
        console.log('🔄 RefreshHandler: Checking authentication state on page load');
        
        // Check if there's a stored auth token (Firebase handles this automatically)
        // Firebase Auth persists authentication state across page refreshes
        const hasToken = authService.hasValidAuthToken();
        const currentUser = authService.getCurrentUser();
        
        if (hasToken && currentUser) {
          console.log('🔄 RefreshHandler: User has valid auth token, staying on current page:', location.pathname);
          // User is authenticated, they can stay on the current page
          setHasCheckedAuth(true);
          setIsCheckingAuth(false);
          return;
        }

        // Check if user has a token but needs re-authentication
        if (hasToken && !currentUser) {
          console.log('🔄 RefreshHandler: User has token but needs re-authentication, waiting for auth state...');
          // User has a token but the app user isn't loaded yet, wait for auth state
        } else {
          console.log('🔄 RefreshHandler: No auth token found, redirecting to homepage');
          // No token at all, redirect to homepage
          if (location.pathname !== '/') {
            navigate('/', { replace: true });
          }
          setHasCheckedAuth(true);
          setIsCheckingAuth(false);
          return;
        }

        // Wait for Firebase Auth to restore the session or determine if re-auth is needed
        console.log('🔄 RefreshHandler: Waiting for Firebase Auth to restore session...');
        
        // Wait for Firebase Auth to restore the session (up to 3 seconds)
        const authTimeout = setTimeout(() => {
          console.log('🔄 RefreshHandler: Auth timeout reached, redirecting to homepage');
          if (location.pathname !== '/') {
            navigate('/', { replace: true });
          }
          setHasCheckedAuth(true);
          setIsCheckingAuth(false);
        }, 3000);

        // Listen for auth state changes
        const unsubscribe = authService.onAuthStateChanged((user) => {
          clearTimeout(authTimeout);
          unsubscribe();
          
          if (user) {
            console.log('🔄 RefreshHandler: Firebase Auth restored session for user:', user.email);
            console.log('🔄 RefreshHandler: User can stay on current page:', location.pathname);
            // User was authenticated, they can stay on the current page
            setHasCheckedAuth(true);
            setIsCheckingAuth(false);
          } else {
            console.log('🔄 RefreshHandler: No authenticated user found after waiting');
            // Check if we originally had a token but it's now invalid
            if (hasToken) {
              console.log('🔄 RefreshHandler: Token was invalid/expired, user needs to sign in again');
              // User had a token but it's invalid, they need to sign in again
              // They can stay on the current page and will be prompted to sign in
              setHasCheckedAuth(true);
              setIsCheckingAuth(false);
            } else {
              console.log('🔄 RefreshHandler: No token, redirecting to homepage');
              // No token at all, redirect to homepage
              if (location.pathname !== '/') {
                navigate('/', { replace: true });
              }
              setHasCheckedAuth(true);
              setIsCheckingAuth(false);
            }
          }
        });

      } catch (error) {
        console.error('🔄 RefreshHandler: Error checking authentication:', error);
        // On error, redirect to homepage
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
        setHasCheckedAuth(true);
        setIsCheckingAuth(false);
      }
    };

    // Only run this check once per page load
    if (!hasCheckedAuth) {
      handleRefreshAuth();
    }
  }, [location.pathname, navigate, hasCheckedAuth]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow mx-auto mb-4">
            <span className="text-white text-2xl">🏕️</span>
          </div>
          <h2 className="text-xl font-display font-semibold text-gray-800 mb-2">
            Checking Authentication...
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your login status.
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RefreshHandler;