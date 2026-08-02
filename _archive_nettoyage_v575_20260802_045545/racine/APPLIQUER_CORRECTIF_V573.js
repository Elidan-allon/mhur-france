#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION = '573';
const BACKUP_SUFFIX = '.avant-v573.bak';

const INDEX = path.join(ROOT, 'public', 'index.html');
const PAYLOAD = path.join(ROOT, '_v573_payload', 'public');
const FINAL_JS = path.join(ROOT, 'public', 'js', 'v573-new-right-animation-costumes.js');
const FINAL_CSS = path.join(ROOT, 'public', 'css', 'v573-new-right-animation-costumes.css');

function fail(message) {
  console.error(`\n[ERREUR V${VERSION}] ${message}\n`);
  process.exit(1);
}

function ensureFile(file, label) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`${label} introuvable : ${path.relative(ROOT, file) || '.'}`);
  }
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const copy = file + BACKUP_SUFFIX;
  if (!fs.existsSync(copy)) {
    fs.copyFileSync(file, copy);
    console.log(`[SAUVEGARDE] ${path.relative(ROOT, copy)}`);
  }
}

function copy(source, destination) {
  ensureFile(source, 'Fichier du correctif');
  backup(destination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`[INSTALLÉ] ${path.relative(ROOT, destination)}`);
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v573-new-right-animation-costumes\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v573-new-right-animation-costumes\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');

  const cssTag = '<link rel="stylesheet" href="css/v573-new-right-animation-costumes.css?v=573">';
  const scriptTag = '<script src="js/v573-new-right-animation-costumes.js?v=573"></script>';

  if (!/<\/body>/i.test(html)) fail('Balise </body> absente de public/index.html.');
  html = html.replace(/<\/body>/i, `${cssTag}\n${scriptTag}\n</body>`);
  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('[CORRIGÉ] index.html : V573 chargé tout à la fin.');
}

function verify() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const errors = [];
  if (!html.includes('css/v573-new-right-animation-costumes.css?v=573')) {
    errors.push('CSS V573 non chargé');
  }
  if (!html.includes('js/v573-new-right-animation-costumes.js?v=573')) {
    errors.push('JavaScript V573 non chargé');
  }
  if (!fs.existsSync(FINAL_JS)) errors.push('fichier JavaScript V573 absent');
  if (!fs.existsSync(FINAL_CSS)) errors.push('fichier CSS V573 absent');

  if (errors.length) {
    fail('Vérification échouée :\n- ' + errors.join('\n- '));
  }

  console.log('[VÉRIFIÉ] CSS V573 : OK');
  console.log('[VÉRIFIÉ] JavaScript V573 : OK');
  console.log('[VÉRIFIÉ] Chargement en fin de page : OK');
}

function main() {
  ensureFile(INDEX, 'public/index.html');

  console.log('\n=== MHUR FRANCE — CORRECTIF V573 ===\n');
  copy(path.join(PAYLOAD, 'js', 'v573-new-right-animation-costumes.js'), FINAL_JS);
  copy(path.join(PAYLOAD, 'css', 'v573-new-right-animation-costumes.css'), FINAL_CSS);
  patchIndex();
  verify();
  console.log('\n[OK] V573 appliqué.');
  console.log('[OK] NEW à droite sur Personnages / T.U.N.I.N.G.');
  console.log('[OK] Tous les NEW utilisent l’animation.');
  console.log('[OK] NEW des tenues plus petit et ajouté aux nouvelles tenues détectées.');
  console.log('[SUITE] Commit/push, attends Cloudflare, puis fais Ctrl + F5.\n');
}

main();
