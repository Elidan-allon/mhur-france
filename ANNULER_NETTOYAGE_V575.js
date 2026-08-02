#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MANIFEST_FILE = path.join(ROOT, '_dernier_nettoyage_v575.json');

function fail(message) {
  console.error('\n[ERREUR] ' + message + '\n');
  process.exit(1);
}

if (!fs.existsSync(MANIFEST_FILE)) {
  fail('Le manifeste _dernier_nettoyage_v575.json est introuvable.');
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));

try {
  const backup = path.join(ROOT, manifest.indexBackup);
  const index = path.join(ROOT, 'public', 'index.html');

  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, index);
    console.log('[RESTAURÉ] public/index.html');
  }

  for (const move of [...manifest.moves].reverse()) {
    const original = path.join(ROOT, move.from);
    const archived = path.join(ROOT, move.to);

    if (!fs.existsSync(archived)) continue;

    if (fs.existsSync(original)) {
      console.log('[IGNORÉ] Existe déjà : ' + move.from);
      continue;
    }

    fs.mkdirSync(path.dirname(original), { recursive: true });
    fs.renameSync(archived, original);
    console.log('[RESTAURÉ] ' + move.from);
  }

  console.log('\n[OK] Nettoyage V575 annulé.');
} catch (error) {
  fail(error.message);
}
