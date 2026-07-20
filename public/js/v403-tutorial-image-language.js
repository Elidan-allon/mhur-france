(function(){
'use strict';

function currentLanguage(){
  try{
    if(typeof lang!=='undefined') return lang==='en'?'en':'fr';
  }catch(_){ }
  return document.documentElement.lang?.toLowerCase().startsWith('en')?'en':'fr';
}

function syncTutorialImages(){
  const language=currentLanguage();
  document.querySelectorAll('.modsTutorialStepImage[data-fr-src][data-en-src]').forEach(img=>{
    const next=language==='en'?img.dataset.enSrc:img.dataset.frSrc;
    if(!next)return;
    if(img.getAttribute('src')!==next){
      img.setAttribute('src',next);
      img.removeAttribute('srcset');
    }
  });
}

function scheduleSync(){
  syncTutorialImages();
  requestAnimationFrame(syncTutorialImages);
  setTimeout(syncTutorialImages,50);
  setTimeout(syncTutorialImages,250);
}

/* Le bouton FR / EN reconstruit la page Mods : on resynchronise après le rendu. */
document.addEventListener('click',event=>{
  if(event.target.closest('.lang')) scheduleSync();
},true);

/* Le tutoriel est injecté dynamiquement lors de l'ouverture de la page Mods. */
new MutationObserver(mutations=>{
  if(mutations.some(m=>m.addedNodes.length)) scheduleSync();
}).observe(document.body,{childList:true,subtree:true});

document.addEventListener('toggle',event=>{
  if(event.target?.classList?.contains('modsTutorial')) scheduleSync();
},true);

window.addEventListener('hashchange',scheduleSync);
document.addEventListener('DOMContentLoaded',scheduleSync,{once:true});
window.addEventListener('load',scheduleSync,{once:true});
window.MHUR_SYNC_TUTORIAL_IMAGES=scheduleSync;
})();
