/* MHUR Nexus — V631 cleanup worker.
   Remplace puis désinstalle le Service Worker V630. */
self.addEventListener('install',event=>{
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();

    await Promise.all(
      keys
        .filter(key=>
          key.includes('mhur-v630')||
          key==='mhur-v630-core'||
          key==='mhur-v630-runtime'
        )
        .map(key=>caches.delete(key))
    );

    await self.clients.claim();

    const clients=await self.clients.matchAll({
      type:'window',
      includeUncontrolled:true
    });

    clients.forEach(client=>{
      client.postMessage({
        type:'MHUR_V631_V630_REMOVED'
      });
    });

    await self.registration.unregister();
  })());
});
