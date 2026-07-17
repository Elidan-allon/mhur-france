
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
// Mise à jour automatique douce : vérifie le service worker régulièrement et recharge seulement lorsqu'une nouvelle version prend le contrôle.
if('serviceWorker' in navigator){
  navigator.serviceWorker.ready.then(reg=>{
    setInterval(()=>reg.update().catch(()=>{}),5*60*1000);
  }).catch(()=>{});
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
}
new MutationObserver(decorate).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',decorate);setTimeout(decorate,0);
})();
