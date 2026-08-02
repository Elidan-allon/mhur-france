#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SUFFIX = '.avant-v559.bak';
const SOURCE_FILES = [
  'public/index.html',
  'public/data/home_data.json',
  'public/data/home_data.js',
  'public/js/home.js',
  'public/js/season18-fixes.js',
  'mise_a_jour/outils/season18_postprocess.py'
];
const INSTALLED_FILES = [
  'public/js/v559-discounts-stable.js',
  'public/css/v559-discounts-stable.css',
  'public/assets/home/discounts/v559/d_j_board_v559.webp',
  'public/assets/home/discounts/v559/flow_runner_v559.webp',
  'public/assets/home/discounts/v559/gentle_criminal_v559.webp',
  'public/assets/home/discounts/v559/factor_fusion_v559.webp',
  'public/assets/home/discounts/v559/cluster_v559.webp',
  'public/assets/home/discounts/v559/mirko_v559.webp'
];

let restored = 0;
let removed = 0;

for (const relative of SOURCE_FILES) {
  const file = path.join(ROOT, relative);
  const backup = file + SUFFIX;
  if (!fs.existsSync(backup)) {
    console.warn(`[IGNORÉ] Sauvegarde absente : ${relative}${SUFFIX}`);
    continue;
  }
  fs.mkdirSync(path.dirname(file), { recursive:true });
  fs.copyFileSync(backup, file);
  restored += 1;
  console.log(`[RESTAURÉ] ${relative}`);
}

for (const relative of INSTALLED_FILES) {
  const file = path.join(ROOT, relative);
  const backup = file + SUFFIX;
  if (fs.existsSync(backup)) {
    fs.copyFileSync(backup, file);
    restored += 1;
    console.log(`[RESTAURÉ] ${relative}`);
  } else if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    removed += 1;
    console.log(`[SUPPRIMÉ] ${relative}`);
  }
}

const imageDir = path.join(ROOT, 'public', 'assets', 'home', 'discounts', 'v559');
try {
  if (fs.existsSync(imageDir) && fs.readdirSync(imageDir).length === 0) fs.rmdirSync(imageDir);
} catch (_error) {}

if (!restored && !removed) {
  console.error('\nAucune installation ou sauvegarde V559 n’a été trouvée.\n');
  process.exitCode = 1;
} else {
  console.log(`\nCorrectif V559 annulé (${restored} fichier(s) restauré(s), ${removed} supprimé(s)).\n`);
}
