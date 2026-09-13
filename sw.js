const CACHE='lautrec-rpg-v6';
const ASSETS=['./','./index.html','./styles.css?v=6','./v4.css?v=6','./v5.css?v=6','./explore.css?v=6','./app.js?v=6','./v4.js?v=6','./v5.js?v=6','./explore.js?v=6','./manifest.webmanifest','./assets/icon.svg','./assets/hero.svg','./assets/map.svg','./assets/veyre-night.svg','./assets/story/awakening.webp','./assets/story/tunnels.webp','./assets/story/mirror.webp'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put('./index.html',copy)); return response;
    }).catch(()=>caches.match('./index.html'))); return;
  }
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));} return response;
  }).catch(()=>caches.match(event.request)));
});
