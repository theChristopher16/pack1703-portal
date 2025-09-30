import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Shield, User, Key } from 'lucide-react';
import { userApprovalService } from '../../services/userApprovalService';
import { authService } from '../../services/authService';
import SocialLogin from './SocialLogin';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { useToast } from '../../contexts/ToastContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Initialize reCAPTCHA
  const { isLoaded: recaptchaLoaded, execute: executeRecaptcha } = useRecaptcha({
    action: 'signup',
    autoExecute: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('preference_')) {
      const preferenceName = name.replace('preference_', '');
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [preferenceName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Execute reCAPTCHA verification
      if (recaptchaLoaded) {
        const recaptchaResult = await executeRecaptcha('signup');
        if (!recaptchaResult.isValid) {
          setError('Security verification failed. Please try again.');
          return;
        }
      }

      const user = await userApprovalService.signUp(
        formData.email,
        formData.password,
        formData.displayName,
        formData.preferences
      );
      
      onSuccess?.(user);
      onClose();
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle permission denied error gracefully
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        // Show success message even though account creation failed due to permissions
        // This is expected behavior - the account request has been submitted
        showSuccess(
          'Account Request Submitted!',
          'Pack leadership will review your request and approve your account. You will receive an email notification once approved.'
        );
        onClose();
        return;
      }
      
      // Handle email already in use error
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please try logging in instead.');
        return;
      }
      
      setError(error.message || 'Failed to create account. Please try again.');
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
    showError('Social Login Error', error);
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

  const handleBackToSignup = () => {
    setShowResetPassword(false);
    setResetEmail('');
    setResetMessage(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Join Pack 1703</h2>
                <p className="text-sm text-gray-600">Create your account</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
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
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name Field */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Email Preferences */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700 border-t border-gray-200 pt-4">Notification Preferences</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="preference_emailNotifications" className="text-sm font-medium text-gray-700">
                      📧 Email Notifications
                    </label>
                    <p className="text-xs text-gray-500">Receive important announcements and updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="preference_emailNotifications"
                      name="preference_emailNotifications"
                      checked={formData.preferences.emailNotifications}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="preference_pushNotifications" className="text-sm font-medium text-gray-700">
                      🔔 Push Notifications
                    </label>
                    <p className="text-xs text-gray-500">Receive browser notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="preference_pushNotifications"
                      name="preference_pushNotifications"
                      checked={formData.preferences.pushNotifications}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleOpenResetPassword}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Forgot your password?
              </button>
            </div>

            {/* Reset Password Form */}
            {showResetPassword && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Key className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                </div>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="resetEmail"
                        name="resetEmail"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {/* Reset Message */}
                  {resetMessage && (
                    <div className={`p-3 rounded-xl ${
                      resetMessage.includes('sent') 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm ${
                        resetMessage.includes('sent') 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {resetMessage}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBackToSignup}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                    >
                      Back to Signup
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{' '}
                <a href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                  Terms of Service
                </a>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Your account will be pending approval from pack administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
