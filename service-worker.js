/* KumbhSathi Service Worker — Offline Cache for App Shell */

const CACHE_NAME = 'kumbhsathi-v5';
const BASE = '/Kumbh-Sathi';
const CACHE_URLS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/styles/main.css',
  BASE + '/styles/components.css',
  BASE + '/styles/animations.css',
  BASE + '/scripts/translations.js',
  BASE + '/scripts/data.js',
  BASE + '/scripts/router.js',
  BASE + '/scripts/map.js',
  BASE + '/scripts/app.js',
  BASE + '/assets/icons/icon-192.svg',
  BASE + '/assets/icons/icon-512.svg',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Tiro+Devanagari+Hindi&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
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
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match(BASE + '/index.html')))
  );
});