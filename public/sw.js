/**
 * Service Worker for Offline Map Tile Caching
 * Caches OpenStreetMap tiles for 7 days offline use
 */

const CACHE_NAME = "osm-cache-v2";
const TTL_DAYS = 7;
const OFFLINE_TILES = [
  "/osm-tiles-fallback/blank.png",
  "/osm-tiles-fallback/seychelles-z4.png",
  "/osm-tiles-fallback/seychelles-z6.png",
];

// Install event - skip waiting for immediate activation
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing offline tile cache...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_TILES).catch(() => void 0))
  );
  self.skipWaiting();
});

// Activate event - claim all clients immediately
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating offline tile cache...");
  event.waitUntil(clients.claim());
});

// Intercept tile requests and cache them
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  
  // Only handle tile requests
  if (url.includes("/tiles/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Try to get cached tile first
        const cached = await cache.match(event.request);
        if (cached) {
          console.log("Service Worker: Serving cached tile:", url);
          return cached;
        }

        try {
          // Fetch from network
          const res = await fetch(event.request);
          if (res.ok) {
            // Cache the response for offline use
            cache.put(event.request, res.clone());
            console.log("Service Worker: Cached new tile:", url);
          }
          return res;
        } catch (error) {
          console.log("Service Worker: Network failed, serving stale cache");
          // Return stale cache if available, or 503 error
          return (
            cached || (await cache.match("/osm-tiles-fallback/blank.png")) || new Response("", { status: 503 })
          );
        }
      })
    );
  }
});

// Background sync for tile preloading (future enhancement)
self.addEventListener("sync", (event) => {
  if (event.tag === "preload-tiles") {
    console.log("Service Worker: Preloading tiles for offline use...");
    // Future: Implement tile preloading for Seychelles region
  }
});
