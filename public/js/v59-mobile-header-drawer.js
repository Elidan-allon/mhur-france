(()=>{
  'use strict';
  const MOBILE_MAX=760;
  const ROOT=document.documentElement;
  let frame=0;
  let headerObserver=null;
  let drawerObserver=null;
  let resizeObserver=null;

  const getHeader=()=>document.querySelector('header.top');
  const getDrawer=()=>document.getElementById('drawer')||document.querySelector('.drawer');

  function measure(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      const header=getHeader();
      if(!header||window.innerWidth>MOBILE_MAX){
        ROOT.style.removeProperty('--mhur-header-bottom');
        return;
      }
      header.classList.add('mhurMobileHeaderV59');
      const rect=header.getBoundingClientRect();
      const height=Math.max(1,Math.ceil(rect.height));
      const bottom=Math.max(height,Math.ceil(rect.bottom));
      ROOT.style.setProperty('--mhur-top-height',`${height}px`);
      ROOT.style.setProperty('--mhur-header-bottom',`${bottom}px`);
    });
  }

  function burst(){
    measure();
    requestAnimationFrame(measure);
    setTimeout(measure,40);
    setTimeout(measure,140);
    setTimeout(measure,400);
  }

  function mountObservers(){
    const header=getHeader();
    const drawer=getDrawer();
    if(header){
      headerObserver?.disconnect();
      headerObserver=new MutationObserver(burst);
      headerObserver.observe(header,{attributes:true,childList:true,subtree:true,characterData:true});
      if('ResizeObserver' in window){
        resizeObserver?.disconnect();
        resizeObserver=new ResizeObserver(measure);
        resizeObserver.observe(header);
      }
    }
    if(drawer){
      drawerObserver?.disconnect();
      drawerObserver=new MutationObserver(burst);
      drawerObserver.observe(drawer,{attributes:true,attributeFilter:['class','style']});
    }
  }

  function mount(){
    mountObservers();
    burst();
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('.menuBtn'))burst();
  },true);
  document.addEventListener('DOMContentLoaded',mount,{once:true});
  window.addEventListener('load',mount,{once:true});
  window.addEventListener('resize',burst,{passive:true});
  window.addEventListener('orientationchange',burst,{passive:true});
  window.visualViewport?.addEventListener('resize',burst,{passive:true});
  window.visualViewport?.addEventListener('scroll',measure,{passive:true});
  document.fonts?.ready?.then(burst).catch(()=>{});
  setTimeout(mount,80);
  setTimeout(burst,500);
  setTimeout(burst,1500);
})();
