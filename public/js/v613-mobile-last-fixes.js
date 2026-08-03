/* MHUR Nexus — V613 : derniers correctifs mobiles
   - le bouton Patch Notes / Dev Notes ferme réellement Réseaux sociaux
     et Créateurs de contenu avant d'ouvrir les notes ;
   - le bouton Retour reste fixé juste sous le bas réel du header ;
   - les icônes T.U.N.I.N.G des cartes costumes remontent dans la zone photo ;
   - les icônes de rôle des cartes de styles sont centrées avec leur nom.
*/
(function(){
  'use strict';

  if(window.MHUR_V613_MOBILE_LOADED)return;
  window.MHUR_V613_MOBILE_LOADED=true;

  const MOBILE=window.matchMedia('(max-width:760px)');
  const ROOT=document.documentElement;
  const NOTES_TRIGGER=
    '#mhurPatchDevButtonV14,'+
    '.mhurPatchDevButtonV14,'+
    '[data-s18-notes-button]';

  let frame=0;
  let observer=null;
  let closingLinks=false;

  function visibleBottom(node){
    if(!(node instanceof Element))return 0;

    const style=getComputedStyle(node);

    if(
      style.display==='none'||
      style.visibility==='hidden'||
      Number(style.opacity||1)===0
    ){
      return 0;
    }

    const rect=node.getBoundingClientRect();

    return rect.width>0&&rect.height>0?rect.bottom:0;
  }

  function cssLength(name){
    const value=parseFloat(
      getComputedStyle(ROOT).getPropertyValue(name)
    );

    return Number.isFinite(value)?value:0;
  }

  function headerBottom(){
    const header=document.querySelector('header.top');

    if(!header)return 0;

    const values=[
      visibleBottom(header),
      visibleBottom(header.querySelector('.mhurMobileBrandRowV57')),
      visibleBottom(header.querySelector('.mhurMobileToolbarV57')),
      ...Array.from(header.querySelectorAll(
        '.menuBtn,'+
        '.nexusHeaderBtn,'+
        '#mhurAdminButton,'+
        '#mhurAccountButton,'+
        '.lang'
      )).map(visibleBottom),
      cssLength('--mhur-v612-header-bottom'),
      cssLength('--mhur-v517-measured-header-bottom'),
      cssLength('--mhur-header-visual-bottom'),
      cssLength('--mhur-header-bottom'),
      innerWidth<=390?107:115
    ];

    return Math.ceil(Math.max(...values.filter(Number.isFinite))+2);
  }

  function setImportant(node,property,value){
    if(node instanceof HTMLElement){
      node.style.setProperty(property,value,'important');
    }
  }

  function pinBackButton(){
    if(!MOBILE.matches){
      ROOT.style.removeProperty('--mhur-v613-header-bottom');
      return;
    }

    const top=headerBottom();

    if(!top)return;

    ROOT.style.setProperty(
      '--mhur-v613-header-bottom',
      `${top}px`
    );

    document.querySelectorAll(
      '#app > .back,'+
      '#app .back,'+
      '.wrap > .back'
    ).forEach(button=>{
      setImportant(button,'position','fixed');
      setImportant(button,'top',`${top+8}px`);
      setImportant(button,'right','auto');
      setImportant(button,'bottom','auto');
      setImportant(
        button,
        'left','max(10px,env(safe-area-inset-left,0px))'
      );
      setImportant(button,'margin','0');
      setImportant(button,'transform','none');
      setImportant(button,'translate','none');
      setImportant(button,'visibility','visible');
      setImportant(button,'opacity','1');
      setImportant(button,'pointer-events','auto');
      setImportant(button,'z-index','2147482500');
      button.dataset.mhurV613Pinned='1';
    });
  }

  function closeLinksFully(){
    if(closingLinks)return;

    closingLinks=true;

    try{
      document.querySelectorAll(
        '.nexusLinksOverlay'
      ).forEach(overlay=>{
        /*
          Le vrai bouton Fermer appelle la fonction privée du moteur
          nexus-header-links.js et remet aussi son état interne à zéro.
        */
        const closeButton=overlay.querySelector(
          '.nexusLinksClose'
        );

        if(
          overlay.classList.contains('is-open')&&
          closeButton instanceof HTMLElement
        ){
          closeButton.click();
        }

        overlay.classList.remove(
          'is-open',
          'open',
          'active',
          'is-active',
          'show',
          'visible'
        );
      });

      document.querySelectorAll(
        '[data-nexus-menu]'
      ).forEach(button=>
        button.setAttribute('aria-expanded','false')
      );
    }finally{
      queueMicrotask(()=>{
        closingLinks=false;
      });
    }
  }

  function notesAreOpen(){
    return document.getElementById(
      's18NotesDevModalV10'
    )?.classList.contains('open')===true;
  }

  function enforceExclusivePanels(){
    if(notesAreOpen())closeLinksFully();
  }

  function schedule(){
    cancelAnimationFrame(frame);

    frame=requestAnimationFrame(()=>{
      frame=0;
      pinBackButton();
      enforceExclusivePanels();
    });
  }

  function settle(){
    schedule();
    requestAnimationFrame(schedule);

    [0,40,100,220,500].forEach(delay=>
      setTimeout(schedule,delay)
    );
  }

  /*
    V612 intercepte ensuite le click pour ouvrir/fermer les notes.
    La fermeture des panneaux est donc faite dès pointerdown, avant ce click.
  */
  window.addEventListener(
    'pointerdown',
    event=>{
      if(!MOBILE.matches)return;

      if(event.target?.closest?.(NOTES_TRIGGER)){
        closeLinksFully();
        setTimeout(closeLinksFully,0);
        setTimeout(closeLinksFully,80);
      }
    },
    true
  );

  window.addEventListener(
    'keydown',
    event=>{
      if(!MOBILE.matches)return;
      if(event.key!=='Enter'&&event.key!==' ')return;

      if(event.target?.closest?.(NOTES_TRIGGER)){
        closeLinksFully();
      }
    },
    true
  );

  function observe(){
    observer?.disconnect();

    observer=new MutationObserver(mutations=>{
      const relevant=mutations.some(mutation=>
        mutation.type==='childList'||
        (
          mutation.type==='attributes'&&
          (
            mutation.attributeName==='class'||
            mutation.attributeName==='style'
          )
        )
      );

      if(relevant)schedule();
    });

    observer.observe(document.body,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','style']
    });
  }

  function start(){
    observe();
    settle();
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

  window.addEventListener('load',start,{once:true});
  window.addEventListener('pageshow',settle,{passive:true});
  window.addEventListener('resize',settle,{passive:true});
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener(
    'orientationchange',
    ()=>setTimeout(settle,80),
    {passive:true}
  );

  window.visualViewport?.addEventListener(
    'resize',
    settle,
    {passive:true}
  );

  window.visualViewport?.addEventListener(
    'scroll',
    schedule,
    {passive:true}
  );

  MOBILE.addEventListener?.('change',settle);

  window.MHUR_V613_MOBILE={
    version:'613',
    refresh:settle,
    closeLinks:closeLinksFully,
    pinBack:pinBackButton
  };
})();
