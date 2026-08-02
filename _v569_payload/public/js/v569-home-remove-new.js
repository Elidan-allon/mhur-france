/* MHUR FRANCE — V569 : retire NEW sur Twice et Tsuyu à l'accueil */
(() => {
  'use strict';

  const NEW_RE = /^NEW!?$/i;

  function text(el) {
    return (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hasImage(el) {
    try { return !!el.querySelector('img'); }
    catch { return false; }
  }

  function area(el) {
    try {
      const r = el.getBoundingClientRect();
      return Math.max(0, r.width) * Math.max(0, r.height);
    } catch {
      return 0;
    }
  }

  function blocks() {
    return [...document.querySelectorAll('div,article,section,li')];
  }

  function pickSmallest(list, predicate) {
    const valid = list.filter(predicate);
    valid.sort((a, b) => area(a) - area(b));
    return valid[0] || null;
  }

  function findTwiceCard() {
    return pickSmallest(
      blocks().filter(el => /\bTwice\b/i.test(text(el))),
      el => /Sad Man|Sortie le/i.test(text(el)) && hasImage(el) && text(el).length < 450
    );
  }

  function findTsuyuCard() {
    return pickSmallest(
      blocks().filter(el => /Tsuyu\s*Asui/i.test(text(el))),
      el => /Nouveau style|Pr[ée]vu|Saison 18/i.test(text(el)) && hasImage(el) && text(el).length < 450
    );
  }

  function stripNew(card, className) {
    if (!card) return;
    card.classList.add(className);

    card.querySelectorAll('*').forEach(node => {
      const cls = String(node.className || '');
      const t = text(node);
      if (
        /mhurV563Badge|mhurV564Badge|mhurV565Badge|mhurV566Badge|s18NewBadge|s18SeasonNewV10|mhur-v567-new|mhur-v568-live-badge|mhur-v568-inline-new|mhur-v563-animate|mhur-v564-live/.test(cls)
      ) {
        node.remove();
        return;
      }
      if (NEW_RE.test(t) && t.length <= 10) {
        node.classList.add('mhur-v569-hide-new');
        node.remove();
      }
    });
  }

  function run() {
    stripNew(findTwiceCard(), 'mhur-v569-home-twice');
    stripNew(findTsuyuCard(), 'mhur-v569-home-tsuyu');
  }

  let raf = 0;
  function schedule() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      run();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes && mutation.addedNodes.length) {
        schedule();
        return;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('mhur:languagechange', schedule);
  setInterval(run, 1500);

  window.MHUR_V569_HOME_REMOVE_NEW = { refresh: run };
})();
