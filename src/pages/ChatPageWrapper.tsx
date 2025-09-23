import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import ChatPageOptimized from './ChatPageOptimized';

const ChatPageWrapper: React.FC = () => {
  const { state } = useAdmin();
  const isAuthenticated = !!state.currentUser;

  // REMOVED LOADING CHECK - This was causing redirects
  // The AuthGuard already handles authentication, so we don't need to check again
  
  // Show login prompt if not authenticated (shouldn't happen due to AuthGuard)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">There was an issue with authentication. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Render the actual chat interface
  return <ChatPageOptimized />;
};

export default ChatPageWrapper;
