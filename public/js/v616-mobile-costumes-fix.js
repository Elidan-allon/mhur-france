(function(){
  'use strict';
  if(window.MHUR_V616_LOADED)return;
  window.MHUR_V616_LOADED=true;

  const MOBILE_QUERY='(max-width: 760px)';

  function isMobile(){
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function rect(el){
    try{return el.getBoundingClientRect();}
    catch(e){return {top:0,left:0,width:0,height:0,bottom:0,right:0};}
  }

  function txt(el){
    return String(el?.textContent||'').trim().toLowerCase();
  }

  function looksLikeDate(text){
    return /(20\d{2})/.test(text) || /(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(text);
  }

  function likelyCard(el){
    if(!(el instanceof HTMLElement))return false;
    const t=txt(el);
    const c=String(el.className||'').toLowerCase();
    if(!(c.includes('costume')||c.includes('skin')||t.includes('pur')||t.includes('dangerous')||t.includes('dangereux')||t.includes('elegant')||t.includes('élégant')||t.includes('original')||t.includes('super-vilain')||t.includes('casual')||t.includes('loisirs')||t.includes('summer'))) return false;
    const r=rect(el);
    return r.width>=180 && r.height>=260 && el.querySelectorAll('img').length>0;
  }

  function getCards(){
    const nodes=Array.from(document.querySelectorAll('div,article,section'));
    return nodes.filter(el=>{
      if(!likelyCard(el)) return false;
      return !nodes.some(other=>other!==el && el.contains(other) && likelyCard(other));
    });
  }

  function area(img){
    const r=rect(img);
    return Math.max(r.width, img.naturalWidth||0)*Math.max(r.height, img.naturalHeight||0);
  }

  function ratio(img){
    const w=img.naturalWidth||rect(img).width||1;
    const h=img.naturalHeight||rect(img).height||1;
    return w/Math.max(1,h);
  }

  function findMainImage(card){
    const cr=rect(card);
    const imgs=Array.from(card.querySelectorAll('img')).filter(img=>{
      const r=rect(img);
      if(r.width<60||r.height<60) return false;
      const centerY=(r.top + r.height/2) - cr.top;
      if(centerY > cr.height*0.78) return false;
      const s=(img.getAttribute('src')||'').toLowerCase();
      if(s.includes('new')||s.includes('badge')||s.includes('star')) return false;
      return true;
    });
    imgs.sort((a,b)=>area(b)-area(a));
    return imgs[0]||null;
  }

  function classify(img){
    const ra=ratio(img);
    if(ra<=0.80)return 'portrait';
    if(ra<=1.12)return 'square';
    return 'wide';
  }

  function getTopCandidates(card){
    const cr=rect(card);
    return Array.from(card.querySelectorAll('img,span,div')).filter(el=>{
      if(el===card)return false;
      const r=rect(el);
      if(r.width<30||r.height<18) return false;
      const top=r.top-cr.top;
      if(top>120) return false;
      return true;
    });
  }

  function markRarityAndDate(card){
    const candidates=getTopCandidates(card);
    let rarity=null;
    let date=null;
    candidates.forEach(el=>{
      const t=txt(el);
      if(!rarity && /^(pur|sr|r|ur|n|c)$/i.test(t.replace(/\s+/g,''))) rarity=el;
      if(!date && looksLikeDate(t)) date=el;
    });
    if(rarity) rarity.dataset.v616Rarity='1';
    if(date){
      date.dataset.v616Date='1';
      card.dataset.v616HasDate='1';
    } else {
      delete card.dataset.v616HasDate;
    }
    return {rarity,date};
  }

  function markExtraBadge(card, rarity, date){
    const candidates=getTopCandidates(card);
    let best=null;
    candidates.forEach(el=>{
      if(el===rarity||el===date)return;
      const t=txt(el);
      const s=(el.getAttribute?.('src')||'').toLowerCase();
      if(t.length===0 && !s) return;
      if(/^(pur|sr|r|ur|n|c)$/i.test(t.replace(/\s+/g,''))) return;
      if(looksLikeDate(t)) return;
      if(!(t.includes('coming')||t.includes('upcoming')||t.includes('à venir')||t.includes('a venir')||t.includes('incoming')||t.includes('new')||s.includes('coming')||s.includes('upcoming')||s.includes('new'))) return;
      if(!best) best=el;
    });
    if(best) best.dataset.v616BadgeExtra='1';
  }

  function markNameZone(card){
    const candidates=Array.from(card.querySelectorAll('h1,h2,h3,h4,h5,strong,span,div')).filter(el=>{
      const t=txt(el);
      return t.length>0 && (t.includes('dangerous')||t.includes('dangereux')||t.includes('elegant')||t.includes('élégant')||t.includes('original')||t.includes('super-vilain')||t.includes('super-villain')||t.includes('loisirs')||t.includes('casual'));
    });
    const best=candidates.sort((a,b)=>rect(b).width-rect(a).width)[0];
    if(best) best.dataset.v616NameZone='1';
  }

  function clearMarks(card){
    delete card.dataset.v616Card;
    delete card.dataset.v616Shape;
    delete card.dataset.v616HasDate;
    card.querySelectorAll('[data-v616-main],[data-v616-rarity],[data-v616-date],[data-v616-badge-extra],[data-v616-name-zone]').forEach(el=>{
      delete el.dataset.v616Main;
      delete el.dataset.v616Rarity;
      delete el.dataset.v616Date;
      delete el.dataset.v616BadgeExtra;
      delete el.dataset.v616NameZone;
    });
  }

  function applyCard(card){
    clearMarks(card);
    const main=findMainImage(card);
    if(!main)return;
    card.dataset.v616Card='1';
    card.dataset.v616Shape=classify(main);
    main.dataset.v616Main='1';
    const top=markRarityAndDate(card);
    markExtraBadge(card, top.rarity, top.date);
    markNameZone(card);
  }

  function refresh(){
    if(!isMobile()) return;
    getCards().forEach(applyCard);
  }

  let raf=0;
  function schedule(){
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      raf=0;
      refresh();
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  }else{
    schedule();
  }

  window.addEventListener('load', schedule);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('click', schedule, true);
  document.addEventListener('pointerdown', schedule, true);

  new MutationObserver(schedule).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true
  });

  window.MHUR_V616={refresh};
})();
