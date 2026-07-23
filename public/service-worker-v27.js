const RELEASE='27';
const CACHE_PREFIX='mhur-nexus-v';
const CACHE=`${CACHE_PREFIX}${RELEASE}`;
const OFFLINE='/index.html';
const SHELL=[
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/version.json',
  '/assets/brand/icon-192.png',
  '/assets/brand/icon-512.png',
  '/css/v24-ios-standalone-header.css',
  '/css/v25-desktop-display-guard.css',
  '/js/v24-ios-standalone.js',
  '/js/v27-pwa-update.js',
  '/js/community-mods.js'
];

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(
      SHELL.map(url=>cache.add(new Request(url,{cache:'reload'})))
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE)
        .map(key=>caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        if(fresh.ok){
          const cache=await caches.open(CACHE);
          await cache.put(OFFLINE,fresh.clone());
        }
        return fresh;
      }catch(_){
        return (await caches.match(OFFLINE))||new Response(
          'Connexion indisponible.',
          {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}}
        );
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    try{
      const fresh=await fetch(request,{cache:'no-store'});
      if(fresh.ok){
        const cache=await caches.open(CACHE);
        await cache.put(request,fresh.clone());
      }
      return fresh;
    }catch(_){
      return (await caches.match(request))||new Response('',{status:503});
    }
  })());
});
