/* MHUR Nexus — V625
   Place directement le badge NEW dans la vraie carte .mhurTierItem. */
(function(){
  'use strict';

  if(window.MHUR_V625_TIER_DIRECT_LOADED)return;
  window.MHUR_V625_TIER_DIRECT_LOADED=true;

  let queued=false;

  function repair(root=document){
    root.querySelectorAll?.(
      '#mhurTierList .mhurTierItem'
    ).forEach(card=>{
      const badge=card.querySelector(
        '.s18NewBadge,[class*="s18NewBadge"]'
      );

      if(!badge)return;

      const oldParent=badge.parentElement;

      if(oldParent!==card){
        card.insertBefore(badge,card.firstChild);

        if(
          oldParent&&
          oldParent!==card&&
          oldParent.childElementCount===0&&
          !String(oldParent.textContent||'').trim()
        ){
          oldParent.remove();
        }
      }

      card.dataset.v625New='1';
    });
  }

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      repair();
    });
  }

  new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length)){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      schedule,
      {once:true}
    );
  }else{
    schedule();
  }

  window.addEventListener('load',schedule,{once:true});
  window.addEventListener('mhur:languagechange',schedule);

  window.MHUR_V625_TIER_DIRECT={
    refresh:schedule,
    repair
  };
})();
