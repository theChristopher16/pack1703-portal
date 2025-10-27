import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Shield, UserPlus, Key, Calendar, MapPin, Users, Leaf, Sun, Mountain, Heart } from 'lucide-react';
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
          <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md shadow-glow transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-forest-200/50 bg-gradient-to-r from-forest-50/50 to-ocean-50/50">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-solarpunk rounded-2xl flex items-center justify-center shadow-glow">
                <span className="text-white text-2xl">🌱</span>
              </div>
              <div>
                <h2 className="text-2xl font-solarpunk-display font-bold text-forest-600">Welcome to Pack 1703!</h2>
                <p className="text-sm text-ocean-600">Solarpunk Scout Families Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-xl hover:bg-forest-100/50 transition-colors duration-200"
            >
              <X className="w-6 h-6 text-forest-600" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Side - Benefits */}
            <div className="p-8 bg-gradient-to-br from-forest-50/30 to-ocean-50/30">
              <div className="mb-8">
                <h3 className="text-xl font-solarpunk-display font-bold text-forest-600 mb-4">
                  Join Our Solarpunk Adventure
                </h3>
                <p className="text-forest-600 leading-relaxed mb-6">
                  Experience the future of scouting where sustainable technology meets outdoor adventure. 
                  Connect with your scout family and create lasting memories.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-forest-200/30">
                  <div className="w-12 h-12 bg-gradient-to-br from-forest-400 to-forest-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-solarpunk-display font-semibold text-forest-700 mb-1">Adventure Events</h4>
                    <p className="text-sm text-forest-600">Camping trips, eco-projects, and outdoor adventures that build character and environmental awareness.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-forest-200/30">
                  <div className="w-12 h-12 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-solarpunk-display font-semibold text-forest-700 mb-1">Community Connection</h4>
                    <p className="text-sm text-forest-600">Connect with fellow scout families, share experiences, and build lifelong friendships.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-forest-200/30">
                  <div className="w-12 h-12 bg-gradient-to-br from-solar-400 to-solar-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-solarpunk-display font-semibold text-forest-700 mb-1">Eco-Conscious Learning</h4>
                    <p className="text-sm text-forest-600">Learn about sustainability, renewable energy, and environmental stewardship through hands-on projects.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-forest-200/30">
                  <div className="w-12 h-12 bg-gradient-to-br from-terracotta-400 to-terracotta-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-solarpunk-display font-semibold text-forest-700 mb-1">Character Building</h4>
                    <p className="text-sm text-forest-600">Develop leadership skills, responsibility, and values that will guide your scout throughout life.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-8">

            {/* Social Login */}
            <div className="mb-6">
              <h4 className="text-lg font-solarpunk-display font-semibold text-forest-600 mb-4 text-center">
                Sign In to Continue
              </h4>
              <SocialLogin
                onSuccess={handleSocialLoginSuccess}
                onError={handleSocialLoginError}
                showEmailOption={false}
                className="mb-6"
              />
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-forest-200/50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-forest-500 font-medium">or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-solarpunk-display font-semibold text-forest-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-forest-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-4 py-4 border border-forest-200 rounded-xl focus:ring-2 focus:ring-forest-400/20 focus:border-forest-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-solarpunk-display font-semibold text-forest-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-forest-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-14 py-4 border border-forest-200 rounded-xl focus:ring-2 focus:ring-forest-400/20 focus:border-forest-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-forest-400 hover:text-forest-600 transition-colors duration-200" />
                    ) : (
                      <Eye className="h-5 w-5 text-forest-400 hover:text-forest-600 transition-colors duration-200" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleOpenResetPassword}
                  className="text-sm text-ocean-600 hover:text-ocean-700 font-medium transition-colors duration-200"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-solar-50 border border-solar-200 rounded-xl">
                  <p className="text-sm text-solar-800 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full solarpunk-btn-primary py-4 text-lg font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Shield className="w-5 h-5" />
                    <span>Sign In to Pack 1703</span>
                  </div>
                )}
              </button>
            </form>

            {/* Reset Password Form */}
            {showResetPassword && (
              <div className="mt-8 p-6 bg-gradient-to-br from-ocean-50/50 to-sky-50/50 rounded-2xl border border-ocean-200/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-ocean-400 to-ocean-600 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-solarpunk-display font-semibold text-forest-700">Reset Password</h3>
                </div>
                
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label htmlFor="resetEmail" className="block text-sm font-solarpunk-display font-semibold text-forest-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-forest-400" />
                      </div>
                      <input
                        id="resetEmail"
                        name="resetEmail"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 border border-forest-200 rounded-xl focus:ring-2 focus:ring-forest-400/20 focus:border-forest-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  {/* Reset Message */}
                  {resetMessage && (
                    <div className={`p-4 rounded-xl ${
                      resetMessage.includes('sent') 
                        ? 'bg-ocean-50 border border-ocean-200' 
                        : 'bg-solar-50 border border-solar-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        resetMessage.includes('sent') 
                          ? 'text-ocean-800' 
                          : 'text-solar-800'
                      }`}>
                        {resetMessage}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="flex-1 py-3 px-4 border border-forest-200 text-forest-600 hover:bg-forest-50 rounded-xl transition-colors duration-200 font-medium"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 solarpunk-btn-solar py-3"
                    >
                      {resetLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Send Reset Email</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-forest-500 mb-4">
                By signing in, you agree to our{' '}
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/privacy');}} className="text-ocean-600 hover:text-ocean-700 font-medium transition-colors duration-200">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="#" onClick={(e)=>{e.preventDefault(); navigate('/terms');}} className="text-ocean-600 hover:text-ocean-700 font-medium transition-colors duration-200">
                  Terms of Service
                </a>
              </p>
              
              {/* Account Request Link */}
              <div className="border-t border-forest-200/50 pt-4">
                <p className="text-sm text-forest-600 mb-3">
                  Don't have an account?
                </p>
                <p className="text-xs text-forest-500 text-center">
                  Contact pack leadership to request account access
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>        </div>
      </div>
      
    </>
  );
};

export default LoginModal;
