#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const INDEX = path.join(PUBLIC, 'index.html');
const VERSION = '575';
const MODE = process.argv.includes('--simulate') ? 'simulate' : 'apply';

const timestamp = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\..+$/, '')
  .replace('T', '_');

const ARCHIVE = path.join(ROOT, `_archive_nettoyage_v575_${timestamp}`);
const MANIFEST = path.join(ROOT, '_dernier_nettoyage_v575.json');

const CORE_FILES = [
  'public/index.html',
  'public/js/season18-fixes.js',
  'public/js/season18-v12.js',
  'public/data/season18_sync.js'
];

const ROOT_CLUTTER_RE = /^(?:_v\d+_payload|correctif_v\d+|APPLIQUER_CORRECTIF_V\d+.*|ANNULER_CORRECTIF_V\d+.*|DIAGNOSTIC.*|LANCER_DIAGNOSTIC.*|RAPPORT_DIAGNOSTIC.*|README_V\d+.*|LISEZ-MOI(?:_V\d+)?\.(?:txt|md))$/i;
const PUBLIC_BACKUP_RE = /(?:\.bak$|\.avant-v\d+\.bak$|\.avant-nettoyage-v\d+\.bak$)/i;
const EXPERIMENTAL_PUBLIC_RE = /^v(?:55[8-9]|56\d|57[0-4])[-_].*\.(?:js|css)$/i;

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function existsFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

function ensureCore() {
  for (const relative of CORE_FILES) {
    const file = path.join(ROOT, relative);
    if (!existsFile(file)) {
      throw new Error(`Fichier essentiel introuvable : ${relative}`);
    }
  }
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function localRuntimeReferences(html) {
  const refs = [];
  const re = /<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const value = match[1];
    if (/^(?:https?:)?\/\//i.test(value) || /^data:/i.test(value)) continue;
    const clean = value.split('?')[0].split('#')[0].replace(/^\/+/, '');
    refs.push(clean);
  }
  return refs;
}

function validateRuntime(html) {
  const missing = [];
  for (const reference of localRuntimeReferences(html)) {
    const target = path.join(PUBLIC, reference);
    if (!existsFile(target)) missing.push(reference);
  }
  return Array.from(new Set(missing));
}

function cleanIndex(source) {
  if (/^(?:<<<<<<<|=======|>>>>>>>)/m.test(source)) {
    throw new Error('Conflit Git détecté dans public/index.html. Nettoyage annulé pour éviter de casser le site.');
  }

  let html = source.replace(/^\uFEFF/, '');

  // Supprime uniquement les balises strictement identiques répétées.
  const seenTags = new Set();
  html = html.replace(
    /<(?:link\b[^>]*rel=["']stylesheet["'][^>]*|script\b[^>]*src=["'][^"']+["'][^>]*><\/script)>/gi,
    tag => {
      const normalized = tag.replace(/\s+/g, ' ').trim();
      if (seenTags.has(normalized)) return '';
      seenTags.add(normalized);
      return tag;
    }
  );

  // Les dizaines de commentaires de compatibilité répétés n'ont aucun effet.
  const seenCompatibilityComments = new Set();
  html = html.replace(
    /<!--\s*(Season 18[^>]*compatibility layer\.)\s*-->/gi,
    (full, label) => {
      const key = label.replace(/\s+/g, ' ').trim().toLowerCase();
      if (seenCompatibilityComments.has(key)) return '';
      seenCompatibilityComments.add(key);
      return `<!-- ${label.replace(/\s+/g, ' ').trim()} -->`;
    }
  );

  // Nettoyage purement visuel du HTML : pas plus de deux lignes vides.
  html = html.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
  if (!html.endsWith('\n')) html += '\n';
  return html;
}

function collectOtherTextReferences() {
  const files = walk(PUBLIC).filter(file => /\.(?:html|js|css|json)$/i.test(file));
  const contents = new Map();
  for (const file of files) {
    try {
      contents.set(file, fs.readFileSync(file, 'utf8'));
    } catch (_) {}
  }
  return contents;
}

function isReferencedByAnotherFile(candidate, contents) {
  const basename = path.basename(candidate);
  for (const [file, content] of contents.entries()) {
    if (file === candidate) continue;
    if (content.includes(basename)) return true;
  }
  return false;
}

function moveWithManifest(source, destination, manifest) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
  manifest.moves.push({ from: rel(source), to: rel(destination) });
}

function rollback(manifest) {
  try {
    if (manifest.indexBackup && existsFile(path.join(ROOT, manifest.indexBackup))) {
      fs.copyFileSync(path.join(ROOT, manifest.indexBackup), INDEX);
    }

    for (const move of [...manifest.moves].reverse()) {
      const from = path.join(ROOT, move.from);
      const to = path.join(ROOT, move.to);
      if (fs.existsSync(to) && !fs.existsSync(from)) {
        fs.mkdirSync(path.dirname(from), { recursive: true });
        fs.renameSync(to, from);
      }
    }
  } catch (error) {
    console.error('[ATTENTION] Le retour automatique a rencontré une erreur : ' + error.message);
  }
}

function rootCandidates() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(entry => {
      if (entry.name === path.basename(ARCHIVE)) return false;
      if (entry.name === path.basename(MANIFEST)) return false;
      if (entry.name === 'NETTOYER_SITE_V575.js') return false;
      if (entry.name === 'APPLIQUER_NETTOYAGE_V575.bat') return false;
      if (entry.name === 'SIMULER_NETTOYAGE_V575.bat') return false;
      if (entry.name === 'ANNULER_NETTOYAGE_V575.js') return false;
      if (entry.name === 'ANNULER_NETTOYAGE_V575.bat') return false;
      if (entry.name === 'LISEZ-MOI_NETTOYAGE_V575.txt') return false;
      return ROOT_CLUTTER_RE.test(entry.name);
    })
    .map(entry => path.join(ROOT, entry.name));
}

function publicCandidates(contents) {
  const candidates = [];

  for (const file of walk(PUBLIC)) {
    const name = path.basename(file);

    if (PUBLIC_BACKUP_RE.test(name)) {
      candidates.push({ file, reason: 'sauvegarde ancienne' });
      continue;
    }

    if (
      (path.dirname(file) === path.join(PUBLIC, 'js') ||
       path.dirname(file) === path.join(PUBLIC, 'css')) &&
      EXPERIMENTAL_PUBLIC_RE.test(name) &&
      !isReferencedByAnotherFile(file, contents)
    ) {
      candidates.push({ file, reason: 'correctif expérimental non référencé' });
    }
  }

  return candidates;
}

function printPlan(rootItems, publicItems, indexChanged, beforeSize, afterSize) {
  console.log('\n=== PLAN DE NETTOYAGE V575 ===\n');
  console.log(`[INDEX] ${indexChanged ? 'doublons/commentaires répétitifs à nettoyer' : 'aucun changement nécessaire'}`);
  if (indexChanged) {
    console.log(`[INDEX] ${beforeSize} octets -> ${afterSize} octets`);
  }

  console.log(`\n[RACINE] ${rootItems.length} anciens fichiers/dossiers à archiver`);
  rootItems.slice(0, 20).forEach(file => console.log(' - ' + rel(file)));
  if (rootItems.length > 20) console.log(` - ... et ${rootItems.length - 20} autres`);

  console.log(`\n[PUBLIC] ${publicItems.length} fichiers sans référence à archiver`);
  publicItems.slice(0, 20).forEach(item => console.log(` - ${rel(item.file)} (${item.reason})`));
  if (publicItems.length > 20) console.log(` - ... et ${publicItems.length - 20} autres`);
}

function main() {
  ensureCore();

  const originalIndex = fs.readFileSync(INDEX, 'utf8');
  const cleanedIndex = cleanIndex(originalIndex);
  const missingBefore = validateRuntime(originalIndex);

  if (missingBefore.length) {
    throw new Error(
      'Le site référence déjà des fichiers absents. Nettoyage annulé.\n- ' +
      missingBefore.join('\n- ')
    );
  }

  const contents = collectOtherTextReferences();
  const rootItems = rootCandidates();
  const publicItems = publicCandidates(contents);
  const indexChanged = cleanedIndex !== originalIndex;

  printPlan(
    rootItems,
    publicItems,
    indexChanged,
    Buffer.byteLength(originalIndex),
    Buffer.byteLength(cleanedIndex)
  );

  if (MODE === 'simulate') {
    console.log('\n[SIMULATION] Rien n’a été déplacé ou modifié.');
    console.log('[SUITE] Lance APPLIQUER_NETTOYAGE_V575.bat pour appliquer ce plan.\n');
    return;
  }

  fs.mkdirSync(ARCHIVE, { recursive: true });

  const manifest = {
    version: VERSION,
    createdAt: new Date().toISOString(),
    archive: rel(ARCHIVE),
    indexBackup: rel(path.join(ARCHIVE, 'public', 'index.html.avant-nettoyage-v575.bak')),
    moves: [],
    indexChanged
  };

  try {
    const indexBackup = path.join(ROOT, manifest.indexBackup);
    fs.mkdirSync(path.dirname(indexBackup), { recursive: true });
    fs.copyFileSync(INDEX, indexBackup);

    if (indexChanged) {
      fs.writeFileSync(INDEX, cleanedIndex, 'utf8');
      console.log('\n[OK] public/index.html nettoyé sans modifier les fichiers chargés.');
    }

    for (const source of rootItems) {
      const destination = path.join(ARCHIVE, 'racine', path.basename(source));
      moveWithManifest(source, destination, manifest);
    }

    for (const item of publicItems) {
      const relativePublic = path.relative(PUBLIC, item.file);
      const destination = path.join(ARCHIVE, 'public', relativePublic);
      moveWithManifest(item.file, destination, manifest);
    }

    const finalIndex = fs.readFileSync(INDEX, 'utf8');
    const missingAfter = validateRuntime(finalIndex);

    ensureCore();

    if (missingAfter.length) {
      throw new Error(
        'Des fichiers chargés seraient absents après nettoyage.\n- ' +
        missingAfter.join('\n- ')
      );
    }

    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');

    const report = [
      'MHUR FRANCE — RAPPORT NETTOYAGE V575',
      '',
      `Date : ${new Date().toLocaleString('fr-FR')}`,
      `Archive : ${manifest.archive}`,
      `Index nettoyé : ${indexChanged ? 'oui' : 'non'}`,
      `Éléments déplacés : ${manifest.moves.length}`,
      '',
      'Vérifications :',
      '- fichiers essentiels présents : OK',
      '- fichiers JS/CSS chargés par index.html présents : OK',
      '- aucun conflit Git dans index.html : OK',
      '- aucun fichier supprimé définitivement : OK',
      '',
      'Pour annuler : lancer ANNULER_NETTOYAGE_V575.bat'
    ].join('\n');

    fs.writeFileSync(path.join(ROOT, 'RAPPORT_NETTOYAGE_V575.txt'), report, 'utf8');

    console.log(`\n[OK] ${manifest.moves.length} éléments déplacés dans ${manifest.archive}.`);
    console.log('[OK] Aucun fichier n’a été supprimé définitivement.');
    console.log('[OK] Vérification des fichiers chargés réussie.');
    console.log('[OK] Rapport créé : RAPPORT_NETTOYAGE_V575.txt\n');
  } catch (error) {
    rollback(manifest);
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error('\n[ERREUR] ' + (error && error.message ? error.message : String(error)));
  console.error('[SÉCURITÉ] Le nettoyage a été annulé ou restauré automatiquement.\n');
  process.exitCode = 1;
}
