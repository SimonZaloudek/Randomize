// This app no longer uses a service worker. Offline/PWA caching caused
// stale content, .NET runtime version mismatches and an infinite reload
// loop when hosted as static files.
//
// This file is kept ONLY so browsers that still have the old worker
// registered will update to this one — which deletes its caches and
// unregisters itself. After that, no service worker runs at all and every
// request goes straight to the network. There is intentionally no `fetch`
// handler, so this worker never intercepts or caches anything.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        // Delete every cache the old worker created.
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));

        // Unregister this worker so future page loads bypass it entirely.
        await self.registration.unregister();

        // Reload any open pages once so they load fresh, uncontrolled,
        // from the network instead of the now-deleted cache.
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
            client.navigate(client.url);
        }
    })());
});
