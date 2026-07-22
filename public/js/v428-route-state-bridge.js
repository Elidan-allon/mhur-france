/* V428 — maintient l’URL et l’état interne synchronisés sur toutes les pages. */
(function(){
  'use strict';

  const VALID=new Set(['home','characters','tunings','costumes','builds','mods']);

  function mirrorState(){
    try{
      if(typeof page!=='undefined') window.page=page;
      if(typeof selectedChar!=='undefined') window.selectedChar=selectedChar||null;
      if(typeof selectedStyle!=='undefined') window.selectedStyle=selectedStyle||null;
      if(typeof selectedCostume!=='undefined') window.selectedCostume=selectedCostume||null;
    }catch(_e){}
  }

  function pageFromPath(){
    const first=location.pathname.split('/').filter(Boolean)[0]||'home';
    if(first==='tuning') return 'tunings';
    return VALID.has(first)?first:'home';
  }

  function restoreFromPath(){
    /* Accepte aussi /tuning et le normalise vers /tunings. */
    if(location.pathname==='/tuning' || location.pathname.startsWith('/tuning/')){
      history.replaceState(history.state,'',location.pathname.replace(/^\/tuning(?=\/|$)/,'/tunings')+location.search);
    }
    const expected=pageFromPath();
    try{
      if(typeof page!=='undefined' && page!==expected){
        window.MHUR_CLEAN_ROUTES?.apply?.();
      }
    }catch(_e){}
    mirrorState();
  }

  /* Le vieux synchroniseur lit window.page après chaque clic. On le met donc à
     jour immédiatement, avant son setTimeout(0), pour qu’il ne remplace plus
     /tunings, /characters, /costumes ou /builds par /. */
  document.addEventListener('click',function(event){
    const nav=event.target.closest?.('[data-page]');
    if(nav){
      const target=nav.dataset.page;
      if(VALID.has(target)){
        window.page=target;
        window.selectedChar=null;
        window.selectedStyle=null;
        window.selectedCostume=null;
      }
      return;
    }
    queueMicrotask(mirrorState);
  },true);

  addEventListener('popstate',()=>setTimeout(restoreFromPath,0));
  addEventListener('pageshow',restoreFromPath);
  addEventListener('DOMContentLoaded',restoreFromPath,{once:true});
  setTimeout(restoreFromPath,0);
})();
