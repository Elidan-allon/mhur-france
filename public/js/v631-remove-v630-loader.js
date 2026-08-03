/* MHUR Nexus — V631
   Supprime définitivement le loader visible de V630. */
(function(){
  'use strict';

  if(window.MHUR_V631_CLEANUP_LOADED)return;
  window.MHUR_V631_CLEANUP_LOADED=true;

  const root=document.documentElement;

  function reveal(){
    root.classList.remove(
      'mhurV630Booting',
      'mhurV630RouteLoading'
    );

    root.classList.add('mhurV631NoLoader');

    document.body?.style.removeProperty('overflow');
    document.body?.style.removeProperty('visibility');
    document.body?.style.removeProperty('opacity');

    const app=document.getElementById('app');

    app?.style.removeProperty('visibility');
    app?.style.removeProperty('opacity');
  }

  async function clearV630Caches(){
    if(!('caches' in window))return;

    try{
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
    }catch(error){
      console.warn(
        '[V631] Nettoyage du cache V630 impossible.',
        error
      );
    }
  }

  async function replaceOldWorker(){
    if(!('serviceWorker' in navigator))return;

    try{
      const registrations=
        await navigator.serviceWorker.getRegistrations();

      for(const registration of registrations){
        const scriptUrl=
          registration.active?.scriptURL||
          registration.waiting?.scriptURL||
          registration.installing?.scriptURL||
          '';

        if(scriptUrl.includes('sw-v630.js')){
          await registration.unregister();
        }
      }

      /*
        L'enregistrement sur la même portée remplace aussi un ancien
        worker V630 qui contrôlerait encore la page actuelle.
      */
      const registration=
        await navigator.serviceWorker.register(
          '/sw-v631-cleanup.js?v=631',
          {scope:'/'}
        );

      await registration.update().catch(()=>{});
    }catch(error){
      console.warn(
        '[V631] Nettoyage du Service Worker impossible.',
        error
      );
    }
  }

  reveal();

  new MutationObserver(reveal).observe(root,{
    attributes:true,
    attributeFilter:['class']
  });

  document.addEventListener(
    'DOMContentLoaded',
    reveal,
    {once:true}
  );

  window.addEventListener('load',()=>{
    reveal();
    clearV630Caches();
    replaceOldWorker();
  },{once:true});

  window.addEventListener('pageshow',reveal);

  clearV630Caches();
  replaceOldWorker();

  window.MHUR_V631_CLEANUP={
    reveal,
    clearCaches:clearV630Caches,
    clearWorker:replaceOldWorker
  };
})();
