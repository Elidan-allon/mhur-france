/* MHUR Nexus — V633C
   Révélation du rendu final sans écran de chargement visible.

   - aucun Service Worker ;
   - aucun location.reload() ;
   - aucun déplacement des feuilles CSS ;
   - délai maximum strict pour ne jamais bloquer le site.
*/
(function(){
  'use strict';

  if(window.MHUR_V633C_LOADED)return;
  window.MHUR_V633C_LOADED=true;

  const root=document.documentElement;
  const INITIAL_MAX=2100;
  const ROUTE_MAX=900;

  let initialDone=false;
  let routeToken=0;
  let routeTimer=0;
  let lastUrl=location.href;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function withTimeout(promise,delay){
    return Promise.race([
      Promise.resolve(promise),
      sleep(delay)
    ]);
  }

  function prepareImages(scope=document){
    const images=Array.from(
      scope.querySelectorAll?.('img')||[]
    );

    images.forEach((image,index)=>{
      image.decoding='async';

      if(index<32){
        image.loading='eager';

        try{
          image.fetchPriority=index<12?'high':'auto';
        }catch(_error){}
      }

      image.dataset.v622Ready='1';
      delete image.dataset.v622Waiting;
    });

    return images;
  }

  function visibleImages(scope){
    const height=Math.max(
      innerHeight||0,
      document.documentElement.clientHeight||0
    );

    return prepareImages(scope)
      .filter(image=>{
        const rect=image.getBoundingClientRect();

        return (
          rect.width>0&&
          rect.height>0&&
          rect.bottom>-100&&
          rect.top<height*1.3
        );
      })
      .slice(0,40);
  }

  function waitImage(image){
    return new Promise(resolve=>{
      let done=false;

      const finish=async()=>{
        if(done)return;
        done=true;

        try{
          if(image.decode)await image.decode();
        }catch(_error){}

        resolve();
      };

      if(image.complete){
        finish();
        return;
      }

      image.addEventListener('load',finish,{once:true});
      image.addEventListener('error',finish,{once:true});
      setTimeout(finish,850);
    });
  }

  function waitStyles(){
    const styles=Array.from(
      document.querySelectorAll(
        'link[rel~="stylesheet"][href]'
      )
    );

    return Promise.allSettled(
      styles.map(style=>{
        if(style.sheet)return Promise.resolve();

        return new Promise(resolve=>{
          style.addEventListener('load',resolve,{once:true});
          style.addEventListener('error',resolve,{once:true});
          setTimeout(resolve,1050);
        });
      })
    );
  }

  async function waitQuiet(scope,limit=650){
    if(!scope)return;

    let lastChange=performance.now();

    const observer=new MutationObserver(()=>{
      lastChange=performance.now();
      prepareImages(scope);
    });

    observer.observe(scope,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['src','class']
    });

    const start=performance.now();

    while(performance.now()-start<limit){
      if(performance.now()-lastChange>100)break;
      await sleep(24);
    }

    observer.disconnect();
  }

  async function prepare(scope,maxDelay){
    prepareImages(scope);

    await withTimeout(
      Promise.allSettled([
        waitStyles(),
        document.fonts?.ready||Promise.resolve(),
        waitQuiet(scope)
      ]),
      Math.min(1150,maxDelay)
    );

    await withTimeout(
      Promise.allSettled(
        visibleImages(scope).map(waitImage)
      ),
      Math.max(250,maxDelay-700)
    );

    await new Promise(resolve=>{
      requestAnimationFrame(()=>{
        requestAnimationFrame(resolve);
      });
    });
  }

  function revealInitial(){
    if(initialDone)return;
    initialDone=true;

    clearTimeout(window.MHUR_V633C_EMERGENCY);

    root.classList.remove(
      'mhurV633CPreparing',
      'mhurV633CRoutePreparing'
    );

    root.classList.add(
      'mhurV633CReady',
      'mhurV633CRouteReady'
    );

    document.body?.style.removeProperty('overflow');
  }

  async function boot(){
    const scope=document.getElementById('app')||document.body||document;

    await prepare(scope,INITIAL_MAX);
    revealInitial();
  }

  function revealRoute(token){
    if(token!==routeToken)return;

    clearTimeout(routeTimer);
    root.classList.remove('mhurV633CRoutePreparing');
    root.classList.add('mhurV633CRouteReady');
  }

  async function prepareRoute(){
    if(!initialDone)return;

    const token=++routeToken;

    root.classList.remove('mhurV633CRouteReady');
    root.classList.add('mhurV633CRoutePreparing');

    clearTimeout(routeTimer);
    routeTimer=setTimeout(
      ()=>revealRoute(token),
      ROUTE_MAX+150
    );

    const scope=document.getElementById('app')||document.body||document;

    await prepare(scope,ROUTE_MAX);
    revealRoute(token);
  }

  function routeChanged(){
    if(location.href===lastUrl)return;
    lastUrl=location.href;
    prepareRoute();
  }

  ['pushState','replaceState'].forEach(name=>{
    const original=history[name];

    if(typeof original!=='function')return;

    history[name]=function(){
      const result=original.apply(this,arguments);
      queueMicrotask(routeChanged);
      return result;
    };
  });

  addEventListener('popstate',()=>{
    lastUrl='';
    routeChanged();
  });

  addEventListener('hashchange',()=>{
    lastUrl='';
    routeChanged();
  });

  new MutationObserver(()=>{
    prepareImages(document);
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  addEventListener('pageshow',event=>{
    if(event.persisted){
      revealInitial();
      root.classList.remove('mhurV633CRoutePreparing');
      root.classList.add('mhurV633CRouteReady');
    }
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {once:true}
    );
  }else{
    boot();
  }

  setTimeout(revealInitial,INITIAL_MAX+250);

  window.MHUR_V633C={
    reveal:revealInitial,
    refresh:prepareRoute
  };
})();
