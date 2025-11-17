import React, { useState, useEffect } from 'react';
import { offlineService, ConnectivityStatus } from '../../services/offlineService';

const OfflineBanner: React.FC = () => {
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>(offlineService.getConnectivityStatus());
  const [queuedActions, setQueuedActions] = useState(0);
  const [queuedInternetActions, setQueuedInternetActions] = useState(0);

  useEffect(() => {
    // Subscribe to connectivity status changes
    const cleanupConnectivity = offlineService.onConnectivityChange((status) => {
      setConnectivity(status);
    });

    // Subscribe to offline status changes (backward compatibility)
    const cleanupStatus = offlineService.onStatusChange(() => {
      setConnectivity(offlineService.getConnectivityStatus());
    });

    // Update queued actions count
    const updateQueuedActions = () => {
      const actions = offlineService.getQueuedActions();
      setQueuedActions(actions.length);
      setQueuedInternetActions(actions.filter(a => a.requiresInternet).length);
    };
    updateQueuedActions();

    // Check queued actions periodically
    const interval = setInterval(updateQueuedActions, 2000);

    return () => {
      cleanupConnectivity();
      cleanupStatus();
      clearInterval(interval);
    };
  }, []);

  // Don't show banner if fully online
  if (connectivity.connectivityType === 'full') return null;

  // Determine banner color and message based on connectivity
  const getBannerConfig = () => {
    if (connectivity.connectivityType === 'local-only') {
      return {
        bgColor: 'bg-blue-500',
        textColor: 'text-blue-900',
        message: 'Local network only - some features may be limited',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        )
      };
    } else {
      return {
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-900',
        message: 'You\'re currently offline. Some features may be limited.',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      };
    }
  };

  const config = getBannerConfig();

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${config.bgColor} ${config.textColor} px-4 py-2 text-center font-medium shadow-md`}>
      <div className="flex items-center justify-center space-x-2">
        {config.icon}
        <span>
          {config.message}
          {queuedActions > 0 && (
            <span className="ml-2 font-semibold">
              ({queuedActions} action{queuedActions !== 1 ? 's' : ''} queued
              {queuedInternetActions > 0 && queuedInternetActions < queuedActions && (
                <span>, {queuedInternetActions} waiting for internet</span>
              )}
              )
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default OfflineBanner;
