
/* MHUR Nexus — V590 : suppression permanente de la deuxième flèche Mods */
(function(){
  'use strict';

  const ARROW_CLASS=/arrow|chevron/i;
  const ARROW_TEXT=/^(?:v|⌄|⌃|▼|▲|▾|▴|▽|△|↓|↑|❯|❮|›|‹)$/i;

  function isExtraArrow(element,summary){
    if(!(element instanceof HTMLElement))return false;
    if(element===summary)return false;

    const className=String(element.className||'');
    const hasArrowClass=ARROW_CLASS.test(className);
    const hasArrowData=Boolean(
      element.hasAttribute('data-mods-arrow')||
      element.hasAttribute('data-mhur-extra-mod-arrow')||
      element.hasAttribute('data-v549-old-arrow')
    );

    const text=String(element.textContent||'')
      .replace(/\s+/g,'')
      .trim();

    /*
      On retire un texte-flèche uniquement lorsque l'élément ne contient
      ni image, ni champ, ni vrai contenu du tutoriel.
    */
    const isArrowOnly=Boolean(
      text&&
      ARROW_TEXT.test(text)&&
      !element.querySelector('img,input,select,textarea,video,code')
    );

    return hasArrowClass||hasArrowData||isArrowOnly;
  }

  function cleanTutorial(tutorial){
    if(!(tutorial instanceof HTMLElement))return;

    const summary=tutorial.querySelector(':scope > summary');
    if(!summary)return;

    summary.style.listStyle='none';

    /*
      La bonne flèche est le ::after CSS du summary.
      Toutes les flèches DOM, même ajoutées après le rendu, sont supprimées.
    */
    tutorial.querySelectorAll('*').forEach(element=>{
      if(!isExtraArrow(element,summary))return;

      element.setAttribute('data-mhur-extra-mod-arrow','1');
      element.hidden=true;
      element.setAttribute('aria-hidden','true');
      element.remove();
    });
  }

  function cleanAll(){
    document.querySelectorAll('.modsTutorial').forEach(cleanTutorial);
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      cleanAll();
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',cleanAll,{once:true});
  }else{
    cleanAll();
  }

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  document.addEventListener('toggle',event=>{
    if(event.target?.classList?.contains('modsTutorial')){
      cleanTutorial(event.target);
    }
  },true);

  window.addEventListener('hashchange',schedule);
  window.addEventListener('load',cleanAll,{once:true});

  window.MHUR_V590={
    refresh:cleanAll
  };
})();
