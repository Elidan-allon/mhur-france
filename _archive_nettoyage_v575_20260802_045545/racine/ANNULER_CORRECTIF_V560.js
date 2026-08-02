#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const index = path.join(ROOT, 'public', 'index.html');
const backup = index + '.avant-v560.bak';
const files = [
  path.join(ROOT, 'public', 'js', 'v560-discount-role-dedupe.js'),
  path.join(ROOT, 'public', 'css', 'v560-discount-role-dedupe.css')
];
if (fs.existsSync(backup)) {
  fs.copyFileSync(backup, index);
  console.log('[RESTAURÉ] public/index.html');
} else if (fs.existsSync(index)) {
  let html = fs.readFileSync(index, 'utf8');
  html = html
    .replace(/\s*<link\b[^>]*href=["'][^"']*v560-discount-role-dedupe\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["'][^"']*v560-discount-role-dedupe\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');
  fs.writeFileSync(index, html, 'utf8');
  console.log('[NETTOYÉ] Références V560 retirées de public/index.html');
}
files.forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log('[SUPPRIMÉ] ' + path.relative(ROOT, file));
  }
});
console.log('\n[OK] Correctif V560 annulé.\n');
