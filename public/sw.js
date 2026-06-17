/* Vite çıktısı: önbellek listesinde hash’li dosya yok; ağ öncelikli */
const CACHE_NAME = 'zikirmatik-cache-v6';

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) return caches.delete(key);
                    })
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
        event.respondWith(fetch(request).catch(() => caches.match(request)));
        return;
    }
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && (response.ok || response.type === 'opaque')) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const openUrl = event.notification.data && event.notification.data.url;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const c of clientList) {
                if (c.url && 'focus' in c) return c.focus();
            }
            if (clients.openWindow && openUrl) return clients.openWindow(openUrl);
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
