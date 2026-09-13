const CACHE='lautrec-rpg-v4-1';
const ASSETS=['./','./index.html','./styles.css','./v4.css','./app.js','./v4.js','./manifest.webmanifest','./assets/icon.svg','./assets/hero.svg','./assets/map.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
