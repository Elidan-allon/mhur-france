const CACHE='mhur-v351';
const CORE=['./','./index.html','./css/home.css','./js/home.js','./css/community-builds.css','./js/community-builds.js','./css/community-auth.css','./js/community-auth.js','./css/community-profiles.css','./js/community-profiles.js','./css/community-moderation.css','./js/community-moderation.js','./css/launch.css','./js/launch.js','./css/community-hub.css','./js/community-hub.js','./css/v344-fixes.css','./js/v344-fixes.js','./css/v345-fixes.css','./js/v345-fixes.js','./js/community-config.js','./js/auto-update.js','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const isVersion=url.pathname.endsWith('/version.json');
  const isWorker=url.pathname.endsWith('/service-worker.js');

  if(isVersion||isWorker){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  event.respondWith(
    fetch(event.request,{cache:event.request.mode==='navigate'?'no-store':'default'})
      .then(response=>{
        if(response&&response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error())))
  );
});
