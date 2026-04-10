const CACHE_NAME = 'zikirmatik-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './icon.svg',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
