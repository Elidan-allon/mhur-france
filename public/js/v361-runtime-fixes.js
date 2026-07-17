(function(){
'use strict';
const RELEASE='361';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const isEN=()=>typeof window.lang!=='undefined'&&window.lang==='en';
const tr=(fr,en)=>isEN()?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.MHUR_RELEASE=RELEASE;

// Keep the PWA installable while always requesting fresh files from the network.
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js?v='+RELEASE,{updateViaCache:'none'}).catch(console.warn));
}

// OAuth must always return to the production root. The no-cache headers and network-only worker
// ensure that the callback receives the current release instead of a stale application shell.
function patchAuth(){
  const auth=window.MHUR_AUTH;
  if(!auth||auth.__v361)return;
  auth.__v361=true;
  auth.login=function(provider){
    const base=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
    if(!base||!cfg.supabaseKey){auth.open?.();return;}
    const callback=new URL('/',location.origin);
    callback.searchParams.set('release',RELEASE);
    callback.searchParams.set('oauth','1');
    callback.searchParams.set('t',Date.now().toString());
    location.assign(`${base}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(callback.href)}`);
  };
}
patchAuth();setTimeout(patchAuth,100);setTimeout(patchAuth,500);

// Only catch real rendering errors. Do not observe and rewrite the entire DOM after every mutation:
// that feedback loop was what froze large character pages.
function patchNavigation(){
  if(typeof window.render==='function'&&!window.render.__v361){
    const original=window.render;
    const wrapped=function(){
      try{return original.apply(this,arguments)}
      catch(error){
        console.error('[MHUR V361 render]',error);
        const app=document.getElementById('app');
        if(app)app.innerHTML=`<div class="homeBox mhurSafeError"><h2>${tr('La fiche ne peut pas être affichée','This page could not be displayed')}</h2><p>${esc(error?.message||error)}</p><button class="back" id="mhurSafeBack">← ${tr('Retour aux personnages','Back to characters')}</button></div>`;
        document.getElementById('mhurSafeBack')?.addEventListener('click',()=>{window.selectedChar=null;window.selectedStyle=null;window.page='characters';original()});
      }
    };
    wrapped.__v361=true;
    window.render=wrapped;
  }
}
patchNavigation();

async function api(path){
  if(!cfg.supabaseUrl||!cfg.supabaseKey)throw new Error(tr('Supabase non configuré.','Supabase is not configured.'));
  const token=window.MHUR_AUTH?.getAccessToken?.()||cfg.supabaseKey;
  const response=await fetch(String(cfg.supabaseUrl).replace(/\/$/,'')+path,{cache:'no-store',headers:{apikey:cfg.supabaseKey,Authorization:'Bearer '+token}});
  if(!response.ok)throw new Error(await response.text()||('HTTP '+response.status));
  return response.json();
}
function leaderboardModal(){
  let modal=document.getElementById('mhurLeaderboardModalV355');
  if(!modal){
    modal=document.createElement('div');modal.id='mhurLeaderboardModalV355';modal.className='mhurHubOverlay';
    modal.innerHTML='<section class="mhurHubPanel"><button class="mhurHubClose" type="button">×</button><header class="mhurHubHead"><h2></h2><p></p></header><div class="mhurHubBody"><div class="mhurLeaderboardGrid"></div></div></section>';
    document.body.appendChild(modal);
  }
  modal.querySelector('.mhurHubClose').onclick=closeLeaderboard;
  modal.onclick=e=>{if(e.target===modal)closeLeaderboard()};
  return modal;
}
function closeLeaderboard(){
  document.getElementById('mhurLeaderboardModalV355')?.classList.remove('open');
  if(!document.querySelector('.mhurHubOverlay.open,.cbModal.open,.mhurAuthOverlay.open,.mhurPublicProfileModal.open'))document.body.classList.remove('cbModalOpen');
}
async function openLeaderboard(){
  document.getElementById('drawer')?.classList.remove('open');
  const modal=leaderboardModal();
  modal.querySelector('h2').textContent='🏆 '+tr('Classement des créateurs','Creator leaderboard');
  modal.querySelector('.mhurHubHead p').textContent=tr('Classement calculé avec les builds publics et les likes reçus.','Ranking based on public builds and received likes.');
  const out=modal.querySelector('.mhurLeaderboardGrid');out.textContent=tr('Chargement…','Loading…');
  modal.classList.add('open');document.body.classList.add('cbModalOpen');
  try{
    const builds=await api('/rest/v1/community_builds?is_hidden=eq.false&select=creator_id,likes_count&limit=1000');
    const ids=[...new Set((builds||[]).map(x=>x.creator_id).filter(Boolean))];
    let profiles=[];
    if(ids.length){
      const list=ids.map(id=>'"'+String(id).replace(/"/g,'')+'"').join(',');
      profiles=await api('/rest/v1/profiles?id=in.('+encodeURIComponent(list)+')&select=id,username,avatar_url,provider');
    }
    const profileMap=new Map((profiles||[]).map(x=>[x.id,x]));
    const scores=new Map();
    for(const build of builds||[]){
      if(!build.creator_id)continue;
      const profile=profileMap.get(build.creator_id)||{};
      const row=scores.get(build.creator_id)||{id:build.creator_id,username:profile.username||tr('Utilisateur','User'),avatar:profile.avatar_url||'',provider:profile.provider||'',builds:0,likes:0};
      row.builds+=1;row.likes+=Number(build.likes_count||0);scores.set(build.creator_id,row);
    }
    const ranked=[...scores.values()].sort((a,b)=>(b.likes-a.likes)||(b.builds-a.builds)||a.username.localeCompare(b.username)).slice(0,50);
    out.innerHTML=ranked.map((x,i)=>`<button type="button" class="mhurLeaderboardRow" data-profile="${esc(x.id)}"><span class="mhurLeaderboardRank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="mhurLeaderboardUser">${x.avatar?`<img class="mhurLeaderboardAvatar" src="${esc(x.avatar)}" alt="">`:'<span class="mhurLeaderboardAvatar fallback">👤</span>'}<span><b>${esc(x.username)}</b><small>${esc(x.provider||tr('Compte','Account'))} · ${x.builds} builds</small></span></span><span class="mhurLeaderboardScore"><b>♥ ${x.likes}</b><small>${tr('likes reçus','likes received')}</small></span></button>`).join('')||`<div>${tr('Aucun créateur classé pour le moment.','No ranked creators yet.')}</div>`;
    out.querySelectorAll('[data-profile]').forEach(button=>button.addEventListener('click',()=>{closeLeaderboard();window.MHUR_PROFILES?.open(button.dataset.profile)}));
  }catch(error){
    console.error('[MHUR V361 leaderboard]',error);
    out.innerHTML=`<div class="mhurLeaderboardError">${tr('Impossible de charger le classement pour le moment.','Unable to load the leaderboard right now.')}</div>`;
  }
}
window.MHUR_V361={openLeaderboard,closeLeaderboard};
if(window.MHUR_V355){window.MHUR_V355.openLeaderboard=openLeaderboard;window.MHUR_V355.closeLeaderboard=closeLeaderboard;}

// Capture the click before legacy handlers can change the page back to Home.
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-v355-leaderboard]');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();openLeaderboard();
},true);

let deferredInstall=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;ensureButtons()});
window.addEventListener('appinstalled',()=>{deferredInstall=null;document.querySelectorAll('[data-v361-install],[data-v355-install]').forEach(x=>x.remove())});
function isStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
async function installApp(){
  if(isStandalone())return alert(tr("L’application est déjà installée.",'The app is already installed.'));
  if(deferredInstall){
    const prompt=deferredInstall;deferredInstall=null;await prompt.prompt();await prompt.userChoice.catch(()=>{});return;
  }
  alert(isIOS()?tr('Sur iPhone : ouvre ce site dans Safari, touche Partager, puis « Sur l’écran d’accueil ».','On iPhone: open this site in Safari, tap Share, then “Add to Home Screen”.'):tr('Le navigateur prépare encore l’installation. Recharge une fois la page, puis réessaie. Tu peux aussi utiliser le menu du navigateur → « Installer l’application ».','The browser is still preparing installation. Reload the page once and try again. You can also use the browser menu → “Install app”.'));
}
function ensureButtons(){
  const drawer=document.getElementById('drawer');if(!drawer)return;
  let rank=drawer.querySelector('[data-v355-leaderboard]');
  if(!rank){rank=document.createElement('button');rank.type='button';rank.className='navItem';rank.dataset.v355Leaderboard='1';drawer.appendChild(rank)}
  rank.innerHTML='🏅 '+tr('Classement créateurs','Creator ranking');rank.onclick=openLeaderboard;
  drawer.querySelectorAll('[data-v355-install],[data-v360-install]').forEach(x=>x.remove());
  if(!isStandalone()){
    let install=drawer.querySelector('[data-v361-install]');
    if(!install){install=document.createElement('button');install.type='button';install.className='navItem mhurInstallButtonV360';install.dataset.v361Install='1';drawer.appendChild(install)}
    install.innerHTML='📲 '+tr("Installer l’application",'Install the app');install.onclick=installApp;
  }
}
document.addEventListener('DOMContentLoaded',()=>{patchAuth();patchNavigation();ensureButtons()});
setTimeout(()=>{patchAuth();patchNavigation();ensureButtons()},300);
setTimeout(ensureButtons,1200);
})();
