(()=>{
  'use strict';

  const closeLinksPanel=()=>{
    const overlay=document.querySelector('.nexusLinksOverlay.is-open');
    if(!overlay)return;
    const closeButton=overlay.querySelector('.nexusLinksClose');
    if(closeButton)closeButton.click();
    else{
      overlay.classList.remove('is-open');
      document.querySelectorAll('.nexusHeaderBtn').forEach(button=>button.setAttribute('aria-expanded','false'));
    }
  };

  /* Le hamburger ferme d'abord Réseaux sociaux / Créateurs de contenu,
     puis son onclick normal ouvre ou ferme le tiroir principal. */
  document.addEventListener('click',event=>{
    if(event.target.closest('.menuBtn'))closeLinksPanel();
  },true);

  /* Chaque nouvelle ouverture/reconstruction commence bien au début du panneau. */
  const resetPanelScroll=()=>{
    const panel=document.querySelector('.nexusLinksOverlay.is-open .nexusLinksPanel');
    if(panel)panel.scrollTop=0;
  };
  document.addEventListener('click',event=>{
    if(event.target.closest('.nexusHeaderBtn,.nexusBackBtn,.nexusLanguageRow')){
      requestAnimationFrame(resetPanelScroll);
      setTimeout(resetPanelScroll,40);
    }
  });

  /* Après un changement de largeur, on neutralise les anciennes coordonnées
     avant que le navigateur ne repeigne le header desktop. */
  let frame=0;
  const stabilizeHeader=()=>{
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      const header=document.querySelector('header.top');
      if(!header)return;
      if(innerWidth>760){
        header.classList.remove('mhurMobileHeaderV511','mhurMobileHeaderV57','mhurMobileHeaderV58','mhurMobileHeaderV59','mhurMobileHeaderV510');
      }
      const rect=header.getBoundingClientRect();
      const height=Math.max(1,Math.ceil(rect.height));
      const bottom=Math.max(height,Math.ceil(rect.bottom));
      document.documentElement.style.setProperty('--mhur-top-height',`${height}px`);
      document.documentElement.style.setProperty('--mhur-header-bottom',`${bottom}px`);
      document.documentElement.style.setProperty('--mhur-header-visual-bottom',`${bottom}px`);
    });
  };

  addEventListener('resize',stabilizeHeader,{passive:true});
  addEventListener('orientationchange',stabilizeHeader,{passive:true});
  addEventListener('pageshow',stabilizeHeader,{passive:true});
  document.addEventListener('DOMContentLoaded',stabilizeHeader,{once:true});
  addEventListener('load',stabilizeHeader,{once:true});
})();
