
/* MHUR Nexus — V596 : flèche Mods impossible à masquer par les anciens patchs */
(function(){
  'use strict';

  const CLASS_NAME='mhurModsToggleV596';

  function svg(open){
    const path=open
      ?'M18 39 L32 25 L46 39'
      :'M18 25 L32 39 L46 25';

    return (
      '<svg viewBox="0 0 64 64" aria-hidden="true">'+
        '<circle cx="32" cy="32" r="28"></circle>'+
        '<path d="'+path+'"></path>'+
      '</svg>'
    );
  }

  function install(details){
    if(!(details instanceof HTMLElement))return;

    const summary=details.querySelector(':scope > summary');
    if(!summary)return;

    /*
      Retire l'ancien chevron vide du composant source.
      Le nom de la nouvelle classe ne contient ni Arrow ni Chevron :
      les anciens sélecteurs ne peuvent donc pas la cacher.
    */
    summary.querySelectorAll(
      '.modsTutorialChevronV540,'+
      '[data-mods-arrow],'+
      '[data-mhur-extra-mod-arrow],'+
      '[data-v549-old-arrow],'+
      '[data-v592-old-arrow],'+
      '.mhurModsArrowV594'
    ).forEach(element=>element.remove());

    let toggle=summary.querySelector(':scope > .'+CLASS_NAME);

    if(!toggle){
      toggle=document.createElement('span');
      toggle.className=CLASS_NAME;
      toggle.setAttribute('aria-hidden','true');
      summary.appendChild(toggle);
    }

    toggle.innerHTML=svg(details.open);
  }

  function refresh(){
    document.querySelectorAll('.modsTutorial').forEach(install);
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      refresh();
    });
  }

  document.addEventListener('toggle',event=>{
    if(event.target?.classList?.contains('modsTutorial')){
      install(event.target);
    }
  },true);

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  window.addEventListener('mhur:languagechange',()=>{
    setTimeout(refresh,0);
    setTimeout(refresh,80);
  });

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',refresh,{once:true});
  }else{
    refresh();
  }

  window.addEventListener('load',refresh,{once:true});

  window.MHUR_V596={
    refresh,
    install
  };
})();
