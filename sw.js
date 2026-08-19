const CACHE_NAME = 'caisse-ail-noir-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // active la nouvelle version tout de suite, sans attendre la fermeture des onglets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()) // prend le contrôle des onglets déjà ouverts
  );
});

// Réseau d'abord : la dernière version est toujours utilisée si le réseau est
// disponible. Le cache ne sert que de secours quand il n'y a pas de réseau —
// jamais de version périmée servie alors qu'une plus récente existe.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
