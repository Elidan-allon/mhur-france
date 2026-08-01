const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, '.mhur-v561-backup');
const RESTORE = [
  'public/index.html',
  'public/js/season18-fixes.js',
  'public/js/v559-stable-ui-fixes.js',
  'public/js/community-builds.js',
  'public/js/community-mods.js'
];

function restore(relative) {
  const source = path.join(BACKUP, relative);
  const target = path.join(ROOT, relative);
  if (!fs.existsSync(source)) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

if (!fs.existsSync(BACKUP)) {
  console.error('\nERREUR: aucune sauvegarde V561 trouvee dans .mhur-v561-backup');
  process.exit(1);
}

let restored = 0;
RESTORE.forEach(file => { if (restore(file)) restored += 1; });
[
  'public/js/v561-github-final-fixes.js',
  'public/css/v561-github-final-fixes.css'
].forEach(relative => {
  const file = path.join(ROOT, relative);
  if (fs.existsSync(file)) fs.rmSync(file, { force: true });
});

fs.rmSync(BACKUP, { recursive: true, force: true });
console.log(`\nCorrectif V561 annule. ${restored} fichier(s) restaure(s).`);
