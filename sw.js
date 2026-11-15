// Keeps the mobile page and its icons on the phone, so the installed app opens without internet.
// Bump VERSION whenever random-mobile.html changes, so phones swap in the new copy.
const VERSION = 'm8-1';
const FILES = ['./', './index.html', './random-mobile.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// answer from the stored copy straight away (works offline), and refresh that copy in the background when online
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => {
    const fresh = fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached || caches.match('./random-mobile.html'));
    return cached || fresh;
  }));
});
