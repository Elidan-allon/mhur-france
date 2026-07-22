(function(){
'use strict';

const RELEASE='431';
const CACHE_NAME=`mhur-fr-${RELEASE}`;

function language(){
  const html=String(document.documentElement.lang||'').toLowerCase();
  if(html.startsWith('en'))return 'en';
  try{if(localStorage.getItem('mhur_lang')==='en')return 'en'}catch(_){}
  try{if(typeof lang!=='undefined'&&lang==='en')return 'en'}catch(_){}
  return 'fr';
}

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

function syncLegalFallback(){
  const en=language()==='en';
  const footer=document.getElementById('mhurLegalFooter');
  if(footer){
    const labels=en
      ?{privacy:'Privacy',rules:'Rules',about:'About',notice:'Unofficial community project · Version 1.0',disclaimer:'MHUR France is not affiliated with, endorsed by, or supported by Bandai Namco Entertainment Inc. or Byking Inc.'}
      :{privacy:'Confidentialité',rules:'Règles',about:'À propos',notice:'Projet communautaire non officiel · Version 1.0',disclaimer:"MHUR France n’est ni affilié, ni approuvé, ni soutenu par Bandai Namco Entertainment Inc. ou Byking Inc."};
    footer.querySelectorAll('[data-legal]').forEach(button=>{
      button.textContent=labels[button.dataset.legal]||button.textContent;
    });
    const notice=footer.querySelector('.mhurFooterVersion')||footer.querySelector('span');
    if(notice)notice.textContent=labels.notice;
    const disclaimer=footer.querySelector('.mhurFooterDisclaimer');
    if(disclaimer)disclaimer.textContent=labels.disclaimer;
  }
  window.MHUR_LAUNCH?.refreshLanguage?.();
}

function syncLanguage(){
  try{localStorage.setItem('mhur_lang',language())}catch(_){}
  syncLegalFallback();
  rootAllImages();
}

rootAllImages();
document.addEventListener('error',event=>repairFailedImage(event.target),true);
new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes){
      if(node.nodeType===Node.ELEMENT_NODE)rootAllImages(node);
    }
  }
}).observe(document.documentElement,{childList:true,subtree:true});

window.addEventListener('mhur:languagechange',()=>setTimeout(syncLanguage,0));
document.addEventListener('click',event=>{
  if(event.target.closest('.lang,#langBtn,.langBtn,[data-lang]'))setTimeout(syncLanguage,0);
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncLanguage,{once:true});
else syncLanguage();

if('caches' in window){
  caches.keys().then(keys=>Promise.all(keys
    .filter(key=>key.startsWith('mhur-fr-')&&key!==CACHE_NAME)
    .map(key=>caches.delete(key)))).catch(()=>{});
}

if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register(`/service-worker-v431.js?v=${RELEASE}`,{
    scope:'/',
    updateViaCache:'none'
  }).then(registration=>registration.update().catch(()=>{})).catch(()=>{});
}

window.MHUR_V431={syncLanguage,rootAllImages,release:RELEASE};
})();
