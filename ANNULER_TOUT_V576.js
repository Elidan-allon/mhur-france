#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'public', 'index.html');
const V576_BACKUP = INDEX + '.avant-v576.bak';
const V575_UNDO = path.join(ROOT, 'ANNULER_NETTOYAGE_V575.js');

try {
  if (fs.existsSync(path.join(ROOT, '_dernier_nettoyage_v575.json')) && fs.existsSync(V575_UNDO)) {
    const result = spawnSync(process.execPath, [V575_UNDO], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) {
      throw new Error('Impossible d’annuler le nettoyage V575.');
    }
  }

  if (!fs.existsSync(V576_BACKUP)) {
    throw new Error('La sauvegarde public/index.html.avant-v576.bak est introuvable.');
  }

  fs.copyFileSync(V576_BACKUP, INDEX);
  console.log('[RESTAURÉ] public/index.html avant V576.');
  console.log('[OK] Réparation et nettoyage V576 annulés.');
} catch (error) {
  console.error('[ERREUR] ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
}
