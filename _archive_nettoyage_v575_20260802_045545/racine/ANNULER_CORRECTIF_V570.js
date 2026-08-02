#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const SUFFIX = '.avant-v570.bak';
const files = [
  path.join(ROOT, 'public', 'index.html'),
  path.join(ROOT, 'public', 'js', 'season18-early.js'),
  path.join(ROOT, 'public', 'js', 'season18-fixes.js'),
  path.join(ROOT, 'public', 'css', 'season18-fixes.css')
];

let failed = false;
for (const file of files) {
  const backup = file + SUFFIX;
  if (!fs.existsSync(backup)) {
    console.error('[ERREUR] Sauvegarde introuvable : ' + path.relative(ROOT, backup));
    failed = true;
    continue;
  }
  fs.copyFileSync(backup, file);
  console.log('[RESTAURÉ] ' + path.relative(ROOT, file));
}

if (failed) process.exitCode = 1;
else console.log('\n[OK] Le correctif V570 a été annulé.');
