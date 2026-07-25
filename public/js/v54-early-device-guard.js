(()=>{
  'use strict';
  const KEY='mhur_active_ban_v52';
  const COOKIE='mhur_active_ban_device';
  const cookie=()=>{try{const hit=document.cookie.split('; ').find(x=>x.startsWith(COOKIE+'='));return hit?decodeURIComponent(hit.slice(COOKIE.length+1)):''}catch(_){return ''}};
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||cookie()||'null')}catch(_){return null}};
  const valid=lock=>Boolean(lock&&(lock.kind==='permanent'||(lock.kind==='temporary'&&Date.parse(lock.banned_until||'')>Date.now())));
  function show(){
    const lock=read();
    if(!valid(lock))return false;
    document.documentElement.classList.add('mhurSanctionLockedV52');
    if(!document.body)return true;
    if(document.getElementById('mhurEarlyBanGuard'))return true;
    const node=document.createElement('div');
    node.id='mhurEarlyBanGuard';
    node.setAttribute('role','alert');
    node.innerHTML=`<div><strong>${lock.kind==='permanent'?'🚫 Vous avez été banni définitivement':'⏳ Vous avez été banni temporairement'}</strong><span>Chargement de votre sanction…</span></div>`;
    document.body.appendChild(node);
    return true;
  }
  const boot=()=>{show();setTimeout(show,0);setTimeout(show,150)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  addEventListener('pageshow',boot);
  addEventListener('popstate',()=>{if(show()){try{history.pushState({mhurBanGuard:true},'',location.href)}catch(_){}}});
  addEventListener('hashchange',show);
})();
