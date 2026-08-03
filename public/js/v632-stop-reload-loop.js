/* MHUR Nexus — V632
   Nettoyage passif de V630/V631, sans Service Worker de remplacement
   et sans rechargement automatique. */
(function(){
  'use strict';

  if(window.MHUR_V632_PASSIVE_CLEANUP_LOADED)return;
  window.MHUR_V632_PASSIVE_CLEANUP_LOADED=true;

  const root=document.documentElement;

  function reveal(){
    root.classList.remove(
      'mhurV630Booting',
      'mhurV630RouteLoading',
      'mhurV630Ready',
      'mhurV631NoLoader'
    );

    document.body?.style.removeProperty('overflow');
    document.body?.style.removeProperty('visibility');
    document.body?.style.removeProperty('opacity');

    const app=document.getElementById('app');

    app?.style.removeProperty('visibility');
    app?.style.removeProperty('opacity');
  }

  async function unregisterOldWorkers(){
    if(!('serviceWorker' in navigator))return;

    try{
      const registrations=
        await navigator.serviceWorker.getRegistrations();

      await Promise.all(
        registrations.map(async registration=>{
          const worker=
            registration.active||
            registration.waiting||
            registration.installing;

          const url=String(worker?.scriptURL||'');

          if(
            /sw-v630\.js|sw-v631-cleanup\.js/i.test(url)
          ){
            await registration.unregister();
          }
        })
      );
    }catch(error){
      console.warn(
        '[V632] Désinscription des anciens workers impossible.',
        error
      );
    }
  }

  async function clearOldCaches(){
    if(!('caches' in window))return;

    try{
      const keys=await caches.keys();

      await Promise.all(
        keys
          .filter(key=>
            /mhur-v630|mhur-v631/i.test(key)
          )
          .map(key=>caches.delete(key))
      );
    }catch(error){
      console.warn(
        '[V632] Suppression des anciens caches impossible.',
        error
      );
    }
  }

  function clean(){
    reveal();
    unregisterOldWorkers();
    clearOldCaches();
  }

  clean();

  document.addEventListener(
    'DOMContentLoaded',
    reveal,
    {once:true}
  );

  window.addEventListener(
    'pageshow',
    reveal
  );

  window.addEventListener(
    'load',
    clean,
    {once:true}
  );

  window.MHUR_V632_PASSIVE_CLEANUP={
    clean,
    reveal,
    unregisterOldWorkers,
    clearOldCaches
  };
})();
