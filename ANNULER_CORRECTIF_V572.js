#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const SUFFIX = '.avant-v572.bak';

const files = [
  path.join(ROOT, 'public', 'index.html'),
  path.join(ROOT, 'public', 'js', 'season18-fixes.js'),
  path.join(ROOT, 'public', 'data', 'season18_sync.js')
];

try {
  let restored = 0;
  for (const file of files) {
    const backup = file + SUFFIX;
    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, file);
      restored += 1;
      console.log('[RESTAURÉ] ' + path.relative(ROOT, file));
    }
  }

  for (const file of [
    path.join(ROOT, 'public', 'js', 'v572-source-new-gentle-costumes.js'),
    path.join(ROOT, 'public', 'css', 'v572-source-new-gentle-costumes.css')
  ]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  if (!restored) throw new Error('Aucune sauvegarde V572 trouvée.');
  console.log('[OK] Le correctif V572 a été annulé.');
} catch (error) {
  console.error('[ERREUR] ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
}
