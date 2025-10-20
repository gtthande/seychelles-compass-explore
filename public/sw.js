/**
 * Service Worker for Offline Map Tile Caching
 * Caches OpenStreetMap tiles for offline use
 */

const CACHE_NAME = 'map-tiles-v1';
const TILE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - intercept tile requests and cache them
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle tile requests
  if (url.pathname.includes('/tiles/') || url.pathname.includes('/osm/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            // Check if cached tile is still fresh (within 7 days)
            const cacheTime = response.headers.get('sw-cache-time');
            if (cacheTime && Date.now() - parseInt(cacheTime) < TILE_CACHE_DURATION) {
              console.log('Service Worker: Serving cached tile:', url.pathname);
              return response;
            }
          }
          
          // Fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              // Clone the response to cache it
              const responseToCache = networkResponse.clone();
              
              // Add cache timestamp header
              const headers = new Headers(responseToCache.headers);
              headers.set('sw-cache-time', Date.now().toString());
              
              const cachedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              });
              
              cache.put(event.request, cachedResponse);
              console.log('Service Worker: Cached new tile:', url.pathname);
            }
            
            return networkResponse;
          }).catch(() => {
            // Network failed, try to serve stale cache
            return cache.match(event.request).then((staleResponse) => {
              if (staleResponse) {
                console.log('Service Worker: Serving stale tile:', url.pathname);
                return staleResponse;
              }
              
              // No cache available, return a placeholder or error
              return new Response('Tile not available offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
          });
        });
      })
    );
  }
});

// Background sync for tile preloading
self.addEventListener('sync', (event) => {
  if (event.tag === 'preload-tiles') {
    console.log('Service Worker: Preloading tiles...');
    // Implement tile preloading logic here if needed
  }
});
