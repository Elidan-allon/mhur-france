#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const VERSION = "v558";
const ROOT = __dirname;
const BACKUP_SUFFIX = ".avant-v558.bak";

const FILES = {
  index: path.join(ROOT, "public", "index.html"),
  homeJson: path.join(ROOT, "public", "data", "home_data.json"),
  homeJs: path.join(ROOT, "public", "data", "home_data.js"),
  seasonFixes: path.join(ROOT, "public", "js", "season18-fixes.js"),
  updater: path.join(ROOT, "mise_a_jour", "outils", "season18_postprocess.py"),
  payload: path.join(ROOT, "_v558_payload", "public", "js", "v558-discount-lock.js"),
  runtime: path.join(ROOT, "public", "js", "v558-discount-lock.js")
};

const CANONICAL_DISCOUNTS = [
  {
    name: "D.J. Board",
    points: 100,
    image: "assets/present_mic/present_mic_technical/portrait.webp",
    character: "Present Mic",
    style: "Technical",
    style_id: "present_mic_technical",
    role: "technical"
  },
  {
    name: "Flow Runner",
    points: 100,
    image: "assets/aizawa/aizawa_strike/portrait.webp",
    character: "Shota Aizawa",
    style: "Strike",
    style_id: "aizawa_strike",
    role: "strike"
  },
  {
    name: "Gentle Criminal",
    points: 100,
    image: "assets/home/discounts/gentle_criminal_v531.png?v=531",
    character: "Gentle Criminal",
    style: "Technical",
    style_id: "gentle_criminal",
    role: "technical"
  },
  {
    name: "Factor Fusion",
    points: 50,
    image: "assets/all_for_one/all_for_one_strike/portrait.png",
    character: "All For One",
    style: "Strike",
    style_id: "all_for_one_strike",
    role: "strike"
  },
  {
    name: "Cluster",
    points: 50,
    image: "assets/bakugo/bakugo_technical/portrait.webp",
    character: "Katsuki Bakugo",
    style: "Technical",
    style_id: "bakugo_technical",
    role: "technical"
  },
  {
    name: "Mirko",
    points: 50,
    image: "assets/mirko/mirko_rapid/portrait.webp",
    character: "Mirko",
    style: "Rapid",
    style_id: "mirko_rapid",
    role: "speed"
  }
];

function fail(message) {
  console.error(`\n[ERREUR ${VERSION.toUpperCase()}] ${message}\n`);
  process.exit(1);
}

function ensureFile(file, label) {
  if (!fs.existsSync(file)) fail(`${label} introuvable : ${path.relative(ROOT, file)}`);
}

function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function writeText(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function backup(file) {
  const backupPath = file + BACKUP_SUFFIX;
  if (!fs.existsSync(backupPath)) fs.copyFileSync(file, backupPath);
  return backupPath;
}

function replaceOrKeep(text, regex, replacement) {
  return regex.test(text) ? text.replace(regex, replacement) : text;
}

function patchHomeData() {
  backup(FILES.homeJson);
  backup(FILES.homeJs);

  let data;
  try {
    data = JSON.parse(readText(FILES.homeJson));
  } catch (error) {
    fail(`home_data.json invalide : ${error.message}`);
  }

  data.discounts = CANONICAL_DISCOUNTS.map(item => ({ ...item }));
  writeText(FILES.homeJson, JSON.stringify(data, null, 2) + "\n");
  writeText(
    FILES.homeJs,
    "window.MHUR_HOME_DATA = " + JSON.stringify(data) + ";\n"
  );
}

function patchSeasonFixes() {
  backup(FILES.seasonFixes);
  let text = readText(FILES.seasonFixes);

  text = replaceOrKeep(
    text,
    /factor_fusion\s*:\s*['"]assets\/overhaul\/overhaul_assault\/portrait\.webp['"]/g,
    "factor_fusion:'assets/all_for_one/all_for_one_strike/portrait.png'"
  );
  text = replaceOrKeep(
    text,
    /factor_fusion\s*:\s*['"]overhaul_assault['"]/g,
    "factor_fusion:'all_for_one_strike'"
  );

  if (!/factor_fusion\s*:\s*['"]assets\/all_for_one\/all_for_one_strike\/portrait\.png['"]/.test(text)) {
    console.warn("[V558] Le premier ancien mapping Factor Fusion n'a pas été trouvé ; le verrou final prendra quand même le relais.");
  }
  if (!/factor_fusion\s*:\s*['"]all_for_one_strike['"]/.test(text)) {
    console.warn("[V558] Le second ancien mapping Factor Fusion n'a pas été trouvé ; le verrou final prendra quand même le relais.");
  }

  const fallbackBlock = /const DISCOUNT_FALLBACK\s*=\s*\{([\s\S]*?)\n\};/;
  const match = text.match(fallbackBlock);
  if (match && !/factor_fusion\s*:/.test(match[1])) {
    const body = match[1].replace(/\s*$/, "");
    const comma = body.trim().endsWith(",") ? "" : ",";
    text = text.replace(
      fallbackBlock,
      `const DISCOUNT_FALLBACK={${body}${comma}\n  factor_fusion:'assets/all_for_one/all_for_one_strike/portrait.png'\n};`
    );
  }

  text = text.replace(
    /\|overhaul\|mirko\|/g,
    "|overhaul|all_for_one|mirko|"
  );

  writeText(FILES.seasonFixes, text);
}

function patchUpdater() {
  backup(FILES.updater);
  let text = readText(FILES.updater);
  const marker = "V558_DISCOUNT_LOCK";

  if (!text.includes(marker)) {
    const oldBlock = /\n([ \t]*)discounts\s*=\s*parse_entry_discounts\(session, root, soup\)\r?\n\1if discounts:\r?\n\1[ \t]+data\["discounts"\]\s*=\s*discounts/;
    const found = text.match(oldBlock);
    if (!found) {
      fail("Impossible de trouver le bloc des réductions dans season18_postprocess.py. Aucun changement incomplet n'a été conservé.");
    }
    const indent = found[1];
    const replacement = [
      "",
      `${indent}# V558_DISCOUNT_LOCK: ces six cartes sont validées manuellement.`,
      `${indent}# L'actualisation automatique ne doit plus remplacer leurs portraits.`,
      `${indent}if not isinstance(data.get("discounts"), list) or not data.get("discounts"):` ,
      `${indent}    discounts = parse_entry_discounts(session, root, soup)`,
      `${indent}    if discounts:`,
      `${indent}        data["discounts"] = discounts`
    ].join("\n");
    text = text.replace(oldBlock, replacement);
  }

  writeText(FILES.updater, text);
}

function patchIndex() {
  backup(FILES.index);
  let html = readText(FILES.index);

  html = html.replace(
    /data\/home_data\.js\?v=[^"'\s>]+/g,
    "data/home_data.js?v=558"
  );
  html = html.replace(
    /js\/season18-fixes\.js\?v=[^"'\s>]+/g,
    "js/season18-fixes.js?v=558"
  );

  const runtimeTag = '<script src="js/v558-discount-lock.js?v=558"></script>';
  if (!html.includes("js/v558-discount-lock.js")) {
    const seasonTag = /(<script\s+src=["']js\/season18-fixes\.js\?v=[^"']+["']\s*><\/script>)/;
    if (seasonTag.test(html)) {
      html = html.replace(seasonTag, `$1\n${runtimeTag}`);
    } else if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${runtimeTag}\n</body>`);
    } else {
      fail("Impossible d'ajouter le verrou V558 dans index.html.");
    }
  }

  writeText(FILES.index, html);
}

function installRuntime() {
  ensureFile(FILES.payload, "Fichier V558 fourni dans le correctif");
  if (fs.existsSync(FILES.runtime)) backup(FILES.runtime);
  fs.mkdirSync(path.dirname(FILES.runtime), { recursive: true });
  fs.copyFileSync(FILES.payload, FILES.runtime);
}

function verify() {
  const home = JSON.parse(readText(FILES.homeJson));
  const factor = home.discounts?.find(item => item.name === "Factor Fusion");
  const season = readText(FILES.seasonFixes);
  const updater = readText(FILES.updater);
  const index = readText(FILES.index);

  const errors = [];
  if (home.discounts?.length !== 6) errors.push("la liste ne contient pas exactement 6 cartes");
  if (factor?.style_id !== "all_for_one_strike") errors.push("Factor Fusion n'est pas associé à all_for_one_strike");
  if (!String(factor?.image || "").includes("all_for_one/all_for_one_strike/portrait.png")) errors.push("le portrait Factor Fusion n'est pas celui d'All For One Strike");
  if (/factor_fusion\s*:\s*['"]overhaul_assault['"]/.test(season)) errors.push("un mapping Overhaul actif subsiste dans season18-fixes.js");
  if (!updater.includes("V558_DISCOUNT_LOCK")) errors.push("la protection de mise à jour n'est pas installée");
  if (!index.includes("js/v558-discount-lock.js?v=558")) errors.push("le script final V558 n'est pas chargé");
  if (!fs.existsSync(FILES.runtime)) errors.push("le script public/js/v558-discount-lock.js manque");

  if (errors.length) fail("Vérification échouée :\n- " + errors.join("\n- "));
}

function main() {
  ensureFile(FILES.index, "public/index.html");
  ensureFile(FILES.homeJson, "public/data/home_data.json");
  ensureFile(FILES.homeJs, "public/data/home_data.js");
  ensureFile(FILES.seasonFixes, "public/js/season18-fixes.js");
  ensureFile(FILES.updater, "mise_a_jour/outils/season18_postprocess.py");

  console.log("\n=== MHUR FRANCE — CORRECTIF V558 ===\n");
  patchHomeData();
  patchSeasonFixes();
  patchUpdater();
  installRuntime();
  patchIndex();
  verify();

  console.log("[OK] Les 6 cartes de réductions ont été restaurées.");
  console.log("[OK] Factor Fusion utilise All For One Strike.");
  console.log("[OK] Les prochaines mises à jour ne remplaceront plus ces portraits.");
  console.log("[OK] Les fichiers d'origine ont été sauvegardés en .avant-v558.bak.\n");
  console.log("Tu peux maintenant tester le site, puis faire commit + push sur GitHub.\n");
}

try {
  main();
} catch (error) {
  fail(error && error.stack ? error.stack : String(error));
}
