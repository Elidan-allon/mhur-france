#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const INDEX = path.join(ROOT,'public','index.html');
const PAYLOAD = path.join(ROOT,'_v565_payload','public');
const JS_DEST = path.join(ROOT,'public','js','v565-badges-propres.js');
const CSS_DEST = path.join(ROOT,'public','css','v565-badges-propres.css');
const BACKUP = INDEX + '.avant-v565.bak';

function fail(msg){ console.error('\n[ERREUR V565] '+msg+'\n'); process.exit(1); }
function copy(src,dst){ if(!fs.existsSync(src)) fail('Fichier absent : '+src); fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.copyFileSync(src,dst); console.log('[INSTALLÉ] '+path.relative(ROOT,dst)); }

try {
  if(!fs.existsSync(INDEX)) fail('public/index.html est introuvable. Décompresse le ZIP à la racine du dépôt.');
  if(!fs.existsSync(BACKUP)){ fs.copyFileSync(INDEX,BACKUP); console.log('[SAUVEGARDE] public/index.html.avant-v565.bak'); }

  copy(path.join(PAYLOAD,'js','v565-badges-propres.js'),JS_DEST);
  copy(path.join(PAYLOAD,'css','v565-badges-propres.css'),CSS_DEST);

  let html = fs.readFileSync(INDEX,'utf8').replace(/^\uFEFF/,'');

  // Désactive complètement V563 et V564 pour éviter les doublons.
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v563-badges-new-incoming\.css[^"']*["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v563-badges-new-incoming\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n')
    .replace(/\s*<link\b[^>]*href=["'][^"']*v564-badges-refines\.css[^"']*["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v564-badges-refines\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n')
    .replace(/\s*<link\b[^>]*href=["'][^"']*v565-badges-propres\.css[^"']*["'][^>]*>\s*/gi,'\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v565-badges-propres\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');

  if(!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) fail('Balises </head> ou </body> introuvables.');
  html = html.replace(/<\/head>/i,'<link rel="stylesheet" href="css/v565-badges-propres.css?v=565">\n</head>');
  html = html.replace(/<\/body>/i,'<script src="js/v565-badges-propres.js?v=565"></script>\n</body>');
  fs.writeFileSync(INDEX,html,'utf8');

  console.log('[OK] V563 et V564 ont été désactivés.');
  console.log('[OK] Un seul système de badges reste actif.');
  console.log('[OK] La typographie légère des réductions est restaurée.');
  console.log('\nCorrectif V565 appliqué avec succès.');
} catch(error) {
  fail(error && error.message ? error.message : String(error));
}
