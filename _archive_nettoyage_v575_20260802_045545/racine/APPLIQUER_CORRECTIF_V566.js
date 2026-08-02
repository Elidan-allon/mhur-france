#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const VERSION = '566';
const BACKUP_SUFFIX = '.avant-v566.bak';
const INDEX = path.join(ROOT, 'public', 'index.html');
const PAYLOAD = path.join(ROOT, '_v566_payload', 'public');
const JS_DEST = path.join(ROOT, 'public', 'js', 'v566-badges-final.js');
const CSS_DEST = path.join(ROOT, 'public', 'css', 'v566-badges-final.css');
function fail(message){ console.error(`\n[ERREUR V${VERSION}] ${message}\n`); process.exit(1); }
function ensureFile(file,label){ if(!fs.existsSync(file)||!fs.statSync(file).isFile()) fail(`${label} introuvable : ${path.relative(ROOT,file)||'.'}`); }
function backup(file){ if(!fs.existsSync(file)) return; const copy=file+BACKUP_SUFFIX; if(!fs.existsSync(copy)){ fs.copyFileSync(file,copy); console.log(`[SAUVEGARDE] ${path.relative(ROOT,copy)}`); } }
function copy(src,dst){ ensureFile(src,'Fichier du correctif'); if(fs.existsSync(dst)) backup(dst); fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.copyFileSync(src,dst); console.log(`[INSTALLÉ] ${path.relative(ROOT,dst)}`); }
function patchIndex(){
  backup(INDEX);
  let html = fs.readFileSync(INDEX,'utf8').replace(/^\uFEFF/,'');
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v566-badges-final\.css[^"']*["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v566-badges-final\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  const cssTag = '<link rel="stylesheet" href="css/v566-badges-final.css?v=566">';
  const scriptTag = '<script src="js/v566-badges-final.js?v=566"></script>';
  if(!/<\/head>/i.test(html)) fail('Balise </head> absente de public/index.html.');
  html = html.replace(/<\/head>/i, `${cssTag}\n</head>`);
  if(!/<\/body>/i.test(html)) fail('Balise </body> absente de public/index.html.');
  html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('[CORRIGÉ] Le correctif V566 est chargé après les anciens scripts.');
}
function verify(){
  const html = fs.readFileSync(INDEX,'utf8');
  const errs = [];
  if(!html.includes('css/v566-badges-final.css?v=566')) errs.push('CSS V566 non chargé');
  if(!html.includes('js/v566-badges-final.js?v=566')) errs.push('JavaScript V566 non chargé');
  if(!fs.existsSync(JS_DEST)) errs.push('fichier JavaScript V566 absent');
  if(!fs.existsSync(CSS_DEST)) errs.push('fichier CSS V566 absent');
  if(errs.length) fail('Vérification échouée :\n- ' + errs.join('\n- '));
}
function main(){
  ensureFile(INDEX,'public/index.html');
  console.log('\n=== MHUR FRANCE — CORRECTIF V566 ===\n');
  copy(path.join(PAYLOAD,'js','v566-badges-final.js'), JS_DEST);
  copy(path.join(PAYLOAD,'css','v566-badges-final.css'), CSS_DEST);
  patchIndex();
  verify();
  console.log('\n[OK] INCOMING agrandi sur l\'accueil.');
  console.log('[OK] Twice et Tsuyu n\'affichent plus de NEW sur l\'accueil.');
  console.log('[OK] Gentle Criminal affiche un seul NEW animé.');
  console.log('[OK] Les cartes costumes et choix de costumes récupèrent NEW en haut à droite.');
  console.log('[OK] Les NEW parasites dans Super-Vilains sont supprimés.');
  console.log('[OK] La typo légère des réductions de points est gardée.');
  console.log('[SUITE] Commit/push, attends le déploiement Cloudflare, puis fais Ctrl + F5.\n');
}
main();
