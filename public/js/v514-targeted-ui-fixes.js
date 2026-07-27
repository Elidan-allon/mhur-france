(()=>{
  'use strict';

  const findOverlay=()=>document.querySelector('.nexusLinksOverlay');

  function closeLinksPanel(){
    const overlay=document.querySelector('.nexusLinksOverlay.is-open');
    if(!overlay)return;
    const closeButton=overlay.querySelector('.nexusLinksClose');
    if(closeButton)closeButton.click();
    else{
      overlay.classList.remove('is-open');
      document.querySelectorAll('.nexusHeaderBtn').forEach(button=>button.setAttribute('aria-expanded','false'));
    }
  }

  function resetPanelScroll(){
    const overlay=document.querySelector('.nexusLinksOverlay.is-open');
    const panel=overlay?.querySelector('.nexusLinksPanel');
    if(!panel)return;
    panel.scrollTop=0;
    panel.scrollLeft=0;
    try{panel.scrollTo({top:0,left:0,behavior:'auto'})}catch(_){}
  }

  /* Le hamburger ferme d'abord Réseaux sociaux / Créateurs de contenu,
     puis son gestionnaire normal ouvre ou ferme le tiroir principal. */
  document.addEventListener('click',event=>{
    if(event.target.closest('.menuBtn'))closeLinksPanel();
  },true);

  /* Les panneaux sont recréés quand on change de langue ou de rubrique.
     On remet donc leur défilement à zéro à chaque vraie ouverture/reconstruction. */
  let overlayObserver=null;
  let panelObserver=null;
  function observeOverlay(){
    const overlay=findOverlay();
    if(!overlay)return false;
    overlayObserver?.disconnect();
    panelObserver?.disconnect();
    overlayObserver=new MutationObserver(records=>{
      if(records.some(record=>record.type==='attributes'&&overlay.classList.contains('is-open'))){
        requestAnimationFrame(resetPanelScroll);
        setTimeout(resetPanelScroll,60);
      }
    });
    overlayObserver.observe(overlay,{attributes:true,attributeFilter:['class']});
    const panel=overlay.querySelector('.nexusLinksPanel');
    if(panel){
      panelObserver=new MutationObserver(()=>{
        if(overlay.classList.contains('is-open')){
          requestAnimationFrame(resetPanelScroll);
          setTimeout(resetPanelScroll,30);
        }
      });
      panelObserver.observe(panel,{childList:true,subtree:false});
    }
    return true;
  }

  if(!observeOverlay()){
    const bodyObserver=new MutationObserver(()=>{
      if(observeOverlay())bodyObserver.disconnect();
    });
    const start=()=>bodyObserver.observe(document.body,{childList:true});
    if(document.body)start();
    else document.addEventListener('DOMContentLoaded',start,{once:true});
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('.nexusHeaderBtn,.nexusBackBtn,.nexusLanguageRow')){
      requestAnimationFrame(resetPanelScroll);
      setTimeout(resetPanelScroll,60);
      setTimeout(resetPanelScroll,160);
    }
  });

  /* On mesure seulement le header. On ne retire ni n'ajoute aucune classe :
     la restauration du compte ne peut ainsi provoquer aucune reconstruction. */
  let frame=0;
  function measureHeader(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      const header=document.querySelector('header.top');
      if(!header)return;
      const rect=header.getBoundingClientRect();
      const height=Math.max(1,Math.ceil(rect.height));
      const bottom=Math.max(height,Math.ceil(rect.bottom));
      document.documentElement.style.setProperty('--mhur-top-height',`${height}px`);
      document.documentElement.style.setProperty('--mhur-header-bottom',`${bottom}px`);
      document.documentElement.style.setProperty('--mhur-header-visual-bottom',`${bottom}px`);
    });
  }

  addEventListener('resize',measureHeader,{passive:true});
  addEventListener('orientationchange',measureHeader,{passive:true});
  addEventListener('pageshow',measureHeader,{passive:true});
  document.addEventListener('DOMContentLoaded',measureHeader,{once:true});
  addEventListener('load',measureHeader,{once:true});
})();
