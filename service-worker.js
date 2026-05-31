/**
 * DEVOS — SERVICE WORKER
 * Offline support, cache-first for assets, network-first for API.
 */

const SW_VERSION    = 'devos-v1.0.0';
const STATIC_CACHE  = `${SW_VERSION}-static`;
const DYNAMIC_CACHE = `${SW_VERSION}-dynamic`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/animations.css',
  './css/components.css',
  './css/skeleton.css',
  './css/hero.css',
  './css/dashboard.css',
  './css/skills.css',
  './css/projects.css',
  './css/explorer.css',
  './css/terminal.css',
  './css/command-palette.css',
  './css/timeline.css',
  './css/achievements.css',
  './css/activity.css',
  './css/contribution.css',
  './css/search.css',
  './css/preview.css',
  './css/mobile.css',
  './js/config.js',
  './js/api.js',
  './js/state.js',
  './js/app.js',
  './js/utils/cache.js',
  './js/utils/format.js',
  './js/utils/dom.js',
  './js/utils/analytics.js',
  './js/modules/hero.js',
  './js/modules/dashboard.js',
  './js/modules/skills.js',
  './js/modules/projects.js',
  './js/modules/explorer.js',
  './js/modules/preview.js',
  './js/modules/detector.js',
  './js/modules/terminal.js',
  './js/modules/command-palette.js',
  './js/modules/search.js',
  './js/modules/timeline.js',
  './js/modules/achievements.js',
  './js/modules/activity.js',
  './js/modules/contribution.js',
  './js/modules/mobile.js',
];

/* ══════════════════════════════════════
   INSTALL
══════════════════════════════════════ */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install cache error:', err))
  );
});

/* ══════════════════════════════════════
   ACTIVATE — clean old caches
══════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ══════════════════════════════════════
   FETCH
══════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // GitHub API — network first, cache fallback
  if (url.hostname === 'api.github.com') {
    event.respondWith(_networkFirst(event.request));
    return;
  }

  // Google Fonts — cache first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(_cacheFirst(event.request, DYNAMIC_CACHE));
    return;
  }

  // Static assets — cache first
  event.respondWith(_cacheFirst(event.request, STATIC_CACHE));
});

async function _cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Return offline fallback page if navigating
    if (request.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function _networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', message: 'No cached data available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/* ══════════════════════════════════════
   PUSH NOTIFICATIONS (scaffold)
══════════════════════════════════════ */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'DevOS', {
      body:    data.body || '',
      icon:    './assets/icons/icon-192.png',
      badge:   './assets/icons/icon-72.png',
      vibrate: [200, 100, 200],
    })
  );
});
