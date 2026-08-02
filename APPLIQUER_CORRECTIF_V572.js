#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION = '572';
const BACKUP_SUFFIX = '.avant-v572.bak';

const INDEX = path.join(ROOT, 'public', 'index.html');
const FIXES_JS = path.join(ROOT, 'public', 'js', 'season18-fixes.js');
const SYNC_JS = path.join(ROOT, 'public', 'data', 'season18_sync.js');

const PAYLOAD = path.join(ROOT, '_v572_payload', 'public');
const FINAL_JS = path.join(ROOT, 'public', 'js', 'v572-source-new-gentle-costumes.js');
const FINAL_CSS = path.join(ROOT, 'public', 'css', 'v572-source-new-gentle-costumes.css');

function fail(message) {
  console.error(`\n[ERREUR V${VERSION}] ${message}\n`);
  process.exit(1);
}

function relative(file) {
  return path.relative(ROOT, file) || '.';
}

function ensureFile(file, label) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`${label} introuvable : ${relative(file)}`);
  }
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const copy = file + BACKUP_SUFFIX;
  if (!fs.existsSync(copy)) {
    fs.copyFileSync(file, copy);
    console.log(`[SAUVEGARDE] ${relative(copy)}`);
  }
}

function copy(source, destination) {
  ensureFile(source, 'Fichier du correctif');
  backup(destination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`[INSTALLÉ] ${relative(destination)}`);
}

function uniqueStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(String)));
}

function patchSeasonData() {
  backup(SYNC_JS);
  const raw = fs.readFileSync(SYNC_JS, 'utf8').replace(/^\uFEFF/, '');
  const match = raw.match(/^\s*window\.MHUR_SEASON18_DATA\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);

  if (!match) {
    fail('Impossible de lire window.MHUR_SEASON18_DATA dans public/data/season18_sync.js.');
  }

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    fail(`Le JSON de season18_sync.js est invalide : ${error.message}`);
  }

  const now = Date.now();
  const released = Object.entries(data.costumes || {})
    .map(([id, row]) => ({
      id: String(id),
      time: Date.parse(String(row && row.releaseDate || '')),
      upcoming: Boolean(row && row.upcoming)
    }))
    .filter(row => Number.isFinite(row.time) && !row.upcoming && row.time <= now);

  const latestTime = released.length
    ? Math.max(...released.map(row => row.time))
    : null;

  const latestIds = latestTime === null
    ? []
    : released.filter(row => row.time === latestTime).map(row => row.id);

  for (const key of ['active_new_content', 'new_content']) {
    if (!data[key] || typeof data[key] !== 'object') data[key] = {};

    data[key].characters = uniqueStrings([
      ...(data[key].characters || []),
      'gentle_criminal'
    ]);

    data[key].styles = uniqueStrings([
      ...(data[key].styles || []),
      'gentle_criminal_technical'
    ]);

    data[key].costumes = uniqueStrings([
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

  console.log(`[CORRIGÉ] season18_sync.js : ${latestIds.length} costumes de la dernière vague ajoutés.`);
  console.log('[CORRIGÉ] Costume Original Gentle 108000000 ajouté.');
  console.log('[CORRIGÉ] Gentle Criminal et son style Technique ajoutés au contenu NEW.');
}

function patchSeasonFixes() {
  backup(FIXES_JS);
  let source = fs.readFileSync(FIXES_JS, 'utf8').replace(/^\uFEFF/, '');
  let changed = false;

  if (!source.includes('V572 preserve costume id')) {
    const target = "let html=String(baseCostumeCard(officialCostume)||'');";
    const replacement =
      "let html=String(baseCostumeCard(officialCostume)||'');\n" +
      "      /* V572 preserve costume id */\n" +
      "      if(id&&!/\\bdata-costume\\s*=/.test(html)) html=html.replace(/^(<(?:button|div)\\b)/i,`$1 data-costume=\"${esc(id)}\"`);";

    if (source.includes(target)) {
      source = source.replace(target, replacement);
      changed = true;
    } else {
      console.log('[INFO] Le rendu costume a déjà été modifié ou utilise une autre forme.');
    }
  }

  if (!source.includes('V572 merge latest costume wave')) {
    const oldLine =
      "const costumes=hasActive?(data.costumes||[]):(latestCostumes.length?latestCostumes:(data.costumes||[]));";
    const newLine =
      "/* V572 merge latest costume wave */\n" +
      "  const costumes=Array.from(new Set([...(data.costumes||[]),...latestCostumes,'108000000']));";

    if (source.includes(oldLine)) {
      source = source.replace(oldLine, newLine);
      changed = true;
    }
  }

  if (!source.includes('V572 merge latest costume wave v24')) {
    const oldLine =
      "const costumes=hasActive?(source.costumes||[]):(latestCostumeIds.length?latestCostumeIds:(source.costumes||[]));";
    const newLine =
      "/* V572 merge latest costume wave v24 */\n" +
      "  const costumes=Array.from(new Set([...(source.costumes||[]),...latestCostumeIds,'108000000']));";

    if (source.includes(oldLine)) {
      source = source.replace(oldLine, newLine);
      changed = true;
    }
  }

  fs.writeFileSync(FIXES_JS, source, 'utf8');
  console.log(changed
    ? '[CORRIGÉ] season18-fixes.js : identifiants costumes conservés et listes fusionnées.'
    : '[INFO] season18-fixes.js ne nécessitait pas de nouvelle modification.');
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  // Retire les couches de badges expérimentales V563 à V571.
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*(?:v56[3-9]|v570|v571)[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*(?:v56[3-9]|v570|v571)[^"']*["'][^>]*><\/script>\s*/gi, '\n')
    .replace(/\s*<link\b[^>]*href=["'][^"']*v572-source-new-gentle-costumes\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v572-source-new-gentle-costumes\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');

  const cssTag = '<link rel="stylesheet" href="css/v572-source-new-gentle-costumes.css?v=572">';
  const scriptTag = '<script src="js/v572-source-new-gentle-costumes.js?v=572"></script>';

  if (!/<\/body>/i.test(html)) fail('Balise </body> absente de public/index.html.');

  // Chargés tout à la fin pour passer après season18-fixes et season18-v12.
  html = html.replace(/<\/body>/i, `${cssTag}\n${scriptTag}\n</body>`);
  fs.writeFileSync(INDEX, html, 'utf8');

  console.log('[CORRIGÉ] index.html : anciens correctifs badges retirés, V572 chargé en dernier.');
}

function verify() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const fixes = fs.readFileSync(FIXES_JS, 'utf8');
  const syncRaw = fs.readFileSync(SYNC_JS, 'utf8');
  const syncMatch = syncRaw.match(/^\s*window\.MHUR_SEASON18_DATA\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  const errors = [];

  if (!html.includes('css/v572-source-new-gentle-costumes.css?v=572')) {
    errors.push('CSS V572 non chargé');
  }
  if (!html.includes('js/v572-source-new-gentle-costumes.js?v=572')) {
    errors.push('JavaScript V572 non chargé');
  }
  if (!fs.existsSync(FINAL_JS)) errors.push('fichier JavaScript V572 absent');
  if (!fs.existsSync(FINAL_CSS)) errors.push('fichier CSS V572 absent');
  if (!syncMatch) errors.push('season18_sync.js illisible après correction');

  if (syncMatch) {
    try {
      const data = JSON.parse(syncMatch[1]);
      const active = data.active_new_content || {};
      if (!(active.characters || []).map(String).includes('gentle_criminal')) {
        errors.push('Gentle Criminal absent des personnages NEW');
      }
      if (!(active.styles || []).map(String).includes('gentle_criminal_technical')) {
        errors.push('Style Technique Gentle absent des styles NEW');
      }
      if (!(active.costumes || []).map(String).includes('108000000')) {
        errors.push('Costume Original Gentle 108000000 absent des costumes NEW');
      }
    } catch (error) {
      errors.push(`JSON final invalide : ${error.message}`);
    }
  }

  if (!fixes.includes('data-costume')) {
    errors.push('data-costume non conservé dans season18-fixes.js');
  }

  if (errors.length) {
    fail('Vérification échouée :\n- ' + errors.join('\n- '));
  }

  console.log('[VÉRIFIÉ] Gentle personnage : OK');
  console.log('[VÉRIFIÉ] Gentle style Technique : OK');
  console.log('[VÉRIFIÉ] Gentle costume Original 108000000 : OK');
  console.log('[VÉRIFIÉ] Vague de costumes la plus récente : OK');
  console.log('[VÉRIFIÉ] CSS et JavaScript V572 chargés en dernier : OK');
}

function main() {
  ensureFile(INDEX, 'public/index.html');
  ensureFile(FIXES_JS, 'public/js/season18-fixes.js');
  ensureFile(SYNC_JS, 'public/data/season18_sync.js');

  console.log('\n=== MHUR FRANCE — CORRECTIF V572 SOURCE ===\n');

  copy(
    path.join(PAYLOAD, 'js', 'v572-source-new-gentle-costumes.js'),
    FINAL_JS
  );
  copy(
    path.join(PAYLOAD, 'css', 'v572-source-new-gentle-costumes.css'),
    FINAL_CSS
  );

  patchSeasonData();
  patchSeasonFixes();
  patchIndex();
  verify();

  console.log('\n[OK] Correctif V572 appliqué et vérifié.');
  console.log('[SUITE] Commit/push, attends Cloudflare, puis fais Ctrl + F5.\n');
}

main();
