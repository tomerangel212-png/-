const CACHE = "tra-kfar-bloom-2026-offline-v28-station-999-mobile-audio-entry";
const HITSTER_OFFLINE = [
  "./hitster.html","./hitster-888.html","./hitster-888-en.html","./hitster-kfar-bloom-2026-demo.html","./hitster-original.js","./hitster-kfar-bloom-2026-demo.js","./hitster-hebrew-alist-888.json",
  "./games.html","./games.css","./games.js","./games-loader.js","./games-hub.js","./manifest.webmanifest","./assets/tra-mark.svg","./tra-quality.js","./TRA_VERSION.json","./TRA_QUALITY.json","./TRA_PRINCIPLES.json","./TRA_PERFECT_QUALITY.md"
];
const CORE = [
  "./","./index.html","./links/","./links/index.html","./links.html","./tree.html","./linktree.html","./tomer-links.html","./styles.css","./app.js","./manifest.webmanifest","./assets/tra-mark.svg","./tra-quality.js","./TRA_VERSION.json","./TRA_QUALITY.json","./TRA_PRINCIPLES.json","./TRA_PERFECT_QUALITY.md","./TRA_VERSION_HISTORY.md",
  "./games.html","./games.css","./games.js","./games-loader.js","./games-hub.js","./hitster.html","./hitster-888.html","./hitster-888-en.html","./hitster-original.js","./casino-angel.html","./connect-talk.html","./music-drive.html","./music-editor.html","./tra-music-station.html","./tra-music-station.json","./tra-music-station-extra-555.json","./tra-music-station-corrections-5.json",
  "./hitster-kfar-bloom-2026-demo.html","./hitster-kfar-bloom-2026-demo.js","./hitster-hebrew-alist-888.json",
  "./songs/","./songs/index.html","./poetry/","./poetry/index.html","./instrumentals/","./instrumentals/index.html","./tra-dashboard/","./tra-dashboard/index.html"
];
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(CORE.map(url=>cache.add(url)));await self.skipWaiting();})());});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener("message",event=>{if(event.data?.type!=="CACHE_HITSTER_OFFLINE")return;event.waitUntil((async()=>{const cache=await caches.open(CACHE);const results=await Promise.allSettled(HITSTER_OFFLINE.map(url=>cache.add(url)));const failed=results.filter(result=>result.status==="rejected").length;event.source?.postMessage({type:"HITSTER_OFFLINE_READY",ok:failed===0,cached:HITSTER_OFFLINE.length-failed,total:HITSTER_OFFLINE.length});})());});
function injectQuality(html){if(html.includes("tra-quality.js"))return html;return html.replace(/<\/body>/i,'<script src="./tra-quality.js"></script></body>');}
async function networkFirst(request){
  try{
    const response=await fetch(request);
    if(response&&response.ok){
      const type=response.headers.get("content-type")||"";
      if(request.mode==="navigate"&&type.includes("text/html")){
        const text=injectQuality(await response.clone().text());
        const transformed=new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
        caches.open(CACHE).then(cache=>cache.put(request,transformed.clone())).catch(()=>{});
        return transformed;
      }
      caches.open(CACHE).then(cache=>cache.put(request,response.clone())).catch(()=>{});
    }
    return response;
  }catch(error){
    const cached=await caches.match(request,{ignoreSearch:true});
    if(cached){
      const type=cached.headers.get("content-type")||"";
      if(request.mode==="navigate"&&type.includes("text/html")){const text=injectQuality(await cached.clone().text());return new Response(text,{status:cached.status,statusText:cached.statusText,headers:cached.headers});}
      return cached;
    }
    if(request.mode==="navigate"){
      const url=new URL(request.url);
      if(url.pathname.includes("tra-music-station"))return(await caches.match("./tra-music-station.html"))||(await caches.match("./games.html"))||(await caches.match("./index.html"));
      if(url.pathname.includes("hitster-888"))return(await caches.match("./hitster-888.html"))||(await caches.match("./hitster.html"))||(await caches.match("./index.html"));
      if(url.pathname.includes("hitster-kfar-bloom"))return(await caches.match("./hitster-kfar-bloom-2026-demo.html"))||(await caches.match("./hitster.html"))||(await caches.match("./index.html"));
      if(url.pathname.includes("hitster"))return(await caches.match("./hitster.html"))||(await caches.match("./hitster-888.html"))||(await caches.match("./hitster-kfar-bloom-2026-demo.html"))||(await caches.match("./index.html"));
      return(await caches.match("./games.html"))||(await caches.match("./index.html"));
    }
    throw error;
  }
}
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url);if(url.origin===self.location.origin)event.respondWith(networkFirst(event.request));});
