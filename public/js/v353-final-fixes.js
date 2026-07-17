/* MHUR France V353 — final requested fixes */
(function(){
'use strict';
const en=()=>typeof lang!=='undefined'&&lang==='en';

// Remove updater-created duplicate Young All For One at runtime.
function dedupeYoungAFO(){
  try{
    if(!Array.isArray(characters))return;
    for(let i=characters.length-1;i>=0;i--){
      const c=characters[i]||{};
      if(c.id==='all_for_one_youth_age'||String(c.name||'').toLowerCase()==='all for one (youth age)')characters.splice(i,1);
    }
    const existing=characters.find(c=>c.id==='all_for_one_young');
    if(existing)existing.styles=[...new Set((existing.styles||[]).filter(k=>k!=='all_for_one_youth_age_youth_age'))];
    if(typeof styles!=='undefined')delete styles.all_for_one_youth_age_youth_age;
    if(typeof tunings!=='undefined')delete tunings.all_for_one_youth_age_youth_age;
  }catch(_){ }
}
dedupeYoungAFO();

const exact={
'Original':'Original','Assaut':'Assault','Attaque':'Strike','Vitesse':'Rapid','Technique':'Technical','Soutien':'Support',
'Guerrier enragé':'Red Riot','Zéro satellites':'Zero Satellites','Précipice de la mort':'Death Precipice',
'Durcissement':'Hardening','Réassembler / Désassembler':'Reassemble / Disassemble',
'Gravité Zéro':'Zero Gravity','Action spéciale':'Special Action','Compétence':'Skill',
'Épée Chambara':'Chambara Blade','Orage perçant':'Piercing Storm','Cercueil de roche':'Rock Coffin',
'Récupération rapide de PG':'Rapid GP Recovery','Sauvetage rapide des civils':'Rapid Civilian Rescue',
'Tenue de Héros':'Hero Costume','Tenue de tous les jours':'Casual Outfit'
};
const phrase=[
[/Augmente la défense considérablement pendant un certain temps, rendant presque invulnérable aux attaques physiques\.?/gi,'Greatly increases defense for a limited time, making the user nearly invulnerable to physical attacks.'],
[/Augmente la défense de toute l'équipe\.?/gi,'Increases the entire team’s defense.'],
[/Augmente la puissance d'attaque de toute l'équipe\.?/gi,'Increases the entire team’s attack power.'],
[/Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié\.?/gi,'The more teammates with the same role, the stronger the effect.'],
[/Se rue sur l'adversaire pour lui asséner un coup de poing surpuissant\.?/gi,'Rushes the opponent and delivers an extremely powerful punch.'],
[/Fait jaillir des piques rocheux depuis les murs ou le sol dans la direction visée\.?/gi,'Creates rock spikes from walls or the ground in the aimed direction.'],
[/Envoie une onde rocheuse au sol vers l'avant\. Immobilise les ennemis touchés\.?/gi,'Sends a rocky wave forward along the ground and immobilizes enemies hit.'],
[/régénère tous les PG et PV des alliés proches/gi,'restores all GP and HP of nearby allies'],
[/Maintenir la commande régénère ses propres PG et PV/gi,'Holding the command restores the user’s own GP and HP'],
[/projette les ennemis à proximité/gi,'knocks away nearby enemies'],
[/Dégâts/gi,'Damage'],[/Munitions/gi,'Ammo'],[/Consommation/gi,'Consumption'],[/Recharge/gi,'Reload'],
[/Niveau/gi,'Level'],[/Effets de montée/gi,'Level-up Effects'],[/Valeurs Action spéciale/gi,'Special Action Values'],
[/Valeurs action spéciale/gi,'Special Action Values'],[/Défense/gi,'Defense'],[/Puissance d'attaque/gi,'Attack Power'],
[/Vitesse de rechargement/gi,'Reload Speed'],[/Portée/gi,'Range'],[/Taille/gi,'Size'],[/Durée/gi,'Duration'],
[/PV Max/gi,'Max HP'],[/PG Max/gi,'Max GP'],[/Hauteur saut vertical/gi,'Vertical Jump Height'],[/Vitesse de course/gi,'Running Speed'],
[/Alter/gi,'Quirk Skill'],[/Héros/gi,'Heroes'],[/Vilain/gi,'Villain']
];
function trFallback(v){
  let s=String(v??'');
  if(!en())return s;
  if(exact[s])return exact[s];
  phrase.forEach(([a,b])=>s=s.replace(a,b));
  return s;
}
const oldLabel=window.label;
window.label=function(v){
  if(!en())return oldLabel?oldLabel(v):String(v??'');
  if(v&&typeof v==='object'){
    const e=String(v.en??'').trim(), f=String(v.fr??'').trim();
    return trFallback(e&&e!==f?e:f);
  }
  return trFallback(oldLabel?oldLabel(v):v);
};
window.MHUR_TRANSLATE_GAME_TEXT=trFallback;

// Always repaint after a language switch.
const oldSetLang=window.setLang;
if(typeof oldSetLang==='function')window.setLang=function(...a){const r=oldSetLang.apply(this,a);setTimeout(()=>{dedupeYoungAFO();try{render()}catch(_){}},0);return r};

// No costume descriptions.
function stripCostumeDescriptions(){
 document.querySelectorAll('.costumeInfoBox p,.costumeNotes,.costumeDescription').forEach(x=>x.remove());
}
const mo=new MutationObserver(stripCostumeDescriptions);mo.observe(document.documentElement,{subtree:true,childList:true});stripCostumeDescriptions();

// Exclude all own-character tunings in costume and recommended-build pickers too.
if(typeof compatibleTunings==='function'){
 const base=compatibleTunings;
 window.compatibleTunings=function(color,kind,condition){
   const list=base(color,kind,condition)||[];
   let cid='';
   try{cid=(window.CB_STATE?.draft?.characterId)||selectedChar||''}catch(_){}
   if(!cid)return list;
   const ch=characters.find(c=>c.id===cid); if(!ch)return list;
   const keys=new Set((ch.styles||[]).map(String)); const name=String(ch.name||'').toLowerCase();
   return list.filter(t=>!keys.has(String(t.styleKey||''))&&String(t.character||'').toLowerCase()!==name);
 };
}
})();
