const CACHE='lautrec-rpg-v9';
const CORE=['./','./index.html','./v9.css?v=9','./v9.js?v=9','./manifest.webmanifest','./assets/icon.svg','./assets/veyre-night.svg','./assets/story/awakening.webp','./assets/story/tunnels.webp','./assets/story/mirror.webp','./assets/story/archives-v8.webp','./assets/story/black-bell-v8.webp'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(CORE.map(url=>cache.add(url))))) });
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{})}return r}).catch(()=>caches.match(e.request).then(r=>r||new Response('Hors ligne',{status:503}))))});
