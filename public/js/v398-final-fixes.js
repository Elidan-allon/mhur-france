(()=>{
'use strict';
let deferredPrompt=null;
let wireTimer=0;
const isEN=()=>{try{return (typeof lang!=='undefined'?lang:window.lang)==='en'}catch(_){return false}};
const t=(fr,en)=>isEN()?en:fr;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function button(){return document.querySelector('#drawer [data-v395-key="install"],#drawer [data-mhur-install]')}
function update(){
 const b=button();if(!b)return;
 if(b.disabled)b.disabled=false;
 if(b.hidden)b.hidden=false;
 b.classList.toggle('is-installed',standalone());
 const label=b.querySelector('.v395-nav-label');
 const value=standalone()?t('Application installée','App installed'):deferredPrompt?t('Installer l’application','Install the app'):ios()?t('Installer sur iPhone/iPad','Install on iPhone/iPad'):t('Installer l’application','Install the app');
 if(label){if(label.textContent!==value)label.textContent=value}
 else {const next='📲 '+value;if(b.textContent!==next)b.textContent=next}
}
async function install(){
 if(standalone())return;
 if(deferredPrompt){const p=deferredPrompt;deferredPrompt=null;await p.prompt();await p.userChoice.catch(()=>null);update();return;}
 if(ios()){alert(t('Dans Safari, touche le bouton Partager puis « Sur l’écran d’accueil ».','In Safari, tap Share, then “Add to Home Screen”.'));return;}
 alert(t('Ouvre le menu de ton navigateur puis choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option n’apparaît pas, recharge la page une fois.','Open your browser menu and choose “Install app” or “Add to Home screen”. If the option is missing, reload the page once.'));
}
function wire(){
 const b=button();if(!b)return;
 if(b.dataset.v398Wired!=='1'){
   b.dataset.v398Wired='1';
   b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();install()});
 }
 update();
}
function scheduleWire(){clearTimeout(wireTimer);wireTimer=setTimeout(wire,30)}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;scheduleWire()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;scheduleWire()});
if(false&&'serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/service-worker.js?v=399',{scope:'/',updateViaCache:'none'}).then(r=>r.update().catch(()=>{})).catch(console.warn);
document.addEventListener('DOMContentLoaded',()=>{
 wire();
 const drawer=document.getElementById('drawer');
 if(drawer){
   const obs=new MutationObserver(scheduleWire);
   obs.observe(drawer,{childList:true,subtree:true});
 }
},{once:true});
setTimeout(wire,100);setTimeout(wire,700);
window.MHUR_V398={install,wire};
})();
