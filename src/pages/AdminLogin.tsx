import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Shield, User, Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import SocialLogin from '../components/Auth/SocialLogin';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRootSetup, setShowRootSetup] = useState(false);
  const [isCheckingRoot, setIsCheckingRoot] = useState(true);

  useEffect(() => {
    // Check if root account exists
    checkRootAccount();
  }, []);

  const checkRootAccount = async () => {
    try {
      // Check if any root users exist in Firestore
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const rootUsersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'root')
      );
      const rootUsersSnapshot = await getDocs(rootUsersQuery);
      
      if (rootUsersSnapshot.empty) {
        setShowRootSetup(true);
      }
    } catch (error) {
      console.error('Error checking root account:', error);
      // If we can't check, assume root setup is needed
      setShowRootSetup(true);
    } finally {
      setIsCheckingRoot(false);
    }
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
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await authService.signIn(formData.email, formData.password);
      
      // Redirect based on user role
      if (user.role === 'root') {
        navigate('/admin');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'den_leader' || user.role === 'star_volunteer') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRootSetupComplete = () => {
    setShowRootSetup(false);
  };

  const handleSocialLoginSuccess = (user: any) => {
    // Redirect based on user role
    if (user.role === 'root') {
      navigate('/admin');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'den_leader' || user.role === 'cubmaster') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleSocialLoginError = (error: string) => {
    console.error('Social login error:', error);
  };

  if (isCheckingRoot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking system setup...</p>
        </div>
      </div>
    );
  }

  if (showRootSetup) {
    // Import and render RootAccountLinker component
    const RootAccountLinker = require('../components/Auth/RootAccountLinker').default;
    return <RootAccountLinker onSetupComplete={handleRootSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Login
          </h2>
          <p className="text-gray-600">
            Sign in to access the Pack 1703 Portal admin panel
          </p>
        </div>

        {/* Social Login */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-soft p-8">
          <SocialLogin 
            onSuccess={handleSocialLoginSuccess}
            onError={handleSocialLoginError}
            showEmailOption={true}
            className="mb-6"
          />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                placeholder="Enter your email address"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline w-4 h-4 mr-1" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                const email = prompt('Enter your email address to reset your password:');
                if (email) {
                  authService.sendPasswordResetEmail(email)
                    .then(() => alert('Password reset email sent! Check your inbox.'))
                    .catch(error => alert('Error sending reset email: ' + error.message));
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
        </div>

        {/* Role Information */}
        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Access Levels
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li><strong>Root:</strong> Full system control and user management</li>
              <li><strong>Admin:</strong> Content and system management</li>
              <li><strong>Den Leader:</strong> Den-specific content and events</li>
              <li><strong>Cubmaster:</strong> Pack-wide content and events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
