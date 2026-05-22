/* Manifest version: 0FEPfP+n */
// Caution! Be sure you understand the caveats before publishing an application with
// offline support. See https://aka.ms/blazor-offline-considerations

self.importScripts('./service-worker-assets.js');
self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', event => event.respondWith(onFetch(event)));

const cacheNamePrefix = 'offline-cache-';
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}`;
const offlineAssetsInclude = [ /\.dll$/, /\.pdb$/, /\.wasm/, /\.html/, /\.js$/, /\.json$/, /\.css$/, /\.woff$/, /\.png$/, /\.jpe?g$/, /\.gif$/, /\.ico$/, /\.blat$/, /\.dat$/ ];
const offlineAssetsExclude = [ /^service-worker\.js$/ ];

// Replace with your base path if you are hosting on a subfolder. Ensure there is a trailing '/'.
const base = "/";
const baseUrl = new URL(base, self.origin);
const manifestUrlList = self.assetsManifest.assets.map(asset => new URL(asset.url, baseUrl).href);

async function onInstall(event) {
    console.info('Service worker: Install');

    // Activate this worker immediately instead of waiting for every tab to close.
    self.skipWaiting();

    // Pre-cache every asset so the app still works offline. Integrity (SRI) is
    // intentionally not enforced: some hosts re-compress static files, which
    // would make the published hash mismatch and abort an all-or-nothing
    // cache.addAll. Each asset is fetched on its own so one bad file can't
    // block the rest.
    const assetsRequests = self.assetsManifest.assets
        .filter(asset => offlineAssetsInclude.some(pattern => pattern.test(asset.url)))
        .filter(asset => !offlineAssetsExclude.some(pattern => pattern.test(asset.url)))
        .map(asset => new Request(asset.url, { cache: 'no-cache' }));
    const cache = await caches.open(cacheName);
    await Promise.all(assetsRequests.map(async request => {
        try {
            const response = await fetch(request);
            if (response.ok) {
                await cache.put(request, response);
            }
        } catch (err) {
            console.warn('Service worker: could not cache', request.url, err);
        }
    }));
}

async function onActivate(event) {
    console.info('Service worker: Activate');

    // Take control of open pages right away, then drop caches from old deploys.
    await self.clients.claim();
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys
        .filter(key => key.startsWith(cacheNamePrefix) && key !== cacheName)
        .map(key => caches.delete(key)));
}

// Network-first strategy. The previous cache-first approach meant a published
// change (CSS, markup, code) stayed hidden behind the cached copy until the
// service worker itself updated — the root cause of "my changes didn't apply".
// Now every request goes to the network first with `cache: 'no-cache'`, so a
// deploy can't be masked by this cache or by the browser's HTTP cache. The
// offline cache is used only as a fallback when the network is unreachable.
async function onFetch(event) {
    if (event.request.method !== 'GET') {
        return fetch(event.request);
    }

    // Let cross-origin requests (e.g. the CDN icon font) pass straight through.
    if (new URL(event.request.url).origin !== self.origin) {
        return fetch(event.request);
    }

    // Single-page-app navigations always resolve to index.html so deep links
    // (e.g. /number) work no matter how the static host handles unknown paths.
    const servesIndexHtml = event.request.mode === 'navigate'
        && !manifestUrlList.some(url => url === event.request.url);
    const targetUrl = servesIndexHtml ? new URL('index.html', baseUrl).href : event.request.url;

    try {
        return await fetch(new Request(targetUrl, { cache: 'no-cache' }));
    } catch {
        // Offline: serve the copy cached at install time.
        const cache = await caches.open(cacheName);
        const cached = await cache.match(servesIndexHtml ? 'index.html' : event.request);
        return cached || Response.error();
    }
}

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
