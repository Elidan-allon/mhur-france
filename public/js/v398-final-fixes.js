(()=>{
'use strict';
let deferredPrompt=null;
const isEN=()=>{try{return (typeof lang!=='undefined'?lang:window.lang)==='en'}catch(_){return false}};
const t=(fr,en)=>isEN()?en:fr;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function button(){return document.querySelector('#drawer [data-v395-key="install"],#drawer [data-mhur-install]')}
function update(){
 const b=button();if(!b)return;
 b.disabled=false;b.hidden=false;
 b.classList.toggle('is-installed',standalone());
 const label=b.querySelector('.v395-nav-label');
 const value=standalone()?t('Application installée','App installed'):deferredPrompt?t('Installer l’application','Install the app'):ios()?t('Installer sur iPhone/iPad','Install on iPhone/iPad'):t('Installer l’application','Install the app');
 if(label)label.textContent=value;else b.textContent='📲 '+value;
}
async function install(){
 if(standalone())return;
 if(deferredPrompt){const p=deferredPrompt;deferredPrompt=null;await p.prompt();await p.userChoice.catch(()=>null);update();return;}
 if(ios()){alert(t('Dans Safari, touche le bouton Partager puis « Sur l’écran d’accueil ».','In Safari, tap Share, then “Add to Home Screen”.'));return;}
 alert(t('Ouvre le menu de ton navigateur puis choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ». Si l’option n’apparaît pas, recharge la page une fois.','Open your browser menu and choose “Install app” or “Add to Home screen”. If the option is missing, reload the page once.'));
}
function wire(){const b=button();if(!b)return;b.onclick=e=>{e.preventDefault();e.stopPropagation();install()};update()}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;wire()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;wire()});
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/service-worker.js?v=398',{scope:'/',updateViaCache:'none'}).then(r=>r.update().catch(()=>{})).catch(console.warn);
const obs=new MutationObserver(()=>wire());
document.addEventListener('DOMContentLoaded',()=>{wire();obs.observe(document.getElementById('drawer')||document.body,{childList:true,subtree:true})},{once:true});
setTimeout(wire,100);setTimeout(wire,700);
window.MHUR_V398={install,wire};
})();
