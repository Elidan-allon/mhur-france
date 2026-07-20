(function(){
'use strict';
const openSelectors='.modalV296.open,.modsModal:not([hidden]),.cbModal.open,.mhurHubOverlay.open,.mhurPublicProfileModal.open,.mhurModerationOverlay.open,.mhurAuthOverlay.open';
function cleanupBody(){
  if(!document.querySelector(openSelectors)){
    document.body.classList.remove('cbModalOpen','homeModalOpenV296');
  }
}
function closeOverlay(el){
  if(!el)return;
  if(el.id==='cbBuilderModal'&&typeof window.closeCommunityBuildCreator==='function')return window.closeCommunityBuildCreator();
  if(el.id==='cbDetailModal'&&typeof window.closeCommunityBuildDetail==='function')return window.closeCommunityBuildDetail();
  if(el.id==='mhurAuthOverlay'&&window.MHUR_AUTH?.close)return window.MHUR_AUTH.close();
  if(el.id==='mhurPublicProfileModal'&&window.MHUR_PROFILES?.close)return window.MHUR_PROFILES.close();
  if(el.classList.contains('modalV296')&&typeof window.closeHomeModalV296==='function')return window.closeHomeModalV296(el.id);
  if(el.classList.contains('modsModal'))el.hidden=true;
  el.classList.remove('open');
  cleanupBody();
}
function closeAll(){
  document.querySelectorAll(openSelectors).forEach(closeOverlay);
  cleanupBody();
}
window.MHUR_CLOSE_OPEN_WINDOWS=closeAll;

document.addEventListener('click',event=>{
  if(event.target.closest('.menuBtn')){
    closeAll();
    return;
  }
  const overlay=event.target.closest('.modalV296,.modsModal,.cbModal,.mhurHubOverlay,.mhurPublicProfileModal,.mhurModerationOverlay,.mhurAuthOverlay');
  if(overlay&&event.target===overlay)closeOverlay(overlay);
},true);

document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAll()});
window.addEventListener('hashchange',closeAll);
})();
