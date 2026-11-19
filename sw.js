const APP_VERSION = '2026.11.19.1';
const CACHE_NAME = `salon-cashier-${APP_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// Install: Ambil aset terbaru langsung dari server (lewati cache HTTP lama)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((url) =>
          fetch(new Request(url, { cache: 'reload' })).then((response) => {
            if (!response.ok) {
              throw new Error(`Gagal memuat ${url}: ${response.status}`);
            }
            return cache.put(url, response);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate: Hapus seluruh cache versi lama dan langsung ambil alih halaman aktif
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('salon-cashier-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first untuk manifest.json & sw.js; Cache-first untuk aset aplikasi lainnya
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isManifestOrSW =
    url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/sw.js');

  if (isManifestOrSW) {
    event.respondWith(
      fetch(new Request(event.request, { cache: 'no-store' }))
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./manifest.json', copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./manifest.json'))
    );
    return;
  }

  // Strategi Cache-first untuk tampilan utama & aset statis agar tetap ngebut dan jalan offline
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
