(()=>{
  'use strict';
  let frame=0;
  const classes=['mhurHeaderCompactV51','mhurHeaderTightV51','mhurHeaderMinimalV51'];
  const visible=element=>Boolean(element&&element.getClientRects().length&&getComputedStyle(element).display!=='none'&&getComputedStyle(element).visibility!=='hidden');
  function union(elements){
    const rects=elements.filter(visible).map(element=>element.getBoundingClientRect());
    if(!rects.length)return null;
    return {left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right)),top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom))};
  }
  function parts(header){
    const left=header.querySelector('.nexusHeaderLinks');
    const wrap=header.querySelector('.mhurTopActionsV31');
    const right=wrap||null;
    const rightFallback=[header.querySelector('#mhurAdminButton'),header.querySelector('#mhurAccountButton'),header.querySelector('.lang')];
    return {brand:header.querySelector('.brand'),left,leftRect:union([left]),rightRect:union(right?[right]:rightFallback)};
  }
  function collides(header){
    const {brand,leftRect,rightRect}=parts(header);
    const margin=10;
    const brandRect=visible(brand)?brand.getBoundingClientRect():null;
    if(leftRect&&rightRect&&leftRect.right+margin>rightRect.left)return true;
    if(brandRect&&leftRect&&leftRect.right+margin>brandRect.left)return true;
    if(brandRect&&rightRect&&brandRect.right+margin>rightRect.left)return true;
    if(leftRect&&(leftRect.left<0||leftRect.right>innerWidth))return true;
    if(rightRect&&(rightRect.left<0||rightRect.right>innerWidth))return true;
    return false;
  }
  function apply(){
    frame=0;
    const header=document.querySelector('header.top');
    if(!header)return;
    header.classList.remove(...classes);
    if(innerWidth<1360||collides(header))header.classList.add('mhurHeaderCompactV51');
    if(innerWidth<980||collides(header))header.classList.add('mhurHeaderTightV51');
    if(innerWidth<560||collides(header))header.classList.add('mhurHeaderMinimalV51');
  }
  function schedule(){if(frame)return;frame=requestAnimationFrame(apply)}
  function mount(){
    const header=document.querySelector('header.top');
    if(!header)return;
    new MutationObserver(schedule).observe(header,{childList:true,subtree:true,characterData:true});
    if('ResizeObserver'in window)new ResizeObserver(schedule).observe(header);
    schedule();setTimeout(schedule,100);setTimeout(schedule,600);
  }
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  addEventListener('load',schedule,{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
