/* MHUR FRANCE — V566 : badges propres et ciblés */
(() => {
  'use strict';

  const BADGE_TEXT_RE = /^(new!?|incoming)$/i;
  const STYLE_NAME_RE = /\b(Original|Vers\.?\s*H[ée]ros|Combat|Dangereux|[ÉE]l[ée]gant|D'enfer|Super-vilain)\b/i;
  const PICK_COSTUME_RE = /Choisis un personnage pour ses costumes/i;
  const PICK_STYLE_RE = /Clique pour choisir le style/i;

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

  function allBlocks() {
    return [...document.querySelectorAll('div,article,section,li')];
  }

  function byText(re) {
    return allBlocks().filter(el => re.test(text(el)));
  }

  function pickSmallest(list, predicate) {
    const valid = list.filter(predicate);
    valid.sort((a, b) => area(a) - area(b));
    return valid[0] || null;
  }

  function removeLegacyBadges(card) {
    if (!card) return;
    card.querySelectorAll('.mhurV566Badge').forEach(n => n.remove());
    card.querySelectorAll('*').forEach(node => {
      const cls = String(node.className || '');
      const t = text(node);
      if (/mhurV563Badge|mhurV564Badge|mhurV565Badge|mhur-v563-animate|mhur-v564-live/.test(cls)) {
        node.remove();
        return;
      }
      if (!BADGE_TEXT_RE.test(t)) return;
      // seulement les petits tags, pas les grands conteneurs
      if (t.length <= 10) {
        node.classList.add('mhur-v566-inline-badge-trash');
        node.remove();
      }
    });
  }

  function applyBadge(card, type, hostClass) {
    if (!card) return;
    removeLegacyBadges(card);
    card.classList.add('mhur-v566-host');
    if (hostClass) card.classList.add(hostClass);
    const badge = document.createElement('div');
    badge.className = 'mhurV566Badge';
    badge.dataset.mhurType = type;
    badge.dataset.mhurLabel = type === 'incoming' ? 'INCOMING' : 'NEW!';
    card.appendChild(badge);
  }

  function stripOnlyBadges(card) {
    if (!card) return;
    removeLegacyBadges(card);
  }

  function releaseGentle() {
    return pickSmallest(byText(/Gentle\s*Criminal/i), el => /Nouveau personnage|Disponible depuis/i.test(text(el)) && hasImage(el) && text(el).length < 450);
  }
  function releaseTwice() {
    return pickSmallest(byText(/\bTwice\b/i), el => /Sad Man|Sortie le/i.test(text(el)) && hasImage(el) && text(el).length < 450);
  }
  function releaseTsuyu() {
    return pickSmallest(byText(/Tsuyu\s*Asui/i), el => /Nouveau style|Pr[ée]vu|Saison 18/i.test(text(el)) && hasImage(el) && text(el).length < 450);
  }

  function characterCard(nameRe) {
    return pickSmallest(byText(nameRe), el => PICK_STYLE_RE.test(text(el)) && hasImage(el) && text(el).length < 260);
  }

  function costumeCards() {
    return allBlocks().filter(el => {
      const tx = text(el);
      if (!tx || tx.length > 260) return false;
      if (!hasImage(el)) return false;
      if (!STYLE_NAME_RE.test(tx)) return false;
      if (/Pts\.|Technique|Attaque|Vitesse/i.test(tx)) return false;
      return true;
    });
  }

  function costumePickCards() {
    return allBlocks().filter(el => {
      const tx = text(el);
      if (!tx || tx.length > 340) return false;
      if (!hasImage(el)) return false;
      return PICK_COSTUME_RE.test(tx);
    });
  }

  function hadLegacyNew(card) {
    if (!card) return false;
    const t = text(card);
    if (/NEW!?/i.test(t)) return true;
    return !!card.querySelector('.mhurV563Badge, .mhurV564Badge, .mhurV565Badge, .mhur-v563-animate, .mhur-v564-live');
  }

  function onGentlePage() {
    return /Gentle\s*Criminal/i.test(text(document.body));
  }

  function markHomeReleaseCards() {
    const gentle = releaseGentle();
    if (gentle) applyBadge(gentle, 'new', 'mhur-v566-release-card');

    const twice = releaseTwice();
    if (twice) applyBadge(twice, 'incoming', 'mhur-v566-release-card');

    const tsuyu = releaseTsuyu();
    if (tsuyu) applyBadge(tsuyu, 'incoming', 'mhur-v566-release-card');
  }

  function markCharacterCards() {
    const gentle = characterCard(/Gentle\s*Criminal/i);
    if (gentle) applyBadge(gentle, 'new', 'mhur-v566-character-card');

    const twice = characterCard(/\bTwice\b/i);
    if (twice) stripOnlyBadges(twice);

    const tsuyu = characterCard(/Tsuyu\s*Asui/i);
    if (tsuyu) stripOnlyBadges(tsuyu);
  }

  function markCostumePickCards() {
    costumePickCards().forEach(card => {
      if (hadLegacyNew(card)) {
        applyBadge(card, 'new', 'mhur-v566-costume-pick-card');
      } else {
        stripOnlyBadges(card);
      }
    });
  }

  function markActualCostumeCards() {
    const gentlePage = onGentlePage();
    costumeCards().forEach(card => {
      if (gentlePage || hadLegacyNew(card)) {
        applyBadge(card, 'new', 'mhur-v566-costume-card');
      } else {
        stripOnlyBadges(card);
      }
    });
  }

  function cleanupOutsideTargets() {
    // Nettoie les petits NEW/INCOMING restants dans les conteneurs ciblés.
    document.querySelectorAll('.mhur-v566-release-card, .mhur-v566-character-card, .mhur-v566-costume-card, .mhur-v566-costume-pick-card').forEach(card => {
      [...card.querySelectorAll('span,small,b,strong,p,div')].forEach(node => {
        if (node.classList.contains('mhurV566Badge')) return;
        const t = text(node);
        if (BADGE_TEXT_RE.test(t) && t.length <= 10) {
          node.remove();
        }
      });
    });
  }

  function run() {
    markHomeReleaseCards();
    markCharacterCards();
    markCostumePickCards();
    markActualCostumeCards();
    cleanupOutsideTargets();
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
  setInterval(run, 1400);

  window.MHUR_V566_BADGES = { refresh: run };
})();
