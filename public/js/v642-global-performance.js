(function(){
  'use strict';

  if(window.MHUR_V642_GLOBAL_PERF_LOADED)return;
  window.MHUR_V642_GLOBAL_PERF_LOADED=true;

  const imageSeen=new WeakSet();
  const animationSeen=new WeakSet();
  let scanQueued=false;

  const imageObserver=(
    'IntersectionObserver' in window
      ? new IntersectionObserver(entries=>{
          entries.forEach(entry=>{
            if(!entry.isIntersecting)return;

            const image=entry.target;
            image.loading='eager';

            try{
              image.fetchPriority='high';
            }catch(_error){}

            imageObserver.unobserve(image);
          });
        },{
          rootMargin:'700px 0px'
        })
      : null
  );

  const animationObserver=(
    'IntersectionObserver' in window
      ? new IntersectionObserver(entries=>{
          entries.forEach(entry=>{
            entry.target.classList.toggle(
              'mhurPerfPausedV642',
              !entry.isIntersecting||document.hidden
            );
          });
        },{
          rootMargin:'250px 0px'
        })
      : null
  );

  function registerImage(image,index=0){
    if(!(image instanceof HTMLImageElement))return;
    if(imageSeen.has(image))return;

    imageSeen.add(image);
    image.decoding='async';

    const rect=image.getBoundingClientRect();
    const viewport=Math.max(
      innerHeight||0,
      document.documentElement.clientHeight||0
    );

    const near=(
      rect.height>0&&
      rect.bottom>-300&&
      rect.top<viewport*1.6
    );

    if(near||index<8){
      image.loading='eager';

      try{
        image.fetchPriority=index<5?'high':'auto';
      }catch(_error){}
    }else{
      image.loading='lazy';

      try{
        image.fetchPriority='low';
      }catch(_error){}

      imageObserver?.observe(image);
    }
  }

  function registerAnimation(element){
    if(!(element instanceof Element))return;
    if(animationSeen.has(element))return;

    animationSeen.add(element);
    animationObserver?.observe(element);
  }

  function scan(scope=document){
    const images=(
      scope instanceof HTMLImageElement
        ? [scope]
        : Array.from(scope.querySelectorAll?.('img')||[])
    );

    images.forEach(registerImage);

    const selector=
      '[class*="new" i],[class*="pulse" i],'+
      '[class*="float" i],[class*="glow" i],'+
      '[class*="spin" i],[class*="tick" i]';

    const animated=(
      scope instanceof Element&&scope.matches?.(selector)
        ? [scope]
        : Array.from(scope.querySelectorAll?.(selector)||[])
    );

    animated.forEach(registerAnimation);
  }

  function scheduleScan(scope=document){
    if(scanQueued)return;
    scanQueued=true;

    requestAnimationFrame(()=>{
      scanQueued=false;
      scan(scope);
    });
  }

  new MutationObserver(records=>{
    records.forEach(record=>{
      record.addedNodes.forEach(node=>{
        if(node instanceof Element){
          scheduleScan(node);
        }
      });
    });
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  document.addEventListener('visibilitychange',()=>{
    const selector=
      '[class*="new" i],[class*="pulse" i],'+
      '[class*="float" i],[class*="glow" i],'+
      '[class*="spin" i],[class*="tick" i]';

    document.querySelectorAll(selector).forEach(element=>{
      if(document.hidden){
        element.classList.add('mhurPerfPausedV642');
      }else{
        animationObserver?.unobserve(element);
        animationObserver?.observe(element);
      }
    });
  });

  scan(document);

  window.MHUR_V642_GLOBAL_PERF={
    refresh:()=>scan(document)
  };
})();
