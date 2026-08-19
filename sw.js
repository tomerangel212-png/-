const CACHE = "tra-kfar-bloom-2026-offline-v9-hitster-888-music-editor";
const HITSTER_OFFLINE = [
  "./hitster.html",
  "./hitster-kfar-bloom-2026-demo.html",
  "./hitster-kfar-bloom-2026-demo.js",
  "./hitster-hebrew-alist-888.json",
  "./games.html",
  "./games.css",
  "./games.js",
  "./games-hub.js",
  "./manifest.webmanifest",
  "./assets/tra-mark.svg"
];
const CORE = [
  "./","./index.html","./links/","./links/index.html","./styles.css","./app.js","./manifest.webmanifest","./assets/tra-mark.svg",
  "./games.html","./games.css","./games.js","./games-hub.js","./hitster.html","./casino-angel.html","./connect-talk.html","./music-drive.html","./music-editor.html",
  "./hitster-kfar-bloom-2026-demo.html","./hitster-kfar-bloom-2026-demo.js","./hitster-hebrew-alist-888.json",
  "./songs/","./songs/index.html","./poetry/","./poetry/index.html","./instrumentals/","./instrumentals/index.html","./tra-dashboard/","./tra-dashboard/index.html"
];
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(CORE.map(url=>cache.add(url)));await self.skipWaiting();})());});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener("message",event=>{if(event.data?.type!=="CACHE_HITSTER_OFFLINE")return;event.waitUntil((async()=>{const cache=await caches.open(CACHE);const results=await Promise.allSettled(HITSTER_OFFLINE.map(url=>cache.add(url)));const failed=results.filter(result=>result.status==="rejected").length;event.source?.postMessage({type:"HITSTER_OFFLINE_READY",ok:failed===0,cached:HITSTER_OFFLINE.length-failed,total:HITSTER_OFFLINE.length});})());});
async function networkFirst(request){try{const response=await fetch(request);if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}catch(error){const cached=await caches.match(request,{ignoreSearch:false});if(cached)return cached;if(request.mode==="navigate"){const url=new URL(request.url);if(url.pathname.includes("hitster"))return(await caches.match("./hitster.html"))||(await caches.match("./hitster-kfar-bloom-2026-demo.html"))||(await caches.match("./index.html"));return(await caches.match("./games.html"))||(await caches.match("./index.html"));}throw error;}}
async function cacheFirstExternal(request){const cached=await caches.match(request,{ignoreSearch:false});if(cached)return cached;const response=await fetch(request);if(response&&(response.ok||response.type==="opaque")){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);const sameOrigin=url.origin===self.location.origin;const applePreview=/(^|\.)itunes\.apple\.com$/.test(url.hostname)||/(^|\.)mzstatic\.com$/.test(url.hostname);if(sameOrigin)event.respondWith(networkFirst(event.request));else if(applePreview)event.respondWith(cacheFirstExternal(event.request));});
