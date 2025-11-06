import React, { useState } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { authService, SocialProvider } from '../services/authService';
import SocialLogin from '../components/Auth/SocialLogin';
import { 
  TreePine, 
  Leaf, 
  Mountain, 
  Sun, 
  Wind,
  ArrowRight,
  Shield,
  Users,
  Heart,
  Sprout,
  X
} from 'lucide-react';

/**
 * CopseTestLogin - Test login page with Copse branding
 * A copse is a small grove or group of trees
 * 
 * This page showcases multi-tenant branding capabilities
 * Only accessible to super-admins for testing
 */
const CopseTestLogin: React.FC = () => {
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

  // Copse brand colors
  const copseBranding = {
    displayName: 'Copse Scout Collective',
    shortName: 'Copse',
    primaryColor: '#2D5016', // Deep forest green
    secondaryColor: '#8B4513', // Saddle brown
    accentColor: '#4A7C59', // Forest green
    lightColor: '#A8D5BA', // Light sage
    description: 'A community of scouts united by our love of nature and growth'
  };

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
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signIn(
        formData.email,
        formData.password
      );
      
      if (user) {
        console.log('Login successful, navigating to home...');
        navigate('/');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signInWithSocial(provider);
      if (user) {
        console.log('Social login successful, navigating to home...');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Social login error:', error);
      setError(error.message || 'An error occurred during social login');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      await authService.sendPasswordResetEmail(resetEmail);
      setResetMessage('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      setResetMessage(error.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowResetPassword(false);
    setResetEmail('');
    setResetMessage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating leaves */}
        <div className="absolute top-10 left-10 text-emerald-200 opacity-20 animate-float">
          <Leaf className="w-24 h-24" />
        </div>
        <div className="absolute top-40 right-20 text-green-200 opacity-20 animate-float-delayed">
          <TreePine className="w-32 h-32" />
        </div>
        <div className="absolute bottom-20 left-1/4 text-teal-200 opacity-20 animate-float">
          <Sprout className="w-28 h-28" />
        </div>
        <div className="absolute bottom-40 right-1/3 text-emerald-200 opacity-20 animate-float-delayed">
          <Mountain className="w-36 h-36" />
        </div>
        
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-green-200/30 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Test Environment Banner */}
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/90 backdrop-blur-md text-white rounded-xl shadow-lg border border-amber-400">
              <Shield className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">
                🧪 Test Environment - Super Admin Only
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side - Branding showcase */}
            <div className="bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 rounded-3xl p-12 text-white shadow-2xl backdrop-blur-md border border-emerald-400/30">
              <div className="space-y-8">
                {/* Logo area */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                    <TreePine className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold font-solarpunk-display tracking-tight">
                      {copseBranding.displayName}
                    </h1>
                    <p className="text-emerald-100 text-sm font-medium">
                      Growing Together in Nature
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Mission statement */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold font-solarpunk-display">
                    Welcome to Our Grove
                  </h2>
                  <p className="text-emerald-50 text-lg leading-relaxed">
                    {copseBranding.description}
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Community First</h3>
                      <p className="text-emerald-100 text-sm">
                        Building strong bonds through shared outdoor experiences
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Growth & Learning</h3>
                      <p className="text-emerald-100 text-sm">
                        Nurturing character development and outdoor skills
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Nature Connection</h3>
                      <p className="text-emerald-100 text-sm">
                        Fostering deep respect and love for the natural world
                      </p>
                    </div>
                  </div>
                </div>

                {/* Decorative element */}
                <div className="pt-6 flex items-center justify-center gap-4 text-emerald-200">
                  <TreePine className="w-8 h-8 opacity-50" />
                  <Wind className="w-6 h-6 opacity-50 animate-pulse" />
                  <Sun className="w-8 h-8 opacity-50" />
                  <Wind className="w-6 h-6 opacity-50 animate-pulse" />
                  <Mountain className="w-8 h-8 opacity-50" />
                </div>
              </div>
            </div>

            {/* Right side - Login form */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-200/50">
              {/* Header */}
              <div className="p-8 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-emerald-900 font-solarpunk-display">
                      {showResetPassword ? 'Reset Password' : 'Welcome Back'}
                    </h2>
                    <p className="text-emerald-600 mt-1">
                      {showResetPassword 
                        ? 'Enter your email to receive a reset link' 
                        : 'Sign in to access your scout portal'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="p-3 rounded-xl hover:bg-emerald-100 transition-colors duration-200"
                  >
                    <X className="w-6 h-6 text-emerald-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {!showResetPassword ? (
                  <>
                    {/* Social Login */}
                    <div>
                      <SocialLogin
                        onSuccess={() => navigate('/')}
                        onError={(error) => setError(error)}
                        showEmailOption={false}
                      />
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-emerald-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-emerald-600 font-medium">
                          Or continue with email
                        </span>
                      </div>
                    </div>

                    {/* Email Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                          {error}
                        </div>
                      )}

                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-emerald-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-emerald-900 placeholder-emerald-400"
                          placeholder="scout@copse.org"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-emerald-900 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-emerald-900 placeholder-emerald-400"
                            placeholder="Enter your password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 border-emerald-300 rounded focus:ring-emerald-500"
                          />
                          <span className="ml-2 text-sm text-emerald-700">Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(true)}
                          className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In to Copse</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center pt-4 border-t border-emerald-100">
                      <p className="text-sm text-emerald-600">
                        New to Copse?{' '}
                        <button className="font-semibold text-emerald-700 hover:text-emerald-900">
                          Contact your grove leader
                        </button>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Password Reset Form */}
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      {resetMessage && (
                        <div className={`p-4 rounded-xl text-sm ${
                          resetMessage.includes('sent')
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                          {resetMessage}
                        </div>
                      )}

                      <div>
                        <label htmlFor="resetEmail" className="block text-sm font-semibold text-emerald-900 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="resetEmail"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-emerald-900 placeholder-emerald-400"
                          placeholder="scout@copse.org"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {resetLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Send Reset Link</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="w-full py-3 text-emerald-700 hover:text-emerald-900 font-medium"
                      >
                        Back to Login
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-emerald-600">
              <strong>Note:</strong> This is a test page showcasing multi-tenant branding for the Copse organization.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(-5deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CopseTestLogin;

