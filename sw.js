const CACHE='lautrec-rpg-v8';
const ASSETS=['./','./index.html','./styles.css?v=8','./v4.css?v=8','./v5.css?v=8','./explore.css?v=8','./action-v6.css?v=8','./detective-game.css?v=8','./polish-v8.css?v=8','./app.js?v=8','./v4.js?v=8','./v5.js?v=8','./explore.js?v=8','./action-v6.js?v=8','./detective-game.js?v=8','./polish-v8.js?v=8','./manifest.webmanifest','./assets/icon.svg','./assets/hero.svg','./assets/map.svg','./assets/veyre-night.svg','./assets/story/awakening.webp','./assets/story/tunnels.webp','./assets/story/mirror.webp','./assets/story/archives-v8.webp','./assets/story/black-bell-v8.webp'];

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
