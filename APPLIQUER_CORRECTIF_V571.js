#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const VERSION = '571';
const SUFFIX = '.avant-v571.bak';
const INDEX = path.join(ROOT, 'public', 'index.html');
const FIXES = path.join(ROOT, 'public', 'js', 'season18-fixes.js');
const CSS = path.join(ROOT, 'public', 'css', 'season18-fixes.css');

function relative(file) {
  return path.relative(ROOT, file) || '.';
}

function fail(message) {
  console.error(`\n[ERREUR V${VERSION}] ${message}\n`);
  process.exit(1);
}

function ensureFile(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`Fichier introuvable : ${relative(file)}. Décompresse le ZIP à la racine de mhur-france.`);
  }
}

function backup(file) {
  const target = file + SUFFIX;
  if (!fs.existsSync(target)) {
    fs.copyFileSync(file, target);
    console.log(`[SAUVEGARDE] ${relative(target)}`);
  }
}

function replaceRequired(source, regex, replacement, label, alreadyMarker) {
  if (alreadyMarker && source.includes(alreadyMarker)) return source;
  const next = source.replace(regex, replacement);
  if (next === source) fail(`Impossible de corriger ${label}. Le fichier a peut-être changé.`);
  console.log(`[PATCH] ${label}`);
  return next;
}

function patchFixes() {
  backup(FIXES);
  let js = fs.readFileSync(FIXES, 'utf8').replace(/^\uFEFF/, '');

  /* 1) Tous les costumes de la date la plus récente restent NEW, même si
        active_new_content ne contient qu'une partie de la série. On ajoute
        aussi explicitement le costume Original de Gentle (108000000). */
  js = replaceRequired(
    js,
    /const costumes=hasActive\?\(data\.costumes\|\|\[\]\):\(latestCostumes\.length\?latestCostumes:\(data\.costumes\|\|\[\]\)\);/,
    "const gentleActive=(data.characters||[]).map(String).some(id=>/gentle[_-]?criminal/i.test(id));\n  const costumes=Array.from(new Set([...(data.costumes||[]),...latestCostumes,...(gentleActive?['108000000']:[])]));",
    'la liste NEW initiale des costumes',
    "const gentleActive=(data.characters||[]).map(String).some"
  );

  /* 2) Les cartes Gentle Criminal reçoivent NEW dans Personnages, T.U.N.I.N.G
        et Costumes, même si l'identifiant local varie. */
  js = replaceRequired(
    js,
    /\$\{sets\.characters\.has\(String\(character\.id\)\)\?NEW_HTML:''\}/,
    "${(sets.characters.has(String(character.id))||norm(character.id).includes('gentle_criminal')||norm(character.name).includes('gentle_criminal'))?NEW_HTML:''}",
    'le badge NEW des cartes Gentle Criminal',
    "norm(character.name).includes('gentle_criminal'))?NEW_HTML"
  );

  /* 3) La carte de style Gentle garde aussi NEW. On stocke l'identifiant du
        personnage pour que la synchronisation v24 ne supprime pas le badge. */
  js = replaceRequired(
    js,
    /data-style="\$\{esc\(id\)\}" onclick=/,
    'data-style="${esc(id)}" data-s18-character="${esc(character.id)}" onclick=',
    'l’identifiant Gentle sur les cartes de style',
    'data-s18-character="${esc(character.id)}"'
  );
  js = replaceRequired(
    js,
    /\$\{sets\.styles\.has\(String\(id\)\)\?NEW_HTML:''\}/,
    "${(sets.styles.has(String(id))||norm(character.id).includes('gentle_criminal')||norm(character.name).includes('gentle_criminal'))?NEW_HTML:''}",
    'le badge NEW du style Gentle Criminal',
    "norm(character.name).includes('gentle_criminal'))?NEW_HTML:''}<div class=\"styleBanner\""
  );

  /* 4) Le rendu original des costumes ne mettait pas l'ID Ultra Rumble dans
        le HTML. La synchronisation ne pouvait donc pas reconnaître les cartes. */
  js = replaceRequired(
    js,
    /let html=String\(baseCostumeCard\(officialCostume\)\|\|''\);\n\s*if\(newSets\(\)\.costumes\.has\(id\)/,
    "let html=String(baseCostumeCard(officialCostume)||'');\n      if(!/data-s18-costume-id=/i.test(html)) html=html.replace(/^(<(?:button|div)\\b)/i,`$1 data-s18-costume-id=\"${esc(id)}\"`);\n      if(newSets().costumes.has(id)",
    'l’identifiant Ultra Rumble sur les cartes de costumes',
    'data-s18-costume-id='
  );

  /* 5) Même règle dans la synchronisation automatique v24. */
  js = replaceRequired(
    js,
    /const costumes=hasActive\?\(source\.costumes\|\|\[\]\):\(latestCostumeIds\.length\?latestCostumeIds:\(source\.costumes\|\|\[\]\)\);/,
    "const gentleActive=(source.characters||[]).map(String).some(id=>/gentle[_-]?criminal/i.test(id));\n  const costumes=Array.from(new Set([...(source.costumes||[]),...latestCostumeIds,...(gentleActive?['108000000']:[])]));",
    'la synchronisation des costumes NEW',
    "const gentleActive=(source.characters||[]).map(String).some"
  );

  js = replaceRequired(
    js,
    /const values=\[tile\.dataset\?\.costume,tile\.dataset\?\.id,tile\.getAttribute\('data-costume'\),tile\.getAttribute\('data-id'\),tile\.id,tile\.getAttribute\('onclick'\),tile\.getAttribute\('href'\),tile\.outerHTML\];/,
    "const values=[tile.dataset?.s18CostumeId,tile.getAttribute('data-s18-costume-id'),tile.dataset?.costume,tile.dataset?.id,tile.getAttribute('data-costume'),tile.getAttribute('data-id'),tile.id,tile.getAttribute('onclick'),tile.getAttribute('href'),tile.outerHTML];",
    'la lecture des identifiants de costumes',
    'tile.dataset?.s18CostumeId'
  );

  js = replaceRequired(
    js,
    /document\.querySelectorAll\('\.card\[data-char\]'\)\.forEach\(card=>setBadge\(card,sets\.characters\.has\(String\(card\.dataset\.char\|\|''\)\)\)\);/,
    "document.querySelectorAll('.card[data-char]').forEach(card=>setBadge(card,sets.characters.has(String(card.dataset.char||''))||/gentle[\\s_-]*criminal/i.test(`${card.dataset.char||''} ${card.textContent||''}`)));",
    'la conservation du NEW Gentle sur les cartes personnage',
    "/gentle[\\s_-]*criminal/i.test(`${card.dataset.char||''} ${card.textContent||''}`)"
  );

  js = replaceRequired(
    js,
    /document\.querySelectorAll\('\.styleCard\[data-style\]'\)\.forEach\(card=>setBadge\(card,sets\.styles\.has\(String\(card\.dataset\.style\|\|''\)\)\)\);/,
    "document.querySelectorAll('.styleCard[data-style]').forEach(card=>setBadge(card,sets.styles.has(String(card.dataset.style||''))||/gentle[\\s_-]*criminal/i.test(String(card.dataset.s18Character||''))));",
    'la conservation du NEW Gentle sur les cartes de style',
    "card.dataset.s18Character"
  );

  fs.writeFileSync(FIXES, js, 'utf8');
  console.log(`[CORRIGÉ] ${relative(FIXES)}`);
}

function patchCss() {
  backup(CSS);
  let css = fs.readFileSync(CSS, 'utf8').replace(/^\uFEFF/, '');
  css = css.replace(/\/\* === MHUR V571 START === \*\/[\s\S]*?\/\* === MHUR V571 END === \*\//g, '').trimEnd();

  css += `\n\n/* === MHUR V571 START === */
/* Tous les badges NEW utilisent la même pulsation. */
.s18NewBadge,
.s18NewBadgeV9,
.s18NewBadgeV24 {
  animation: s18NewPulseV9 1.15s ease-in-out infinite !important;
  will-change: transform !important;
}

/* Cartes Personnage / T.U.N.I.N.G / Costumes : format accueil, en haut à gauche. */
.card[data-char] > .s18NewBadge,
.styleCard[data-style] > .s18NewBadge {
  top: 6px !important;
  left: 6px !important;
  right: auto !important;
  width: 88px !important;
  height: 44px !important;
  transform-origin: top left !important;
}

/* Costumes : NEW à droite, sous les étoiles, sans les cacher. */
.costumeTile > .s18NewBadge,
.costumeCard > .s18NewBadge,
.costumeResult > .s18NewBadge,
.costumeTile > .s18NewBadgeV24,
.costumeCard > .s18NewBadgeV24,
.costumeResult > .s18NewBadgeV24 {
  top: 38px !important;
  right: 8px !important;
  left: auto !important;
  width: 64px !important;
  height: 34px !important;
  transform-origin: top right !important;
  z-index: 31 !important;
}

.costumeTile > .costumeTileStars,
.costumeCard > .costumeTileStars,
.costumeResult > .costumeTileStars {
  top: 7px !important;
  right: 8px !important;
  z-index: 32 !important;
}

/* Réductions : écriture lisible et moins grasse, même avec le rendu v35. */
.discountGridV296 .discountCardV296 > b,
.discountGridV296 .discountCardV296 > strong,
.discountGridV296 .discountCardV296 > span,
.discountGridV296 .discountCardV296 .badge,
.discountGridV296 .discountCardV296 [class*="role" i],
.discountGridV296 .v559DiscountName,
.discountGridV296 .v559RoleBadge,
.discountGridV296 .v559DiscountPoints {
  font-family: Arial, Helvetica, sans-serif !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
}
.discountGridV296 .discountCardV296 > b,
.discountGridV296 .discountCardV296 > strong,
.discountGridV296 .v559DiscountName {
  font-size: 14px !important;
  line-height: 1.15 !important;
  text-shadow: 1px 1px 0 #000 !important;
}
.discountGridV296 .discountCardV296 > span,
.discountGridV296 .v559DiscountPoints {
  font-size: 17px !important;
  line-height: 1 !important;
}
.discountGridV296 .discountCardV296 .badge,
.discountGridV296 .discountCardV296 [class*="role" i],
.discountGridV296 .v559RoleBadge {
  font-size: 11px !important;
  line-height: 1 !important;
}

@media (max-width: 700px) {
  .discountGridV296 .discountCardV296 > b,
  .discountGridV296 .discountCardV296 > strong,
  .discountGridV296 .v559DiscountName { font-size: 12px !important; }
  .discountGridV296 .discountCardV296 > span,
  .discountGridV296 .v559DiscountPoints { font-size: 16px !important; }
  .discountGridV296 .discountCardV296 .badge,
  .discountGridV296 .discountCardV296 [class*="role" i],
  .discountGridV296 .v559RoleBadge { font-size: 10px !important; }
}
/* === MHUR V571 END === */\n`;

  fs.writeFileSync(CSS, css, 'utf8');
  console.log(`[CORRIGÉ] ${relative(CSS)}`);
}

function patchIndex() {
  backup(INDEX);
  let html = fs.readFileSync(INDEX, 'utf8').replace(/^\uFEFF/, '');

  /* Les anciens scripts expérimentaux ne doivent pas revenir. */
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v56[3-9][^"']*\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v56[3-9][^"']*\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');

  html = html
    .replace(/css\/season18-fixes\.css\?v=[^"']+/gi, 'css/season18-fixes.css?v=571')
    .replace(/js\/season18-fixes\.js\?v=[^"']+/gi, 'js/season18-fixes.js?v=571');

  fs.writeFileSync(INDEX, html, 'utf8');
  console.log(`[CORRIGÉ] ${relative(INDEX)}`);
}

function verify() {
  const js = fs.readFileSync(FIXES, 'utf8');
  const css = fs.readFileSync(CSS, 'utf8');
  const html = fs.readFileSync(INDEX, 'utf8');
  const errors = [];

  if (!js.includes("...(gentleActive?['108000000']:[])")) errors.push('costume Original Gentle absent de la liste NEW');
  if (!js.includes('...latestCostumes')) errors.push('dernière date de costumes non fusionnée dans newSets');
  if (!js.includes('...latestCostumeIds')) errors.push('dernière date de costumes non fusionnée dans activeSets');
  if (!js.includes('data-s18-costume-id=')) errors.push('ID Ultra Rumble non ajouté aux cartes de costumes');
  if (!js.includes('tile.dataset?.s18CostumeId')) errors.push('ID Ultra Rumble non lu par la synchronisation');
  if (!js.includes('card.dataset.s18Character')) errors.push('carte de style Gentle non protégée');
  if (!css.includes('/* === MHUR V571 START === */')) errors.push('bloc CSS V571 absent');
  if (!css.includes('animation: s18NewPulseV9 1.15s')) errors.push('animation NEW non forcée');
  if (!css.includes('font-family: Arial, Helvetica, sans-serif')) errors.push('typographie des réductions non corrigée');
  if (!html.includes('css/season18-fixes.css?v=571')) errors.push('cache CSS non actualisé');
  if (!html.includes('js/season18-fixes.js?v=571')) errors.push('cache JavaScript non actualisé');

  if (errors.length) fail('Vérification échouée :\n- ' + errors.join('\n- '));
}

function main() {
  [INDEX, FIXES, CSS].forEach(ensureFile);
  console.log('\n=== MHUR FRANCE — CORRECTIF V571 ===\n');
  patchFixes();
  patchCss();
  patchIndex();
  verify();
  console.log('\n[OK] Écriture des réductions allégée.');
  console.log('[OK] NEW restauré sur les cartes Gentle : Personnage, T.U.N.I.N.G et Costumes.');
  console.log('[OK] NEW ajouté au costume Original de Gentle Criminal.');
  console.log('[OK] Tous les costumes de la dernière date de sortie reçoivent NEW.');
  console.log('[OK] Tous les badges NEW utilisent la même animation.');
  console.log('[SUITE] Commit/push, attends Cloudflare, puis fais Ctrl + F5.\n');
}

main();
