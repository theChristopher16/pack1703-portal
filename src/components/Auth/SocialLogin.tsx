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
      const user = await authService.signInWithSocial(provider);
      onSuccess?.(user);
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      const errorMessage = error.message || `Failed to sign in with ${provider}`;
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(null);
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
      provider: SocialProvider.APPLE,
      name: 'Apple',
      label: 'Sign in with Apple',
      className: 'bg-black text-white hover:bg-gray-900 border-black shadow-sm hover:shadow-md font-medium',
      disabled: isLoading !== null && isLoading !== SocialProvider.APPLE
    },
    {
      provider: SocialProvider.GOOGLE,
      name: 'Google',
      label: 'Sign in with Google',
      className: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm hover:shadow-md font-medium',
      disabled: isLoading !== null && isLoading !== SocialProvider.GOOGLE
    },
    {
      provider: SocialProvider.FACEBOOK,
      name: 'Facebook',
      label: 'Continue with Facebook',
      className: 'bg-[#1877F2] text-white hover:bg-[#166FE5] border-[#1877F2] shadow-sm hover:shadow-md font-medium',
      disabled: isLoading !== null && isLoading !== SocialProvider.FACEBOOK
    },
    {
      provider: SocialProvider.GITHUB,
      name: 'GitHub',
      label: 'Sign in with GitHub',
      className: 'bg-[#24292e] text-white hover:bg-[#1a1e22] border-[#24292e] shadow-sm hover:shadow-md font-medium',
      disabled: isLoading !== null && isLoading !== SocialProvider.GITHUB
    },
    {
      provider: SocialProvider.TWITTER,
      name: 'Twitter',
      label: 'Sign in with Twitter',
      className: 'bg-[#1DA1F2] text-white hover:bg-[#1a91da] border-[#1DA1F2] shadow-sm hover:shadow-md font-medium',
      disabled: isLoading !== null && isLoading !== SocialProvider.TWITTER
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
                    {provider === SocialProvider.APPLE && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.024 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                      </svg>
                    )}
                    {provider === SocialProvider.GOOGLE && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {provider === SocialProvider.FACEBOOK && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    {provider === SocialProvider.GITHUB && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    {provider === SocialProvider.TWITTER && (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
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
