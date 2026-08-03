/* MHUR Nexus — V622
   Empêche le saut latéral des photos de costumes sur mobile.

   La photo reste invisible pendant son décodage et le calcul V618,
   puis apparaît doucement lorsqu'elle est déjà centrée.
   Aucun cadrage, aucune taille et aucune autre interface ne sont modifiés.
*/
(function(){
  'use strict';

  if(window.MHUR_V622_COSTUME_REVEAL_LOADED)return;
  window.MHUR_V622_COSTUME_REVEAL_LOADED=true;

  const MOBILE_QUERY='(max-width:760px)';
  const watched=new WeakSet();
  let refreshQueued=false;

  function mobile(){
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function isMainCostumeImage(image){
    return Boolean(
      image instanceof HTMLImageElement&&
      image.parentElement?.matches?.('.costumeTile')
    );
  }

  function positioningReady(image){
    if(image.dataset.v618Main!=='1')return false;

    const style=image.style;

    return [
      '--v618-left',
      '--v618-top',
      '--v618-width',
      '--v618-height'
    ].every(name=>style.getPropertyValue(name).trim()!=='');
  }

  function requestV618(){
    try{
      const api=window.MHUR_V618_COSTUMES;

      if(api&&typeof api.refresh==='function'){
        api.refresh();
      }
    }catch(_error){}
  }

  function reveal(image){
    if(
      !image.isConnected||
      image.dataset.v622Ready==='1'
    ){
      return;
    }

    /*
      Deux images d'attente garantissent que les variables V618 ont été
      appliquées au style calculé avant de lancer le fondu.
    */
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        if(
          image.isConnected&&
          positioningReady(image)
        ){
          image.dataset.v622Ready='1';
          delete image.dataset.v622Waiting;
        }
      });
    });
  }

  function waitUntilCentered(image){
    if(!isMainCostumeImage(image)||watched.has(image))return;

    watched.add(image);
    image.dataset.v622Waiting='1';

    let startedAt=performance.now();
    let lastRefresh=0;

    function check(){
      if(!image.isConnected)return;

      if(!mobile()){
        image.dataset.v622Ready='1';
        delete image.dataset.v622Waiting;
        return;
      }

      if(positioningReady(image)){
        reveal(image);
        return;
      }

      const now=performance.now();

      if(now-lastRefresh>90){
        lastRefresh=now;
        requestV618();
      }

      /*
        Le rendu de la galerie peut recréer la carte plusieurs fois.
        On continue donc à attendre tant que l'image appartient à la page.
      */
      if(now-startedAt>5000){
        startedAt=now;
      }

      requestAnimationFrame(check);
    }

    const begin=()=>{
      Promise.resolve(
        typeof image.decode==='function'
          ?image.decode().catch(()=>{})
          :undefined
      ).finally(()=>{
        requestV618();
        requestAnimationFrame(check);
      });
    };

    if(image.complete&&image.naturalWidth>0){
      begin();
    }else{
      image.addEventListener('load',begin,{once:true});
      image.addEventListener(
        'error',
        ()=>{
          /*
            En cas d'image réellement absente, ne pas bloquer un éventuel
            gestionnaire de remplacement déjà présent dans le site.
          */
          image.dataset.v622Ready='1';
          delete image.dataset.v622Waiting;
        },
        {once:true}
      );
    }
  }

  function scan(root=document){
    if(!mobile())return;

    if(isMainCostumeImage(root)){
      waitUntilCentered(root);
    }

    if(root?.querySelectorAll){
      root.querySelectorAll('.costumeTile > img')
        .forEach(waitUntilCentered);
    }

    requestV618();
  }

  function scheduleScan(root=document){
    if(refreshQueued)return;

    refreshQueued=true;

    requestAnimationFrame(()=>{
      refreshQueued=false;
      scan(root);
    });
  }

  new MutationObserver(mutations=>{
    for(const mutation of mutations){
      mutation.addedNodes.forEach(node=>{
        if(node.nodeType===Node.ELEMENT_NODE){
          scan(node);
        }
      });
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      ()=>scan(),
      {once:true}
    );
  }else{
    scan();
  }

  window.addEventListener('load',()=>scan(),{once:true});
  window.addEventListener('resize',()=>scheduleScan());
  window.addEventListener('orientationchange',()=>scheduleScan());
  window.addEventListener('hashchange',()=>scheduleScan());
  window.addEventListener('popstate',()=>scheduleScan());
  document.addEventListener('click',()=>scheduleScan(),true);

  window.MHUR_V622_COSTUME_REVEAL={
    refresh(){
      document.querySelectorAll('.costumeTile > img')
        .forEach(image=>{
          watched.delete(image);
          delete image.dataset.v622Ready;
          waitUntilCentered(image);
        });
    }
  };
})();
