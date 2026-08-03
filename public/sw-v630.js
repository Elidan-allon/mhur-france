/* MHUR Nexus — Service Worker V630 */
const CORE='mhur-v630-core';
const RUNTIME='mhur-v630-runtime';
const PRECACHE=["/data/v595-local-patch-assets.js","/css/v54-device-session-guard.css","/js/v54-early-device-guard.js","/css/home.css","/css/community-builds.css","/css/community-auth.css","/css/community-profiles.css","/css/launch.css","/manifest.webmanifest","/css/v432-menu-font-size.css","/css/v28-admin-media.css","/css/nexus-header-links.css","/css/v31-header-admin-layout.css","/css/v511-responsive-ui.css","/css/v512-header-first-paint.css","/css/v513-header-locked-mobile.css","/css/v516-final-targeted-fixes.css","/css/v517-header-panels-final.css","/css/v518-desktop-fixed-header.css","/css/v526-ui-final.css","/css/v527-compact-costume-tuning-detail.css","/css/v531-gentle-stable.css","/css/v520-character-styles.css","/css/v539-mobile-admin.css","/css/v540-final-ui.css","/css/v542-tier-notes-mobile.css","/css/v543-moderation-evidence.css","/css/v547-mobile-profile-roles.css","/css/v548-mobile-season-offset.css","/css/v559-discounts-stable.css","/css/v560-discount-role-dedupe.css","/css/v590-scrollbars-mods.css","/css/v592-notes-mods-stable.css","/css/v593-patch-dev-final.css","/css/v594-translations-tier-patch-arrow.css","/css/v595-patch-portraits-tables.css","/css/v596-tuning-mods.css","/css/v597-patch-layout.css","/css/v601-mobile-costumes.css","/css/v603-mobile-patch-fix.css","/css/v608-patch-notes-final.css","/css/v610-patch-notes-health-no-image.css","/css/v611-patch-notes-health-remove-box.css","/css/v612-mobile-ui-fixes.css","/css/v613-mobile-last-fixes.css","/css/v617-mobile-costumes-exacts.css","/css/v619-mobile-tuning-navigation.css","/css/season18-fixes.css","/css/v626-tier-desktop-details.css","/css/v627-dev-notes-images-instant.css","/data/v627-costume-bounds.js","/js/v627-dev-notes-images-instant.js","/css/v628-tier-dev-final.css","/css/v629-notes-open-stable.css","/js/v513-header-locked-mobile.js","/data/home_data.js","/js/home.js","/data/local_assets_index.js","/data/mhur_database_assets.js","/data/season18_sync.js","/js/season18-early.js","/css/v353-final-fixes.css","/css/v357-critical-fixes.css","/css/v371-mobile-final.css","/css/v398-final-fixes.css","/js/v398-final-fixes.js","/css/v400-final-polish.css","/js/v400-final-polish.js","/css/v405-final-hamburger.css","/js/v401-final-corrections.js","/js/v403-tutorial-image-language.js","/css/community-hub.css","/css/v392-mobile-search-close.css","/js/analytics.js","/js/community-config.js","/js/community-auth.js","/js/community-profiles.js","/css/community-moderation.css","/js/community-moderation.js","/js/community-builds.js","/js/community-hub.js","/js/enhancements.js","/css/v344-fixes.css","/css/v345-fixes.css","/js/v345-fixes.js","/css/v354-comprehensive-fixes.css","/css/v355-major-upgrades.css","/css/v358-final-fixes.css","/css/v360-stability-final.css","/css/v362-layering-fixes.css","/css/v363-header-fix.css","/css/v367-fixes.css","/css/v370-stable-core.css","/js/v370-stable-core.js","/js/v379-final-fix.js","/js/v380-character-translations.js","/js/v381-quirk-translations.js","/css/v385-fixed-header-navigation.css","/js/v385-scroll-navigation.js","/css/v386-menu-sections.css","/css/community-mods.css","/js/vendor/tus.min.js","/js/community-mods.js","/js/v29-user-moderation.js","/js/v395-stable-menu.js","/css/v409-community-edit-fixes.css","/css/v410-community-build-tuning.css","/css/v411-community-plus.css","/js/community-plus.js","/css/v417-mobile-modal-fixes.css","/css/v422-route-stats-fixes.css","/css/v424-route-menu-fixes.css","/css/v412-community-quality.css","/css/v425-fullwidth-tier-date.css","/js/v412-community-quality.js","/css/v426-details-routes.css","/css/v427-navigation-details.css","/js/v429-details.js","/js/v429-router.js","/js/launch-v431.js","/js/v431-final.js","/js/nexus-links-data.js","/js/nexus-header-links.js","/css/v17-mobile-tuning-fix.css","/css/v19-ios-header-update.css","/css/v24-ios-standalone-header.css","/js/v24-ios-standalone.js","/css/v25-desktop-display-guard.css","/css/v29-media-drop.css","/css/v29-user-moderation.css","/css/v30-profile-admin-fixes.css","/js/v30-profile-directory.js","/css/v32-moderation-top-layer.css","/js/v31-header-admin-layout.js","/js/v36-live-site-update.js","/js/v40-community-live-sync.js","/js/v40-ban-message.js","/css/v35-full-ban.css","/js/v35-tuning-language-fix.js","/js/v35-live-moderation.js","/css/v42-mobile-display-fixes.css","/css/v44-mod-upload-auth.css","/css/v50-moderation-center.css","/css/v51-moderation-center.css","/css/v51-responsive-guard.css","/js/v51-moderation-center.js","/js/v51-responsive-guard.js","/css/v52-header-sanction-lock.css","/js/v52-sanction-lock.js","/css/v53-responsive-header-modal.css","/css/v510-back-button-offset.css","/js/v510-back-button-offset.js","/css/v514-targeted-ui-fixes.css","/js/v514-targeted-ui-fixes.js","/js/v516-final-targeted-fixes.js","/js/v517-header-panels-final.js","/js/v526-ui-final.js","/js/v520-character-styles.js","/js/v539-mobile-admin.js","/js/v540-final-stability.js","/js/v542-tier-notes-mobile.js","/js/v543-moderation-evidence.js","/js/v547-mobile-profile-roles.js","/js/v559-discounts-stable.js","/js/v560-discount-role-dedupe.js","/css/v561-discount-full-width.css","/css/v582-final-new.css","/js/v582-final-new.js","/js/v584-patch-notes-final.js","/data/local_skill_assets_v589.js","/css/v587-images-notes-stable.css","/js/v589-local-skill-images.js","/js/v590-scrollbars-mods.js","/js/v592-notes-mods-stable.js","/js/v593-patch-dev-final.js","/js/v594-translations-tier-patch-arrow.js","/js/v595-patch-portraits-tables.js","/js/v596-tuning-mods.js","/js/v601-mobile-patch-gentle.js","/js/v603-mobile-patch-fix.js","/js/v604c-shoto-beta-fix.js","/js/v608-patch-notes-final.js","/js/v609-midoriya-alpha-personnages.js","/js/v610-patch-notes-health-no-image.js","/js/v611-patch-notes-health-remove-box.js","/js/v612-mobile-ui-fixes.js","/js/v613-mobile-last-fixes.js","/js/v619-mobile-tuning-navigation.js","/js/v621-tuning-mobile-smooth-navigation.js","/js/season18-fixes.js","/js/season18-v12.js","/js/v626-tier-final.js","/js/v628-tier-dev-final.js","/js/v629-notes-open-stable.js","/","/index.html","/css/v630-atomic-render.css","/js/v630-atomic-render.js","/data/v630-image-index.js"];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CORE);

    await Promise.allSettled(
      PRECACHE.map(async url=>{
        try{
          const response=await fetch(url,{cache:'reload'});
          if(response.ok)await cache.put(url,response.clone());
        }catch(_error){}
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();

    await Promise.all(
      keys
        .filter(key=>
          key.startsWith('mhur-v')&&
          ![CORE,RUNTIME].includes(key)
        )
        .map(key=>caches.delete(key))
    );

    if(self.registration.navigationPreload){
      try{
        await self.registration.navigationPreload.enable();
      }catch(_error){}
    }

    await self.clients.claim();
  })());
});

async function cachedAsset(request){
  const cache=await caches.open(RUNTIME);
  const cached=await cache.match(request,{ignoreSearch:true});

  if(cached){
    fetch(request)
      .then(response=>{
        if(response.ok)cache.put(request,response.clone());
      })
      .catch(()=>{});

    return cached;
  }

  const response=await fetch(request);

  if(response.ok){
    cache.put(request,response.clone());
  }

  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);

  if(
    request.method!=='GET'||
    url.origin!==self.location.origin
  ){
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        return (
          await event.preloadResponse||
          await fetch(request)
        );
      }catch(_error){
        const cache=await caches.open(CORE);
        return (
          await cache.match('/index.html')||
          await cache.match('/')
        );
      }
    })());

    return;
  }

  if(
    ['image','style','script','font'].includes(
      request.destination
    )||
    /\.(?:png|jpe?g|webp|gif|svg|avif|css|js|woff2?|ttf)$/i
      .test(url.pathname)
  ){
    event.respondWith(cachedAsset(request));
  }
});

self.addEventListener('message',event=>{
  if(event.data?.type!=='PREFETCH')return;

  const urls=Array.isArray(event.data.urls)
    ?event.data.urls
    :[];

  event.waitUntil((async()=>{
    const cache=await caches.open(RUNTIME);

    await Promise.allSettled(
      urls.slice(0,160).map(async raw=>{
        try{
          const url=new URL(raw,self.location.origin);

          if(url.origin!==self.location.origin)return;

          const request=new Request(url.href,{
            mode:'same-origin',
            credentials:'same-origin'
          });

          const existing=await cache.match(
            request,
            {ignoreSearch:true}
          );

          if(existing)return;

          const response=await fetch(request);

          if(response.ok){
            await cache.put(request,response.clone());
          }
        }catch(_error){}
      })
    );
  })());
});
