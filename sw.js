// Keeps the mobile page and its icons on the phone, so the installed app opens without internet.
// Bump VERSION whenever random-mobile.html changes, so phones swap in the new copy.
const VERSION = 'm12-1';
const FILES = ['./', './index.html', './random-mobile.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // straight from the site, not the browser's own copy: GitHub Pages lets that be up to 10 minutes old,
  // which could pack the previous page into the new version's store
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// answer from the stored copy straight away (works offline), and refresh that copy in the background when online
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // the page reads sw.js to see which version is on the site, so that always goes to the site
  if (url.pathname.endsWith('/sw.js')) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(cached => {
    // ask the site whether the file changed instead of taking the browser's possibly stale copy
    const fresh = fetch(req.url, { cache: 'no-cache' }).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached || caches.match('./random-mobile.html'));
    return cached || fresh;
  }));
});
