const CACHE = 'lbfc-v2';

// Precache al instalar
const PRECACHE = ['./', 'index.html', 'icon-192.png', 'icon-512.png', 'manifest.json'];

// CDN externos: cache-first (URLs versionadas, nunca cambian)
const CDN_HOSTS = ['cdn.sheetjs.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// datos.xlsx siempre se pide con ?v=timestamp — guardar sin el query
// para que el fallback offline lo encuentre aunque el timestamp cambie
function normalizarClave(url) {
  const u = new URL(url);
  if (/\.xlsx$/i.test(u.pathname)) u.search = '';
  return u.href;
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  const esCdn = CDN_HOSTS.some(h => url.includes(h));

  if (esCdn) {
    // Cache-first: el CDN es versionado y no cambia
    e.respondWith(
      caches.match(e.request).then(hit => hit ||
        fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
  } else {
    // Network-first: siempre intenta la red (versión más nueva),
    // solo cae al caché si no hay conexión
    const clave = normalizarClave(url);
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(clave, res.clone()));
          return res;
        })
        .catch(() => caches.match(clave))
    );
  }
});
