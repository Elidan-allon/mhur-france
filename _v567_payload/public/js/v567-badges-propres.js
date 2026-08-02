/* MHUR FRANCE — V567
   Nettoyage des anciens badges et utilisation des vraies classes du site.
*/
(() => {
  'use strict';

  const OLD_SELECTOR = [
    '.mhurV563Badge',
    '.mhurV564Badge',
    '.mhurV565Badge',
    '.mhurV566Badge',
    '.mhur-v563-animate',
    '.mhur-v564-live'
  ].join(',');

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function directChildren(node, selector) {
    if (!node) return [];
    return [...node.children].filter(child => child.matches(selector));
  }

  function selectedCharacterId() {
    try {
      if (typeof selectedChar !== 'undefined' && selectedChar != null) {
        return String(selectedChar);
      }
    } catch (_error) {}
    return '';
  }

  function characterNameForId(id) {
    try {
      if (typeof characters !== 'undefined' && Array.isArray(characters)) {
        const found = characters.find(character => String(character?.id || '') === String(id || ''));
        return String(found?.name || '');
      }
    } catch (_error) {}
    return '';
  }

  function isGentleId(id) {
    const key = normalize(id);
    if (key.includes('gentle_criminal') || key === 'gentle') return true;
    return normalize(characterNameForId(id)).includes('gentle_criminal');
  }

  function currentPageLooksGentle() {
    const id = selectedCharacterId();
    if (isGentleId(id)) return true;
    const title = document.querySelector('#app .title, #app h1, #app .charPanel h2');
    return normalize(title?.textContent).includes('gentle_criminal');
  }

  function removeOldGeneratedBadges(root = document) {
    if (root.matches?.(OLD_SELECTOR)) root.remove();
    root.querySelectorAll?.(OLD_SELECTOR).forEach(node => node.remove());
  }

  function removeNativeDirectBadges(card) {
    directChildren(card, '.s18NewBadge').forEach(badge => badge.remove());
  }

  function ensureNativeNew(card) {
    if (!card) return null;
    removeNativeDirectBadges(card);
    const badge = document.createElement('span');
    badge.className = 's18NewBadge s18NewBadgeV9 s18NewBadgeV24 s18NewBadgeV567';
    badge.setAttribute('aria-label', 'NEW');
    badge.textContent = 'NEW!';
    card.insertBefore(badge, card.firstChild);
    return badge;
  }

  function releaseTitle(card) {
    return normalize(card.querySelector('.releaseNamesV299 b')?.textContent || card.textContent || '');
  }

  function cleanReleaseCard(card) {
    removeOldGeneratedBadges(card);
    directChildren(card, '.s18NewBadge').forEach(node => node.remove());
    const badge = card.querySelector(':scope > .s18SeasonNewV10');
    if (!badge) return;

    badge.classList.remove('v567-home-new', 'v567-home-incoming');
    badge.removeAttribute('style');
    badge.textContent = '';

    const title = releaseTitle(card);
    if (title.includes('gentle_criminal')) {
      badge.classList.add('v567-home-new');
      badge.setAttribute('aria-label', 'NEW');
      return;
    }

    if (title === 'twice' || title.includes('tsuyu_asui')) {
      badge.classList.add('v567-home-incoming');
      badge.setAttribute('aria-label', 'INCOMING');
      return;
    }

    badge.hidden = true;
  }

  function fixHome() {
    document.querySelectorAll('.s18SeasonReleaseV10').forEach(cleanReleaseCard);
  }

  function fixCharacterCards() {
    document.querySelectorAll('.card[data-char]').forEach(card => {
      removeOldGeneratedBadges(card);
      const id = String(card.dataset.char || '');
      if (isGentleId(id)) {
        ensureNativeNew(card);
      } else {
        removeNativeDirectBadges(card);
      }
    });
  }

  function fixStyleCards() {
    const gentleSelected = currentPageLooksGentle();
    document.querySelectorAll('.styleCard[data-style]').forEach(card => {
      removeOldGeneratedBadges(card);
      const styleId = String(card.dataset.style || '');
      const gentle = gentleSelected || normalize(styleId).includes('gentle_criminal');
      if (gentle) {
        ensureNativeNew(card);
      } else {
        removeNativeDirectBadges(card);
      }
    });
  }

  function costumeId(card) {
    const values = [
      card?.dataset?.costume,
      card?.dataset?.id,
      card?.getAttribute?.('data-costume'),
      card?.getAttribute?.('data-id'),
      card?.id,
      card?.getAttribute?.('onclick'),
      card?.getAttribute?.('href')
    ];
    for (const value of values) {
      const match = String(value || '').match(/(?:ur[_-]?)?(\d{4,})/i);
      if (match) return match[1];
    }
    return '';
  }

  function nativeNewCostumeIds() {
    try {
      const sync = window.MHUR_SEASON18_DATA || {};
      const source = sync.active_new_content && typeof sync.active_new_content === 'object'
        ? sync.active_new_content
        : (sync.new_content || {});
      return new Set((source.costumes || []).map(String));
    } catch (_error) {
      return new Set();
    }
  }

  function fixCostumeTiles() {
    const gentleSelected = currentPageLooksGentle();
    const activeCostumes = nativeNewCostumeIds();

    document.querySelectorAll('.costumeTile, .costumeCard').forEach(card => {
      removeOldGeneratedBadges(card);
      const upcomingGroup = card.closest('.s18UpcomingCostumeGroupV19, .s18UpcomingCostumeGroupV23');
      const active = !upcomingGroup && (gentleSelected || activeCostumes.has(costumeId(card)));
      if (active) {
        ensureNativeNew(card);
      } else {
        removeNativeDirectBadges(card);
      }
    });
  }

  function removeInlineTextBadges() {
    document.querySelectorAll('.card[data-char], .styleCard[data-style], .costumeTile, .costumeCard').forEach(card => {
      card.querySelectorAll('span, small, strong, b, em').forEach(node => {
        if (node.matches('.s18NewBadge, .mhurV567Badge')) return;
        const value = String(node.textContent || '').trim().toUpperCase();
        if ((value === 'NEW' || value === 'NEW!' || value === 'INCOMING') && node.children.length === 0) {
          node.remove();
        }
      });
    });
  }

  function run() {
    removeOldGeneratedBadges(document);
    fixHome();
    fixCharacterCards();
    fixStyleCards();
    fixCostumeTiles();
    removeInlineTextBadges();
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      run();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.addedNodes.length || record.removedNodes.length) {
        schedule();
        return;
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('mhur:languagechange', schedule);
  setInterval(run, 1200);

  window.MHUR_V567_BADGES = { refresh: run };
})();
