// Native Web Push (VAPID). The browser push service wakes this worker and the
// push event below renders the notification.
const CACHE_NAME = 'poop-lol-v8';
const POOP_ICON = '/pwa-192x192.png';
const FART_SOUND = '/mikrotop22-furtz22-198542.mp3';
const OFFLINE_URL = '/offline';
const PRECACHE = ['/', '/offline', '/manifest.webmanifest', '/pwa-192x192.png', '/pwa-512x512.png', '/favicon.ico', FART_SOUND];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Next.js chunks are content-hashed in production and change on every
  // recompile in development. Caching them here can serve an old module graph
  // that references files which no longer exist, so leave them to the browser
  // and Next.js HTTP cache.
  if (url.pathname.startsWith('/_next/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (/\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
            }
            return response;
          })
      )
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'poop.lol';
  const body = payload.body || '';
  const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
  const targetUrl = payload.url || data.url || '/';

  event.waitUntil(
    (async () => {
      let visibleClients = [];
      try {
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        visibleClients = clients.filter(
          (client) => client.visibilityState === 'visible'
        );
      } catch {
        // Even if the client lookup fails, the notification must still show.
      }

      const options = {
        body,
        // Always use the local poop logo. The payload's absolute URL can point
        // at a domain that is not deployed yet (for example during tunnel tests).
        icon: POOP_ICON,
        badge: POOP_ICON,
        tag: payload.tag || 'poop-room',
        renotify: true,
        silent: visibleClients.length > 0,
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        data: { ...data, url: targetUrl },
      };

      try {
        await self.registration.showNotification(title, options);
      } catch {
        // Some browsers reject unsupported options; retry with the minimum.
        await self.registration.showNotification(title, {
          body,
          icon: POOP_ICON,
          badge: POOP_ICON,
          tag: payload.tag || 'poop-room',
          data: { ...data, url: targetUrl },
        });
      }

      for (const client of visibleClients) {
        client.postMessage({
          type: 'poop:push-received',
          payload: { title, body, data },
        });
      }
    })()
  );
});

// If the browser rotates the push subscription, ask an open client to save it
// again. A closed PWA cannot authenticate this request, so it is synced on the
// next app launch instead.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of clients) {
          client.postMessage({ type: 'poop:push-subscription-change' });
        }
      } catch {
        // ignore
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
