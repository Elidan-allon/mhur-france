(function(){
'use strict';
const CURRENT_VERSION='v352';
const CHECK_INTERVAL=5*60*1000;
const HANDLED_KEY='mhur-auto-update-handled-version';
let checking=false;
let reloading=false;

function versionUrl(){
  return new URL('version.json?check='+Date.now(),document.baseURI).href;
}

async function prepareNewestWorker(){
  if(!('serviceWorker' in navigator))return;
  try{
    const reg=await navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'});
    await reg.update();
    if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
  }catch(_){ }
}

function alreadyHandled(version){
  try{return localStorage.getItem(HANDLED_KEY)===version;}catch(_){return false;}
}
function markHandled(version){
  try{localStorage.setItem(HANDLED_KEY,version);}catch(_){ }
}

async function reloadOnce(version){
  if(reloading||alreadyHandled(version))return;
  reloading=true;
  markHandled(version);
  await prepareNewestWorker();
  const url=new URL(location.href);
  url.searchParams.set('_mhurv',version);
  setTimeout(()=>location.replace(url.toString()),500);
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
    if(remote&&remote!==CURRENT_VERSION&&!alreadyHandled(remote)){
      await reloadOnce(remote);
    }
  }catch(_){
    // Hors ligne ou vérification impossible : aucune action.
  }finally{
    checking=false;
  }
}

// Une vérification au chargement, puis toutes les cinq minutes.
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(checkForUpdate,1500);
  setInterval(checkForUpdate,CHECK_INTERVAL);
});
window.addEventListener('online',checkForUpdate);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')checkForUpdate();
});
window.MHUR_CHECK_UPDATE_NOW=checkForUpdate;
})();
