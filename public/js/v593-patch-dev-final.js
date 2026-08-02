
/* MHUR Nexus — V593 : Dev Notes et dernier Patch Note final */
(function(){
  'use strict';

  function api(){
    return window.MHUR_S18_V14||window.MHUR_S18_V13||window.MHUR_S18_V10||null;
  }

  function modal(){
    return document.getElementById('s18NotesDevModalV10');
  }

  function bindTabs(){
    const root=modal();
    if(!root)return;

    const patch=root.querySelector('[data-tab="patch"]');
    const dev=root.querySelector('[data-tab="dev"]');

    if(patch){
      patch.textContent='Patch Notes';
      patch.onclick=function(event){
        event.preventDefault();
        api()?.showNotesTab?.('patch');
      };
    }

    if(dev){
      dev.textContent='Dev Notes';
      dev.onclick=function(event){
        event.preventDefault();
        /*
          Appel direct de la vraie fonction interne exportée par V593.
          Le bouton ne se contente plus de devenir jaune.
        */
        api()?.showNotesTab?.('dev');
      };
    }

    root.querySelectorAll('[data-patch-index]').forEach(button=>{
      button.onclick=function(event){
        event.preventDefault();
        api()?.showPatch?.(Number(button.dataset.patchIndex));
      };
    });
  }

  function keepHeaderEnglish(){
    document.querySelectorAll(
      '#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-s18-notes-button]'
    ).forEach(button=>{
      const label=button.querySelector('span:last-child');
      if(label)label.textContent='Patch Notes / Dev Notes';
      button.setAttribute('title','Patch Notes / Dev Notes');
      button.setAttribute('aria-label','Open Patch Notes / Dev Notes');
    });
  }

  function refresh(){
    bindTabs();
    keepHeaderEnglish();
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

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length||mutation.type==='attributes')){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','hidden','aria-hidden']
  });

  document.addEventListener('click',event=>{
    if(event.target?.closest?.('#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-s18-notes-button]')){
      setTimeout(refresh,0);
      setTimeout(refresh,50);
    }
  },true);

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

  window.MHUR_V593={refresh};
})();
