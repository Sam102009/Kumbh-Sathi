const CACHE_NAME = 'kumbhsathi-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './styles/components.css',
  './styles/animations.css',
  './scripts/app.js',
  './scripts/router.js',
  './scripts/data.js',
  './scripts/translations.js',
  './scripts/crowd2.js',
  './scripts/groups.js',
  './scripts/map.js',
  './scripts/weather.js',
  './scripts/lostfound.js',
  './scripts/news.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

/* Install - cache static assets */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).catch(function() {
      /* If some assets fail to cache, continue anyway */
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
  /* Skip non-GET, chrome-extension, and cross-origin API requests */
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension')) return;
  /* Skip Google Apps Script (dynamic API — don't cache) */
  if (e.request.url.includes('script.google.com')) return;
  /* Skip external CDNs (fonts, icons) */
  if (e.request.url.includes('fonts.googleapis.com')) return;
  if (e.request.url.includes('cdnjs.cloudflare.com')) return;
  if (e.request.url.includes('unpkg.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(networkRes) {
        if (networkRes && networkRes.status === 200) {
          var resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, resClone);
          });
        }
        return networkRes;
      })
      .catch(function() {
        return caches.match(e.request).then(function(cached) {
          if (cached) return cached;
          if (e.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
