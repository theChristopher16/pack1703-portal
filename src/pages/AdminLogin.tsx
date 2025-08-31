import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { Home, LogIn } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const { login, state } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { error, isLoading, isAuthenticated } = state;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/admin', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-secondary-50/30 py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-8">
          <Link
            to="/"
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg text-gray-700 hover:text-primary-600 hover:bg-white/90 transition-all duration-200 shadow-soft"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          
          <Link
            to="/admin"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 shadow-soft"
          >
            <LogIn className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Portal</span>
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            <span className="text-rainbow-animated">Admin Login</span>
          </h1>
          <p className="text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-rainbow"
                placeholder="admin@pack1703.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-rainbow"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">
                <h3 className="font-medium">Error</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Demo credentials: admin@pack1703.com / any password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
