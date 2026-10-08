/**
 * ============================================================================
 * WB CREDIT UNION - SERVICE WORKER (PWA & OFFLINE RESILIENCE)
 * ============================================================================
 */

const CACHE_NAME = 'wbcu-cache-v1.0.0';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/register.html',
  '/pages/dashboard.html',
  '/pages/admin-login.html',
  '/pages/admin-dashboard.html',
  '/css/global.css',
  '/css/landing.css',
  '/css/auth.css',
  '/css/dashboard.css',
  '/css/admin.css',
  '/js/theme.js',
  '/js/supabase-config.js',
  '/js/validation.js',
  '/js/security.js',
  '/js/auth.js',
  '/js/app.js',
  '/manifest.json'
];

// Install Event - Pre-cache core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Precache notice:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-first for static assets, Network-first for dynamic/API
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or browser-extension schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle static assets (CSS, JS, Fonts, Images) -> Cache First with Network Fallback
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in background
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* Offline ignore */});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          return new Response('Asset not available offline', { status: 404 });
        });
      })
    );
    return;
  }

  // HTML Pages & Navigation -> Network First with Offline Cache Fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineFallback = await caches.match('/pages/dashboard.html') || await caches.match('/index.html');
          if (offlineFallback) return offlineFallback;
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><title>Offline | WB Credit Union</title>
            <style>body{font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#f8fafc;}h1{color:#3b82f6;}button{padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;}</style>
            </head>
            <body>
              <h1>You are currently offline</h1>
              <p>WB Credit Union requires an active internet connection for live transactions.</p>
              <button onclick="window.location.reload()">Retry Connection</button>
            </body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // All other API calls / fetch requests -> Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
