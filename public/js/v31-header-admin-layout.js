(()=>{
  'use strict';
  const DESKTOP='(min-width: 761px)';
  const mq=matchMedia(DESKTOP);
  let busy=false;

  function header(){return document.querySelector('header.top')}
  function getParts(){
    const h=header();
    return {
      h,
      admin:document.getElementById('mhurAdminButton'),
      account:document.getElementById('mhurAccountButton'),
      lang:h?.querySelector(':scope > .lang, .mhurTopActionsV31 > .lang')||document.querySelector('header.top .lang'),
      wrap:h?.querySelector('.mhurTopActionsV31')||null
    };
  }

  function arrange(){
    if(busy)return;
    busy=true;
    try{
      const p=getParts();
      if(!p.h)return;

      if(mq.matches){
        let wrap=p.wrap;
        if(!wrap){
          wrap=document.createElement('div');
          wrap.className='mhurTopActionsV31';
          wrap.setAttribute('aria-label','Actions du compte');
          p.h.appendChild(wrap);
        }
        /* Ordre volontaire : modération, compte, langue. */
        if(p.admin&&p.admin.parentNode!==wrap)wrap.appendChild(p.admin);
        if(p.account&&p.account.parentNode!==wrap)wrap.appendChild(p.account);
        if(p.lang&&p.lang.parentNode!==wrap)wrap.appendChild(p.lang);
      }else if(p.wrap){
        /* Sur mobile, on restitue la structure historique pour conserver les
           correctifs iPhone existants. */
        const admin=p.wrap.querySelector('#mhurAdminButton');
        const account=p.wrap.querySelector('#mhurAccountButton');
        const lang=p.wrap.querySelector('.lang');
        if(admin)p.h.appendChild(admin);
        if(account)p.h.appendChild(account);
        if(lang)p.h.appendChild(lang);
        p.wrap.remove();
        if(admin&&account)p.h.insertBefore(admin,account);
      }
    }finally{busy=false}
  }

  const observer=new MutationObserver(arrange);
  function mount(){
    const h=header();
    if(!h)return;
    observer.observe(h,{childList:true,subtree:false});
    arrange();
  }

  document.addEventListener('DOMContentLoaded',mount,{once:true});
  addEventListener('load',arrange,{once:true});
  mq.addEventListener?.('change',arrange);
  setTimeout(arrange,100);
  setTimeout(arrange,600);
})();
