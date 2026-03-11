// Plan Power — Service Worker v3.0
const CACHE_NAME = "planpower-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png"
];

// Install — pre-cache core assets
self.addEventListener("install", e => {
  console.log("[SW] Installing v3...");
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => {
        console.log("[SW] Assets cached, skipping waiting");
        return self.skipWaiting();
      })
      .catch(err => console.warn("[SW] Cache failed:", err))
  );
});

// Activate — delete old caches, claim clients immediately
self.addEventListener("activate", e => {
  console.log("[SW] Activating v3...");
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log("[SW] Deleting old cache:", k);
          return caches.delete(k);
        })
      ))
      .then(() => {
        console.log("[SW] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Fetch — network first, fallback to cache, fallback to index.html
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Let CDN/external requests (Firebase, React, Babel, XLSX) pass through
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful same-origin responses
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: try cache, then index.html
        return caches.match(e.request)
          .then(cached => cached || caches.match("/index.html"));
      })
  );
});

// Listen for skip waiting message from app
self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
