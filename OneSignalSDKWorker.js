importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'flow-v1.3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.destination === 'document' || e.request.url.endsWith('.html') || e.request.url.endsWith('/');
  if (isHTML) {
    // HTML — תמיד מהרשת, cache כגיבוי בלבד
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
  } else {
    // שאר הקבצים — cache-first
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request)
        .then(res => { caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone())); return res; })
      )
    );
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'drink') {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) { clients[0].postMessage({ type: 'QUICK_DRINK', ml: 250 }); clients[0].focus(); }
        else self.clients.openWindow('./');
      })
    );
  } else {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length > 0) clients[0].focus();
        else self.clients.openWindow('./');
      })
    );
  }
});
