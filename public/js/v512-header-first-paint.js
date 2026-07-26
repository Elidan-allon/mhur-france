(()=>{
  'use strict';

  const MOBILE_MAX=760;
  const ROOT=document.documentElement;
  let busy=false;
  let queued=false;
  let headerObserver=null;
  let bodyObserver=null;
  let resizeObserver=null;
  let drawerObserver=null;
  let drawerBackdrop=null;

  const getHeader=()=>document.querySelector('header.top');
  const getDrawer=()=>document.getElementById('drawer')||document.querySelector('.drawer');
  const q=(root,selector)=>root?.querySelector(selector)||null;

  function ensureRow(header,className){
    let row=q(header,`:scope > .${className}`);
    if(!row){row=document.createElement('div');row.className=className}
    return row;
  }

  function ensureActions(header){
    let actions=q(header,'.mhurTopActionsV31')||document.querySelector('.mhurTopActionsV31');
    if(!actions){
      actions=document.createElement('div');
      actions.className='mhurTopActionsV31';
      actions.setAttribute('aria-label','Actions du compte');
    }
    const admin=document.getElementById('mhurAdminButton')||q(header,'.mhurAdminTopButton');
    const account=document.getElementById('mhurAccountButton')||q(header,'.mhurAccountButton');
    const language=q(header,'.lang')||document.querySelector('header.top .lang');
    [admin,account,language].forEach(node=>{if(node&&node.parentNode!==actions)actions.appendChild(node)});
    return actions;
  }

  function place(parent,nodes){
    const wanted=nodes.filter(Boolean);
    const current=Array.from(parent.children).filter(child=>wanted.includes(child));
    const already=current.length===wanted.length&&wanted.every((node,index)=>node.parentNode===parent&&current[index]===node);
    if(already)return;
    wanted.forEach(node=>parent.appendChild(node));
  }

  function measureNow(header=getHeader()){
    if(!header)return;
    if(innerWidth>MOBILE_MAX){
      ROOT.style.setProperty('--mhur-top-height','72px');
      ROOT.style.setProperty('--mhur-header-bottom','72px');
      ROOT.style.setProperty('--mhur-header-visual-bottom','72px');
      return;
    }
    const rect=header.getBoundingClientRect();
    const height=Math.max(1,Math.ceil(rect.height));
    const bottom=Math.max(height,Math.ceil(rect.bottom));
    ROOT.style.setProperty('--mhur-top-height',`${height}px`);
    ROOT.style.setProperty('--mhur-header-bottom',`${bottom}px`);
    ROOT.style.setProperty('--mhur-header-visual-bottom',`${bottom}px`);
  }

  function arrangeMobile(header){
    const toolbar=ensureRow(header,'mhurMobileToolbarV57');
    const brandRow=ensureRow(header,'mhurMobileBrandRowV57');
    const actions=ensureActions(header);
    const menu=q(header,'.menuBtn')||document.querySelector('.menuBtn');
    const links=q(header,'.nexusHeaderLinks')||document.querySelector('.nexusHeaderLinks');
    const brand=q(header,'.brand')||document.querySelector('header.top .brand');

    place(toolbar,[menu,links,actions]);
    place(brandRow,[brand]);
    place(header,[brandRow,toolbar]);
    header.classList.add('mhurMobileHeaderV511','mhurHeaderReadyV511','mhurHeaderReadyV512');
    header.classList.remove('mhurHeaderCompactV51','mhurHeaderTightV51','mhurHeaderMinimalV51');
    measureNow(header);
  }

  function arrangeDesktop(header){
    const toolbar=q(header,':scope > .mhurMobileToolbarV57');
    const brandRow=q(header,':scope > .mhurMobileBrandRowV57');
    const menu=q(toolbar,'.menuBtn')||q(header,'.menuBtn');
    const links=q(toolbar,'.nexusHeaderLinks')||q(header,'.nexusHeaderLinks');
    const actions=q(toolbar,'.mhurTopActionsV31')||q(header,'.mhurTopActionsV31')||ensureActions(header);
    const brand=q(brandRow,'.brand')||q(header,'.brand');
    place(header,[menu,brand,links,actions]);
    toolbar?.remove();
    brandRow?.remove();
    header.classList.remove('mhurMobileHeaderV511','mhurHeaderMinimalV51');
    header.classList.toggle('mhurHeaderCompactV51',innerWidth<1360);
    header.classList.toggle('mhurHeaderTightV51',innerWidth<980);
    header.classList.add('mhurHeaderReadyV511','mhurHeaderReadyV512');
    measureNow(header);
  }

  function reconcile(){
    if(busy)return;
    const header=getHeader();
    if(!header)return;
    busy=true;
    try{innerWidth<=MOBILE_MAX?arrangeMobile(header):arrangeDesktop(header)}finally{busy=false}
    syncDrawerBackdrop();
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;reconcile()});
  }

  function ensureDrawerBackdrop(){
    if(drawerBackdrop?.isConnected)return drawerBackdrop;
    drawerBackdrop=document.createElement('div');
    drawerBackdrop.className='mhurDrawerBackdropV511';
    drawerBackdrop.setAttribute('aria-hidden','true');
    drawerBackdrop.addEventListener('click',closeDrawer);
    document.body.appendChild(drawerBackdrop);
    return drawerBackdrop;
  }

  function closeDrawer(){
    getDrawer()?.classList.remove('open');
    ensureDrawerBackdrop().classList.remove('open');
  }

  function closeLinks(){
    const overlay=document.querySelector('.nexusLinksOverlay.is-open');
    if(!overlay)return;
    const close=overlay.querySelector('.nexusLinksClose');
    if(close)close.click();
    else{
      overlay.classList.remove('is-open');
      document.querySelectorAll('.nexusHeaderBtn').forEach(button=>button.setAttribute('aria-expanded','false'));
    }
  }

  function syncDrawerBackdrop(){
    const open=!!getDrawer()?.classList.contains('open');
    ensureDrawerBackdrop().classList.toggle('open',open);
  }

  function mountObservers(){
    const header=getHeader();
    const drawer=getDrawer();
    if(header){
      headerObserver?.disconnect();
      headerObserver=new MutationObserver(schedule);
      headerObserver.observe(header,{childList:true,subtree:true,attributes:true,characterData:true});
      if('ResizeObserver' in window){
        resizeObserver?.disconnect();
        resizeObserver=new ResizeObserver(()=>measureNow(header));
        resizeObserver.observe(header);
      }
    }
    if(drawer){
      drawerObserver?.disconnect();
      drawerObserver=new MutationObserver(syncDrawerBackdrop);
      drawerObserver.observe(drawer,{attributes:true,attributeFilter:['class']});
    }
    bodyObserver?.disconnect();
    bodyObserver=new MutationObserver(()=>{
      if(getHeader()&&!getHeader().classList.contains('mhurHeaderReadyV512'))schedule();
      if(getDrawer()&&!drawerObserver)mountObservers();
    });
    bodyObserver.observe(document.body,{childList:true,subtree:false});
  }

  document.addEventListener('click',event=>{
    const target=event.target;
    const linksOpen=document.querySelector('.nexusLinksOverlay.is-open');
    if(linksOpen&&!target.closest('.nexusLinksPanel')&&!target.closest('.nexusHeaderBtn'))closeLinks();

    const drawer=getDrawer();
    if(drawer?.classList.contains('open')&&!target.closest('.drawer')&&!target.closest('.menuBtn'))closeDrawer();

    if(target.closest('.menuBtn')){
      closeLinks();
      setTimeout(syncDrawerBackdrop,0);
    }else if(target.closest('.nexusHeaderBtn')){
      closeDrawer();
    }else if(target.closest('.drawer .navItem')){
      closeDrawer();
    }
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    closeDrawer();
    closeLinks();
  });

  function mount(){
    ensureDrawerBackdrop();
    reconcile(); /* synchrone : position correcte avant le premier affichage */
    mountObservers();
  }

  mount();
  addEventListener('DOMContentLoaded',mount,{once:true});
  addEventListener('load',()=>{reconcile();measureNow()},{once:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  visualViewport?.addEventListener('resize',schedule,{passive:true});
  document.fonts?.ready?.then(schedule).catch(()=>{});
})();
