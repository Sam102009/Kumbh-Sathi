const CACHE_NAME = 'kumbhsathi-v1';
const ASSETS = [
  './',
  './index.html',
  './styles/main.css',
  './styles/components.css',
  './styles/animations.css',
  './scripts/app.js',
  './scripts/data.js',
  './scripts/map.js',
  './scripts/router.js',
  './scripts/translations.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
