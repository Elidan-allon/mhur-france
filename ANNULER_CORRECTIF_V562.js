const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'public', 'index.html');
const BACKUP = INDEX + '.avant-v562.bak';
const CSS = path.join(ROOT, 'public', 'css', 'v562-discount-typography.css');

try {
  if (!fs.existsSync(BACKUP)) {
    throw new Error('La sauvegarde public/index.html.avant-v562.bak est introuvable.');
  }

  fs.copyFileSync(BACKUP, INDEX);
  if (fs.existsSync(CSS)) fs.unlinkSync(CSS);

  console.log('[OK] Le correctif V562 a été annulé.');
} catch (error) {
  console.error('[ERREUR] ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
}
