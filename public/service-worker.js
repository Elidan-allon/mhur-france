const RELEASE = "674-1c7b8c0a4cd3";
const PREFIX = 'mhur-v674-';
const STATIC_CACHE = `${PREFIX}static-${RELEASE}`;
const OFFLINE_CACHE = `${PREFIX}offline-${RELEASE}`;
const OFFLINE_URL = '/index.html';

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);

      try {
        const response = await fetch(OFFLINE_URL, {
          cache: 'no-store'
        });

        if (response.ok) {
          await cache.put(OFFLINE_URL, response);
        }
      } catch (_error) {}

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== OFFLINE_CACHE)
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, {
      cache: 'no-cache'
    });

    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request, {
            cache: 'no-store'
          });

          if (response.ok) {
            const cache = await caches.open(OFFLINE_CACHE);
            await cache.put(OFFLINE_URL, response.clone());
          }

          return response;
        } catch (_error) {
          return (
            (await caches.match(OFFLINE_URL)) ||
            new Response('Connexion indisponible.', {
              status: 503,
              headers: {
                'Content-Type': 'text/plain; charset=utf-8'
              }
            })
          );
        }
      })()
    );
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/data/') ||
    url.pathname === '/version.json' ||
    url.pathname === '/service-worker.js'
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirst(request));
  }
});
