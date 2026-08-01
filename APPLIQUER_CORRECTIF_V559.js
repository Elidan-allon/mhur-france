'use strict';
const fs = require('fs');
const path = require('path');

const root = __dirname;
const indexPath = path.join(root, 'public', 'index.html');
const backupPath = path.join(root, 'public', 'index.html.avant-v559-stable.bak');

if (!fs.existsSync(indexPath)) {
  console.error('ERREUR : public/index.html est introuvable.');
  console.error('Place les fichiers du correctif à la racine du projet mhur-france.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');
if (!fs.existsSync(backupPath)) fs.copyFileSync(indexPath, backupPath);

const obsoleteFragments = [
  'css/v556-global-new-repair.css',
  'css/v557-quirk-tables-order-translation.css',
  'css/v558-requested-fixes.css',
  'js/v36-live-site-update.js',
  'js/v556-global-new-repair.js',
  'js/v557-quirk-tables-order-translation.js',
  'js/v558-requested-fixes.js',
  'css/v559-stable-ui-fixes.css',
  'js/v559-stable-ui-fixes.js'
];

const lines = html.split(/\r?\n/).filter(line => !obsoleteFragments.some(fragment => line.includes(fragment)));
html = lines.join('\n');
html = html.replace(/\n?<!-- V559: scripts conflictuels désactivés[^>]*-->\n?/gi, '\n');

const marker = '<!-- V559: scripts conflictuels désactivés (auto-reload v36, boucles v556/v557 et ancien v558). -->';
const css = '  <link rel="stylesheet" href="css/v559-stable-ui-fixes.css?v=559">';
const js = '  <script src="js/v559-stable-ui-fixes.js?v=559"></script>';

if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) {
  console.error('ERREUR : structure HTML invalide (head/body introuvables).');
  process.exit(1);
}

html = html.replace(/<\/head>/i, `${marker}\n${css}\n</head>`);
html = html.replace(/<\/body>/i, `${js}\n</body>`);
fs.writeFileSync(indexPath, html.replace(/\n{3,}/g, '\n\n'), 'utf8');

console.log('Correctif V559 appliqué.');
console.log('- auto-refresh v36 désactivé');
console.log('- anciens correctifs conflictuels v556/v557/v558 désactivés');
console.log('- V559 ajouté une seule fois');
console.log(`Sauvegarde : ${path.relative(root, backupPath)}`);
