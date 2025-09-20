// Service Worker for Pack 1703 Families Portal
// Implements proper cache invalidation and update handling
// Updated: 2025-01-27

const CACHE_NAME = 'pack1703-portal-v1';
const STATIC_CACHE_NAME = 'pack1703-static-v1';
const DYNAMIC_CACHE_NAME = 'pack1703-dynamic-v1';

// Production-friendly logging
const isDevelopment = false;

function log(message, ...args) {
  if (isDevelopment) {
    console.log(`[SW] ${message}`, ...args);
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  log('Service Worker: Install event');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets (JS, CSS with hashed names)
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css',
          '/manifest.json'
        ]).catch((error) => {
          log('Failed to cache static assets:', error);
        });
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  log('Service Worker: Activate event');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ]).then(() => {
      // Notify all clients that the service worker is ready
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Service worker activated and ready'
          });
        });
      });
    })
  );
});

// Fetch event - implement cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Strategy: Cache First for static assets, Network First for dynamic content
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isDynamicContent(request)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache First strategy for static assets (JS, CSS with hashes)
function cacheFirst(request) {
  return caches.match(request).then((response) => {
    if (response) {
      log('Cache First: Serving from cache:', request.url);
      return response;
    }
    
    return fetch(request).then((response) => {
      // Only cache successful responses
      if (response.status === 200) {
        const responseClone = response.clone();
        caches.open(STATIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    });
  });
}

// Network First strategy for dynamic content
function networkFirst(request) {
  return fetch(request).then((response) => {
    // Cache successful responses
    if (response.status === 200) {
      const responseClone = response.clone();
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return response;
  }).catch(() => {
    // Fallback to cache if network fails
    return caches.match(request).then((response) => {
      if (response) {
        log('Network First: Serving from cache fallback:', request.url);
        return response;
      }
      // Return offline page for navigation requests
      if (request.destination === 'document') {
        return caches.match('/');
      }
      throw new Error('No cache available');
    });
  });
}

// Stale While Revalidate strategy for other content
function staleWhileRevalidate(request) {
  return caches.match(request).then((cachedResponse) => {
    const fetchPromise = fetch(request).then((response) => {
      if (response.status === 200) {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return response;
    });
    
    // Return cached version immediately, update in background
    return cachedResponse || fetchPromise;
  });
}

// Helper functions to determine content type
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  );
}

function isDynamicContent(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('firebase') ||
    url.pathname.includes('googleapis') ||
    url.pathname === '/version.json'
  );
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      log('Service Worker: Received skip waiting message');
      self.skipWaiting();
      break;
      
    case 'CHECK_VERSION':
      log('Service Worker: Checking version');
      checkVersionUpdate();
      break;
      
    case 'CLEAR_CACHE':
      log('Service Worker: Clearing all caches');
      clearAllCaches();
      break;
      
    default:
      log('Service Worker: Unknown message type:', type);
  }
});

// Check for version updates
async function checkVersionUpdate() {
  try {
    const response = await fetch('/version.json?t=' + Date.now());
    const versionInfo = await response.json();
    
    // Compare with stored version
    const storedVersion = await getStoredVersion();
    
    if (storedVersion && storedVersion.buildTime !== versionInfo.buildTime) {
      log('Service Worker: New version detected');
      
      // Notify all clients about the update
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: 'VERSION_UPDATE_AVAILABLE',
          version: versionInfo,
          storedVersion: storedVersion
        });
      });
    }
    
    // Store current version
    await storeVersion(versionInfo);
  } catch (error) {
    log('Service Worker: Failed to check version:', error);
  }
}

// Store version info in IndexedDB
async function storeVersion(versionInfo) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['versions'], 'readwrite');
    const store = transaction.objectStore('versions');
    await store.put(versionInfo, 'current');
  } catch (error) {
    log('Service Worker: Failed to store version:', error);
  }
}

// Get stored version info
async function getStoredVersion() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['versions'], 'readonly');
    const store = transaction.objectStore('versions');
    return await store.get('current');
  } catch (error) {
    log('Service Worker: Failed to get stored version:', error);
    return null;
  }
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pack1703-sw', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('versions')) {
        db.createObjectStore('versions');
      }
    };
  });
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    log('Service Worker: All caches cleared');
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'CACHE_CLEARED',
        message: 'All caches have been cleared'
      });
    });
  } catch (error) {
    log('Service Worker: Failed to clear caches:', error);
  }
}

log('Service Worker: Script loaded');