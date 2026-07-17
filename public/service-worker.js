// V359: service worker intentionally disabled to prevent stale OAuth returns.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())await caches.delete(k);await self.registration.unregister();const clients=await self.clients.matchAll({type:'window'});for(const c of clients)c.navigate(c.url)})()));
