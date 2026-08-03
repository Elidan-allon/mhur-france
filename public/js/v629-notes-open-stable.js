/* MHUR Nexus — V629
   Répare uniquement l'ouverture de Patch Notes / Dev Notes.

   - intercepte le bouton avant les anciennes couches ;
   - utilise uniquement le vrai header fixe pour le décalage ;
   - recrée la fenêtre si une ancienne structure incompatible existe ;
   - ne change pas le contenu des Patch Notes ou des Dev Notes.
*/
(function(){
  'use strict';

  if(window.MHUR_V629_NOTES_OPEN_LOADED)return;
  window.MHUR_V629_NOTES_OPEN_LOADED=true;

  const BUTTON_SELECTOR=[
    '#mhurPatchDevButtonV14',
    '.mhurPatchDevButtonV14',
    '[data-s18-notes-button]'
  ].join(',');

  let opening=false;

  function visible(element){
    if(!element||!element.isConnected)return false;

    const style=getComputedStyle(element);
    const rect=element.getBoundingClientRect();

    return (
      style.display!=='none'&&
      style.visibility!=='hidden'&&
      rect.width>0&&
      rect.height>0
    );
  }

  function headerBottom(){
    const candidates=[
      document.querySelector('header.top'),
      document.querySelector('#siteHeader'),
      document.querySelector('.nexusHeader'),
      document.querySelector('#topbar'),
      document.querySelector('.topbar')
    ].filter(Boolean);

    let bottom=0;

    candidates.forEach(element=>{
      if(!visible(element))return;

      const style=getComputedStyle(element);
      const rect=element.getBoundingClientRect();

      if(
        (
          style.position==='fixed'||
          style.position==='sticky'
        )&&
        rect.top<=2&&
        rect.bottom>0&&
        rect.bottom<window.innerHeight
      ){
        bottom=Math.max(bottom,rect.bottom);
      }
    });

    return Math.max(0,Math.ceil(bottom));
  }

  function updateOffset(){
    const value=`${headerBottom()}px`;

    document.documentElement.style.setProperty(
      '--mhur-v629-notes-top',
      value
    );

    /*
      V627 utilise encore cette variable. On la synchronise avec
      la valeur saine afin qu'aucune ancienne règle ne puisse
      replacer la fenêtre sous un header de contenu.
    */
    document.documentElement.style.setProperty(
      '--mhur-v627-notes-top',
      value
    );
  }

  function modalIsCompatible(modal){
    if(!modal)return false;

    return Boolean(
      modal.querySelector('.s18NotesPanelV10')&&
      modal.querySelector('[data-notes-title]')&&
      modal.querySelector('[data-tab="patch"]')&&
      modal.querySelector('[data-tab="dev"]')&&
      modal.querySelector('.s18NotesBodyV10 > aside')&&
      modal.querySelector('.s18NotesBodyV10 > main')
    );
  }

  function apiOpenFunction(){
    const candidates=[
      window.MHUR_V608?.openNotes,
      window.MHUR_S18_V14?.openNotes,
      window.MHUR_S18_V13?.openNotes,
      window.MHUR_S18_V10?.openNotes
    ];

    return candidates.find(
      candidate=>typeof candidate==='function'
    )||null;
  }

  function finishOpen(){
    updateOffset();

    const modal=document.getElementById(
      's18NotesDevModalV10'
    );

    if(!modal)return false;

    modal.classList.add('open');
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden','false');

    document.body.classList.add(
      's18NotesOpenV11'
    );

    requestAnimationFrame(()=>{
      updateOffset();

      modal.querySelector(
        '.s18NotesPanelV10'
      )?.focus?.({
        preventScroll:true
      });
    });

    return true;
  }

  function callOpenApi(){
    const open=apiOpenFunction();

    if(!open)return false;

    try{
      open.call(window);
      return true;
    }catch(error){
      console.warn(
        '[V629] Première ouverture impossible, reconstruction.',
        error
      );

      const modal=document.getElementById(
        's18NotesDevModalV10'
      );

      if(modal&&!modalIsCompatible(modal)){
        modal.remove();
      }

      try{
        open.call(window);
        return true;
      }catch(secondError){
        console.error(
          '[V629] Ouverture Patch/Dev Notes impossible.',
          secondError
        );
        return false;
      }
    }
  }

  function openNotesStable(){
    if(opening)return;

    opening=true;
    updateOffset();

    const existing=document.getElementById(
      's18NotesDevModalV10'
    );

    if(existing&&!modalIsCompatible(existing)){
      existing.remove();
    }

    const called=callOpenApi();

    if(!called){
      /*
        Le moteur V608 est chargé en bas de page. Sur un appareil très
        lent, on lui laisse un court instant pour finir son installation.
      */
      setTimeout(()=>{
        callOpenApi();
        finishOpen();
        opening=false;
      },80);

      return;
    }

    finishOpen();

    requestAnimationFrame(()=>{
      finishOpen();
      opening=false;
    });
  }

  function installButton(){
    document.querySelectorAll(
      BUTTON_SELECTOR
    ).forEach(button=>{
      button.onclick=event=>{
        event?.preventDefault?.();
        openNotesStable();
        return false;
      };

      button.dataset.v629NotesButton='1';
    });
  }

  /*
    La capture sur window passe avant les listeners document des
    anciennes versions, indépendamment de leur ordre de chargement.
  */
  window.addEventListener(
    'click',
    event=>{
      const target=event.target;

      if(!(target instanceof Element))return;

      const button=target.closest(
        BUTTON_SELECTOR
      );

      if(!button)return;

      event.preventDefault();
      event.stopImmediatePropagation();

      openNotesStable();
    },
    true
  );

  window.addEventListener(
    'resize',
    updateOffset
  );

  window.addEventListener(
    'orientationchange',
    updateOffset
  );

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      ()=>{
        updateOffset();
        installButton();
      },
      {once:true}
    );
  }else{
    updateOffset();
    installButton();
  }

  window.addEventListener(
    'load',
    ()=>{
      updateOffset();
      installButton();
    },
    {once:true}
  );

  new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        Array.from(mutation.addedNodes||[])
          .some(node=>
            node.nodeType===Node.ELEMENT_NODE&&
            (
              node.matches?.(BUTTON_SELECTOR)||
              node.querySelector?.(BUTTON_SELECTOR)
            )
          )
      )
    ){
      installButton();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  window.MHUR_V629_NOTES_OPEN={
    open:openNotesStable,
    refresh(){
      updateOffset();
      installButton();
    }
  };
})();
