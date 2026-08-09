(() => {
  'use strict';

  const MARK = 'MHUR_V26_EXACT_STATS_RUNTIME';

  const currentLang = () => {
    try {
      return (typeof lang !== 'undefined' && lang === 'en') ? 'en' : 'fr';
    } catch (_e) {
      return 'fr';
    }
  };

  function pick(value, language = currentLang()) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value[language] ?? value.fr ?? value.en ?? '';
    }
    return value;
  }

  function clean(value) {
    return String(pick(value) ?? '')
      .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function norm(value) {
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function readExact() {
    const node = document.getElementById('ultrarumble-exact-data');
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || '{}');
    } catch (_e) {
      return null;
    }
  }

  function columns(table) {
    return Array.isArray(table?.columns)
      ? table.columns.map(value => String(value ?? ''))
      : Array.isArray(table?.cols)
        ? table.cols.map(value => String(value ?? ''))
        : [];
  }

  function rows(table) {
    return Array.isArray(table?.rows)
      ? table.rows
          .filter(Array.isArray)
          .map(row => row.map(value => String(value ?? '')))
      : [];
  }

  function translateColumn(value, language) {
    const key = norm(value);
    const fr = {
      type: 'Type',
      level: 'Niveau',
      damage: 'Dégâts',
      ammo: 'Munitions',
      use_ammo: 'Consommation',
      reload: 'Recharge',
      down_power: 'Down Power',
      level_up_effect: 'Effet'
    };
    const en = {
      type: 'Type',
      level: 'Level',
      damage: 'Damage',
      ammo: 'Ammo',
      use_ammo: 'Use Ammo',
      reload: 'Reload',
      down_power: 'Down Power',
      level_up_effect: 'Effect'
    };
    return (language === 'fr' ? fr : en)[key] || clean(value);
  }

  function effectTable(symbol, remote, oldTables) {
    const sourceRows = rows(remote);
    if (!sourceRows.length) {
      return (oldTables || []).filter(table => {
        const title = norm(clean(table?.title));
        return title.includes('effet') || title.includes('effect');
      });
    }

    const sourceCols = columns(remote);
    const keep = sourceCols
      .map((col, index) => ({ col, index }))
      .filter(item => !['down_power', 'down'].includes(norm(item.col)));

    return [{
      title: {
        fr: `Effets de montée ${symbol}`,
        en: `${symbol} level-up effects`
      },
      cols: {
        fr: keep.map(item => translateColumn(item.col, 'fr')),
        en: keep.map(item => translateColumn(item.col, 'en'))
      },
      rows: {
        fr: sourceRows.map(row => keep.map(item => clean(row[item.index] ?? ''))),
        en: sourceRows.map(row => keep.map(item => clean(row[item.index] ?? '')))
      },
      __v26: 'effect'
    }];
  }

  function baseTable(symbol, remote) {
    const sourceRows = rows(remote);
    if (!sourceRows.length) return null;

    const sourceCols = columns(remote);
    const keep = sourceCols
      .map((col, index) => ({ col, index }))
      .filter(item => !['down_power', 'down'].includes(norm(item.col)));

    return {
      title: {
        fr: `Valeurs de base ${symbol}`,
        en: `Base ${symbol} values`
      },
      cols: {
        fr: keep.map(item => translateColumn(item.col, 'fr')),
        en: keep.map(item => translateColumn(item.col, 'en'))
      },
      rows: {
        fr: sourceRows.map(row => keep.map(item => clean(row[item.index] ?? ''))),
        en: sourceRows.map(row => keep.map(item => clean(row[item.index] ?? '')))
      },
      __v26: 'base'
    };
  }

  function typeLabel(rawType, styleKey, symbol, groupIndex, groupCount) {
    const original = clean(rawType) || 'Value';
    const key = norm(original);

    const mappings = [
      [['melee_combat', 'melee'], 'Corps à corps', 'Melee Combat'],
      [['upon_activation', 'activation'], 'Activation', 'Activation'],
      [['shockwave'], 'Onde de choc', 'Shockwave'],
      [['bullet', 'projectile'], 'Projectile', 'Projectile'],
      [['rush'], 'Ruée', 'Rush'],
      [['rebound', 'bounce'], 'Rebond', 'Rebound'],
      [['impact'], 'Impact final', 'Impact'],
      [['explosion'], 'Explosion', 'Explosion'],
      [['short_range'], 'Distance courte', 'Short Range'],
      [['middle_range', 'medium_range'], 'Distance moyenne', 'Medium Range'],
      [['long_range', 'max_range'], 'Distance longue', 'Long Range'],
      [['charge'], 'Charge', 'Charge'],
      [['pull', 'grab'], 'Attraction', 'Pull'],
      [['finish', 'finisher'], 'Finale', 'Finisher'],
      [['normal'], 'Normal', 'Normal']
    ];

    let fr = original;
    let en = original;

    for (const [needles, frLabel, enLabel] of mappings) {
      if (needles.some(needle => key.includes(needle))) {
        fr = frLabel;
        en = enLabel;
        break;
      }
    }

    // Gentle γ : la source contient actuellement trois cycles portant
    // le même Type "Rush". On les garde séparés dans l'ordre officiel.
    if (
      norm(styleKey).includes('gentle_criminal') &&
      symbol === 'γ' &&
      groupCount >= 3
    ) {
      const labels = [
        ['Ruée', 'Rush'],
        ['Rebond', 'Rebound'],
        ['Impact final', 'Impact']
      ];
      if (labels[groupIndex]) {
        [fr, en] = labels[groupIndex];
      }
    }

    return { fr, en };
  }

  function additionalTables(symbol, remote, styleKey) {
    const sourceCols = columns(remote);
    const sourceRows = rows(remote);
    if (!sourceRows.length) return [];

    const normalized = sourceCols.map(norm);
    let typeIndex = normalized.indexOf('type');
    let levelIndex = normalized.indexOf('level');
    let damageIndex = normalized.indexOf('damage');

    if (typeIndex < 0) typeIndex = 0;
    if (levelIndex < 0) levelIndex = 1;
    if (damageIndex < 0) damageIndex = 2;

    const groups = [];
    let current = null;
    let lastType = 'Value';

    for (const source of sourceRows) {
      const row = [...source];
      const detectedLevel = row.findIndex(value =>
        /^Lv\.\d+$/i.test(String(value || '').trim())
      );
      const li = detectedLevel >= 0 ? detectedLevel : levelIndex;
      const level = String(row[li] ?? '').trim();
      if (!/^Lv\.\d+$/i.test(level)) continue;

      let rawType = String(row[typeIndex] ?? '').trim();
      if (rawType) lastType = rawType;
      rawType = rawType || lastType || 'Value';

      const key = norm(rawType) || 'value';
      const restart = /^Lv\.1$/i.test(level) && current && current.rows.length;
      const changedType = current && current.key !== key;

      if (!current || restart || changedType) {
        current = { key, rawType, rows: [] };
        groups.push(current);
      }

      let damage = String(row[damageIndex] ?? '').trim();
      if (!damage && li + 1 < row.length) {
        damage = String(row[li + 1] ?? '').trim();
      }

      current.rows.push({ level, damage });
    }

    return groups.map((group, index) => {
      const labels = typeLabel(
        group.rawType,
        styleKey,
        symbol,
        index,
        groups.length
      );

      return {
        title: {
          fr: `Dégâts ${symbol} — ${labels.fr}`,
          en: `${symbol} Damage — ${labels.en}`
        },
        cols: {
          fr: ['Type', 'Niveau', 'Dégâts'],
          en: ['Type', 'Level', 'Damage']
        },
        rows: {
          fr: group.rows.map(row => [labels.fr, row.level, row.damage]),
          en: group.rows.map(row => [labels.en, row.level, row.damage])
        },
        __v26: 'additional'
      };
    });
  }

  function skillByLetter(style, symbol) {
    const aliases = {
      'α': ['α', 'alpha', 'a'],
      'β': ['β', 'beta', 'b'],
      'γ': ['γ', 'gamma', 'g']
    }[symbol] || [symbol];

    return (style?.skills || []).find(skill =>
      aliases.includes(String(skill?.letter || '').trim().toLowerCase())
    ) || null;
  }

  function syncSkill(localSkill, remoteSkill, styleKey, symbol) {
    if (!localSkill || !remoteSkill) return 0;

    const oldTables = Array.isArray(localSkill.tables)
      ? localSkill.tables
      : [];

    const next = [];
    next.push(...effectTable(symbol, remoteSkill.level_up_effects, oldTables));

    const base = baseTable(symbol, remoteSkill.base_values);
    if (base) next.push(base);

    next.push(...additionalTables(
      symbol,
      remoteSkill.additional_values,
      styleKey
    ));

    if (!next.length) return 0;

    localSkill.tables = next;
    return 1;
  }

  function syncAll() {
    const data = readExact();

    if (
      typeof styles === 'undefined' ||
      !data ||
      !data.exact_by_style
    ) {
      return {
        loaded: false,
        mapped: 0,
        changed: 0,
        marker: MARK
      };
    }

    let changed = 0;
    let mapped = 0;

    Object.entries(data.exact_by_style).forEach(([styleKey, remote]) => {
      const local = styles[styleKey];
      if (!local || !remote) return;
      mapped += 1;

      const hp =
        remote?.stats?.['Max Main Health'] ??
        remote?.stats?.['Max Health'] ??
        remote?.stats?.['Max HP'];

      if (hp !== undefined && hp !== null && hp !== '') {
        local.pv = String(hp);
      }

      for (const symbol of ['α', 'β', 'γ']) {
        changed += syncSkill(
          skillByLetter(local, symbol),
          remote?.skills?.[symbol],
          styleKey,
          symbol
        );
      }
    });

    const status = {
      loaded: true,
      mapped,
      changed,
      marker: MARK
    };

    window.__MHUR_V26_STATS_STATUS__ = status;
    return status;
  }

  function hookRender() {
    try {
      if (typeof render !== 'function') return;
      if (render.__mhurV26Wrapped) return;

      const previous = render;
      const wrapped = function () {
        try { syncAll(); } catch (_e) {}
        return previous.apply(this, arguments);
      };
      wrapped.__mhurV26Wrapped = true;

      render = wrapped;
      window.__MHUR_V26_RENDER_HOOK__ = true;
    } catch (_e) {}
  }

  window.MHUR_V26_STATS_SYNC = syncAll;

  try {
    syncAll();
    hookRender();
  } catch (_e) {}

  document.addEventListener('DOMContentLoaded', () => {
    try {
      syncAll();
      hookRender();
    } catch (_e) {}
  });

  setTimeout(() => {
    try {
      syncAll();
      hookRender();
      if (typeof render === 'function') render();
    } catch (_e) {}
  }, 0);

  setTimeout(() => {
    try { syncAll(); } catch (_e) {}
  }, 250);
})();
