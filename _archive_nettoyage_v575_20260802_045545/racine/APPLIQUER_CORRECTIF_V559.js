#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VERSION = '559';
const ROOT = __dirname;
const BACKUP_SUFFIX = '.avant-v559.bak';
const PAYLOAD_PUBLIC = path.join(ROOT, '_v559_payload', 'public');

const FILES = {
  index: path.join(ROOT, 'public', 'index.html'),
  homeJson: path.join(ROOT, 'public', 'data', 'home_data.json'),
  homeJs: path.join(ROOT, 'public', 'data', 'home_data.js'),
  homeSource: path.join(ROOT, 'public', 'js', 'home.js'),
  seasonFixes: path.join(ROOT, 'public', 'js', 'season18-fixes.js'),
  updater: path.join(ROOT, 'mise_a_jour', 'outils', 'season18_postprocess.py'),
  runtime: path.join(ROOT, 'public', 'js', 'v559-discounts-stable.js'),
  css: path.join(ROOT, 'public', 'css', 'v559-discounts-stable.css')
};

const IMAGE_DIR = path.join(ROOT, 'public', 'assets', 'home', 'discounts', 'v559');
const IMAGE_NAMES = [
  'd_j_board_v559.webp',
  'flow_runner_v559.webp',
  'gentle_criminal_v559.webp',
  'factor_fusion_v559.webp',
  'cluster_v559.webp',
  'mirko_v559.webp'
];

const CANONICAL_DISCOUNTS = [
  { name:'D.J. Board', points:100, image:'assets/home/discounts/v559/d_j_board_v559.webp?v=559', character:'Present Mic', style:'Technical', style_id:'present_mic_technical', role:'technical' },
  { name:'Flow Runner', points:100, image:'assets/home/discounts/v559/flow_runner_v559.webp?v=559', character:'Shota Aizawa', style:'Strike', style_id:'aizawa_strike', role:'attack' },
  { name:'Gentle Criminal', points:100, image:'assets/home/discounts/v559/gentle_criminal_v559.webp?v=559', character:'Gentle Criminal', style:'Technical', style_id:'gentle_criminal', role:'technical' },
  { name:'Factor Fusion', points:50, image:'assets/home/discounts/v559/factor_fusion_v559.webp?v=559', character:'All For One', style:'Strike', style_id:'all_for_one_strike', role:'attack' },
  { name:'Cluster', points:50, image:'assets/home/discounts/v559/cluster_v559.webp?v=559', character:'Katsuki Bakugo', style:'Technical', style_id:'bakugo_technical', role:'technical' },
  { name:'Mirko', points:50, image:'assets/home/discounts/v559/mirko_v559.webp?v=559', character:'Mirko', style:'Rapid', style_id:'mirko_rapid', role:'rapid' }
];

function fail(message) {
  console.error(`\n[ERREUR V${VERSION}] ${message}\n`);
  process.exit(1);
}

function rel(file) {
  return path.relative(ROOT, file) || '.';
}

function ensureFile(file, label) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`${label} introuvable : ${rel(file)}`);
  }
}

function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive:true });
  fs.writeFileSync(file, text, 'utf8');
}

function backup(file) {
  if (!fs.existsSync(file)) return false;
  const destination = file + BACKUP_SUFFIX;
  if (!fs.existsSync(destination)) {
    fs.copyFileSync(file, destination);
    console.log(`[SAUVEGARDE] ${rel(destination)}`);
  }
  return true;
}

function copyFileProtected(source, destination) {
  ensureFile(source, 'Fichier du correctif');
  if (fs.existsSync(destination)) {
    const same = fs.readFileSync(source).equals(fs.readFileSync(destination));
    if (!same) backup(destination);
  }
  fs.mkdirSync(path.dirname(destination), { recursive:true });
  fs.copyFileSync(source, destination);
  console.log(`[INSTALLÉ] ${rel(destination)}`);
}

function copyPayloadTree(sourceDir, destinationDir) {
  if (!fs.existsSync(sourceDir)) fail(`Dossier fourni absent : ${rel(sourceDir)}`);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes:true })) {
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) copyPayloadTree(source, destination);
    else if (entry.isFile()) copyFileProtected(source, destination);
  }
}

function resolveGitConflicts(text) {
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const out = [];
  let count = 0;

  for (let i = 0; i < lines.length; i += 1) {
    if (!/^<<<<<<<(?:\s|$)/.test(lines[i])) {
      if (/^>>>>>>>\s/.test(lines[i])) { count += 1; continue; }
      out.push(lines[i]);
      continue;
    }

    count += 1;
    const ours = [];
    const theirs = [];
    i += 1;
    while (i < lines.length && !/^=======$/.test(lines[i]) && !/^>>>>>>>\s/.test(lines[i])) {
      ours.push(lines[i]);
      i += 1;
    }
    if (i < lines.length && /^=======$/.test(lines[i])) {
      i += 1;
      while (i < lines.length && !/^>>>>>>>\s/.test(lines[i])) {
        theirs.push(lines[i]);
        i += 1;
      }
    }
    const chosen = ours.some(line => line.trim()) ? ours : theirs;
    out.push(...chosen);
  }

  let cleaned = out.join(newline);
  cleaned = cleaned.replace(/<{7}\s*HEAD\s*=+\s*>{7}\s*[^\r\n<]*/gi, '');
  cleaned = cleaned.replace(/^[ \t]*(?:<<<<<<<[^\r\n]*|>>>>>>>[^\r\n]*)[ \t]*\r?\n?/gm, '');
  return { text:cleaned, count };
}

function patchHomeData() {
  backup(FILES.homeJson);
  backup(FILES.homeJs);
  let data;
  try {
    data = JSON.parse(readText(FILES.homeJson));
  } catch (error) {
    fail(`home_data.json est invalide : ${error.message}`);
  }
  data.discounts = CANONICAL_DISCOUNTS.map(item => ({ ...item }));
  writeText(FILES.homeJson, JSON.stringify(data, null, 2) + '\n');
  writeText(FILES.homeJs, 'window.MHUR_HOME_DATA = ' + JSON.stringify(data) + ';\n');
  console.log('[CORRIGÉ] Données des 6 réductions verrouillées.');
}

function patchHomeSource() {
  backup(FILES.homeSource);
  let text = readText(FILES.homeSource);
  const before = text;
  text = text.split(/\r?\n/).filter(line => !line.includes('<footer class="homeFootV296">')).join('\n');
  if (before !== text) console.log('[SUPPRIMÉ] Texte « Mise à jour automatique chaque mardi… ».');
  writeText(FILES.homeSource, text.endsWith('\n') ? text : text + '\n');
}

function patchSeasonFixes() {
  backup(FILES.seasonFixes);
  let text = readText(FILES.seasonFixes);

  const portraitBlock = `const DISCOUNT_PORTRAITS={\n  dj_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',\n  d_j_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',\n  flow_runner:'assets/home/discounts/v559/flow_runner_v559.webp?v=559',\n  gentle_criminal:'assets/home/discounts/v559/gentle_criminal_v559.webp?v=559',\n  factor_fusion:'assets/home/discounts/v559/factor_fusion_v559.webp?v=559',\n  cluster:'assets/home/discounts/v559/cluster_v559.webp?v=559',\n  mirko:'assets/home/discounts/v559/mirko_v559.webp?v=559'\n};`;
  text = text.replace(/const DISCOUNT_PORTRAITS\s*=\s*\{[\s\S]*?\n\};/, portraitBlock);

  const fallbackBlock = `const DISCOUNT_FALLBACK={\n  dj_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',\n  d_j_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',\n  flow_runner:'assets/home/discounts/v559/flow_runner_v559.webp?v=559',\n  gentle_criminal:'assets/home/discounts/v559/gentle_criminal_v559.webp?v=559',\n  factor_fusion:'assets/home/discounts/v559/factor_fusion_v559.webp?v=559',\n  cluster:'assets/home/discounts/v559/cluster_v559.webp?v=559',\n  mirko:'assets/home/discounts/v559/mirko_v559.webp?v=559'\n};`;
  text = text.replace(/const DISCOUNT_FALLBACK\s*=\s*\{[\s\S]*?\n\};/, fallbackBlock);

  text = text.replace(/assets\/home\/discounts\/gentle_criminal_v531\.png\?v=531/g, 'assets/home/discounts/v559/gentle_criminal_v559.webp?v=559');
  text = text.replace(/return \{src:absAsset\(dbPath\|\|fallback\),fallback:absAsset\(fallback\)\};/g, 'return {src:absAsset(fallback||dbPath),fallback:absAsset(fallback||dbPath)};');
  text = text.replace(/factor_fusion\s*:\s*['"]overhaul_assault['"]/g, "factor_fusion:'all_for_one_strike'");

  writeText(FILES.seasonFixes, text);
  console.log('[CORRIGÉ] Les anciens remplacements de portraits ne peuvent plus reprendre le dessus.');
}

function pythonDiscountBlock(indent) {
  const body = JSON.stringify(CANONICAL_DISCOUNTS, null, 2)
    .split('\n')
    .map((line, index) => index === 0 ? line : indent + line)
    .join('\n');
  return [
    `${indent}# V559_DISCOUNT_LOCK_BEGIN`,
    `${indent}# Cartes validées manuellement : les mises à jour ne remplacent plus leurs images.`,
    `${indent}data["discounts"] = ${body}`,
    `${indent}# V559_DISCOUNT_LOCK_END`
  ].join('\n');
}

function patchUpdater() {
  if (!fs.existsSync(FILES.updater)) {
    console.warn('[AVERTISSEMENT] season18_postprocess.py absent : protection côté navigateur seulement.');
    return;
  }
  backup(FILES.updater);
  let text = readText(FILES.updater);
  const existing = /^[ \t]*# V559_DISCOUNT_LOCK_BEGIN[\s\S]*?^[ \t]*# V559_DISCOUNT_LOCK_END[ \t]*$/m;
  if (existing.test(text)) {
    const match = text.match(existing)[0];
    const indent = (match.match(/^([ \t]*)#/) || ['', '    '])[1];
    text = text.replace(existing, pythonDiscountBlock(indent));
  } else {
    const linksLine = /^([ \t]*)links:\s*list\[str\]\s*=\s*\[\][ \t]*$/m;
    const match = text.match(linksLine);
    if (!match) {
      console.warn('[AVERTISSEMENT] Point d’insertion introuvable dans le programme de mise à jour. Le verrou navigateur reste actif.');
    } else {
      text = text.replace(linksLine, pythonDiscountBlock(match[1]) + '\n' + match[0]);
    }
  }
  writeText(FILES.updater, text);
  console.log('[PROTÉGÉ] Les prochaines mises à jour conservent ces 6 cartes.');
}

function stripOldTags(html) {
  return html
    .replace(/\s*<script\b[^>]*src=["'][^"']*v558-discount-lock\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v559-discounts-stable\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n')
    .replace(/\s*<link\b[^>]*href=["'][^"']*v559-discounts-stable\.css[^"']*["'][^>]*>\s*/gi, '\n');
}

function patchIndex() {
  backup(FILES.index);
  let html = readText(FILES.index);
  const resolved = resolveGitConflicts(html);
  html = stripOldTags(resolved.text);

  html = html.replace(/data\/home_data\.js\?v=[^"'\s>]+/g, 'data/home_data.js?v=559');
  html = html.replace(/js\/home\.js\?v=[^"'\s>]+/g, 'js/home.js?v=559');
  html = html.replace(/js\/season18-fixes\.js\?v=[^"'\s>]+/g, 'js/season18-fixes.js?v=559');

  const cssTag = '<link rel="stylesheet" href="css/v559-discounts-stable.css?v=559">';
  const scriptTag = '<script src="js/v559-discounts-stable.js?v=559"></script>';

  if (!/<\/head>/i.test(html)) fail('Balise </head> absente de public/index.html.');
  html = html.replace(/<\/head>/i, `${cssTag}\n</head>`);

  const seasonV12 = /(<script\b[^>]*src=["']js\/season18-v12\.js[^"']*["'][^>]*><\/script>)/i;
  if (seasonV12.test(html)) html = html.replace(seasonV12, `$1\n${scriptTag}`);
  else if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
  else fail('Balise </body> absente de public/index.html.');

  if (resolved.count) console.log(`[RÉSOLU] ${resolved.count} conflit(s) Git retiré(s) de index.html.`);
  writeText(FILES.index, html);
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function verify() {
  const errors = [];
  const index = readText(FILES.index);
  const home = JSON.parse(readText(FILES.homeJson));
  const homeSource = readText(FILES.homeSource);
  const season = readText(FILES.seasonFixes);

  if (/<<<<<<<|>>>>>>>/.test(index)) errors.push('un marqueur de conflit Git reste dans index.html');
  if (!index.includes('css/v559-discounts-stable.css?v=559')) errors.push('le CSS V559 n’est pas chargé');
  if (!index.includes('js/v559-discounts-stable.js?v=559')) errors.push('le JavaScript V559 n’est pas chargé');
  if (/v558-discount-lock\.js/i.test(index)) errors.push('l’ancien verrou V558 est encore chargé');
  if (home.discounts?.length !== 6) errors.push('home_data.json ne contient pas exactement 6 réductions');
  const factor = home.discounts?.find(item => item.name === 'Factor Fusion');
  if (factor?.character !== 'All For One' || factor?.style_id !== 'all_for_one_strike' || factor?.role !== 'attack') {
    errors.push('Factor Fusion n’est pas associé à All For One Strike');
  }
  if (homeSource.includes('<footer class="homeFootV296">')) errors.push('le texte de mise à jour automatique est toujours dans home.js');
  if (!season.includes('assets/home/discounts/v559/factor_fusion_v559.webp?v=559')) errors.push('season18-fixes.js ne pointe pas vers l’image Factor Fusion V559');
  if (!fs.existsSync(FILES.runtime)) errors.push('public/js/v559-discounts-stable.js manque');
  if (!fs.existsSync(FILES.css)) errors.push('public/css/v559-discounts-stable.css manque');

  const hashes = [];
  for (const name of IMAGE_NAMES) {
    const file = path.join(IMAGE_DIR, name);
    if (!fs.existsSync(file)) { errors.push(`image manquante : ${rel(file)}`); continue; }
    if (fs.statSync(file).size < 15000) errors.push(`image anormalement petite : ${rel(file)}`);
    hashes.push(hashFile(file));
  }
  if (new Set(hashes).size !== hashes.length) errors.push('plusieurs images V559 sont identiques, ce qui indique un ancien placeholder');

  if (fs.existsSync(FILES.updater) && !readText(FILES.updater).includes('V559_DISCOUNT_LOCK_BEGIN')) {
    errors.push('le verrou de mise à jour V559 n’est pas présent');
  }

  if (errors.length) fail('Vérification échouée :\n- ' + errors.join('\n- '));
}

function main() {
  ensureFile(FILES.index, 'public/index.html');
  ensureFile(FILES.homeJson, 'public/data/home_data.json');
  ensureFile(FILES.homeJs, 'public/data/home_data.js');
  ensureFile(FILES.homeSource, 'public/js/home.js');
  ensureFile(FILES.seasonFixes, 'public/js/season18-fixes.js');

  console.log('\n=== MHUR FRANCE — CORRECTIF V559 ===\n');
  patchHomeData();
  patchHomeSource();
  patchSeasonFixes();
  patchUpdater();
  copyPayloadTree(PAYLOAD_PUBLIC, path.join(ROOT, 'public'));
  patchIndex();
  verify();

  console.log('\n[OK] Correctif V559 appliqué avec succès.');
  console.log('[OK] Conflit Git retiré, portraits restaurés, Factor Fusion = All For One Strike.');
  console.log('[SUITE] Fais ton commit/push, attends le redéploiement, puis utilise Ctrl + F5.\n');
}

main();
