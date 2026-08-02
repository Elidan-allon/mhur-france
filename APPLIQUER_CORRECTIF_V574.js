#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const FILE = path.join(ROOT, 'public', 'js', 'season18-fixes.js');
const BACKUP = FILE + '.avant-v574.bak';
const MARKER = 'MHUR V574 — charge V573 sans index.html';

const BLOCK = String.raw`

/* MHUR V574 — charge V573 sans index.html */
(function(){
  'use strict';

  function loadV573(){
    if(document.querySelector('link[data-mhur-v574="css"]') === null){
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href='css/v573-new-right-animation-costumes.css?v=574';
      link.dataset.mhurV574='css';
      document.head.appendChild(link);
    }

    if(
      !window.MHUR_V573 &&
      document.querySelector('script[data-mhur-v574="js"]') === null
    ){
      const script=document.createElement('script');
      script.src='js/v573-new-right-animation-costumes.js?v=574';
      script.dataset.mhurV574='js';
      script.onload=function(){
        try{ window.MHUR_V573?.refresh?.(); }catch(_error){}
      };
      document.body.appendChild(script);
    }
  }

  function start(){
    /* Attendre que season18-v12 et les anciens scripts aient fini. */
    setTimeout(loadV573,150);
    setTimeout(loadV573,800);
  }

  if(document.readyState==='complete') start();
  else window.addEventListener('load',start,{once:true});

  window.addEventListener('hashchange',function(){
    setTimeout(function(){
      loadV573();
      try{ window.MHUR_V573?.refresh?.(); }catch(_error){}
    },100);
  });

  window.addEventListener('mhur:languagechange',function(){
    setTimeout(function(){
      loadV573();
      try{ window.MHUR_V573?.refresh?.(); }catch(_error){}
    },100);
  });
})();
`;

function fail(message) {
  console.error('\n[ERREUR V574] ' + message + '\n');
  process.exit(1);
}

if (!fs.existsSync(FILE)) {
  fail('public/js/season18-fixes.js est introuvable. Décompresse le ZIP à la racine de mhur-france.');
}

let source = fs.readFileSync(FILE, 'utf8').replace(/^\uFEFF/, '');

if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(FILE, BACKUP);
  console.log('[SAUVEGARDE] public/js/season18-fixes.js.avant-v574.bak');
}

if (!source.includes(MARKER)) {
  source = source.trimEnd() + BLOCK + '\n';
  fs.writeFileSync(FILE, source, 'utf8');
  console.log('[CORRIGÉ] Le chargeur V574 a été ajouté à season18-fixes.js.');
} else {
  console.log('[INFO] Le chargeur V574 est déjà présent.');
}

const finalSource = fs.readFileSync(FILE, 'utf8');
if (!finalSource.includes(MARKER)) {
  fail('La vérification du chargeur V574 a échoué.');
}

console.log('[VÉRIFIÉ] V574 présent dans season18-fixes.js.');
console.log('[OK] Tu dois maintenant remplacer UN SEUL fichier sur GitHub :');
console.log('     public/js/season18-fixes.js');
