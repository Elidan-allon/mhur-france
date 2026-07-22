(function(){
'use strict';

const RELEASE='431';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const KEY=String(cfg.supabaseKey||'').trim();
const remote=/^https:\/\/.+\.supabase\.co$/i.test(API)&&!!KEY;
let currentLegalType='about';

const currentLanguage=()=>{
  try{
    if(typeof lang!=='undefined')return lang==='en'?'en':'fr';
  }catch(_){}
  const htmlLanguage=String(document.documentElement.lang||'').toLowerCase();
  if(htmlLanguage.startsWith('en'))return 'en';
  try{
    if(localStorage.getItem('mhur_lang')==='en')return 'en';
  }catch(_){}
  return 'fr';
};
const isEnglish=()=>currentLanguage()==='en';
const t=(fr,en)=>isEnglish()?en:fr;

function rootImage(image){
  if(!(image instanceof HTMLImageElement))return;
  const raw=image.getAttribute('src');
  if(!raw||/^(?:https?:|data:|blob:|\/)/i.test(raw))return;
  image.setAttribute('src','/'+raw.replace(/^(?:\.{1,2}\/)+/,''));
}
function rootAllImages(root=document){
  if(root instanceof HTMLImageElement)rootImage(root);
  if(root.querySelectorAll)root.querySelectorAll('img[src]').forEach(rootImage);
}
function repairFailedImage(image){
  if(!(image instanceof HTMLImageElement)||image.dataset.mhurRootRetry==='1')return;
  let pathname='';
  try{pathname=new URL(image.currentSrc||image.src,location.href).pathname}catch(_){return}
  const marker=pathname.indexOf('/assets/');
  if(marker<=0)return;
  image.dataset.mhurRootRetry='1';
  image.src=pathname.slice(marker);
}

async function req(path,opt={}){
  const token=window.MHUR_AUTH?.getAccessToken?.()||KEY;
  const r=await fetch(API+path,{...opt,headers:{apikey:KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(opt.headers||{})}});
  const text=await r.text();
  let data=null;
  try{data=text?JSON.parse(text):null}catch(_){data=text}
  if(!r.ok)throw new Error(data?.message||data?.hint||text||`HTTP ${r.status}`);
  return data;
}

function lastSync(){
  try{
    const raw=localStorage.getItem('mhur_last_sync_v322');
    if(raw)return new Date(raw);
  }catch(_){}
  return null;
}

function statusText(){
  if(!navigator.onLine)return t(
    'Hors connexion — les données locales restent consultables',
    'Offline — local data remains available'
  );
  if(!remote)return t(
    'Mode local — Supabase doit encore être configuré',
    'Local mode — Supabase still needs to be configured'
  );
  const date=lastSync();
  if(!date)return t('En ligne · communauté connectée','Online · community connected');
  const locale=isEnglish()?'en-US':'fr-FR';
  return t('En ligne · dernière synchronisation ','Online · last sync ')+date.toLocaleString(locale);
}

function renderStatus(){
  let bar=document.getElementById('mhurLaunchBar');
  if(!bar){
    bar=document.createElement('div');
    bar.id='mhurLaunchBar';
    bar.className='mhurLaunchBar';
    bar.innerHTML='<span class="mhurLaunchDot"></span><span id="mhurLaunchText"></span><button type="button" onclick="MHUR_LAUNCH.refreshStatus()" aria-label="Actualiser">↻</button>';
    document.body.appendChild(bar);
  }
  bar.classList.toggle('offline',!navigator.onLine);
  bar.classList.toggle('online',navigator.onLine&&remote);
  const text=document.getElementById('mhurLaunchText');
  if(text)text.textContent=statusText();
  const button=bar.querySelector('button');
  if(button)button.setAttribute('aria-label',t('Actualiser','Refresh'));
}

function overlay(){
  let modal=document.getElementById('mhurLegalOverlay');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='mhurLegalOverlay';
  modal.className='mhurLegalOverlay';
  modal.innerHTML='<article class="mhurLegalPanel" role="dialog" aria-modal="true" aria-labelledby="mhurLegalTitle"><button class="mhurLegalClose" type="button" onclick="MHUR_LAUNCH.close()">×</button><div id="mhurLegalBody"></div></article>';
  modal.addEventListener('click',event=>{if(event.target===modal)close()});
  document.body.appendChild(modal);
  return modal;
}

const legalPages={
  fr:{
    privacy:`<h2 id="mhurLegalTitle">Confidentialité</h2><p>Le site utilise Supabase pour les comptes, les builds, les likes, les favoris et la modération. Lors d’une connexion Google ou Discord, nous recevons l’identifiant du compte, le pseudo, l’adresse e-mail et la photo de profil fournis par le service.</p><h3>Données publiques</h3><p>Le pseudo, l’avatar, la date d’inscription et les builds publiés peuvent être visibles par les autres utilisateurs. L’adresse e-mail n’est pas affichée publiquement.</p><h3>Utilisation</h3><p>Les données servent uniquement au fonctionnement de la communauté, à la sécurité, aux favoris, aux statistiques et à la modération.</p><h3>Suppression</h3><p>Un utilisateur connecté peut demander la suppression de son compte ci-dessous. La demande sera visible par l’administrateur.</p><div class="mhurDeleteRequest"><button id="mhurDeleteAccountButton" type="button" onclick="MHUR_LAUNCH.requestDeletion()">Demander la suppression de mon compte</button><p id="mhurDeleteAccountMessage"></p></div>`,
    rules:`<h2 id="mhurLegalTitle">Règles de la communauté</h2><ol><li>Publie des builds réellement utilisables et décris clairement leur objectif.</li><li>Pas de spam, publicité, harcèlement, insultes ou contenu inapproprié.</li><li>Ne copie pas le pseudo ou l’identité d’un autre utilisateur.</li><li>Les signalements abusifs peuvent être ignorés.</li><li>Les modérateurs peuvent masquer un contenu qui enfreint les règles.</li></ol><h3>Build vérifié</h3><p>Le badge « Vérifié » signifie qu’un modérateur a contrôlé le build. Il ne garantit pas qu’il s’agit du meilleur build possible.</p>`,
    about:`<h2 id="mhurLegalTitle">À propos</h2><p>MY HERO ULTRA RUMBLE FRANCE est un projet communautaire indépendant consacré aux personnages, costumes, T.U.N.I.N.G, builds et patch notes.</p><p>Ce site n’est pas affilié, approuvé ou administré par Bandai Namco Entertainment, Byking, Kohei Horikoshi ou les détenteurs des droits de My Hero Academia.</p><p>Les marques, noms et visuels appartiennent à leurs propriétaires respectifs.</p>`
  },
  en:{
    privacy:`<h2 id="mhurLegalTitle">Privacy</h2><p>The site uses Supabase for accounts, builds, likes, favorites, and moderation. When you sign in with Google or Discord, we receive the account identifier, username, email address, and profile picture provided by that service.</p><h3>Public data</h3><p>Your username, avatar, registration date, and published builds may be visible to other users. Your email address is never displayed publicly.</p><h3>How the data is used</h3><p>The data is used only to operate the community features, provide security, manage favorites and statistics, and support moderation.</p><h3>Deletion</h3><p>A signed-in user can request the deletion of their account below. The request will be made available to the administrator.</p><div class="mhurDeleteRequest"><button id="mhurDeleteAccountButton" type="button" onclick="MHUR_LAUNCH.requestDeletion()">Request deletion of my account</button><p id="mhurDeleteAccountMessage"></p></div>`,
    rules:`<h2 id="mhurLegalTitle">Community Rules</h2><ol><li>Publish builds that can actually be used and clearly describe their purpose.</li><li>No spam, advertising, harassment, insults, or inappropriate content.</li><li>Do not impersonate another user or copy their username.</li><li>Abusive reports may be ignored.</li><li>Moderators may hide content that breaks these rules.</li></ol><h3>Verified build</h3><p>The “Verified” badge means that a moderator has reviewed the build. It does not guarantee that it is the best possible build.</p>`,
    about:`<h2 id="mhurLegalTitle">About</h2><p>MY HERO ULTRA RUMBLE FRANCE is an independent community project dedicated to characters, costumes, T.U.N.I.N.G, builds, and patch notes.</p><p>This site is not affiliated with, endorsed by, or managed by Bandai Namco Entertainment, Byking, Kohei Horikoshi, or the rights holders of My Hero Academia.</p><p>All trademarks, names, and visual assets belong to their respective owners.</p>`
  }
};

function renderLegalPage(type=currentLegalType){
  currentLegalType=legalPages.fr[type]?type:'about';
  const body=document.getElementById('mhurLegalBody');
  if(!body)return;
  body.innerHTML=legalPages[currentLanguage()][currentLegalType];
  const closeButton=document.querySelector('#mhurLegalOverlay .mhurLegalClose');
  if(closeButton){
    closeButton.setAttribute('aria-label',t('Fermer','Close'));
    closeButton.title=t('Fermer','Close');
  }
  if(currentLegalType==='privacy'){
    const button=document.getElementById('mhurDeleteAccountButton');
    const message=document.getElementById('mhurDeleteAccountMessage');
    if(button&&!window.MHUR_AUTH?.getUser?.()){
      button.disabled=true;
      if(message)message.textContent=t(
        'Connecte-toi pour envoyer une demande.',
        'Sign in to submit a request.'
      );
    }
  }
}

function open(type){
  const modal=overlay();
  renderLegalPage(type);
  modal.classList.add('open');
  document.body.classList.add('cbModalOpen');
}

function close(){
  overlay().classList.remove('open');
  if(!document.querySelector('.cbModal.open,.mhurAuthOverlay.open,.mhurPublicProfileModal.open,.mhurModerationOverlay.open')){
    document.body.classList.remove('cbModalOpen');
  }
}

async function requestDeletion(){
  if(!window.MHUR_AUTH?.requireLogin?.(t(
    'Connecte-toi pour demander la suppression du compte.',
    'Sign in to request account deletion.'
  )))return;
  const user=window.MHUR_AUTH.getUser();
  const button=document.getElementById('mhurDeleteAccountButton');
  const message=document.getElementById('mhurDeleteAccountMessage');
  if(button)button.disabled=true;
  try{
    if(!remote)throw new Error(t('Supabase non configuré','Supabase is not configured'));
    await req('/rest/v1/account_deletion_requests',{
      method:'POST',
      headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({user_id:user.id,status:'pending',requested_at:new Date().toISOString()})
    });
    if(message)message.textContent=t(
      'Demande enregistrée. Un administrateur pourra la traiter.',
      'Request recorded. An administrator will be able to process it.'
    );
  }catch(error){
    if(button)button.disabled=false;
    if(message)message.textContent=t(
      'Impossible d’envoyer la demande : ',
      'Unable to submit the request: '
    )+(error.message||error);
  }
}

function footer(){
  let footerElement=document.getElementById('mhurLegalFooter');
  if(!footerElement){
    footerElement=document.createElement('footer');
    footerElement.id='mhurLegalFooter';
    footerElement.className='mhurLegalFooter';
    footerElement.innerHTML='<button type="button" data-legal="privacy" onclick="MHUR_LAUNCH.open(\'privacy\')"></button><button type="button" data-legal="rules" onclick="MHUR_LAUNCH.open(\'rules\')"></button><button type="button" data-legal="about" onclick="MHUR_LAUNCH.open(\'about\')"></button><span></span>';
    document.body.appendChild(footerElement);
  }
  const labels=isEnglish()
    ?{privacy:'Privacy',rules:'Rules',about:'About',notice:'Unofficial community project · Version 1.0',disclaimer:'MHUR France is not affiliated with, endorsed by, or supported by Bandai Namco Entertainment Inc. or Byking Inc.'}
    :{privacy:'Confidentialité',rules:'Règles',about:'À propos',notice:'Projet communautaire non officiel · Version 1.0',disclaimer:"MHUR France n’est ni affilié, ni approuvé, ni soutenu par Bandai Namco Entertainment Inc. ou Byking Inc."};
  footerElement.querySelectorAll('[data-legal]').forEach(button=>{
    button.textContent=labels[button.dataset.legal]||'';
  });
  const notice=footerElement.querySelector('.mhurFooterVersion')||footerElement.querySelector('span');
  if(notice)notice.textContent=labels.notice;
  const disclaimer=footerElement.querySelector('.mhurFooterDisclaimer');
  if(disclaimer)disclaimer.textContent=labels.disclaimer;
}

function refreshLanguage(){
  document.documentElement.lang=currentLanguage();
  footer();
  renderStatus();
  const modal=document.getElementById('mhurLegalOverlay');
  if(modal?.classList.contains('open'))renderLegalPage(currentLegalType);
}

window.MHUR_LAUNCH={
  open,
  close,
  requestDeletion,
  refreshStatus:renderStatus,
  refreshLanguage
};

function initialize(){
  rootAllImages();
  footer();
  renderStatus();
  refreshLanguage();
  document.addEventListener('error',event=>repairFailedImage(event.target),true);
  new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes){
      if(node.nodeType===Node.ELEMENT_NODE)rootAllImages(node);
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
else initialize();
window.addEventListener('mhur:languagechange',refreshLanguage);
document.addEventListener('click',event=>{
  if(event.target.closest('.lang,#langBtn,.langBtn,[data-lang]'))setTimeout(refreshLanguage,0);
},true);
window.addEventListener('online',renderStatus);
window.addEventListener('offline',renderStatus);
})();
