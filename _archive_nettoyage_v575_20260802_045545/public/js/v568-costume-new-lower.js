/* MHUR FRANCE — V568 : descend NEW sous les étoiles sur les cartes de costumes */
(() => {
  'use strict';

  const STYLE_RE = /\b(Original|Vers\.?\s*H[ée]ros|Combat|Dangereux|[ÉE]l[ée]gant|D'enfer|Super-vilain)\b/i;
  const NEW_RE = /^NEW!?$/i;

  function text(el) {
    return (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hasImage(el) {
    try { return !!el.querySelector('img'); }
    catch { return false; }
  }

  function looksLikeCostumeCard(el) {
    if (!el || el.nodeType !== 1) return false;
    const tx = text(el);
    if (!tx || tx.length > 220) return false;
    if (!hasImage(el)) return false;
    if (!STYLE_RE.test(tx)) return false;
    if (/Technique|Attaque|Vitesse|Pts\./i.test(tx)) return false;
    return true;
  }

  function markExistingInlineNew(card) {
    [...card.querySelectorAll('span,small,b,strong,div,p')].forEach(node => {
      if (!NEW_RE.test(text(node))) return;
      node.classList.add('mhur-v568-inline-new', 'mhur-v568-live-badge');
    });
  }

  function processCard(card) {
    if (!looksLikeCostumeCard(card)) return;
    card.classList.add('mhur-v568-costume-card');
    markExistingInlineNew(card);
  }

  function run(root = document) {
    const all = root.querySelectorAll ? root.querySelectorAll('div,article,section,li') : [];
    all.forEach(processCard);
  }

  let raf = 0;
  function schedule(root = document) {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      run(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => schedule(document), { once: true });
  } else {
    schedule(document);
  }

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        schedule(document);
        return;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('load', () => schedule(document), { once: true });
  window.addEventListener('hashchange', () => schedule(document));
  window.addEventListener('mhur:languagechange', () => schedule(document));
  setInterval(() => run(document), 1500);

  window.MHUR_V568_COSTUME_NEW = { refresh: () => run(document) };
})();
