/* MHUR Nexus — V612 : corrections mobiles ciblées
   - bouton Retour fixe sous le header ;
   - panneaux Réseaux sociaux / Créateurs sous le header réel ;
   - Patch Notes / Dev Notes sous le header et bouton d'ouverture en mode bascule ;
   - photos et icônes T.U.N.I.N.G des cartes costumes légèrement remontées ;
   - icônes de rôles alignées avec leurs libellés.
*/
(function(){
  'use strict';

  if(window.MHUR_V612_MOBILE_LOADED)return;
  window.MHUR_V612_MOBILE_LOADED=true;

  const MOBILE=window.matchMedia('(max-width:760px)');
  const ROOT=document.documentElement;
  const NOTES_TRIGGER=
    '#mhurPatchDevButtonV14,'+
    '.mhurPatchDevButtonV14,'+
    '[data-s18-notes-button]';

  let frame=0;
  let headerResizeObserver=null;
  let headerMutationObserver=null;
  let bodyMutationObserver=null;

  function visibleRect(node){
    if(!(node instanceof Element))return null;

    const style=getComputedStyle(node);

    if(
      style.display==='none'||
      style.visibility==='hidden'||
      Number(style.opacity||1)===0
    ){
      return null;
    }

    const rect=node.getBoundingClientRect();

    return rect.width>0&&rect.height>0?rect:null;
  }

  function cssLength(name){
    const value=parseFloat(
      getComputedStyle(ROOT).getPropertyValue(name)
    );

    return Number.isFinite(value)?value:0;
  }

  function measuredHeaderBottom(){
    const header=document.querySelector('header.top');

    if(!header)return 0;

    const own=visibleRect(header);
    let bottom=own?.bottom||0;

    const candidates=[
      header.querySelector('.mhurMobileBrandRowV57'),
      header.querySelector('.mhurMobileToolbarV57'),
      ...header.querySelectorAll(
        '.menuBtn,'+
        '.nexusHeaderBtn,'+
        '#mhurAdminButton,'+
        '#mhurAccountButton,'+
        '.lang'
      )
    ];

    candidates.forEach(node=>{
      const rect=visibleRect(node);

      if(rect)bottom=Math.max(bottom,rect.bottom);
    });

    const fallback=Math.max(
      cssLength('--mhur-mobile-header-height'),
      cssLength('--mhur-header-visual-bottom'),
      cssLength('--mhur-header-bottom'),
      innerWidth<=390?107:115
    );

    return Math.ceil(Math.max(bottom,fallback)+2);
  }

  function setImportant(node,property,value){
    if(node instanceof HTMLElement){
      node.style.setProperty(property,value,'important');
    }
  }

  function applyOverlayGeometry(){
    if(!MOBILE.matches){
      ROOT.style.removeProperty('--mhur-v612-header-bottom');
      return;
    }

    const top=measuredHeaderBottom();

    if(!top)return;

    ROOT.style.setProperty(
      '--mhur-v612-header-bottom',
      `${top}px`
    );

    /*
      V517 utilise cette variable. La mettre à jour empêche une ancienne
      mesure plus petite de faire remonter les panneaux.
    */
    ROOT.style.setProperty(
      '--mhur-v517-measured-header-bottom',
      `${top}px`
    );

    const links=document.querySelector('.nexusLinksOverlay');

    if(links){
      setImportant(links,'top',`${top}px`);
      setImportant(links,'inset-block-start',`${top}px`);
      setImportant(links,'right','0');
      setImportant(links,'bottom','0');
      setImportant(links,'left','0');
      setImportant(links,'height','auto');

      const panel=links.querySelector('.nexusLinksPanel');

      if(panel){
        setImportant(panel,'top','auto');
        setImportant(panel,'inset','auto');
        setImportant(
          panel,
          'max-height',
          `calc(100dvh - ${top}px - 16px)`
        );
      }
    }

    const notes=document.getElementById(
      's18NotesDevModalV10'
    );

    if(notes){
      setImportant(notes,'top',`${top}px`);
      setImportant(notes,'inset-block-start',`${top}px`);
      setImportant(notes,'right','0');
      setImportant(notes,'bottom','0');
      setImportant(notes,'left','0');
      setImportant(notes,'height','auto');
      setImportant(
        notes,
        'max-height',
        `calc(100dvh - ${top}px)`
      );
    }
  }

  function scheduleGeometry(){
    cancelAnimationFrame(frame);

    frame=requestAnimationFrame(()=>{
      frame=0;
      applyOverlayGeometry();
    });
  }

  function settleGeometry(){
    scheduleGeometry();

    requestAnimationFrame(scheduleGeometry);

    [30,90,180,360,700].forEach(delay=>
      setTimeout(scheduleGeometry,delay)
    );
  }

  function linksOverlay(){
    return document.querySelector('.nexusLinksOverlay');
  }

  function closeLinks(){
    const overlay=linksOverlay();

    overlay?.classList.remove('is-open');

    document.querySelectorAll(
      '[data-nexus-menu]'
    ).forEach(button=>
      button.setAttribute('aria-expanded','false')
    );
  }

  function notesModal(){
    return document.getElementById(
      's18NotesDevModalV10'
    );
  }

  function notesAreOpen(){
    return notesModal()?.classList.contains('open')===true;
  }

  function closeNotes(){
    const modal=notesModal();

    modal?.classList.remove('open');

    document.body.classList.remove(
      's18NotesOpenV11'
    );
  }

  function openNotes(){
    closeLinks();

    const open=
      window.MHUR_V608?.openNotes||
      window.MHUR_S18_V14?.openNotes||
      window.MHUR_S18_V13?.openNotes||
      window.MHUR_S18_V10?.openNotes;

    if(typeof open==='function'){
      open();
    }else{
      /*
        Filet de sécurité : les anciens moteurs peuvent créer la fenêtre
        légèrement plus tard.
      */
      setTimeout(()=>{
        const retry=
          window.MHUR_V608?.openNotes||
          window.MHUR_S18_V14?.openNotes||
          window.MHUR_S18_V13?.openNotes||
          window.MHUR_S18_V10?.openNotes;

        retry?.();
        settleGeometry();
      },0);
    }

    settleGeometry();
  }

  function toggleNotes(event){
    if(!MOBILE.matches)return false;

    const trigger=event.target?.closest?.(
      NOTES_TRIGGER
    );

    if(!trigger)return false;

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    if(notesAreOpen()){
      closeNotes();
    }else{
      openNotes();
    }

    return true;
  }

  /*
    Le listener est placé sur window en capture : il passe avant l'ancien
    listener document de V608, qui ouvrait toujours la fenêtre sans pouvoir
    la refermer avec le même bouton.
  */
  window.addEventListener(
    'click',
    event=>{
      if(toggleNotes(event))return;
      if(!MOBILE.matches)return;

      const linksButton=event.target?.closest?.(
        '[data-nexus-menu]'
      );

      if(linksButton){
        closeNotes();
        settleGeometry();
        return;
      }

      if(
        event.target?.closest?.(
          '.nexusLinksClose,'+
          '.nexusLinksBackdrop,'+
          '.nexusBackBtn'
        )
      ){
        setTimeout(scheduleGeometry,0);
      }
    },
    true
  );

  function observe(){
    const header=document.querySelector('header.top');

    if(header){
      headerMutationObserver?.disconnect();

      headerMutationObserver=new MutationObserver(
        settleGeometry
      );

      headerMutationObserver.observe(header,{
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:[
          'class',
          'style',
          'hidden',
          'aria-hidden'
        ]
      });

      if('ResizeObserver' in window){
        headerResizeObserver?.disconnect();

        headerResizeObserver=new ResizeObserver(
          settleGeometry
        );

        headerResizeObserver.observe(header);

        header.querySelectorAll(
          '.mhurMobileBrandRowV57,'+
          '.mhurMobileToolbarV57'
        ).forEach(node=>
          headerResizeObserver.observe(node)
        );
      }
    }

    bodyMutationObserver?.disconnect();

    bodyMutationObserver=new MutationObserver(
      mutations=>{
        if(
          mutations.some(mutation=>
            mutation.addedNodes.length>0||
            mutation.removedNodes.length>0
          )
        ){
          scheduleGeometry();
        }
      }
    );

    bodyMutationObserver.observe(document.body,{
      childList:true,
      subtree:true
    });
  }

  function start(){
    observe();
    settleGeometry();
  }

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
    start,
    {once:true}
  );

  window.addEventListener(
    'pageshow',
    settleGeometry,
    {passive:true}
  );

  window.addEventListener(
    'resize',
    settleGeometry,
    {passive:true}
  );

  window.addEventListener(
    'orientationchange',
    ()=>setTimeout(settleGeometry,80),
    {passive:true}
  );

  window.visualViewport?.addEventListener(
    'resize',
    settleGeometry,
    {passive:true}
  );

  MOBILE.addEventListener?.(
    'change',
    settleGeometry
  );

  window.MHUR_V612_MOBILE={
    version:'612',
    refresh:settleGeometry,
    closeLinks,
    closeNotes
  };
})();
