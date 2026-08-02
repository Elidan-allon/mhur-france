/* MHUR FRANCE — V563 : badges NEW / INCOMING */
(() => {
  'use strict';

  const BADGE_TEXT_RE = /^(new!?|incoming)$/i;
  const GENTLE_RE = /gentle\s*criminal/i;
  const UPCOMING_RE = /(pas\s+encore\s+sorti|pas\s+sortie|coming\s*soon|upcoming|bient[oô]t|arrive\s+bient[oô]t|sortie\s+le|release\s+on|disponible\s+le)/i;
  const CARD_CLASS_RE = /(card|tile|item|box|costume|skin|character|hero|costum|tenue|portrait|slot)/i;
  const STAR_RE = /(★|star|stars|rarity|rarete|rarete|étoile|etoile)/i;

  function text(el) {
    return (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isElement(node) {
    return node && node.nodeType === 1;
  }

  function cardFor(el) {
    let cur = el;
    while (isElement(cur) && cur !== document.body) {
      const cls = (cur.className && String(cur.className)) || '';
      if (CARD_CLASS_RE.test(cls)) return cur;
      cur = cur.parentElement;
    }
    return el && el.parentElement ? el.parentElement : null;
  }

  function ensureHost(card) {
    if (!card) return;
    card.classList.add('mhur-v563-badge-host');
  }

  function classifyExistingBadge(el) {
    const t = text(el).toUpperCase();
    if (t.startsWith('NEW')) return 'new';
    if (t.startsWith('INCOMING')) return 'incoming';
    return '';
  }

  function markExistingBadges(root = document) {
    const nodes = root.querySelectorAll ? root.querySelectorAll('div,span,strong,b,p,small') : [];
    nodes.forEach(el => {
      const t = text(el);
      if (!BADGE_TEXT_RE.test(t)) return;
      const type = classifyExistingBadge(el);
      if (!type) return;
      const card = cardFor(el);
      if (card) ensureHost(card);
      el.classList.add('mhur-v563-animate');
      el.dataset.mhurBadgeType = type;
      if (type === 'new' && card && isCostumeCard(card)) {
        card.classList.add('mhur-v563-costume-card');
      }
    });
  }

  function isCostumeCard(card) {
    if (!card) return false;
    const cls = String(card.className || '');
    if (/(costume|skin|tenue)/i.test(cls)) return true;
    const content = text(card);
    const hasStars = [...card.querySelectorAll('*')].some(el => STAR_RE.test(text(el)) || STAR_RE.test(String(el.className || '')));
    return hasStars && /(original|combat|elegant|dangereux|super-vilain|d'enfer|costume|tenue|style)/i.test(content);
  }

  function hasBadge(card, type) {
    if (!card) return false;
    return !!card.querySelector(`.mhurV563Badge--${type}, .mhur-v563-animate[data-mhur-badge-type="${type}"]`);
  }

  function makeBadge(type) {
    const badge = document.createElement('div');
    badge.className = `mhurV563Badge mhurV563Badge--${type}`;
    badge.dataset.mhurBadgeType = type;
    badge.setAttribute('aria-hidden', 'true');
    return badge;
  }

  function appendBadge(card, type) {
    if (!card || hasBadge(card, type)) return;
    ensureHost(card);
    const badge = makeBadge(type);
    card.appendChild(badge);
    if (type === 'new' && isCostumeCard(card)) {
      card.classList.add('mhur-v563-costume-card');
    }
  }

  function decorateCostumeCards(root = document) {
    const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
    all.forEach(el => {
      if (!isElement(el)) return;
      const card = cardFor(el);
      if (!card) return;
      if (isCostumeCard(card) && hasBadge(card, 'new')) {
        card.classList.add('mhur-v563-costume-card');
      }
    });
  }

  function addGentleNew(root = document) {
    const elements = root.querySelectorAll ? root.querySelectorAll('div,article,section,li') : [];
    elements.forEach(el => {
      if (!GENTLE_RE.test(text(el))) return;
      const card = cardFor(el);
      if (!card) return;
      card.classList.add('mhur-v563-gentle-card');
      appendBadge(card, 'new');
    });
  }

  function addIncoming(root = document) {
    const cards = root.querySelectorAll ? root.querySelectorAll('div,article,section,li') : [];
    cards.forEach(el => {
      const card = cardFor(el);
      if (!card || card !== el) return;
      const content = text(card);
      if (!UPCOMING_RE.test(content)) return;
      if (GENTLE_RE.test(content)) return; // Gentle garde NEW
      appendBadge(card, 'incoming');
    });
  }

  function run(root = document) {
    markExistingBadges(root);
    addGentleNew(root);
    addIncoming(root);
    decorateCostumeCards(root);
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

  new MutationObserver(mutations => {
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
  setInterval(() => run(document), 1400);

  window.MHUR_V563_BADGES = { refresh: () => run(document) };
})();
