#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const INDEX = path.join(ROOT,'public','index.html');
const BACKUP = INDEX + '.avant-v563.bak';
const JS = path.join(ROOT,'public','js','v563-badges-new-incoming.js');
const CSS = path.join(ROOT,'public','css','v563-badges-new-incoming.css');
try{
  if(!fs.existsSync(BACKUP)) throw new Error('La sauvegarde public/index.html.avant-v563.bak est introuvable.');
  fs.copyFileSync(BACKUP, INDEX);
  if(fs.existsSync(JS)) fs.unlinkSync(JS);
  if(fs.existsSync(CSS)) fs.unlinkSync(CSS);
  console.log('[OK] Le correctif V563 a été annulé.');
}catch(error){ console.error('[ERREUR] ' + (error && error.message ? error.message : String(error))); process.exitCode=1; }
