(()=>{
  'use strict';

  const MOBILE_MAX=760;
  const root=document.documentElement;
  const media=matchMedia(`(max-width:${MOBILE_MAX}px)`);
  let queued=false;
  let directObserver=null;
  let resizeObserver=null;

  const header=()=>document.querySelector('header.top');
  const direct=(node,selector)=>node?.querySelector(`:scope > ${selector}`)||null;

  function place(parent,nodes){
    const wanted=nodes.filter(Boolean);
    const current=Array.from(parent.children).filter(child=>wanted.includes(child));
    if(current.length===wanted.length&&wanted.every((node,index)=>node.parentNode===parent&&current[index]===node))return false;
    wanted.forEach(node=>parent.appendChild(node));
    return true;
  }

  function ensureActions(h){
    let actions=h.querySelector('.mhurTopActionsV31');
    if(!actions){
      actions=document.createElement('div');
      actions.className='mhurTopActionsV31';
      actions.setAttribute('aria-label','Actions du compte');
    }
    const admin=document.getElementById('mhurAdminButton');
    const account=document.getElementById('mhurAccountButton');
    const lang=h.querySelector('.lang')||document.querySelector('header.top .lang');
    place(actions,[admin,account,lang]);
    return actions;
  }

  function ensureMobile(h){
    let brandRow=direct(h,'.mhurMobileBrandRowV57');
    if(!brandRow){brandRow=document.createElement('div');brandRow.className='mhurMobileBrandRowV57'}
    let toolbar=direct(h,'.mhurMobileToolbarV57');
    if(!toolbar){toolbar=document.createElement('div');toolbar.className='mhurMobileToolbarV57'}

    const brand=h.querySelector('.brand')||document.querySelector('header.top .brand');
    const menu=h.querySelector('.menuBtn')||document.querySelector('.menuBtn');
    const links=h.querySelector('.nexusHeaderLinks')||document.querySelector('.nexusHeaderLinks');
    const actions=ensureActions(h);

    place(brandRow,[brand]);
    place(toolbar,[menu,links,actions]);
    place(h,[brandRow,toolbar]);
    h.classList.add('mhurMobileHeaderV511','mhurHeaderReadyV511','mhurHeaderReadyV512','mhurHeaderReadyV513');
    h.classList.remove('mhurHeaderCompactV51','mhurHeaderTightV51','mhurHeaderMinimalV51');
  }

  function ensureDesktop(h){
    const brandRow=direct(h,'.mhurMobileBrandRowV57');
    const toolbar=direct(h,'.mhurMobileToolbarV57');
    const brand=brandRow?.querySelector('.brand')||h.querySelector('.brand');
    const menu=toolbar?.querySelector('.menuBtn')||h.querySelector('.menuBtn');
    const links=toolbar?.querySelector('.nexusHeaderLinks')||h.querySelector('.nexusHeaderLinks');
    const actions=toolbar?.querySelector('.mhurTopActionsV31')||h.querySelector('.mhurTopActionsV31')||ensureActions(h);
    place(h,[menu,brand,links,actions]);
    brandRow?.remove();
    toolbar?.remove();
    h.classList.remove('mhurMobileHeaderV511','mhurHeaderMinimalV51');
    h.classList.toggle('mhurHeaderCompactV51',innerWidth<1360);
    h.classList.toggle('mhurHeaderTightV51',innerWidth<980);
    h.classList.add('mhurHeaderReadyV511','mhurHeaderReadyV512','mhurHeaderReadyV513');
  }

  function measure(h=header()){
    if(!h)return;
    const rect=h.getBoundingClientRect();
    const height=Math.max(1,Math.ceil(rect.height));
    const bottom=Math.max(height,Math.ceil(rect.bottom));
    root.style.setProperty('--mhur-top-height',`${height}px`);
    root.style.setProperty('--mhur-header-bottom',`${bottom}px`);
    root.style.setProperty('--mhur-header-visual-bottom',`${bottom}px`);
  }

  function reconcile(){
    const h=header();
    if(!h)return;
    media.matches?ensureMobile(h):ensureDesktop(h);
    h.dataset.mhurHeaderVersion='513';
    measure(h);
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;reconcile()});
  }

  function observe(){
    const h=header();
    if(!h)return;
    directObserver?.disconnect();
    directObserver=new MutationObserver(schedule);
    /* Seulement les enfants directs : les changements de pseudo, avatar, langue ou rôle
       ne réorganisent plus le header et ne peuvent donc plus provoquer de saut. */
    directObserver.observe(h,{childList:true,subtree:false});
    if('ResizeObserver' in window){
      resizeObserver?.disconnect();
      resizeObserver=new ResizeObserver(()=>measure(h));
      resizeObserver.observe(h);
    }
  }

  function mount(){
    reconcile();
    observe();
  }

  mount();
  addEventListener('DOMContentLoaded',mount,{once:true});
  addEventListener('load',()=>{reconcile();measure()},{once:true});
  media.addEventListener?.('change',schedule);
  addEventListener('orientationchange',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
})();
