(function(){
'use strict';
const RELEASE='372';
window.MHUR_RELEASE=RELEASE;
const isEN=()=>{try{return typeof lang!=='undefined'&&lang==='en'}catch(_){return document.documentElement.lang==='en'}};
const tr=(fr,en)=>isEN()?en:fr;

/* Replace the old generic placeholder descriptions with a readable translation of the real French text. */
const phraseRules=[
  [/Durcit et aiguise tout son corps afin d'améliorer son attaque et sa défense\.?/gi,'Hardens and sharpens his entire body to improve both attack and defense.'],
  [/Faites le mâle et le mal en un seul coup\s*!?/gi,'Show your toughness and strike down evil in a single blow!'],
  [/Augmente la défense considérablement pendant un certain temps, rendant presque invulnérable aux attaques physiques\.?/gi,'Greatly increases defense for a limited time, making the user almost invulnerable to physical attacks.'],
  [/Enchaîne les coups tranchants en chargeant tout droit, et termine par une taillade\.?/gi,'Rushes straight ahead with a series of slashing attacks, then finishes with a powerful slash.'],
  [/Se rue sur l['’]adversaire pour lui asséner un coup de poing surpuissant\.?/gi,'Rushes the opponent and delivers an extremely powerful punch.'],
  [/Frappe le sol du poing pour créer une onde de choc\. Dans les airs, saute avant de piquer vers le bas\.?/gi,'Punches the ground to create a shock wave. In midair, leaps before diving downward.'],
  [/Charge l['’]ennemi en tournoyant et finit par une entaille frontale\. Peut sauter ou courir sur les murs pendant la charge, et maintenir la commande la prolonge\.?/gi,'Charges the enemy while spinning and finishes with a frontal slash. The user can jump or run on walls during the charge, and holding the button extends it.'],
  [/Augmente la défense considérablement/gi,'Greatly increases defense'],
  [/pendant un certain temps/gi,'for a limited time'],
  [/pendant une durée limitée/gi,'for a limited time'],
  [/Lance une boule de feu/gi,'Launches a fireball'],
  [/Tire des flammes/gi,'Fires flames'],
  [/Fait surgir/gi,'Creates'],
  [/Crée et place/gi,'Creates and places'],
  [/Crée/gi,'Creates'],
  [/Place/gi,'Places'],
  [/Projette/gi,'Launches'],
  [/Lance/gi,'Launches'],
  [/Tire/gi,'Fires'],
  [/Frappe/gi,'Strikes'],
  [/Charge/gi,'Charges'],
  [/Se rue sur/gi,'Rushes'],
  [/Tournoie/gi,'Spins'],
  [/Attrape/gi,'Grabs'],
  [/Saisit/gi,'Grabs'],
  [/Repousse/gi,'Knocks back'],
  [/Attire/gi,'Pulls'],
  [/Bloque/gi,'Blocks'],
  [/Réduit/gi,'Reduces'],
  [/Augmente/gi,'Increases'],
  [/Inflige/gi,'Deals'],
  [/Permet de/gi,'Allows the user to'],
  [/Maintenir la commande enfoncée/gi,'Hold the button'],
  [/Maintenir la commande/gi,'Hold the button'],
  [/Appuyer à nouveau sur la commande/gi,'Press the button again'],
  [/Appuyer sur la commande/gi,'Press the button'],
  [/les ennemis touchés/gi,'enemies hit'],
  [/l['’]ennemi/gi,'the enemy'],
  [/les ennemis/gi,'enemies'],
  [/les alliés/gi,'allies'],
  [/un allié/gi,'an ally'],
  [/les attaques ennemies/gi,'enemy attacks'],
  [/les attaques physiques/gi,'physical attacks'],
  [/les projectiles/gi,'projectiles'],
  [/les dégâts subis/gi,'damage taken'],
  [/les dégâts/gi,'damage'],
  [/la vitesse de déplacement/gi,'movement speed'],
  [/la vitesse de rechargement/gi,'reload speed'],
  [/la puissance d['’]attaque/gi,'attack power'],
  [/la défense/gi,'defense'],
  [/une onde de choc/gi,'a shock wave'],
  [/au sol/gi,'on the ground'],
  [/dans les airs/gi,'in midair'],
  [/devant soi/gi,'in front'],
  [/dans la direction visée/gi,'in the aimed direction'],
  [/à proximité/gi,'nearby'],
  [/pendant l['’]attaque/gi,'during the attack'],
  [/jusqu['’]à/gi,'up to'],
  [/afin de/gi,'to'],
  [/ et /gi,' and ']
];
function translateFrenchDescription(text){
  let s=String(text||'').trim();
  if(!s)return '';
  for(const [rx,to] of phraseRules)s=s.replace(rx,to);
  s=s.replace(/\s+/g,' ').trim();
  return s;
}
function isGenericDescription(s){return /^Uses .+, one of .+['’]s abilities\.?$/i.test(String(s||'').trim())||/^Official .+ style for .+\.?$/i.test(String(s||'').trim())}
function repairEnglishDescriptions(){
  if(typeof styles==='undefined')return;
  for(const st of Object.values(styles)){
    if(!st)continue;
    const fix=(obj,key='desc')=>{
      if(!obj)return;
      const v=obj[key];
      const fr=typeof v==='object'&&v?v.fr:String(v||'');
      const en=typeof v==='object'&&v?v.en:'';
      if(!en||isGenericDescription(en))obj[key]={fr,en:translateFrenchDescription(fr)||en};
    };
    fix(st,'description'); fix(st,'roleDesc');
    if(st.special)fix(st.special,'desc');
    for(const sk of st.skills||[]){fix(sk,'desc');if(sk.sub)fix(sk.sub,'desc')}
  }
}

/* Keep the complete drawer after every base layout rebuild. */
function ensureFullDrawer(){
  const drawer=document.getElementById('drawer'); if(!drawer)return;
  const add=(selector,html,handler)=>{
    let el=drawer.querySelector(selector);
    if(!el){el=document.createElement('button');el.type='button';el.className='navItem';drawer.appendChild(el)}
    el.innerHTML=html;el.onclick=handler;return el;
  };
  add('[data-mhur-global-search]','🔎 '+tr('Recherche globale','Global search'),e=>{e.preventDefault();e.stopPropagation();window.MHUR_HUB?.search?.open?.()}).dataset.mhurGlobalSearch='1';
  add('[data-mhur-tier-shortcut]','🏆 Tier List',e=>{e.preventDefault();e.stopPropagation();window.MHUR_HUB?.tier?.open?.()}).dataset.mhurTierShortcut='1';
  add('[data-mhur-leaderboard]','🏅 '+tr('Classement créateurs','Creator ranking'),e=>{e.preventDefault();e.stopPropagation();window.MHUR_V370?.openLeaderboard?.()}).dataset.mhurLeaderboard='1';
  let install=drawer.querySelector('[data-mhur-install]');
  if(!install){install=document.createElement('button');install.type='button';install.className='navItem';install.dataset.mhurInstall='1';drawer.appendChild(install)}
  /* Let the existing PWA controller wire this button. */
  if(typeof window.MHUR_V371_WIRE_INSTALL==='function')window.MHUR_V371_WIRE_INSTALL();
  else install.textContent='📲 '+tr('Installer l’application','Install the app');
}

repairEnglishDescriptions();
if(typeof layout==='function'&&!layout.__v372){
  const base=layout;
  const wrapped=function(){repairEnglishDescriptions();const r=base.apply(this,arguments);ensureFullDrawer();return r};
  wrapped.__v372=true;layout=wrapped;window.layout=wrapped;
}
if(typeof render==='function'&&!render.__v372){
  const base=render;
  const wrapped=function(){repairEnglishDescriptions();const r=base.apply(this,arguments);ensureFullDrawer();return r};
  wrapped.__v372=true;render=wrapped;window.render=wrapped;
}
if(typeof toggleLang==='function'&&!toggleLang.__v372){
  const base=toggleLang;
  const wrapped=function(){const r=base.apply(this,arguments);repairEnglishDescriptions();ensureFullDrawer();if(typeof render==='function')render();return r};
  wrapped.__v372=true;toggleLang=wrapped;window.toggleLang=wrapped;
}
function boot(){repairEnglishDescriptions();ensureFullDrawer()}
document.addEventListener('DOMContentLoaded',boot,{once:true});
setTimeout(boot,100);setTimeout(boot,800);
const drawer=document.getElementById('drawer');if(drawer)new MutationObserver(()=>queueMicrotask(ensureFullDrawer)).observe(drawer,{childList:true});
})();
