
(function(){
'use strict';
function closeDrawer(){document.getElementById('drawer')?.classList.remove('open')}
function decorate(){
  const drawer=document.getElementById('drawer');
  if(drawer){
    [...drawer.querySelectorAll('.navItem')].forEach(btn=>{
      if(/Statistiques|Statistics/i.test(btn.textContent||''))btn.remove();
    });
  }
  // Repère et stylise le bouton de création sans dépendre d'une classe de version.
  [...document.querySelectorAll('button')].forEach(btn=>{
    if(/Créer un build complet|Create a full build/i.test(btn.textContent||'')){
      btn.classList.add('cbCreateBuildButton');
      btn.setAttribute('data-cb-create','1');
    }
  });
}
// Ferme toujours le catalogue lorsqu'une recherche globale ou une page hub s'ouvre.
document.addEventListener('click',e=>{
  const b=e.target.closest('button,a'); if(!b)return;
  if(/Recherche globale|Global search|Tier List/i.test(b.textContent||''))closeDrawer();
});
// Empêche le navigateur d'afficher le curseur interdit entre deux zones de tier list.
document.addEventListener('dragover',e=>{if(e.target.closest('.mhurTierPage')){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='move'}},true);
// La mise à jour est gérée uniquement par js/auto-update.js afin d'éviter les rechargements en boucle.
new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',decorate);setTimeout(decorate,0);
})();
