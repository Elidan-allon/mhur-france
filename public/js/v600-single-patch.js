
/* MHUR Nexus — V600 : une seule copie du dernier Patch Note */
(function(){
  'use strict';

  const VERSION='600';
  const PATCH_ID='v1.17.0-14.5';

  function text(value){
    if(value&&typeof value==='object'&&!Array.isArray(value)){
      return String(value.en??value.fr??'');
    }

    return String(value??'');
  }

  function richness(note){
    try{
      return JSON.stringify(note).length;
    }catch(_error){
      return 0;
    }
  }

  function isLatest(note){
    const id=String(note?.id??'').toLowerCase();
    const title=text(note?.title).toLowerCase();

    return (
      id===PATCH_ID||
      title.includes(PATCH_ID)
    );
  }

  function keepOnePatch(){
    const data=window.MHUR_HOME_DATA;

    if(!data||!Array.isArray(data.patch_notes)){
      return null;
    }

    const matches=data.patch_notes
      .filter(isLatest)
      .sort((a,b)=>richness(b)-richness(a));

    const selected=matches[0]||data.patch_notes[0]||null;

    data.patch_notes=selected?[selected]:[];

    return selected;
  }

  function cleanRenderedButtons(){
    const modal=document.getElementById(
      's18NotesDevModalV10'
    );

    const aside=modal?.querySelector('aside');

    if(!aside)return;

    const buttons=[
      ...aside.querySelectorAll('[data-patch-index]')
    ];

    buttons.slice(1).forEach(button=>button.remove());

    const first=buttons[0];

    if(first){
      first.dataset.patchIndex='0';
      first.classList.add('active');
    }
  }

  function refresh(){
    keepOnePatch();
    cleanRenderedButtons();
  }

  /*
    Le script est chargé juste après home_data.js, avant le moteur
    des Patch Notes. Le moteur ne voit donc qu'une seule note.
  */
  keepOnePatch();

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
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  document.addEventListener('click',event=>{
    if(
      event.target?.closest?.(
        '#mhurPatchDevButtonV14,'+
        '[data-s18-notes-button],'+
        '[data-tab="patch"],'+
        '[data-patch-index]'
      )
    ){
      keepOnePatch();
      setTimeout(refresh,0);
      setTimeout(refresh,80);
    }
  },true);

  window.addEventListener('load',refresh,{once:true});

  window.MHUR_V600={
    version:VERSION,
    refresh,
    keepOnePatch
  };
})();
