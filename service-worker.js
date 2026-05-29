const CACHE_NAME = 'kumbhsathi-v4';
const BASE = '/Kumbh-Sathi/';

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'styles/main.css',
  BASE + 'styles/components.css',
  BASE + 'styles/animations.css',
  BASE + 'scripts/app.js',
  BASE + 'scripts/data.js',
  BASE + 'scripts/map.js',
  BASE + 'scripts/router.js',
  BASE + 'scripts/translations.js',
  BASE + 'manifest.json',
  BASE + 'assets/icons/icon-192.png',
  BASE + 'assets/icons/icon-512.png'
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
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match(BASE + 'index.html')))
  );
});
