/* MHUR France — Correctif V558
 * Corrige uniquement : accordéons de statistiques, patch notes Gentle Criminal,
 * badges NEW, réductions de points, flèche du tutoriel des mods et traductions FR/EN.
 */
(function () {
  'use strict';

  var VERSION = 'v558';
  var scheduled = false;
  var observer = null;
  var lastLanguage = '';

  function lang() {
    var raw = String(
      window.currentLang ||
      window.MHUR_LANG ||
      localStorage.getItem('mhurLang') ||
      localStorage.getItem('lang') ||
      document.documentElement.lang ||
      'fr'
    ).toLowerCase();
    return raw.indexOf('en') === 0 ? 'en' : 'fr';
  }

  function pick(value, fallback) {
    if (value == null) return fallback == null ? '' : fallback;
    if (Array.isArray(value)) return value.map(function (item) { return pick(item, ''); }).filter(Boolean).join(' ');
    if (typeof value === 'object') {
      var language = lang();
      var chosen = value[language] != null ? value[language] :
        (value.fr != null ? value.fr :
        (value.en != null ? value.en :
        (value.text != null ? value.text :
        (value.label != null ? value.label :
        (value.name != null ? value.name :
        (value.title != null ? value.title : ''))))));
      return pick(chosen, fallback);
    }
    var text = String(value);
    return text === '[object Object]' ? (fallback == null ? '' : fallback) : text;
  }

  function asset(value) {
    if (!value) return '';
    if (typeof value === 'object') {
      value = value.src || value.url || value.path || value.image || value.img || value[lang()] || value.fr || value.en || '';
    }
    value = String(value || '').trim();
    if (!value || value === '[object Object]') return '';
    return value;
  }

  function norm(value) {
    return pick(value, '')
      .normalize ? pick(value, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9αβγ]+/g, ' ').trim() :
      pick(value, '').toLowerCase().replace(/[^a-z0-9αβγ]+/g, ' ').trim();
  }

  function directChildren(root, selector) {
    if (!root || !root.children) return [];
    return Array.prototype.filter.call(root.children, function (child) {
      try { return child.matches(selector); } catch (error) { return false; }
    });
  }

  function setText(element, value) {
    if (!element) return;
    value = value == null ? '' : String(value);
    if (element.textContent !== value) element.textContent = value;
  }

  /* ------------------------------------------------------------------
   * 1) Accordéons des tableaux de statistiques
   * ------------------------------------------------------------------ */
  function normalizeStatPanels(root) {
    (root || document).querySelectorAll('.skillText .tables > .toggle').forEach(function (button) {
      var panel = button.nextElementSibling;
      if (!panel || !panel.classList.contains('simpleTable')) return;

      if (!button.hasAttribute('aria-expanded')) button.setAttribute('aria-expanded', 'false');
      var isOpen = button.getAttribute('aria-expanded') === 'true';
      button.type = 'button';
      button.classList.toggle('is-open-v558', isOpen);
      panel.hidden = !isOpen;
      panel.setAttribute('aria-hidden', String(!isOpen));
      panel.classList.toggle('hidden', !isOpen);
      panel.style.setProperty('display', isOpen ? 'block' : 'none', 'important');
    });
  }

  function onStatToggle(event) {
    var button = event.target && event.target.closest ? event.target.closest('.skillText .tables > .toggle') : null;
    if (!button) return;
    var panel = button.nextElementSibling;
    if (!panel || !panel.classList.contains('simpleTable')) return;

    event.preventDefault();
    event.stopPropagation();

    var open = button.getAttribute('aria-expanded') === 'true';
    var nextOpen = !open;
    button.setAttribute('aria-expanded', String(nextOpen));
    button.classList.toggle('is-open-v558', nextOpen);
    panel.hidden = !nextOpen;
    panel.setAttribute('aria-hidden', String(!nextOpen));
    panel.classList.toggle('hidden', !nextOpen);
    panel.style.setProperty('display', nextOpen ? 'block' : 'none', 'important');
  }

  document.addEventListener('click', onStatToggle, true);

  /* ------------------------------------------------------------------
   * 2) Patch notes : objets localisés + bon Alter/skill/image
   * ------------------------------------------------------------------ */
  function allStyles() {
    var output = [];
    var seen = new Set();

    function add(style, character) {
      if (!style || typeof style !== 'object') return;
      if (seen.has(style)) return;
      seen.add(style);
      output.push({ style: style, character: character || null });
    }

    var candidates = [window.styles, window.MHUR_STYLES, window.MHUR_DATABASE_ASSETS && window.MHUR_DATABASE_ASSETS.styles];
    candidates.forEach(function (source) {
      if (!source) return;
      if (Array.isArray(source)) source.forEach(function (style) { add(style, null); });
      else Object.keys(source).forEach(function (key) {
        var style = source[key];
        if (style && typeof style === 'object' && !style.id) style.id = key;
        add(style, null);
      });
    });

    var characters = window.characters || window.MHUR_CHARACTERS || [];
    if (!Array.isArray(characters) && characters && typeof characters === 'object') characters = Object.values(characters);
    (characters || []).forEach(function (character) {
      var styles = character && (character.styles || character.quirkSkillSets || character.alters || character.skillSets);
      if (!styles) return;
      if (!Array.isArray(styles)) styles = Object.values(styles);
      styles.forEach(function (style) { add(style, character); });
    });

    return output;
  }

  function styleIdentity(entry) {
    var style = entry && entry.style ? entry.style : entry;
    if (!style) return '';
    return norm([style.id, style.key, style.slug, style.name, style.title, style.style, style.quirk_skill_set].map(function (v) { return pick(v, ''); }).join(' '));
  }

  function findStyle(change, groupStyle, groupCharacter) {
    var styles = allStyles();
    var wanted = [
      change && change.style_id,
      change && change.styleId,
      change && change.style_key,
      change && change.styleKey,
      change && change.quirk_skill_set,
      change && change.quirkSkillSet,
      change && change.style,
      groupStyle
    ].map(norm).filter(Boolean);

    var characterWanted = norm((change && change.character) || groupCharacter || '');
    var best = null;
    var bestScore = -1;

    styles.forEach(function (entry) {
      var haystack = styleIdentity(entry);
      var charText = norm(entry.character && (entry.character.id || entry.character.name || entry.character.title));
      var score = 0;
      wanted.forEach(function (needle) {
        if (!needle) return;
        if (haystack === needle) score += 100;
        else if (haystack.indexOf(needle) >= 0 || needle.indexOf(haystack) >= 0) score += 30;
      });
      if (characterWanted && charText && (charText.indexOf(characterWanted) >= 0 || characterWanted.indexOf(charText) >= 0)) score += 15;

      /* Gentle Criminal possède des données qui ont parfois été fournies sous forme d'objet. */
      var gentleWanted = wanted.some(function (value) { return value.indexOf('gentle') >= 0; }) || characterWanted.indexOf('gentle') >= 0;
      if (gentleWanted && haystack.indexOf('gentle') >= 0) score += 80;

      if (score > bestScore) {
        bestScore = score;
        best = entry.style;
      }
    });

    return bestScore > 0 ? best : null;
  }

  function styleName(style) {
    return pick(style && (style.name || style.title || style.style || style.label || style.id), '');
  }

  function skillsOf(style) {
    if (!style) return [];
    var skills = style.skills || style.abilities || style.quirks || style.moves || [];
    if (!Array.isArray(skills) && typeof skills === 'object') skills = Object.values(skills);
    return skills || [];
  }

  function skillLetter(change) {
    var explicit = pick(change && (change.skill_letter || change.skillLetter || change.letter || change.key), '').toLowerCase();
    var source = (explicit + ' ' + pick(change && (change.skill_name || change.label), '')).toLowerCase();
    if (source.indexOf('α') >= 0 || /(^|\s)alpha(\s|$)/.test(source)) return 'α';
    if (source.indexOf('β') >= 0 || /(^|\s)beta(\s|$)/.test(source)) return 'β';
    if (source.indexOf('γ') >= 0 || /(^|\s)gamma(\s|$)/.test(source)) return 'γ';
    if (/(^|\s)(sp|special)(\s|$)/.test(source)) return 'sp';
    return explicit;
  }

  function skillFor(style, change) {
    var skills = skillsOf(style);
    var wanted = norm(change && (change.skill_name || change.label));
    var letter = skillLetter(change);
    var best = null;
    var bestScore = -1;

    skills.forEach(function (skill) {
      var identity = norm([skill.id, skill.key, skill.name, skill.title, skill.label, skill.letter, skill.type].map(function (v) { return pick(v, ''); }).join(' '));
      var score = 0;
      if (wanted && identity === wanted) score += 100;
      else if (wanted && (identity.indexOf(wanted) >= 0 || wanted.indexOf(identity) >= 0)) score += 40;
      var skillL = pick(skill.letter || skill.key || skill.type, '').toLowerCase();
      if (letter && (skillL === letter || identity.indexOf(letter) >= 0)) score += 60;
      if (score > bestScore) {
        bestScore = score;
        best = skill;
      }
    });

    return bestScore > 0 ? best : null;
  }

  function normalizeChange(change, group) {
    if (!change || typeof change !== 'object') return;

    ['character', 'style', 'skill_name', 'label', 'title', 'note', 'description'].forEach(function (key) {
      if (change[key] != null) change[key] = pick(change[key], '');
    });

    ['bullets', 'notes', 'details'].forEach(function (key) {
      if (Array.isArray(change[key])) change[key] = change[key].map(function (value) { return pick(value, ''); });
    });

    ['before', 'after', 'values_before', 'values_after'].forEach(function (key) {
      if (Array.isArray(change[key])) change[key] = change[key].map(function (value) {
        return typeof value === 'object' && value !== null ? pick(value, '') : value;
      });
    });

    var selectedStyle = findStyle(change, group && group.style, group && group.character);
    if (selectedStyle) {
      var selectedName = styleName(selectedStyle);
      if (selectedName) change.style = selectedName;
      var selectedSkill = skillFor(selectedStyle, change);
      if (selectedSkill) {
        var selectedSkillName = pick(selectedSkill.name || selectedSkill.title || selectedSkill.label, '');
        if (selectedSkillName) change.skill_name = selectedSkillName;
        var selectedImage = asset(selectedSkill.img || selectedSkill.image || selectedSkill.icon || selectedSkill.picture);
        if (selectedImage) change.skill_image = selectedImage;
      }
    }

    var explicitImage = asset(change.skill_image || change.image || change.icon);
    if (explicitImage) change.skill_image = explicitImage;
  }

  function normalizePatchData() {
    var home = window.MHUR_HOME_DATA || {};
    var notes = home.patch_notes || home.patchNotes || window.MHUR_PATCH_NOTES || [];
    if (!Array.isArray(notes)) return;

    notes.forEach(function (note) {
      if (!note || typeof note !== 'object') return;
      ['title', 'subtitle', 'label', 'description'].forEach(function (key) {
        if (note[key] != null) note[key] = pick(note[key], '');
      });

      var groups = note.details || note.groups || note.characters || note.changes || [];
      if (!Array.isArray(groups)) groups = [groups];
      groups.forEach(function (group) {
        if (!group || typeof group !== 'object') return;
        ['character', 'style', 'title', 'label', 'note', 'description'].forEach(function (key) {
          if (group[key] != null) group[key] = pick(group[key], '');
        });
        if (group.skill_name != null || group.before != null || group.after != null || group.bullets != null) {
          normalizeChange(group, note);
        }
        var changes = group.changes || group.skills || group.items || [];
        if (!Array.isArray(changes)) changes = [changes];
        changes.forEach(function (change) { normalizeChange(change, group); });
      });
    });
  }

  function repairPatchDom() {
    var modal = document.querySelector('#s18NotesDevModalV10, .s18NotesDevModalV10, [data-patch-modal]');
    if (!modal) return;

    var walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf('[object Object]') >= 0) {
        var parent = node.parentElement;
        var replacement = lang() === 'en' ? 'Adjustment' : 'Ajustement';
        if (parent && (parent.matches('h4, .s18PatchCharacterNameV10') || parent.closest('h4'))) replacement = 'Gentle Criminal';
        if (parent && (parent.matches('strong, .s18PatchStyleV10') || parent.closest('.s18PatchStyleV10'))) replacement = 'Gentle Criminal';
        node.nodeValue = node.nodeValue.replace(/\[object Object\]/g, replacement);
      }
    }

    /* Répare l'image de la compétence à partir du personnage/Alter/titre affichés. */
    modal.querySelectorAll('.s18PatchCharacterV10, [data-patch-character]').forEach(function (article) {
      var characterText = pick(article.querySelector('h4') && article.querySelector('h4').textContent, '');
      var styleText = pick(article.querySelector('strong') && article.querySelector('strong').textContent, '');
      article.querySelectorAll('.s18PatchChangeV10, [data-patch-change]').forEach(function (card) {
        var titleText = pick(card.querySelector('h5') && card.querySelector('h5').textContent, '');
        var fakeChange = { character: characterText, style: styleText, skill_name: titleText, label: titleText };
        var selectedStyle = findStyle(fakeChange, styleText, characterText);
        var selectedSkill = skillFor(selectedStyle, fakeChange);
        var image = asset(selectedSkill && (selectedSkill.img || selectedSkill.image || selectedSkill.icon || selectedSkill.picture));
        var img = card.querySelector('img');
        if (img && image) {
          var current = img.getAttribute('src') || '';
          if (current !== image) img.setAttribute('src', image);
        }
      });
    });
  }

  /* ------------------------------------------------------------------
   * 3) Badges NEW : données réelles + animation aller-retour
   * ------------------------------------------------------------------ */
  function parseDate(value) {
    if (!value) return 0;
    var time = Date.parse(value);
    return Number.isFinite(time) ? time : 0;
  }

  function values(source) {
    if (!source) return [];
    return Array.isArray(source) ? source : Object.keys(source).map(function (key) {
      var value = source[key];
      if (value && typeof value === 'object' && !value.id) value.id = key;
      return value;
    });
  }

  function newestIds(items, idKeys) {
    var now = Date.now() + 24 * 60 * 60 * 1000;
    var valid = values(items).filter(function (item) {
      var date = item && parseDate(item.releaseDate || item.release_date || item.date);
      return date > 0 && date <= now;
    });
    if (!valid.length) return [];
    var max = Math.max.apply(Math, valid.map(function (item) { return parseDate(item.releaseDate || item.release_date || item.date); }));
    return valid.filter(function (item) { return parseDate(item.releaseDate || item.release_date || item.date) === max; }).map(function (item) {
      for (var i = 0; i < idKeys.length; i += 1) {
        if (item[idKeys[i]] != null) return String(item[idKeys[i]]);
      }
      return '';
    }).filter(Boolean);
  }

  function addIds(set, source) {
    if (!source) return;
    values(source).forEach(function (item) {
      if (item == null) return;
      if (typeof item === 'string' || typeof item === 'number') set.add(norm(item));
      else {
        ['id', 'key', 'slug', 'character_id', 'characterId', 'style_id', 'styleId', 'costume_id', 'costumeId', 'name', 'title'].forEach(function (key) {
          if (item[key] != null) set.add(norm(item[key]));
        });
      }
    });
  }

  function activeNewSets() {
    var result = { characters: new Set(), styles: new Set(), costumes: new Set() };
    var season = window.MHUR_SEASON18_DATA || {};
    var home = window.MHUR_HOME_DATA || {};
    var configured = season.active_new_content || season.new_content || home.active_new_content || home.new_content || {};

    addIds(result.characters, configured.characters || configured.character || configured.heroes || configured.villains);
    addIds(result.styles, configured.styles || configured.alters || configured.quirk_skill_sets || configured.quirkSkillSets);
    addIds(result.costumes, configured.costumes || configured.skins || configured.outfits);

    var latest = home.latest_releases || home.latestReleases || {};
    addIds(result.characters, latest.characters || latest.character);
    addIds(result.styles, latest.styles || latest.alters || latest.quirk_skill_sets);
    addIds(result.costumes, latest.costumes || latest.skins);

    newestIds(season.costumes || home.costumes, ['id', 'costume_id', 'costumeId', 'key', 'slug']).forEach(function (id) { result.costumes.add(norm(id)); });
    newestIds(season.characters || home.characters, ['id', 'character_id', 'characterId', 'key', 'slug']).forEach(function (id) { result.characters.add(norm(id)); });
    newestIds(season.styles || home.styles, ['id', 'style_id', 'styleId', 'key', 'slug']).forEach(function (id) { result.styles.add(norm(id)); });

    values(season.costumes || home.costumes).forEach(function (item) {
      if (item && (item.isNew === true || item.is_new === true || item.new === true)) addIds(result.costumes, [item]);
    });
    values(season.characters || home.characters).forEach(function (item) {
      if (item && (item.isNew === true || item.is_new === true || item.new === true)) addIds(result.characters, [item]);
    });
    values(season.styles || home.styles).forEach(function (item) {
      if (item && (item.isNew === true || item.is_new === true || item.new === true)) addIds(result.styles, [item]);
    });

    return result;
  }

  function identityFor(element) {
    if (!element) return '';
    var bits = [];
    ['data-char', 'data-character', 'data-character-id', 'data-style', 'data-style-id', 'data-costume', 'data-costume-id', 'data-id', 'id', 'aria-label', 'title'].forEach(function (attr) {
      var value = element.getAttribute && element.getAttribute(attr);
      if (value) bits.push(value);
    });
    bits.push(element.textContent || '');
    var clickable = element.querySelector && element.querySelector('[onclick],a[href]');
    if (clickable) bits.push(clickable.getAttribute('onclick') || '', clickable.getAttribute('href') || '');
    return norm(bits.join(' '));
  }

  var BADGE_SELECTOR = '.s18NewBadge,.s18NewBadgeV9,.s18NewBadgeV24,.s18PlannedNewV12,.mhurCharacterNewV554,.mhurCharacterNewV555,.mhurCostumeNewV554,.mhurCostumeNewV555,.mhurNewV556,.mhurNewV558';

  function setNewBadge(card, active) {
    if (!card) return;
    if (card.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23,[aria-disabled="true"]')) active = false;

    var badges = directChildren(card, BADGE_SELECTOR);
    var own = badges.filter(function (badge) { return badge.classList.contains('mhurNewV558'); });

    if (!active) {
      badges.forEach(function (badge) { badge.remove(); });
      card.classList.remove('has-new-v558');
      return;
    }

    var badge = own[0] || null;
    badges.forEach(function (candidate) {
      if (candidate !== badge) candidate.remove();
    });
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 's18NewBadge s18NewBadgeV9 mhurNewV558';
      badge.setAttribute('aria-label', 'New');
      badge.textContent = 'NEW!';
      card.appendChild(badge);
    }
    card.classList.add('has-new-v558');
  }

  function matchesSet(identity, set) {
    if (!identity || !set || !set.size) return false;
    var found = false;
    set.forEach(function (id) {
      if (id && (identity === id || identity.indexOf(id) >= 0)) found = true;
    });
    return found;
  }

  function syncNewBadges() {
    var sets = activeNewSets();

    document.querySelectorAll('.card[data-char],.characterCard,[data-character-card],.s18CharacterCardV12').forEach(function (card) {
      setNewBadge(card, matchesSet(identityFor(card), sets.characters));
    });

    document.querySelectorAll('.styleCard,[data-style-card],.s18StyleCardV12,.quirkSetCard').forEach(function (card) {
      setNewBadge(card, matchesSet(identityFor(card), sets.styles));
    });

    document.querySelectorAll('.costumeTile,.costumeCard,[data-costume-card],.s18CostumeCardV12,.s18CostumeTileV19').forEach(function (card) {
      setNewBadge(card, matchesSet(identityFor(card), sets.costumes));
    });
  }

  /* ------------------------------------------------------------------
   * 4) Réductions de points personnage
   * ------------------------------------------------------------------ */
  var ROLE_CLASSES = ['assault', 'strike', 'rapid', 'technical', 'support', 'defense', 'attack', 'speed', 'technique', 'soutien'];

  function discountSource() {
    var home = window.MHUR_HOME_DATA || {};
    return values(home.discounts || home.character_discounts || home.characterDiscounts || home.latest_discounts || window.MHUR_DISCOUNTS || []);
  }

  function discountRole(item) {
    var raw = pick(item && (item.role || item.type || item.class || item.category), '');
    if (raw) return raw;
    var id = norm(item && (item.style_id || item.styleId || item.id || item.key || item.name));
    var style = allStyles().map(function (entry) { return entry.style; }).find(function (candidate) {
      return styleIdentity(candidate).indexOf(id) >= 0 || (id && id.indexOf(styleIdentity(candidate)) >= 0);
    });
    return pick(style && (style.role || style.type || style.class), '');
  }

  function discountImage(item) {
    var image = asset(item && (item.image || item.img || item.portrait || item.icon || item.picture));
    if (image) return image;
    var id = norm(item && (item.style_id || item.styleId || item.id || item.key || item.name));
    var style = allStyles().map(function (entry) { return entry.style; }).find(function (candidate) {
      var identity = styleIdentity(candidate);
      return id && (identity.indexOf(id) >= 0 || id.indexOf(identity) >= 0);
    });
    return asset(style && (style.portrait || style.image || style.img || style.icon || style.picture));
  }

  function roleLabel(role) {
    var key = norm(role);
    var english = lang() === 'en';
    if (/assault|defense|assaut/.test(key)) return english ? 'Assault' : 'Assaut';
    if (/strike|attack|attaque/.test(key)) return english ? 'Strike' : 'Attaque';
    if (/rapid|speed|vitesse/.test(key)) return english ? 'Rapid' : 'Vitesse';
    if (/technical|technique/.test(key)) return english ? 'Technical' : 'Technique';
    if (/support|soutien/.test(key)) return english ? 'Support' : 'Soutien';
    return pick(role, '');
  }

  function repairDiscounts() {
    var grid = document.querySelector('.discountGridV296,[data-discount-grid],#discountGrid');
    if (!grid) return;

    var list = discountSource();
    if (!list.length) return;

    /* On garde la structure attendue par V556 pour éviter tout conflit avec les anciens scripts. */
    if (grid.children.length !== list.length || !grid.querySelector('.mhurDiscountCardV556')) {
      grid.innerHTML = '';
      list.forEach(function () {
        var card = document.createElement('article');
        card.className = 'mhurDiscountCardV556 mhurDiscountCardV558';
        card.innerHTML = '<div class="mhurDiscountPortraitV556"><img alt=""></div>' +
          '<div class="mhurDiscountInfoV556"><strong></strong><span class="mhurDiscountRoleV556"></span><b class="mhurDiscountPointsV556"></b></div>';
        grid.appendChild(card);
      });
    }

    Array.prototype.forEach.call(grid.children, function (card, index) {
      var item = list[index];
      if (!item) return;
      card.classList.add('mhurDiscountCardV556', 'mhurDiscountCardV558');
      ROLE_CLASSES.forEach(function (name) { card.classList.remove('role-' + name); });

      var name = pick(item.name || item.title || item.character || item.style, lang() === 'en' ? 'Character' : 'Personnage');
      var role = discountRole(item);
      var roleKey = norm(role).replace(/\s+/g, '-');
      var points = item.points != null ? item.points : (item.cost != null ? item.cost : (item.value != null ? item.value : item.discount_points));
      var image = discountImage(item);

      if (roleKey) card.classList.add('role-' + roleKey);
      var strong = card.querySelector('strong');
      var roleNode = card.querySelector('.mhurDiscountRoleV556');
      var pointsNode = card.querySelector('.mhurDiscountPointsV556');
      var img = card.querySelector('img');
      setText(strong, name);
      setText(roleNode, roleLabel(role));
      setText(pointsNode, points != null && points !== '' ? String(points) : '');
      if (img) {
        img.alt = name;
        if (image) img.src = image;
        else img.removeAttribute('src');
      }
    });
  }

  /* ------------------------------------------------------------------
   * 5) Flèche du tutoriel des mods
   * ------------------------------------------------------------------ */
  function repairModsTutorial() {
    document.querySelectorAll('.modsTutorial,details[data-mods-tutorial],.modsTutorialV2').forEach(function (details) {
      var summary = details.querySelector(':scope > summary') || details.querySelector('summary');
      if (!summary) return;
      summary.classList.add('mhurModsSummaryV558');

      /* Les anciennes flèches restent masquées par CSS; on garantit une seule flèche visible. */
      directChildren(summary, '.mhurModsArrowV558').slice(1).forEach(function (node) { node.remove(); });
      var arrow = directChildren(summary, '.mhurModsArrowV558')[0];
      if (!arrow) {
        arrow = document.createElement('span');
        arrow.className = 'mhurModsArrowV558';
        arrow.setAttribute('aria-hidden', 'true');
        summary.appendChild(arrow);
      }
      arrow.textContent = '';
    });
  }

  /* ------------------------------------------------------------------
   * 6) Traductions visibles FR/EN
   * ------------------------------------------------------------------ */
  var TO_EN = {
    'Installer des mods - PC Steam uniquement': 'Install mods - PC Steam only',
    'Installer des mods - PC Steam seulement': 'Install mods - PC Steam only',
    'Clique ici pour ouvrir le tutoriel': 'Click here to open the tutorial',
    'Cliquez ici pour ouvrir le tutoriel': 'Click here to open the tutorial',
    'Voir le tutoriel': 'Open tutorial',
    'Ouvrir le tutoriel': 'Open tutorial',
    'Fermer le tutoriel': 'Close tutorial',
    'Effets de montée α': 'Level-up Effects α',
    'Effets de montée β': 'Level-up Effects β',
    'Effets de montée γ': 'Level-up Effects γ',
    'Valeurs α': 'Values α',
    'Valeurs β': 'Values β',
    'Valeurs γ': 'Values γ',
    'Dégâts α — Projectile': 'Damage α — Projectile',
    'Dégâts α — Balle': 'Damage α — Bullet',
    'Dégâts': 'Damage',
    'Munitions': 'Ammo',
    'Consommation': 'Ammo Use',
    'Recharge': 'Reload',
    'Niveau': 'Level',
    'Avant': 'Before',
    'Après': 'After',
    'Personnages': 'Characters',
    'Costumes': 'Costumes',
    'HÉROS': 'HEROES',
    'SUPER-VILAINS': 'VILLAINS',
    'Assaut': 'Assault',
    'Attaque': 'Strike',
    'Vitesse': 'Rapid',
    'Technique': 'Technical',
    'Soutien': 'Support',
    'Réductions de points personnage': 'Character Point Discounts',
    'Réduction de points personnage': 'Character Point Discount',
    'Aucun costume trouvé': 'No costume found',
    'Choisis un personnage pour ses costumes.': 'Choose a character to view their costumes.',
    'Choisissez un personnage pour ses costumes.': 'Choose a character to view their costumes.',
    'Nouveau personnage': 'New character',
    'Disponible depuis le': 'Available since',
    'Notes de mise à jour': 'Patch notes',
    'Ajustement': 'Adjustment',
    'Amélioration': 'Buff',
    'Réduction': 'Nerf',
    'Tous': 'All',
    'Toutes': 'All',
    'Rechercher': 'Search',
    'Aucun résultat': 'No results',
    'Retour': 'Back',
    'Fermer': 'Close'
  };

  var TO_FR = Object.keys(TO_EN).reduce(function (map, key) {
    map[TO_EN[key]] = key;
    return map;
  }, {});

  function translatedExact(text) {
    var trimmed = text.trim();
    var map = lang() === 'en' ? TO_EN : TO_FR;
    if (Object.prototype.hasOwnProperty.call(map, trimmed)) return map[trimmed];

    var replaced = trimmed;
    Object.keys(map).sort(function (a, b) { return b.length - a.length; }).forEach(function (source) {
      if (replaced.indexOf(source) >= 0) replaced = replaced.split(source).join(map[source]);
    });
    return replaced !== trimmed ? replaced : null;
  }

  function translateLeafText(root) {
    var selector = [
      '.modsTutorial', '.modsPage', '.modsToolbar', '.modsFilters', '.modCard',
      '#s18NotesDevModalV10', '.s18NotesDevModalV10', '.discountGridV296',
      '.skillText .tables', '.costumesPage', '.charactersPage', '.pageFrame'
    ].join(',');

    (root || document).querySelectorAll(selector).forEach(function (area) {
      var walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var parent = node.parentElement;
          if (!parent || parent.closest('script,style,textarea,code,pre')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var node;
      while ((node = walker.nextNode())) {
        var leading = (node.nodeValue.match(/^\s*/) || [''])[0];
        var trailing = (node.nodeValue.match(/\s*$/) || [''])[0];
        var replacement = translatedExact(node.nodeValue);
        if (replacement != null) node.nodeValue = leading + replacement + trailing;
      }
    });

    (root || document).querySelectorAll('input[placeholder],textarea[placeholder],select option').forEach(function (element) {
      if (element.hasAttribute('placeholder')) {
        var placeholder = translatedExact(element.getAttribute('placeholder'));
        if (placeholder != null) element.setAttribute('placeholder', placeholder);
      } else {
        var option = translatedExact(element.textContent || '');
        if (option != null) element.textContent = option;
      }
    });

    document.documentElement.lang = lang();
  }

  /* ------------------------------------------------------------------
   * Orchestration
   * ------------------------------------------------------------------ */
  function repairAll() {
    scheduled = false;
    normalizePatchData();
    normalizeStatPanels(document);
    repairPatchDom();
    syncNewBadges();
    repairDiscounts();
    repairModsTutorial();
    translateLeafText(document);
    lastLanguage = lang();
  }

  function scheduleRepair() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      window.setTimeout(repairAll, 0);
    });
  }

  document.addEventListener('click', function (event) {
    if (event.target && event.target.closest && event.target.closest('[data-lang],.langBtn,.languageBtn,#langToggle,[data-open-patch],.s18NotesButtonV10,.modsTutorial > summary')) {
      window.setTimeout(scheduleRepair, 20);
      window.setTimeout(scheduleRepair, 180);
    }
  }, false);

  ['languagechange', 'mhur:languagechange', 'mhur:langchange', 'patchnotes:open'].forEach(function (name) {
    window.addEventListener(name, scheduleRepair);
    document.addEventListener(name, scheduleRepair);
  });

  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function (mutations) {
      var useful = mutations.some(function (mutation) {
        if (mutation.type === 'attributes') return mutation.attributeName === 'lang' || mutation.attributeName === 'open';
        return mutation.addedNodes && mutation.addedNodes.length > 0;
      });
      if (useful || lastLanguage !== lang()) scheduleRepair();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['lang', 'open'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      repairAll();
      startObserver();
      window.setTimeout(repairAll, 300);
      window.setTimeout(repairAll, 1200);
    }, { once: true });
  } else {
    repairAll();
    startObserver();
    window.setTimeout(repairAll, 300);
    window.setTimeout(repairAll, 1200);
  }

  window.MHUR_V558 = {
    version: VERSION,
    repairAll: repairAll,
    repairTables: normalizeStatPanels,
    repairPatchNotes: function () { normalizePatchData(); repairPatchDom(); },
    repairNewBadges: syncNewBadges,
    repairDiscounts: repairDiscounts,
    repairModsTutorial: repairModsTutorial,
    repairTranslations: translateLeafText
  };
})();
