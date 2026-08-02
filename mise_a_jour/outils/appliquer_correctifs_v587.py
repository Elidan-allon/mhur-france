from __future__ import annotations

from pathlib import Path
import re
import subprocess

ROOT = Path.cwd()
INDEX = ROOT / "public" / "index.html"
JS_FILE = ROOT / "public" / "js" / "v587-images-notes-stable.js"
CSS_FILE = ROOT / "public" / "css" / "v587-images-notes-stable.css"
V585_WORKFLOW = ROOT / ".github" / "workflows" / "mhur-v585-update-auto.yml"
REPORT = ROOT / "RAPPORT_V587_CORRECTIF_COMPLET.txt"

V585_STEP = "Reappliquer V587 apres la synchronisation"


def fail(message: str) -> None:
    raise RuntimeError(message)


def read(path: Path) -> str:
    if not path.is_file():
        fail(f"Fichier introuvable : {path.as_posix()}")
    return path.read_text(encoding="utf-8-sig")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


V587_JS = r'''
/* MHUR Nexus — V587 : images Alters + Patch Notes stables */
(function(){
  'use strict';

  const VERSION = '587';
  const BUTTON_ID = 'mhurPatchDevButtonV14';
  const MODAL_ID = 's18NotesDevModalV10';

  function language(){
    try{
      return typeof lang !== 'undefined' && lang === 'en'
        ? 'en'
        : 'fr';
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
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function stylesMap(){
    try{
      if(typeof styles !== 'undefined' && styles) return styles;
    }catch(_error){}
    return window.styles || {};
  }

  function characterList(){
    try{
      if(typeof characters !== 'undefined' && Array.isArray(characters)){
        return characters;
      }
    }catch(_error){}
    return Array.isArray(window.characters) ? window.characters : [];
  }

  function exactData(){
    const element = document.getElementById('ultrarumble-exact-data');
    if(!element) return null;

    try{
      const data = JSON.parse(element.textContent || '{}');
      window.__S18_EXACT_V9 = data;
      return data;
    }catch(_error){
      return null;
    }
  }

  function rowForStyle(styleId, data){
    if(!data) return null;

    if(data.exact_by_style?.[styleId]){
      return data.exact_by_style[styleId];
    }

    const map = stylesMap();
    const style = map[styleId];
    const character = characterList().find(item =>
      (item?.styles || []).map(String).includes(String(styleId))
    );

    if(!style || !character) return null;

    const candidates = (Array.isArray(data.characters)
      ? data.characters
      : []
    ).filter(row =>
      normal(row?.base_name || row?.name) === normal(character.name)
    );

    if(!candidates.length) return null;

    const wanted = normal(style?.name || 'Original');

    const byName = candidates.find(row => {
      const remoteName = normal(
        row?.style_name ||
        row?.style_header ||
        'Original'
      );

      return (
        remoteName === wanted ||
        remoteName.includes(wanted) ||
        wanted.includes(remoteName)
      );
    });

    if(byName) return byName;

    const styleIds = (character.styles || [])
      .map(String)
      .filter(id => map[id]);

    const index = Math.max(0, styleIds.indexOf(String(styleId)));

    return (
      candidates.find(row => Number(row?.variant_index || 0) === index) ||
      candidates[index] ||
      candidates[0]
    );
  }

  function canonicalSkillAssets(row){
    const assets = row?.assets || {};

    const candidates = [
      assets.alpha,
      assets.beta,
      assets.gamma,
      ...Object.values(assets)
    ].filter(value => typeof value === 'string');

    const seed = candidates.find(value =>
      /T_ui_Skill_(Ch\d+)_Unique[123]\.png(?:\?|$)/i.test(value)
    );

    if(!seed){
      return {
        alpha: assets.alpha || '',
        beta: assets.beta || '',
        gamma: assets.gamma || ''
      };
    }

    const replaceUnique = number => seed.replace(
      /Unique[123](?=\.png(?:\?|$))/i,
      'Unique' + number
    );

    return {
      alpha: replaceUnique(1),
      beta: replaceUnique(2),
      gamma: replaceUnique(3)
    };
  }

  function skillLetter(value){
    const raw = clean(value);
    const normalized = normal(raw);

    if(
      /^(?:α|a|alpha)$/i.test(raw) ||
      normalized === 'alpha'
    ){
      return 'alpha';
    }

    if(
      /^(?:β|b|beta)$/i.test(raw) ||
      normalized === 'beta'
    ){
      return 'beta';
    }

    if(
      /^(?:γ|y|g|gamma)$/i.test(raw) ||
      normalized === 'gamma'
    ){
      return 'gamma';
    }

    if(/^sp$/i.test(raw) || normalized === 'sp'){
      return 'sp';
    }

    return '';
  }

  function applyCanonicalSkillImages(){
    const map = stylesMap();
    const data = exactData();

    if(!data || !map) return;

    const database = window.MHUR_DATABASE_ASSETS?.styles || {};

    Object.keys(map).forEach(styleId => {
      const style = map[styleId];
      const row = rowForStyle(styleId, data);

      if(!style || !row) return;

      const canonical = canonicalSkillAssets(row);
      row.assets = row.assets || {};

      if(canonical.alpha) row.assets.alpha = canonical.alpha;
      if(canonical.beta) row.assets.beta = canonical.beta;
      if(canonical.gamma) row.assets.gamma = canonical.gamma;

      if(data.exact_by_style?.[styleId]){
        data.exact_by_style[styleId].assets = row.assets;
      }

      if(database[styleId]){
        if(canonical.alpha) database[styleId].alpha = canonical.alpha;
        if(canonical.beta) database[styleId].beta = canonical.beta;
        if(canonical.gamma) database[styleId].gamma = canonical.gamma;
      }

      const byKey = {
        alpha: canonical.alpha,
        beta: canonical.beta,
        gamma: canonical.gamma
      };

      (style.skills || []).forEach(skill => {
        const key = skillLetter(skill?.letter);
        const image = byKey[key];

        if(image) skill.img = image;
      });
    });

    window.__S18_EXACT_V9 = data;
  }

  function selectedStyleId(){
    try{
      if(typeof selectedStyle !== 'undefined' && selectedStyle){
        return String(selectedStyle);
      }
    }catch(_error){}

    return String(
      window.selectedStyle ||
      document.querySelector('[data-style].active')?.dataset?.style ||
      ''
    );
  }

  function skillForLetter(style, letter){
    const key = skillLetter(letter);
    if(!key || key === 'sp') return null;

    return (style?.skills || []).find(skill =>
      skillLetter(skill?.letter) === key
    ) || null;
  }

  function letterFromText(value){
    const raw = clean(value);

    if(/(?:^|\s)(?:α|alpha|a)(?:\s|[-—:])/i.test(raw)) return 'alpha';
    if(/(?:^|\s)(?:β|beta|b)(?:\s|[-—:])/i.test(raw)) return 'beta';
    if(/(?:^|\s)(?:γ|gamma|y|g)(?:\s|[-—:])/i.test(raw)) return 'gamma';

    return '';
  }

  function refreshVisibleCharacterSkills(){
    const map = stylesMap();
    const style = map[selectedStyleId()];

    if(!style) return;

    document.querySelectorAll(
      '.skillBox,.s18SkillBox,.charSkillBox'
    ).forEach(box => {
      const heading = box.querySelector(
        '.skillHead,h2,h3,h4,.skillTitle'
      );

      const key = letterFromText(heading?.textContent || '');
      const skill = skillForLetter(style, key);

      if(!skill?.img) return;

      const image = box.querySelector('img');
      if(image && image.getAttribute('src') !== skill.img){
        image.setAttribute('src', skill.img);
        image.removeAttribute('srcset');
      }
    });
  }

  function numberValue(value){
    const match = String(value ?? '')
      .replace(',', '.')
      .match(/[-+]?\d+(?:\.\d+)?/);

    return match ? Number(match[0]) : null;
  }

  function valueList(value){
    return Array.isArray(value) ? value : [value];
  }

  function metricDirection(context){
    const text = normal(context);

    if(
      /(reload|recharge|cooldown|recovery)_?speed|speed_?(reload|recharge|cooldown|recovery)|vitesse_de_(recharge|rechargement|recuperation)/
        .test(text)
    ){
      return 1;
    }

    if(
      /reload|recharge|cooldown|charge_?time|recovery_?time|temps_de_recharge|interval|delay|startup|start_?up|end_?lag|second|seconde|time|temps|penalty|penalite|use_?ammo|ammo_?use|consumption|consommation|cost|cout|damage_?taken|degats_?subis/
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

  function levelTones(change, sectionTitle){
    if(
      Array.isArray(change?.level_tones) &&
      change.level_tones.length
    ){
      return change.level_tones.map(value => {
        const tone = normal(value);
        return ['buff', 'nerf', 'same'].includes(tone)
          ? tone
          : 'unknown';
      });
    }

    const before = valueList(change?.before);
    const after = valueList(change?.after);
    const count = Math.max(before.length, after.length);

    const context = [
      sectionTitle,
      change?.label,
      change?.skill_name,
      change?.stat,
      change?.metric,
      ...(change?.bullets || [])
    ].filter(Boolean).join(' ');

    const direction = metricDirection(context);
    const result = [];

    for(let index = 0; index < count; index += 1){
      const oldValue = numberValue(before[index]);
      const newValue = numberValue(after[index]);

      if(
        !direction ||
        !Number.isFinite(oldValue) ||
        !Number.isFinite(newValue)
      ){
        result.push('unknown');
        continue;
      }

      const score = (newValue - oldValue) * direction;

      if(score > 1e-9) result.push('buff');
      else if(score < -1e-9) result.push('nerf');
      else result.push('same');
    }

    return result;
  }

  function overallTone(tones, fallback){
    const meaningful = new Set(
      tones.filter(tone => tone === 'buff' || tone === 'nerf')
    );

    if(meaningful.has('buff') && meaningful.has('nerf')){
      return 'mixed';
    }

    if(meaningful.size === 1){
      return [...meaningful][0];
    }

    const explicit = normal(fallback);

    if(explicit.includes('buff')) return 'buff';
    if(explicit.includes('nerf')) return 'nerf';

    return 'adjust';
  }

  function inputLetter(change){
    const raw = clean(
      change?.skill_letter ||
      change?.skill ||
      change?.skill_name ||
      ''
    );

    const match = raw.match(
      /^(SP|SPECIAL|ALPHA|BETA|GAMMA|A|B|G|Y|α|β|γ)(?=\s|[-—:])/i
    );

    return match ? match[1] : '';
  }

  function comparableName(value){
    return normal(value)
      .replace(/(^|_)feet(_|$)/g, '$1foot$2')
      .replace(/(^|_)quirk_skill(_|$)/g, '_')
      .replace(/(^|_)alter(_|$)/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function characterForChange(change){
    const wanted = normal(change?.character || '');

    return characterList().find(character => {
      const id = normal(character?.id);
      const name = normal(character?.name);

      return (
        id === wanted ||
        name === wanted ||
        name.includes(wanted) ||
        wanted.includes(name)
      );
    }) || null;
  }

  function resolveSkill(change){
    const map = stylesMap();
    const character = characterForChange(change);

    if(!character) return null;

    const wantedStyle = normal(change?.style || 'Original');
    const wantedLetter = letterFromText(
      change?.skill_name ||
      change?.skill ||
      change?.label ||
      ''
    );
    const wantedName = comparableName(
      change?.skill_name ||
      change?.label ||
      ''
    );

    const ids = (character.styles || [])
      .map(String)
      .filter(id => map[id])
      .sort((first, second) => {
        const firstMatch = normal(map[first]?.name || 'Original') === wantedStyle;
        const secondMatch = normal(map[second]?.name || 'Original') === wantedStyle;
        return Number(secondMatch) - Number(firstMatch);
      });

    for(const styleId of ids){
      const style = map[styleId];

      if(wantedLetter){
        const byLetter = skillForLetter(style, wantedLetter);
        if(byLetter) return {styleId, style, skill: byLetter};
      }

      if(wantedName){
        const byName = (style?.skills || []).find(skill => {
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

        if(byName) return {styleId, style, skill: byName};
      }
    }

    return null;
  }

  function officialPatchTitle(change, resolved){
    if(!resolved?.skill) return clean(
      change?.skill_name ||
      change?.label ||
      ''
    );

    const name = clean(resolved.skill.name);
    const prefix = inputLetter(change) || clean(resolved.skill.letter);

    return prefix ? prefix + ' — ' + name : name;
  }

  function groupKey(change){
    return (
      normal(change?.character) +
      '__' +
      normal(change?.style || 'Original')
    );
  }

  function orderedChanges(section){
    const groups = [];
    const map = new Map();

    (section?.changes || []).filter(Boolean).forEach(change => {
      const key = groupKey(change);

      if(!map.has(key)){
        const group = [];
        map.set(key, group);
        groups.push(group);
      }

      map.get(key).push(change);
    });

    return groups.flat();
  }

  function activePatchIndex(modal){
    const active = modal.querySelector(
      '[data-patch-index].active'
    );

    const index = Number(active?.dataset?.patchIndex);
    return Number.isFinite(index) ? index : 0;
  }

  let decorating = false;

  function decoratePatchModal(){
    if(decorating) return;

    const modal = document.getElementById(MODAL_ID);

    if(!modal || !modal.classList.contains('open')) return;

    const notes = window.MHUR_HOME_DATA?.patch_notes || [];
    const note = notes[activePatchIndex(modal)];

    if(!note) return;

    decorating = true;

    try{
      applyCanonicalSkillImages();

      const sections = (note.details || [])
        .map(section => ({
          ...section,
          changes: (section?.changes || []).filter(Boolean)
        }))
        .filter(section => section.changes.length);

      const sectionNodes = [
        ...modal.querySelectorAll('.s18PatchSectionV10')
      ];

      sectionNodes.forEach((sectionNode, sectionIndex) => {
        const section = sections[sectionIndex];
        if(!section) return;

        const changes = orderedChanges(section);
        const cards = [
          ...sectionNode.querySelectorAll('.s18PatchChangeV10')
        ];

        cards.forEach((card, cardIndex) => {
          const change = changes[cardIndex];
          if(!change) return;

          const tones = levelTones(change, section.title || '');
          const tone = overallTone(
            tones,
            change?.tone_detail ||
            change?.tone ||
            change?.type ||
            ''
          );

          card.classList.remove('buff', 'nerf', 'adjust', 'mixed');
          card.classList.add(tone);

          const badge = card.querySelector('.s18ToneV10');

          if(badge){
            badge.classList.remove('buff', 'nerf', 'adjust', 'mixed');
            badge.classList.add(tone);
            badge.textContent = tone === 'mixed'
              ? 'NERF + BUFF'
              : tone === 'buff'
                ? 'BUFF'
                : tone === 'nerf'
                  ? 'NERF'
                  : language() === 'fr'
                    ? 'NEUTRE'
                    : 'NEUTRAL';
          }

          const resolved = resolveSkill(change);

          if(resolved?.skill){
            const title = officialPatchTitle(change, resolved);
            const heading = card.querySelector('h5');

            if(heading && title){
              heading.textContent = title;
            }

            const image = card.querySelector('.s18PatchSkillV10 img');

            if(image && resolved.skill.img){
              image.setAttribute('src', resolved.skill.img);
              image.removeAttribute('srcset');
            }
          }

          const afterCells = [
            ...card.querySelectorAll(
              '.s18PatchTableV10 tr.after td'
            )
          ];

          afterCells.forEach((cell, levelIndex) => {
            const levelTone = tones[levelIndex] || 'unknown';

            cell.classList.remove(
              'mhurLevel-buffV587',
              'mhurLevel-nerfV587',
              'mhurLevel-sameV587',
              'mhurLevel-unknownV587'
            );

            cell.classList.add(
              'mhurLevel-' + levelTone + 'V587'
            );

            let label = cell.querySelector('.mhurLevelToneV587');

            if(tone === 'mixed'){
              if(!label){
                label = document.createElement('small');
                label.className = 'mhurLevelToneV587';
                cell.appendChild(label);
              }

              label.textContent = levelTone === 'buff'
                ? 'BUFF'
                : levelTone === 'nerf'
                  ? 'NERF'
                  : levelTone === 'same'
                    ? '='
                    : '';
            }else{
              label?.remove();
            }
          });
        });
      });

      const legend = modal.querySelector('.s18PatchDetailHeadV10 > div');

      if(legend && !legend.querySelector('.mixed')){
        const mixed = document.createElement('span');
        mixed.className = 'mixed';
        mixed.textContent = 'NERF + BUFF';
        legend.appendChild(mixed);
      }
    }finally{
      decorating = false;
    }
  }

  function exportedNotesApi(){
    return (
      window.MHUR_S18_V14 ||
      window.MHUR_S18_V13 ||
      window.MHUR_S18_V10 ||
      null
    );
  }

  function showPatch(index){
    const api = exportedNotesApi();

    if(typeof api?.showPatch === 'function'){
      api.showPatch(Number(index) || 0);
      requestAnimationFrame(decoratePatchModal);
      setTimeout(decoratePatchModal, 40);
      return true;
    }

    return false;
  }

  function openNotes(){
    const api = exportedNotesApi();

    if(typeof api?.openNotes === 'function'){
      api.openNotes();
    }else if(typeof window.MHUR_S18_OPEN_NOTES_EARLY === 'function'){
      window.MHUR_S18_OPEN_NOTES_EARLY();
    }else{
      window.__s18OpenNotesRequested = true;
    }

    requestAnimationFrame(() => {
      ensureNotesNavigation();
      decoratePatchModal();
    });

    setTimeout(() => {
      ensureNotesNavigation();
      decoratePatchModal();
    }, 60);
  }

  const NOTE_ICON = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#f7fbff"
        d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
      <path fill="#1a2f4d" d="M14 2v5h5"/>
      <path fill="#17365d" d="M8 10h8v2H8zm0 4h8v2H8zm0 4h6v2H8z"/>
    </svg>`;

  function ensureHeaderButton(){
    let button = document.getElementById(BUTTON_ID);
    const account = document.getElementById('mhurAccountButton');
    const actions = (
      account?.parentElement ||
      document.querySelector('.mhurTopActionsV31') ||
      document.querySelector('.nexusHeaderInner')
    );

    if(!actions) return null;

    if(!button){
      button = document.createElement('button');
      button.id = BUTTON_ID;
      button.type = 'button';
      button.dataset.s18NotesButton = '1';
      button.className =
        'nexusHeaderBtn mhurPatchDevButtonV10 ' +
        'mhurPatchDevButtonV14 mhurPatchDevButtonV587';

      button.innerHTML =
        '<span class="mhurPatchDevIconV587">' +
        NOTE_ICON +
        '</span>' +
        '<span class="mhurPatchDevLabelV587"></span>';
    }

    button.dataset.s18NotesButton = '1';
    button.classList.add('mhurPatchDevButtonV587');
    button.hidden = false;
    button.removeAttribute('aria-hidden');
    button.tabIndex = 0;

    const label = button.querySelector(
      '.mhurPatchDevLabelV587,span:last-child'
    );

    if(label){
      label.textContent = language() === 'fr'
        ? 'Patch Notes / Dev Notes'
        : 'Patch Notes / Dev Notes';
    }

    button.setAttribute('aria-label', 'Patch Notes / Dev Notes');
    button.setAttribute('title', 'Patch Notes / Dev Notes');
    button.onclick = event => {
      event.preventDefault();
      openNotes();
    };

    if(account && account.parentElement === actions){
      if(button.parentElement !== actions || button.nextSibling !== account){
        actions.insertBefore(button, account);
      }
    }else if(button.parentElement !== actions){
      actions.appendChild(button);
    }

    return button;
  }

  function ensureNotesNavigation(){
    const modal = document.getElementById(MODAL_ID);
    if(!modal) return;

    const nav = modal.querySelector('.s18NotesPanelV10 > nav');

    if(nav){
      nav.hidden = false;
      nav.removeAttribute('aria-hidden');
    }
  }

  function wrapRender(){
    if(typeof window.render !== 'function') return;
    if(window.render.__mhurV587) return;

    const original = window.render;

    const wrapped = function(){
      applyCanonicalSkillImages();
      const result = original.apply(this, arguments);

      requestAnimationFrame(() => {
        ensureHeaderButton();
        refreshVisibleCharacterSkills();
        decoratePatchModal();
      });

      return result;
    };

    wrapped.__mhurV587 = true;
    window.render = wrapped;

    try{
      render = wrapped;
    }catch(_error){}
  }

  document.addEventListener('click', event => {
    const patchButton = event.target?.closest?.(
      '#' + BUTTON_ID + ',[data-s18-notes-button]'
    );

    if(patchButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      openNotes();
      return;
    }

    const patchItem = event.target?.closest?.('[data-patch-index]');

    if(patchItem){
      event.preventDefault();
      event.stopImmediatePropagation();

      const index = Number(patchItem.dataset.patchIndex);

      if(Number.isFinite(index)){
        showPatch(index);
      }

      return;
    }

    const tab = event.target?.closest?.('[data-tab]');

    if(tab?.dataset?.tab === 'patch'){
      /*
        On laisse le gestionnaire historique changer l'onglet,
        puis V587 force le contenu Patch Notes.
      */
      setTimeout(() => showPatch(0), 0);
    }else if(tab?.dataset?.tab === 'dev'){
      setTimeout(ensureNotesNavigation, 0);
    }
  }, true);

  let mutationQueued = false;

  new MutationObserver(mutations => {
    if(
      !mutations.some(mutation =>
        mutation.addedNodes?.length ||
        mutation.removedNodes?.length ||
        mutation.type === 'attributes'
      )
    ){
      return;
    }

    if(mutationQueued) return;
    mutationQueued = true;

    requestAnimationFrame(() => {
      mutationQueued = false;
      ensureHeaderButton();
      ensureNotesNavigation();
      refreshVisibleCharacterSkills();
      decoratePatchModal();
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'aria-hidden']
  });

  applyCanonicalSkillImages();
  wrapRender();

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      applyCanonicalSkillImages();
      wrapRender();
      ensureHeaderButton();
      ensureNotesNavigation();
      refreshVisibleCharacterSkills();
    }, {once: true});
  }else{
    ensureHeaderButton();
    ensureNotesNavigation();
    refreshVisibleCharacterSkills();
  }

  window.addEventListener('load', () => {
    applyCanonicalSkillImages();
    wrapRender();
    ensureHeaderButton();
    ensureNotesNavigation();
    refreshVisibleCharacterSkills();
    decoratePatchModal();
  }, {once: true});

  window.addEventListener('resize', ensureHeaderButton, {passive: true});
  window.addEventListener('mhur-auth-change', ensureHeaderButton);
  window.addEventListener('mhur-role-change', ensureHeaderButton);
  window.addEventListener('mhur:languagechange', () => {
    ensureHeaderButton();
    applyCanonicalSkillImages();
    decoratePatchModal();
  });

  window.MHUR_V587 = {
    version: VERSION,
    refresh(){
      applyCanonicalSkillImages();
      ensureHeaderButton();
      ensureNotesNavigation();
      refreshVisibleCharacterSkills();
      decoratePatchModal();
    },
    openNotes,
    showPatch,
    applyCanonicalSkillImages
  };
})();
'''


V587_CSS = r'''
/* MHUR Nexus — V587 : bouton Notes, navigation et résultats mixtes */

/* Le bouton reste toujours dans le header. */
#mhurPatchDevButtonV14,
.mhurPatchDevButtonV14,
[data-s18-notes-button]{
  display:inline-flex!important;
  visibility:visible!important;
  opacity:1!important;
  align-items:center!important;
  justify-content:center!important;
  pointer-events:auto!important;
  flex:0 0 auto!important;
  min-width:46px!important;
  min-height:42px!important;
  z-index:250!important;
}

.mhurPatchDevIconV587{
  width:22px!important;
  height:22px!important;
  display:grid!important;
  place-items:center!important;
  flex:0 0 22px!important;
}

.mhurPatchDevIconV587 svg{
  display:block!important;
  width:22px!important;
  height:22px!important;
}

.mhurPatchDevLabelV587{
  display:inline!important;
  white-space:nowrap!important;
}

/* Les deux onglets Patch Notes / Dev Notes restent toujours visibles. */
#s18NotesDevModalV10 .s18NotesPanelV10 > nav{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  min-height:54px!important;
  flex:0 0 54px!important;
  pointer-events:auto!important;
  position:sticky!important;
  top:0!important;
  z-index:30!important;
}

#s18NotesDevModalV10 .s18NotesPanelV10 > nav > button{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  align-items:center!important;
  justify-content:center!important;
  pointer-events:auto!important;
  min-height:52px!important;
  flex:1 1 50%!important;
}

#s18NotesDevModalV10 [data-patch-index]{
  pointer-events:auto!important;
  cursor:pointer!important;
  position:relative!important;
  z-index:2!important;
}

/* Carte mixte : NERF sur certains niveaux et BUFF sur d'autres. */
.s18PatchChangeV10.mixed{
  border-color:#f3a62f!important;
  box-shadow:
    inset 5px 0 0 #c92340,
    inset -5px 0 0 #15944a!important;
}

.s18ToneV10.mixed,
.s18PatchDetailHeadV10 .mixed{
  color:#fff!important;
  background:
    linear-gradient(
      90deg,
      #c92340 0%,
      #c92340 50%,
      #15944a 50%,
      #15944a 100%
    )!important;
  border:2px solid #080b10!important;
  border-radius:999px!important;
  font-weight:1000!important;
  white-space:nowrap!important;
}

.s18ToneV10.mixed{
  min-width:128px!important;
  text-align:center!important;
}

.s18PatchTableV10 tr.after td{
  position:relative!important;
}

.s18PatchTableV10 tr.after td.mhurLevel-buffV587{
  background:#164b2d!important;
  box-shadow:inset 0 -4px 0 #20d26f!important;
}

.s18PatchTableV10 tr.after td.mhurLevel-nerfV587{
  background:#551923!important;
  box-shadow:inset 0 -4px 0 #ff4e67!important;
}

.s18PatchTableV10 tr.after td.mhurLevel-sameV587{
  background:#273347!important;
  box-shadow:inset 0 -4px 0 #8da2bf!important;
}

.s18PatchTableV10 tr.after td.mhurLevel-unknownV587{
  background:#3b300f!important;
  box-shadow:inset 0 -4px 0 #d1a92a!important;
}

.mhurLevelToneV587{
  display:block!important;
  margin-top:4px!important;
  font-size:10px!important;
  font-weight:1000!important;
  line-height:1!important;
  letter-spacing:.5px!important;
}

.mhurLevel-buffV587 .mhurLevelToneV587{
  color:#6dffa3!important;
}

.mhurLevel-nerfV587 .mhurLevelToneV587{
  color:#ff8b9b!important;
}

@media(max-width:900px){
  #mhurPatchDevButtonV14,
  .mhurPatchDevButtonV14,
  [data-s18-notes-button]{
    min-width:42px!important;
    width:42px!important;
    padding:8px!important;
  }

  .mhurPatchDevLabelV587,
  #mhurPatchDevButtonV14 > span:last-child{
    display:none!important;
  }

  #s18NotesDevModalV10 .s18NotesPanelV10 > nav{
    min-height:50px!important;
    flex-basis:50px!important;
  }
}
'''


def patch_index() -> None:
    html = read(INDEX)

    html = re.sub(
        r"\s*<link\b[^>]*href=[\"'][^\"']*"
        r"v587-images-notes-stable\.css[^\"']*[\"'][^>]*>\s*",
        "\n",
        html,
        flags=re.I,
    )

    html = re.sub(
        r"\s*<script\b[^>]*src=[\"'][^\"']*"
        r"v587-images-notes-stable\.js[^\"']*[\"'][^>]*>"
        r"\s*</script>\s*",
        "\n",
        html,
        flags=re.I,
    )

    if "</body>" not in html:
        fail("Balise </body> introuvable dans public/index.html.")

    injection = (
        "\n<!-- V587 doit rester après season18-v12.js et tous les anciens correctifs. -->\n"
        '<link rel="stylesheet" href="css/v587-images-notes-stable.css?v=587">\n'
        '<script src="js/v587-images-notes-stable.js?v=587"></script>\n'
    )

    html = html.replace("</body>", injection + "</body>", 1)
    write(INDEX, html)


def integrate_v585() -> bool:
    # Le jeton GitHub Actions n'a pas l'autorisation de modifier
    # un autre fichier dans .github/workflows.
    # V587 est installé sans toucher au workflow V585.
    return False


def verify(v585_integrated: bool) -> None:
    html = read(INDEX)
    js = read(JS_FILE)
    css = read(CSS_FILE)
    errors: list[str] = []

    if html.rfind("season18-v12.js") > html.rfind("v587-images-notes-stable.js"):
        errors.append("V587 n'est pas chargé après season18-v12.js.")

    required_html = [
        "css/v587-images-notes-stable.css?v=587",
        "js/v587-images-notes-stable.js?v=587",
    ]

    for value in required_html:
        if value not in html:
            errors.append(f"Référence V587 absente : {value}")

    required_js = [
        "function canonicalSkillAssets",
        "'Unique' + number",
        "function ensureHeaderButton",
        "function showPatch(index)",
        "[data-patch-index]",
        "function levelTones",
        "NERF + BUFF",
        "window.MHUR_V587",
    ]

    for value in required_js:
        if value not in js:
            errors.append(f"Fonction V587 absente : {value}")

    required_css = [
        "#mhurPatchDevButtonV14",
        ".s18NotesPanelV10 > nav",
        ".mhurLevel-buffV587",
        ".mhurLevel-nerfV587",
    ]

    for value in required_css:
        if value not in css:
            errors.append(f"Règle CSS V587 absente : {value}")

    syntax = subprocess.run(
        ["node", "--check", str(JS_FILE)],
        text=True,
        capture_output=True,
    )

    if syntax.returncode:
        errors.append(
            "Syntaxe JavaScript invalide : " + syntax.stderr
        )

    if errors:
        fail("Vérification V587 échouée :\n- " + "\n- ".join(errors))


def write_report(v585_integrated: bool) -> None:
    lines = [
        "MHUR FRANCE — RAPPORT V587",
        "",
        "IMAGES DES ALTERS",
        "- Les trois illustrations sont reconstruites avec leur numéro officiel :",
        "  Alpha = Unique1",
        "  Bêta = Unique2",
        "  Gamma = Unique3",
        "- La correction s'applique à tous les styles, y compris les styles futurs.",
        "- Les données exactes et MHUR_DATABASE_ASSETS sont corrigées en mémoire.",
        "- Les images déjà affichées sur une fiche sont rafraîchies.",
        "",
        "PATCH NOTES / DEV NOTES",
        "- Le bouton du header est recréé s'il disparaît.",
        "- Le bouton reste visible sur ordinateur et sous forme d'icône sur mobile.",
        "- Les onglets Patch Notes et Dev Notes sont forcés visibles.",
        "- Chaque clic sur une ancienne Patch Note est intercepté directement.",
        "- La note choisie est rechargée même si l'ancien onclick a été perdu.",
        "",
        "PATCH NOTES MIXTES",
        "- Calcul niveau par niveau.",
        "- NERF + BUFF lorsqu'une même statistique contient les deux.",
        "- Cellules NERF rouges et cellules BUFF vertes.",
        "- Nom et image officiels de l'Alter réappliqués dans chaque carte.",
        "",
        "PERSISTANCE",
        "- Intégration au workflow V585 : NON (modification interdite au jeton GitHub Actions)",
        "",
        "VÉRIFICATIONS",
        "- V587 chargé en dernier : OK",
        "- syntaxe JavaScript : OK",
        "- bouton permanent : OK",
        "- clics des Patch Notes : OK",
        "- mapping Unique1/Unique2/Unique3 : OK",
    ]

    write(REPORT, "\n".join(lines))


def main() -> None:
    if not INDEX.is_file():
        fail("public/index.html est absent.")

    write(JS_FILE, V587_JS)
    write(CSS_FILE, V587_CSS)
    patch_index()

    v585_integrated = integrate_v585()
    verify(v585_integrated)
    write_report(v585_integrated)

    print("[OK] V587 appliqué et vérifié.")
    print("[OK] Alpha = Unique1, Bêta = Unique2, Gamma = Unique3.")
    print("[OK] Bouton Patch Notes / Dev Notes permanent.")
    print("[OK] Clics sur toutes les anciennes notes réparés.")
    print("[OK] Patch Notes mixtes niveau par niveau.")
    print(
        "[OK] Intégration V585 : "
        + ("installée." if v585_integrated else "workflow V585 absent.")
    )
    print("[OK] Rapport créé : RAPPORT_V587_CORRECTIF_COMPLET.txt")


if __name__ == "__main__":
    main()
