(function(){
'use strict';
const CURRENT_VERSION='346';
const CHECK_INTERVAL=60*1000;
let checking=false;
let reloading=false;

function versionUrl(){
  return new URL('version.json?check='+Date.now(),document.baseURI).href;
}

async function activateNewestWorker(){
  if(!('serviceWorker' in navigator))return;
  try{
    const reg=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
    await reg.update();
    if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
  }catch(_){ }
}

async function reloadToVersion(version){
  if(reloading)return;
  reloading=true;
  try{sessionStorage.setItem('mhur-last-auto-version',String(version||''));}catch(_){ }
  await activateNewestWorker();
  const url=new URL(location.href);
  url.searchParams.set('_mhurv',String(version||Date.now()));
  setTimeout(()=>location.replace(url.toString()),350);
}

async function checkForUpdate(){
  if(checking||reloading||!navigator.onLine)return;
  checking=true;
  try{
    const response=await fetch(versionUrl(),{
      cache:'no-store',
      credentials:'same-origin',
      headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}
    });
    if(!response.ok)return;
    const info=await response.json();
    const remote=String(info&&info.version||'').trim();
    if(remote&&remote!==CURRENT_VERSION)await reloadToVersion(remote);
    else await activateNewestWorker();
  }catch(_){
    // Pas de réseau : le site continue normalement et réessaiera plus tard.
  }finally{
    checking=false;
  }
}

if('serviceWorker' in navigator){
  let controllerChanging=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(controllerChanging||reloading)return;
    controllerChanging=true;
    location.reload();
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  checkForUpdate();
  setInterval(checkForUpdate,CHECK_INTERVAL);
});
window.addEventListener('focus',checkForUpdate);
window.addEventListener('online',checkForUpdate);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkForUpdate();});
window.MHUR_CHECK_UPDATE_NOW=checkForUpdate;
})();
