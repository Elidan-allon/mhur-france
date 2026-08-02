const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'public', 'index.html');
const CSS_SOURCE = path.join(ROOT, 'public', 'css', 'v561-discount-full-width.css');
const CSS_TARGET = path.join(ROOT, 'public', 'css', 'v561-discount-full-width.css');
const BACKUP = INDEX + '.avant-v561.bak';
const TAG = '<link id="mhur-v561-css" rel="stylesheet" href="css/v561-discount-full-width.css?v=561">';

function fail(message) {
  console.error('\n[ERREUR] ' + message);
  process.exitCode = 1;
}

try {
  if (!fs.existsSync(INDEX)) {
    throw new Error('public/index.html est introuvable. Décompresse le correctif à la racine du dépôt.');
  }
  if (!fs.existsSync(CSS_SOURCE)) {
    throw new Error('Le fichier CSS V561 est introuvable.');
  }

  let html = fs.readFileSync(INDEX, 'utf8');

  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(INDEX, BACKUP);
    console.log('[OK] Sauvegarde créée : public/index.html.avant-v561.bak');
  } else {
    console.log('[INFO] La sauvegarde V561 existe déjà.');
  }

  /* Nettoyage d'une ancienne installation incomplète. */
  html = html.replace(/\s*<link[^>]+(?:id=["']mhur-v561-css["']|v561-discount-full-width\.css)[^>]*>\s*/gi, '\n');

  if (!/<\/body>/i.test(html)) {
    throw new Error('Balise </body> introuvable dans public/index.html.');
  }

  /* Chargé tout à la fin pour passer après les nombreux anciens CSS. */
  html = html.replace(/<\/body>/i, `  ${TAG}\n</body>`);
  fs.writeFileSync(INDEX, html, 'utf8');

  console.log('[OK] CSS V561 ajouté tout à la fin du site.');
  console.log('[OK] Les portraits, noms, rôles et points utilisent maintenant toute la largeur.');
  console.log('\nCorrectif V561 appliqué avec succès.');
} catch (error) {
  fail(error && error.message ? error.message : String(error));
}
