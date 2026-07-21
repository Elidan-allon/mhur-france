const RELEASE='414';
const CACHE=`mhur-fr-${RELEASE}`;
const SHELL=[
  './','./index.html','./manifest.webmanifest','./favicon.ico','./version.json',
  './css/community-builds.css','./css/community-hub.css','./css/community-mods.css','./css/v410-community-build-tuning.css','./css/v411-community-plus.css','./css/v412-community-quality.css',
  './js/community-config.js','./js/community-auth.js','./js/community-profiles.js','./js/community-builds.js','./js/community-hub.js','./js/community-mods.js','./js/community-plus.js','./js/v412-community-quality.js',
  './data/home_data.js'
];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.allSettled(SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        const cache=await caches.open(CACHE);cache.put('./index.html',response.clone());return response;
      }catch(_){return (await caches.match('./index.html'))||(await caches.match('./'))||new Response('Connexion indisponible.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}
    })());return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    const network=fetch(request).then(async response=>{
      if(response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone())}
      return response;
    }).catch(()=>null);
    return cached||(await network)||new Response('',{status:503});
  })());
});
