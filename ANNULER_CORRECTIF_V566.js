#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const INDEX = path.join(ROOT,'public','index.html');
const BACKUP = INDEX + '.avant-v566.bak';
const JS = path.join(ROOT,'public','js','v566-badges-final.js');
const CSS = path.join(ROOT,'public','css','v566-badges-final.css');
try {
  if (!fs.existsSync(BACKUP)) throw new Error('La sauvegarde public/index.html.avant-v566.bak est introuvable.');
  fs.copyFileSync(BACKUP, INDEX);
  if (fs.existsSync(JS)) fs.unlinkSync(JS);
  if (fs.existsSync(CSS)) fs.unlinkSync(CSS);
  console.log('[OK] Le correctif V566 a été annulé.');
} catch (error) {
  console.error('[ERREUR] ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
}
