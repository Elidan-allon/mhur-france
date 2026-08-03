/* MHUR Nexus — V630
   Ne révèle l'interface qu'après le rendu final et les images visibles.
   Ajoute un cache Service Worker pour les visites suivantes. */
(function(){
  'use strict';

  if(window.MHUR_V630_ATOMIC_LOADED)return;
  window.MHUR_V630_ATOMIC_LOADED=true;

  const html=document.documentElement;
  const MAX_BOOT_WAIT=9000;
  const MAX_ROUTE_WAIT=5000;
  const imageIndex=Array.isArray(window.MHUR_V630_IMAGE_INDEX)
    ?window.MHUR_V630_IMAGE_INDEX
    :[];

  let initialDone=false;
  let routeToken=0;
  let routeTimer=0;
  let observedApp=null;
  let appObserver=null;
  let lastUrl=location.href;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function withTimeout(promise,ms){
    return Promise.race([
      Promise.resolve(promise),
      sleep(ms)
    ]);
  }

  function markImagesEarly(scope=document){
    const images=Array.from(
      scope.querySelectorAll?.('img')||[]
    );

    images.forEach((image,index)=>{
      image.loading=index<18?'eager':(image.loading||'lazy');
      image.decoding='async';

      try{
        image.fetchPriority=index<10?'high':'auto';
      }catch(_error){}

      /* Empêche les anciennes couches de masquer la photo. */
      image.dataset.v622Ready='1';
      delete image.dataset.v622Waiting;
    });

    return images;
  }

  function routeTokens(){
    const ignored=new Set([
      'characters','character','personnages','personnage',
      'costumes','costume','builds','build','styles','style',
      'details','detail','mhurfrance','index','html'
    ]);

    return decodeURIComponent(
      `${location.pathname} ${location.hash} ${location.search}`
    )
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(token=>token.length>=3&&!ignored.has(token));
  }

  function preloadRouteImages(){
    const tokens=routeTokens();
    if(!tokens.length||!imageIndex.length)return [];

    const matches=imageIndex
      .filter(path=>{
        const normalized=String(path)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g,'')
          .toLowerCase();

        return tokens.some(token=>normalized.includes(token));
      })
      .sort((a,b)=>{
        const priority=value=>{
          const path=String(value).toLowerCase();
          if(/portrait|style|card|character/.test(path))return 0;
          if(/costume/.test(path))return 1;
          return 2;
        };

        return priority(a)-priority(b);
      })
      .slice(0,18);

    return matches.map((url,index)=>{
      const image=new Image();
      image.decoding='async';
      image.loading='eager';

      try{
        image.fetchPriority=index<8?'high':'auto';
      }catch(_error){}

      image.src=url;

      return image.decode
        ?image.decode().catch(()=>{})
        :new Promise(resolve=>{
            image.onload=image.onerror=resolve;
          });
    });
  }

  function waitStyles(){
    const links=Array.from(
      document.querySelectorAll('link[rel~="stylesheet"][href]')
    );

    return Promise.allSettled(
      links.map(link=>{
        if(link.sheet)return Promise.resolve();

        return new Promise(resolve=>{
          link.addEventListener('load',resolve,{once:true});
          link.addEventListener('error',resolve,{once:true});
          setTimeout(resolve,4000);
        });
      })
    );
  }

  async function waitForApp(){
    const started=performance.now();

    while(performance.now()-started<MAX_BOOT_WAIT){
      const app=document.getElementById('app');

      if(
        app&&
        app.getBoundingClientRect().width>0&&
        String(app.innerHTML||'').trim().length>80
      ){
        return app;
      }

      await sleep(25);
    }

    return document.getElementById('app');
  }

  async function waitStable(scope){
    if(!scope)return;

    let previous='';
    let stable=0;
    const started=performance.now();

    while(performance.now()-started<1800){
      const rect=scope.getBoundingClientRect();
      const signature=[
        Math.round(rect.width),
        Math.round(rect.height),
        Math.round(scope.scrollWidth||0),
        Math.round(scope.scrollHeight||0),
        scope.childElementCount
      ].join(':');

      if(signature===previous){
        stable++;
      }else{
        stable=0;
        previous=signature;
      }

      if(stable>=4)return;
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
  }

  function visibleImages(scope){
    const height=Math.max(
      innerHeight||0,
      document.documentElement.clientHeight||0
    );

    return markImagesEarly(scope)
      .filter(image=>{
        const rect=image.getBoundingClientRect();

        return (
          rect.width>0&&
          rect.height>0&&
          rect.bottom>-180&&
          rect.top<height*1.45
        );
      })
      .slice(0,40);
  }

  function imageReady(image){
    return new Promise(resolve=>{
      const finish=async()=>{
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
      image.addEventListener('error',resolve,{once:true});
      setTimeout(resolve,5000);
    });
  }

  function backgroundUrls(scope){
    const found=new Set();
    const nodes=Array.from(scope?.querySelectorAll?.('*')||[])
      .slice(0,1000);

    for(const node of nodes){
      const rect=node.getBoundingClientRect();

      if(
        rect.width<=0||
        rect.height<=0||
        rect.bottom<-100||
        rect.top>innerHeight*1.25
      ){
        continue;
      }

      const value=getComputedStyle(node).backgroundImage;

      for(const match of value.matchAll(/url\((['"]?)(.*?)\1\)/g)){
        const url=match[2];

        if(url&&!url.startsWith('data:')){
          found.add(url);
        }
      }

      if(found.size>=20)break;
    }

    return Array.from(found);
  }

  function preloadBackgrounds(scope){
    return backgroundUrls(scope).map(url=>{
      const image=new Image();
      image.decoding='async';
      image.src=url;

      return image.decode
        ?image.decode().catch(()=>{})
        :new Promise(resolve=>{
            image.onload=image.onerror=resolve;
          });
    });
  }

  async function prepareScope(scope,maxWait){
    const images=visibleImages(scope);

    await withTimeout(
      Promise.allSettled([
        waitStyles(),
        document.fonts?.ready||Promise.resolve(),
        waitStable(scope),
        ...images.map(imageReady),
        ...preloadBackgrounds(scope)
      ]),
      maxWait
    );

    await new Promise(resolve=>requestAnimationFrame(()=>{
      requestAnimationFrame(resolve);
    }));
  }

  function revealInitial(){
    html.classList.remove('mhurV630Booting');
    html.classList.add('mhurV630Ready');
    initialDone=true;

    window.dispatchEvent(
      new CustomEvent('mhur:v630-ready')
    );
  }

  function revealRoute(token){
    if(token!==routeToken)return;
    html.classList.remove('mhurV630RouteLoading');
  }

  async function settleRoute(){
    const token=++routeToken;
    clearTimeout(routeTimer);
    html.classList.add('mhurV630RouteLoading');

    routeTimer=setTimeout(
      ()=>revealRoute(token),
      MAX_ROUTE_WAIT
    );

    const app=await waitForApp();
    await prepareScope(app||document,MAX_ROUTE_WAIT);
    clearTimeout(routeTimer);
    revealRoute(token);
  }

  function observeApp(){
    const app=document.getElementById('app');

    if(!app||app===observedApp)return;

    appObserver?.disconnect();
    observedApp=app;

    appObserver=new MutationObserver(records=>{
      markImagesEarly(app);

      if(!initialDone)return;

      const urlChanged=location.href!==lastUrl;
      if(urlChanged)lastUrl=location.href;

      const significant=records.some(record=>
        record.target===app&&
        (record.addedNodes.length||record.removedNodes.length)
      );

      if(urlChanged||significant){
        settleRoute();
      }
    });

    appObserver.observe(app,{
      childList:true,
      subtree:false
    });
  }

  function postPrefetch(){
    if(!navigator.serviceWorker?.controller)return;

    const urls=Array.from(
      document.querySelectorAll(
        '#app img[src],header img[src],.top img[src]'
      )
    )
      .map(image=>image.currentSrc||image.src)
      .filter(Boolean)
      .slice(0,120);

    navigator.serviceWorker.controller.postMessage({
      type:'PREFETCH',
      urls
    });
  }

  async function registerWorker(){
    if(!('serviceWorker' in navigator))return;

    try{
      await navigator.serviceWorker.register(
        '/sw-v630.js?v=630',
        {scope:'/'}
      );
    }catch(error){
      console.warn('[V630] Service Worker indisponible.',error);
    }
  }

  function installNetworkNotice(){
    const notice=document.createElement('div');
    notice.id='mhurV630OfflineNotice';
    notice.textContent='Mode hors connexion : affichage depuis le cache local.';
    document.body.appendChild(notice);

    const refresh=()=>{
      html.classList.toggle(
        'mhurV630Offline',
        !navigator.onLine
      );
    };

    addEventListener('online',refresh);
    addEventListener('offline',refresh);
    refresh();
  }

  async function boot(){
    markImagesEarly(document);
    const routePreloads=preloadRouteImages();
    const app=await waitForApp();

    observeApp();

    await withTimeout(
      Promise.allSettled([
        ...routePreloads,
        prepareScope(app||document,MAX_BOOT_WAIT)
      ]),
      MAX_BOOT_WAIT
    );

    revealInitial();
    installNetworkNotice();
    registerWorker();

    setTimeout(postPrefetch,400);
    setTimeout(postPrefetch,1800);
  }

  new MutationObserver(()=>{
    markImagesEarly(document);
    observeApp();
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  addEventListener('popstate',()=>{
    lastUrl=location.href;
    if(initialDone)settleRoute();
  });

  addEventListener('hashchange',()=>{
    lastUrl=location.href;
    if(initialDone)settleRoute();
  });

  addEventListener('pageshow',event=>{
    if(event.persisted){
      html.classList.remove(
        'mhurV630Booting',
        'mhurV630RouteLoading'
      );
      html.classList.add('mhurV630Ready');
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

  /* Sécurité absolue : le contenu reste utilisable même si un asset échoue. */
  setTimeout(()=>{
    if(!initialDone)revealInitial();
  },MAX_BOOT_WAIT+1200);

  window.MHUR_V630_ATOMIC={
    refresh:settleRoute,
    prefetch:postPrefetch
  };
})();
