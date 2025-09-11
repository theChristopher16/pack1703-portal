// Service Worker for Pack 1703 Families Portal
// TEMPORARILY DISABLED FOR CACHE DEBUGGING
// Updated: 2025-09-10T22:25:00Z

// Completely disable caching for debugging
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event - DISABLED');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event - DISABLED');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Service Worker: Deleting ALL caches:', cacheName);
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
  console.log('Service Worker: Fetch event - BYPASSING CACHE');
  event.respondWith(
    fetch(event.request).catch(() => {
      // Only fallback for navigation requests
      if (event.request.destination === 'document') {
        return caches.match('/');
      }
    })
  );
});