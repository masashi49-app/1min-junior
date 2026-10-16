// Increment VERSION when releasing changed assets.
const VERSION = 'v1.0.0';
const PREFIX = '1min-junior:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const ASSETS = ['./','./index.html','./style.css','./core.js','./app.js','./manifest.json','./assets/tiara.png','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable.png','./assets/apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
// Activate a complete release only after all old app windows close.
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url = new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    if(event.request.mode==='navigate') return (await cache.match('./index.html')) || fetch(event.request);
    return (await cache.match(event.request)) || fetch(event.request);
  }));
});
