/* V400 — état actif fiable du menu. */
(()=>{
  'use strict';
  function currentKey(){
    const hash=(location.hash||'').replace(/^#/,'');
    if(hash==='mods') return 'mods';
    try{
      if(typeof page!=='undefined'&&page) return String(page);
    }catch(_){}
    return hash||'home';
  }
  function refresh(){
    const drawer=document.getElementById('drawer');
    if(!drawer)return;
    const key=currentKey();
    drawer.querySelectorAll('.navItem').forEach(node=>{
      const nodeKey=node.dataset.v395Key||node.dataset.page||node.dataset.mhurFinalNav||'';
      node.classList.toggle('active',nodeKey===key);
    });
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0),{once:true});
  window.addEventListener('load',()=>setTimeout(refresh,80),{once:true});
  window.addEventListener('hashchange',()=>setTimeout(refresh,30));
  document.addEventListener('click',e=>{
    if(e.target.closest('#drawer .navItem,#langBtn,.langBtn,[data-lang]'))setTimeout(refresh,60);
  });
  const old=window.MHUR_V395?.refreshMenu;
  if(typeof old==='function'){
    window.MHUR_V395.refreshMenu=function(){const out=old.apply(this,arguments);setTimeout(refresh,0);return out};
  }
  window.MHUR_V400={refreshMenuActive:refresh};
})();
