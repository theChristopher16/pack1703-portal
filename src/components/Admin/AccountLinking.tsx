import React, { useState } from 'react';
import { authService, SocialProvider } from '../../services/authService';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AccountLinkingProps {
  className?: string;
}

const AccountLinking: React.FC<AccountLinkingProps> = ({ className = '' }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.linkSocialAccount(SocialProvider.GOOGLE);
      setSuccess('Successfully linked your Google account!');
    } catch (error: any) {
      console.error('Error linking Google account:', error);
      
      if (error.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please enable it in Firebase Console.');
      } else if (error.code === 'auth/credential-already-in-use') {
        setError('This Google account is already linked to another user.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError(`Failed to link Google account: ${error.message}`);
      }
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Google Account</h2>
        <p className="text-gray-600">
          Link your Google account for easier sign-in and enhanced security.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Google Sign-In Button - Official Google Style */}
      <div className="flex justify-center">
        <button
          onClick={handleLinkGoogle}
          disabled={isLinking}
          className="
            inline-flex items-center justify-center gap-3 px-6 py-3 
            bg-white border border-gray-300 rounded-lg shadow-sm
            hover:shadow-md hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 transform hover:scale-[1.02]
            disabled:transform-none
            min-w-[240px]
          "
        >
          {isLinking ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span className="text-gray-700 font-medium text-sm">
            {isLinking ? 'Linking...' : 'Sign in with Google'}
          </span>
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 Benefits of Linking Google</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enhanced security with Google's authentication</li>
          <li>• Multiple sign-in methods for account recovery</li>
          <li>• Faster access to your account</li>
          <li>• Sync with your Google profile information</li>
        </ul>
      </div>

      {/* Setup Instructions */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-2">⚠️ Setup Required</h3>
        <p className="text-sm text-yellow-800 mb-2">
          If you see "operation-not-allowed" errors, you need to enable Google sign-in in Firebase Console.
        </p>
        <a 
          href="https://console.firebase.google.com/project/pack-1703-portal/authentication/providers"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-yellow-900 underline hover:text-yellow-700"
        >
          Open Firebase Console →
        </a>
      </div>
    </div>
  );
};

export default AccountLinking;
