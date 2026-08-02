const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'public', 'index.html');
const BACKUP = INDEX + '.avant-v561.bak';

try {
  if (!fs.existsSync(BACKUP)) {
    throw new Error('La sauvegarde public/index.html.avant-v561.bak est introuvable.');
  }

  fs.copyFileSync(BACKUP, INDEX);

  const css = path.join(ROOT, 'public', 'css', 'v561-discount-full-width.css');
  if (fs.existsSync(css)) fs.unlinkSync(css);

  console.log('[OK] Le correctif V561 a été annulé.');
} catch (error) {
  console.error('[ERREUR] ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
}
