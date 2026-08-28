const STATIC_CACHE = "tra-station-999-hitster-annual-v2";
const AUDIO_CACHE = "hitster-tra-preview-audio-v1";
const STATIC_ASSETS = [
  "./",
  "./hitster.html",
  "./hitster-888.html",
  "./hitster-888-en.html",
  "./hitster-kfar-bloom-2026-demo.html",
  "./hitster-tra-tokens.html",
  "./hitster-original.js",
  "./hitster-alltime-888.json",
  "./manifest.webmanifest",
  "./tra-quality.js",
  "./TRA_VERSION.json",
  "./TRA_QUALITY.json",
  "./TRA_PRINCIPLES.json",
  "./TRA_PERFECT_QUALITY.md",
  "./tra-music-station.html",
  "./tra-music-station.json",
  "./tra-music-station-extra-555.json",
  "./tra-music-station-corrections-5.json",
  "./what-country.html"
];

async function cacheStatic() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(STATIC_ASSETS.map(async function (asset) {
    try { await cache.add(asset); } catch (error) {}
  }));
}

function injectQuality(html) {
  if (html.includes("tra-quality.js")) return html;
  return html.replace(/<\/body>/i, '<script src="./tra-quality.js"></script></body>');
}

self.addEventListener("install", function (event) {
  event.waitUntil(cacheStatic().then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.indexOf("hitster-tra-") === 0 && key !== STATIC_CACHE && key !== AUDIO_CACHE;
    }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("message", function (event) {
  if (!event.data || event.data.type !== "CACHE_HITSTER_STATIC") return;
  event.waitUntil(cacheStatic().then(function () {
    if (event.source) event.source.postMessage({ type: "HITSTER_STATIC_CACHED" });
  }));
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(async function (response) {
      const type = response.headers.get("content-type") || "";
      let transformed = response;
      if (type.includes("text/html")) {
        const text = injectQuality(await response.clone().text());
        transformed = new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers });
      }
      const copy = transformed.clone();
      caches.open(STATIC_CACHE).then(function (cache) { return cache.put(event.request, copy); });
      return transformed;
    }).catch(async function () {
      const cached = await caches.match(event.request) || await caches.match("./hitster-888.html");
      if (!cached) return cached;
      const type = cached.headers.get("content-type") || "";
      if (!type.includes("text/html")) return cached;
      const text = injectQuality(await cached.clone().text());
      return new Response(text, { status: cached.status, statusText: cached.statusText, headers: cached.headers });
    }));
    return;
  }
  event.respondWith(caches.match(event.request).then(function (cached) {
    if (cached) return cached;
    return fetch(event.request).then(function (response) {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(STATIC_CACHE).then(function (cache) { return cache.put(event.request, copy); });
      }
      return response;
    });
  }));
});
