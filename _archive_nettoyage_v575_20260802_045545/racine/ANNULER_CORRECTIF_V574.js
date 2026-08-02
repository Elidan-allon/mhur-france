#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const FILE = path.join(ROOT, 'public', 'js', 'season18-fixes.js');
const BACKUP = FILE + '.avant-v574.bak';

try {
  if (!fs.existsSync(BACKUP)) {
    throw new Error('La sauvegarde season18-fixes.js.avant-v574.bak est introuvable.');
  }
  fs.copyFileSync(BACKUP, FILE);
  console.log('[OK] Le correctif V574 a été annulé.');
} catch (error) {
  console.error('[ERREUR] ' + error.message);
  process.exitCode = 1;
}
