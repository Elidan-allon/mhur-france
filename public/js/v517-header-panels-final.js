(()=>{
  'use strict';

  const root=document.documentElement;
  const mobile=matchMedia('(max-width:760px)');
  let raf=0;
  let headerObserver=null;
  let overlayObserver=null;
  let headerResizeObserver=null;

  const visibleRect=node=>{
    if(!(node instanceof Element))return null;
    const css=getComputedStyle(node);
    if(css.display==='none'||css.visibility==='hidden')return null;
    const rect=node.getBoundingClientRect();
    return rect.width>0&&rect.height>0?rect:null;
  };

  function fullHeaderBottom(){
    const header=document.querySelector('header.top');
    if(!header)return 0;

    const h=visibleRect(header);
    let bottom=h?.bottom||0;
    const brand=header.querySelector('.mhurMobileBrandRowV57');
    const toolbar=header.querySelector('.mhurMobileToolbarV57');

    [brand,toolbar,...header.querySelectorAll('.menuBtn,.nexusHeaderBtn,#mhurAdminButton,#mhurAccountButton,.lang')]
      .forEach(node=>{const rect=visibleRect(node);if(rect)bottom=Math.max(bottom,rect.bottom)});

    /* Filet de sécurité iOS : même si une ancienne règle donne une boîte trop
       petite au header, on reconstitue le bas des deux lignes. */
    const brandRect=visibleRect(brand);
    const toolbarRect=visibleRect(toolbar);
    if(brandRect&&toolbarRect){
      bottom=Math.max(bottom,brandRect.bottom,toolbarRect.bottom);
      if(toolbarRect.top>=brandRect.top)bottom=Math.max(bottom,toolbarRect.top+toolbarRect.height);
    }

    const safeTop=parseFloat(getComputedStyle(root).getPropertyValue('--mhur-mobile-safe-top'))||0;
    const fallback=(innerWidth<=390?100:108)+safeTop;
    const headerTop=h?.top||0;
    bottom=Math.max(bottom,headerTop+fallback);
    return Math.ceil(bottom+6);
  }

  function resetPanelScroll(){
    const overlay=document.querySelector('.nexusLinksOverlay');
    const panel=overlay?.querySelector('.nexusLinksPanel');
    if(!overlay||!panel)return;
    overlay.scrollTop=0;
    overlay.scrollLeft=0;
    panel.scrollTop=0;
    panel.scrollLeft=0;
    try{overlay.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){ }
    try{panel.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){ }
  }

  function applyPanelTop(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      if(!mobile.matches){
        root.style.removeProperty('--mhur-v517-measured-header-bottom');
        return;
      }
      const top=fullHeaderBottom();
      if(!top)return;
      root.style.setProperty('--mhur-v517-measured-header-bottom',`${top}px`);
      const overlay=document.querySelector('.nexusLinksOverlay');
      if(overlay){
        overlay.style.setProperty('top',`${top}px`,'important');
        overlay.style.setProperty('inset-block-start',`${top}px`,'important');
        overlay.style.setProperty('bottom','0','important');
        overlay.style.setProperty('height','auto','important');
      }
    });
  }

  function settleOpenPanel(){
    applyPanelTop();
    resetPanelScroll();
    requestAnimationFrame(()=>{applyPanelTop();resetPanelScroll()});
    [25,70,140,260,500,900].forEach(delay=>setTimeout(()=>{
      applyPanelTop();
      resetPanelScroll();
    },delay));
  }

  function observeOverlay(){
    const overlay=document.querySelector('.nexusLinksOverlay');
    if(!overlay||overlay.dataset.mhurV517Observed==='1')return;
    overlay.dataset.mhurV517Observed='1';
    overlayObserver?.disconnect();
    overlayObserver=new MutationObserver(()=>{
      if(overlay.classList.contains('is-open'))settleOpenPanel();
    });
    overlayObserver.observe(overlay,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }

  function observeHeader(){
    const header=document.querySelector('header.top');
    if(!header)return;
    headerObserver?.disconnect();
    headerObserver=new MutationObserver(()=>{
      applyPanelTop();
      observeOverlay();
    });
    headerObserver.observe(header,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});

    if('ResizeObserver' in window){
      headerResizeObserver?.disconnect();
      headerResizeObserver=new ResizeObserver(applyPanelTop);
      headerResizeObserver.observe(header);
      header.querySelectorAll('.mhurMobileBrandRowV57,.mhurMobileToolbarV57').forEach(node=>headerResizeObserver.observe(node));
    }
  }

  document.addEventListener('pointerdown',event=>{
    if(event.target.closest('.nexusHeaderBtn'))applyPanelTop();
  },true);

  document.addEventListener('click',event=>{
    if(event.target.closest('.nexusHeaderBtn'))settleOpenPanel();
    if(event.target.closest('.nexusLinksClose,.nexusBackBtn,.nexusLanguageRow'))setTimeout(settleOpenPanel,0);
  },true);

  const start=()=>{
    applyPanelTop();
    observeHeader();
    observeOverlay();
    const overlay=document.querySelector('.nexusLinksOverlay.is-open');
    if(overlay)settleOpenPanel();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
  addEventListener('load',start,{once:true});
  addEventListener('pageshow',start,{passive:true});
  addEventListener('resize',start,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(start,80),{passive:true});
  mobile.addEventListener?.('change',start);
  if(window.visualViewport){
    visualViewport.addEventListener('resize',applyPanelTop,{passive:true});
    visualViewport.addEventListener('scroll',applyPanelTop,{passive:true});
  }
  setTimeout(start,200);
  setTimeout(start,800);
})();
