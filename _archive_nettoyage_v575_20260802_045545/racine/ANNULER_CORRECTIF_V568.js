#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const INDEX = path.join(ROOT,'public','index.html');
const BACKUP = INDEX + '.avant-v568.bak';
const JS = path.join(ROOT,'public','js','v568-costume-new-lower.js');
const CSS = path.join(ROOT,'public','css','v568-costume-new-lower.css');
try {
  if (!fs.existsSync(BACKUP)) throw new Error('La sauvegarde public/index.html.avant-v568.bak est introuvable.');
  fs.copyFileSync(BACKUP, INDEX);
  if (fs.existsSync(JS)) fs.unlinkSync(JS);
  if (fs.existsSync(CSS)) fs.unlinkSync(CSS);
  console.log('[OK] Le correctif V568 a été annulé.');
} catch (error) {
  console.error('[ERREUR] ' + (error && error.message ? error.message : String(error)));
  process.exitCode = 1;
}
