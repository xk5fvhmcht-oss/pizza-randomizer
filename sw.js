// ═══════════════════════════════════════════
// SERVICE WORKER — sw.js
// Version is injected by data.js — cache name
// includes APP_VERSION so every data/code bump
// forces a fresh cache fetch.
// ═══════════════════════════════════════════

// CACHE_VERSION is set by the inline script in index.html
// which reads APP_VERSION from data.js before SW registration.
// If that hasn't run yet, fall back to a fixed name.
const CACHE_NAME = self.__APP_VERSION
  ? `pizza-randomizer-v${self.__APP_VERSION}`
  : "pizza-randomizer-v1.0.0";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith("pizza-randomizer-") && k !== CACHE_NAME)
          .map(k => {
            console.log("[SW] Deleting old cache:", k);
            return caches.delete(k);
          })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // Network-first for HTML (catches version bumps), cache-first for assets
  const isHTML = e.request.destination === "document" ||
                 e.request.url.endsWith("index.html") ||
                 e.request.url.endsWith("/");

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});

// Listen for SKIP_WAITING message from app
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
