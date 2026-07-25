(()=>{
  'use strict';
  let busy=false;

  function header(){return document.querySelector('header.top')}
  function arrange(){
    if(busy)return;
    busy=true;
    try{
      const h=header();
      if(!h)return;
      let wrap=h.querySelector('.mhurTopActionsV31');
      if(!wrap){
        wrap=document.createElement('div');
        wrap.className='mhurTopActionsV31';
        wrap.setAttribute('aria-label','Actions du compte');
        h.appendChild(wrap);
      }
      const admin=document.getElementById('mhurAdminButton');
      const account=document.getElementById('mhurAccountButton');
      const lang=h.querySelector('.lang');
      [admin,account,lang].forEach(element=>{
        if(element&&element.parentNode!==wrap)wrap.appendChild(element);
      });
    }finally{busy=false}
  }

  const observer=new MutationObserver(arrange);
  function mount(){
    const h=header();
    if(!h)return;
    observer.disconnect();
    observer.observe(h,{childList:true,subtree:true});
    arrange();
  }

  document.addEventListener('DOMContentLoaded',mount,{once:true});
  addEventListener('load',mount,{once:true});
  addEventListener('resize',arrange,{passive:true});
  setTimeout(arrange,100);
  setTimeout(arrange,600);
})();
