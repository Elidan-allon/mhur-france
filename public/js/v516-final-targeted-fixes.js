(()=>{
  'use strict';

  const root=document.documentElement;
  const mobile=matchMedia('(max-width:760px)');
  let resizeObserver=null;
  let mutationObserver=null;
  let frame=0;

  function visibleBottom(element){
    if(!element)return 0;
    const style=getComputedStyle(element);
    if(style.display==='none'||style.visibility==='hidden')return 0;
    const rect=element.getBoundingClientRect();
    return rect.width>0&&rect.height>0?rect.bottom:0;
  }

  function exactHeaderBottom(){
    const header=document.querySelector('header.top');
    if(!header)return 0;
    const brandRow=header.querySelector(':scope > .mhurMobileBrandRowV57');
    const toolbar=header.querySelector(':scope > .mhurMobileToolbarV57');
    const candidates=[
      header,brandRow,toolbar,
      toolbar?.querySelector(':scope > .menuBtn'),
      toolbar?.querySelector(':scope > .nexusHeaderLinks'),
      toolbar?.querySelector(':scope > .mhurTopActionsV31'),
      ...header.querySelectorAll('.mhurMobileToolbarV57 .nexusHeaderBtn'),
      document.getElementById('mhurAdminButton'),
      document.getElementById('mhurAccountButton'),
      header.querySelector('.lang')
    ];
    return Math.max(0,...candidates.map(visibleBottom));
  }

  function measureHeader(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      const header=document.querySelector('header.top');
      if(!header)return;
      const rect=header.getBoundingClientRect();
      const visualBottom=Math.max(Math.ceil(rect.bottom),Math.ceil(exactHeaderBottom()));
      const height=Math.max(1,Math.ceil(rect.height));
      root.style.setProperty('--mhur-top-height',`${height}px`);
      root.style.setProperty('--mhur-header-bottom',`${visualBottom}px`);
      root.style.setProperty('--mhur-header-visual-bottom',`${visualBottom}px`);
      if(mobile.matches){
        const panelTop=visualBottom+4;
        root.style.setProperty('--mhur-links-panel-top',`${panelTop}px`);
      }else{
        root.style.removeProperty('--mhur-links-panel-top');
      }
    });
  }

  function resetOpenPanel(){
    const panel=document.querySelector('.nexusLinksOverlay.is-open .nexusLinksPanel');
    if(!panel)return;
    panel.scrollTop=0;
    panel.scrollLeft=0;
    try{panel.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){}
  }

  function securePanel(){
    measureHeader();
    requestAnimationFrame(()=>{
      measureHeader();
      resetOpenPanel();
    });
    [35,90,180,320].forEach(delay=>setTimeout(()=>{
      measureHeader();
      resetOpenPanel();
    },delay));
  }

  function observe(){
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
    const header=document.querySelector('header.top');
    if(!header)return;
    if('ResizeObserver' in window){
      resizeObserver=new ResizeObserver(measureHeader);
      resizeObserver.observe(header);
      const brandRow=header.querySelector(':scope > .mhurMobileBrandRowV57');
      const toolbar=header.querySelector(':scope > .mhurMobileToolbarV57');
      if(brandRow)resizeObserver.observe(brandRow);
      if(toolbar)resizeObserver.observe(toolbar);
    }
    mutationObserver=new MutationObserver(()=>{
      measureHeader();
      const overlay=document.querySelector('.nexusLinksOverlay.is-open');
      if(overlay)securePanel();
    });
    mutationObserver.observe(header,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});
  }

  /* La mesure est faite avant le gestionnaire d'ouverture du panneau. */
  document.addEventListener('pointerdown',event=>{
    if(event.target.closest('.nexusHeaderBtn'))measureHeader();
  },true);
  document.addEventListener('click',event=>{
    if(event.target.closest('.nexusHeaderBtn,.nexusLanguageRow,.nexusBackBtn'))securePanel();
  },true);

  const start=()=>{
    measureHeader();
    observe();
    securePanel();
  };

  addEventListener('resize',()=>{measureHeader();observe()},{passive:true});
  addEventListener('orientationchange',()=>setTimeout(start,60),{passive:true});
  addEventListener('pageshow',start,{passive:true});
  if(window.visualViewport){
    visualViewport.addEventListener('resize',measureHeader,{passive:true});
    visualViewport.addEventListener('scroll',measureHeader,{passive:true});
  }
  mobile.addEventListener?.('change',start);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  addEventListener('load',start,{once:true});
})();
