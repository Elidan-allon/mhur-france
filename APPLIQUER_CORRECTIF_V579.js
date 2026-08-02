#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const VERSION = '579';
const SUFFIX = '.avant-v579.bak';

const INDEX = path.join(ROOT, 'public', 'index.html');
const FIXES_JS = path.join(ROOT, 'public', 'js', 'season18-fixes.js');
const FIXES_CSS = path.join(ROOT, 'public', 'css', 'season18-fixes.css');
const SYNC_JS = path.join(ROOT, 'public', 'data', 'season18_sync.js');
const REPORT = path.join(ROOT, 'RAPPORT_V579.txt');

const JS_MARKER = 'MHUR Nexus — V579 : animation immédiate et vague complète';
const CSS_MARKER = 'MHUR Nexus — V579 : NEW animés et INCOMING agrandis';

function fail(message) {
  throw new Error(message);
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function ensureFile(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`Fichier requis introuvable : ${rel(file)}`);
  }
}

function backup(file) {
  const copy = file + SUFFIX;
  if (!fs.existsSync(copy)) {
    fs.copyFileSync(file, copy);
    console.log(`[SAUVEGARDE] ${rel(copy)}`);
  }
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(String)));
}

function parseSync() {
  const raw = fs.readFileSync(SYNC_JS, 'utf8').replace(/^\uFEFF/, '');
  const match = raw.match(/^\s*window\.MHUR_SEASON18_DATA\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);

  if (!match) {
    fail('Impossible de lire window.MHUR_SEASON18_DATA dans season18_sync.js.');
  }

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`JSON invalide dans season18_sync.js : ${error.message}`);
  }
}

function dateDay(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function todayJst() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const get = type => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function latestReleasedDay(data) {
  const today = todayJst();
  const days = Object.values(data.costumes || {})
    .filter(row => row && !row.upcoming)
    .map(row => dateDay(row.releaseDate || row.release_date))
    .filter(day => day && day <= today)
    .sort();

  if (!days.length) {
    fail('Aucune date de costume déjà sorti trouvée.');
  }

  return days[days.length - 1];
}

function costumesFromDay(data, day) {
  return Object.entries(data.costumes || {})
    .map(([id, row]) => ({
      id: String(id),
      row: row || {},
      day: dateDay(row?.releaseDate || row?.release_date)
    }))
    .filter(item => !item.row.upcoming && item.day === day);
}

function patchSyncData() {
  backup(SYNC_JS);
  const data = parseSync();
  const day = latestReleasedDay(data);
  const latestRows = costumesFromDay(data, day);
  const latestIds = latestRows.map(item => item.id);

  if (!latestIds.length) {
    fail(`Aucun costume trouvé pour la dernière journée ${day}.`);
  }

  for (const key of ['active_new_content', 'new_content']) {
    if (!data[key] || typeof data[key] !== 'object') {
      data[key] = {};
    }

    data[key].characters = unique([
      ...(data[key].characters || []),
      'gentle_criminal'
    ]);

    data[key].styles = unique([
      ...(data[key].styles || []),
      'gentle_criminal_technical'
    ]);

    /*
      V579 remplace la liste des costumes par toute la journée de mise à jour.
      On ne compare plus l'heure exacte : 12:30 et 13:00 sont inclus ensemble.
    */
    data[key].costumes = unique([
      ...latestIds,
      '108000000'
    ]);
  }

  fs.writeFileSync(
    SYNC_JS,
    `window.MHUR_SEASON18_DATA = ${JSON.stringify(data)};\n`,
    'utf8'
  );

  console.log(`[CORRIGÉ] Journée complète retenue : ${day}.`);
  console.log(`[CORRIGÉ] ${latestIds.length} costumes de cette journée sont NEW.`);
  console.log('[CORRIGÉ] Costume Original de Gentle ajouté séparément.');

  return { day, latestIds, latestRows };
}

function removeBlockFromMarker(source, marker) {
  const index = source.indexOf(marker);
  return index >= 0 ? source.slice(0, index).trimEnd() + '\n' : source;
}

function patchFixesJs() {
  backup(FIXES_JS);
  let source = fs.readFileSync(FIXES_JS, 'utf8').replace(/^\uFEFF/, '');

  /*
    Les blocs V577/V578 étaient ajoutés à la fin du fichier.
    On les retire avant de poser la version unique V579.
  */
  for (const marker of [
    '/* MHUR Nexus — V577 : NEW source propre */',
    '/* MHUR Nexus — V578 : NEW source propre */',
    `/* ${JS_MARKER} */`
  ]) {
    source = removeBlockFromMarker(source, marker);
  }

  const block = String.raw`

/* MHUR Nexus — V579 : animation immédiate et vague complète */
(function(){
  'use strict';

  const BADGE='<span class="s18NewBadge s18NewBadgeV9 s18NewBadgeV24 s18NewBadgeV579" aria-label="NEW"><span class="s18NewPulseInnerV579">NEW!</span></span>';
  const GENTLE_CHARACTER='gentle_criminal';
  const GENTLE_STYLE='gentle_criminal_technical';
  const GENTLE_ORIGINAL='108000000';

  function dayV579(value){
    const match=String(value||'').match(/^(\d{4}-\d{2}-\d{2})/);
    return match?match[1]:'';
  }

  function todayJstV579(){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'Asia/Tokyo',
      year:'numeric',
      month:'2-digit',
      day:'2-digit'
    }).formatToParts(new Date());
    const get=type=>parts.find(part=>part.type===type)?.value||'';
    return get('year')+'-'+get('month')+'-'+get('day');
  }

  function latestDayV579(){
    const sync=window.MHUR_SEASON18_DATA||{};
    const today=todayJstV579();
    const days=Object.values(sync.costumes||{})
      .filter(row=>row&&!row.upcoming)
      .map(row=>dayV579(row?.releaseDate||row?.release_date))
      .filter(day=>day&&day<=today)
      .sort();
    return days.length?days[days.length-1]:'';
  }

  function latestRowsV579(){
    const sync=window.MHUR_SEASON18_DATA||{};
    const latest=latestDayV579();

    return Object.entries(sync.costumes||{})
      .map(([id,row])=>({
        id:String(id),
        row:row||{},
        day:dayV579(row?.releaseDate||row?.release_date)
      }))
      .filter(item=>!item.row.upcoming&&item.day===latest);
  }

  function setsV579(){
    const sync=window.MHUR_SEASON18_DATA||{};
    const active=sync.active_new_content||sync.new_content||{};
    const latest=latestRowsV579();

    return {
      characters:new Set([
        ...(active.characters||[]).map(String),
        GENTLE_CHARACTER
      ]),
      styles:new Set([
        ...(active.styles||[]).map(String),
        GENTLE_STYLE
      ]),
      costumes:new Set([
        ...latest.map(item=>item.id),
        ...(active.costumes||[]).map(String),
        GENTLE_ORIGINAL
      ]),
      latest
    };
  }

  function normalizeV579(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,' ')
      .trim();
  }

  function allCardTextV579(card){
    const values=[
      card?.textContent,
      card?.getAttribute?.('aria-label'),
      card?.getAttribute?.('title'),
      card?.getAttribute?.('alt')
    ];

    card?.querySelectorAll?.('[alt],[title],[aria-label],img[src],a[href]')?.forEach(node=>{
      values.push(
        node.getAttribute('alt'),
        node.getAttribute('title'),
        node.getAttribute('aria-label'),
        node.getAttribute('src'),
        node.getAttribute('href')
      );
    });

    return normalizeV579(values.filter(Boolean).join(' '));
  }

  function digitsFromV579(value){
    const text=String(value||'');
    const matches=[...text.matchAll(/(?:ur[_-]?)?(\d{5,})/gi)];
    return matches.map(match=>match[1]);
  }

  function costumeIdFromAttributesV579(card, validIds){
    const values=[];

    if(card){
      values.push(
        card.dataset?.costume,
        card.dataset?.costumeId,
        card.dataset?.id,
        card.id,
        card.getAttribute?.('data-costume'),
        card.getAttribute?.('data-costume-id'),
        card.getAttribute?.('data-id'),
        card.getAttribute?.('onclick'),
        card.getAttribute?.('href'),
        card.getAttribute?.('style')
      );

      card.querySelectorAll?.('*')?.forEach(node=>{
        for(const attr of ['src','href','data-costume','data-costume-id','data-id','id','onclick','style']){
          values.push(node.getAttribute?.(attr));
        }
      });
    }

    for(const value of values){
      for(const id of digitsFromV579(value)){
        if(validIds.has(id))return id;
      }
    }

    return '';
  }

  function labelsForRowV579(row){
    const groupFr=normalizeV579(row?.group_fr||row?.name_fr);
    const groupEn=normalizeV579(row?.group_en||row?.name_en);
    const variantFr=normalizeV579(row?.variant_fr);
    const variantEn=normalizeV579(row?.variant_en);

    const labels=new Set();
    for(const group of [groupFr,groupEn]){
      if(!group)continue;
      labels.add(group);
      for(const variant of [variantFr,variantEn]){
        if(variant)labels.add((group+' '+variant).trim());
      }
    }
    return [...labels].sort((a,b)=>b.length-a.length);
  }

  function costumeIdFromTextV579(card, latestRows){
    const text=allCardTextV579(card);
    if(!text)return '';

    const matches=[];

    for(const item of latestRows){
      const labels=labelsForRowV579(item.row);
      const best=labels.find(label=>label.length>=4&&text.includes(label));
      if(best)matches.push({id:item.id,length:best.length});
    }

    matches.sort((a,b)=>b.length-a.length);
    if(!matches.length)return '';
    if(matches.length>1&&matches[0].length===matches[1].length)return '';
    return matches[0].id;
  }

  function directBadgesV579(node){
    try{
      return [...node.querySelectorAll(':scope > .s18NewBadge')];
    }catch(_error){
      return [...(node.children||[])].filter(child=>child.classList?.contains('s18NewBadge'));
    }
  }

  function startPulseV579(badge){
    if(!badge||badge.__mhurPulseV579)return;
    badge.__mhurPulseV579=true;

    const inner=badge.querySelector('.s18NewPulseInnerV579')||badge;

    /*
      Web Animations démarre immédiatement et ne dépend pas des anciennes
      règles transform/animation qui bloquaient les badges hors accueil.
    */
    if(typeof inner.animate==='function'){
      inner.animate(
        [
          {scale:'0.92'},
          {scale:'1.12'},
          {scale:'0.92'}
        ],
        {
          duration:950,
          iterations:Infinity,
          easing:'ease-in-out'
        }
      );
    }
  }

  function setBadgeV579(node,active){
    if(!node)return;

    directBadgesV579(node).forEach(badge=>badge.remove());

    if(active){
      node.insertAdjacentHTML('afterbegin',BADGE);
      startPulseV579(directBadgesV579(node)[0]);
    }
  }

  function syncV579(){
    const sets=setsV579();

    document.querySelectorAll('.card[data-char]').forEach(card=>{
      setBadgeV579(
        card,
        sets.characters.has(String(card.dataset.char||''))
      );
    });

    document.querySelectorAll('.styleCard[data-style]').forEach(card=>{
      setBadgeV579(
        card,
        sets.styles.has(String(card.dataset.style||''))
      );
    });

    const validIds=new Set([
      ...sets.costumes,
      ...Object.keys((window.MHUR_SEASON18_DATA||{}).costumes||{}).map(String)
    ]);

    document.querySelectorAll(
      '.costumeTile,.costumeCard,.costumeResult,[data-costume],[data-costume-id]'
    ).forEach(card=>{
      let id=costumeIdFromAttributesV579(card,validIds);

      if(!id){
        id=costumeIdFromTextV579(card,sets.latest);
      }

      if(id)card.dataset.costume=id;

      const upcoming=Boolean(
        card.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23')
      );

      setBadgeV579(
        card,
        Boolean(id&&sets.costumes.has(id)&&!upcoming)
      );
    });
  }

  let queued=false;

  function scheduleV579(){
    if(queued)return;
    queued=true;

    queueMicrotask(()=>{
      requestAnimationFrame(()=>{
        queued=false;
        syncV579();
      });
    });
  }

  function wrapRenderV579(){
    if(typeof window.render!=='function'||window.render.__mhurV579)return;

    const original=window.render;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      scheduleV579();
      return result;
    };

    wrapped.__mhurV579=true;
    window.render=wrapped;

    try{
      render=wrapped;
    }catch(_error){}
  }

  wrapRenderV579();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',scheduleV579,{once:true});
  }else{
    scheduleV579();
  }

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      scheduleV579();
    }
  }).observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('load',scheduleV579,{once:true});
  window.addEventListener('hashchange',scheduleV579);
  window.addEventListener('mhur:languagechange',scheduleV579);

  window.MHUR_V579_NEW={
    refresh:syncV579,
    latestDay:latestDayV579,
    latestRows:latestRowsV579
  };
})();
`;

  source = source.trimEnd() + block + '\n';
  fs.writeFileSync(FIXES_JS, source, 'utf8');
  console.log('[CORRIGÉ] Détection des costumes et animation immédiate renforcées.');
}

function patchCss() {
  backup(FIXES_CSS);
  let source = fs.readFileSync(FIXES_CSS, 'utf8').replace(/^\uFEFF/, '');

  for (const marker of [
    '/* MHUR Nexus — V577 : position et animation finales */',
    '/* MHUR Nexus — V578 : position et animation finales */',
    `/* ${CSS_MARKER} */`
  ]) {
    source = removeBlockFromMarker(source, marker);
  }

  const block = String.raw`

/* MHUR Nexus — V579 : NEW animés et INCOMING agrandis */
.s18NewBadgeV579{
  animation:none!important;
  overflow:visible!important;
}

.s18NewPulseInnerV579{
  width:100%!important;
  height:100%!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  transform-origin:center!important;
  will-change:scale!important;
}

/* Personnages et T.U.N.I.N.G : en haut à droite. */
.card[data-char] > .s18NewBadgeV579,
.styleCard[data-style] > .s18NewBadgeV579{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  top:7px!important;
  right:7px!important;
  left:auto!important;
  width:88px!important;
  height:44px!important;
  transform:none!important;
  z-index:90!important;
}

/* Costumes : plus petit, à droite sous les étoiles. */
.costumeTile > .s18NewBadgeV579,
.costumeCard > .s18NewBadgeV579,
.costumeResult > .s18NewBadgeV579,
[data-costume] > .s18NewBadgeV579,
[data-costume-id] > .s18NewBadgeV579{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  top:36px!important;
  right:8px!important;
  left:auto!important;
  width:58px!important;
  height:30px!important;
  transform:none!important;
  z-index:90!important;
}

/* INCOMING nettement plus grand. */
.s18PlannedIncomingV578,
.s18PlannedIncomingV579{
  min-width:168px!important;
  width:auto!important;
  height:56px!important;
  padding:0 18px!important;
  font-size:23px!important;
  line-height:1!important;
  top:10px!important;
  right:10px!important;
  transform-origin:top right!important;
}

/* L'accueil conserve son animation actuelle. */
.s18PlannedCardV12[data-planned="gentle"] .s18PlannedNewV12{
  animation:mhurNewPulseV577 1.05s ease-in-out infinite!important;
}

@media(max-width:700px){
  .card[data-char] > .s18NewBadgeV579,
  .styleCard[data-style] > .s18NewBadgeV579{
    width:76px!important;
    height:38px!important;
  }

  .costumeTile > .s18NewBadgeV579,
  .costumeCard > .s18NewBadgeV579,
  .costumeResult > .s18NewBadgeV579,
  [data-costume] > .s18NewBadgeV579,
  [data-costume-id] > .s18NewBadgeV579{
    top:32px!important;
    right:7px!important;
    width:52px!important;
    height:27px!important;
  }

  .s18PlannedIncomingV578,
  .s18PlannedIncomingV579{
    min-width:145px!important;
    height:49px!important;
    padding:0 14px!important;
    font-size:20px!important;
  }
}
`;

  source = source.trimEnd() + block + '\n';
  fs.writeFileSync(FIXES_CSS, source, 'utf8');
  console.log('[CORRIGÉ] INCOMING agrandis et règles visuelles V579 ajoutées.');
}

function updateQuery(html, file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(["'])${escaped}(?:\\?[^"']*)?\\1`, 'gi');

  if (!re.test(html)) {
    fail(`Référence ${file} introuvable dans public/index.html.`);
  }

  return html.replace(re, `"${file}?v=${VERSION}"`);
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  html = updateQuery(html, 'css/season18-fixes.css');
  html = updateQuery(html, 'data/season18_sync.js');
  html = updateQuery(html, 'js/season18-fixes.js');

  html = html.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
  if (!html.endsWith('\n')) html += '\n';

  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('[CORRIGÉ] Cache forcé en V579.');
}

function syntaxCheck(file) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    fail(`Erreur de syntaxe dans ${rel(file)} :\n${result.stderr || result.stdout}`);
  }
}

function verify(info) {
  const html = fs.readFileSync(INDEX, 'utf8');
  const js = fs.readFileSync(FIXES_JS, 'utf8');
  const css = fs.readFileSync(FIXES_CSS, 'utf8');
  const data = parseSync();
  const errors = [];

  for (const ref of [
    'css/season18-fixes.css?v=579',
    'data/season18_sync.js?v=579',
    'js/season18-fixes.js?v=579'
  ]) {
    if (!html.includes(ref)) errors.push(`cache V579 absent : ${ref}`);
  }

  if (!js.includes(JS_MARKER)) {
    errors.push('bloc JavaScript V579 absent');
  }

  if (!js.includes("inner.animate(")) {
    errors.push('animation immédiate Web Animations absente');
  }

  if (!css.includes(CSS_MARKER)) {
    errors.push('bloc CSS V579 absent');
  }

  if (!css.includes('min-width:168px')) {
    errors.push('taille INCOMING agrandie absente');
  }

  for (const key of ['active_new_content', 'new_content']) {
    const ids = new Set((data[key]?.costumes || []).map(String));

    for (const id of info.latestIds) {
      if (!ids.has(String(id))) {
        errors.push(`${key}: costume ${id} du ${info.day} absent`);
        break;
      }
    }

    if (!ids.has('108000000')) {
      errors.push(`${key}: costume Original Gentle absent`);
    }
  }

  syntaxCheck(FIXES_JS);

  if (errors.length) {
    fail('Vérification V579 échouée :\n- ' + errors.join('\n- '));
  }

  console.log('[VÉRIFIÉ] Tous les costumes de la dernière journée : OK');
  console.log('[VÉRIFIÉ] Heures différentes de la même journée incluses : OK');
  console.log('[VÉRIFIÉ] Animation immédiate hors accueil : OK');
  console.log('[VÉRIFIÉ] INCOMING agrandis : OK');
  console.log('[VÉRIFIÉ] Cache V579 et syntaxe JavaScript : OK');
}

function label(item) {
  const row = item.row || {};
  const group = row.group_fr || row.group_en || row.name_fr || row.name_en || 'Costume';
  const variant = row.variant_fr || row.variant_en || '';
  return `${item.id} — ${group}${variant ? ` (${variant})` : ''}`;
}

function writeReport(info) {
  const report = [
    'MHUR FRANCE — RAPPORT V579',
    '',
    `Dernière journée de sortie détectée : ${info.day}`,
    `Costumes trouvés sur toute la journée : ${info.latestIds.length}`,
    '',
    ...info.latestRows.map(item => '- ' + label(item)),
    '',
    'Corrections visuelles :',
    '- tous les NEW hors accueil démarrent leur animation immédiatement',
    '- NEW Personnages et T.U.N.I.N.G en haut à droite',
    '- NEW costumes plus petits sous les étoiles',
    '- INCOMING agrandis',
    '- NEW de l’accueil conservé',
    '',
    'Gentle :',
    '- costume Original 108000000 conservé en NEW'
  ].join('\n');

  fs.writeFileSync(REPORT, report + '\n', 'utf8');
}

function rollback() {
  for (const file of [INDEX, FIXES_JS, FIXES_CSS, SYNC_JS]) {
    const copy = file + SUFFIX;
    if (fs.existsSync(copy)) {
      fs.copyFileSync(copy, file);
    }
  }
}

function main() {
  for (const file of [INDEX, FIXES_JS, FIXES_CSS, SYNC_JS]) {
    ensureFile(file);
  }

  console.log('\n=== MHUR FRANCE — CORRECTIF V579 ===\n');

  try {
    const info = patchSyncData();
    patchFixesJs();
    patchCss();
    patchIndex();
    verify(info);
    writeReport(info);

    console.log('\n[OK] Correctif V579 appliqué et vérifié.');
    console.log('[OK] Rapport créé : RAPPORT_V579.txt');
    console.log('[SUITE] Remplace les quatre fichiers indiqués dans LISEZ-MOI_V579.txt.\n');
  } catch (error) {
    rollback();
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error('\n[ERREUR V579] ' + (error && error.message ? error.message : String(error)));
  console.error('[SÉCURITÉ] Les quatre fichiers ont été restaurés automatiquement.\n');
  process.exitCode = 1;
}
