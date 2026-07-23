(function(){
'use strict';
const isEn=()=>((typeof lang!=='undefined'?lang:window.lang)==='en');
function update(){
  const record=window.MHUR_USER_MODERATION?.state?.record;
  const modal=document.getElementById('mhurBanOverlayV29');
  if(!modal||!record)return;
  const title=modal.querySelector('h2');
  const status=modal.querySelector('#mhurBanStatusV29');
  if(record.banned_permanent){
    if(title)title.textContent=isEn()?'YOU HAVE BEEN PERMANENTLY BANNED':'VOUS AVEZ ÉTÉ BANNI DÉFINITIVEMENT';
    if(status)status.textContent=isEn()?'Permanent ban':'Bannissement définitif';
  }else{
    if(title)title.textContent=isEn()?'YOU HAVE BEEN TEMPORARILY BANNED':'VOUS AVEZ ÉTÉ BANNI TEMPORAIREMENT';
  }
}
window.addEventListener('mhur-moderation-live-update',()=>requestAnimationFrame(update));
window.addEventListener('mhur-community-live-change',e=>{if(e.detail?.table==='user_moderation')setTimeout(update,80)});
new MutationObserver(update).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
