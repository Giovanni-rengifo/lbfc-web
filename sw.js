const CACHE = 'lbfc-v7';

// CDN externos versionados: cache-first (nunca cambian)
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Solo recursos estáticos que no cambian entre deploys
const PRECACHE = ['icon-192.png', 'icon-512.png', 'manifest.json', 'info.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      // Detectar si había una versión anterior instalada (= esto es un update, no primer install)
      const esActualizacion = keys.some(k => k.startsWith('lbfc-') && k !== CACHE);
      return Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        .then(() => self.clients.claim())
        .then(() => {
          if (!esActualizacion) return;
          // Notificar a todos los tabs abiertos para que recarguen con la versión nueva
          return self.clients.matchAll({ type: 'window' }).then(clientes => {
            clientes.forEach(c => c.postMessage({ type: 'SW_ACTUALIZADO' }));
          });
        });
    })
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  const esCdn = CDN_HOSTS.some(h => url.includes(h));
  const pathname = new URL(url).pathname;
  const esHTML = /\.html?$/i.test(pathname) || pathname.endsWith('/') || pathname === '';

  if (esCdn) {
    // Cache-first: CDN versionado, no cambia nunca
    e.respondWith(
      caches.match(e.request).then(hit => hit ||
        fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
  } else if (esHTML) {
    // HTML nunca se cachea: siempre se pide a la red, sin fallback a caché
    // Garantiza que todos los usuarios siempre reciban la versión más reciente
    e.respondWith(fetch(e.request));
  } else {
    // Otros assets propios y la Sheet en vivo (Apps Script): network-first
    // con fallback offline a la última respuesta buena conocida
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(url, res.clone()));
          return res;
        })
        .catch(() => caches.match(url))
    );
  }
});
