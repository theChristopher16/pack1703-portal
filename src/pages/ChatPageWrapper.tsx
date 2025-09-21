import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { UserRole } from '../services/authService';

const ChatPageWrapper: React.FC = () => {
  const { state } = useAdmin();
  const isAuthenticated = !!state.currentUser;
  const authLoading = state.isLoading;

  // Show loading spinner while authentication state is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the chat.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Render a simple chat placeholder for now
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat Coming Soon</h2>
        <p className="text-gray-600 mb-6">The chat feature is temporarily disabled while we fix some technical issues.</p>
        <p className="text-sm text-gray-500">You are logged in as: {state.currentUser?.email}</p>
      </div>
    </div>
  );
};

export default ChatPageWrapper;
