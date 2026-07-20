(function(){
'use strict';

function getDrawer(){ return document.getElementById('drawer'); }
function getMenuButton(){ return document.querySelector('.menuBtn'); }

function ensureHamburger(){
  const btn=getMenuButton();
  if(!btn) return;
  btn.style.display='flex';
  btn.setAttribute('aria-label', (document.documentElement.lang||'fr').startsWith('en') ? 'Open menu' : 'Ouvrir le menu');
  if(!btn.querySelector('.menuBtnLines')){
    btn.textContent='';
    const lines=document.createElement('span');
    lines.className='menuBtnLines';
    lines.setAttribute('aria-hidden','true');
    lines.innerHTML='<span></span><span></span><span></span>';
    btn.appendChild(lines);
  }
  if(!btn.dataset.v384Bound){
    btn.dataset.v384Bound='1';
    btn.addEventListener('click', function(ev){
      const drawer=getDrawer();
      if(!drawer) return;
      ev.preventDefault();
      ev.stopPropagation();
      drawer.classList.toggle('open');
    }, true);
  }
}

function keepControlsVisible(){
  const top=document.querySelector('.top');
  if(top){
    top.style.position='fixed';
    top.style.top='0';
  }
  ensureHamburger();
}

/* Ferme le tiroir seulement lorsqu'un vrai lien de navigation est choisi. */
document.addEventListener('click', function(ev){
  const drawer=getDrawer();
  if(!drawer || !drawer.classList.contains('open')) return;
  const nav=ev.target.closest('.navItem');
  if(nav) requestAnimationFrame(()=>drawer.classList.remove('open'));
}, false);

/* Les anciens scripts reconstruisent parfois l'en-tête : on réapplique sans boucle lourde. */
let queued=false;
function queueRefresh(){
  if(queued) return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;keepControlsVisible();});
}

keepControlsVisible();
window.addEventListener('scroll', keepControlsVisible, {passive:true});
window.addEventListener('resize', queueRefresh, {passive:true});
const observer=new MutationObserver(queueRefresh);
observer.observe(document.body,{childList:true,subtree:true});
})();
