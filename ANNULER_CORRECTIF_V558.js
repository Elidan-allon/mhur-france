#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SUFFIX = ".avant-v558.bak";
const runtime = path.join(ROOT, "public", "js", "v558-discount-lock.js");
const files = [
  path.join(ROOT, "public", "index.html"),
  path.join(ROOT, "public", "data", "home_data.json"),
  path.join(ROOT, "public", "data", "home_data.js"),
  path.join(ROOT, "public", "js", "season18-fixes.js"),
  path.join(ROOT, "mise_a_jour", "outils", "season18_postprocess.py")
];

let restored = 0;
for (const file of files) {
  const backup = file + SUFFIX;
  if (!fs.existsSync(backup)) {
    console.warn(`[IGNORÉ] Sauvegarde absente : ${path.relative(ROOT, backup)}`);
    continue;
  }
  fs.copyFileSync(backup, file);
  restored += 1;
  console.log(`[RESTAURÉ] ${path.relative(ROOT, file)}`);
}

const runtimeBackup = runtime + SUFFIX;
if (fs.existsSync(runtimeBackup)) {
  fs.copyFileSync(runtimeBackup, runtime);
  console.log(`[RESTAURÉ] ${path.relative(ROOT, runtime)}`);
} else if (fs.existsSync(runtime)) {
  fs.unlinkSync(runtime);
  console.log(`[SUPPRIMÉ] ${path.relative(ROOT, runtime)}`);
}

if (!restored) {
  console.error("\nAucune sauvegarde V558 n'a été trouvée.\n");
  process.exitCode = 1;
} else {
  console.log("\nCorrectif V558 annulé.\n");
}
