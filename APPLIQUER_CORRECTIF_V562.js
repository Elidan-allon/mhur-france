const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'public', 'index.html');
const BACKUP = INDEX + '.avant-v562.bak';
const TAG = '<link id="mhur-v562-css" rel="stylesheet" href="css/v562-discount-typography.css?v=562">';

function stop(message) {
  console.error('\n[ERREUR] ' + message);
  process.exitCode = 1;
}

try {
  if (!fs.existsSync(INDEX)) {
    throw new Error('public/index.html est introuvable. Décompresse le ZIP à la racine du dépôt mhur-france.');
  }

  const cssFile = path.join(ROOT, 'public', 'css', 'v562-discount-typography.css');
  if (!fs.existsSync(cssFile)) {
    throw new Error('public/css/v562-discount-typography.css est introuvable.');
  }

  let html = fs.readFileSync(INDEX, 'utf8');

  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(INDEX, BACKUP);
    console.log('[OK] Sauvegarde créée : public/index.html.avant-v562.bak');
  } else {
    console.log('[INFO] La sauvegarde V562 existe déjà.');
  }

  html = html.replace(
    /\s*<link[^>]+(?:id=["']mhur-v562-css["']|v562-discount-typography\.css)[^>]*>\s*/gi,
    '\n'
  );

  if (!/<\/body>/i.test(html)) {
    throw new Error('La balise </body> est introuvable dans public/index.html.');
  }

  html = html.replace(/<\/body>/i, `  ${TAG}\n</body>`);
  fs.writeFileSync(INDEX, html, 'utf8');

  console.log('[OK] Typographie V562 chargée après les anciens styles.');
  console.log('[OK] Noms, rôles et points sont maintenant moins gras.');
  console.log('\nCorrectif V562 appliqué avec succès.');
} catch (error) {
  stop(error && error.message ? error.message : String(error));
}
