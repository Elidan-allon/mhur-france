/* MHUR FRANCE — V565 : système propre de badges */
(() => {
  'use strict';

  const BADGE_TEXT = /^(new!?|incoming)$/i;
  const HOME_TITLE_RE = /(Gentle\s*Criminal|Twice|Tsuyu\s*Asui)/i;
  const STYLE_RE = /(Original|Vers\.?\s*H[ée]ros|Combat|Dangereux|[ÉE]l[ée]gant|D'enfer|Super-vilain)/i;
  const CHOOSE_RE = /(Clique pour choisir le style|Click to choose style)/i;
  const COSTUME_SELECT_RE = /(Choisis un personnage pour ses costumes|Choose a character for their costumes)/i;

  function txt(el) {
    return (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function hasImg(el) {
    try { return !!el.querySelector('img'); } catch { return false; }
  }

  function area(el) {
    const r = el.getBoundingClientRect();
    return Math.max(1, r.width * r.height);
  }

  function smallest(elements, test) {
    return elements.filter(test).sort((a,b) => area(a) - area(b))[0] || null;
  }

  function candidates(re) {
    return [...document.querySelectorAll('div,article,section,li')].filter(el => re.test(txt(el)));
  }

  function cleanLegacyBadges(scope = document) {
    scope.querySelectorAll('.mhurV563Badge,.mhurV564Badge,.mhur-v563-animate,.mhur-v564-live').forEach(el => el.remove());

    scope.querySelectorAll('div,span,strong,b,small,p').forEach(el => {
      if (el.classList.contains('mhurV565Badge')) return;
      if (BADGE_TEXT.test(txt(el))) el.remove();
    });
  }

  function removeV565(scope = document) {
    scope.querySelectorAll('.mhurV565Badge').forEach(el => el.remove());
    scope.querySelectorAll('.mhur-v565-host,.mhur-v565-home-card,.mhur-v565-character-card,.mhur-v565-costume-card,.mhur-v565-tuning-card').forEach(el => {
      el.classList.remove('mhur-v565-host','mhur-v565-home-card','mhur-v565-character-card','mhur-v565-costume-card','mhur-v565-tuning-card');
    });
  }

  function addBadge(card, type, kind) {
    if (!card) return;
    card.classList.add('mhur-v565-host', `mhur-v565-${kind}-card`);
    card.querySelectorAll(':scope > .mhurV565Badge').forEach(el => el.remove());
    const badge = document.createElement('div');
    badge.className = 'mhurV565Badge';
    badge.dataset.type = type;
    badge.setAttribute('aria-hidden','true');
    card.appendChild(badge);
  }

  function findHomeCard(nameRe) {
    return smallest(candidates(nameRe), el => {
      const t = txt(el);
      return t.length > 25 && t.length < 500 && hasImg(el) && /(Sortie|Disponible|Nouveau personnage|Nouveau style|Sad Man|Technique|Soutien)/i.test(t);
    });
  }

  function placeHomeBadges() {
    const gentle = findHomeCard(/Gentle\s*Criminal/i);
    const twice = findHomeCard(/Twice/i);
    const tsuyu = findHomeCard(/Tsuyu\s*Asui/i);

    if (gentle) addBadge(gentle, 'new', 'home');
    if (twice) addBadge(twice, 'incoming', 'home');
    if (tsuyu) addBadge(tsuyu, 'incoming', 'home');
  }

  function findCharacterCard(nameRe) {
    return smallest(candidates(nameRe), el => {
      const t = txt(el);
      return t.length > 20 && t.length < 280 && hasImg(el) && CHOOSE_RE.test(t);
    });
  }

  function placeCharacterBadges() {
    const gentle = findCharacterCard(/Gentle\s*Criminal/i);
    const tsuyu = findCharacterCard(/Tsuyu\s*Asui/i);

    if (gentle) addBadge(gentle, 'new', 'character');

    // Aucun INCOMING sur la carte personnage de Tsuyu.
    if (tsuyu) {
      tsuyu.querySelectorAll('.mhurV565Badge').forEach(el => el.remove());
      tsuyu.classList.remove('mhur-v565-host','mhur-v565-character-card');
    }
  }

  function isCostumeCard(el) {
    const t = txt(el);
    if (!t || t.length > 260 || !hasImg(el)) return false;
    if (COSTUME_SELECT_RE.test(t)) return false;
    return STYLE_RE.test(t);
  }

  function placeCostumeBadges() {
    const body = txt(document.body);
    const gentlePage = /Gentle\s*Criminal/i.test(body);
    const pageLooksLikeCostumes = /(Costumes|Tenue de tous les jours|Tuning)/i.test(body);

    if (!pageLooksLikeCostumes) return;

    [...document.querySelectorAll('div,article,section,li')].forEach(el => {
      if (!isCostumeCard(el)) return;

      // Sur la page Gentle Criminal, tous ses skins visibles sont nouveaux.
      // Sur les autres pages, conserve uniquement les cartes déjà marquées NEW dans les données/DOM.
      const hadNew = /new!?/i.test(txt(el)) || /new/i.test(String(el.className || '')) || el.hasAttribute('data-new');
      if (gentlePage || hadNew) addBadge(el, 'new', 'costume');
    });
  }

  function removeBadgesFromSelectionCards() {
    [...document.querySelectorAll('div,article,section,li')].forEach(el => {
      if (!COSTUME_SELECT_RE.test(txt(el))) return;
      el.querySelectorAll('.mhurV565Badge').forEach(b => b.remove());
      el.classList.remove('mhur-v565-host','mhur-v565-costume-card','mhur-v565-tuning-card');
    });
  }

  function run() {
    cleanLegacyBadges(document);
    removeV565(document);
    placeHomeBadges();
    placeCharacterBadges();
    placeCostumeBadges();
    removeBadgesFromSelectionCards();
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
    document.addEventListener('DOMContentLoaded', schedule, {once:true});
  } else {
    schedule();
  }

  new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        schedule();
        return;
      }
    }
  }).observe(document.documentElement, {childList:true, subtree:true});

  window.addEventListener('load', schedule, {once:true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('mhur:languagechange', schedule);
  setInterval(run, 1600);

  window.MHUR_V565_BADGES = {refresh: run};
})();
