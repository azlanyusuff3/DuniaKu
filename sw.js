const CACHE='duniaku-v2.0.0';
const PHASER='https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js';
const LOCAL=['./','./index.html','./styles.css','./app.js','./engine-games.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(LOCAL);
    try{ await cache.add(PHASER); }catch(e){ /* engine can be runtime-cached on first online launch */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:false});
    if(cached) return cached;
    try{
      const response=await fetch(event.request);
      const cache=await caches.open(CACHE);
      cache.put(event.request,response.clone()).catch(()=>{});
      return response;
    }catch(e){
      if(event.request.mode==='navigate') return caches.match('./index.html');
      throw e;
    }
  })());
});
