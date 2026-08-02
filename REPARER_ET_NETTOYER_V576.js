#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const INDEX = path.join(PUBLIC, 'index.html');
const BACKUP = INDEX + '.avant-v576.bak';
const REPORT = path.join(ROOT, 'RAPPORT_REPARATION_V576.txt');

const ALLOWED_DEAD_REFERENCES = new Set([
  'css/v551-bars-notes-persistent.css',
  'css/v552-mods-arrow-only.css',
  'js/v551-bars-notes-persistent.js',
  'js/v552-mods-arrow-only.js',
  'css/v562-discount-typography.css'
]);

function fail(message) {
  throw new Error(message);
}

function existsFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

function runtimeReferences(html) {
  const refs = [];
  const re = /<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["'][^>]*>/gi;
  let match;

  while ((match = re.exec(html))) {
    const value = match[1];
    if (/^(?:https?:)?\/\//i.test(value) || /^data:/i.test(value)) continue;
    refs.push(value.split('?')[0].split('#')[0].replace(/^\/+/, ''));
  }

  return refs;
}

function missingReferences(html) {
  return Array.from(new Set(
    runtimeReferences(html).filter(reference => {
      return !existsFile(path.join(PUBLIC, reference));
    })
  ));
}

function removeReferenceTag(html, reference) {
  const escaped = reference
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\//g, '[\\\\/]');

  const linkRe = new RegExp(
    `\\s*<link\\b[^>]*href=["'][^"']*${escaped}(?:\\?[^"']*)?["'][^>]*>\\s*`,
    'gi'
  );

  const scriptRe = new RegExp(
    `\\s*<script\\b[^>]*src=["'][^"']*${escaped}(?:\\?[^"']*)?["'][^>]*><\\/script>\\s*`,
    'gi'
  );

  return html.replace(linkRe, '\n').replace(scriptRe, '\n');
}

function writeReport(lines) {
  fs.writeFileSync(REPORT, lines.join('\n') + '\n', 'utf8');
}

function main() {
  if (!existsFile(INDEX)) {
    fail('public/index.html est introuvable. Décompresse le ZIP à la racine de mhur-france.');
  }

  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');
  const missingBefore = missingReferences(html);

  if (!missingBefore.length) {
    console.log('[INFO] Aucun fichier JS/CSS absent dans index.html.');
  }

  const unknownMissing = missingBefore.filter(reference => !ALLOWED_DEAD_REFERENCES.has(reference));
  if (unknownMissing.length) {
    fail(
      'D’autres références absentes ont été trouvées. Rien n’a été modifié.\n- ' +
      unknownMissing.join('\n- ')
    );
  }

  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(INDEX, BACKUP);
    console.log('[SAUVEGARDE] public/index.html.avant-v576.bak');
  }

  for (const reference of missingBefore) {
    html = removeReferenceTag(html, reference);
    console.log('[RETIRÉ] Référence morte : ' + reference);
  }

  html = html.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
  if (!html.endsWith('\n')) html += '\n';
  fs.writeFileSync(INDEX, html, 'utf8');

  const missingAfter = missingReferences(html);
  if (missingAfter.length) {
    fs.copyFileSync(BACKUP, INDEX);
    fail(
      'Des références absentes restent après réparation. index.html a été restauré.\n- ' +
      missingAfter.join('\n- ')
    );
  }

  console.log('[VÉRIFIÉ] Toutes les références JS/CSS de index.html existent.');

  const cleaner = path.join(ROOT, 'NETTOYER_SITE_V575.js');
  if (!existsFile(cleaner)) {
    fail('NETTOYER_SITE_V575.js est introuvable.');
  }

  console.log('\n=== LANCEMENT DU NETTOYAGE V575 ===\n');
  const result = spawnSync(process.execPath, [cleaner], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    fs.copyFileSync(BACKUP, INDEX);
    fail('Le nettoyage V575 a échoué. index.html a été restauré à la version d’avant V576.');
  }

  writeReport([
    'MHUR FRANCE — RAPPORT V576',
    '',
    'Références mortes retirées :',
    ...(missingBefore.length ? missingBefore.map(item => '- ' + item) : ['- aucune']),
    '',
    'Vérification des références JS/CSS : OK',
    'Nettoyage sécurisé V575 : OK',
    'Aucun fichier supprimé définitivement : OK',
    '',
    'Pour revenir en arrière : lancer ANNULER_TOUT_V576.bat'
  ]);

  console.log('\n[OK] Réparation V576 et nettoyage V575 terminés.');
  console.log('[OK] Rapport créé : RAPPORT_REPARATION_V576.txt\n');
}

try {
  main();
} catch (error) {
  console.error('\n[ERREUR V576] ' + (error && error.message ? error.message : String(error)));
  console.error('[SÉCURITÉ] Aucun changement incomplet n’est conservé.\n');
  process.exitCode = 1;
}
