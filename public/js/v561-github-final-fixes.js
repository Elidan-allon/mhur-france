/* MHUR FRANCE — V561 GitHub final targeted fixes */
(function () {
  'use strict';

  var VERSION = '561';
  var LEGACY_STATUS_SELECTOR = [
    '.mhurStatusBadgeV561',
    '.mhurNewV559',
    '.mhurNewV558',
    '.mhurNewV556',
    '.mhurCostumeNewV555',
    '.mhurCostumeNewV554',
    '.mhurCharacterNewV555',
    '.mhurCharacterNewV554',
    '.s18NewBadge',
    '.s18NewBadgeV9',
    '.s18NewBadgeV24',
    '.s18SeasonNewV10',
    '.s18PlannedNewV12'
  ].join(',');

  function currentLanguage() {
    try {
      var stored = localStorage.getItem('mhur_lang') || localStorage.getItem('mhurLang') || localStorage.getItem('lang') || '';
      if (stored === 'en' || stored === 'fr') return stored;
    } catch (_) {}
    var htmlLanguage = String(document.documentElement.lang || '').toLowerCase();
    if (htmlLanguage.indexOf('en') === 0) return 'en';
    if (htmlLanguage.indexOf('fr') === 0) return 'fr';
    try {
      if (typeof lang !== 'undefined' && (lang === 'fr' || lang === 'en')) return lang;
    } catch (_) {}
    return 'fr';
  }

  function localized(value) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i += 1) {
        var found = localized(value[i]);
        if (found) return found;
      }
      return '';
    }
    if (typeof value === 'object') {
      var language = currentLanguage();
      var keys = language === 'en'
        ? ['en', 'en_us', 'en-US', 'english', 'fr', 'name', 'label', 'title', 'text', 'value']
        : ['fr', 'fr_fr', 'fr-FR', 'french', 'en', 'name', 'label', 'title', 'text', 'value'];
      for (var k = 0; k < keys.length; k += 1) {
        if (Object.prototype.hasOwnProperty.call(value, keys[k])) {
          var selected = localized(value[keys[k]]);
          if (selected) return selected;
        }
      }
    }
    return '';
  }

  function normalize(value) {
    var text = localized(value);
    try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
    return text.toLowerCase().replace(/[’']/g, ' ').replace(/[^a-z0-9αβγ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function getStyles() {
    try { return typeof styles !== 'undefined' ? styles : {}; } catch (_) { return {}; }
  }

  function rootAsset(path) {
    var value = String(path || '').trim();
    if (!value || /^(?:https?:|data:|blob:|\/)/i.test(value)) return value;
    return '/' + value.replace(/^(?:\.{1,2}\/)+/, '').replace(/^\/+/, '');
  }

  function roleIcon(role) {
    return rootAsset({
      assault: 'assets/roles/role_assault_clean.webp',
      strike: 'assets/roles/role_attack_clean.webp',
      rapid: 'assets/roles/role_rapid.webp',
      technical: 'assets/roles/role_technical.webp',
      support: 'assets/roles/role_support.webp'
    }[role] || 'assets/roles/role_technical.webp');
  }

  function roleLabel(role) {
    var en = currentLanguage() === 'en';
    return ({
      assault: en ? 'Assault' : 'Assaut',
      strike: en ? 'Strike' : 'Attaque',
      rapid: en ? 'Rapid' : 'Vitesse',
      technical: en ? 'Technical' : 'Technique',
      support: en ? 'Support' : 'Soutien'
    })[role] || (en ? 'Technical' : 'Technique');
  }

  /* ---------------------------------------------------------------------- */
  /* Character Point Discounts                                               */
  /* ---------------------------------------------------------------------- */
  var DISCOUNTS = {
    d_j_board: { style: 'present_mic_technical', role: 'technical', portrait: 'assets/present_mic/present_mic_technical/portrait.png' },
    dj_board: { style: 'present_mic_technical', role: 'technical', portrait: 'assets/present_mic/present_mic_technical/portrait.png' },
    flow_runner: { style: 'aizawa_strike', role: 'strike', portrait: 'assets/aizawa/aizawa_strike/portrait.png' },
    gentle_criminal: { style: 'gentle_criminal_technical', role: 'technical', portrait: 'assets/gentle_criminal/gentle_criminal_technical/portrait.png' },
    factor_fusion: { style: 'all_for_one_strike', role: 'strike', portrait: 'assets/all_for_one/all_for_one_strike/portrait.png' },
    cluster: { style: 'bakugo_technical', role: 'technical', portrait: 'assets/bakugo/bakugo_technical/portrait.png' },
    mirko: { style: 'mirko_rapid', role: 'rapid', portrait: 'assets/mirko/mirko_rapid/portrait.png' }
  };

  function keyFromName(value) {
    return normalize(value).replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
  }

  function fixDiscounts(root) {
    (root || document).querySelectorAll('.mhurDiscountCardV559,.discountCardV296').forEach(function (card) {
      var key = card.dataset.discount || keyFromName(card.querySelector('.mhurDiscountNameV559,strong,b') && card.querySelector('.mhurDiscountNameV559,strong,b').textContent);
      var config = DISCOUNTS[key];
      if (!config) return;

      card.classList.remove('role-assault', 'role-strike', 'role-rapid', 'role-technical', 'role-support');
      card.classList.add('role-' + config.role, 'mhurDiscountCardV561');
      card.dataset.styleId = config.style;

      var portraitWrap = card.querySelector('.mhurDiscountPortraitV559') || card.firstElementChild;
      if (portraitWrap) {
        portraitWrap.classList.remove('role-assault', 'role-strike', 'role-rapid', 'role-technical', 'role-support');
        portraitWrap.classList.add('role-' + config.role, 'mhurDiscountPortraitV561');
        var image = portraitWrap.querySelector('img');
        if (image) {
          image.src = rootAsset(config.portrait);
          image.dataset.fallback = rootAsset(config.portrait);
          image.alt = card.querySelector('.mhurDiscountNameV559') ? card.querySelector('.mhurDiscountNameV559').textContent.trim() : key;
          image.classList.remove('mhurDiscountImageMissingV559');
        }
      }

      var role = card.querySelector('.mhurDiscountRoleV559');
      if (role) {
        role.classList.remove('role-assault', 'role-strike', 'role-rapid', 'role-technical', 'role-support');
        role.classList.add('role-' + config.role, 'mhurDiscountRoleV561');
        role.innerHTML = '<img class="mhurDiscountRoleIconV561" src="' + roleIcon(config.role) + '" alt="">' + roleLabel(config.role);
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* NEW / INCOMING                                                           */
  /* ---------------------------------------------------------------------- */
  function costumeId(card) {
    if (!card) return '';
    var values = [
      card.dataset && card.dataset.costumeId,
      card.dataset && card.dataset.costume,
      card.dataset && card.dataset.id,
      card.getAttribute && card.getAttribute('data-costume-id'),
      card.getAttribute && card.getAttribute('data-costume'),
      card.getAttribute && card.getAttribute('onclick'),
      card.id
    ];
    for (var i = 0; i < values.length; i += 1) {
      var match = String(values[i] || '').match(/(?:ur[_-]?)?(\d{4,})/i);
      if (match) return match[1];
    }
    return '';
  }

  function ownLegacyBadges(card) {
    return Array.prototype.slice.call(card.querySelectorAll(LEGACY_STATUS_SELECTOR + ',.newBadge,.new-badge,[data-word="NEW!"]')).filter(function (badge) {
      var owner = badge.closest('.costumeTile,.costumeCard,.card[data-char],.styleCard,.quirkSetCard,.releaseCardV299,[class*="tier"]');
      return !owner || owner === card;
    });
  }

  function removeStatus(card) {
    ownLegacyBadges(card).forEach(function (badge) { badge.remove(); });
    card.classList.remove('mhurHasStatusV561', 'mhurHasNewV561', 'mhurHasIncomingV561');
  }

  function setStatus(card, status, costume) {
    if (!card) return;
    removeStatus(card);
    if (!status) return;
    var badge = document.createElement('span');
    badge.className = 'mhurStatusBadgeV561 mhurStatus' + (status === 'new' ? 'New' : 'Incoming') + 'V561';
    badge.textContent = status === 'new' ? 'NEW!' : 'INCOMING';
    badge.setAttribute('aria-label', status === 'new' ? 'New' : 'Incoming');
    if (costume) badge.classList.add('mhurCostumeStatusV561');
    card.insertBefore(badge, card.firstChild);
    card.classList.add('mhurHasStatusV561', status === 'new' ? 'mhurHasNewV561' : 'mhurHasIncomingV561');
  }

  function activeContentSets() {
    var data = window.MHUR_SEASON18_DATA || {};
    var source = data.active_new_content || data.new_content || {};
    return {
      characters: new Set((source.characters || []).map(String)),
      styles: new Set((source.styles || []).map(String)),
      costumes: new Set((source.costumes || []).map(String)),
      upcomingCostumes: new Set((data.upcoming_costumes || []).map(String))
    };
  }

  function fixCostumeStatuses(root) {
    var sets = activeContentSets();
    (root || document).querySelectorAll('.costumeTile,.costumeCard,[data-costume-card],.s18CostumeTileV19').forEach(function (card) {
      var id = costumeId(card);
      if (!id) return;
      if (sets.upcomingCostumes.has(id) || card.closest('[data-upcoming="true"],.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23')) {
        setStatus(card, 'incoming', true);
      } else if (sets.costumes.has(id)) {
        setStatus(card, 'new', true);
      } else {
        removeStatus(card);
      }
    });
  }

  function fixCharacterStatuses(root) {
    var sets = activeContentSets();
    (root || document).querySelectorAll('.card[data-char],.characterCard[data-char],.characterCard[data-character],.s18CharacterCardV12').forEach(function (card) {
      var id = String(card.dataset.char || card.dataset.character || '').trim();
      var identity = normalize(id + ' ' + (card.textContent || ''));
      var active = sets.characters.has(id) || Array.from(sets.characters).some(function (candidate) {
        return identity.indexOf(normalize(candidate)) >= 0;
      });
      if (active) setStatus(card, 'new', false);
      else if (card.matches('[data-upcoming="true"],[aria-disabled="true"]')) setStatus(card, 'incoming', false);
      else removeStatus(card);
    });
  }

  function fixPlannedReleases(root) {
    (root || document).querySelectorAll('.releaseCardV299,.s18SeasonReleaseV10,.s18PlannedCardV14').forEach(function (card) {
      var identity = normalize((card.dataset.releaseChar || '') + ' ' + (card.dataset.releaseStyle || '') + ' ' + (card.textContent || '') + ' ' + (card.title || ''));
      if (/gentle criminal|gentle_criminal/.test(identity)) setStatus(card, 'new', false);
      else if (/twice|sad man|tsuyu|froppy/.test(identity)) setStatus(card, 'incoming', false);
      else removeStatus(card);
    });
  }

  function fixTierGentle(root) {
    var host = root || document;
    var candidates = Array.prototype.slice.call(host.querySelectorAll('[class*="tier" i] img,[id*="tier" i] img'));
    candidates.forEach(function (image) {
      var text = normalize((image.alt || '') + ' ' + (image.title || ''));
      var card = image.closest('button,article,li,[class*="tier" i],.styleCard');
      if (card) text += ' ' + normalize(card.textContent || '');
      if (card && /gentle criminal|gentle_criminal/.test(text)) setStatus(card, 'new', false);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Patch notes                                                              */
  /* ---------------------------------------------------------------------- */
  var STYLE_ALIASES = [
    { character: /gentle/, style: /.*/, key: 'gentle_criminal_technical' },
    { character: /bakugo|katsuki/, style: /cluster/, key: 'bakugo_technical' },
    { character: /aizawa|shota/, style: /flow runner|strike/, key: 'aizawa_strike' },
    { character: /present mic|hizashi/, style: /d j board|technical/, key: 'present_mic_technical' },
    { character: /all for one|all_for_one|afo/, style: /factor fusion|strike/, key: 'all_for_one_strike' },
    { character: /midoriya|izuku/, style: /ofa|one for all/, key: 'ofa' },
    { character: /mirko|rumi/, style: /.*/, key: 'mirko_rapid' }
  ];

  function styleKeyFor(character, style) {
    var c = normalize(character);
    var s = normalize(style);
    for (var i = 0; i < STYLE_ALIASES.length; i += 1) {
      if (STYLE_ALIASES[i].character.test(c) && STYLE_ALIASES[i].style.test(s)) return STYLE_ALIASES[i].key;
    }
    var database = getStyles();
    var keys = Object.keys(database || {});
    var combined = normalize(c + ' ' + s);
    var best = '';
    var score = 0;
    keys.forEach(function (key) {
      var current = 0;
      normalize(key).split(' ').forEach(function (part) {
        if (part.length > 2 && combined.indexOf(part) >= 0) current += 1;
      });
      var name = normalize(database[key] && database[key].name);
      if (name && s && (name === s || name.indexOf(s) >= 0 || s.indexOf(name) >= 0)) current += 4;
      if (current > score) { score = current; best = key; }
    });
    return best;
  }

  function patchSkillType(text) {
    var raw = normalize(text);
    if (/(^| )α( |$)|(^| )alpha( |$)/.test(raw)) return 'alpha';
    if (/(^| )β( |$)|(^| )beta( |$)/.test(raw)) return 'beta';
    if (/(^| )γ( |$)|(^| )gamma( |$)/.test(raw)) return 'gamma';
    if (/special action|action speciale|action special|special/.test(raw)) return 'special';
    return '';
  }

  function isGeneralStatChange(text) {
    var raw = normalize(text);
    return /(^| )(hp|pv|health|main health|max hp|maximum hp|max health|maximum health|pv maximum|maximum main health)( |$)/.test(raw);
  }

  function skillsForStyle(style) {
    if (!style) return [];
    var list = Array.isArray(style.skills) ? style.skills.slice() : [];
    if (style.special) list.unshift(Object.assign({ letter: 'SP' }, style.special));
    return list;
  }

  function officialSkill(style, type, rawText) {
    var list = skillsForStyle(style);
    if (type === 'special') return list.find(function (skill) { return normalize(skill.letter) === 'sp' || normalize(skill.letter).indexOf('special') >= 0; }) || style.special || null;
    var letter = { alpha: 'α', beta: 'β', gamma: 'γ' }[type] || '';
    if (letter) {
      var byLetter = list.find(function (skill) { return normalize(skill.letter) === normalize(letter) || normalize(skill.letter) === type; });
      if (byLetter) return byLetter;
    }
    var raw = normalize(rawText);
    return list.find(function (skill) {
      var name = normalize(skill.name);
      return name && raw.indexOf(name) >= 0;
    }) || null;
  }

  function fixPatchModal(root) {
    var scope = root || document;
    var modal = scope.querySelector && scope.querySelector('#s18NotesDevModalV10,.s18NotesDevModalV10,[data-patch-modal]');
    if (!modal && scope.matches && scope.matches('#s18NotesDevModalV10,.s18NotesDevModalV10,[data-patch-modal]')) modal = scope;
    if (!modal) return;

    var walker = document.createTreeWalker(modal, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf('[object Object]') >= 0) node.nodeValue = node.nodeValue.replace(/\[object Object\]/g, '').trim();
    }
    modal.querySelectorAll('.toggle,h3,h4,h5,p,span').forEach(function (element) {
      if (!element.children.length && !String(element.textContent || '').trim()) element.hidden = true;
    });

    modal.querySelectorAll('.s18PatchCharacterV10,[data-patch-character]').forEach(function (article) {
      var character = localized(article.querySelector('h4') && article.querySelector('h4').textContent);
      var styleName = localized(article.querySelector('header strong,strong') && article.querySelector('header strong,strong').textContent);
      var styleId = styleKeyFor(character, styleName);
      var style = getStyles()[styleId] || (window.MHUR_DATABASE_ASSETS && window.MHUR_DATABASE_ASSETS.styles && window.MHUR_DATABASE_ASSETS.styles[styleId]) || null;
      if (!style) return;

      var portrait = article.querySelector('.s18PatchPortraitV10 img');
      if (portrait && style.portrait) portrait.src = rootAsset(style.portrait);

      article.querySelectorAll('.s18PatchChangeV10,[data-patch-change]').forEach(function (change) {
        var h5 = change.querySelector('h5');
        var labelNode = change.querySelector('.s18PatchLabelV10');
        var raw = [h5 && h5.textContent, labelNode && labelNode.textContent, change.getAttribute('data-skill'), change.textContent].filter(Boolean).join(' ');
        var skillType = patchSkillType(raw);
        var general = isGeneralStatChange(raw);
        var skill = general ? null : officialSkill(style, skillType, raw);
        var media = change.querySelector('.s18PatchSkillV10 > div:first-child');
        var image = media && media.querySelector('img');

        if (!skill) {
          if (media && image) media.remove();
          change.classList.add('mhurPatchNoSkillImageV561');
          return;
        }

        change.classList.remove('mhurPatchNoSkillImageV561');
        var officialName = localized(skill.name) || localized(skill.label);
        if (h5 && officialName) h5.textContent = officialName;
        if (skill.img) {
          if (!media) {
            media = document.createElement('div');
            var parent = change.querySelector('.s18PatchSkillV10');
            if (parent) parent.insertBefore(media, parent.firstChild);
          }
          if (media) {
            image = media.querySelector('img');
            if (!image) {
              image = document.createElement('img');
              image.alt = officialName;
              media.appendChild(image);
            }
            image.src = rootAsset(skill.img);
            image.alt = officialName;
          }
        }
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Full English interface translations                                      */
  /* ---------------------------------------------------------------------- */
  var EN_EXACT = {
    'Découvre, filtre et partage les créations de la communauté MHUR.': 'Discover, filter and share MHUR community creations.',
    'Publier un mod': 'Publish a mod',
    '+ Publier un mod': '+ Publish a mod',
    '＋ Publier un mod': '＋ Publish a mod',
    'Rechercher par nom, auteur, personnage…': 'Search by name, author, character…',
    'Rechercher par nom, auteur, personnage...': 'Search by name, author, character...',
    'Toutes les catégories': 'All categories',
    'Tous les personnages': 'All characters',
    'Plus récents': 'Newest',
    'Plus téléchargés': 'Most downloaded',
    'Plus aimés': 'Most liked',
    'mod trouvé': 'mod found',
    'mods trouvés': 'mods found',
    'Empreinte SHA-256': 'SHA-256 fingerprint',
    'Modifier': 'Edit',
    'Supprimer': 'Delete',
    'Aucune description.': 'No description.',
    'BUILD COMMUNAUTAIRE': 'COMMUNITY BUILD',
    'Par': 'By',
    'Signaler': 'Report',
    'Vérifier': 'Verify',
    'Masquer': 'Hide',
    'Votre build': 'Your build',
    'Tenue de Héros': 'Hero Costume',
    'Communauté en ligne': 'Community online',
    'Chargement des builds…': 'Loading builds…',
    'Aucun build pour ce style.': 'No build for this style.',
    'Sois le premier à en publier un.': 'Be the first to publish one.',
    'Installer des mods - PC Steam uniquement': 'Install mods - PC Steam only',
    'Clique ici pour ouvrir le tutoriel': 'Click here to open the tutorial',
    'Voir le tutoriel': 'Open tutorial',
    'Fermer le tutoriel': 'Close tutorial',
    'PERSONNAGE': 'CHARACTER',
    'PERSONNAGES': 'CHARACTERS'
  };

  function translateGameText(value) {
    var out = String(value == null ? '' : value);
    var replacements = [
      [/Défense\/Strike Melee/gi, 'Defense/Strike Melee'],
      [/Défense PV/gi, 'HP Defense'],
      [/PV Max/gi, 'Max HP'],
      [/en état critique/gi, 'while in critical state'],
      [/Rapid du sprint/gi, 'Sprint Speed'],
      [/Rechargement de l['’]Alter/gi, 'Quirk Skill Reload'],
      [/Attack Power de l['’]Alter/gi, 'Quirk Skill Attack Power'],
      [/Puissance d['’]attaque de l['’]Alter/gi, 'Quirk Skill Attack Power'],
      [/Hauteur saut sur les murs/gi, 'Wall Jump Height'],
      [/Hauteur saut vertical/gi, 'Vertical Jump Height'],
      [/Quirk Skill Défense/gi, 'Quirk Skill Defense'],
      [/Défense de l['’]Alter/gi, 'Quirk Skill Defense'],
      [/Vitesse de rechargement/gi, 'Reload Speed'],
      [/Dégâts/gi, 'Damage'],
      [/Munitions/gi, 'Ammo'],
      [/Défense/gi, 'Defense'],
      [/Attaque/gi, 'Attack'],
      [/Héros/gi, 'Hero'],
      [/Super-vilain/gi, 'Villain']
    ];
    replacements.forEach(function (pair) { out = out.replace(pair[0], pair[1]); });
    return out;
  }

  function installGameTranslator() {
    if (window.MHUR_TRANSLATE_GAME_TEXT && window.MHUR_TRANSLATE_GAME_TEXT.__mhurV561) return;
    var previous = typeof window.MHUR_TRANSLATE_GAME_TEXT === 'function' ? window.MHUR_TRANSLATE_GAME_TEXT : null;
    var translator = function (value) {
      var initial = previous ? previous(value) : value;
      return translateGameText(initial);
    };
    translator.__mhurV561 = true;
    window.MHUR_TRANSLATE_GAME_TEXT = translator;
  }

  function replaceExactText(root) {
    if (currentLanguage() !== 'en') return;
    var scope = root || document;
    var selectors = '.modsPage,#cbDetailModal,#cbBuilderModal,.cbBuildCard,.cbConnection,.modsTutorial,.communityBuildsPage,.cbBuildsPage';
    scope.querySelectorAll(selectors).forEach(function (container) {
      var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        var original = String(node.nodeValue || '');
        var trimmed = original.trim();
        if (!trimmed) continue;
        var replacement = EN_EXACT[trimmed];
        if (!replacement && /^(\d+)\s+mods? trouv[ée]s?$/.test(trimmed)) {
          var count = trimmed.match(/^\d+/)[0];
          replacement = count + (count === '1' ? ' mod found' : ' mods found');
        }
        if (replacement) node.nodeValue = original.replace(trimmed, replacement);
      }
    });

    var search = scope.querySelector('#modsSearch');
    if (search) search.placeholder = 'Search by name, author, character…';
    scope.querySelectorAll('.cbCostumeTuningColumnV306 .equippedName,.tuningOptionName,.tuningOptionDesc,.slotBandText,.gameSlot').forEach(function (element) {
      if (!element.children.length) element.textContent = translateGameText(element.textContent);
      else Array.prototype.slice.call(element.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) child.nodeValue = translateGameText(child.nodeValue);
      });
    });
    scope.querySelectorAll('.modsTutorialStepImage[data-en-src]').forEach(function (image) {
      var english = image.getAttribute('data-en-src');
      if (english) image.src = english;
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Card tags and Mods tutorial arrow                                        */
  /* ---------------------------------------------------------------------- */
  function fixCardTags(root) {
    var en = currentLanguage() === 'en';
    (root || document).querySelectorAll('.card.characterMode,.card.costumeMode,.card.tuningMode').forEach(function (card) {
      var tag = card.querySelector('.cardModeTag');
      if (!tag) {
        tag = document.createElement('div');
        tag.className = 'cardModeTag';
        card.insertBefore(tag, card.firstChild);
      }
      if (card.classList.contains('tuningMode')) tag.textContent = 'T.U.N.I.N.G';
      else if (card.classList.contains('costumeMode')) tag.textContent = 'COSTUMES';
      else tag.textContent = en ? 'CHARACTER' : 'PERSONNAGE';
    });
  }

  function fixModsTutorial(root) {
    (root || document).querySelectorAll('.modsTutorial,details[data-mods-tutorial],.modsTutorialV2').forEach(function (details) {
      var summary = details.querySelector(':scope > summary') || details.querySelector('summary');
      if (!summary) return;
      summary.classList.add('mhurModsSummaryV561');
      summary.querySelectorAll('.modsTutorialChevronV537,.modsTutorialChevronV540,.modsTutorialChevron,.mhurModsArrow,.mhurModsArrowV558,.mhurModsArrowV559,.mhurModsArrowV561,[data-mods-arrow]').forEach(function (node) { node.remove(); });
      var arrow = document.createElement('span');
      arrow.className = 'mhurModsArrowV561';
      arrow.setAttribute('aria-hidden', 'true');
      summary.appendChild(arrow);
    });
  }

  function repair(root) {
    root = root || document;
    installGameTranslator();
    fixDiscounts(root);
    fixCostumeStatuses(root);
    fixCharacterStatuses(root);
    fixPlannedReleases(root);
    fixTierGentle(root);
    fixPatchModal(root);
    fixCardTags(root);
    fixModsTutorial(root);
    replaceExactText(root);
  }

  function wrapRender() {
    if (typeof window.render !== 'function' || window.render.__mhurV561) return;
    var original = window.render;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      repair(document);
      return result;
    };
    wrapped.__mhurV561 = true;
    window.render = wrapped;
    try { render = wrapped; } catch (_) {}
  }

  function scheduleRepair() {
    requestAnimationFrame(function () { repair(document); });
    setTimeout(function () { repair(document); }, 60);
    setTimeout(function () { repair(document); }, 250);
  }

  function install() {
    wrapRender();
    repair(document);
    document.addEventListener('click', function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest('[data-page],.card,.styleCard,.costumeTile,.releaseCardV299,[data-mod-open],[data-mod-edit],#modsPublishBtn,[data-s18-notes-button],#mhurPatchDevButtonV14,[data-open-patch-notes],#langToggle,.langToggle')
        : null;
      if (target) scheduleRepair();
    }, true);
    window.addEventListener('mhur:languagechange', scheduleRepair);
    window.addEventListener('popstate', scheduleRepair);
    setTimeout(function () { repair(document); }, 300);
    setTimeout(function () { repair(document); }, 1200);
    window.MHUR_V561 = { version: VERSION, repair: repair, translateGameText: translateGameText };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
