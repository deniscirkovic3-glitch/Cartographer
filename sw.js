// Cartografo del Vuoto · service worker. The page is fetched fresh when online (a new version is just there at the
// next launch) and served from the cache when not; manifest, icons and fonts are cached as they come. One cache per
// version: activating a new worker drops the old ones.
const CACHE = 'cdv-4.25.2';
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(req.mode === 'navigate' ? page(req) : cached(req));
});
/** The network within four seconds, else the page kept from the last launch. */
async function page(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(no, 4000))]);
    if (res.ok) cache.put('./', res.clone());
    return res;
  } catch { return (await cache.match('./')) || Response.error(); }
}
/** Cache first; what comes from the network is kept (fonts included: opaque responses are fine). */
async function cached(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') (await caches.open(CACHE)).put(req, res.clone());
  return res;
}
