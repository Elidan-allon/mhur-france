(()=>{
  'use strict';

  const MOBILE_MAX=760;
  const ROOT=document.documentElement;
  let busy=false;
  let scheduled=false;
  let headerObserver=null;
  let appObserver=null;
  let resizeObserver=null;

  const q=(root,selector)=>root?.querySelector(selector)||null;
  const getHeader=()=>document.querySelector('header.top');
  const getPart=(header,selector)=>q(header,selector)||document.querySelector(selector);

  function ensureActions(header){
    let wrap=q(header,'.mhurTopActionsV31')||document.querySelector('.mhurTopActionsV31');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.className='mhurTopActionsV31';
      wrap.setAttribute('aria-label','Actions du compte');
    }
    const admin=document.getElementById('mhurAdminButton');
    const account=document.getElementById('mhurAccountButton');
    const lang=getPart(header,'.lang');
    [admin,account,lang].forEach(element=>{
      if(element&&element.parentNode!==wrap)wrap.appendChild(element);
    });
    return wrap;
  }

  function ensureRow(header,className){
    let row=q(header,`:scope > .${className}`);
    if(!row){
      row=document.createElement('div');
      row.className=className;
    }
    return row;
  }

  function placeInOrder(parent,elements){
    const wanted=elements.filter(Boolean);
    const current=Array.from(parent.children).filter(child=>wanted.includes(child));
    const already=wanted.length===current.length&&wanted.every((element,index)=>current[index]===element&&element.parentNode===parent);
    if(already)return;
    wanted.forEach(element=>parent.appendChild(element));
  }

  function updateAppState(){
    const app=document.getElementById('app');
    if(!app)return;
    let hasBack=false;
    try{hasBack=!!app.querySelector(':scope > .back')}catch(_){hasBack=!!app.querySelector('.back')}
    app.classList.toggle('mhurHasBackV57',hasBack);
    app.classList.remove('mhurHasBackV56');
  }

  function updateHeight(header){
    if(!header?.classList.contains('mhurMobileHeaderV57'))return;
    requestAnimationFrame(()=>{
      const height=Math.max(1,Math.ceil(header.getBoundingClientRect().height));
      ROOT.style.setProperty('--mhur-top-height',`${height}px`);
    });
  }

  function cleanLegacyRows(header){
    const oldNav=q(header,':scope > .mhurMobileNavRowV56');
    const oldBrand=q(header,':scope > .mhurMobileBrandRowV56');
    if(oldNav){
      Array.from(oldNav.children).forEach(child=>header.appendChild(child));
      oldNav.remove();
    }
    if(oldBrand){
      Array.from(oldBrand.children).forEach(child=>header.appendChild(child));
      oldBrand.remove();
    }
  }

  function arrangeMobile(header){
    cleanLegacyRows(header);
    const toolbar=ensureRow(header,'mhurMobileToolbarV57');
    const brandRow=ensureRow(header,'mhurMobileBrandRowV57');
    const actions=ensureActions(header);
    const menu=getPart(header,'.menuBtn');
    const links=getPart(header,'.nexusHeaderLinks');
    const brand=getPart(header,'.brand');

    if(menu&&menu.parentNode!==toolbar)toolbar.appendChild(menu);
    if(links&&links.parentNode!==toolbar)toolbar.appendChild(links);
    if(actions&&actions.parentNode!==toolbar)toolbar.appendChild(actions);
    if(brand&&brand.parentNode!==brandRow)brandRow.appendChild(brand);

    header.classList.add('mhurMobileHeaderV57');
    header.classList.remove('mhurMobileHeaderV56','mhurHeaderCompactV51','mhurHeaderTightV51','mhurHeaderMinimalV51');
    placeInOrder(header,[toolbar,brandRow]);
    updateAppState();
    updateHeight(header);
  }

  function arrangeDesktop(header){
    const toolbar=q(header,':scope > .mhurMobileToolbarV57');
    const brandRow=q(header,':scope > .mhurMobileBrandRowV57');
    const menu=q(toolbar,'.menuBtn')||getPart(header,'.menuBtn');
    const links=q(toolbar,'.nexusHeaderLinks')||getPart(header,'.nexusHeaderLinks');
    const actions=q(toolbar,'.mhurTopActionsV31')||ensureActions(header);
    const brand=q(brandRow,'.brand')||getPart(header,'.brand');

    header.classList.remove('mhurMobileHeaderV57');
    ROOT.style.removeProperty('--mhur-top-height');
    placeInOrder(header,[menu,brand,links,actions]);
    toolbar?.remove();
    brandRow?.remove();
    updateAppState();
  }

  function arrange(){
    if(busy)return;
    const header=getHeader();
    if(!header)return;
    busy=true;
    try{
      if(window.innerWidth<=MOBILE_MAX)arrangeMobile(header);
      else arrangeDesktop(header);
    }finally{busy=false}
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      arrange();
    });
  }

  function mount(){
    const header=getHeader();
    if(!header)return;
    headerObserver?.disconnect();
    headerObserver=new MutationObserver(schedule);
    headerObserver.observe(header,{childList:true,subtree:true});

    const app=document.getElementById('app');
    if(app){
      appObserver?.disconnect();
      appObserver=new MutationObserver(updateAppState);
      appObserver.observe(app,{childList:true,subtree:false});
    }

    if('ResizeObserver' in window){
      resizeObserver?.disconnect();
      resizeObserver=new ResizeObserver(()=>updateHeight(getHeader()));
      resizeObserver.observe(header);
    }
    arrange();
  }

  document.addEventListener('DOMContentLoaded',mount,{once:true});
  window.addEventListener('load',mount,{once:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  setTimeout(mount,80);
  setTimeout(schedule,350);
  setTimeout(schedule,1000);
  setTimeout(schedule,2200);
})();
