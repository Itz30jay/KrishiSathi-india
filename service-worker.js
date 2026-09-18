/* ═══════════════════════════════════════════════════════════════════════
   KrishiSathi India — Service Worker
   ---------------------------------------------------------------------
   Goal: keep the app usable on patchy rural connections.
     • App shell (CSS/JS/icons) — cache-first, so it loads instantly and
       still works offline once visited once.
     • Pages — network-first with a cache fallback, so users get the
       latest content when online but can still reopen recently-viewed
       pages with no signal at all.
     • API calls (/predict, /disease_info, /production_stats, /contact,
       weather/market data) — always go to the network. Serving stale
       crop or price data offline would be actively misleading, so these
       intentionally are NOT cached.
   ═══════════════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'krishisathi-v2';
const APP_SHELL = [
  '/',
  '/static/css/style.css',
  '/static/js/script.js',
  '/static/js/weather.js',
  '/static/js/location.js',
  '/static/js/chatbot.js',
  '/static/js/crop-prediction.js',
  '/static/js/disease-scan.js',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/img/bg-home.svg',
  '/static/img/bg-dashboard.svg',
  '/static/img/bg-crop.svg',
  '/static/img/bg-disease.svg',
  '/static/img/bg-weather.svg',
  '/static/img/bg-market.svg',
  '/static/img/bg-soil.svg',
  '/static/img/bg-schemes.svg',
  '/static/img/bg-chat.svg',
  '/static/img/bg-tips.svg',
  '/static/img/bg-community.svg',
  '/static/img/bg-auth.svg',
  '/manifest.json',
];

// Never cache API/data endpoints — always hit the network for these.
const NEVER_CACHE = ['/predict', '/disease_info', '/production_stats', '/contact', '/crops'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => { /* if a shell asset is briefly unreachable, don't block install */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin (weather/geocoding APIs etc.)
  if (NEVER_CACHE.some((path) => url.pathname === path)) return;

  const isPage = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/';

  if (isPage) {
    // Network-first for pages: fresh when online, cached copy when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
  } else {
    // Cache-first for static assets (CSS/JS/icons): instant load, refreshed in the background.
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
