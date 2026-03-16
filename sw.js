// Plan Power Service Worker v10.2 - 2026-03-16
const CACHE_NAME = 'plan-power-v10-2';

// Install — immediately activate
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// Activate — delete ALL old caches and claim clients
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return clients.claim(); })
  );
});

// Fetch — ALWAYS network first, never serve stale HTML
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var accept = event.request.headers.get('accept') || '';

  // For HTML pages — always go to network, never cache
  if (event.request.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response('<h2 style="text-align:center;padding:40px;font-family:system-ui">Offline — please reconnect</h2>', {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // For other resources — network first, cache fallback
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
