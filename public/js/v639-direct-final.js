/* MHUR Nexus — V639
   Aucun masque, aucun délai et aucun Service Worker.
   Le CSS final est déjà chargé avant le premier rendu.
*/
(function(){
  'use strict';

  if(window.MHUR_V639_DIRECT_FINAL_LOADED)return;
  window.MHUR_V639_DIRECT_FINAL_LOADED=true;

  const root=document.documentElement;
  const registered=new WeakSet();

  function reveal(){
    root.classList.remove(
      'mhurV630Booting',
      'mhurV630RouteLoading',
      'mhurV630Ready',
      'mhurV631NoLoader',
      'mhurV633Preparing',
      'mhurV633RoutePreparing',
      'mhurV633CPreparing',
      'mhurV633CRoutePreparing',
      'mhurV636InitialPreparing',
      'mhurV636RoutePreparing',
      'mhurV637Preparing'
    );

    document.body?.style.removeProperty('overflow');
    document.body?.style.removeProperty('visibility');
    document.body?.style.removeProperty('opacity');

    const app=document.getElementById('app');
    app?.style.removeProperty('visibility');
    app?.style.removeProperty('opacity');
    app?.style.removeProperty('pointer-events');
  }

  const observer=(
    'IntersectionObserver' in window
      ? new IntersectionObserver(entries=>{
          entries.forEach(entry=>{
            if(!entry.isIntersecting)return;

            const image=entry.target;

            image.loading='eager';

            try{
              image.fetchPriority='high';
            }catch(_error){}

            observer.unobserve(image);
          });
        },{
          rootMargin:'700px 0px'
        })
      : null
  );

  function registerImage(image,index=0){
    if(!(image instanceof HTMLImageElement))return;
    if(registered.has(image))return;

    registered.add(image);

    image.decoding='async';
    image.dataset.v622Ready='1';
    delete image.dataset.v622Waiting;

    if(index<10){
      image.loading='eager';

      try{
        image.fetchPriority=index<6?'high':'auto';
      }catch(_error){}
    }else{
      image.loading='lazy';

      try{
        image.fetchPriority='low';
      }catch(_error){}

      observer?.observe(image);
    }
  }

  function registerImages(scope=document){
    if(scope instanceof HTMLImageElement){
      registerImage(scope,0);
      return;
    }

    Array.from(
      scope.querySelectorAll?.('img')||[]
    ).forEach(registerImage);
  }

  new MutationObserver(records=>{
    reveal();

    records.forEach(record=>{
      record.addedNodes.forEach(node=>{
        if(!(node instanceof Element))return;

        registerImages(node);
      });
    });
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  reveal();
  registerImages(document);

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      ()=>{
        reveal();
        registerImages(document);
      },
      {once:true}
    );
  }

  window.addEventListener('pageshow',()=>{
    reveal();
    registerImages(document);
  });

  window.MHUR_V639_DIRECT_FINAL={
    reveal,
    refresh:registerImages
  };
})();
