#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const INDEX = path.join(ROOT,'public','index.html');
const BACKUP = INDEX + '.avant-v565.bak';
try {
  if(!fs.existsSync(BACKUP)) throw new Error('La sauvegarde public/index.html.avant-v565.bak est introuvable.');
  fs.copyFileSync(BACKUP,INDEX);
  ['public/js/v565-badges-propres.js','public/css/v565-badges-propres.css'].forEach(rel => {
    const f = path.join(ROOT,rel); if(fs.existsSync(f)) fs.unlinkSync(f);
  });
  console.log('[OK] Le correctif V565 a été annulé.');
} catch(error) {
  console.error('[ERREUR] '+(error && error.message ? error.message : String(error)));
  process.exitCode=1;
}
