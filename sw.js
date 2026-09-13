const CACHE='lautrec-rpg-v8-2';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(async()=>{
        const cached=await caches.match(event.request);
        if(cached)return cached;
        if(event.request.mode==='navigate'){
          const home=await caches.match('./index.html');
          if(home)return home;
          return new Response('<!doctype html><meta charset="utf-8"><title>Lautrec</title><style>body{background:#08080b;color:#eadfc7;font:18px system-ui;padding:30px}button{padding:12px}</style><h1>Connexion nécessaire</h1><p>Reconnecte-toi à Internet puis recharge Lautrec RPG.</p><button onclick="location.reload()">Réessayer</button>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
        }
        return new Response('',{status:503,statusText:'Offline'});
      })
  );
});
