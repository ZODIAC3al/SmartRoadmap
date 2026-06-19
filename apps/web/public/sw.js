// SmartRoadmap Service Worker - v3
// Fixes: addAll failure from unbundled /globals.css path
const CACHE_NAME = 'smartroadmap-cache-v3';

// Only cache assets that are truly static and served from /public
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
];

// Install: cache only real static public assets (use individual try/catch to be resilient)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Could not cache ${url}:`, err.message);
          })
        )
      );
      return results;
    })
  );
  self.skipWaiting();
});

// Activate: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigations, cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Always bypass: API calls, Next.js HMR, and webpack chunk requests
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.port === '3000' ||
    url.searchParams.has('_rsc')
  ) {
    return; // Let the browser handle normally
  }

  // For page navigations: network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful page responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: return cached page or a simple offline page
          return caches.match(event.request).then(
            (cached) =>
              cached ||
              new Response('<h1>You are offline</h1><p>Please check your connection and try again.</p>', {
                headers: { 'Content-Type': 'text/html' },
              })
          );
        })
    );
    return;
  }

  // For static assets (images, fonts, etc.): cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => undefined);
    })
  );
});
