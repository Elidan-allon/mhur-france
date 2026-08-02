#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION = '570';
const SUFFIX = '.avant-v570.bak';
const INDEX = path.join(ROOT, 'public', 'index.html');
const EARLY = path.join(ROOT, 'public', 'js', 'season18-early.js');
const FIXES = path.join(ROOT, 'public', 'js', 'season18-fixes.js');
const CSS = path.join(ROOT, 'public', 'css', 'season18-fixes.css');

function relative(file) {
  return path.relative(ROOT, file) || '.';
}

function fail(message) {
  console.error(`\n[ERREUR V${VERSION}] ${message}\n`);
  process.exit(1);
}

function ensureFile(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`Fichier introuvable : ${relative(file)}. Décompresse le ZIP à la racine de mhur-france.`);
  }
}

function backup(file) {
  const target = file + SUFFIX;
  if (!fs.existsSync(target)) {
    fs.copyFileSync(file, target);
    console.log(`[SAUVEGARDE] ${relative(target)}`);
  }
}

function write(file, content) {
  fs.writeFileSync(file, content, 'utf8');
  console.log(`[CORRIGÉ] ${relative(file)}`);
}

function patchEarly() {
  backup(EARLY);
  const original = fs.readFileSync(EARLY, 'utf8').replace(/^\uFEFF/, '');
  let twiceFound = false;
  let tsuyuFound = false;

  const patched = original.split(/\r?\n/).map(line => {
    if (/data-planned=["']twice["']/.test(line)) {
      twiceFound = true;
      return line.replace(/<span class=["']s18PlannedNewV12["']><\/span>/g, '');
    }
    if (/data-planned=["']tsuyu["']/.test(line)) {
      tsuyuFound = true;
      return line.replace(/<span class=["']s18PlannedNewV12["']><\/span>/g, '');
    }
    return line;
  }).join('\n');

  if (!twiceFound || !tsuyuFound) {
    fail('Les cartes Twice/Tsuyu sont introuvables dans public/js/season18-early.js. Aucun changement risqué n’a été écrit.');
  }

  write(EARLY, patched);
}

function patchFixes() {
  backup(FIXES);
  let js = fs.readFileSync(FIXES, 'utf8').replace(/^\uFEFF/, '');

  const unconditional = '<span class="s18SeasonNewV10" aria-hidden="true"></span>';
  const conditional = '${item.key===\'gentle\'?\'<span class="s18SeasonNewV10" aria-hidden="true"></span>\':\'\'}';

  if (js.includes(unconditional)) {
    js = js.replace(unconditional, conditional);
  } else if (!js.includes("item.key==='gentle'?'<span class=\"s18SeasonNewV10\"")) {
    fail('Le rendu de secours des sorties Saison 18 n’a pas été reconnu dans season18-fixes.js.');
  }

  write(FIXES, js);
}

function patchCss() {
  backup(CSS);
  let css = fs.readFileSync(CSS, 'utf8').replace(/^\uFEFF/, '');

  css = css.replace(/\/\* === MHUR V570 START === \*\/[\s\S]*?\/\* === MHUR V570 END === \*\//g, '').trimEnd();

  css += `\n\n/* === MHUR V570 START === */
/* Accueil : seul Gentle Criminal garde le badge NEW. */
.s18PlannedCardV12[data-planned="twice"] .s18PlannedNewV12,
.s18PlannedCardV12[data-planned="tsuyu"] .s18PlannedNewV12,
.s18SeasonReleaseV10[data-release-char*="twice" i] .s18SeasonNewV10,
.s18SeasonReleaseV10[data-release-char*="tsuyu" i] .s18SeasonNewV10,
.s18SeasonReleaseV10[data-release-char*="froppy" i] .s18SeasonNewV10 {
  display: none !important;
  visibility: hidden !important;
}

/* Costumes : NEW en haut à droite, mais sous la ligne des étoiles. */
.costumeTile > .s18NewBadge,
.costumeCard > .s18NewBadge,
.costumeResult > .s18NewBadge,
.costumeTile > .s18NewBadgeV24,
.costumeCard > .s18NewBadgeV24,
.costumeResult > .s18NewBadgeV24 {
  top: 38px !important;
  right: 8px !important;
  left: auto !important;
  width: 64px !important;
  height: 34px !important;
  transform-origin: top right !important;
  z-index: 31 !important;
}

/* Les étoiles restent tout en haut et au-dessus du NEW. */
.costumeTile > .costumeTileStars,
.costumeCard > .costumeTileStars,
.costumeResult > .costumeTileStars {
  top: 7px !important;
  right: 8px !important;
  z-index: 32 !important;
}
/* === MHUR V570 END === */\n`;

  write(CSS, css);
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  /* Retire toutes les couches expérimentales précédentes qui recréaient les badges. */
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v56[3-9][^"']*\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v56[3-9][^"']*\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');

  /* Force le navigateur et Cloudflare à reprendre les fichiers réellement modifiés. */
  html = html
    .replace(/css\/season18-fixes\.css\?v=[^"']+/gi, 'css/season18-fixes.css?v=570')
    .replace(/js\/season18-early\.js\?v=[^"']+/gi, 'js/season18-early.js?v=570')
    .replace(/js\/season18-fixes\.js\?v=[^"']+/gi, 'js/season18-fixes.js?v=570');

  write(INDEX, html);
}

function verify() {
  const early = fs.readFileSync(EARLY, 'utf8');
  const fixes = fs.readFileSync(FIXES, 'utf8');
  const css = fs.readFileSync(CSS, 'utf8');
  const html = fs.readFileSync(INDEX, 'utf8');
  const errors = [];

  const twiceLine = early.split(/\r?\n/).find(line => /data-planned=["']twice["']/.test(line)) || '';
  const tsuyuLine = early.split(/\r?\n/).find(line => /data-planned=["']tsuyu["']/.test(line)) || '';
  const gentleLine = early.split(/\r?\n/).find(line => /data-planned=["']gentle["']/.test(line)) || '';

  if (/s18PlannedNewV12/.test(twiceLine)) errors.push('NEW encore présent dans la carte Twice');
  if (/s18PlannedNewV12/.test(tsuyuLine)) errors.push('NEW encore présent dans la carte Tsuyu');
  if (!/s18PlannedNewV12/.test(gentleLine)) errors.push('NEW Gentle Criminal supprimé par erreur');
  if (!fixes.includes("item.key==='gentle'?'<span class=\"s18SeasonNewV10\"")) errors.push('rendu de secours accueil non corrigé');
  if (!css.includes('/* === MHUR V570 START === */')) errors.push('bloc CSS V570 absent');
  if (!css.includes('top: 38px !important;')) errors.push('position costume non appliquée');
  if (/v56[3-9][^"']*\.(?:css|js)/i.test(html)) errors.push('anciens correctifs V563-V569 encore chargés');
  if (!html.includes('css/season18-fixes.css?v=570')) errors.push('cache CSS non actualisé');
  if (!html.includes('js/season18-early.js?v=570')) errors.push('cache season18-early non actualisé');
  if (!html.includes('js/season18-fixes.js?v=570')) errors.push('cache season18-fixes non actualisé');

  if (errors.length) fail('Vérification échouée :\n- ' + errors.join('\n- '));
}

function main() {
  [INDEX, EARLY, FIXES, CSS].forEach(ensureFile);
  console.log('\n=== MHUR FRANCE — CORRECTIF V570 ===\n');
  patchEarly();
  patchFixes();
  patchCss();
  patchIndex();
  verify();
  console.log('\n[OK] NEW supprimé de Twice et Tsuyu à l’accueil.');
  console.log('[OK] NEW conservé uniquement sur Gentle Criminal à l’accueil.');
  console.log('[OK] NEW des costumes descendu sous les étoiles.');
  console.log('[OK] Les anciens correctifs V563 à V569 ne sont plus chargés.');
  console.log('[SUITE] Commit/push, attends Cloudflare, puis fais Ctrl + F5.\n');
}

main();
