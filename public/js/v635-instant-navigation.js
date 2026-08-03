/* MHUR Nexus — V635
   Supprime uniquement l'attente artificielle entre les pages.

   - le premier chargement V633C reste inchangé ;
   - aucun écran blanc entre deux routes ;
   - aucune attente d'image avant d'afficher la nouvelle page ;
   - les images commencent immédiatement en priorité.
*/
(function(){
  'use strict';

  if(window.MHUR_V635_INSTANT_NAV_LOADED)return;
  window.MHUR_V635_INSTANT_NAV_LOADED=true;

  const root=document.documentElement;
  let queued=false;

  function prioritizeImages(scope=document){
    const images=Array.from(
      scope.querySelectorAll?.('img')||[]
    );

    images.forEach((image,index)=>{
      image.decoding='async';

      if(index<36){
        image.loading='eager';

        try{
          image.fetchPriority=index<16?'high':'auto';
        }catch(_error){}
      }

      image.dataset.v622Ready='1';
      delete image.dataset.v622Waiting;

      /*
        Lance le décodage sans attendre son résultat et sans bloquer
        l'affichage de la page.
      */
      try{
        image.decode?.().catch(()=>{});
      }catch(_error){}
    });
  }

  function revealRouteImmediately(){
    if(root.classList.contains('mhurV633CRoutePreparing')){
      root.classList.remove('mhurV633CRoutePreparing');
      root.classList.add('mhurV633CRouteReady');
    }

    const app=document.getElementById('app');

    if(app){
      app.style.removeProperty('visibility');
      app.style.removeProperty('opacity');
      app.style.removeProperty('pointer-events');
    }
  }

  function refresh(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      revealRouteImmediately();
      prioritizeImages(document.getElementById('app')||document);
    });
  }

  new MutationObserver(mutations=>{
    const routeClassChanged=mutations.some(mutation=>
      mutation.type==='attributes'&&
      mutation.target===root
    );

    const contentChanged=mutations.some(mutation=>
      mutation.type==='childList'&&
      (
        mutation.addedNodes.length||
        mutation.removedNodes.length
      )
    );

    if(routeClassChanged||contentChanged){
      refresh();
    }
  }).observe(document.documentElement,{
    attributes:true,
    attributeFilter:['class'],
    childList:true,
    subtree:true
  });

  ['pointerdown','touchstart','click'].forEach(type=>{
    document.addEventListener(type,refresh,{
      capture:true,
      passive:true
    });
  });

  window.addEventListener('popstate',refresh);
  window.addEventListener('hashchange',refresh);
  window.addEventListener('pageshow',refresh);

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      refresh,
      {once:true}
    );
  }else{
    refresh();
  }

  window.MHUR_V635_INSTANT_NAV={
    refresh,
    reveal:revealRouteImmediately
  };
})();
