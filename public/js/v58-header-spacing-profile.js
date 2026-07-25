(()=>{
  'use strict';
  const MOBILE_MAX=760;
  const ROOT=document.documentElement;
  let queued=false;

  function header(){return document.querySelector('header.top')}

  function updateHeight(){
    const h=header();
    if(!h||innerWidth>MOBILE_MAX)return;
    requestAnimationFrame(()=>{
      const px=Math.max(1,Math.ceil(h.getBoundingClientRect().height));
      ROOT.style.setProperty('--mhur-top-height',`${px}px`);
    });
  }

  function arrange(){
    const h=header();
    if(!h)return;
    if(innerWidth<=MOBILE_MAX){
      h.classList.add('mhurMobileHeaderV58');
      /* Le changement d'ordre est uniquement visuel via CSS `order`.
         On ne déplace pas les nœuds : l'observateur v5.7 ne peut donc pas
         remettre l'ancien ordre et créer une boucle de mutations. */
      updateHeight();
    }else{
      h.classList.remove('mhurMobileHeaderV58');
    }
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;arrange()});
  }

  function mount(){
    const h=header();
    if(!h)return;
    new MutationObserver(schedule).observe(h,{childList:true,subtree:true});
    if('ResizeObserver' in window)new ResizeObserver(updateHeight).observe(h);
    arrange();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  addEventListener('load',schedule,{once:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  setTimeout(schedule,100);
  setTimeout(schedule,600);
})();
