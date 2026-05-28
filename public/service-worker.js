/* KumbhSathi Service Worker — Offline Cache for App Shell */

const CACHE_NAME = 'kumbhsathi-v1.0.0';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
  '/styles/components.css',
  '/styles/animations.css',
  '/scripts/translations.js',
  '/scripts/data.js',
  '/scripts/router.js',
  '/scripts/map.js',
  '/scripts/app.js',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Tiro+Devanagari+Hindi&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

/* Install: cache the app shell */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing KumbhSathi Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell files...');
      // Cache local files first (these must succeed)
      const localUrls = CACHE_URLS.filter(u => !u.startsWith('http'));
      const cdnUrls = CACHE_URLS.filter(u => u.startsWith('http'));
      return cache.addAll(localUrls).then(() => {
        // CDN files: cache individually, ignore failures
        return Promise.allSettled(cdnUrls.map(url => cache.add(url)));
      });
    }).then(() => self.skipWaiting())
  );
});

/* Activate: clean old caches */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating KumbhSathi Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

/* Fetch: Cache-first strategy for app shell, network-first for APIs */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  // Skip OpenStreetMap tile requests (too many to cache)
  if (url.hostname.includes('tile.openstreetmap.org')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache, but also update cache in background
        fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
            }
          })
          .catch(() => {}); // Ignore network errors during background update
        return cachedResponse;
      }

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // If both cache and network fail, return a fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

/* Listen for skip-waiting message from client */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
