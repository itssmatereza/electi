// Service worker del portal ELECTI (app instalable).
// · El portal siempre se pide a la red: cada deploy se ve al instante.
//   Si no hay conexión se muestra la pantalla «Sin conexión» (sin internet
//   el portal no puede hacer nada, porque los datos están en Firebase).
// · No toca Firebase ni nada de otros dominios: los datos nunca se guardan aquí.
const VERSION = 'electi-app-1';
const BASE = ['/portal/offline.html', '/portal/app-192.png', '/portal/app-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/portal/offline.html')));
    return;
  }

  if (BASE.includes(url.pathname)) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
