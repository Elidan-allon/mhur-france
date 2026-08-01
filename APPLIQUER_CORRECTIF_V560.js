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

function fail(message) {
  console.error('\nERREUR : ' + message);
  process.exit(1);
}

const root = findProjectRoot(__dirname);
if (!root) {
  fail('public\\index.html est introuvable. Copie le contenu du correctif dans le dossier principal de mhur-france, puis relance le fichier BAT.');
}

const indexPath = path.join(root, 'public', 'index.html');
const cssPath = path.join(root, 'public', 'css', 'v560-requested-fixes.css');
const jsPath = path.join(root, 'public', 'js', 'v560-requested-fixes.js');
const backupPath = indexPath + '.avant-v560.bak';

if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath)) {
  fail('Les fichiers V560 CSS/JS ne sont pas dans public\\css et public\\js.');
}

let html = fs.readFileSync(indexPath, 'utf8');
if (!fs.existsSync(backupPath)) fs.copyFileSync(indexPath, backupPath);

html = html
  .replace(/\s*<link[^>]+v560-requested-fixes\.css[^>]*>\s*/gi, '\n')
  .replace(/\s*<script[^>]+v560-requested-fixes\.js[^>]*><\/script>\s*/gi, '\n');

const cssTag = '  <link rel="stylesheet" href="css/v560-requested-fixes.css?v=560">';
const jsTag = '  <script src="js/v560-requested-fixes.js?v=560"></script>';

if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, cssTag + '\n</head>');
else fail('Balise </head> introuvable dans public\\index.html.');

if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, jsTag + '\n</body>');
else fail('Balise </body> introuvable dans public\\index.html.');

fs.writeFileSync(indexPath, html, 'utf8');

const cssCount = (html.match(/v560-requested-fixes\.css/gi) || []).length;
const jsCount = (html.match(/v560-requested-fixes\.js/gi) || []).length;
if (cssCount !== 1 || jsCount !== 1) {
  fail('La vérification finale a trouvé un doublon V560.');
}

console.log('');
console.log('Correctif V560 installe avec succes.');
console.log('Projet : ' + root);
console.log('Sauvegarde : public\\index.html.avant-v560.bak');
console.log('');
console.log('Etape suivante : Commit to main, puis Push origin dans GitHub Desktop.');
