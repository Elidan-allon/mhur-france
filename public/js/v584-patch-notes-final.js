
/* MHUR Nexus — V584 : Patch Notes doublement vérifiés */
(function(){
  'use strict';

  function language(){
    try{
      return typeof lang !== 'undefined' && lang === 'en' ? 'en' : 'fr';
    }catch(_error){
      return 'fr';
    }
  }

  function pick(value){
    if(value && typeof value === 'object' && !Array.isArray(value)){
      return value[language()] ?? value.fr ?? value.en ?? '';
    }
    return value;
  }

  function clean(value){
    return String(pick(value) ?? '').trim();
  }

  function normal(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function comparableName(value){
    return normal(value)
      .replace(/\bfeet\b/g, 'foot')
      .replace(/\bquirk skill\b/g, '')
      .replace(/\balter\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function numberValue(value){
    const match = String(value ?? '')
      .replace(',', '.')
      .match(/[-+]?\d+(?:\.\d+)?/);

    return match ? Number(match[0]) : null;
  }

  function values(value){
    return Array.isArray(value) ? value : [value];
  }

  function metricDirection(context){
    const text = normal(context);

    if(
      /(reload|recharge|cooldown|recovery) speed|speed (reload|recharge|cooldown|recovery)|vitesse de (recharge|rechargement|recuperation)/
        .test(text)
    ){
      return 1;
    }

    if(
      /reload time|recharge time|cooldown time|charge time|recovery time|temps de recharge|temps de rechargement|reload|recharge|cooldown|interval|delay|startup|start up|end lag|second|seconde|time|temps|use ammo|ammo use|consumption|consommation|cost|cout|damage taken|degats subis|penalty|penalite/
        .test(text)
    ){
      return -1;
    }

    if(
      /damage|degats|ammo|munition|round|magazine|health|hp|pv|guard|armor|armure|range|portee|size|taille|radius|rayon|power|puissance|speed|vitesse|duration|duree|distance|amount|quantite|number|nombre|count|max/
        .test(text)
    ){
      return 1;
    }

    return 0;
  }

  function explicitTone(change){
    const tone = normal(change?.tone || change?.type || '');

    if(/\b(buff|increase|improve|up)\b/.test(tone)) return 'buff';
    if(/\b(nerf|decrease|reduce|down)\b/.test(tone)) return 'nerf';

    return 'adjust';
  }

  function verifiedTone(change, sectionTitle){
    const context = [
      sectionTitle,
      change?.label,
      change?.skill_name,
      change?.stat,
      change?.metric,
      ...(change?.bullets || [])
    ].filter(Boolean).join(' ');

    const direction = metricDirection(context);

    if(direction){
      const before = values(change?.before);
      const after = values(change?.after);
      const results = [];

      for(let index = 0; index < Math.min(before.length, after.length); index += 1){
        const oldValue = numberValue(before[index]);
        const newValue = numberValue(after[index]);

        if(!Number.isFinite(oldValue) || !Number.isFinite(newValue)) continue;

        const result = (newValue - oldValue) * direction;
        if(Math.abs(result) > 1e-9) results.push(result);
      }

      if(results.length){
        if(results.every(result => result > 0)) return 'buff';
        if(results.every(result => result < 0)) return 'nerf';
        return 'adjust';
      }
    }

    return explicitTone(change);
  }

  function characterList(){
    try{
      if(typeof characters !== 'undefined' && Array.isArray(characters)){
        return characters;
      }
    }catch(_error){}

    return Array.isArray(window.characters) ? window.characters : [];
  }

  function styleMap(){
    try{
      if(typeof styles !== 'undefined' && styles){
        return styles;
      }
    }catch(_error){}

    return window.styles || {};
  }

  function characterFor(change){
    const wanted = normal(change?.character || '');
    if(!wanted) return null;

    return characterList().find(character => {
      return (
        normal(character?.id) === wanted ||
        normal(character?.name) === wanted ||
        normal(character?.name).includes(wanted) ||
        wanted.includes(normal(character?.name))
      );
    }) || null;
  }

  function letterCode(value){
    const raw = clean(value);
    const normalized = normal(raw);

    if(
      /^(?:sp|special)(?:\s|[-—:])/i.test(raw) ||
      normalized === 'sp' ||
      normalized.startsWith('special action')
    ){
      return 'sp';
    }

    if(
      /^(?:α|a|alpha)(?:\s|[-—:])/i.test(raw) ||
      normalized.startsWith('alpha ')
    ){
      return 'alpha';
    }

    if(
      /^(?:β|b|beta)(?:\s|[-—:])/i.test(raw) ||
      normalized.startsWith('beta ')
    ){
      return 'beta';
    }

    /*
      Les notes de patch utilisent Y pour la touche de l'Alter γ.
      G et Gamma sont également acceptés.
    */
    if(
      /^(?:γ|y|g|gamma)(?:\s|[-—:])/i.test(raw) ||
      normalized.startsWith('gamma ')
    ){
      return 'gamma';
    }

    return '';
  }

  function skillLetterCode(value){
    const raw = clean(value);
    const normalized = normal(raw);

    if(/^sp$/i.test(raw) || normalized === 'sp') return 'sp';
    if(/^(?:α|a|alpha)$/i.test(raw) || normalized === 'alpha') return 'alpha';
    if(/^(?:β|b|beta)$/i.test(raw) || normalized === 'beta') return 'beta';
    if(/^(?:γ|y|g|gamma)$/i.test(raw) || normalized === 'gamma') return 'gamma';

    return '';
  }

  function skillsFor(style){
    return [
      {...(style?.special || {}), letter: 'SP', special: true},
      ...(Array.isArray(style?.skills) ? style.skills : [])
    ];
  }

  function resolveSkill(change){
    const allStyles = styleMap();
    const character = characterFor(change);
    const ids = Array.isArray(character?.styles)
      ? character.styles.map(String)
      : [];

    if(!ids.length){
      return {character, styleId: '', style: null, skill: null};
    }

    const wantedStyle = normal(change?.style || 'Original');
    const wantedCode = letterCode(
      change?.skill_letter ||
      change?.skill ||
      change?.skill_name ||
      change?.label ||
      ''
    );
    const wantedName = comparableName(
      change?.skill_name || change?.label || ''
    );

    const orderedIds = [...ids].sort((first, second) => {
      const firstMatch = normal(allStyles[first]?.name || 'Original') === wantedStyle;
      const secondMatch = normal(allStyles[second]?.name || 'Original') === wantedStyle;
      return Number(secondMatch) - Number(firstMatch);
    });

    let nameMatch = null;

    for(const styleId of orderedIds){
      const style = allStyles[styleId];
      if(!style) continue;

      const available = skillsFor(style);

      if(wantedCode){
        const byLetter = available.find(
          skill => skillLetterCode(skill?.letter) === wantedCode
        );

        if(byLetter){
          return {character, styleId, style, skill: byLetter};
        }
      }

      if(wantedName){
        const byName = available.find(skill => {
          const official = comparableName(skill?.name);
          return Boolean(
            official &&
            (
              official === wantedName ||
              official.includes(wantedName) ||
              wantedName.includes(official)
            )
          );
        });

        if(byName && !nameMatch){
          nameMatch = {character, styleId, style, skill: byName};
        }
      }
    }

    if(nameMatch) return nameMatch;

    const styleId = orderedIds[0] || '';
    return {
      character,
      styleId,
      style: allStyles[styleId] || null,
      skill: null
    };
  }

  function originalInputLetter(change){
    const raw = clean(
      change?.skill_letter ||
      change?.skill ||
      change?.skill_name ||
      ''
    );

    const match = raw.match(/^(SP|SPECIAL|[AABGY]|ALPHA|BETA|GAMMA|α|β|γ)(?=\s|[-—:])/i);
    if(!match) return '';

    const value = match[1];
    const code = letterCode(value + ' -');

    if(code === 'gamma' && /^y$/i.test(value)) return 'Y';
    if(code === 'gamma' && /^g$/i.test(value)) return 'G';
    if(code === 'alpha' && /^a$/i.test(value)) return 'A';
    if(code === 'beta' && /^b$/i.test(value)) return 'B';
    if(code === 'sp') return 'SP';

    return value;
  }

  function officialTitle(change, resolved){
    const skill = resolved?.skill;
    if(!skill) return clean(change?.skill_name || change?.label || '');

    const name = clean(skill?.name);
    if(!name) return clean(change?.skill_name || change?.label || '');

    const inputLetter = originalInputLetter(change);
    const officialLetter = clean(skill?.letter);
    const letter = inputLetter || officialLetter;

    return letter ? letter + ' — ' + name : name;
  }

  function groupKey(change, resolved){
    return (
      normal(change?.character) +
      '__' +
      (
        resolved?.styleId ||
        normal(change?.style || 'Original')
      )
    );
  }

  function prepareData(){
    const notes = window.MHUR_HOME_DATA?.patch_notes || [];

    notes.forEach(note => {
      (note?.details || []).forEach(section => {
        (section?.changes || []).forEach(change => {
          if(!change || typeof change !== 'object') return;

          change.tone = verifiedTone(change, section?.title || '');

          const resolved = resolveSkill(change);
          const title = officialTitle(change, resolved);

          change.__mhurV584 = {
            title,
            sourceSkillName: clean(
              change?.display_skill_name ||
              change?.skill_name ||
              ''
            ),
            image: clean(resolved?.skill?.img || change?.skill_image || ''),
            styleId: resolved?.styleId || '',
            key: groupKey(change, resolved)
          };

          /*
            Le moteur existant retrouve désormais aussi l'objet Alter officiel.
            Le titre final est ensuite imposé par V584 dans le DOM.
          */
          if(resolved?.skill?.name){
            change.skill_name = clean(resolved.skill.name);
          }
        });
      });
    });
  }

  function orderedChanges(section){
    const groups = [];
    const map = new Map();

    (section?.changes || []).forEach(change => {
      if(!change || typeof change !== 'object') return;

      const resolved = resolveSkill(change);
      const key = change.__mhurV584?.key || groupKey(change, resolved);

      if(!map.has(key)){
        const group = [];
        map.set(key, group);
        groups.push(group);
      }

      map.get(key).push(change);
    });

    return groups.flat();
  }

  function activeNoteIndex(modal){
    const active = modal.querySelector(
      '[data-patch-index].active'
    );

    const value = Number(active?.dataset?.patchIndex);
    return Number.isFinite(value) ? value : 0;
  }

  let applying = false;

  function applyToModal(){
    if(applying) return;

    const modal = document.querySelector('.s18NotesModalV10');
    if(!modal || !modal.classList.contains('open')) return;

    const notes = window.MHUR_HOME_DATA?.patch_notes || [];
    const note = notes[activeNoteIndex(modal)];
    if(!note) return;

    applying = true;

    try{
      prepareData();

      const dataSections = (note?.details || [])
        .map(section => ({
          ...section,
          changes: (section?.changes || []).filter(Boolean)
        }))
        .filter(section => section.changes.length);

      const domSections = [
        ...modal.querySelectorAll(
          '.s18NotesBodyV10 > main .s18PatchSectionV10'
        )
      ];

      domSections.forEach((sectionNode, sectionIndex) => {
        const dataSection = dataSections[sectionIndex];
        if(!dataSection) return;

        const changes = orderedChanges(dataSection);
        const cards = [
          ...sectionNode.querySelectorAll('.s18PatchChangeV10')
        ];

        cards.forEach((card, changeIndex) => {
          const change = changes[changeIndex];
          if(!change) return;

          const tone = verifiedTone(
            change,
            dataSection?.title || ''
          );

          card.classList.remove('buff', 'nerf', 'adjust');
          card.classList.add(tone);

          const badge = card.querySelector('.s18ToneV10');
          if(badge){
            badge.classList.remove('buff', 'nerf', 'adjust');
            badge.classList.add(tone);

            const label = tone === 'buff'
              ? 'BUFF'
              : tone === 'nerf'
                ? 'NERF'
                : language() === 'fr'
                  ? 'NEUTRE'
                  : 'NEUTRAL';

            if(badge.textContent !== label){
              badge.textContent = label;
            }
          }

          const resolved = resolveSkill(change);
          const title = officialTitle(change, resolved);

          const heading = card.querySelector('h5');
          if(heading && title && heading.textContent !== title){
            heading.textContent = title;
          }

          const image = clean(
            resolved?.skill?.img ||
            change.__mhurV584?.image ||
            ''
          );

          const picture = card.querySelector(
            '.s18PatchSkillV10 img'
          );

          if(picture && image && picture.getAttribute('src') !== image){
            picture.setAttribute('src', image);
          }
        });
      });
    }finally{
      applying = false;
    }
  }

  let scheduled = false;

  function schedule(){
    if(scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      applyToModal();
    });
  }

  prepareData();

  new MutationObserver(mutations => {
    if(
      mutations.some(mutation =>
        mutation.addedNodes?.length ||
        mutation.type === 'attributes'
      )
    ){
      schedule();
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  document.addEventListener('click', event => {
    if(
      event.target?.closest?.(
        '[data-patch-index],[data-tab="patch"],' +
        '#mhurPatchDevButton,.mhurPatchDevButton'
      )
    ){
      prepareData();
      schedule();
    }
  }, true);

  window.addEventListener('mhur:languagechange', () => {
    prepareData();
    schedule();
  });

  window.addEventListener('hashchange', schedule);
  window.addEventListener('load', schedule, {once: true});

  window.MHUR_V584_PATCH_NOTES = {
    refresh(){
      prepareData();
      applyToModal();
    },
    verifiedTone,
    resolveSkill
  };
})();
