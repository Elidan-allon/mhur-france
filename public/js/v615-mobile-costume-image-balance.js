/* MHUR Nexus — V615
   Uniformise les photos de costumes sur mobile, avec ou sans NEW.
*/
(function(){
  'use strict';

  if (window.MHUR_V615_COSTUME_BALANCE_LOADED) return;
  window.MHUR_V615_COSTUME_BALANCE_LOADED = true;

  function isMobile(){
    return window.matchMedia('(max-width: 760px)').matches;
  }

  function rect(el){
    try{
      return el.getBoundingClientRect();
    }catch(_error){
      return {width:0,height:0,top:0,left:0,right:0,bottom:0};
    }
  }

  function imgArea(img){
    const r = rect(img);
    const width = Math.max(0, r.width || img.naturalWidth || 0);
    const height = Math.max(0, r.height || img.naturalHeight || 0);
    return width * height;
  }

  function getRatio(img){
    const w = img.naturalWidth || rect(img).width || 1;
    const h = img.naturalHeight || rect(img).height || 1;
    return w / Math.max(1, h);
  }

  function likelyCostumeCard(el){
    if (!el || !(el instanceof HTMLElement)) return false;

    const labelText = (el.textContent || '').toLowerCase();
    const classText = ((el.className && String(el.className)) || '').toLowerCase();

    const hasCostumeHint = (
      classText.includes('costume') ||
      classText.includes('skin') ||
      labelText.includes('pur') ||
      labelText.includes('dangereux') ||
      labelText.includes('élégant') ||
      labelText.includes('elegant') ||
      labelText.includes('loisirs') ||
      labelText.includes('héro') ||
      labelText.includes('hero')
    );

    if (!hasCostumeHint) return false;

    const r = rect(el);
    if (r.width < 180 || r.height < 240) return false;

    const imgs = Array.from(el.querySelectorAll('img'));
    if (!imgs.length) return false;

    return true;
  }

  function candidateCards(){
    const raw = Array.from(document.querySelectorAll(
      '[class*="costume"], [class*="Costume"], [class*="skin"], [class*="Skin"], article, section, div'
    ));

    return raw.filter((el, index, arr) => {
      if (!likelyCostumeCard(el)) return false;

      // Eviter les gros conteneurs parents si une carte plus precise existe a l'interieur.
      return !arr.some(other => other !== el && el.contains(other) && likelyCostumeCard(other));
    });
  }

  function findMainImage(card){
    const cardRect = rect(card);
    const imgs = Array.from(card.querySelectorAll('img')).filter(img => {
      const r = rect(img);
      if (r.width < 50 || r.height < 50) return false;

      const centerY = r.top + (r.height / 2);
      const relativeY = centerY - cardRect.top;

      // Ignorer les petits badges et les icones du bas.
      if (relativeY > cardRect.height * 0.78) return false;
      if (r.width <= 110 && r.height <= 110) return false;

      return true;
    });

    if (!imgs.length) return null;

    imgs.sort((a, b) => imgArea(b) - imgArea(a));
    return imgs[0] || null;
  }

  function classifyShape(img){
    const ratio = getRatio(img);

    if (ratio <= 0.78) return 'portrait';
    if (ratio <= 1.12) return 'square';
    return 'wide';
  }

  function clearPrevious(card){
    delete card.dataset.v615CostumeCard;
    delete card.dataset.v615Shape;

    Array.from(card.querySelectorAll('[data-v615-main-img="1"]')).forEach(img => {
      delete img.dataset.v615MainImg;
    });
  }

  function applyCard(card){
    clearPrevious(card);

    const mainImage = findMainImage(card);
    if (!mainImage) return;

    card.dataset.v615CostumeCard = '1';
    card.dataset.v615Shape = classifyShape(mainImage);
    mainImage.dataset.v615MainImg = '1';
  }

  function refresh(){
    if (!isMobile()) return;
    candidateCards().forEach(applyCard);
  }

  let raf = 0;
  function schedule(){
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      refresh();
    });
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  } else {
    schedule();
  }

  window.addEventListener('load', schedule, {once:true});
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  document.addEventListener('click', schedule, true);
  document.addEventListener('pointerdown', schedule, true);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true
  });

  window.MHUR_V615_COSTUME_BALANCE = {
    refresh
  };
})();
