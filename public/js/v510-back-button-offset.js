(()=>{
  'use strict';

  const MOBILE_MAX=760;
  const ROOT=document.documentElement;
  let raf=0;
  let headerObserver=null;
  let headerResizeObserver=null;
  let appObserver=null;

  const header=()=>document.querySelector('header.top');
  const app=()=>document.getElementById('app');

  function isVisible(element){
    if(!(element instanceof Element))return false;
    const style=getComputedStyle(element);
    return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity||1)!==0;
  }

  function visualHeaderBottom(node){
    const candidates=[node,...node.querySelectorAll('*')];
    let bottom=0;
    for(const element of candidates){
      if(!isVisible(element))continue;
      const rect=element.getBoundingClientRect();
      if(rect.width<=0||rect.height<=0)continue;
      /* On ne compte que les éléments qui appartiennent réellement à la zone du header.
         Les menus déroulants/overlays fixes sont exclus afin de ne pas créer un énorme espace. */
      if(element!==node){
        const position=getComputedStyle(element).position;
        if(position==='fixed'||position==='absolute'||position==='sticky'||element.closest('.nexusLinksOverlay,.drawer,.modal,.modsModal,.mhurModal'))continue;
      }
      bottom=Math.max(bottom,rect.bottom);
    }
    const own=node.getBoundingClientRect();
    return Math.max(bottom,own.bottom,own.height);
  }

  function updateAppState(){
    const node=app();
    if(!node)return;
    let hasBack=false;
    try{hasBack=!!node.querySelector(':scope > .back')}catch(_){hasBack=!!node.querySelector('.back')}
    node.classList.toggle('mhurHasBackV57',hasBack);
  }

  function measureNow(){
    const node=header();
    if(!node||innerWidth>MOBILE_MAX){
      ROOT.style.removeProperty('--mhur-header-visual-bottom');
      return;
    }
    node.classList.add('mhurMobileHeaderV510');
    const bottom=Math.max(1,Math.ceil(visualHeaderBottom(node)+2));
    ROOT.style.setProperty('--mhur-header-visual-bottom',`${bottom}px`);
    ROOT.style.setProperty('--mhur-header-bottom',`${bottom}px`);
    ROOT.style.setProperty('--mhur-top-height',`${bottom}px`);
    updateAppState();
  }

  function measure(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(measureNow);
  }

  function burst(){
    measure();
    requestAnimationFrame(measure);
    setTimeout(measure,40);
    setTimeout(measure,140);
    setTimeout(measure,450);
  }

  function mount(){
    const h=header();
    const a=app();
    if(h){
      headerObserver?.disconnect();
      headerObserver=new MutationObserver(burst);
      headerObserver.observe(h,{attributes:true,childList:true,subtree:true,characterData:true});
      if('ResizeObserver' in window){
        headerResizeObserver?.disconnect();
        headerResizeObserver=new ResizeObserver(measure);
        headerResizeObserver.observe(h);
        Array.from(h.children).forEach(child=>headerResizeObserver.observe(child));
      }
    }
    if(a){
      appObserver?.disconnect();
      appObserver=new MutationObserver(()=>{updateAppState();measure()});
      appObserver.observe(a,{childList:true,subtree:false});
    }
    burst();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  addEventListener('load',mount,{once:true});
  addEventListener('resize',burst,{passive:true});
  addEventListener('orientationchange',burst,{passive:true});
  addEventListener('pageshow',burst,{passive:true});
  visualViewport?.addEventListener('resize',burst,{passive:true});
  document.fonts?.ready?.then(burst).catch(()=>{});
  setTimeout(mount,80);
  setTimeout(burst,600);
  setTimeout(burst,1600);
})();
