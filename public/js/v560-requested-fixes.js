/* ==========================================================================
   MHUR FRANCE — V560 REQUESTED FIXES
   Correctif ciblé : badges, réductions, patch notes, tags et traductions.
   ========================================================================== */
(function () {
  'use strict';

  var VERSION = '560';
  var NOW = new Date('2026-08-02T00:00:00+03:00');
  var NEW_SELECTORS = [
    '.s18NewBadge', '.s18NewBadgeV9', '.s18NewBadgeV24', '.s18PlannedNewV12',
    '.s18SeasonNewV10', '.mhurCharacterNewV554', '.mhurCharacterNewV555',
    '.mhurCostumeNewV554', '.mhurCostumeNewV555', '.mhurNewV556',
    '.mhurNewV558', '.mhurNewV559', '.mhurNewV560'
  ].join(',');

  var DISCOUNTS = [
    { name: 'D.J. Board', style: 'present_mic_technical', role: 'technical', points: 100,
      portrait: 'assets/present_mic/present_mic_technical/portrait.png',
      fallback: 'assets/home/discounts/d_j_board.webp' },
    { name: 'Flow Runner', style: 'aizawa_strike', role: 'strike', points: 100,
      portrait: 'assets/aizawa/aizawa_strike/portrait.png',
      fallback: 'assets/home/discounts/flow_runner.webp' },
    { name: 'Gentle Criminal', style: 'gentle_criminal_technical', role: 'technical', points: 100,
      portrait: 'assets/gentle_criminal/gentle_criminal_technical/portrait.png',
      fallback: 'assets/home/discounts/gentle_criminal.webp' },
    { name: 'Factor Fusion', style: 'all_for_one_strike', role: 'strike', points: 50,
      portrait: 'assets/all_for_one/all_for_one_strike/portrait.png',
      fallback: 'assets/home/discounts/factor_fusion.webp' },
    { name: 'Cluster', style: 'bakugo_technical', role: 'technical', points: 50,
      portrait: 'assets/bakugo/bakugo_technical/portrait.png',
      fallback: 'assets/home/discounts/cluster.webp' },
    { name: 'Mirko', style: 'mirko_rapid', role: 'rapid', points: 50,
      portrait: 'assets/mirko/mirko_rapid/portrait.png',
      fallback: 'assets/home/discounts/mirko.webp' }
  ];

  var ROLE_ICONS = {
    assault: 'assets/roles/role_assault_clean.webp',
    strike: 'assets/roles/role_attack_clean.webp',
    rapid: 'assets/roles/role_rapid.webp',
    technical: 'assets/roles/role_technical.webp',
    support: 'assets/roles/role_support.webp'
  };


  var PATCH_PORTRAITS_V560 = {"izuku midoriya ofa|original":"assets/home/patches/1785298405/portrait_izuku_midoriya_ofa.webp","katsuki bakugo|original":"assets/home/patches/1785298405/portrait_katsuki_bakugo.webp","katsuki bakugo|cluster":"assets/home/patches/1785298405/portrait_katsuki_bakugo.webp","denki kaminari|original":"assets/home/patches/1785298405/portrait_denki_kaminari.webp","mirio togata|sheer counter":"assets/home/patches/1785298405/portrait_mirio_togata.webp","armored all might|original":"assets/home/patches/1785298405/portrait_armored_all_might.webp","hawks|original":"assets/home/patches/1785298405/portrait_hawks.webp","lady nagant|original":"assets/home/patches/1785298405/portrait_lady_nagant.webp","itsuka kendo|original":"assets/home/patches/1785298405/portrait_itsuka_kendo.webp","twice|original":"assets/home/patches/1785298405/portrait_twice.webp","tomura shigaraki|thousand hand break":"assets/home/patches/1783497169/portrait_tomura_shigaraki.webp","all for one|original":"assets/home/patches/1783497169/portrait_all_for_one.webp","eijiro kirishima|red drive":"assets/home/patches/1783497169/portrait_eijiro_kirishima.webp","itsuka kendo|twin palm strike":"assets/home/patches/1783497169/portrait_itsuka_kendo.webp","ibara shiozaki|original":"assets/home/patches/1783497169/portrait_ibara_shiozaki.webp","tamaki amajiki|original":"assets/home/patches/1783497169/portrait_tamaki_amajiki.webp","nejire hado|original":"assets/home/patches/1783497169/portrait_nejire_hado.webp","cementoss|original":"assets/home/patches/1783497169/portrait_cementoss.webp","endeavor|original":"assets/home/patches/1783497169/portrait_endeavor.webp","shota aizawa|flow runner":"assets/home/patches/1782273704/portrait_shota_aizawa.webp","present mic|d j board":"assets/home/patches/1781064165/portrait_present_mic.webp","shoto todoroki|ice fang wind flame":"assets/home/patches/1779836241/portrait_shoto_todoroki.webp","himiko toga|sting dance":"assets/home/patches/1779836241/portrait_himiko_toga.webp","kurogiri|original":"assets/home/patches/1779836241/portrait_kurogiri.webp","izuku midoriya|original":"assets/home/patches/1779836241/portrait_izuku_midoriya.webp","izuku midoriya|full bullet":"assets/home/patches/1779836241/portrait_izuku_midoriya.webp","nejire hado|fairy":"assets/home/patches/1779836241/portrait_nejire_hado.webp","hitoshi shinso|original":"assets/home/patches/1779836241/portrait_hitoshi_shinso.webp","shota aizawa|original":"assets/home/patches/1779836241/portrait_shota_aizawa.webp","tomura shigaraki|catastrophe":"assets/home/patches/1779836241/portrait_tomura_shigaraki.webp","dabi|original":"assets/home/patches/1779836241/portrait_dabi.webp","dabi|crazy torch":"assets/home/patches/1779836241/portrait_dabi.webp","mr compress|original":"assets/home/patches/1779836241/portrait_mr_compress.webp","tsuyu asui|original":"assets/home/patches/1779836241/portrait_tsuyu_asui.webp"};
  var PATCH_SKILLS_V560 = {"katsuki bakugo|original|howitzer impact":"assets/home/patches/1785298405/skill_katsuki_bakugo_howitzer_impact.png","katsuki bakugo|cluster|ap shot cluster normal":"assets/home/patches/1785298405/skill_katsuki_bakugo_ap_shot_cluster_normal.png","katsuki bakugo|cluster|nitro cluster explosion":"assets/home/patches/1785298405/skill_katsuki_bakugo_nitro_cluster_explosion.png","katsuki bakugo|cluster|nitro cluster explosionfollow up":"assets/home/patches/1785298405/skill_katsuki_bakugo_nitro_cluster_explosionfollow_up.png","denki kaminari|original|electro target":"assets/home/patches/1785298405/skill_denki_kaminari_electro_target.png","mirio togata|sheer counter|phantom smash shot":"assets/home/patches/1785298405/skill_mirio_togata_phantom_smash_shot.png","armored all might|original|ice bullet shot burn":"assets/home/patches/1785298405/skill_armored_all_might_ice_bullet_shot_burn.png","hawks|original|wingbeat homing":"assets/home/patches/1785298405/skill_hawks_wingbeat_homing.png","hawks|original|wind cross melee":"assets/home/patches/1785298405/skill_hawks_wind_cross_melee.png","lady nagant|original|hollow point shot on hit shot afterfollow up":"assets/home/patches/1785298405/skill_lady_nagant_hollow_point_shot_on_hit_shot_afterfollow_up.png","lady nagant|original|hollow point shot shooting":"assets/home/patches/1785298405/skill_lady_nagant_hollow_point_shot_shooting.png","lady nagant|original|high angle fire arcon hit shot":"assets/home/patches/1785298405/skill_lady_nagant_high_angle_fire_arcon_hit_shot.png","lady nagant|original|kickback shot spread shot ground":"assets/home/patches/1785298405/skill_lady_nagant_kickback_shot_spread_shot_ground.png","lady nagant|original|scope mode action shooting":"assets/home/patches/1785298405/skill_lady_nagant_scope_mode_action_shooting.png","lady nagant|original|scope mode action shooting headshot":"assets/home/patches/1785298405/skill_lady_nagant_scope_mode_action_shooting_headshot.png","izuku midoriya ofa|original|delaware smash airblast":"assets/home/patches/1785298405/skill_izuku_midoriya_ofa_delaware_smash_airblast.png","katsuki bakugo|cluster|ap shot cluster":"assets/home/patches/1785298405/skill_katsuki_bakugo_ap_shot_cluster.png","katsuki bakugo|cluster|howitzer impact cluster":"assets/home/patches/1785298405/skill_katsuki_bakugo_howitzer_impact_cluster.png","denki kaminari|original|electrification":"assets/home/patches/1785298405/skill_denki_kaminari_electrification.png","itsuka kendo|original|big fist grip":"assets/home/patches/1785298405/skill_itsuka_kendo_big_fist_grip.png","hawks|original|wingbeat":"assets/home/patches/1785298405/skill_hawks_wingbeat.png","twice|original|foot boost":"assets/home/patches/1785298405/skill_twice_foot_boost.png","lady nagant|original|hollow point shot":"assets/home/patches/1785298405/skill_lady_nagant_hollow_point_shot.png","lady nagant|original|kickback shot":"assets/home/patches/1785298405/skill_lady_nagant_kickback_shot.png","eijiro kirishima|red drive|red strike":"assets/home/patches/1783497169/skill_eijiro_kirishima_red_strike.png","itsuka kendo|twin palm strike|gale burst normal":"assets/home/patches/1783497169/skill_itsuka_kendo_gale_burst_normal.png","itsuka kendo|twin palm strike|whirlwind fist finisher":"assets/home/patches/1783497169/skill_itsuka_kendo_whirlwind_fist_finisher.png","itsuka kendo|twin palm strike|whirlwind fist spin":"assets/home/patches/1783497169/skill_itsuka_kendo_whirlwind_fist_spin.png","ibara shiozaki|original|purification charge":"assets/home/patches/1783497169/skill_ibara_shiozaki_purification_charge.png","tamaki amajiki|original|plasma cannon":"assets/home/patches/1783497169/skill_tamaki_amajiki_plasma_cannon.png","tamaki amajiki|original|plasma cannon charge":"assets/home/patches/1783497169/skill_tamaki_amajiki_plasma_cannon_charge.png","nejire hado|original|spiraling surge":"assets/home/patches/1783497169/skill_nejire_hado_spiraling_surge.png","all for one|original|final blow":"assets/home/patches/1783497169/skill_all_for_one_final_blow.png","all for one|original|meteor annihilation explosion":"assets/home/patches/1783497169/skill_all_for_one_meteor_annihilation_explosion.png","all for one|original|divine judgment":"assets/home/patches/1783497169/skill_all_for_one_divine_judgment.png","itsuka kendo|twin palm strike|whirlwind fist":"assets/home/patches/1783497169/skill_itsuka_kendo_whirlwind_fist.png","cementoss|original|structural slab":"assets/home/patches/1783497169/skill_cementoss_structural_slab.png","cementoss|original|defensive wall":"assets/home/patches/1783497169/skill_cementoss_defensive_wall.png","endeavor|original|flight":"assets/home/patches/1783497169/skill_endeavor_flight.png","shota aizawa|flow runner|binding cloth leap grab":"assets/home/patches/1782273704/skill_shota_aizawa_binding_cloth_leap_grab.png","shota aizawa|flow runner|binding cloth flow runner":"assets/home/patches/1782273704/skill_shota_aizawa_binding_cloth_flow_runner.png","shota aizawa|flow runner|binding cloth instance":"assets/home/patches/1782273704/skill_shota_aizawa_binding_cloth_instance.png","present mic|d j board|d j board":"assets/home/patches/1781064165/skill_present_mic_d_j_board.png","izuku midoriya|original|delaware smash air force charge":"assets/home/patches/1779836241/skill_izuku_midoriya_delaware_smash_air_force_charge.png","izuku midoriya|full bullet|delaware smash full bullet":"assets/home/patches/1779836241/skill_izuku_midoriya_delaware_smash_full_bullet.png","nejire hado|fairy|spiraling pike shot":"assets/home/patches/1779836241/skill_nejire_hado_spiraling_pike_shot.png","nejire hado|fairy|spiraling pike strongshot":"assets/home/patches/1779836241/skill_nejire_hado_spiraling_pike_strongshot.png","hitoshi shinso|original|binding cloth crushing strike slam":"assets/home/patches/1779836241/skill_hitoshi_shinso_binding_cloth_crushing_strike_slam.png","shota aizawa|original|powerhouse kick barrage":"assets/home/patches/1779836241/skill_shota_aizawa_powerhouse_kick_barrage.png","shota aizawa|original|powerhouse kick barrage finisher":"assets/home/patches/1779836241/skill_shota_aizawa_powerhouse_kick_barrage_finisher.png","endeavor|original|searing arrow":"assets/home/patches/1779836241/skill_endeavor_searing_arrow.png","endeavor|original|searing arrow shotl2":"assets/home/patches/1779836241/skill_endeavor_searing_arrow_shotl2.png","endeavor|original|searing arrow shotl3":"assets/home/patches/1779836241/skill_endeavor_searing_arrow_shotl3.png","hawks|original|wingbeat normal shot":"assets/home/patches/1779836241/skill_hawks_wingbeat_normal_shot.png","hawks|original|storm wings shot":"assets/home/patches/1779836241/skill_hawks_storm_wings_shot.png","tomura shigaraki|catastrophe|earth break":"assets/home/patches/1779836241/skill_tomura_shigaraki_earth_break.png","tomura shigaraki|catastrophe|earth break collapse":"assets/home/patches/1779836241/skill_tomura_shigaraki_earth_break_collapse.png","tomura shigaraki|catastrophe|catastrophe":"assets/home/patches/1779836241/skill_tomura_shigaraki_catastrophe.png","tomura shigaraki|catastrophe|catastrophe collapse":"assets/home/patches/1779836241/skill_tomura_shigaraki_catastrophe_collapse.png","tomura shigaraki|thousand hand break|shake heaven and earth bodyimpact":"assets/home/patches/1779836241/skill_tomura_shigaraki_shake_heaven_and_earth_bodyimpact.png","tomura shigaraki|thousand hand break|shake heaven and earth hit 1 shockwave":"assets/home/patches/1779836241/skill_tomura_shigaraki_shake_heaven_and_earth_hit_1_shockwave.png","tomura shigaraki|thousand hand break|shake heaven and earth hit 2 shockwave":"assets/home/patches/1779836241/skill_tomura_shigaraki_shake_heaven_and_earth_hit_2_shockwave.png","dabi|original|shadow fire":"assets/home/patches/1779836241/skill_dabi_shadow_fire.png","dabi|crazy torch|flames of resentment":"assets/home/patches/1779836241/skill_dabi_flames_of_resentment.png","dabi|crazy torch|flames of resentment max charge":"assets/home/patches/1779836241/skill_dabi_flames_of_resentment_max_charge.png","dabi|crazy torch|scorching admonition grabrelease":"assets/home/patches/1779836241/skill_dabi_scorching_admonition_grabrelease.png","mr compress|original|production magic":"assets/home/patches/1779836241/skill_mr_compress_production_magic.png","mr compress|original|production magic shock":"assets/home/patches/1779836241/skill_mr_compress_production_magic_shock.png","tamaki amajiki|original|wing claw":"assets/home/patches/1779836241/skill_tamaki_amajiki_wing_claw.png","nejire hado|fairy|spiraling pike":"assets/home/patches/1779836241/skill_nejire_hado_spiraling_pike.png","armored all might|original|thruster uravity":"assets/home/patches/1779836241/skill_armored_all_might_thruster_uravity.png","shota aizawa|original|erasure":"assets/home/patches/1779836241/skill_shota_aizawa_erasure.png","hawks|original|storm wings":"assets/home/patches/1779836241/skill_hawks_storm_wings.png","tomura shigaraki|thousand hand break|super regeneration":"assets/home/patches/1779836241/skill_tomura_shigaraki_super_regeneration.png","dabi|crazy torch|crazy torch":"assets/home/patches/1779836241/skill_dabi_crazy_torch.png","kurogiri|original|shadow haunt":"assets/home/patches/1779836241/skill_kurogiri_shadow_haunt.png","lady nagant|original|scope mode":"assets/home/patches/1779836241/skill_lady_nagant_scope_mode.png"};

  var ROLE_LABELS = {
    fr: { assault: 'Assaut', strike: 'Attaque', rapid: 'Vitesse', technical: 'Technique', support: 'Soutien' },
    en: { assault: 'Assault', strike: 'Strike', rapid: 'Rapid', technical: 'Technical', support: 'Support' }
  };

  function currentLanguage() {
    var html = String(document.documentElement.lang || '').toLowerCase();
    var stored = '';
    try {
      stored = localStorage.getItem('mhur_lang') || localStorage.getItem('mhurLang') || localStorage.getItem('lang') || '';
    } catch (_) {}
    try {
      if (typeof window.lang === 'string' && /^(fr|en)$/.test(window.lang)) return window.lang;
      if (typeof lang !== 'undefined' && typeof lang === 'string' && /^(fr|en)$/.test(lang)) return lang;
    } catch (_) {}
    return stored === 'en' || html.indexOf('en') === 0 ? 'en' : 'fr';
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function norm(value) {
    var text = String(value == null ? '' : value);
    try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return text.toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function slug(value) {
    var text = String(value == null ? '' : value)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[αβγ]/gi, ' ');
    try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function values(source) {
    if (!source) return [];
    if (Array.isArray(source)) return source;
    if (typeof source !== 'object') return [];
    return Object.keys(source).map(function (key) {
      var item = source[key];
      if (item && typeof item === 'object' && !item.id) {
        try { item.id = key; } catch (_) {}
      }
      return item;
    });
  }

  function directBadge(container, selector) {
    if (!container || !container.children) return null;
    for (var i = 0; i < container.children.length; i += 1) {
      if (container.children[i].matches && container.children[i].matches(selector)) return container.children[i];
    }
    return null;
  }

  function removeBadges(container) {
    if (!container || !container.querySelectorAll) return;
    Array.prototype.slice.call(container.querySelectorAll(NEW_SELECTORS + ',.mhurIncomingV560')).forEach(function (badge) {
      badge.remove();
    });
  }

  function makeBadge(kind, text) {
    var badge = document.createElement('span');
    badge.className = kind === 'incoming' ? 'mhurIncomingV560' : 'mhurNewV560 mhurNewPulseV560';
    badge.setAttribute('aria-label', text);
    badge.textContent = text;
    return badge;
  }

  function appendBadge(container, kind) {
    if (!container) return null;
    var wanted = kind === 'incoming' ? '.mhurIncomingV560' : '.mhurNewV560';
    var existing = directBadge(container, wanted);
    if (existing) return existing;
    var label = kind === 'incoming' ? 'INCOMING' : 'NEW!';
    var badge = makeBadge(kind, label);
    container.appendChild(badge);
    return badge;
  }

  function setBadgeState(container, kind) {
    if (!container || !container.querySelectorAll) return;
    var wantedSelector = kind === 'new' ? '.mhurNewV560' : (kind === 'incoming' ? '.mhurIncomingV560' : '');
    var kept = false;
    Array.prototype.slice.call(container.querySelectorAll(NEW_SELECTORS + ',.mhurIncomingV560')).forEach(function (badge) {
      var isWanted = wantedSelector && badge.matches(wantedSelector) && badge.parentElement === container && !kept;
      if (isWanted) {
        kept = true;
        return;
      }
      badge.remove();
    });
    if (kind && !kept) appendBadge(container, kind);
  }

  function costumeIdFromElement(element) {
    if (!element) return '';
    var nodes = [element];
    var child = element.querySelector && element.querySelector('[data-costume-id],[data-costume],[data-id]');
    if (child) nodes.push(child);
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      var candidates = [
        node.dataset && node.dataset.costumeId,
        node.dataset && node.dataset.costume,
        node.getAttribute && node.getAttribute('data-costume-id'),
        node.getAttribute && node.getAttribute('data-costume'),
        node.id
      ];
      for (var j = 0; j < candidates.length; j += 1) {
        var match = String(candidates[j] || '').match(/\b(\d{6,10})\b/);
        if (match) return match[1];
      }
    }
    var html = '';
    try { html = element.outerHTML || ''; } catch (_) {}
    var assetMatch = html.match(/(?:costumes\/|costume[_/-])(\d{6,10})/i);
    return assetMatch ? assetMatch[1] : '';
  }

  function activeNewCostumeIds() {
    var result = new Set(['108000000','18607100','18607101','18607103','18607104','18607105','18607106']); // Gentle Original + Toga Quirk Boost Gear.
    var season = window.MHUR_SEASON18_DATA || {};
    var active = season.active_new_content && season.active_new_content.costumes;
    values(active).forEach(function (raw) {
      var id = String(raw && raw.id != null ? raw.id : raw);
      if (!/^\d{6,10}$/.test(id)) return;
      var meta = season.costumes && season.costumes[id];
      if (meta) {
        if (meta.upcoming) return;
        if (meta.releaseDate) {
          var date = new Date(meta.releaseDate);
          if (!isNaN(date.getTime()) && date > NOW) return;
        }
        var acquisition = String(meta.acquisition_en || meta.acquisition_fr || '');
        if (/Season 18 Rankings|classement de la saison 18/i.test(acquisition)) return;
      }
      result.add(id);
    });
    return result;
  }

  function upcomingCostumeIds() {
    var result = new Set();
    var season = window.MHUR_SEASON18_DATA || {};
    values(season.upcoming_costumes).forEach(function (item) {
      var id = String(item && item.id != null ? item.id : item);
      if (/^\d{6,10}$/.test(id)) result.add(id);
    });
    values(season.costumes).forEach(function (item) {
      if (!item) return;
      var date = item.releaseDate ? new Date(item.releaseDate) : null;
      if (item.upcoming || (date && !isNaN(date.getTime()) && date > NOW)) result.add(String(item.id || ''));
    });
    return result;
  }

  function costumeContainers(root) {
    root = root || document;
    if (!root.querySelectorAll) return [];
    var specificSelector = '.costumeTile,.costumeCard,.costumeItem';
    var specific = Array.prototype.slice.call(root.querySelectorAll(specificSelector));
    var dataCards = Array.prototype.slice.call(root.querySelectorAll('[data-costume-id],[data-costume]')).filter(function (node) {
      return !(node.closest && node.closest(specificSelector));
    });
    var all = specific.concat(dataCards);
    return all.filter(function (node, index, array) {
      if (!node || !node.querySelector) return false;
      if (array.indexOf(node) !== index) return false;
      if (node.closest && node.closest('.discountGridV296,.mhurDiscountGridV560')) return false;
      return !!costumeIdFromElement(node);
    });
  }

  function syncCostumeBadges(root) {
    var newest = activeNewCostumeIds();
    var incoming = upcomingCostumeIds();
    costumeContainers(root).forEach(function (card) {
      var id = costumeIdFromElement(card);
      if (!id) return;
      card.classList.add('mhurBadgeHostV560', 'mhurCostumeBadgeHostV560');
      if (newest.has(id)) setBadgeState(card, 'new');
      else if (incoming.has(id)) setBadgeState(card, 'incoming');
      else setBadgeState(card, '');
    });
  }

  function characterCardContainers(root) {
    root = root || document;
    var selector = [
      '.charactersFrame .card', '.tuningsFrame .card', '.costumesFrame .card',
      '.characterCard', '[data-char]', '[data-character]'
    ].join(',');
    return Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll(selector) : [])
      .filter(function (card) {
        return !(card.closest && card.closest('.discountGridV296,.mhurDiscountGridV560,.releaseGridV296'));
      });
  }

  function characterIdentity(card) {
    var raw = [
      card.dataset && card.dataset.char,
      card.dataset && card.dataset.character,
      card.getAttribute && card.getAttribute('data-char'),
      card.getAttribute && card.getAttribute('data-character'),
      card.textContent
    ].join(' ');
    return norm(raw);
  }

  function syncCharacterBadges(root) {
    characterCardContainers(root).forEach(function (card) {
      var identity = characterIdentity(card);
      var isGentle = identity.indexOf('gentle criminal') >= 0;
      var future = card.matches && card.matches('[data-upcoming="true"],[data-coming="true"]');
      var text = norm(card.textContent);
      if (text.indexOf('releases august') >= 0 || text.indexOf('sortie le 19 aout') >= 0 || text.indexOf('planned during') >= 0) future = true;
      card.classList.add('mhurBadgeHostV560', 'mhurCharacterBadgeHostV560');
      if (future && !isGentle) setBadgeState(card, 'incoming');
      else if (isGentle) setBadgeState(card, 'new');
      else setBadgeState(card, '');
    });
  }

  function syncReleaseBadges(root) {
    root = root || document;
    var selector = [
      '.releaseGridV296 > *', '.s18PlannedCardV14', '.s18ReleaseCard',
      '.latestReleaseCard', '[data-release-date]'
    ].join(',');
    Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll(selector) : []).forEach(function (card) {
      if (!card.querySelector || !card.querySelector('img')) return;
      var text = norm(card.textContent);
      var rawDate = card.getAttribute('data-release-date') || card.dataset && card.dataset.releaseDate || '';
      var date = rawDate ? new Date(rawDate) : null;
      var future = !!(date && !isNaN(date.getTime()) && date > NOW);
      if (/releases (?:august|september)|sortie (?:le )?(?:19 aout|en septembre)/.test(text) ||
          text.indexOf('planned during season 18') >= 0 || text.indexOf('prevu pendant la saison 18') >= 0 ||
          text.indexOf('twice') >= 0 || text.indexOf('tsuyu asui') >= 0) {
        future = true;
      }
      var isGentle = text.indexOf('gentle criminal') >= 0;
      card.classList.add('mhurBadgeHostV560', 'mhurReleaseBadgeHostV560');
      if (future && !isGentle) setBadgeState(card, 'incoming');
      else if (isGentle) setBadgeState(card, 'new');
      else setBadgeState(card, '');
    });
  }

  function syncTierListBadge(root) {
    root = root || document;
    var candidates = Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll(
      '.tierList img,.tierlist img,.tier-list img,[class*="tier"] img,[id*="tier"] img'
    ) : []);
    candidates.forEach(function (img) {
      var haystack = norm((img.alt || '') + ' ' + (img.src || '') + ' ' + (img.parentElement && img.parentElement.textContent || ''));
      if (haystack.indexOf('gentle') < 0) return;
      var host = img.closest && img.closest('.tierCharacter,.tierItem,.tierToken,.characterToken,.rosterToken,.card,li,button,div');
      if (!host || host === document.body) return;
      host.classList.add('mhurBadgeHostV560', 'mhurTierBadgeHostV560');
      if (!directBadge(host, '.mhurNewV560')) appendBadge(host, 'new');
    });
  }

  function restoreContextTags(root) {
    root = root || document;
    Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll(
      '.tuningsFrame .card,.costumesFrame .card,.charactersFrame .card'
    ) : []).forEach(function (card) {
      var mode = card.closest('.tuningsFrame') ? 'T.U.N.I.N.G' :
        (card.closest('.costumesFrame') ? (currentLanguage() === 'en' ? 'COSTUMES' : 'COSTUMES') :
          (currentLanguage() === 'en' ? 'CHARACTER' : 'PERSONNAGE'));
      var tag = card.querySelector('.cardModeTag');
      if (!tag) {
        tag = document.createElement('span');
        tag.className = 'cardModeTag mhurContextTagV560';
        card.appendChild(tag);
      }
      tag.classList.add('mhurContextTagV560');
      if (tag.textContent !== mode) tag.textContent = mode;
    });
  }

  function roleLabel(role) {
    return (ROLE_LABELS[currentLanguage()] || ROLE_LABELS.fr)[role] || role;
  }

  function discountHtml(item) {
    var role = item.role;
    return '<article class="mhurDiscountCardV560 role-' + role + '" data-style="' + esc(item.style) + '">' +
      '<div class="mhurDiscountPortraitV560 role-' + role + '">' +
        '<span class="mhurDiscountRoleBackdropV560" aria-hidden="true"><img src="' + esc(ROLE_ICONS[role]) + '" alt=""></span>' +
        '<img class="mhurDiscountCharacterV560" src="' + esc(item.portrait) + '" data-fallback="' + esc(item.fallback) + '" alt="' + esc(item.name) + '">' +
      '</div>' +
      '<strong class="mhurDiscountNameV560">' + esc(item.name) + '</strong>' +
      '<div class="mhurDiscountRoleV560 role-' + role + '">' +
        '<img src="' + esc(ROLE_ICONS[role]) + '" alt="" aria-hidden="true">' +
        '<span>' + esc(roleLabel(role)) + '</span>' +
      '</div>' +
      '<strong class="mhurDiscountPointsV560">' + esc(item.points) + '</strong>' +
    '</article>';
  }

  function repairDiscounts(root) {
    root = root || document;
    var grids = Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll('.discountGridV296,.mhurDiscountGridV559,.mhurDiscountGridV560') : []);
    grids.forEach(function (grid) {
      var signature = currentLanguage() + ':v560';
      if (grid.dataset.mhurDiscountV560 === signature && grid.querySelectorAll('.mhurDiscountCardV560').length === DISCOUNTS.length) return;
      grid.classList.add('mhurDiscountGridV560');
      grid.innerHTML = DISCOUNTS.map(discountHtml).join('');
      grid.dataset.mhurDiscountV560 = signature;
      Array.prototype.slice.call(grid.querySelectorAll('.mhurDiscountCharacterV560')).forEach(function (img) {
        img.addEventListener('error', function () {
          if (img.dataset.fallback && img.src.indexOf(img.dataset.fallback) < 0) img.src = img.dataset.fallback;
        }, { once: true });
      });
    });
  }

  function patchNotes() {
    var home = window.MHUR_HOME_DATA || {};
    return values(home.patch_notes);
  }

  function patchId(note) {
    return String(note && (note.id || note.patch_id || note.timestamp || note.slug) || '1785298405');
  }

  function patchCharacterKey(change) {
    return norm(change.character) + '|' + norm(change.style);
  }

  function patchSkillKey(change) {
    return patchCharacterKey(change) + '|' + norm(change.skill_name || change.skill);
  }

  function exactPatchPortrait(note, change) {
    return PATCH_PORTRAITS_V560[patchCharacterKey(change)] ||
      ('assets/home/patches/' + patchId(note) + '/portrait_' + slug(change.character || '') + '.webp');
  }

  function exactPatchSkill(note, change) {
    var skillName = String(change.skill_name || change.skill || '');
    if (!skillName || norm(skillName) === 'hp') return '';
    return PATCH_SKILLS_V560[patchSkillKey(change)] ||
      ('assets/home/patches/' + patchId(note) + '/skill_' + slug(change.character || '') + '_' + slug(skillName) + '.png');
  }

  function forEachPatchChange(callback) {
    patchNotes().forEach(function (note) {
      values(note.details || note.sections || note.groups).forEach(function (section) {
        values(section.changes || section.items).forEach(function (change) {
          if (change && typeof change === 'object') callback(note, section, change);
        });
      });
    });
  }

  function restorePatchData() {
    forEachPatchChange(function (note, section, change) {
      change.portrait = exactPatchPortrait(note, change);
      var skill = exactPatchSkill(note, change);
      if (skill) change.skill_image = skill;
      if (norm(change.style).indexOf('factor fusion') >= 0) {
        change.style_key = 'all_for_one_strike';
        change.role = 'strike';
      }
    });
  }

  function patchLookup() {
    var bySkill = {};
    var byCharacter = {};
    forEachPatchChange(function (note, section, change) {
      var charKey = norm(change.character) + '|' + norm(change.style);
      var skillKey = charKey + '|' + norm(change.skill_name || change.skill);
      if (!byCharacter[charKey]) byCharacter[charKey] = exactPatchPortrait(note, change);
      if (!bySkill[skillKey]) bySkill[skillKey] = exactPatchSkill(note, change);
    });
    return { bySkill: bySkill, byCharacter: byCharacter };
  }

  function repairPatchModal(root) {
    restorePatchData();
    root = root || document;
    var lookup = patchLookup();
    var articles = Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll(
      '.s18PatchCharacterV10,.patchCharacter,.patchCharacterCard,[data-patch-character]'
    ) : []);
    articles.forEach(function (article) {
      var characterNode = article.querySelector('.s18PatchCharacterNameV10,h3,h4,[data-character-name]');
      var styleNode = article.querySelector('.s18PatchStyleV10,.styleName,[data-style-name]');
      var character = characterNode ? characterNode.textContent : '';
      var style = styleNode ? styleNode.textContent : '';
      var charKey = norm(character) + '|' + norm(style);
      var portrait = article.querySelector('.s18PatchPortraitV10 img,.patchPortrait img,img[data-patch-portrait]');
      if (portrait && lookup.byCharacter[charKey]) portrait.src = lookup.byCharacter[charKey];

      Array.prototype.slice.call(article.querySelectorAll('.s18PatchChangeV10,.patchChange,[data-patch-change]')).forEach(function (changeNode) {
        var titleNode = changeNode.querySelector('.s18PatchSkillNameV10,h4,h5,[data-skill-name]');
        var skillName = titleNode ? titleNode.textContent : '';
        var key = charKey + '|' + norm(skillName);
        var image = changeNode.querySelector('.s18PatchSkillV10 img,.patchSkill img,img[data-skill-image]');
        if (image && lookup.bySkill[key]) image.src = lookup.bySkill[key];
      });
    });

    Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll('img') : []).forEach(function (img) {
      var context = norm((img.alt || '') + ' ' + (img.closest && img.closest('article,.card,.s18PatchChangeV10') || {}).textContent);
      if (context.indexOf('factor fusion') >= 0 && /overhaul/i.test(img.src || '')) {
        img.src = 'assets/all_for_one/all_for_one_strike/portrait.png';
      }
    });
  }

  var EN_REPLACEMENTS = [
    [/^Découvre, filtre et partage les créations de la communauté MHUR\.?$/i, 'Discover, filter and share MHUR community creations.'],
    [/^\+?\s*Publier un mod$/i, '+ Publish a mod'],
    [/^Toutes les catégories$/i, 'All categories'],
    [/^Tous les personnages$/i, 'All characters'],
    [/^(\d+)\s+mods?\s+trouvés?$/i, '$1 mods found'],
    [/^Empreinte SHA-256$/i, 'SHA-256 fingerprint'],
    [/^Modifier$/i, 'Edit'],
    [/^Supprimer$/i, 'Delete'],
    [/^Aucune description\.?$/i, 'No description.'],
    [/^BUILD COMMUNAUTAIRE$/i, 'COMMUNITY BUILD'],
    [/^Tenue de Héros\s*[—-]\s*Original$/i, 'Hero Costume — Original'],
    [/^Par$/i, 'By'],
    [/^Signaler$/i, 'Report'],
    [/^Vérifier$/i, 'Verify'],
    [/^Masquer$/i, 'Hide'],
    [/^Votre build$/i, 'Your build'],
    [/^Défense PV \+$/i, 'HP Defense +'],
    [/^Rapid du sprint \+$/i, 'Sprint Speed +'],
    [/^Analyse du champ de bataille$/i, 'Battlefield Analysis'],
    [/^Charge PU destructeur$/i, 'Destructive PU Charge'],
    [/^Installer des mods - PC Steam uniquement$/i, 'Install mods - PC Steam only'],
    [/^Clique ici pour ouvrir le tutoriel$/i, 'Click here to open the tutorial'],
    [/^Voir le tutoriel$/i, 'Open tutorial']
  ];

  var FR_REPLACEMENTS = [
    [/^Discover, filter and share MHUR community creations\.?$/i, 'Découvre, filtre et partage les créations de la communauté MHUR.'],
    [/^\+?\s*Publish a mod$/i, '+ Publier un mod'],
    [/^All categories$/i, 'Toutes les catégories'],
    [/^All characters$/i, 'Tous les personnages'],
    [/^(\d+)\s+mods?\s+found$/i, '$1 mods trouvés'],
    [/^SHA-256 fingerprint$/i, 'Empreinte SHA-256'],
    [/^Edit$/i, 'Modifier'],
    [/^Delete$/i, 'Supprimer'],
    [/^No description\.?$/i, 'Aucune description.'],
    [/^COMMUNITY BUILD$/i, 'BUILD COMMUNAUTAIRE'],
    [/^Hero Costume\s*[—-]\s*Original$/i, 'Tenue de Héros — Original'],
    [/^By$/i, 'Par'],
    [/^Report$/i, 'Signaler'],
    [/^Verify$/i, 'Vérifier'],
    [/^Hide$/i, 'Masquer'],
    [/^Your build$/i, 'Votre build']
  ];

  function translateMixedText(text) {
    var result = String(text || '').trim();
    var replacements = currentLanguage() === 'en' ? EN_REPLACEMENTS : FR_REPLACEMENTS;
    for (var i = 0; i < replacements.length; i += 1) {
      if (replacements[i][0].test(result)) return result.replace(replacements[i][0], replacements[i][1]);
    }
    if (currentLanguage() === 'en') {
      result = result
        .replace(/\bPV Max\b/g, 'Max HP')
        .replace(/\bDéfense\b/g, 'Defense')
        .replace(/\bHauteur saut vertical\b/g, 'Vertical Jump Height')
        .replace(/\bHauteur saut sur les murs\b/g, 'Wall Jump Height')
        .replace(/\bRechargement\b/g, 'Reload Speed')
        .replace(/\bAttack Power de l['’]Alter\b/g, 'Quirk Skill Attack Power')
        .replace(/\bQuirk Skill Défense\b/g, 'Quirk Skill Defense')
        .replace(/\ben état critique\b/g, 'while in critical state');
    }
    return result;
  }

  function translateTextTree(root) {
    if (!root || !document.createTreeWalker) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.parentElement || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    var current;
    while ((current = walker.nextNode())) nodes.push(current);
    nodes.forEach(function (node) {
      var original = node.nodeValue;
      var leading = original.match(/^\s*/)[0];
      var trailing = original.match(/\s*$/)[0];
      var translated = translateMixedText(original.trim());
      if (translated !== original.trim()) node.nodeValue = leading + translated + trailing;
    });
  }

  function repairTranslations(root) {
    root = root || document;
    var scopes = Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll(
      '.modsPage,.modsModal,.communityModsPage,.cbModalPanel,.communityBuildModal,[data-page="mods"]'
    ) : []);
    if (root.matches && root.matches('.modsPage,.modsModal,.communityModsPage,.cbModalPanel,.communityBuildModal,[data-page="mods"]')) scopes.unshift(root);
    if (!scopes.length) {
      var app = document.getElementById('app');
      if (app) scopes.push(app);
    }
    scopes.forEach(translateTextTree);

    Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll('input[placeholder],textarea[placeholder]') : []).forEach(function (field) {
      var placeholder = field.getAttribute('placeholder') || '';
      if (currentLanguage() === 'en' && /Rechercher par nom, auteur, personnage/i.test(placeholder)) {
        field.setAttribute('placeholder', 'Search by name, author or character...');
      } else if (currentLanguage() === 'fr' && /Search by name, author or character/i.test(placeholder)) {
        field.setAttribute('placeholder', 'Rechercher par nom, auteur, personnage...');
      }
    });
    Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll('option') : []).forEach(function (option) {
      var translated = translateMixedText(option.textContent);
      if (translated !== option.textContent.trim()) option.textContent = translated;
    });
  }

  function repairModsTutorial(root) {
    root = root || document;
    var detailsList = Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll(
      '.modsTutorial,details[class*="modsTutorial"],details[data-mods-tutorial],details:has(summary.mhurModsSummaryV559)'
    ) : []);
    Array.prototype.slice.call(root.querySelectorAll ? root.querySelectorAll('details') : []).forEach(function (details) {
      var text = norm(details.querySelector('summary') ? details.querySelector('summary').textContent : '');
      if ((text.indexOf('install mods') >= 0 || text.indexOf('installer des mods') >= 0) && detailsList.indexOf(details) < 0) detailsList.push(details);
    });
    detailsList.forEach(function (details) {
      var summary = details.querySelector(':scope > summary') || details.querySelector('summary');
      if (!summary) return;
      summary.classList.add('mhurModsSummaryV560');
      Array.prototype.slice.call(summary.querySelectorAll('.mhurModsArrowV559,.mhurModsArrowV558')).forEach(function (arrow) {
        arrow.remove();
      });
      var arrows = Array.prototype.slice.call(summary.querySelectorAll('.mhurModsArrowV560'));
      var arrow = arrows.shift();
      arrows.forEach(function (duplicate) { duplicate.remove(); });
      if (!arrow) {
        arrow = document.createElement('span');
        arrow.className = 'mhurModsArrowV560';
        arrow.setAttribute('aria-hidden', 'true');
        summary.appendChild(arrow);
      }
    });
    try {
      if (typeof window.MHUR_SYNC_TUTORIAL_IMAGES === 'function') window.MHUR_SYNC_TUTORIAL_IMAGES();
    } catch (_) {}
  }

  function removeObjectObject(root) {
    root = root || document;
    if (!document.createTreeWalker) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (node.parentElement && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return /\[object Object\]/i.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (textNode) {
      textNode.nodeValue = (textNode.nodeValue || '').replace(/\[object Object\]/gi, '').trim();
      var parent = textNode.parentElement;
      if (parent && !parent.textContent.trim() && parent.matches('button.toggle,button.mhurStatsToggleV559')) parent.remove();
    });
  }

  function repair(root) {
    root = root || document;
    restorePatchData();
    repairDiscounts(root);
    syncCostumeBadges(root);
    syncCharacterBadges(root);
    syncReleaseBadges(root);
    syncTierListBadge(root);
    restoreContextTags(root);
    repairPatchModal(root);
    repairTranslations(root);
    repairModsTutorial(root);
    removeObjectObject(root);
    document.documentElement.dataset.mhurV560 = VERSION;
  }

  var scheduled = false;
  function scheduleRepair() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      repair(document);
    });
  }

  function installRenderHook() {
    try {
      if (typeof window.render === 'function' && !window.render.__mhurV560) {
        var previous = window.render;
        var wrapped = function () {
          var output = previous.apply(this, arguments);
          scheduleRepair();
          setTimeout(scheduleRepair, 40);
          return output;
        };
        wrapped.__mhurV560 = true;
        window.render = wrapped;
        try { render = wrapped; } catch (_) {}
      }
    } catch (_) {}
  }

  document.addEventListener('click', function () {
    restorePatchData();
    setTimeout(scheduleRepair, 0);
    setTimeout(scheduleRepair, 80);
    setTimeout(scheduleRepair, 240);
  }, true);

  document.addEventListener('change', function () {
    setTimeout(scheduleRepair, 0);
    setTimeout(scheduleRepair, 100);
  }, true);

  function boot() {
    restorePatchData();
    installRenderHook();
    repair(document);
    /* Pas de MutationObserver global : il provoquait des micro-rechargements
       visuels quand plusieurs anciens correctifs réécrivaient le même écran. */
    setTimeout(scheduleRepair, 250);
    setTimeout(scheduleRepair, 900);
  }

  window.MHUR_V560 = {
    repair: repair,
    restorePatchData: restorePatchData,
    version: VERSION
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
