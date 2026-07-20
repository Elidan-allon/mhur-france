(function(){
'use strict';
const RELEASE='371';
window.MHUR_RELEASE=RELEASE;
const isEN=()=>{try{return typeof lang!=='undefined'&&lang==='en'}catch(_){return document.documentElement.lang==='en'}};
const tr=(fr,en)=>isEN()?en:fr;

/* PWA: never serve an old application build. The install button is only actionable when the browser exposes the native prompt. */
let deferredPrompt=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function installButton(){return document.querySelector('[data-mhur-install]')}
function updateInstallButton(){
  const b=installButton(); if(!b)return;
  if(standalone()){
    b.hidden=false;b.disabled=true;b.textContent='✅ '+tr('Application installée','App installed');return;
  }
  if(isIOS()){
    b.hidden=false;b.disabled=false;b.textContent='📲 '+tr('Installer sur iPhone/iPad','Install on iPhone/iPad');return;
  }
  if(deferredPrompt){
    b.hidden=false;b.disabled=false;b.textContent='📲 '+tr('Installer l’application','Install the app');return;
  }
  /* Chromium hides the native prompt until all eligibility checks pass. Do not display a broken pseudo-installer. */
  b.hidden=true;b.disabled=true;
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;updateInstallButton()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;updateInstallButton()});
async function nativeInstall(){
  if(standalone())return;
  if(isIOS()){
    alert(tr('Dans Safari, touche Partager puis « Sur l’écran d’accueil ».','In Safari, tap Share, then “Add to Home Screen”.'));
    return;
  }
  if(!deferredPrompt){updateInstallButton();return;}
  const p=deferredPrompt;deferredPrompt=null;updateInstallButton();
  await p.prompt(); await p.userChoice.catch(()=>null); updateInstallButton();
}
function wireInstall(){const b=installButton();if(!b)return;b.onclick=nativeInstall;updateInstallButton()}
window.MHUR_V371_WIRE_INSTALL=wireInstall;

/* Network-only service worker: installed app always receives the current Cloudflare deployment. */
async function registerWorker(){
  if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
  try{
    const regs=await navigator.serviceWorker.getRegistrations();
    for(const r of regs){if(!String(r.active?.scriptURL||r.installing?.scriptURL||'').includes('service-worker.js'))await r.unregister()}
    const reg=await navigator.serviceWorker.register('/service-worker.js?v='+RELEASE,{scope:'/',updateViaCache:'none'});
    reg.update().catch(()=>{});
  }catch(e){console.warn('[MHUR V371 SW]',e)}
}

/* English fallback cleanup. It never overwrites genuine official English text. */
const exact={
 'Personnage jouable':'Playable character','Aucun build pour ce style.':'No build for this style.',
 'Sois le premier à en publier un.':'Be the first to publish one.','Personnage introuvable.':'Character not found.',
 'Compétences indisponibles.':'Skills unavailable.','Données indisponibles.':'Data unavailable.',
 'Aucun costume trouvé.':'No costume found.','Retour':'Back','Rôle':'Role','Style':'Style',
 'Effets de montée de niveau':'Level-up Effects','Valeurs de base':'Base Values','Valeurs supplémentaires':'Additional Values'
};
const replacements=[
 [/Utilise ([^.!]+), l['’]une des compétences de ([^.!]+)\.?/gi,'$2 uses $1 as a Quirk Skill.'],
 [/Utilise ([^.!]+), une des compétences de ([^.!]+)\.?/gi,'$2 uses $1 as a Quirk Skill.'],
 [/Augmente/gi,'Increases'],[/Réduit/gi,'Reduces'],[/Inflige/gi,'Deals'],[/Permet/gi,'Allows'],
 [/pendant une durée limitée/gi,'for a limited time'],[/les dégâts subis/gi,'damage taken'],[/les dégâts/gi,'damage'],
 [/la vitesse de déplacement/gi,'movement speed'],[/la vitesse de rechargement/gi,'reload speed'],[/la défense/gi,'defense'],
 [/les alliés/gi,'allies'],[/les ennemis/gi,'enemies'],[/l['’]ennemi/gi,'the enemy'],[/à proximité/gi,'nearby'],
 [/Maintenir la commande/gi,'Hold the button'],[/Appuyer sur la commande/gi,'Press the button'],[/au début de la bataille/gi,'at the start of the battle']
];
function translateString(s){
  s=String(s??''); if(!isEN())return s; if(exact[s])return exact[s];
  for(const [rx,to] of replacements)s=s.replace(rx,to);
  return s;
}
function translateVisible(root=document.body){
  if(!isEN()||!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    if(!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
    const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/i.test(p.tagName))return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  let n;while((n=walker.nextNode())){const v=translateString(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}
}
let queued=false;
function scheduleTranslate(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;translateVisible(document.getElementById('app')||document.body)})}

/* Keep controls present after every render without touching character/style navigation. */
function ensureMenu(){
  const drawer=document.getElementById('drawer');if(!drawer)return;
  let rank=drawer.querySelector('[data-mhur-leaderboard]');
  if(!rank){rank=document.createElement('button');rank.type='button';rank.className='navItem';rank.dataset.mhurLeaderboard='1';rank.textContent='🏅 '+tr('Classement créateurs','Creator ranking');drawer.appendChild(rank)}
  rank.onclick=()=>window.MHUR_V370?.openLeaderboard?.();
  let install=drawer.querySelector('[data-mhur-install]');
  if(!install){install=document.createElement('button');install.type='button';install.className='navItem';install.dataset.mhurInstall='1';drawer.appendChild(install)}
  wireInstall();
}

function boot(){
  document.documentElement.dataset.release=RELEASE;
  ensureMenu();wireInstall();registerWorker();scheduleTranslate();
  const app=document.getElementById('app');
  if(app)new MutationObserver(()=>{ensureMenu();scheduleTranslate()}).observe(app,{childList:true,subtree:true});
}
document.addEventListener('DOMContentLoaded',boot,{once:true});
setTimeout(boot,100);
})();
