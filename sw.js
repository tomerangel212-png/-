const STATIC_CACHE = "tra-99-99-station-999-static-v1";
const AUDIO_CACHE = "hitster-tra-preview-audio-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./games.html",
  "./games.js",
  "./games-hub.js",
  "./games-loader.js",
  "./games.css",
  "./casino-angel.html",
  "./connect-talk.html",
  "./music-drive.html",
  "./music-editor.html",
  "./music-editor.js",
  "./links/index.html",
  "./tra-dashboard/index.html",
  "./songs/index.html",
  "./poetry/index.html",
  "./instrumentals/index.html",
  "./kfar-blum-2026.html",
  "./knoke.html",
  "./tra-dnd.html",
  "./angel-family-game.html",
  "./tra-100.html",
  "./wikifamily.html",
  "./tra-music.html",
  "./tra-music-station.html",
  "./tra-music-station.json",
  "./tra-music-station-extra-555.json",
  "./tra-music-station-corrections-5.json",
  "./what-country.html",
  "./hitster.html",
  "./hitster-mobile.html",
  "./hitster-888.html",
  "./hitster-888-en.html",
  "./hitster-kfar-bloom-2026-demo.html",
  "./hitster-tra-tokens.html",
  "./hitster-original.js",
  "./hitster-alltime-888.json",
  "./app.js",
  "./styles.css",
  "./manifest.webmanifest",
  "./tra-quality.js",
  "./TRA_VERSION.json",
  "./TRA_QUALITY.json",
  "./TRA_PRINCIPLES.json",
  "./TRA_PERFECT_QUALITY.md"
];

async function cacheStatic() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(STATIC_ASSETS.map(async function (asset) {
    try {
      const response = await fetch(asset, { cache: "reload" });
      if (response && response.ok) await cache.put(asset, response);
    } catch (error) {}
  }));
}

function qualityScriptUrl() {
  return new URL("tra-quality.js", self.registration.scope).href;
}

function injectQuality(html) {
  if (html.includes("tra-quality.js")) return html;
  const src = qualityScriptUrl().replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return html.replace(/<\/body>/i, `<script src="${src}"></script></body>`);
}

async function asQualityHtml(response) {
  if (!response) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;
  const text = injectQuality(await response.clone().text());
  return new Response(text, { status: response.status, statusText: response.statusText, headers: response.headers });
}

self.addEventListener("install", function (event) {
  event.waitUntil(cacheStatic().then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      const belongsToTra = key.startsWith("tra-") || key.startsWith("hitster-tra-");
      return belongsToTra && key !== STATIC_CACHE && key !== AUDIO_CACHE;
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
  if (event.request.headers.has("range")) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async function () {
      try {
        const response = await fetch(event.request);
        const transformed = await asQualityHtml(response);
        if (transformed && transformed.ok) {
          const copy = transformed.clone();
          event.waitUntil(caches.open(STATIC_CACHE).then(function (cache) { return cache.put(event.request, copy); }));
        }
        return transformed;
      } catch (error) {
        const cached = await caches.match(event.request);
        if (cached) return asQualityHtml(cached);
        const offline = await caches.match("./offline.html");
        if (offline) return asQualityHtml(offline);
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  event.respondWith((async function () {
    try {
      const response = await fetch(event.request);
      if (response && response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(STATIC_CACHE).then(function (cache) { return cache.put(event.request, copy); }));
      }
      return response;
    } catch (error) {
      return await caches.match(event.request) || Response.error();
    }
  })());
});
