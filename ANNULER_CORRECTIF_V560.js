const fs = require('fs');
const path = require('path');

function findProjectRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(current, 'public', 'index.html'))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

const root = findProjectRoot(__dirname);
if (!root) {
  console.error('ERREUR : public\\index.html est introuvable.');
  process.exit(1);
}

const indexPath = path.join(root, 'public', 'index.html');
const backupPath = indexPath + '.avant-v560.bak';

if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, indexPath);
  console.log('Le fichier index.html a ete restaure.');
} else {
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html
    .replace(/\s*<link[^>]+v560-requested-fixes\.css[^>]*>\s*/gi, '\n')
    .replace(/\s*<script[^>]+v560-requested-fixes\.js[^>]*><\/script>\s*/gi, '\n');
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Les references V560 ont ete retirees.');
}
