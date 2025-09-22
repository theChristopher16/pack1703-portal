import React, { useState } from 'react';
import { authService, SocialProvider } from '../../services/authService';
import { 
  Mail,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

interface SocialLoginProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  showEmailOption?: boolean;
  className?: string;
  inviteEmail?: string; // Add invite email prop
}

const SocialLogin: React.FC<SocialLoginProps> = ({ 
  onSuccess, 
  onError, 
  showEmailOption = false,
  className = '',
  inviteEmail = ''
}) => {
  const [isLoading, setIsLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    email: inviteEmail,
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handleSocialLogin = async (provider: SocialProvider) => {
    setIsLoading(provider);
    setError(null);

    try {
      // Use modern authentication flow (popup with redirect fallback)
      const user = await authService.signInWithSocial(provider);
      onSuccess?.(user);
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      
      // Handle redirect in progress
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        // Show loading state while redirect happens
        setError('Redirecting to sign in...');
        return; // Don't clear loading state, let redirect handle it
      }
      
      let errorMessage = error.message || `Failed to sign in with ${provider}`;
      
      // Provide more helpful error messages for common issues
      if (error.message?.includes('Popup blocked')) {
        errorMessage = 'Popup blocked by browser. Using redirect instead...';
      } else if (error.message?.includes('cancelled')) {
        errorMessage = 'Login cancelled. Please try again if you want to sign in.';
      } else if (error.message?.includes('account-exists-with-different-credential')) {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      // Only clear loading if not redirecting
      if (error?.message !== 'REDIRECT_IN_PROGRESS') {
        setIsLoading(null);
      }
    }
  };

  const handleEmailRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailForm.password !== emailForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (emailForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsCreatingAccount(true);
    setError(null);

    try {
      // Create user with email and password
      const user = await authService.createUserWithEmail(
        emailForm.email,
        emailForm.password,
        emailForm.displayName
      );
      
      setShowEmailModal(false);
      onSuccess?.(user);
    } catch (error: any) {
      console.error('Error creating account:', error);
      setError(error.message || 'Failed to create account');
      onError?.(error.message || 'Failed to create account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const socialProviders = [
    {
      provider: SocialProvider.GOOGLE,
      name: 'Google',
      label: 'Sign in with Google',
      className: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm hover:shadow-md font-medium',
      disabled: isLoading !== null && isLoading !== SocialProvider.GOOGLE
    }
  ];

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {socialProviders.map(({ provider, name, label, className: buttonClassName, disabled }) => (
            <button
              key={provider}
              onClick={() => handleSocialLogin(provider)}
              disabled={disabled}
              className={`
                w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium
                border transition-all duration-200 transform hover:scale-[1.02]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                shadow-sm hover:shadow-md ${buttonClassName}
              `}
            >
                {isLoading === provider ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center">
                    {provider === SocialProvider.GOOGLE && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                  </div>
                )}
                <span className="font-medium">
                  {isLoading === provider ? `Signing in with ${name}...` : label}
                </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        {showEmailOption && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email Option */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium
                bg-white border border-gray-300 text-gray-700
                hover:bg-gray-50 hover:border-gray-400
                transition-all duration-200 transform hover:scale-[1.02]
                shadow-sm hover:shadow-md"
            >
              <Mail className="w-5 h-5" />
              <span>Sign up with Email</span>
            </button>
          </>
        )}

        {/* Modern Authentication Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            <strong>Modern Authentication:</strong> We'll try a popup first, then automatically use redirect if needed.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Email Registration Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Create Account</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEmailRegistration} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={emailForm.displayName}
                  onChange={(e) => setEmailForm({ ...emailForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a password"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={emailForm.confirmPassword}
                  onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingAccount}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialLogin;
