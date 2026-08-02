/* MHUR FRANCE — V559 : réductions de points stables après chaque mise à jour */
(() => {
  'use strict';

  const VERSION = '559';
  const ASSET_BASE = 'assets/home/discounts/v559/';
  const CARDS = [
    { name:'D.J. Board', points:100, image:ASSET_BASE+'d_j_board_v559.webp?v='+VERSION, character:'Present Mic', style:'Technical', style_id:'present_mic_technical', role:'technical' },
    { name:'Flow Runner', points:100, image:ASSET_BASE+'flow_runner_v559.webp?v='+VERSION, character:'Shota Aizawa', style:'Strike', style_id:'aizawa_strike', role:'attack' },
    { name:'Gentle Criminal', points:100, image:ASSET_BASE+'gentle_criminal_v559.webp?v='+VERSION, character:'Gentle Criminal', style:'Technical', style_id:'gentle_criminal', role:'technical' },
    { name:'Factor Fusion', points:50, image:ASSET_BASE+'factor_fusion_v559.webp?v='+VERSION, character:'All For One', style:'Strike', style_id:'all_for_one_strike', role:'attack' },
    { name:'Cluster', points:50, image:ASSET_BASE+'cluster_v559.webp?v='+VERSION, character:'Katsuki Bakugo', style:'Technical', style_id:'bakugo_technical', role:'technical' },
    { name:'Mirko', points:50, image:ASSET_BASE+'mirko_v559.webp?v='+VERSION, character:'Mirko', style:'Rapid', style_id:'mirko_rapid', role:'rapid' }
  ];

  const ROLE = {
    technical:{ fr:'TECHNIQUE', en:'TECHNICAL', icon:'assets/roles/role_technical.webp' },
    attack:{ fr:'ATTAQUE', en:'STRIKE', icon:'assets/roles/role_attack_clean.webp' },
    rapid:{ fr:'VITESSE', en:'RAPID', icon:'assets/roles/role_rapid.webp' }
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);

  const language = () => {
    try {
      if (typeof lang !== 'undefined' && String(lang).toLowerCase() === 'en') return 'en';
    } catch (_error) {}
    return String(document.documentElement.lang || '').toLowerCase().startsWith('en') ? 'en' : 'fr';
  };

  const asset = value => {
    const clean = String(value || '').replace(/^\/+/, '');
    try {
      if (typeof rootAsset === 'function') return rootAsset(clean);
    } catch (_error) {}
    return '/' + clean;
  };

  function canonicalCards() {
    return CARDS.map(card => ({ ...card }));
  }

  function lockData() {
    if (!window.MHUR_HOME_DATA || typeof window.MHUR_HOME_DATA !== 'object') {
      window.MHUR_HOME_DATA = {};
    }
    window.MHUR_HOME_DATA.discounts = canonicalCards();
  }

  function roleInfo(role) {
    return ROLE[role] || ROLE.technical;
  }

  function cardHtml(card) {
    const info = roleInfo(card.role);
    const label = info[language()] || info.fr;
    const key = card.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `<article class="discountCardV296 s18DiscountCardV19 v559DiscountCard role-${esc(card.role)}" data-discount="${esc(key)}" data-style-id="${esc(card.style_id)}" data-character="${esc(card.character)}">
      <div class="s18DiscountArtV19 v559DiscountArt"><img src="${esc(asset(card.image))}" alt="${esc(card.name)}" loading="eager" decoding="async"></div>
      <b class="v559DiscountName">${esc(card.name)}</b>
      <div class="v559DiscountRole"><img class="v559RoleIcon" src="${esc(asset(info.icon))}" alt="" aria-hidden="true" onerror="this.style.display='none'"><span class="v559RoleBadge">${esc(label)}</span></div>
      <div class="v559DiscountPointsRow"><strong class="v559DiscountPoints">${esc(card.points)} Pts.</strong></div>
    </article>`;
  }

  function cardsHtml() {
    return CARDS.map(cardHtml).join('');
  }

  function patchTemplate(html) {
    try {
      const template = document.createElement('template');
      template.innerHTML = String(html || '').trim();
      const grid = template.content.querySelector('.discountGridV296');
      if (grid) {
        grid.classList.add('v559DiscountGrid');
        grid.innerHTML = cardsHtml();
        grid.dataset.v559Signature = VERSION + '-' + language();
      }
      template.content.querySelectorAll('.homeFootV296').forEach(node => node.remove());
      return template.innerHTML;
    } catch (_error) {
      return html;
    }
  }

  function wrapDashboard() {
    const current = window.renderHomeDashboard;
    if (typeof current !== 'function' || current.__mhurV559Discounts) return;
    const wrapped = function(...args) {
      lockData();
      return patchTemplate(current.apply(this, args));
    };
    wrapped.__mhurV559Discounts = true;
    wrapped.__mhurV559Original = current;
    window.renderHomeDashboard = wrapped;
    try { renderHomeDashboard = wrapped; } catch (_error) {}
  }

  function patchDom() {
    lockData();
    wrapDashboard();
    document.querySelectorAll('.homeFootV296').forEach(node => node.remove());
    const sig = VERSION + '-' + language();
    document.querySelectorAll('.discountGridV296').forEach(grid => {
      const correctCards = grid.querySelectorAll(':scope > .v559DiscountCard').length === CARDS.length;
      if (!correctCards || grid.dataset.v559Signature !== sig) {
        grid.classList.add('v559DiscountGrid');
        grid.innerHTML = cardsHtml();
        grid.dataset.v559Signature = sig;
      }
    });
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      patchDom();
    });
  }

  lockData();
  wrapDashboard();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once:true });
  } else {
    schedule();
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true });

  window.addEventListener('mhur:languagechange', schedule);
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  window.addEventListener('load', schedule, { once:true });
  setInterval(schedule, 1800);

  window.MHUR_V559_DISCOUNTS = {
    version: VERSION,
    cards: canonicalCards,
    refresh: schedule
  };
})();
