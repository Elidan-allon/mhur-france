#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const SUFFIX = '.avant-v571.bak';
const files = [
  path.join(ROOT, 'public', 'index.html'),
  path.join(ROOT, 'public', 'js', 'season18-fixes.js'),
  path.join(ROOT, 'public', 'css', 'season18-fixes.css')
];
let restored = 0;
for (const file of files) {
  const backup = file + SUFFIX;
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, file);
    console.log('[RESTAURÉ] ' + path.relative(ROOT, file));
    restored++;
  }
}
if (!restored) {
  console.error('[ERREUR] Aucune sauvegarde V571 trouvée.');
  process.exitCode = 1;
} else {
  console.log('[OK] Le correctif V571 a été annulé.');
}
