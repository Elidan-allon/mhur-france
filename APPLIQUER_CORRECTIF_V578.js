#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const VERSION = '578';
const SUFFIX = '.avant-v578.bak';

const INDEX = path.join(ROOT, 'public', 'index.html');
const FIXES_JS = path.join(ROOT, 'public', 'js', 'season18-fixes.js');
const FIXES_CSS = path.join(ROOT, 'public', 'css', 'season18-fixes.css');
const EARLY_JS = path.join(ROOT, 'public', 'js', 'season18-early.js');
const SYNC_JS = path.join(ROOT, 'public', 'data', 'season18_sync.js');
const REPORT = path.join(ROOT, 'RAPPORT_V578.txt');

const MARKER_JS = 'MHUR Nexus — V578 : NEW source propre';
const MARKER_CSS = 'MHUR Nexus — V578 : position et animation finales';

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
  if (!match) fail('Impossible de lire window.MHUR_SEASON18_DATA dans season18_sync.js.');

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`JSON invalide dans season18_sync.js : ${error.message}`);
  }
}

function patchSyncData() {
  backup(SYNC_JS);
  const data = parseSync();
  const now = Date.now();

  const released = Object.entries(data.costumes || {})
    .map(([id, row]) => ({
      id: String(id),
      row: row || {},
      time: Date.parse(String(row?.releaseDate || row?.release_date || '')),
      upcoming: Boolean(row?.upcoming)
    }))
    .filter(item => Number.isFinite(item.time) && !item.upcoming && item.time <= now);

  if (!released.length) {
    fail('Aucun costume déjà sorti avec une date valide dans season18_sync.js.');
  }

  const latestTime = Math.max(...released.map(item => item.time));
  const latestRows = released.filter(item => item.time === latestTime);
  const latestIds = latestRows.map(item => item.id);

  for (const key of ['active_new_content', 'new_content']) {
    if (!data[key] || typeof data[key] !== 'object') data[key] = {};

    data[key].characters = unique([
      ...(data[key].characters || []),
      'gentle_criminal'
    ]);

    data[key].styles = unique([
      ...(data[key].styles || []),
      'gentle_criminal_technical'
    ]);

    data[key].costumes = unique([
      ...(data[key].costumes || []),
      ...latestIds,
      '108000000'
    ]);
  }

  fs.writeFileSync(
    SYNC_JS,
    `window.MHUR_SEASON18_DATA = ${JSON.stringify(data)};\n`,
    'utf8'
  );

  const date = new Date(latestTime).toISOString();
  console.log(`[CORRIGÉ] Dernière vague de tenues : ${latestIds.length} costumes (${date}).`);
  console.log('[CORRIGÉ] Gentle Criminal, son style Technique et son costume Original sont NEW.');

  return {
    latestTime,
    latestIds,
    latestRows
  };
}

function findFunctionRange(source, name) {
  const start = source.indexOf(`function ${name}(){`);
  if (start < 0) return null;

  const brace = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let i = brace; i < source.length; i += 1) {
    const ch = source[i];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === quote) {
        quote = '';
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }

    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return { start, end: i + 1 };
    }
  }

  return null;
}

function replaceConstLine(body, variable, replacement) {
  const re = new RegExp(`^\\s*const ${variable}=.*;$`, 'm');
  if (!re.test(body)) {
    fail(`Ligne const ${variable}=... introuvable.`);
  }
  return body.replace(re, `  const ${variable}=${replacement};`);
}

function patchSetFunction(source, name, prefix, latestVar) {
  const range = findFunctionRange(source, name);
  if (!range) fail(`Fonction ${name} introuvable dans season18-fixes.js.`);

  let body = source.slice(range.start, range.end);
  body = replaceConstLine(
    body,
    'characters',
    `Array.from(new Set([...((${prefix}.characters)||[]),'gentle_criminal']))`
  );
  body = replaceConstLine(
    body,
    'stylesList',
    `Array.from(new Set([...((${prefix}.styles)||[]),'gentle_criminal_technical']))`
  );
  body = replaceConstLine(
    body,
    'costumes',
    `Array.from(new Set([...((${prefix}.costumes)||[]),...${latestVar},'108000000']))`
  );

  return source.slice(0, range.start) + body + source.slice(range.end);
}

function removeOldDynamicLoader(source) {
  const marker = '/* MHUR V574 — charge V573 sans index.html */';
  const index = source.indexOf(marker);
  if (index >= 0) {
    source = source.slice(0, index).trimEnd() + '\n';
    console.log('[RETIRÉ] Ancien chargeur dynamique V574.');
  }
  return source;
}

function patchFixesJs() {
  backup(FIXES_JS);
  let source = fs.readFileSync(FIXES_JS, 'utf8').replace(/^\uFEFF/, '');
  source = removeOldDynamicLoader(source);

  /* V578 accepte aussi une ancienne installation V577 partielle. */
  for (const oldMarker of [
    '/* MHUR Nexus — V577 : NEW source propre */',
    '/* MHUR Nexus — V578 : NEW source propre */'
  ]) {
    const markerIndex = source.indexOf(oldMarker);
    if (markerIndex >= 0) source = source.slice(0, markerIndex).trimEnd() + '\n';
  }
  source = source.replace(
    /\/\* V577 preserve data-costume \*\//g,
    '/* V578 preserve data-costume */'
  );

  source = patchSetFunction(source, 'newSets', 'data', 'latestCostumes');
  source = patchSetFunction(source, 'activeSets', 'source', 'latestCostumeIds');

  if (!source.includes('V578 preserve data-costume')) {
    const target = "let html=String(baseCostumeCard(officialCostume)||'');";
    if (!source.includes(target)) {
      fail('Rendu des cartes costumes introuvable dans season18-fixes.js.');
    }

    source = source.replace(
      target,
      target + "\n      /* V578 preserve data-costume */\n" +
      "      if(id&&!/\\bdata-costume\\s*=/.test(html)) html=html.replace(/^(<(?:button|div)\\b)/i,`$1 data-costume=\"${esc(id)}\"`);"
    );
  }

  // Retire une éventuelle ancienne version du bloc V578.
  const oldMarker = `/* ${MARKER_JS} */`;
  const oldIndex = source.indexOf(oldMarker);
  if (oldIndex >= 0) source = source.slice(0, oldIndex).trimEnd() + '\n';

  const block = String.raw`

/* MHUR Nexus — V578 : NEW source propre */
(function(){
  'use strict';

  const BADGE='<span class="s18NewBadge s18NewBadgeV9 s18NewBadgeV24 s18NewBadgeV578" aria-label="NEW">NEW!</span>';
  const GENTLE_CHARACTER='gentle_criminal';
  const GENTLE_STYLE='gentle_criminal_technical';
  const GENTLE_ORIGINAL='108000000';

  function time(value){
    const parsed=Date.parse(String(value||''));
    return Number.isFinite(parsed)?parsed:null;
  }

  function latestCostumesV578(){
    const sync=window.MHUR_SEASON18_DATA||{};
    const now=Date.now();
    const rows=Object.entries(sync.costumes||{})
      .map(([id,row])=>({
        id:String(id),
        time:time(row?.releaseDate||row?.release_date),
        upcoming:Boolean(row?.upcoming)
      }))
      .filter(row=>row.time!=null&&!row.upcoming&&row.time<=now);

    if(!rows.length)return [];
    const latest=Math.max(...rows.map(row=>row.time));
    return rows.filter(row=>row.time===latest).map(row=>row.id);
  }

  function setsV578(){
    const sync=window.MHUR_SEASON18_DATA||{};
    const active=sync.active_new_content||sync.new_content||{};

    return {
      characters:new Set([...(active.characters||[]).map(String),GENTLE_CHARACTER]),
      styles:new Set([...(active.styles||[]).map(String),GENTLE_STYLE]),
      costumes:new Set([
        ...(active.costumes||[]).map(String),
        ...latestCostumesV578(),
        GENTLE_ORIGINAL
      ])
    };
  }

  function costumeIdV578(tile){
    if(!tile)return '';
    const values=[
      tile.dataset?.costume,
      tile.dataset?.id,
      tile.getAttribute('data-costume'),
      tile.getAttribute('data-id'),
      tile.id,
      tile.getAttribute('onclick'),
      tile.getAttribute('href'),
      tile.outerHTML
    ];

    for(const value of values){
      const match=String(value||'').match(/(?:ur[_-]?)?(\d{4,})/i);
      if(match)return match[1];
    }
    return '';
  }

  function directBadges(node){
    try{return [...node.querySelectorAll(':scope > .s18NewBadge')]}
    catch(_error){return [...node.children].filter(child=>child.classList?.contains('s18NewBadge'))}
  }

  function setBadgeV578(node,active){
    if(!node)return;
    directBadges(node).forEach(badge=>badge.remove());
    if(active)node.insertAdjacentHTML('afterbegin',BADGE);
  }

  function syncV578(){
    const sets=setsV578();

    document.querySelectorAll('.card[data-char]').forEach(card=>{
      setBadgeV578(card,sets.characters.has(String(card.dataset.char||'')));
    });

    document.querySelectorAll('.styleCard[data-style]').forEach(card=>{
      setBadgeV578(card,sets.styles.has(String(card.dataset.style||'')));
    });

    document.querySelectorAll('.costumeTile,.costumeCard,.costumeResult').forEach(card=>{
      const id=costumeIdV578(card);
      if(id)card.dataset.costume=id;
      const upcoming=Boolean(card.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23'));
      setBadgeV578(card,Boolean(id&&sets.costumes.has(id)&&!upcoming));
    });
  }

  let queued=false;
  function scheduleV578(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      syncV578();
    });
  }

  function wrapRenderV578(){
    if(typeof window.render!=='function'||window.render.__mhurV578)return;
    const original=window.render;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      scheduleV578();
      return result;
    };
    wrapped.__mhurV578=true;
    window.render=wrapped;
    try{render=wrapped}catch(_error){}
  }

  wrapRenderV578();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',scheduleV578,{once:true});
  }else{
    scheduleV578();
  }

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes&&mutation.addedNodes.length)){
      scheduleV578();
    }
  }).observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('load',scheduleV578,{once:true});
  window.addEventListener('hashchange',scheduleV578);
  window.addEventListener('mhur:languagechange',scheduleV578);
  window.MHUR_V578_NEW={refresh:syncV578,latestCostumes:latestCostumesV578};
})();
`;

  source = source.trimEnd() + block + '\n';
  fs.writeFileSync(FIXES_JS, source, 'utf8');
  console.log('[CORRIGÉ] Logique NEW centralisée dans season18-fixes.js.');
}

function patchEarlyJs() {
  backup(EARLY_JS);
  let source = fs.readFileSync(EARLY_JS, 'utf8').replace(/^\uFEFF/, '');

  function rewritePlannedCard(input, key, wantedHtml) {
    const token = `data-planned="${key}"`;
    const tokenIndex = input.indexOf(token);
    if (tokenIndex < 0) {
      fail(`Carte d'accueil ${key} introuvable dans season18-early.js.`);
    }

    const cardStart = input.lastIndexOf('`', tokenIndex);
    const cardEnd = input.indexOf('`', tokenIndex);
    if (cardStart < 0 || cardEnd < 0 || cardEnd <= cardStart) {
      fail(`Template de la carte ${key} illisible dans season18-early.js.`);
    }

    let card = input.slice(cardStart, cardEnd + 1);

    /* Retire NEW / INCOMING quelle que soit la version précédente. */
    card = card.replace(
      /<span\b[^>]*class=["'][^"']*(?:s18PlannedNew|s18PlannedIncoming|s18SeasonNew)[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,
      ''
    );

    const textAnchor = /<span\b[^>]*class=["'][^"']*s18PlannedTextV12[^"']*["'][^>]*>/i;
    if (!textAnchor.test(card)) {
      fail(`Zone texte de la carte ${key} introuvable.`);
    }

    card = card.replace(textAnchor, `${wantedHtml}$&`);
    return input.slice(0, cardStart) + card + input.slice(cardEnd + 1);
  }

  source = rewritePlannedCard(
    source,
    'gentle',
    '<span class="s18PlannedNewV12"></span>'
  );
  source = rewritePlannedCard(
    source,
    'twice',
    '<span class="s18PlannedIncomingV578">INCOMING</span>'
  );
  source = rewritePlannedCard(
    source,
    'tsuyu',
    '<span class="s18PlannedIncomingV578">INCOMING</span>'
  );

  const gentleMatch = source.match(/data-planned="gentle"[\s\S]{0,1500}?s18PlannedNewV12/);
  const twiceMatch = source.match(/data-planned="twice"[\s\S]{0,1500}?s18PlannedIncomingV578/);
  const tsuyuMatch = source.match(/data-planned="tsuyu"[\s\S]{0,1500}?s18PlannedIncomingV578/);

  if (!gentleMatch || !twiceMatch || !tsuyuMatch) {
    fail('Vérification des badges accueil impossible après modification.');
  }

  fs.writeFileSync(EARLY_JS, source, 'utf8');
  console.log('[CORRIGÉ] Accueil : Gentle garde NEW, Twice et Tsuyu utilisent INCOMING.');
}

function patchCss() {
  backup(FIXES_CSS);
  let source = fs.readFileSync(FIXES_CSS, 'utf8').replace(/^\uFEFF/, '');

  for (const oldMarker of [
    '/* MHUR Nexus — V577 : position et animation finales */',
    '/* MHUR Nexus — V578 : position et animation finales */'
  ]) {
    const oldIndex = source.indexOf(oldMarker);
    if (oldIndex >= 0) source = source.slice(0, oldIndex).trimEnd() + '\n';
  }

  const marker = `/* ${MARKER_CSS} */`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex >= 0) source = source.slice(0, markerIndex).trimEnd() + '\n';

  const block = String.raw`

/* MHUR Nexus — V578 : position et animation finales */
@keyframes mhurNewPulseV578{
  0%,100%{transform:scale(.94)}
  50%{transform:scale(1.10)}
}

/* Tous les NEW utilisent exactement la même animation. */
.s18NewBadge,
.s18NewBadgeV9,
.s18NewBadgeV24,
.s18NewBadgeV578,
.s18PlannedNewV12,
.s18SeasonNewV10,
.releaseNewBadgeV9{
  animation:mhurNewPulseV578 1.05s ease-in-out infinite!important;
  will-change:transform!important;
}

/* Personnages et T.U.N.I.N.G : NEW en haut à droite. */
.card[data-char] > .s18NewBadge,
.styleCard[data-style] > .s18NewBadge{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  top:7px!important;
  right:7px!important;
  left:auto!important;
  width:88px!important;
  height:44px!important;
  transform-origin:top right!important;
  z-index:80!important;
}

/* Costumes : badge plus petit, sous les étoiles à droite. */
.costumeTile > .s18NewBadge,
.costumeCard > .s18NewBadge,
.costumeResult > .s18NewBadge{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  top:36px!important;
  right:8px!important;
  left:auto!important;
  width:58px!important;
  height:30px!important;
  transform-origin:top right!important;
  z-index:80!important;
}

.costumeTile > .costumeTileStars,
.costumeCard > .costumeTileStars,
.costumeResult > .costumeTileStars,
.costumeTile > [class*="star"],
.costumeCard > [class*="star"],
.costumeResult > [class*="star"]{
  top:7px!important;
  right:8px!important;
  z-index:81!important;
}

/* Accueil : Gentle garde NEW animé. Twice et Tsuyu n'ont aucun NEW. */
.s18PlannedCardV12[data-planned="gentle"] .s18PlannedNewV12{
  display:block!important;
  visibility:visible!important;
  transform-origin:top right!important;
}

.s18PlannedCardV12[data-planned="twice"] .s18PlannedNewV12,
.s18PlannedCardV12[data-planned="tsuyu"] .s18PlannedNewV12,
.s18SeasonReleaseV10[data-release-char*="twice" i] .s18SeasonNewV10,
.s18SeasonReleaseV10[data-release-char*="tsuyu" i] .s18SeasonNewV10,
.s18SeasonReleaseV10[data-release-char*="froppy" i] .s18SeasonNewV10{
  display:none!important;
  visibility:hidden!important;
}

/* INCOMING reste uniquement sur les deux cartes de l'accueil. */
.s18PlannedIncomingV578{
  position:absolute!important;
  z-index:7!important;
  top:12px!important;
  right:12px!important;
  min-width:118px!important;
  height:40px!important;
  padding:0 12px!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:0!important;
  background:transparent!important;
  color:#fff!important;
  font-family:Impact,Haettenschweiler,'Arial Black',sans-serif!important;
  font-size:17px!important;
  font-style:italic!important;
  line-height:1!important;
  letter-spacing:.5px!important;
  text-shadow:
    -1px -1px 0 #ff2f92,
     1px -1px 0 #ff2f92,
    -1px  1px 0 #ff2f92,
     1px  1px 0 #ff2f92,
     2px  2px 0 #000!important;
  filter:drop-shadow(0 3px 0 rgba(0,0,0,.65))!important;
  animation:mhurNewPulseV578 1.05s ease-in-out infinite!important;
  transform-origin:top right!important;
}

/* Réductions de points : écriture moins épaisse. */
.discountGridV296 .discountCardV296 > b,
.discountGridV296 .s18DiscountCardV19 > b,
.discountGridV296 .v559DiscountName{
  font-family:Arial,Helvetica,sans-serif!important;
  font-size:13px!important;
  font-weight:600!important;
  line-height:1.15!important;
  letter-spacing:0!important;
  text-shadow:1px 1px 0 #000!important;
}

.discountGridV296 .discountCardV296 > span,
.discountGridV296 .s18DiscountCardV19 > span,
.discountGridV296 .v559DiscountPoints,
.discountGridV296 .v559RoleBadge{
  font-family:Arial,Helvetica,sans-serif!important;
  font-weight:600!important;
  letter-spacing:0!important;
}

@media(max-width:700px){
  .card[data-char] > .s18NewBadge,
  .styleCard[data-style] > .s18NewBadge{
    width:76px!important;
    height:38px!important;
  }

  .costumeTile > .s18NewBadge,
  .costumeCard > .s18NewBadge,
  .costumeResult > .s18NewBadge{
    top:32px!important;
    right:7px!important;
    width:52px!important;
    height:27px!important;
  }

  .s18PlannedIncomingV578{
    min-width:104px!important;
    height:36px!important;
    font-size:15px!important;
  }
}
`;

  source = source.trimEnd() + block + '\n';
  fs.writeFileSync(FIXES_CSS, source, 'utf8');
  console.log('[CORRIGÉ] Positions, tailles, animation et typographie mises à jour.');
}

function updateQuery(html, file, version) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(["'])${escaped}(?:\\?[^"']*)?\\1`, 'gi');

  if (!re.test(html)) {
    fail(`Référence ${file} introuvable dans public/index.html.`);
  }

  return html.replace(re, `"${file}?v=${version}"`);
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  // Retire les anciennes couches qui entraient en conflit.
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*(?:v572-source-new-gentle-costumes|v573-new-right-animation-costumes)[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*(?:v572-source-new-gentle-costumes|v573-new-right-animation-costumes)[^"']*["'][^>]*><\/script>\s*/gi, '\n');

  html = updateQuery(html, 'css/season18-fixes.css', VERSION);
  html = updateQuery(html, 'data/season18_sync.js', VERSION);
  html = updateQuery(html, 'js/season18-early.js', VERSION);
  html = updateQuery(html, 'js/season18-fixes.js', VERSION);

  html = html.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
  if (!html.endsWith('\n')) html += '\n';

  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('[CORRIGÉ] Cache forcé en V578 et anciens chargements V572/V573 retirés.');
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
  const fixesJs = fs.readFileSync(FIXES_JS, 'utf8');
  const fixesCss = fs.readFileSync(FIXES_CSS, 'utf8');
  const early = fs.readFileSync(EARLY_JS, 'utf8');
  const data = parseSync();
  const errors = [];

  for (const ref of [
    'css/season18-fixes.css?v=578',
    'data/season18_sync.js?v=578',
    'js/season18-early.js?v=578',
    'js/season18-fixes.js?v=578'
  ]) {
    if (!html.includes(ref)) errors.push(`cache V578 absent : ${ref}`);
  }

  if (/v572-source-new-gentle-costumes|v573-new-right-animation-costumes/i.test(html)) {
    errors.push('ancien chargement V572/V573 encore présent dans index.html');
  }

  if (!fixesJs.includes(MARKER_JS)) errors.push('bloc JavaScript V578 absent');
  if (!fixesJs.includes('V578 preserve data-costume')) errors.push('data-costume non conservé');
  if (fixesJs.includes('MHUR V574 — charge V573 sans index.html')) errors.push('chargeur V574 encore présent');
  if (!fixesCss.includes(MARKER_CSS)) errors.push('bloc CSS V578 absent');

  if (!early.includes('data-planned="twice"') || !early.includes('s18PlannedIncomingV578')) {
    errors.push('INCOMING de Twice absent');
  }
  if (!early.includes('data-planned="tsuyu"') || (early.match(/s18PlannedIncomingV578/g) || []).length < 2) {
    errors.push('INCOMING de Tsuyu absent');
  }

  for (const key of ['active_new_content', 'new_content']) {
    const row = data[key] || {};
    if (!(row.characters || []).map(String).includes('gentle_criminal')) {
      errors.push(`${key}: Gentle Criminal absent`);
    }
    if (!(row.styles || []).map(String).includes('gentle_criminal_technical')) {
      errors.push(`${key}: style Gentle absent`);
    }
    if (!(row.costumes || []).map(String).includes('108000000')) {
      errors.push(`${key}: costume Original Gentle absent`);
    }

    for (const id of info.latestIds) {
      if (!(row.costumes || []).map(String).includes(String(id))) {
        errors.push(`${key}: costume récent ${id} absent`);
        break;
      }
    }
  }

  syntaxCheck(FIXES_JS);
  syntaxCheck(EARLY_JS);

  if (errors.length) {
    fail('Vérification V578 échouée :\n- ' + errors.join('\n- '));
  }

  console.log('[VÉRIFIÉ] Personnages / T.U.N.I.N.G à droite : OK');
  console.log('[VÉRIFIÉ] Animation commune des NEW : OK');
  console.log('[VÉRIFIÉ] Tenues récentes + Original Gentle : OK');
  console.log('[VÉRIFIÉ] Accueil Gentle NEW / Twice-Tsuyu INCOMING : OK');
  console.log('[VÉRIFIÉ] Cache V578 et syntaxe JavaScript : OK');
}

function writeReport(info) {
  const rows = info.latestRows.map(item => {
    const name = item.row?.group_fr || item.row?.group_en || 'Costume';
    const variant = item.row?.variant_fr || item.row?.variant_en || '';
    return `- ${item.id} — ${name}${variant ? ` (${variant})` : ''}`;
  });

  const report = [
    'MHUR FRANCE — RAPPORT V578',
    '',
    `Dernière date de costumes sortie : ${new Date(info.latestTime).toISOString()}`,
    `Nombre de costumes marqués NEW pour cette vague : ${info.latestIds.length}`,
    ...rows,
    '',
    'Gentle Criminal :',
    '- personnage NEW',
    '- style gentle_criminal_technical NEW',
    '- costume Original 108000000 NEW',
    '',
    'Affichage :',
    '- Personnages et T.U.N.I.N.G : NEW en haut à droite',
    '- Costumes : NEW plus petit sous les étoiles',
    '- Tous les NEW : animation agrandir/rétrécir',
    '- Accueil : Gentle = NEW, Twice/Tsuyu = INCOMING',
    '- Réductions : typographie moins grasse'
  ].join('\n');

  fs.writeFileSync(REPORT, report + '\n', 'utf8');
}

function rollback() {
  for (const file of [INDEX, FIXES_JS, FIXES_CSS, EARLY_JS, SYNC_JS]) {
    const copy = file + SUFFIX;
    if (fs.existsSync(copy)) fs.copyFileSync(copy, file);
  }
}

function main() {
  for (const file of [INDEX, FIXES_JS, FIXES_CSS, EARLY_JS, SYNC_JS]) {
    ensureFile(file);
  }

  console.log('\n=== MHUR FRANCE — CORRECTIF SOURCE V578 ===\n');

  try {
    const info = patchSyncData();
    patchFixesJs();
    patchEarlyJs();
    patchCss();
    patchIndex();
    verify(info);
    writeReport(info);

    console.log('\n[OK] Correctif V578 appliqué et vérifié.');
    console.log('[OK] Rapport créé : RAPPORT_V578.txt');
    console.log('[SUITE] Envoie seulement les 5 fichiers modifiés indiqués dans LISEZ-MOI_V578.txt.\n');
  } catch (error) {
    rollback();
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error('\n[ERREUR V578] ' + (error && error.message ? error.message : String(error)));
  console.error('[SÉCURITÉ] Les cinq fichiers ont été restaurés automatiquement.\n');
  process.exitCode = 1;
}
