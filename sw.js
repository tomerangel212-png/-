const CACHE = "tra-kfar-bloom-2026-offline-v3";
const CORE = [
  "./",
  "./index.html",
  "./links/",
  "./links/index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/tra-mark.svg",
  "./games.html",
  "./games.css",
  "./games.js",
  "./casino-angel.html",
  "./connect-talk.html",
  "./music-drive.html",
  "./hitster-kfar-bloom-2026-demo.html",
  "./hitster-kfar-bloom-2026-demo.js",
  "./hitster-kfar-bloom-2026-demo-data.json",
  "./songs/",
  "./songs/index.html",
  "./poetry/",
  "./poetry/index.html",
  "./instrumentals/",
  "./instrumentals/index.html",
  "./tra-dashboard/",
  "./tra-dashboard/index.html"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cacheFirst(request) {
  const cached = await caches.match(request, {ignoreSearch:false});
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  } catch (error) {
    if (request.mode === "navigate") {
      return (await caches.match("./links/index.html")) || (await caches.match("./index.html"));
    }
    throw error;
  }
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const applePreview = /(^|\.)itunes\.apple\.com$/.test(url.hostname) || /(^|\.)mzstatic\.com$/.test(url.hostname);
  if (sameOrigin || applePreview) event.respondWith(cacheFirst(event.request));
});
