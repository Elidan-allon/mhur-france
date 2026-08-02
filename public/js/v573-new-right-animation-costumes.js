/* MHUR FRANCE — V573 */
(() => {
  'use strict';

  const BADGE_HTML = '<span class="s18NewBadge s18NewBadgeV9 s18NewBadgeV24 s18NewBadgeV572 s18NewBadgeV573" aria-label="NEW">NEW!</span>';
  const GENTLE_STYLE_ID = 'gentle_criminal_technical';
  const GENTLE_CHARACTER_ID = 'gentle_criminal';
  const GENTLE_ORIGINAL_COSTUME_ID = '108000000';

  function releaseTime(value) {
    const time = Date.parse(String(value || ''));
    return Number.isFinite(time) ? time : null;
  }

  function latestReleasedCostumeIds() {
    const data = window.MHUR_SEASON18_DATA || {};
    const now = Date.now();
    const rows = Object.entries(data.costumes || {})
      .map(([id, row]) => ({
        id: String(id),
        time: releaseTime(row && row.releaseDate),
        upcoming: Boolean(row && row.upcoming)
      }))
      .filter(row => row.time !== null && !row.upcoming && row.time <= now);

    if (!rows.length) return [];
    const latest = Math.max(...rows.map(row => row.time));
    return rows.filter(row => row.time === latest).map(row => row.id);
  }

  function activeCharacterIds() {
    const data = window.MHUR_SEASON18_DATA || {};
    const active = data.active_new_content || {};
    return new Set([...(active.characters || []).map(String), GENTLE_CHARACTER_ID]);
  }

  function activeStyleIds() {
    const data = window.MHUR_SEASON18_DATA || {};
    const active = data.active_new_content || {};
    return new Set([...(active.styles || []).map(String), GENTLE_STYLE_ID]);
  }

  function activeCostumeIds() {
    const data = window.MHUR_SEASON18_DATA || {};
    const active = data.active_new_content || {};
    return new Set([
      ...(active.costumes || []).map(String),
      ...latestReleasedCostumeIds().map(String),
      GENTLE_ORIGINAL_COSTUME_ID
    ]);
  }

  function costumeId(tile) {
    if (!tile) return '';
    const values = [
      tile.dataset && tile.dataset.costume,
      tile.dataset && tile.dataset.id,
      tile.getAttribute('data-costume'),
      tile.getAttribute('data-id'),
      tile.id,
      tile.getAttribute('onclick'),
      tile.getAttribute('href'),
      tile.outerHTML
    ];

    for (const value of values) {
      const match = String(value || '').match(/(?:ur[_-]?)?(\d{4,})/i);
      if (match) return match[1];
    }
    return '';
  }

  function stripDirectBadge(node) {
    if (!node) return;
    node.querySelectorAll(':scope > .s18NewBadge').forEach(badge => badge.remove());
  }

  function ensureBadge(node, active) {
    if (!node) return;
    stripDirectBadge(node);
    if (active) node.insertAdjacentHTML('afterbegin', BADGE_HTML);
  }

  function syncCharacters() {
    const characters = activeCharacterIds();
    document.querySelectorAll('.card[data-char]').forEach(card => {
      const id = String(card.getAttribute('data-char') || '');
      ensureBadge(card, characters.has(id));
    });
  }

  function syncStyles() {
    const styles = activeStyleIds();
    document.querySelectorAll('.styleCard[data-style]').forEach(card => {
      const id = String(card.getAttribute('data-style') || '');
      ensureBadge(card, styles.has(id));
    });
  }

  function syncCostumes() {
    const costumes = activeCostumeIds();
    document.querySelectorAll('.costumeTile,.costumeCard,.costumeResult').forEach(tile => {
      if (tile.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23')) return;
      const id = costumeId(tile);
      if (id) tile.dataset.costume = id;
      ensureBadge(tile, Boolean(id && costumes.has(id)));
    });
  }

  function syncAll() {
    syncCharacters();
    syncStyles();
    syncCostumes();
  }

  function wrapRender() {
    if (typeof window.render !== 'function' || window.render.__mhurV573) return;
    const original = window.render;
    const wrapped = function() {
      const result = original.apply(this, arguments);
      requestAnimationFrame(syncAll);
      return result;
    };
    wrapped.__mhurV573 = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_e) {}
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      wrapRender();
      syncAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(mutations => {
    if (mutations.some(m => m.addedNodes && m.addedNodes.length)) {
      schedule();
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('mhur:languagechange', schedule);
  setInterval(syncAll, 1500);

  window.MHUR_V573 = {
    refresh: syncAll,
    latestReleasedCostumeIds
  };
})();
