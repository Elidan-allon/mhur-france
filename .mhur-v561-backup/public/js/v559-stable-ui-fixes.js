/* ========================================================================== */
/* MHUR FRANCE — V559 STABLE UI FIXES                                         */
/* - accordéons de statistiques réellement cliquables ;                       */
/* - aucune chaîne [object Object] ;                                           */
/* - portraits officiels + fond de rôle pour les réductions ;                  */
/* - badges NEW synchronisés sans boucle de MutationObserver ;                 */
/* - animation agrandir/rétrécir sur tous les NEW ;                            */
/* - image de compétence liée au bon Alter dans les patch notes ;              */
/* - traductions FR/EN ciblées et flèche du tutoriel des mods.                  */
/* ========================================================================== */
(function () {
  'use strict';

  var VERSION = '559';
  var NEW_BADGE_SELECTOR = [
    '.s18NewBadge',
    '.s18NewBadgeV9',
    '.s18NewBadgeV24',
    '.s18PlannedNewV12',
    '.s18SeasonNewV10',
    '.mhurCharacterNewV554',
    '.mhurCharacterNewV555',
    '.mhurCostumeNewV554',
    '.mhurCostumeNewV555',
    '.mhurNewV556',
    '.mhurNewV558',
    '.mhurNewV559'
  ].join(',');

  function currentLanguage() {
    try {
      if (typeof lang !== 'undefined' && (lang === 'fr' || lang === 'en')) return lang;
    } catch (_) {}

    var stored = '';
    try {
      stored = localStorage.getItem('mhur_lang') ||
        localStorage.getItem('mhurLang') ||
        localStorage.getItem('lang') || '';
    } catch (_) {}

    return stored === 'en' || String(document.documentElement.lang || '').toLowerCase().indexOf('en') === 0
      ? 'en'
      : 'fr';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[character];
    });
  }

  function localizedText(value, fallback, seen) {
    if (value == null) return fallback == null ? '' : String(fallback);
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      var primitive = String(value);
      return primitive === '[object Object]' ? (fallback == null ? '' : String(fallback)) : primitive;
    }

    seen = seen || new Set();
    if (seen.has(value)) return fallback == null ? '' : String(fallback);
    seen.add(value);

    if (Array.isArray(value)) {
      for (var arrayIndex = 0; arrayIndex < value.length; arrayIndex += 1) {
        var arrayValue = localizedText(value[arrayIndex], '', seen).trim();
        if (arrayValue) return arrayValue;
      }
      return fallback == null ? '' : String(fallback);
    }

    if (typeof value === 'object') {
      var language = currentLanguage();
      var priority = language === 'en'
        ? ['en', 'en_us', 'en-US', 'english', 'fr', 'fr_fr', 'fr-FR', 'text', 'label', 'title', 'name', 'value', 'description', 'note']
        : ['fr', 'fr_fr', 'fr-FR', 'french', 'en', 'en_us', 'en-US', 'text', 'label', 'title', 'name', 'value', 'description', 'note'];

      for (var keyIndex = 0; keyIndex < priority.length; keyIndex += 1) {
        var key = priority[keyIndex];
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
        var selected = localizedText(value[key], '', seen).trim();
        if (selected) return selected;
      }

      var keys = Object.keys(value);
      for (var index = 0; index < keys.length; index += 1) {
        var candidate = localizedText(value[keys[index]], '', seen).trim();
        if (candidate) return candidate;
      }
    }

    return fallback == null ? '' : String(fallback);
  }

  function normalize(value) {
    var text = localizedText(value, '');
    try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return text.toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9αβγ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalizeKey(value) {
    return normalize(value).replace(/\s+/g, '_');
  }

  function assetPath(value) {
    if (value && typeof value === 'object') {
      value = value.src || value.url || value.path || value.image || value.img || value[currentLanguage()] || value.fr || value.en || '';
    }
    var raw = String(value || '').trim();
    if (!raw || raw === '[object Object]') return '';
    if (/^(?:https?:)?\/\//i.test(raw) || raw.indexOf('data:') === 0 || raw.indexOf('blob:') === 0) return raw;
    return raw.replace(/^\/+/, '');
  }

  function sourceValues(source) {
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

  /* ------------------------------------------------------------------------ */
  /* TABLEAUX D'ALTER                                                         */
  /* ------------------------------------------------------------------------ */

  var TABLE_TO_EN = [
    [/\bEffets? de montée(?: de niveau)?\b/gi, 'Level-up Effects'],
    [/\bEffets? d'amélioration de niveau\b/gi, 'Level-up Effects'],
    [/\bValeurs?\b/gi, 'Values'],
    [/\bDégâts\b/gi, 'Damage'],
    [/\bMunitions\b/gi, 'Ammo'],
    [/\bRecharge\b/gi, 'Reload'],
    [/\bConsommation\b/gi, 'Ammo Use'],
    [/\bDurée\b/gi, 'Duration'],
    [/\bPortée\b/gi, 'Range'],
    [/\bTaille\b/gi, 'Size'],
    [/\bNiveau\b/gi, 'Level'],
    [/\bAvant\b/gi, 'Before'],
    [/\bAprès\b/gi, 'After'],
    [/\bProjectile renforcé\b/gi, 'Enhanced Projectile'],
    [/\bProjectile\b/gi, 'Projectile'],
    [/\bBalle\b/gi, 'Bullet']
  ];

  var TABLE_TO_FR = [
    [/\bLevel[- ]?up Effects?\b/gi, 'Effets de montée'],
    [/\bValues?\b/gi, 'Valeurs'],
    [/\bDamage\b/gi, 'Dégâts'],
    [/\bAmmo Use\b/gi, 'Consommation'],
    [/\bAmmo\b/gi, 'Munitions'],
    [/\bReload\b/gi, 'Recharge'],
    [/\bDuration\b/gi, 'Durée'],
    [/\bRange\b/gi, 'Portée'],
    [/\bSize\b/gi, 'Taille'],
    [/\bLevel\b/gi, 'Niveau'],
    [/\bBefore\b/gi, 'Avant'],
    [/\bAfter\b/gi, 'Après'],
    [/\bEnhanced Projectile\b/gi, 'Projectile renforcé'],
    [/\bProjectile\b/gi, 'Projectile'],
    [/\bBullet\b/gi, 'Balle']
  ];

  function translateTableText(value) {
    var text = localizedText(value, '').replace(/\s+/g, ' ').trim();
    var replacements = currentLanguage() === 'en' ? TABLE_TO_EN : TABLE_TO_FR;
    for (var index = 0; index < replacements.length; index += 1) {
      text = text.replace(replacements[index][0], replacements[index][1]);
    }
    return text.replace(/\s{2,}/g, ' ').trim();
  }

  function isLevelUpTitle(value) {
    var text = normalize(value);
    return text.indexOf('level up effect') >= 0 ||
      text.indexOf('levelup effect') >= 0 ||
      text.indexOf('effet de montee') >= 0 ||
      text.indexOf('effets de montee') >= 0 ||
      text.indexOf('effet d amelioration de niveau') >= 0;
  }

  function renderTablesV559(items) {
    var ordered = (Array.isArray(items) ? items.slice() : [])
      .map(function (item, index) { return { item: item || {}, index: index, level: isLevelUpTitle(item && item.title) }; })
      .sort(function (left, right) {
        if (left.level !== right.level) return left.level ? -1 : 1;
        return left.index - right.index;
      });

    return '<div class="tables mhurTablesV559">' + ordered.map(function (entry) {
      var table = entry.item;
      var title = translateTableText(table.title || table.label || table.name || '');
      var columns = Array.isArray(table.cols) ? table.cols : (Array.isArray(table.columns) ? table.columns : []);
      var rows = Array.isArray(table.rows) ? table.rows : (Array.isArray(table.values) ? table.values : []);

      return '<button type="button" class="toggle mhurStatsToggleV559" aria-expanded="false"' +
        (entry.level ? ' data-mhur-level-up="1"' : '') + '>' +
        '<span class="statsToggleTitle">' + escapeHtml(title) + '</span>' +
        '<span class="statsToggleArrow" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="simpleTable hidden mhurStatsPanelV559" hidden aria-hidden="true">' +
        '<table class="dataTable"><thead><tr>' + columns.map(function (column) {
          return '<th>' + escapeHtml(translateTableText(column)) + '</th>';
        }).join('') + '</tr></thead><tbody>' + rows.map(function (row) {
          var cells = Array.isArray(row) ? row : sourceValues(row);
          return '<tr>' + cells.map(function (cell) {
            return '<td>' + escapeHtml(translateTableText(cell)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    }).join('') + '</div>';
  }

  function installTableRenderer() {
    try {
      if (typeof tables !== 'undefined') tables = renderTablesV559;
    } catch (_) {}
    window.tables = renderTablesV559;
  }

  function tablePairs(container) {
    var children = Array.prototype.slice.call(container.children || []);
    var pairs = [];
    for (var index = 0; index < children.length; index += 1) {
      var button = children[index];
      if (!button.classList || !button.classList.contains('toggle')) continue;
      var panel = children[index + 1];
      pairs.push({
        button: button,
        panel: panel && panel.classList && panel.classList.contains('simpleTable') ? panel : null,
        index: index,
        level: isLevelUpTitle(button.querySelector('.statsToggleTitle') ? button.querySelector('.statsToggleTitle').textContent : button.textContent)
      });
    }
    return pairs;
  }

  function normalizeExistingTables(root) {
    root = root || document;
    if (!root.querySelectorAll) return;

    var containers = Array.prototype.slice.call(root.querySelectorAll('.skillText .tables, .tables.mhurTablesV559'));
    if (root.matches && root.matches('.skillText .tables, .tables.mhurTablesV559')) containers.unshift(root);

    containers.forEach(function (container) {
      var pairs = tablePairs(container);
      pairs.sort(function (left, right) {
        if (left.level !== right.level) return left.level ? -1 : 1;
        return left.index - right.index;
      }).forEach(function (pair) {
        container.appendChild(pair.button);
        if (pair.panel) container.appendChild(pair.panel);
      });

      tablePairs(container).forEach(function (pair) {
        var button = pair.button;
        var panel = pair.panel;
        if (!panel) return;

        button.type = 'button';
        var titleNode = button.querySelector('.statsToggleTitle');
        if (titleNode) titleNode.textContent = translateTableText(titleNode.textContent);
        panel.querySelectorAll('th,td').forEach(function (cell) {
          cell.textContent = translateTableText(cell.textContent);
        });

        var open = button.getAttribute('aria-expanded') === 'true';
        panel.style.removeProperty('display');
        panel.hidden = !open;
        panel.setAttribute('aria-hidden', String(!open));
        panel.classList.toggle('hidden', !open);
        panel.classList.toggle('mhurStatsPanelOpenV559', open);
        button.classList.toggle('mhurStatsToggleOpenV559', open);
      });
    });
  }

  function onTableToggle(event) {
    var target = event.target && event.target.closest
      ? event.target.closest('.skillText .tables > .toggle, .tables.mhurTablesV559 > .toggle')
      : null;
    if (!target) return;

    var panel = target.nextElementSibling;
    if (!panel || !panel.classList.contains('simpleTable')) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    var open = target.getAttribute('aria-expanded') !== 'true';
    target.setAttribute('aria-expanded', String(open));
    target.classList.toggle('mhurStatsToggleOpenV559', open);
    panel.style.removeProperty('display');
    panel.hidden = !open;
    panel.setAttribute('aria-hidden', String(!open));
    panel.classList.toggle('hidden', !open);
    panel.classList.toggle('mhurStatsPanelOpenV559', open);
  }

  /* ------------------------------------------------------------------------ */
  /* RÉDUCTIONS DE POINTS                                                     */
  /* ------------------------------------------------------------------------ */

  var DISCOUNT_CONFIG = {
    d_j_board: {
      style: 'present_mic_technical',
      role: 'technical',
      fallback: 'assets/present_mic/present_mic_technical/portrait.png'
    },
    dj_board: {
      style: 'present_mic_technical',
      role: 'technical',
      fallback: 'assets/present_mic/present_mic_technical/portrait.png'
    },
    flow_runner: {
      style: 'aizawa_strike',
      role: 'strike',
      fallback: 'assets/aizawa/aizawa_strike/portrait.png'
    },
    gentle_criminal: {
      style: 'gentle_criminal_technical',
      role: 'technical',
      fallback: 'assets/gentle_criminal/gentle_criminal_technical/portrait.png'
    },
    factor_fusion: {
      style: 'overhaul_assault',
      role: 'assault',
      fallback: 'assets/overhaul/overhaul_assault/portrait.png'
    },
    cluster: {
      style: 'bakugo_technical',
      role: 'technical',
      fallback: 'assets/bakugo/bakugo_technical/portrait.png'
    },
    mirko: {
      style: 'mirko_rapid',
      role: 'rapid',
      fallback: 'assets/mirko/mirko_rapid/portrait.png'
    }
  };

  function roleKey(value) {
    var key = normalize(value);
    if (/assault|assaut|defense/.test(key)) return 'assault';
    if (/strike|attack|attaque/.test(key)) return 'strike';
    if (/rapid|speed|vitesse/.test(key)) return 'rapid';
    if (/support|soutien/.test(key)) return 'support';
    return 'technical';
  }

  function roleLabel(value) {
    var role = roleKey(value);
    var english = currentLanguage() === 'en';
    if (role === 'assault') return english ? 'Assault' : 'Assaut';
    if (role === 'strike') return english ? 'Strike' : 'Attaque';
    if (role === 'rapid') return english ? 'Rapid' : 'Vitesse';
    if (role === 'support') return english ? 'Support' : 'Soutien';
    return english ? 'Technical' : 'Technique';
  }

  function discountItems() {
    var home = window.MHUR_HOME_DATA || {};
    return sourceValues(home.discounts || home.character_discounts || home.characterDiscounts || window.MHUR_DISCOUNTS || []);
  }

  function discountMeta(item) {
    var name = localizedText(item && (item.name || item.title || item.character || item.style), currentLanguage() === 'en' ? 'Character' : 'Personnage');
    var config = DISCOUNT_CONFIG[normalizeKey(name)] || {};
    var styleId = String(item && (item.style_id || item.styleId) || config.style || '');
    var database = window.MHUR_DATABASE_ASSETS && window.MHUR_DATABASE_ASSETS.styles || {};
    var official = window.MHUR_SEASON18_DATA && window.MHUR_SEASON18_DATA.official_portraits || {};
    var portrait = assetPath(
      database[styleId] && database[styleId].portrait ||
      official[styleId] ||
      config.fallback ||
      item && (item.portrait || item.image || item.img)
    );
    var role = roleKey(item && (item.role || item.type || item.class) || config.role || styleId);
    var points = item && (item.points != null ? item.points : (item.cost != null ? item.cost : (item.value != null ? item.value : item.discount_points)));
    return { name: name, style: styleId, portrait: portrait, role: role, points: points == null ? '' : String(points) };
  }

  function discountCardHtml(item) {
    var meta = discountMeta(item);
    var fallback = DISCOUNT_CONFIG[normalizeKey(meta.name)] && DISCOUNT_CONFIG[normalizeKey(meta.name)].fallback || '';
    return '<article class="discountCardV296 mhurDiscountCardV559 role-' + escapeHtml(meta.role) + '" data-discount="' + escapeHtml(normalizeKey(meta.name)) + '">' +
      '<div class="mhurDiscountPortraitV559 role-' + escapeHtml(meta.role) + '">' +
      '<span class="mhurDiscountRoleGlowV559" aria-hidden="true"></span>' +
      '<img src="' + escapeHtml(meta.portrait) + '" data-fallback="' + escapeHtml(fallback) + '" alt="' + escapeHtml(meta.name) + '" loading="eager" decoding="async">' +
      '</div>' +
      '<strong class="mhurDiscountNameV559">' + escapeHtml(meta.name) + '</strong>' +
      '<div class="mhurDiscountRoleV559 role-' + escapeHtml(meta.role) + '"><span class="mhurDiscountRoleDotV559" aria-hidden="true"></span>' + escapeHtml(roleLabel(meta.role)) + '</div>' +
      '<b class="mhurDiscountPointsV559">' + escapeHtml(meta.points) + '</b>' +
      '</article>';
  }

  function discountGridHtml() {
    var list = discountItems();
    if (!list.length) return '<div class="emptyV296">' + (currentLanguage() === 'en' ? 'No discount.' : 'Aucune réduction.') + '</div>';
    return list.map(discountCardHtml).join('');
  }

  function discountSignature() {
    return currentLanguage() + '|' + discountItems().map(function (item) {
      var meta = discountMeta(item);
      return [meta.name, meta.style, meta.role, meta.points, meta.portrait].join(':');
    }).join('|');
  }

  function repairDiscounts(root) {
    root = root || document;
    if (!root.querySelectorAll) return;
    var grids = Array.prototype.slice.call(root.querySelectorAll('.discountGridV296,[data-discount-grid],#discountGrid'));
    if (root.matches && root.matches('.discountGridV296,[data-discount-grid],#discountGrid')) grids.unshift(root);
    var signature = discountSignature();
    var html = discountGridHtml();

    grids.forEach(function (grid) {
      if (grid.dataset.mhurDiscountV559 === signature) return;
      grid.innerHTML = html;
      grid.dataset.mhurDiscountV559 = signature;
    });
  }

  function wrapHomeDashboard() {
    if (typeof window.renderHomeDashboard !== 'function' || window.renderHomeDashboard.__mhurV559) return;
    var original = window.renderHomeDashboard;
    var wrapped = function () {
      var html = original.apply(this, arguments);
      try {
        var template = document.createElement('template');
        template.innerHTML = String(html || '').trim();
        var grid = template.content.querySelector('.discountGridV296,[data-discount-grid],#discountGrid');
        if (grid) {
          grid.innerHTML = discountGridHtml();
          grid.dataset.mhurDiscountV559 = discountSignature();
          return template.innerHTML;
        }
      } catch (_) {}
      return html;
    };
    wrapped.__mhurV559 = true;
    window.renderHomeDashboard = wrapped;
    try { renderHomeDashboard = wrapped; } catch (_) {}
  }

  function onDiscountImageError(event) {
    var image = event.target;
    if (!image || !image.matches || !image.matches('.mhurDiscountPortraitV559 img')) return;
    var fallback = assetPath(image.dataset.fallback || '');
    if (fallback && assetPath(image.getAttribute('src')) !== fallback) {
      image.src = fallback;
      return;
    }
    image.classList.add('mhurDiscountImageMissingV559');
  }

  /* ------------------------------------------------------------------------ */
  /* BADGES NEW                                                               */
  /* ------------------------------------------------------------------------ */

  function costumeId(card) {
    if (!card) return '';
    var candidates = [
      card.dataset && card.dataset.costume,
      card.dataset && card.dataset.costumeId,
      card.dataset && card.dataset.id,
      card.getAttribute && card.getAttribute('data-costume'),
      card.getAttribute && card.getAttribute('data-costume-id'),
      card.getAttribute && card.getAttribute('data-id'),
      card.id,
      card.getAttribute && card.getAttribute('onclick'),
      card.getAttribute && card.getAttribute('href'),
      card.outerHTML
    ];
    for (var index = 0; index < candidates.length; index += 1) {
      var match = String(candidates[index] || '').match(/(?:ur[_-]?)?(\d{4,})/i);
      if (match) return match[1];
    }
    return '';
  }

  function activeNewSets() {
    var sync = window.MHUR_SEASON18_DATA || {};
    var source = sync.active_new_content || sync.new_content || {};
    var characters = new Set((source.characters || []).map(String));
    var styles = new Set((source.styles || []).map(String));
    var costumes = new Set((source.costumes || []).map(String));

    var latest = sourceValues(window.MHUR_HOME_DATA && window.MHUR_HOME_DATA.latest_releases || []);
    var now = Date.now();
    latest.forEach(function (item) {
      var release = Date.parse(item && item.releaseDate || '');
      if (Number.isFinite(release) && release > now) return;
      if (String(item && item.release_kind || '').toLowerCase() === 'character' && item.character_id) characters.add(String(item.character_id));
      if (String(item && item.release_kind || '').toLowerCase() === 'style' && item.style_id) styles.add(String(item.style_id));
    });

    return { characters: characters, styles: styles, costumes: costumes };
  }

  function cardIdentity(card, attributes) {
    var parts = [];
    (attributes || []).forEach(function (attribute) {
      var value = card.getAttribute && card.getAttribute(attribute);
      if (value) parts.push(value);
    });
    if (card.id) parts.push(card.id);
    var clickable = card.querySelector && card.querySelector('[onclick],a[href]');
    if (clickable) parts.push(clickable.getAttribute('onclick') || '', clickable.getAttribute('href') || '');
    return normalize(parts.join(' '));
  }

  function ownBadges(card) {
    return Array.prototype.slice.call(card.querySelectorAll(NEW_BADGE_SELECTOR)).filter(function (badge) {
      var owner = badge.closest('.card[data-char],.characterCard,.styleCard,.quirkSetCard,.costumeTile,.costumeCard,.s18CostumeTileV19');
      return !owner || owner === card;
    });
  }

  function setNewBadge(card, active) {
    if (!card) return;
    if (card.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23,[data-upcoming="true"],[aria-disabled="true"]')) active = false;

    var badges = ownBadges(card);
    if (!active) {
      badges.forEach(function (badge) { badge.remove(); });
      card.classList.remove('mhurHasNewV559');
      return;
    }

    var badge = badges[0] || null;
    badges.slice(1).forEach(function (extra) { extra.remove(); });
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 's18NewBadge s18NewBadgeV9 mhurNewV559';
      badge.textContent = 'NEW!';
      badge.setAttribute('aria-label', 'New');
      card.insertBefore(badge, card.firstChild);
    }
    badge.classList.add('mhurNewV559', 'mhurNewPulseV559');
    badge.dataset.mhurNewPulse = '1';
    card.classList.add('mhurHasNewV559');
  }

  function syncNewBadges(root) {
    root = root || document;
    if (!root.querySelectorAll) return;
    var sets = activeNewSets();

    root.querySelectorAll('.card[data-char],.characterCard[data-char],.characterCard[data-character],.s18CharacterCardV12').forEach(function (card) {
      var id = String(card.dataset.char || card.dataset.character || '').trim();
      var identity = cardIdentity(card, ['data-char', 'data-character', 'data-character-id']);
      var active = sets.characters.has(id) || Array.from(sets.characters).some(function (candidate) { return candidate && identity.indexOf(normalize(candidate)) >= 0; });
      setNewBadge(card, active);
    });

    root.querySelectorAll('.styleCard[data-style],.quirkSetCard,[data-style-card],.s18StyleCardV12').forEach(function (card) {
      var id = String(card.dataset.style || card.dataset.styleId || '').trim();
      var identity = cardIdentity(card, ['data-style', 'data-style-id']);
      var active = sets.styles.has(id) || Array.from(sets.styles).some(function (candidate) { return candidate && identity.indexOf(normalize(candidate)) >= 0; });
      setNewBadge(card, active);
    });

    root.querySelectorAll('.costumeTile,.costumeCard,[data-costume-card],.s18CostumeTileV19').forEach(function (card) {
      var id = costumeId(card);
      var active = Boolean(id && sets.costumes.has(id));

      /* La galerie « Loisirs d'été » montrée comme ancienne ne doit plus garder NEW. */
      var groupText = normalize((card.closest('.costumeGalleryGroup,.costumeGroup,.s18CostumeGroupV19') || card.parentElement || card).textContent || '');
      if (groupText.indexOf('loisirs d ete') >= 0 || groupText.indexOf('summer leisure') >= 0) active = false;

      setNewBadge(card, active);
    });

    animateEveryNew(root);
  }

  function animateEveryNew(root) {
    root = root || document;
    if (!root.querySelectorAll) return;
    var candidates = Array.prototype.slice.call(root.querySelectorAll(NEW_BADGE_SELECTOR + ',[data-word="NEW!"],.newBadge,.new-badge'));
    root.querySelectorAll('span,b,strong,em').forEach(function (node) {
      if (String(node.textContent || '').trim().toUpperCase() === 'NEW!' && candidates.indexOf(node) < 0) candidates.push(node);
    });
    candidates.forEach(function (badge) {
      badge.classList.add('mhurNewPulseV559');
      badge.dataset.mhurNewPulse = '1';
    });
  }

  /* ------------------------------------------------------------------------ */
  /* PATCH NOTES : BON ALTER / BONNE COMPÉTENCE                               */
  /* ------------------------------------------------------------------------ */

  var STYLE_ALIASES = [
    { character: /gentle/, style: /.*/, key: 'gentle_criminal_technical' },
    { character: /bakugo|katsuki/, style: /cluster/, key: 'bakugo_technical' },
    { character: /aizawa|shota/, style: /flow runner|strike/, key: 'aizawa_strike' },
    { character: /present mic|hizashi/, style: /d j board|technical/, key: 'present_mic_technical' },
    { character: /overhaul|kai chisaki/, style: /factor fusion|assault/, key: 'overhaul_assault' },
    { character: /mirko|rumi/, style: /.*/, key: 'mirko_rapid' }
  ];

  function styleKeyFor(character, style) {
    var characterText = normalize(character);
    var styleText = normalize(style);
    for (var index = 0; index < STYLE_ALIASES.length; index += 1) {
      var alias = STYLE_ALIASES[index];
      if (alias.character.test(characterText) && alias.style.test(styleText)) return alias.key;
    }

    var database = window.MHUR_DATABASE_ASSETS && window.MHUR_DATABASE_ASSETS.styles || {};
    var keys = Object.keys(database);
    var combined = normalize(characterText + ' ' + styleText);
    var best = '';
    var bestScore = 0;
    keys.forEach(function (key) {
      var identity = normalize(key);
      var score = 0;
      identity.split(' ').forEach(function (part) { if (part.length > 2 && combined.indexOf(part) >= 0) score += 1; });
      if (score > bestScore) { best = key; bestScore = score; }
    });
    return best;
  }

  function skillAssetKey(value) {
    var raw = localizedText(value, '').toLowerCase();
    if (raw.indexOf('α') >= 0 || /(^|\s)alpha(\s|$)/.test(raw)) return 'alpha';
    if (raw.indexOf('β') >= 0 || /(^|\s)beta(\s|$)/.test(raw)) return 'beta';
    if (raw.indexOf('γ') >= 0 || /(^|\s)gamma(\s|$)/.test(raw)) return 'gamma';
    if (/special|action spéciale|action speciale/.test(raw)) return 'special';
    return '';
  }

  function sanitizeObject(value, seen) {
    if (!value || typeof value !== 'object') return value;
    seen = seen || new Set();
    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach(function (entry) { sanitizeObject(entry, seen); });
      return value;
    }

    var textKeys = ['title', 'subtitle', 'label', 'name', 'character', 'style', 'skill_name', 'description', 'note', 'text', 'tone'];
    textKeys.forEach(function (key) {
      if (value[key] != null && typeof value[key] === 'object') value[key] = localizedText(value[key], '');
    });

    Object.keys(value).forEach(function (key) {
      var child = value[key];
      if (child && typeof child === 'object') sanitizeObject(child, seen);
    });

    if (value.character || value.style || value.skill_name) {
      var styleKey = styleKeyFor(value.character || '', value.style || '');
      var skillKey = skillAssetKey(value.skill_name || value.label || value.title || '');
      var styleAssets = window.MHUR_DATABASE_ASSETS && window.MHUR_DATABASE_ASSETS.styles && window.MHUR_DATABASE_ASSETS.styles[styleKey];
      if (styleAssets) {
        if (styleAssets.portrait) value.portrait = styleAssets.portrait;
        if (skillKey && styleAssets[skillKey]) value.skill_image = styleAssets[skillKey];
      }
    }
    return value;
  }

  function sanitizePatchData() {
    var home = window.MHUR_HOME_DATA || {};
    var notes = home.patch_notes || home.patchNotes || window.MHUR_PATCH_NOTES;
    if (notes) sanitizeObject(notes);
  }

  function repairPatchModal(root) {
    root = root || document;
    var modal = root.querySelector ? root.querySelector('#s18NotesDevModalV10,.s18NotesDevModalV10,[data-patch-modal]') : null;
    if (!modal && root.matches && root.matches('#s18NotesDevModalV10,.s18NotesDevModalV10,[data-patch-modal]')) modal = root;
    if (!modal) return;

    var walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf('[object Object]') >= 0) {
        node.nodeValue = node.nodeValue.replace(/\[object Object\]/g, currentLanguage() === 'en' ? 'Details' : 'Détails');
      }
    }

    modal.querySelectorAll('.s18PatchCharacterV10,[data-patch-character]').forEach(function (article) {
      var character = localizedText(article.querySelector('h4') && article.querySelector('h4').textContent, '');
      var style = localizedText(article.querySelector('strong') && article.querySelector('strong').textContent, '');
      var styleKey = styleKeyFor(character, style);
      var styleAssets = window.MHUR_DATABASE_ASSETS && window.MHUR_DATABASE_ASSETS.styles && window.MHUR_DATABASE_ASSETS.styles[styleKey];
      if (!styleAssets) return;

      var portrait = article.querySelector('.s18PatchPortraitV10 img');
      if (portrait && styleAssets.portrait) portrait.src = assetPath(styleAssets.portrait);

      article.querySelectorAll('.s18PatchChangeV10,[data-patch-change]').forEach(function (change) {
        var title = localizedText(change.querySelector('h5') && change.querySelector('h5').textContent, '');
        var skillKey = skillAssetKey(title);
        var image = change.querySelector('.s18PatchSkillV10 img,img');
        if (image && skillKey && styleAssets[skillKey]) image.src = assetPath(styleAssets[skillKey]);
      });
    });
  }

  /* ------------------------------------------------------------------------ */
  /* MODS + TRADUCTIONS CIBLÉES                                               */
  /* ------------------------------------------------------------------------ */

  var STATIC_TRANSLATIONS = {
    en: {
      'Installer des mods - PC Steam uniquement': 'Install mods - PC Steam only',
      'Installer des mods - PC Steam seulement': 'Install mods - PC Steam only',
      'Clique ici pour ouvrir le tutoriel': 'Click here to open the tutorial',
      'Cliquez ici pour ouvrir le tutoriel': 'Click here to open the tutorial',
      'Voir le tutoriel': 'Open tutorial',
      'Ouvrir le tutoriel': 'Open tutorial',
      'Fermer le tutoriel': 'Close tutorial',
      'Réductions de points personnage': 'Character Point Discounts',
      'Clique pour choisir le style.': 'Click to select the style.',
      'Choisis un personnage pour ses costumes.': 'Choose a character to view their costumes.',
      'HÉROS': 'HEROES',
      'SUPER-VILAINS': 'VILLAINS',
      'Technique': 'Technical',
      'Attaque': 'Strike',
      'Assaut': 'Assault',
      'Vitesse': 'Rapid',
      'Soutien': 'Support'
    },
    fr: {
      'Install mods - PC Steam only': 'Installer des mods - PC Steam uniquement',
      'Click here to open the tutorial': 'Clique ici pour ouvrir le tutoriel',
      'Open tutorial': 'Voir le tutoriel',
      'Close tutorial': 'Fermer le tutoriel',
      'Character Point Discounts': 'Réductions de points personnage',
      'Click to select the style.': 'Clique pour choisir le style.',
      'Choose a character to view their costumes.': 'Choisis un personnage pour ses costumes.',
      'HEROES': 'HÉROS',
      'VILLAINS': 'SUPER-VILAINS',
      'Technical': 'Technique',
      'Strike': 'Attaque',
      'Assault': 'Assaut',
      'Rapid': 'Vitesse',
      'Support': 'Soutien'
    }
  };

  function translateStatic(root) {
    root = root || document;
    if (!root.querySelectorAll) return;
    var map = STATIC_TRANSLATIONS[currentLanguage()];
    var selector = '.modsTutorial summary,.modsTutorial button,.mhurModsSummaryV558,.mhurModsSummaryV559,.discountsV296 h2,.discountSectionV296 h2,.characterSelectHint,.cardHint,.badge,.mhurDiscountRoleV559';
    var nodes = Array.prototype.slice.call(root.querySelectorAll(selector));
    if (root.matches && root.matches(selector)) nodes.unshift(root);
    nodes.forEach(function (element) {
      if (element.children.length) return;
      var original = String(element.textContent || '').trim();
      if (map[original]) element.textContent = map[original];
    });
  }

  function repairModsTutorial(root) {
    root = root || document;
    if (!root.querySelectorAll) return;
    root.querySelectorAll('.modsTutorial,details[data-mods-tutorial],.modsTutorialV2').forEach(function (details) {
      var summary = details.querySelector(':scope > summary') || details.querySelector('summary');
      if (!summary) return;
      summary.classList.add('mhurModsSummaryV559');

      var oldArrows = Array.prototype.slice.call(summary.querySelectorAll('.modsTutorialChevronV537,.modsTutorialChevronV540,.modsTutorialChevron,.mhurModsArrow,.mhurModsArrowV558,.mhurModsArrowV559,[data-mods-arrow]'));
      var arrow = oldArrows.find(function (node) { return node.classList.contains('mhurModsArrowV559'); }) || null;
      oldArrows.forEach(function (node) { if (node !== arrow) node.remove(); });
      if (!arrow) {
        arrow = document.createElement('span');
        arrow.className = 'mhurModsArrowV559';
        arrow.setAttribute('aria-hidden', 'true');
        summary.appendChild(arrow);
      }
    });
  }

  /* ------------------------------------------------------------------------ */
  /* RÉPARATION UNIQUE APRÈS CHAQUE VRAI RENDU                                */
  /* ------------------------------------------------------------------------ */

  function repair(root) {
    root = root || document;
    installTableRenderer();
    sanitizePatchData();
    normalizeExistingTables(root);
    repairDiscounts(root);
    syncNewBadges(root);
    repairPatchModal(root);
    repairModsTutorial(root);
    translateStatic(root);
  }

  function wrapRender() {
    if (typeof window.render !== 'function' || window.render.__mhurV559) return;
    var original = window.render;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      repair(document);
      return result;
    };
    wrapped.__mhurV559 = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_) {}
  }

  function onDocumentClick(event) {
    onTableToggle(event);

    var noteButton = event.target && event.target.closest
      ? event.target.closest('[data-s18-notes-button],#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-open-patch-notes]')
      : null;
    if (noteButton) {
      sanitizePatchData();
      setTimeout(function () { repairPatchModal(document); }, 0);
    }

    var navigation = event.target && event.target.closest
      ? event.target.closest('.card[data-char],.styleCard,.costumeTile,.costumeCard,.back,[data-page],#langToggle')
      : null;
    if (navigation) {
      requestAnimationFrame(function () { repair(document); });
    }
  }

  function install() {
    installTableRenderer();
    sanitizePatchData();
    wrapHomeDashboard();
    wrapRender();
    repair(document);

    document.addEventListener('click', onDocumentClick, true);
    document.addEventListener('error', onDiscountImageError, true);
    window.addEventListener('mhur:languagechange', function () {
      sanitizePatchData();
      requestAnimationFrame(function () { repair(document); });
    });

    window.MHUR_V559 = {
      version: VERSION,
      repair: repair,
      renderTables: renderTablesV559,
      syncNewBadges: syncNewBadges,
      repairDiscounts: repairDiscounts,
      sanitizePatchData: sanitizePatchData,
      repairPatchModal: repairPatchModal
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
