const RELEASE='36';
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
  '/css/v28-admin-media.css',
  '/css/v29-media-drop.css',
  '/css/v29-user-moderation.css',
  '/css/v30-profile-admin-fixes.css',
  '/css/v31-header-admin-layout.css',
  '/css/v32-moderation-top-layer.css',
  '/js/v24-ios-standalone.js',
  '/js/v36-live-site-update.js',
  '/js/v370-stable-core.js?v=36',
  '/js/v429-details.js?v=36',
  '/js/v31-header-admin-layout.js',
  '/js/community-auth.js',
  '/js/community-profiles.js',
  '/js/community-moderation.js',
  '/js/community-mods.js',
  '/js/community-hub.js',
  '/js/community-builds.js',
  '/js/v29-user-moderation.js',
  '/js/v30-profile-directory.js'
];
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const fresh=await fetch(request,{cache:'no-store'});if(fresh.ok){const cache=await caches.open(CACHE);await cache.put(OFFLINE,fresh.clone())}return fresh}catch(_){return (await caches.match(OFFLINE))||new Response('Connexion indisponible.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}})());return;
  }
  event.respondWith((async()=>{try{const fresh=await fetch(request,{cache:'no-store'});if(fresh.ok){const cache=await caches.open(CACHE);await cache.put(request,fresh.clone())}return fresh}catch(_){return (await caches.match(request))||new Response('',{status:503})}})());
});
