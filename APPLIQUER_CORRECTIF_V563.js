#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const VERSION = '563';
const BACKUP_SUFFIX = '.avant-v563.bak';
const INDEX = path.join(ROOT, 'public', 'index.html');
const PAYLOAD = path.join(ROOT, '_v563_payload', 'public');
const JS_DEST = path.join(ROOT, 'public', 'js', 'v563-badges-new-incoming.js');
const CSS_DEST = path.join(ROOT, 'public', 'css', 'v563-badges-new-incoming.css');

function fail(message){ console.error(`\n[ERREUR V${VERSION}] ${message}\n`); process.exit(1); }
function ensureFile(file,label){ if(!fs.existsSync(file)||!fs.statSync(file).isFile()) fail(`${label} introuvable : ${path.relative(ROOT,file)||'.'}`); }
function backup(file){ if(!fs.existsSync(file)) return; const copy=file+BACKUP_SUFFIX; if(!fs.existsSync(copy)){ fs.copyFileSync(file,copy); console.log(`[SAUVEGARDE] ${path.relative(ROOT,copy)}`);} }
function copy(src,dst){ ensureFile(src,'Fichier du correctif'); if(fs.existsSync(dst)) backup(dst); fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.copyFileSync(src,dst); console.log(`[INSTALLÉ] ${path.relative(ROOT,dst)}`); }
function patchIndex(){
  backup(INDEX);
  let html=fs.readFileSync(INDEX,'utf8').replace(/^\uFEFF/,'');
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v563-badges-new-incoming\.css[^"']*["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v563-badges-new-incoming\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
  const cssTag = '<link rel="stylesheet" href="css/v563-badges-new-incoming.css?v=563">';
  const scriptTag = '<script src="js/v563-badges-new-incoming.js?v=563"></script>';
  if(!/<\/head>/i.test(html)) fail('Balise </head> absente de public/index.html.');
  html = html.replace(/<\/head>/i, `${cssTag}\n</head>`);
  if(!/<\/body>/i.test(html)) fail('Balise </body> absente de public/index.html.');
  html = html.replace(/<\/body>/i, `${scriptTag}\n</body>`);
  fs.writeFileSync(INDEX,html,'utf8');
  console.log('[CORRIGÉ] Le correctif V563 est chargé après les anciens scripts.');
}
function verify(){ const html = fs.readFileSync(INDEX,'utf8'); const errs=[]; if(!html.includes('css/v563-badges-new-incoming.css?v=563')) errs.push('CSS V563 non chargé'); if(!html.includes('js/v563-badges-new-incoming.js?v=563')) errs.push('JavaScript V563 non chargé'); if(!fs.existsSync(JS_DEST)) errs.push('fichier JavaScript V563 absent'); if(!fs.existsSync(CSS_DEST)) errs.push('fichier CSS V563 absent'); if(errs.length) fail('Vérification échouée :\n- '+errs.join('\n- ')); }
function main(){ ensureFile(INDEX,'public/index.html'); console.log('\n=== MHUR FRANCE — CORRECTIF V563 ===\n'); copy(path.join(PAYLOAD,'js','v563-badges-new-incoming.js'),JS_DEST); copy(path.join(PAYLOAD,'css','v563-badges-new-incoming.css'),CSS_DEST); patchIndex(); verify(); console.log('\n[OK] Badges NEW / INCOMING animés installés.'); console.log('[OK] Gentle Criminal reçoit NEW partout.'); console.log('[OK] Les NEW des costumes passent sous les étoiles à droite.'); console.log('[SUITE] Commit/push, attends le déploiement Cloudflare, puis fais Ctrl + F5.\n'); }
main();
