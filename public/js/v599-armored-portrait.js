
/* MHUR Nexus — V599 : portrait Armored All Might valide et sans cache */
(function(){
  'use strict';

  const VERSION='599';
  const PORTRAIT=(
    'assets/armored_all_might/'+
    'armored_all_might_technical/portrait.webp?v=599'
  );

  function normal(value){
    return String(value??'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function isArmoredCard(card){
    const name=normal(
      card.querySelector(':scope > header h4')?.textContent
    );

    return name.includes('armored_all_might');
  }

  function setPortrait(box,name){
    if(!box)return;

    let image=box.querySelector('img');

    if(!image){
      image=document.createElement('img');
      image.loading='eager';
      image.decoding='async';
      box.replaceChildren(image);
    }

    image.hidden=false;
    image.alt=name||'Armored All Might';
    image.removeAttribute('srcset');

    image.onerror=function(){
      /*
        Une seule nouvelle tentative sans conserver l'ancienne URL en cache.
      */
      if(this.dataset.v599Retry)return;

      this.dataset.v599Retry='1';
      this.src=PORTRAIT+'&retry='+Date.now();
    };

    if(image.getAttribute('src')!==PORTRAIT){
      image.setAttribute('src',PORTRAIT);
    }
  }

  function fixCard(card){
    if(!isArmoredCard(card))return;

    const name=String(
      card.querySelector(':scope > header h4')?.textContent||
      'Armored All Might'
    ).trim();

    setPortrait(
      card.querySelector(
        ':scope > header .s18PatchPortraitV10'
      ),
      name
    );
  }

  function refresh(){
    document.querySelectorAll('.s18PatchCharacterV10')
      .forEach(fixCard);
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
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length||
        mutation.type==='attributes'
      )
    ){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','src','hidden']
  });

  document.addEventListener('click',event=>{
    if(
      event.target?.closest?.(
        '[data-patch-index],'+
        '[data-tab="patch"],'+
        '#mhurPatchDevButtonV14,'+
        '[data-s18-notes-button]'
      )
    ){
      setTimeout(refresh,0);
      setTimeout(refresh,80);
      setTimeout(refresh,220);
    }
  },true);

  window.addEventListener('mhur:languagechange',()=>{
    setTimeout(refresh,0);
    setTimeout(refresh,100);
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      refresh,
      {once:true}
    );
  }else{
    refresh();
  }

  window.addEventListener('load',refresh,{once:true});

  window.MHUR_V599={
    version:VERSION,
    refresh
  };
})();
