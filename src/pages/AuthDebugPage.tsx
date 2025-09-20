import React, { useState, useEffect } from 'react';
import { authService, SocialProvider } from '../services/authService';
import { useAdmin } from '../contexts/AdminContext';

const AuthDebugPage: React.FC = () => {
  const { state } = useAdmin();
  const user = state.currentUser;
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (user) {
      const providers = authService.getLinkedProviders();
      setLinkedProviders(providers);
    }
  }, [user]);

  const handleUnlinkGoogle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      await authService.unlinkSocialAccount(SocialProvider.GOOGLE);
      setMessage('✅ Google account unlinked successfully!');
      
      // Refresh linked providers
      const providers = authService.getLinkedProviders();
      setLinkedProviders(providers);
    } catch (error: any) {
      setMessage(`❌ Error unlinking: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelinkGoogle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      await authService.relinkSocialAccount(SocialProvider.GOOGLE);
      setMessage('✅ Google account relinked successfully!');
      
      // Refresh linked providers
      const providers = authService.getLinkedProviders();
      setLinkedProviders(providers);
    } catch (error: any) {
      setMessage(`❌ Error relinking: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setMessage('');
    
    try {
      await authService.linkSocialAccount(SocialProvider.GOOGLE);
      setMessage('✅ Google account linked successfully!');
      
      // Refresh linked providers
      const providers = authService.getLinkedProviders();
      setLinkedProviders(providers);
    } catch (error: any) {
      setMessage(`❌ Error linking: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Auth Debug Page</h1>
          <p className="text-gray-600">Please log in to access this debug page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Auth Debug Page</h1>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Current User</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>

            {/* Linked Providers */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Linked Providers</h2>
              {linkedProviders.length > 0 ? (
                <ul className="space-y-1">
                  {linkedProviders.map((provider) => (
                    <li key={provider} className="text-green-600">✅ {provider}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No providers linked</p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Actions</h2>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleLinkGoogle}
                  disabled={isLoading || linkedProviders.includes('google.com')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Link Google
                </button>
                
                <button
                  onClick={handleUnlinkGoogle}
                  disabled={isLoading || !linkedProviders.includes('google.com')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unlink Google
                </button>
                
                <button
                  onClick={handleRelinkGoogle}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Relink Google
                </button>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>First, try <strong>Unlink Google</strong> to remove the current Google connection</li>
                <li>Then try <strong>Link Google</strong> to re-establish the connection</li>
                <li>Or use <strong>Relink Google</strong> to do both steps automatically</li>
                <li>After relinking, try the regular Google sign-in again</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPage;
