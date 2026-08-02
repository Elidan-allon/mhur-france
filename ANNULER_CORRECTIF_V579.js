#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SUFFIX = '.avant-v579.bak';
const files = [
  path.join(ROOT, 'public', 'index.html'),
  path.join(ROOT, 'public', 'js', 'season18-fixes.js'),
  path.join(ROOT, 'public', 'css', 'season18-fixes.css'),
  path.join(ROOT, 'public', 'data', 'season18_sync.js')
];

try {
  let restored = 0;

  for (const file of files) {
    const copy = file + SUFFIX;
    if (!fs.existsSync(copy)) continue;
    fs.copyFileSync(copy, file);
    restored += 1;
    console.log('[RESTAURÉ] ' + path.relative(ROOT, file));
  }

  if (!restored) {
    throw new Error('Aucune sauvegarde V579 trouvée.');
  }

  console.log('[OK] Le correctif V579 a été annulé.');
} catch (error) {
  console.error('[ERREUR] ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
}
