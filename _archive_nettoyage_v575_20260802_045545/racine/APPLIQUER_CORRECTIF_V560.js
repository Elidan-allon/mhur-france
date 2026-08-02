#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION = '560';
const BACKUP_SUFFIX = '.avant-v560.bak';
const INDEX = path.join(ROOT, 'public', 'index.html');
const PAYLOAD = path.join(ROOT, '_v560_payload', 'public');
const JS_DEST = path.join(ROOT, 'public', 'js', 'v560-discount-role-dedupe.js');
const CSS_DEST = path.join(ROOT, 'public', 'css', 'v560-discount-role-dedupe.css');

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
  fs.mkdirSync(path.dirname(destination), { recursive:true });
  fs.copyFileSync(source, destination);
  console.log(`[INSTALLÉ] ${relative(destination)}`);
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v560-discount-role-dedupe\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v560-discount-role-dedupe\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');

  const cssTag = '<link rel="stylesheet" href="css/v560-discount-role-dedupe.css?v=560">';
  const scriptTag = '<script src="js/v560-discount-role-dedupe.js?v=560"></script>';

  if (!/<\/head>/i.test(html)) fail('Balise </head> absente de public/index.html.');
  html = html.replace(/<\/head>/i, `${cssTag}\n</head>`);

  if (!/<\/body>/i.test(html)) fail('Balise </body> absente de public/index.html.');
  html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);

  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('[CORRIGÉ] Le correctif V560 est chargé après les anciens scripts.');
}

function verify() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const errors = [];
  if (!html.includes('css/v560-discount-role-dedupe.css?v=560')) errors.push('CSS V560 non chargé');
  if (!html.includes('js/v560-discount-role-dedupe.js?v=560')) errors.push('JavaScript V560 non chargé');
  if (!fs.existsSync(JS_DEST)) errors.push('fichier JavaScript V560 absent');
  if (!fs.existsSync(CSS_DEST)) errors.push('fichier CSS V560 absent');
  if (errors.length) fail('Vérification échouée :\n- ' + errors.join('\n- '));
}

function main() {
  ensureFile(INDEX, 'public/index.html');
  console.log('\n=== MHUR FRANCE — CORRECTIF V560 ===\n');
  copy(path.join(PAYLOAD, 'js', 'v560-discount-role-dedupe.js'), JS_DEST);
  copy(path.join(PAYLOAD, 'css', 'v560-discount-role-dedupe.css'), CSS_DEST);
  patchIndex();
  verify();
  console.log('\n[OK] Le deuxième rôle sous les points sera supprimé automatiquement.');
  console.log('[SUITE] Commit/push, attends le déploiement Cloudflare, puis fais Ctrl + F5.\n');
}

main();
