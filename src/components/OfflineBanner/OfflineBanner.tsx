import React, { useState, useEffect } from 'react';
import { offlineService } from '../../services/offlineService';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!offlineService.getOnlineStatus());
  const [queuedActions, setQueuedActions] = useState(0);

  useEffect(() => {
    // Subscribe to offline status changes
    const cleanup = offlineService.onStatusChange((isOnline) => {
      setIsOffline(!isOnline);
    });

    // Update queued actions count
    const updateQueuedActions = () => {
      setQueuedActions(offlineService.getQueuedActions().length);
    };
    updateQueuedActions();

    // Check queued actions periodically
    const interval = setInterval(updateQueuedActions, 2000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center font-medium shadow-md">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>
          You're currently offline. Some features may be limited.
          {queuedActions > 0 && (
            <span className="ml-2 font-semibold">
              ({queuedActions} action{queuedActions !== 1 ? 's' : ''} queued)
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
