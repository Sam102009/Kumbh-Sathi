const CACHE_NAME = 'kumbhsathi-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './styles/components.css',
  './scripts/app.js',
  './scripts/router.js',
  './scripts/data.js',
  './scripts/translations.js',
  './scripts/crowd2.js',
  './scripts/groups.js',
  './scripts/map.js',
  './scripts/weather.js',
  './scripts/lostfound.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

/* Install - cache static assets */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* Activate - clear old caches */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch - Network first, fallback to cache */
self.addEventListener('fetch', function(e) {
  /* Skip non-GET and chrome-extension requests */
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(networkRes) {
        /* Network success - update cache and return */
        var resClone = networkRes.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, resClone);
        });
        return networkRes;
      })
      .catch(function() {
        /* Network failed - serve from cache */
        return caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          /* If no cache, return offline index.html */
          if (e.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
