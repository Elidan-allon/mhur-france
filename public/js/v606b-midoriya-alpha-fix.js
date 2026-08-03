/* MHUR Nexus — V606B
   Correction finale des images Midoriya dans les Patch Notes.
   Aucun remplacement de groupHtml ni de season18-fixes.js.
*/
(function(){
  'use strict';

  if(window.MHUR_V606B_LOADED)return;
  window.MHUR_V606B_LOADED=true;

  const VERSION='606b';

  const EXACT_IMAGES=[
    {
      matches:[
        'delaware_smash_air_force'
      ],
      src:'assets/midoriya/midoriya_assault/alpha.webp'
    },
    {
      matches:[
        'delaware_smash_full_bullet',
        'full_bullet'
      ],
      src:'assets/midoriya/midoriya_attack/alpha.webp'
    },
    {
      matches:[
        'delaware_smash_airblast',
        'rafale_d_air',
        'airblast'
      ],
      src:'assets/midoriya_ofa/alpha.webp'
    }
  ];

  function clean(value){
    return String(value??'').trim();
  }

  function norm(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function titleOf(change){
    return clean(change.querySelector('h5')?.textContent);
  }

  function labelOf(change){
    return clean(
      change.querySelector(
        '.s18PatchLabelV10,'+
        '.s18PatchChangeBarV10,'+
        '.s18PatchStatBarV10,'+
        '.miniTableTitle'
      )?.textContent
    );
  }

  function isHealth(change){
    const title=norm(titleOf(change));
    const label=norm(labelOf(change));

    return (
      title==='hp'||
      title==='pv'||
      title==='health'||
      title==='maximum_hp'||
      title==='maximum_main_health'||
      label==='hp'||
      label==='pv'||
      label==='health'
    );
  }

  function exactImage(change){
    const value=norm(
      titleOf(change)+' '+labelOf(change)
    );

    const row=EXACT_IMAGES.find(item=>
      item.matches.some(match=>value.includes(match))
    );

    return row?.src||'';
  }

  function layoutOf(change){
    return change.querySelector('.s18PatchSkillV10');
  }

  function mainOf(layout){
    return layout?.querySelector(':scope > main');
  }

  function removePicture(change){
    const layout=layoutOf(change);
    const main=mainOf(layout);

    if(!layout||!main)return;

    let changed=false;

    [...layout.children].forEach(child=>{
      if(child!==main&&child.tagName==='DIV'){
        child.remove();
        changed=true;
      }
    });

    layout.classList.add('s18NoSkillImageV606B');
    change.dataset.patchSkillImage='';

    return changed;
  }

  function ensurePicture(change,src){
    const layout=layoutOf(change);
    const main=mainOf(layout);

    if(!layout||!main||!src)return false;

    let box=[...layout.children].find(
      child=>child!==main&&child.tagName==='DIV'
    );

    let changed=false;

    if(!box){
      box=document.createElement('div');
      box.className='s18PatchSkillImageV606B';
      layout.insertBefore(box,main);
      changed=true;
    }

    let image=box.querySelector('img');

    if(!image){
      image=document.createElement('img');
      image.loading='lazy';
      image.decoding='async';
      box.replaceChildren(image);
      changed=true;
    }

    image.removeAttribute('srcset');
    image.alt=titleOf(change);
    image.hidden=false;
    image.onerror=null;

    const versioned=src+'?v='+VERSION;

    if(image.getAttribute('src')!==versioned){
      image.setAttribute('src',versioned);
      changed=true;
    }

    layout.classList.remove('s18NoSkillImageV606B');
    change.dataset.patchSkillImage=src;

    return changed;
  }

  function fixChange(change){
    if(isHealth(change)){
      removePicture(change);
      return;
    }

    const src=exactImage(change);

    if(src){
      ensurePicture(change,src);
    }
  }

  function refresh(){
    document.querySelectorAll(
      '.s18PatchChangeV10'
    ).forEach(fixChange);
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;

      try{
        refresh();
      }catch(_error){}
    });
  }

  /*
    Uniquement les nouveaux éléments.
    Aucune surveillance des attributs src/class :
    pas de boucle de chargement infinie.
  */
  const observer=new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length
      )
    ){
      schedule();
    }
  });

  function start(){
    refresh();

    observer.observe(document.documentElement,{
      childList:true,
      subtree:true
    });
  }

  document.addEventListener('click',event=>{
    if(
      event.target?.closest?.(
        '[data-patch-index],'+
        '#mhurPatchDevButtonV14,'+
        '[data-s18-notes-button],'+
        '[data-tab="patch"]'
      )
    ){
      setTimeout(schedule,0);
      setTimeout(schedule,80);
      setTimeout(schedule,220);
    }
  },true);

  window.addEventListener(
    'mhur:languagechange',
    ()=>{
      setTimeout(schedule,0);
      setTimeout(schedule,100);
    }
  );

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once:true}
    );
  }else{
    start();
  }

  window.addEventListener(
    'load',
    schedule,
    {once:true}
  );

  window.MHUR_V606B={
    version:VERSION,
    refresh
  };
})();
