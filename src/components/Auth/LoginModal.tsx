import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Shield, UserPlus, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import SocialLogin from './SocialLogin';
import { useRecaptcha } from '../../hooks/useRecaptcha';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Initialize reCAPTCHA
  const { isLoaded: recaptchaLoaded, execute: executeRecaptcha } = useRecaptcha({
    action: 'login',
    autoExecute: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Execute reCAPTCHA verification
      if (recaptchaLoaded) {
        const recaptchaResult = await executeRecaptcha('login');
        if (!recaptchaResult.isValid) {
          setError('Security verification failed. Please try again.');
          return;
        }
      }

      const user = await authService.signIn(formData.email, formData.password);
      onSuccess?.(user);
      onClose();
      
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLoginSuccess = (user: any) => {
    onSuccess?.(user);
    onClose();
  };

  const handleSocialLoginError = (error: string) => {
    setError(error);
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
    setError(null);
  };

  const handleBackToLogin = () => {
    setShowResetPassword(false);
    setResetEmail('');
    setResetMessage(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg transform overflow-hidden rounded-brand bg-white shadow-card transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cloud">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-brand rounded-brand flex items-center justify-center shadow-card">
                <span className="text-white text-xl">🏕️</span>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-ink">Welcome Back!</h2>
                <p className="text-sm text-teal-700">Pack 1703 Scout Families Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-fog transition-colors duration-200"
            >
              <X className="w-5 h-5 text-teal-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Welcome Message */}
            <div className="mb-6 text-center">
              <p className="text-teal-700 text-sm leading-relaxed">
                Access events, announcements, RSVPs, and connect with your scout family community.
              </p>
            </div>

            {/* Social Login */}
            <SocialLogin
              onSuccess={handleSocialLoginSuccess}
              onError={handleSocialLoginError}
              showEmailOption={false}
              className="mb-6"
            />

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cloud" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-teal-500">or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-teal-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-teal-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-cloud rounded-md focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-teal-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-teal-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-cloud rounded-md focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-teal-400 hover:text-teal-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-teal-400 hover:text-teal-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleOpenResetPassword}
                  className="text-sm text-moss hover:text-moss-600 font-medium transition-colors duration-200"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-teal/10 border border-teal/20 rounded-xl">
                  <p className="text-sm text-teal">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-moss hover:bg-moss-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moss disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Sign In</span>
                  </div>
                )}
              </button>
            </form>

            {/* Reset Password Form */}
            {showResetPassword && (
              <div className="mt-6 p-4 bg-fog rounded-brand border border-cloud">
                <div className="flex items-center space-x-2 mb-4">
                  <Key className="w-5 h-5 text-moss" />
                  <h3 className="text-lg font-semibold text-ink">Reset Password</h3>
                </div>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-teal-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-teal-400" />
                      </div>
                      <input
                        id="resetEmail"
                        name="resetEmail"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-cloud rounded-md focus:ring-2 focus:ring-moss/20 focus:border-moss transition-colors duration-200"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {/* Reset Message */}
                  {resetMessage && (
                    <div className={`p-3 rounded-xl ${
                      resetMessage.includes('sent') 
                        ? 'bg-moss/10 border border-moss/20' 
                        : 'bg-teal/10 border border-teal/20'
                    }`}>
                      <p className={`text-sm ${
                        resetMessage.includes('sent') 
                          ? 'text-moss' 
                          : 'text-teal'
                      }`}>
                        {resetMessage}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="flex-1 py-2 px-4 border border-cloud rounded-md text-sm font-medium text-teal bg-white hover:bg-fog focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moss transition-colors duration-200"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-moss hover:bg-moss-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-moss disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {resetLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Send Reset Email'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-teal-600 mb-4">
                By signing in, you agree to our{' '}
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/privacy');}} className="text-moss hover:text-moss-600 font-medium">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/terms');}} className="text-moss hover:text-moss-600 font-medium">
                  Terms of Service
                </a>
              </p>
              
              {/* Account Request Link */}
              <div className="border-t border-cloud pt-4">
                <p className="text-sm text-teal-700 mb-3">
                  Don't have an account?
                </p>
                <p className="text-xs text-teal-600 text-center">
                  Contact pack leadership to request account access
                </p>
              </div>
            </div>
          </div>
        </div>        </div>
      </div>
      
    </>
  );
};

export default LoginModal;
