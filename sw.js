const CACHE = 'zineclub-v2';
const ASSETS = [
  '/rack/',
  '/rack/index.html',
  '/rack/manifest.json',
  '/rack/icon-192.png',
  '/rack/icon-512.png',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  // Don't cache API calls
  if (e.request.url.includes('supabase.co')) return;
  if (e.request.url.includes('tmdb.org')) return;
  if (e.request.url.includes('youtube.com')) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchPromise = fetch(e.request).then(function(response) {
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        if (e.request.destination === 'document') {
          return caches.match('/rack/index.html');
        }
      });
      return cached || fetchPromise;
    })
  );
});
