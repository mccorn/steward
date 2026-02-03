self.addEventListener('install', () => {
    console.log("ServiceWorker installed");
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});