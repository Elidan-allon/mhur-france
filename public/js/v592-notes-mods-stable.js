
/* MHUR Nexus — V592 : Notes fiables et flèche Mods propre */
(function(){
  'use strict';

  const VERSION='592';
  const HEADER_LABEL='Patch Notes / Dev Notes';

  function notesApi(){
    return (
      window.MHUR_S18_V14 ||
      window.MHUR_S18_V13 ||
      window.MHUR_S18_V10 ||
      null
    );
  }

  function modal(){
    return document.getElementById('s18NotesDevModalV10');
  }

  function setHeaderButtonText(button){
    if(!(button instanceof HTMLElement))return;

    let label=button.querySelector(
      '.mhurPatchDevLabelV587,'+
      '.mhurPatchDevLabelV592,'+
      'span:last-child'
    );

    if(!label){
      label=document.createElement('span');
      label.className='mhurPatchDevLabelV592';
      button.appendChild(label);
    }

    label.textContent=HEADER_LABEL;
    button.setAttribute('aria-label','Open Patch Notes / Dev Notes');
    button.setAttribute('title',HEADER_LABEL);
  }

  function openNotes(){
    const api=notesApi();

    if(typeof api?.openNotes==='function'){
      api.openNotes();
    }else{
      window.__s18OpenNotesRequested=true;
    }

    requestAnimationFrame(refreshNotes);
    setTimeout(refreshNotes,40);
    setTimeout(refreshNotes,160);
  }

  function ensureHeaderButton(){
    const account=document.getElementById('mhurAccountButton');
    const parent=(
      account?.parentElement ||
      document.querySelector('.mhurTopActionsV31') ||
      document.querySelector('.nexusHeaderInner')
    );

    if(!parent)return null;

    const candidates=[
      ...document.querySelectorAll(
        '#mhurPatchDevButtonV14,'+
        '.mhurPatchDevButtonV14,'+
        '[data-s18-notes-button]'
      )
    ];

    let button=candidates.shift()||null;
    candidates.forEach(extra=>extra.remove());

    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.id='mhurPatchDevButtonV14';
      button.className=
        'nexusHeaderBtn mhurPatchDevButtonV10 mhurPatchDevButtonV14';

      button.innerHTML=
        '<span class="mhurPatchDevIconV20" aria-hidden="true">'+
        '<svg viewBox="0 0 24 24" width="22" height="22">'+
        '<path fill="#f7fbff" d="M6 2h9l4 4v16H6z"/>'+
        '<path fill="#17365d" d="M14 2v5h5M8 10h8v2H8zm0 4h8v2H8zm0 4h6v2H8z"/>'+
        '</svg></span>'+
        '<span class="mhurPatchDevLabelV592"></span>';
    }

    button.id='mhurPatchDevButtonV14';
    button.dataset.s18NotesButton='1';
    button.type='button';
    button.hidden=false;
    button.removeAttribute('aria-hidden');
    button.tabIndex=0;

    setHeaderButtonText(button);

    button.onclick=function(event){
      event.preventDefault();
      event.stopPropagation();
      openNotes();
    };

    if(account&&account.parentElement===parent){
      if(button.parentElement!==parent||button.nextSibling!==account){
        parent.insertBefore(button,account);
      }
    }else if(button.parentElement!==parent){
      parent.appendChild(button);
    }

    return button;
  }

  function ensureTabs(){
    const root=modal();
    const panel=root?.querySelector('.s18NotesPanelV10');

    if(!panel)return null;

    let nav=panel.querySelector(':scope > nav');

    if(!nav){
      nav=document.createElement('nav');
      nav.className='mhurNotesTabsV592';

      const header=panel.querySelector(':scope > header');

      if(header?.nextSibling){
        panel.insertBefore(nav,header.nextSibling);
      }else if(header){
        panel.appendChild(nav);
      }else{
        panel.prepend(nav);
      }
    }

    nav.classList.add('mhurNotesTabsV592');
    nav.hidden=false;
    nav.removeAttribute('aria-hidden');

    let patch=nav.querySelector('[data-tab="patch"]');
    let dev=nav.querySelector('[data-tab="dev"]');

    if(!patch){
      patch=document.createElement('button');
      patch.type='button';
      patch.dataset.tab='patch';
      nav.appendChild(patch);
    }

    if(!dev){
      dev=document.createElement('button');
      dev.type='button';
      dev.dataset.tab='dev';
      nav.appendChild(dev);
    }

    patch.textContent='Patch Notes';
    dev.textContent='Dev Notes';

    patch.hidden=false;
    dev.hidden=false;
    patch.removeAttribute('aria-hidden');
    dev.removeAttribute('aria-hidden');

    /*
      Le moteur principal a déjà son onclick pour les onglets.
      V592 ajoute seulement un repli lorsqu'un ancien correctif l'a perdu.
    */
    if(typeof patch.onclick!=='function'){
      patch.onclick=function(event){
        event.preventDefault();
        const api=notesApi();
        api?.showPatch?.(0);
        patch.classList.add('active');
        dev.classList.remove('active');
        setTimeout(refreshNotes,0);
      };
    }

    if(!dev.dataset.v592Fallback){
      dev.dataset.v592Fallback='1';

      dev.addEventListener('click',function(){
        patch.classList.remove('active');
        dev.classList.add('active');
        setTimeout(refreshNotes,0);
      });
    }

    return nav;
  }

  function showPatch(index){
    const api=notesApi();
    const numeric=Number(index);

    if(!Number.isFinite(numeric))return;

    if(typeof api?.showPatch==='function'){
      api.showPatch(numeric);
    }

    requestAnimationFrame(refreshNotes);
    setTimeout(refreshNotes,30);
  }

  function bindPatchButtons(){
    const root=modal();
    if(!root)return;

    root.querySelectorAll('[data-patch-index]').forEach(button=>{
      const index=Number(button.dataset.patchIndex);

      button.hidden=false;
      button.removeAttribute('aria-hidden');
      button.style.pointerEvents='auto';

      /*
        Remplace les anciens onclick cassés.
        Le bouton appelle directement l'API officielle showPatch(index).
      */
      button.onclick=function(event){
        event.preventDefault();
        event.stopPropagation();
        showPatch(index);
      };
    });
  }

  function forceEnglishLabels(){
    document.querySelectorAll(
      '#mhurPatchDevButtonV14,'+
      '.mhurPatchDevButtonV14,'+
      '[data-s18-notes-button]'
    ).forEach(setHeaderButtonText);

    const root=modal();

    if(root){
      const patch=root.querySelector('[data-tab="patch"]');
      const dev=root.querySelector('[data-tab="dev"]');

      if(patch)patch.textContent='Patch Notes';
      if(dev)dev.textContent='Dev Notes';
    }
  }

  const OLD_ARROW_TEXT=/^(?:v|⌄|⌃|▼|▲|▾|▴|▽|△|↓|↑)$/i;

  function removeOldModsArrows(){
    document.querySelectorAll('.modsTutorial').forEach(tutorial=>{
      const summary=tutorial.querySelector(':scope > summary');

      tutorial.querySelectorAll('*').forEach(element=>{
        if(!(element instanceof HTMLElement)||element===summary)return;

        const className=String(element.className||'');
        const arrowClass=/arrow|chevron/i.test(className);
        const arrowData=(
          element.hasAttribute('data-mods-arrow') ||
          element.hasAttribute('data-mhur-extra-mod-arrow') ||
          element.hasAttribute('data-v549-old-arrow')
        );

        const text=String(element.textContent||'')
          .replace(/\s+/g,'')
          .trim();

        const arrowOnly=Boolean(
          text &&
          OLD_ARROW_TEXT.test(text) &&
          !element.querySelector(
            'img,input,select,textarea,video,code,a,button'
          )
        );

        if(arrowClass||arrowData||arrowOnly){
          element.dataset.v592OldArrow='1';
          element.remove();
        }
      });
    });
  }

  function refreshNotes(){
    ensureHeaderButton();
    ensureTabs();
    bindPatchButtons();
    forceEnglishLabels();
    removeOldModsArrows();

    window.MHUR_S18_V18?.refreshNotesLayout?.();
    window.MHUR_S18_V17?.refreshNotesLayout?.();
  }

  /*
    L'ancien V587 ajoutait un listener document en capture et stoppait les clics.
    Il est retiré de index.html par le workflow V592. Les boutons peuvent donc
    atteindre leur onclick officiel ou celui installé ci-dessus.
  */

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      refreshNotes();
    });
  }

  document.addEventListener('click',event=>{
    const headerButton=event.target?.closest?.(
      '#mhurPatchDevButtonV14,'+
      '.mhurPatchDevButtonV14,'+
      '[data-s18-notes-button]'
    );

    if(headerButton){
      event.preventDefault();
      event.stopPropagation();
      openNotes();
    }
  },true);

  new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length ||
        mutation.removedNodes?.length ||
        mutation.type==='attributes'
      )
    ){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','hidden','aria-hidden']
  });

  window.addEventListener('mhur:languagechange',()=>{
    /*
      Le bouton reste anglais même lorsque le reste du site revient en français.
    */
    setTimeout(refreshNotes,0);
    setTimeout(refreshNotes,80);
  });

  window.addEventListener('mhur-auth-change',schedule);
  window.addEventListener('mhur-role-change',schedule);
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',refreshNotes,{once:true});

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      refreshNotes,
      {once:true}
    );
  }else{
    refreshNotes();
  }

  window.MHUR_V592={
    version:VERSION,
    refresh:refreshNotes,
    openNotes,
    showPatch,
    ensureTabs,
    removeOldModsArrows
  };
})();
