'use strict';
const fs = require('fs');
const path = require('path');

const root = __dirname;
const indexPath = path.join(root, 'public', 'index.html');
const backupPath = path.join(root, 'public', 'index.html.avant-v559-stable.bak');

if (!fs.existsSync(backupPath)) {
  console.error('ERREUR : sauvegarde V559 introuvable.');
  process.exit(1);
}

fs.copyFileSync(backupPath, indexPath);
console.log('Le fichier public/index.html a été restauré avant V559.');
