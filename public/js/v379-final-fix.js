(function(){
'use strict';
const en=()=>{try{return typeof lang!=='undefined'&&lang==='en'}catch(_){return false}};
const t=(fr,enText)=>en()?enText:fr;

function bilingual(value,enText){
  if(value&&typeof value==='object'&&!Array.isArray(value)) return {...value,en:enText};
  return {fr:String(value??''),en:enText};
}

function patchShinso(){
  if(typeof styles==='undefined'||!styles.shinso_strike)return;
  const s=styles.shinso_strike;
  s.name=bilingual(s.name,'Original');
  s.description=bilingual(s.description,'The star of General Studies aims to become a great hero! Use his “Brainwashing” Quirk to take down your foes!');
  s.roleDesc=bilingual(s.roleDesc,'Gives your entire team Attack Power UP! The more teammates with the same role, the stronger the effect!');
  if(s.special){
    s.special.name=bilingual(s.special.name,'Persona Chords / Persona Command');
    s.special.desc=bilingual(s.special.desc,'<p><b>Persona Chords:</b> Projects a loud voice in the aim direction. Opponents hit drop items and are briefly immobilized.</p><p><b>Persona Command:</b> When a Special Action has immobilized an opponent, use this to place a marker in the aim direction. The opponent is forced to run to that spot.</p>');
  }
  const skills=Array.isArray(s.skills)?s.skills:[];
  if(skills[0]){
    skills[0].name=bilingual(skills[0].name,'Binding Cloth: Crushing Strike');
    skills[0].desc=bilingual(skills[0].desc,'Sends out Binding Cloth to restrain an opponent and slams them down. Press again while restraining to instantly slam the enemy down.');
  }
  if(skills[1]){
    skills[1].name=bilingual(skills[1].name,'Binding Cloth: Sky Rend');
    skills[1].desc=bilingual(skills[1].desc,'Fires Binding Cloth to leap into the air. Jumps in the movement input direction.');
    if(skills[1].sub){
      skills[1].sub.name=bilingual(skills[1].sub.name,'Binding Cloth: Sky Chaos');
      skills[1].sub.desc=bilingual(skills[1].sub.desc,'Hold the command to continue the Binding Cloth follow-up attack.');
    }
  }
  if(skills[2]){
    skills[2].name=bilingual(skills[2].name,'Brainwashing');
    skills[2].desc=bilingual(skills[2].desc,'Sends out a call that brainwashes nearby opponents. While brainwashed, their movement slows and it becomes hard to distinguish allies from opponents.');
  }
}

function removeDuplicateExtras(drawer){
  const seen=new Set();
  [...drawer.querySelectorAll('[data-mhur-final-nav], [data-mhur-hub], [data-mhur-tier-shortcut], [data-mhur-leaderboard], [data-mhur-install]')].forEach(el=>{
    const text=(el.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    let key='';
    if(text.includes('tier list')) key='tier';
    else if(text.includes('global search')||text.includes('recherche globale')) key='search';
    else if(text.includes('creator rank')||text.includes('creator leader')||text.includes('classement createur')) key='creator';
    else if(text.includes('install')) key='install';
    if(!key)return;
    if(seen.has(key))el.remove(); else seen.add(key);
  });
}

function addButton(drawer,key,label,handler){
  let btn=drawer.querySelector('[data-mhur-final-nav="'+key+'"]');
  if(!btn){
    btn=document.createElement('button');
    btn.type='button';
    btn.className='navItem';
    btn.dataset.mhurFinalNav=key;
    btn.dataset.mhurHub='1';
    drawer.appendChild(btn);
  }
  btn.innerHTML=label;
  btn.onclick=function(e){e.preventDefault();e.stopPropagation();handler();return false};
}

function ensureFinalNav(){
  const drawer=document.getElementById('drawer');
  if(!drawer)return;
  removeDuplicateExtras(drawer);
  addButton(drawer,'search','🔎 '+t('Recherche globale','Global Search'),()=>window.MHUR_HUB?.search?.open?.());
  addButton(drawer,'tier','🏆 Tier List',()=>window.MHUR_HUB?.tier?.open?.());
  addButton(drawer,'creator','🏅 '+t('Classement créateurs','Creator Ranking'),()=>window.MHUR_V370?.openLeaderboard?.());
  // Keep the existing PWA button when available; only add a fallback if it is absent.
  if(!drawer.querySelector('[data-mhur-install], [data-mhur-final-nav="install"]')){
    addButton(drawer,'install','📲 '+t('Installer l’application','Install App'),()=>window.MHUR_V370?.installApp?.());
  }
  removeDuplicateExtras(drawer);
}

function wrapLayout(){
  if(typeof layout!=='function'||layout.__v379)return;
  const base=layout;
  const wrapped=function(){
    patchShinso();
    const result=base.apply(this,arguments);
    ensureFinalNav();
    return result;
  };
  wrapped.__v379=true;
  layout=wrapped;
}

function boot(){
  patchShinso();
  wrapLayout();
  ensureFinalNav();
  if(typeof render==='function'&&typeof selectedStyle!=='undefined'&&selectedStyle==='shinso_strike') render();
}

document.addEventListener('DOMContentLoaded',boot,{once:true});
setTimeout(boot,0);
setTimeout(boot,250);
setTimeout(ensureFinalNav,1000);
})();
