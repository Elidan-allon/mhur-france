#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION = '567';
const BACKUP_SUFFIX = '.avant-v567.bak';
const INDEX = path.join(ROOT, 'public', 'index.html');
const PAYLOAD = path.join(ROOT, '_v567_payload', 'public');
const JS_DEST = path.join(ROOT, 'public', 'js', 'v567-badges-propres.js');
const CSS_DEST = path.join(ROOT, 'public', 'css', 'v567-badges-propres.css');

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
  if (fs.existsSync(destination)) backup(destination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`[INSTALLÉ] ${relative(destination)}`);
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  /* Désactive réellement les quatre anciens correctifs qui se battaient entre eux. */
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v56[3-6][^"']*\.css(?:\?[^"']*)?["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v56[3-6][^"']*\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi, '\n')
    .replace(/\s*<link\b[^>]*href=["'][^"']*v567-badges-propres\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v567-badges-propres\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');

  const cssTag = '<link id="mhur-v567-css" rel="stylesheet" href="css/v567-badges-propres.css?v=567">';
  const scriptTag = '<script id="mhur-v567-js" src="js/v567-badges-propres.js?v=567"></script>';

  if (!/<\/head>/i.test(html)) fail('Balise </head> absente de public/index.html.');
  html = html.replace(/<\/head>/i, `${cssTag}\n</head>`);

  if (!/<\/body>/i.test(html)) fail('Balise </body> absente de public/index.html.');
  html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);

  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('[CORRIGÉ] Les scripts V563, V564, V565 et V566 ont été retirés de index.html.');
  console.log('[CORRIGÉ] V567 est chargé tout à la fin du site.');
}

function verify() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const errors = [];
  if (!html.includes('css/v567-badges-propres.css?v=567')) errors.push('CSS V567 non chargé');
  if (!html.includes('js/v567-badges-propres.js?v=567')) errors.push('JavaScript V567 non chargé');
  if (/v56[3-6][^"']*\.(?:css|js)/i.test(html)) errors.push('un ancien correctif V563-V566 est encore chargé');
  if (!fs.existsSync(JS_DEST)) errors.push('fichier JavaScript V567 absent');
  if (!fs.existsSync(CSS_DEST)) errors.push('fichier CSS V567 absent');
  if (errors.length) fail('Vérification échouée :\n- ' + errors.join('\n- '));
}

function main() {
  ensureFile(INDEX, 'public/index.html');
  console.log('\n=== MHUR FRANCE — CORRECTIF V567 ===\n');
  copy(path.join(PAYLOAD, 'js', 'v567-badges-propres.js'), JS_DEST);
  copy(path.join(PAYLOAD, 'css', 'v567-badges-propres.css'), CSS_DEST);
  patchIndex();
  verify();
  console.log('\n[OK] Un seul système de badges reste actif.');
  console.log('[OK] Gentle : NEW animé, taille accueil, en haut à droite.');
  console.log('[OK] Twice et Tsuyu : INCOMING agrandi, sans NEW derrière.');
  console.log('[OK] Gentle : NEW sur les cartes Personnage, T.U.N.I.N.G et Costumes.');
  console.log('[OK] Les costumes Gentle et les costumes actifs reçoivent NEW.');
  console.log('[OK] La typographie légère des réductions est restaurée.');
  console.log('[SUITE] Commit/push, attends Cloudflare, puis fais Ctrl + F5.\n');
}

main();
