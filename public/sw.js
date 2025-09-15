// Service Worker for Pack 1703 Families Portal
// TEMPORARILY DISABLED FOR CACHE DEBUGGING
// Updated: 2025-09-10T22:25:00Z

// Production-friendly logging
const isDevelopment = false; // Service workers don't have access to process.env

function log(message, ...args) {
  if (isDevelopment) {
    console.log(`[SW] ${message}`, ...args);
  }
}

// Completely disable caching for debugging
self.addEventListener('install', (event) => {
  log('Service Worker: Install event - DISABLED');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  log('Service Worker: Activate event - DISABLED');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          log('Service Worker: Deleting ALL caches:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch from network, never cache
  log('Service Worker: Fetch event - BYPASSING CACHE');
  event.respondWith(
    fetch(event.request).catch(() => {
      // Only fallback for navigation requests
      if (event.request.destination === 'document') {
        return caches.match('/');
      }
    })
  );
});