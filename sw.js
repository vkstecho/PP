// Plan Power — Service Worker v4.0
const CACHE_NAME = "planpower-v4";
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
  console.log("[SW] Installing v4...");
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => {
        console.log("[SW] v4 installed");
        return self.skipWaiting(); // take over immediately
      })
  );
});

// Activate — delete ALL old caches
self.addEventListener("activate", e => {
  console.log("[SW] Activating v4, clearing old caches...");
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log("[SW] Deleting old cache:", k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
