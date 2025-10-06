import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, SocialProvider, UserRole } from '../../services/authService';
import { 
  Shield, Chrome, CheckCircle, AlertCircle, Loader2, Mail, Lock, Eye, EyeOff
} from 'lucide-react';

interface RootAccountLinkerProps {
  onSetupComplete: () => void;
}

const RootAccountLinker: React.FC<RootAccountLinkerProps> = ({ onSetupComplete }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSocialLogin = async (provider: SocialProvider) => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signInWithSocial(provider);
      if (user.role === UserRole.SUPER_ADMIN) {
        onSetupComplete();
      } else {
        setError('This account is not authorized as super admin. Please use a different account.');
      }
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      if (error.code === 'auth/operation-not-allowed') {
        setError(`Sign in with ${provider} is not enabled. Please enable it in Firebase Console or use email/password.`);
      } else {
        setError(`Failed to sign in with ${provider}: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailFormData.password !== emailFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (emailFormData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.createRootAccount(
        emailFormData.email,
        emailFormData.password,
        emailFormData.displayName
      );
      onSetupComplete();
    } catch (error: any) {
      console.error('Error creating root account:', error);
      setError(`Failed to create root account: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const socialProviders = [
    {
      provider: SocialProvider.GOOGLE,
      name: 'Google',
      icon: Chrome,
      description: 'Sign in with your Google account',
      className: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm hover:shadow-md font-medium'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Root Account Setup</h2>
          <p className="text-gray-600 mt-2">Choose your preferred sign-in method to create the root account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Social Login Options */}
        {!showEmailForm && (
          <div className="space-y-3">
            {socialProviders.map(({ provider, name, icon: Icon, description, className }) => (
              <button
                key={provider}
                onClick={() => handleSocialLogin(provider)}
                disabled={isLoading}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                  border transition-all duration-200 transform hover:scale-[1.02]
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  shadow-sm hover:shadow-md ${className}
                `}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span>
                  {isLoading ? `Signing in with ${name}...` : `Continue with ${name}`}
                </span>
              </button>
            ))}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email/Password Option */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                bg-white border border-gray-300 text-gray-700
                hover:bg-gray-50 hover:border-gray-400
                transition-all duration-200 transform hover:scale-[1.02]
                shadow-sm hover:shadow-md"
            >
              <Mail className="w-5 h-5" />
              <span>Create with Email & Password</span>
            </button>
          </div>
        )}

        {/* Email/Password Form */}
        {showEmailForm && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create Root Account</h3>
              <p className="text-sm text-gray-600">Set up your root account with email and password</p>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={emailFormData.displayName}
                  onChange={(e) => setEmailFormData({ ...emailFormData, displayName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={emailFormData.email}
                  onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailFormData.password}
                    onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={emailFormData.confirmPassword}
                  onChange={(e) => setEmailFormData({ ...emailFormData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Create Root Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Root Account Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Root Account Information</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Full system access and control</li>
            <li>• Can create and manage all user accounts</li>
            <li>• Can modify system settings and permissions</li>
            <li>• Only one root account allowed per system</li>
            <li>• Your social account will be linked permanently</li>
          </ul>
        </div>

        {/* Privacy Notice */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="text-blue-600 hover:text-blue-500 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RootAccountLinker;
