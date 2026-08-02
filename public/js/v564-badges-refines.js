/* MHUR FRANCE — V564 : recentrage des badges NEW / INCOMING */
(() => {
  'use strict';

  const EXACT_BADGE_RE = /^(new!?|incoming)$/i;
  const STYLE_RE = /(Original|Vers\.?\s*H[ée]ros|Combat|Dangereux|[ÉE]l[ée]gant|D'enfer|Super-vilain)/i;
  const COSTUME_SELECTION_RE = /Choisis un personnage pour ses costumes/i;

  function text(el) {
    return (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hasImage(el) {
    try { return !!el.querySelector('img'); } catch { return false; }
  }

  function byTextMatch(re) {
    return [...document.querySelectorAll('div,article,section,li')].filter(el => re.test(text(el)));
  }

  function isBadgeLike(el) {
    if (!el || el.nodeType !== 1) return false;
    const t = text(el);
    return EXACT_BADGE_RE.test(t) || el.classList.contains('mhurV563Badge') || el.classList.contains('mhurV564Badge') || el.classList.contains('mhur-v564-live') || el.classList.contains('mhur-v563-animate');
  }

  function cardFrom(el, predicate) {
    let cur = el;
    for (let i = 0; cur && i < 8; i++, cur = cur.parentElement) {
      if (predicate(cur)) return cur;
    }
    return null;
  }

  function ensureHost(card) {
    if (!card) return;
    card.classList.add('mhur-v564-badge-host');
  }

  function clearGenerated(card) {
    if (!card) return;
    card.querySelectorAll('.mhurV564Badge').forEach(n => n.remove());
  }

  function hideWrongOldBadges(scope = document) {
    scope.querySelectorAll('.mhurV563Badge').forEach(el => {
      const parent = el.parentElement;
      if (!parent) return;
      // On masque les badges V563 pour laisser V564 reprendre la main.
      el.classList.add('mhur-v564-hide-old');
    });
  }

  function removeInlineBadgeNodes(card) {
    if (!card) return;
    card.querySelectorAll('div,span,strong,b,small,p').forEach(el => {
      if (el.classList.contains('mhurV564Badge')) return;
      if (EXACT_BADGE_RE.test(text(el))) {
        el.remove();
      }
    });
  }

  function makeBadge(type) {
    const badge = document.createElement('div');
    badge.className = 'mhurV564Badge';
    badge.dataset.mhurType = type;
    badge.dataset.mhurLabel = type === 'incoming' ? 'INCOMING' : 'NEW!';
    badge.setAttribute('aria-hidden', 'true');
    return badge;
  }

  function ensureBadge(card, type) {
    if (!card) return;
    ensureHost(card);
    clearGenerated(card);
    removeInlineBadgeNodes(card);
    const existing = card.querySelector('.mhur-v564-live');
    if (existing) {
      existing.dataset.mhurType = type;
      existing.dataset.mhurLabel = type === 'incoming' ? 'INCOMING' : 'NEW!';
      return;
    }
    const badge = makeBadge(type);
    card.appendChild(badge);
  }

  function retagExistingBadges(card, type) {
    if (!card) return false;
    let found = false;
    card.querySelectorAll('div,span,strong,b,small,p').forEach(el => {
      if (EXACT_BADGE_RE.test(text(el))) {
        found = true;
        el.classList.add('mhur-v564-live');
        el.dataset.mhurType = type;
        el.dataset.mhurLabel = type === 'incoming' ? 'INCOMING' : 'NEW!';
        el.textContent = '';
      }
    });
    return found;
  }

  function smallestReasonable(matches, validator) {
    const valid = matches.filter(validator);
    valid.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height);
    return valid[0] || null;
  }

  function findReleaseCard(re) {
    const matches = byTextMatch(re);
    return smallestReasonable(matches, el => {
      const tx = text(el);
      return tx.length < 500 && tx.length > 20 && hasImage(el);
    });
  }

  function findCharacterCard() {
    const matches = byTextMatch(/Gentle\s*Criminal/i);
    return smallestReasonable(matches, el => {
      const tx = text(el);
      return /Clique pour choisir le style/i.test(tx) && tx.length < 260 && hasImage(el);
    });
  }

  function isSkinCard(el) {
    const tx = text(el);
    if (!tx || tx.length > 260) return false;
    if (COSTUME_SELECTION_RE.test(tx)) return false;
    if (!STYLE_RE.test(tx)) return false;
    if (!hasImage(el)) return false;
    return true;
  }

  function markReleaseCards() {
    const gentle = findReleaseCard(/Gentle\s*Criminal/i);
    if (gentle) {
      gentle.classList.add('mhur-v564-release-card');
      if (!retagExistingBadges(gentle, 'new')) ensureBadge(gentle, 'new');
    }

    const twice = findReleaseCard(/Twice/i);
    if (twice) {
      twice.classList.add('mhur-v564-release-card');
      if (!retagExistingBadges(twice, 'incoming')) ensureBadge(twice, 'incoming');
      // remplace tout NEW résiduel par INCOMING
      clearGenerated(twice);
      removeInlineBadgeNodes(twice);
      ensureBadge(twice, 'incoming');
    }

    const tsuyu = findReleaseCard(/Tsuyu\s*Asui/i);
    if (tsuyu) {
      tsuyu.classList.add('mhur-v564-release-card');
      clearGenerated(tsuyu);
      removeInlineBadgeNodes(tsuyu);
      ensureBadge(tsuyu, 'incoming');
    }
  }

  function markGentleCharacterCard() {
    const gentleChar = findCharacterCard();
    if (!gentleChar) return;
    gentleChar.classList.add('mhur-v564-character-card');
    clearGenerated(gentleChar);
    removeInlineBadgeNodes(gentleChar);
    ensureBadge(gentleChar, 'new');
  }

  function removeBadgesFromSelectionCards() {
    [...document.querySelectorAll('div,article,section,li')].forEach(el => {
      const tx = text(el);
      if (!COSTUME_SELECTION_RE.test(tx)) return;
      el.querySelectorAll('.mhurV564Badge, .mhurV563Badge, .mhur-v564-live, .mhur-v563-animate').forEach(b => {
        if (b.classList.contains('mhurV563Badge')) {
          b.classList.add('mhur-v564-hide-old');
        } else {
          b.remove();
        }
      });
      el.querySelectorAll('div,span,strong,b,small,p').forEach(n => {
        if (EXACT_BADGE_RE.test(text(n))) n.remove();
      });
    });
  }

  function markSkinCards() {
    const bodyText = text(document.body);
    const onGentlePage = /Gentle\s*Criminal/i.test(bodyText);
    [...document.querySelectorAll('div,article,section,li')].forEach(el => {
      if (!isSkinCard(el)) return;
      el.classList.add('mhur-v564-skin-card');

      const tx = text(el);
      const hasOldNew = [...el.querySelectorAll('div,span,strong,b,small,p')].some(n => /^new!?$/i.test(text(n)));
      if (hasOldNew || onGentlePage) {
        clearGenerated(el);
        removeInlineBadgeNodes(el);
        ensureBadge(el, 'new');
      }
    });
  }

  function cleanupGlobalStrays() {
    // Si un badge V564 est attaché directement à un conteneur énorme, on le retire.
    document.querySelectorAll('.mhurV564Badge').forEach(badge => {
      const parent = badge.parentElement;
      if (!parent) return;
      const tx = text(parent);
      const imgs = parent.querySelectorAll('img').length;
      if (tx.length > 700 || imgs > 8) badge.remove();
    });
  }

  function run() {
    hideWrongOldBadges(document);
    removeBadgesFromSelectionCards();
    markReleaseCards();
    markGentleCharacterCard();
    markSkinCards();
    cleanupGlobalStrays();
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
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        schedule();
        return;
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('mhur:languagechange', schedule);
  setInterval(run, 1500);

  window.MHUR_V564_BADGES = { refresh: run };
})();
