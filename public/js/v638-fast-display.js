(function(){
  'use strict';
  if(window.MHUR_V638_FAST_LOADED)return;
  window.MHUR_V638_FAST_LOADED=true;

  const root=document.documentElement;
  let queued=false;

  function reveal(){
    root.classList.remove(
      'mhurV630Booting','mhurV630RouteLoading','mhurV630Ready',
      'mhurV631NoLoader','mhurV633Preparing','mhurV633RoutePreparing',
      'mhurV633CPreparing','mhurV633CRoutePreparing',
      'mhurV636InitialPreparing','mhurV636RoutePreparing',
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

  function prioritize(scope=document){
    const viewport=Math.max(
      window.innerHeight||0,
      document.documentElement.clientHeight||0
    );

    Array.from(scope.querySelectorAll?.('img')||[])
      .forEach((image,index)=>{
        image.decoding='async';
        image.dataset.v622Ready='1';
        delete image.dataset.v622Waiting;

        const rect=image.getBoundingClientRect();
        const near=(
          rect.height>0&&
          rect.bottom>-250&&
          rect.top<viewport*1.7
        );

        if(near||index<12){
          image.loading='eager';
          try{image.fetchPriority=index<8?'high':'auto'}catch(_error){}
        }else{
          image.loading='lazy';
          try{image.fetchPriority='low'}catch(_error){}
        }
      });
  }

  function refresh(){
    reveal();
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      prioritize(document.getElementById('app')||document);
    });
  }

  new MutationObserver(records=>{
    if(records.some(record=>
      record.addedNodes.length||record.type==='attributes'
    ))refresh();
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['src']
  });

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',refresh,{once:true});
  }else{
    refresh();
  }

  window.addEventListener('pageshow',refresh);
  window.addEventListener('load',refresh,{once:true});
  window.addEventListener('hashchange',refresh);
  window.addEventListener('popstate',refresh);

  window.MHUR_V638_FAST={refresh,reveal};
})();
