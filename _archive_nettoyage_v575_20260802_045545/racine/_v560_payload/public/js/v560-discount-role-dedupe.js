/* MHUR FRANCE — V560 : suppression du deuxième rôle sous les réductions */
(() => {
  'use strict';

  const CARD_SELECTOR = '.discountGridV296.v559DiscountGrid > .v559DiscountCard';

  function direct(card, selector) {
    try { return card.querySelector(`:scope > ${selector}`); }
    catch (_error) { return [...card.children].find(node => node.matches(selector)) || null; }
  }

  function cleanCard(card) {
    const art = direct(card, '.v559DiscountArt, .s18DiscountArtV19');
    const name = direct(card, '.v559DiscountName');
    const role = direct(card, '.v559DiscountRole');
    const points = direct(card, '.v559DiscountPointsRow');

    if (!art || !name || !role || !points) return;

    const keep = new Set([art, name, role, points]);
    let changed = false;

    [...card.children].forEach(child => {
      if (!keep.has(child)) {
        child.remove();
        changed = true;
      }
    });

    const expected = [art, name, role, points];
    expected.forEach(node => card.appendChild(node));

    if (changed || card.dataset.v560Clean !== '1') {
      card.dataset.v560Clean = '1';
    }
  }

  function cleanAll(root = document) {
    if (root instanceof Element && root.matches(CARD_SELECTOR)) cleanCard(root);
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    scope.querySelectorAll(CARD_SELECTOR).forEach(cleanCard);
  }

  let queued = false;
  function schedule(root = document) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      cleanAll(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => schedule(document), { once:true });
  } else {
    schedule(document);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const card = mutation.target instanceof Element
        ? mutation.target.closest('.v559DiscountCard')
        : null;
      if (card) {
        schedule(card.parentElement || document);
        return;
      }
      for (const node of mutation.addedNodes) {
        if (node instanceof Element && (node.matches(CARD_SELECTOR) || node.querySelector(CARD_SELECTOR))) {
          schedule(document);
          return;
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('mhur:languagechange', () => schedule(document));
  window.addEventListener('hashchange', () => schedule(document));
  window.addEventListener('load', () => schedule(document), { once:true });
  setInterval(() => cleanAll(document), 1200);

  window.MHUR_V560_DISCOUNT_DEDUPE = {
    refresh: () => cleanAll(document)
  };
})();
