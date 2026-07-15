const CACHE_NAME = 'smartroadmap-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/roadmap',
  '/calendar',
  '/practice',
  '/pricing',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip requests from chrome-extension, chrome, edge, devtools, or non-http protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Stale-while-revalidate for dashboard and roadmap GET requests
  if (request.method === 'GET' && (url.pathname.includes('/roadmap') || url.pathname.includes('/dashboard'))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-first strategy for app shell assets and sheets
  if (
    request.method === 'GET' &&
    (url.pathname.includes('/_next/') ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      url.pathname.includes('/cheat-sheets/'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-only fallback for write endpoints/external APIs
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ───────────────────────────── Web Push Notifications ─────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'SmartRoadmap Alert';
    const body = payload.body || 'You have a new learning alert.';
    const url = payload.data?.url || '/dashboard';

    const options = {
      body,
      icon: '/manifest.json', // generic fallback icon
      data: { url },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error handling push notification event: ', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and redirect
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(url);
          }
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
