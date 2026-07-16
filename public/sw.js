const CACHE_NAME = 'recyclehub-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Only intercept GET requests originating from our own domain (ignores Supabase, Google APIs, chrome extensions, etc.)
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).catch((err) => {
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
        throw err;
      });
    })
  );
});
