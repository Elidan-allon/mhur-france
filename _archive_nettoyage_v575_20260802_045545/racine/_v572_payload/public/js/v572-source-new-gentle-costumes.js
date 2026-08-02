/* MHUR FRANCE — V572
   Synchronisation DOM ciblée sur les vrais identifiants du site.
*/
(() => {
  'use strict';

  const GENTLE_CHARACTER_ID = 'gentle_criminal';
  const GENTLE_STYLE_ID = 'gentle_criminal_technical';
  const GENTLE_ORIGINAL_COSTUME_ID = '108000000';
  const BADGE_HTML = '<span class="s18NewBadge s18NewBadgeV9 s18NewBadgeV24 s18NewBadgeV572" aria-label="NEW">NEW!</span>';

  function releaseTime(value) {
    const time = Date.parse(String(value || ''));
    return Number.isFinite(time) ? time : null;
  }

  function latestReleasedCostumeIds() {
    const sync = window.MHUR_SEASON18_DATA || {};
    const now = Date.now();
    const rows = Object.entries(sync.costumes || {})
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

  function activeCostumeIds() {
    const sync = window.MHUR_SEASON18_DATA || {};
    const active = sync.active_new_content && Array.isArray(sync.active_new_content.costumes)
      ? sync.active_new_content.costumes
      : [];
    return new Set([
      ...active.map(String),
      ...latestReleasedCostumeIds(),
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

  function setDirectBadge(node, active) {
    if (!node) return;
    node.querySelectorAll(':scope > .s18NewBadge').forEach(badge => badge.remove());
    if (active) node.insertAdjacentHTML('afterbegin', BADGE_HTML);
  }

  function syncBadges() {
    document
      .querySelectorAll(`.card[data-char="${GENTLE_CHARACTER_ID}"]`)
      .forEach(card => setDirectBadge(card, true));

    document
      .querySelectorAll(`.styleCard[data-style="${GENTLE_STYLE_ID}"]`)
      .forEach(card => setDirectBadge(card, true));

    const ids = activeCostumeIds();
    document.querySelectorAll('.costumeTile,.costumeCard,.costumeResult').forEach(tile => {
      if (tile.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23')) return;
      const id = costumeId(tile);
      if (id) tile.dataset.costume = id;
      setDirectBadge(tile, Boolean(id && ids.has(id)));
    });
  }

  function wrapRender() {
    if (typeof window.render !== 'function' || window.render.__mhurV572) return;
    const original = window.render;
    const wrapped = function() {
      const result = original.apply(this, arguments);
      requestAnimationFrame(syncBadges);
      return result;
    };
    wrapped.__mhurV572 = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_error) {}
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      wrapRender();
      syncBadges();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }

  new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes && mutation.addedNodes.length)) {
      schedule();
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('load', schedule, { once: true });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('mhur:languagechange', schedule);
  setInterval(syncBadges, 1500);

  window.MHUR_V572 = {
    refresh: syncBadges,
    latestReleasedCostumeIds
  };
})();
