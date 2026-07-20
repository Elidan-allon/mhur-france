(function(){
'use strict';
function isEnglish(){return (typeof window.lang!=='undefined'?window.lang:'fr')==='en'}
function sync(){
  const en=isEnglish();
  document.querySelectorAll('.modsTutorialStepImage[data-fr-src][data-en-src]').forEach(img=>{
    const next=en?img.dataset.enSrc:img.dataset.frSrc;
    if(next && img.getAttribute('src')!==next) img.setAttribute('src',next);
  });
}
const old=window.toggleLang;
if(typeof old==='function'&&!old.__v403Tutorial){
  const wrapped=function(){const r=old.apply(this,arguments);setTimeout(sync,0);setTimeout(sync,120);return r};
  wrapped.__v403Tutorial=true;
  window.toggleLang=wrapped;
}
new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang','data-lang']});
document.addEventListener('DOMContentLoaded',sync,{once:true});
window.addEventListener('hashchange',()=>setTimeout(sync,0));
setTimeout(sync,300);
})();
