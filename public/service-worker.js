const RELEASE='364';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())await caches.delete(key);
  await self.clients.claim();
})()));
// Network-only: required for PWA installation, but never serves an old site version.
self.addEventListener('fetch',event=>{
  if(event.request.method==='GET')event.respondWith(fetch(event.request,{cache:'no-store'}));
});
