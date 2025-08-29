import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const PWATest: React.FC = () => {
  const [pwaStatus, setPwaStatus] = useState<{
    serviceWorker: boolean;
    manifest: boolean;
    installable: boolean;
    offline: boolean;
  }>({
    serviceWorker: false,
    manifest: false,
    installable: false,
    offline: false
  });

  useEffect(() => {
    // Check PWA features
    const checkPWAFeatures = async () => {
      // Check service worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      // Check manifest
      const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
      
      // Check if installable
      const isInstallable = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
      
      // Check offline capability
      const hasOffline = 'onLine' in navigator;

      setPwaStatus({
        serviceWorker: hasServiceWorker,
        manifest: hasManifest,
        installable: isInstallable,
        offline: hasOffline
      });
    };

    checkPWAFeatures();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusText = (status: boolean) => {
    return status ? 'Working' : 'Not Available';
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200/50 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Info className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">PWA Status Check</h2>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Service Worker</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(pwaStatus.serviceWorker)}
            <span className={`text-sm ${pwaStatus.serviceWorker ? 'text-green-600' : 'text-red-600'}`}>
              {getStatusText(pwaStatus.serviceWorker)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Web Manifest</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(pwaStatus.manifest)}
            <span className={`text-sm ${pwaStatus.manifest ? 'text-green-600' : 'text-red-600'}`}>
              {getStatusText(pwaStatus.manifest)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Installable</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(pwaStatus.installable)}
            <span className={`text-sm ${pwaStatus.installable ? 'text-green-600' : 'text-red-600'}`}>
              {getStatusText(pwaStatus.installable)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Offline Support</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(pwaStatus.offline)}
            <span className={`text-sm ${pwaStatus.offline ? 'text-green-600' : 'text-red-600'}`}>
              {getStatusText(pwaStatus.offline)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Tip:</strong> To test PWA features, try adding this app to your home screen or check the browser's "Install" option.
        </p>
      </div>
    </div>
  );
};

export default PWATest;
