/* MHUR France V354 — traductions complètes, costumes, T.U.N.I.N.G, AFO jeune */
(function(){
'use strict';

const isEn=()=>typeof lang!=='undefined'&&lang==='en';
const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return v}};
const frOf=v=>typeof v==='object'&&v!==null?(v.fr??v.en??''):String(v??'');
const enOf=v=>typeof v==='object'&&v!==null?(v.en??''):'';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const exactText={
  'Original':'Original','Assaut':'Assault','Attaque':'Strike','Vitesse':'Rapid','Technique':'Technical','Soutien':'Support',
  'Héros':'Heroes','HÉROS':'HEROES','Vilain':'Villain','SUPER-VILAIN':'VILLAIN','SUPER-VILAINS':'VILLAINS','Tous':'All','Toutes':'All',
  'Compétence':'Skill','COMPÉTENCE':'SKILL','Action spéciale':'Special Action','Valeurs Action spéciale':'Special Action Values',
  'Niveau':'Level','Effet':'Effect','Dégâts':'Damage','Munitions':'Ammo','Consommation':'Use Ammo','Recharge':'Reload',
  'Type':'Type','Portée':'Range','Taille':'Size','Durée':'Duration','PV':'HP','PG':'GP','Rôle':'Role','Style':'Style',
  'Filtres costumes':'Costume Filters','Rareté':'Rarity','SP rapide':'Quick SP','SP gauche':'Left SP','SP droite':'Right SP',
  'Condition droite':'Right Condition','Réinitialiser':'Reset','Résumé slots':'Slot Summary','T.U.N.I.N.G compatibles':'Compatible T.U.N.I.N.G',
  'Compétence T.U.N.I.N.G SP gauche':'Left SP T.U.N.I.N.G Skill','Compétence T.U.N.I.N.G SP droite':'Right SP T.U.N.I.N.G Skill',
  'Disponible selon la couleur du slot gauche':'Available according to the left slot color',
  'Disponible selon la couleur du slot droite':'Available according to the right slot color',
  'Choix compatible':'Compatible Choice','Aucun T.U.N.I.N.G compatible.':'No compatible T.U.N.I.N.G.',
  'Tenue de Héros':'Hero Costume','Tenue ordinaire':'Casual Outfit','Tenue de tous les jours':'Casual Outfit',
  'Super-vilain':'Villain','D\'enfer':'Infernal','Élégant':'Elegant','Dangereux':'Dangerous','Combat':'Combat',
  'Cœur vaillant':'Valiant Heart','Revêtement intégral à 100 %':'Full Cowling 100%','Guerrier enragé':'Red Riot',
  'Zéro satellites':'Zero Satellites','Précipice de la mort':'Blighted Precipice','Feu frénétique':'Crazy Torch',
  'Multi-facteurs':'Factor Fusion','Jeune':'Young','All For One jeune':'Young All For One'
};
const replacements=[
  [/Effets de montée/gi,'Level-up Effects'],[/Valeurs supplémentaires/gi,'Additional Values'],[/Valeurs de base/gi,'Base Values'],
  [/Valeurs Action spéciale/gi,'Special Action Values'],[/Valeurs action spéciale/gi,'Special Action Values'],[/Action spéciale/gi,'Special Action'],
  [/Vitesse de rechargement/gi,'Reload Speed'],[/Vitesse de déplacement/gi,'Movement Speed'],[/Vitesse de course/gi,'Running Speed'],
  [/Puissance d['’]attaque/gi,'Attack Power'],[/Défense de l['’]Alter/gi,'Quirk Skill Defense'],[/Attaque de l['’]Alter/gi,'Quirk Skill Attack'],
  [/Rechargement de l['’]Alter/gi,'Quirk Skill Reload'],[/Hauteur saut vertical/gi,'Vertical Jump Height'],[/Hauteur saut en avant/gi,'Forward Jump Height'],
  [/Dégâts continus/gi,'Continuous Damage'],[/Dégâts/gi,'Damage'],[/Munitions/gi,'Ammo'],[/Consommation/gi,'Use Ammo'],[/Recharge/gi,'Reload'],
  [/Niveau/gi,'Level'],[/Effet/gi,'Effect'],[/Portée/gi,'Range'],[/Taille/gi,'Size'],[/Durée/gi,'Duration'],
  [/PV Max/gi,'Max HP'],[/PG Max/gi,'Max GP'],[/Défense PV/gi,'HP Defense'],[/Défense PG/gi,'GP Defense'],[/Attaque PG/gi,'GP Attack'],
  [/Réduit les dégâts subis/gi,'Decreases damage taken'],[/Augmente les dégâts infligés/gi,'Increases damage dealt'],
  [/Augmente la défense/gi,'Increases defense'],[/Augmente la puissance d['’]attaque/gi,'Increases attack power'],
  [/Augmente les PV/gi,'Increases HP'],[/Augmente les PG/gi,'Increases GP'],[/Régénère/gi,'Restores'],[/Réanim/gi,'Revive'],
  [/Héros/gi,'Heroes'],[/Super-vilains?/gi,'Villains'],[/Vilain/gi,'Villain'],[/Alter/gi,'Quirk Skill'],
  [/Compétence/gi,'Skill'],[/Rôle/gi,'Role'],[/Tenue de Cyber-héros/gi,'Cyber Hero Costume'],[/Tenue de Super-vilain/gi,'Villain Costume'],[/Tenue de Héros/gi,'Hero Costume'],[/Tenue ordinaire/gi,'Casual Outfit'],[/Tenue de tous les jours/gi,'Everyday Outfit'],[/Style décontracté/gi,'Casual Style'],
  [/Super-vilain/gi,'Villain'],[/Élégant/gi,'Elegant'],[/Dangereux/gi,'Dangerous'],[/D['’]enfer/gi,'Infernal'],
  [/Condition/gi,'Condition'],[/gauche/gi,'left'],[/droite/gi,'right'],[/Toutes/gi,'All'],[/Tous/gi,'All']
];
function translateText(value){
  let s=String(value??'');
  if(!isEn())return s;
  if(exactText[s]!==undefined)return exactText[s];
  for(const [a,b] of replacements)s=s.replace(a,b);
  return s;
}
function looksFrench(s){return /[àâçéèêëîïôûùüÿœ]|\b(le|la|les|des|du|de|une|un|dans|avec|pour|sur|ennemi|allié|attaque|défense|permet|augmente|réduit|lance|frappe|crée|maintenir|appuyer)\b/i.test(String(s||''));}
function englishValue(value,fallback=''){
  const en=String(enOf(value)||'').trim();
  const fr=String(frOf(value)||'').trim();
  if(en&&en!==fr&&!looksFrench(en))return en;
  const translated=translateText(fr);
  if(translated&&translated!==fr&&!looksFrench(translated))return translated;
  return fallback||translated||fr;
}
window.MHUR_TRANSLATE_GAME_TEXT=translateText;

const costumeExact={
  'Tenue de Héros':'Hero Costume','Tenue ordinaire':'Casual Outfit','Tenue de tous les jours':'Casual Outfit',
  'Tenue de ville':'Street Clothes','Uniforme de lycée':'High School Uniform','Tenue de combat':'Combat Costume',
  'Costume de héros':'Hero Costume','Costume de vilain':'Villain Costume','Tenue de l’autre monde':'Otherworld Costume',
  'Cœur vaillant':'Valiant Heart','Revêtement intégral à 100 %':'Full Cowling 100%',
  'Tenue de Héros : version Gran Torino':'Hero Costume: Gran Torino Version',
  'Original':'Original','Super-vilain':'Villain','D\'enfer':'Infernal','Combat':'Combat','Élégant':'Elegant','Dangereux':'Dangerous',
  'Noël':'Christmas','Halloween':'Halloween','Festival':'Festival','Décontracté':'Casual','Hiver':'Winter','Été':'Summer'
};
const costumeGroupExact={"Tenue de Héros":"Hero Costume","Tenue de Cyber-héros":"Cyber Hero Costume","Tenue ordinaire":"Casual Outfit","Tenue de l'autre monde":"Otherworld Costume","Cœur vaillant":"Valiant Heart","Style décontracté":"Casual Style","Tenue de Super-vilain":"Villain Costume","Cyberpunk":"Cyberpunk","Tenue de Kung-fu":"Kung Fu Outfit","Yukata":"Yukata","Tenue de héros":"Hero Costume","Tenue de Noël":"Christmas Outfit","Uniforme d'antan":"Old-Fashioned Uniform","Tenue de soutien d'Alters":"Quirk Support Costume","Tenue de festival":"Festival Outfit","Kunoichi":"Kunoichi","Shinobi":"Shinobi","Volontariat":"Volunteer Outfit","Tenue sportive Yuei":"U.A. Sports Uniform","Costume formel":"Formal Suit","Costume de l’Alliance des Super-vilains":"League of Villains Costume","Tenue de soirée":"Evening Wear","Happi":"Happi","Fan d'aventure":"Adventure Fan","Skull-vilain":"Skull Villain","Tenue de tous les jours":"Everyday Outfit","Tenue d'été Yuei":"U.A. Summer Uniform","Jimbei":"Jinbei","Carte à jouer : Valet de pique":"Playing Card: Jack of Spades","Robe chinoise":"Chinese Dress","Superstar Idol":"Superstar Idol","Festival des héros ver.2019":"Hero Festival Ver. 2019","Jour de repos":"Day Off","Break Code":"Break Code","Tenue des Sables brûlants":"Scorching Sands Outfit","Tenue de Héros : version α":"Hero Costume: Version α","Tenue de Héros : version β":"Hero Costume: Version β","Pirate ennemi":"Enemy Pirate","Loisirs d'été":"Summer Leisure","Sans masque":"Unmasked","Style cuir":"Leather Style","À visage découvert":"Unmasked","Revêtement intégral à 100 %":"Full Cowling 100%","Costume ε":"Costume ε","One For All ver. Bataille décisive":"One For All Ver. Decisive Battle","Tenue de soutien d'Alters OFA":"OFA Quirk Support Costume","Carte a jouer : Valet de trèfle":"Playing Card: Jack of Clubs","Tenue de Héros : version hiver":"Hero Costume: Winter Version","Tenue de Héros : version All Might":"Hero Costume: All Might Version","Superstar idol":"Superstar Idol","Sans casque":"Helmetless","Tenue Jiangshi":"Jiangshi Outfit","Sans masque : version α":"Unmasked: Version α","Unbreakable":"Unbreakable","Armure abyssale":"Abyssal Armor","Sans lunettes":"No Glasses","Armure céleste":"Celestial Armor","Clown":"Clown","Tenue d'hiver Yuei":"U.A. Winter Uniform","Tenue de Miss":"Pageant Dress","Costume de soutien":"Support Costume","Seigneur invincible":"Invincible Lord","Tenue de Héros ver. métallique":"Hero Costume Ver. Metallic","Tenue de Héros ver. camouflage":"Hero Costume Ver. Camouflage","Tenue de Héros ver. endommagée":"Hero Costume Ver. Damaged","Plaqués en arrière":"Slicked Back","Seigneur calme":"Calm Lord","Seigneur tumultueux":"Tempestuous Lord","Un proviseur qui ne lâche rien":"Relentless Principal","Seigneur du feu ardent":"Blazing Fire Lord","Seigneur des bourrasques":"Gale Lord","Tenue de Héros ver. Bataille décisive":"Hero Costume Ver. Decisive Battle","Tenue d'entraînement":"Training Outfit","Carte à jouer : Dame de cœur":"Playing Card: Queen of Hearts","Éveil":"Awakening","Déguisement : long manteau":"Disguise: Long Coat","Transcendance":"Transcendence","Chevalier du mal":"Evil Knight","Évadé de prison":"Prison Escapee","Tenue de Super-vilain avec masque ver. β":"Masked Villain Costume Ver. β","Chevalier diabolique":"Diabolical Knight","Tenue de Super-vilain ver. Standard":"Villain Costume Ver. Standard","Tenue de Super-vilain ver. Rembobinée":"Villain Costume Ver. Rewound","Tenue de Super-vilain : cheveux blancs":"Villain Costume: White Hair","Déguisement : Sweat":"Disguise: Sweatshirt","Assassin vengeur":"Vengeful Assassin","Déguisement : Kemi":"Disguise: Kemi","Déguisement : Tenue de réunion":"Disguise: Meeting Outfit","Déguisement : Duffle-coat":"Disguise: Duffle Coat","Uniforme : Usé":"Uniform: Worn","Déguisement sac en papier":"Paper Bag Disguise","Déguisement : Tricot":"Disguise: Knitwear","Seigneur de mauvais augure":"Ominous Lord","Blouse d'hôpital":"Hospital Gown","Alter Fusion":"Quirk Fusion","Costume à rayures":"Pinstripe Suit","Costume de soirée":"Evening Suit","Costume pour les visites à domicile":"House Call Costume","Costume de Super-vilain":"Villain Costume","Sous la capuche":"Under the Hood","Tenue de Super-vilain : version α":"Villain Costume: Version α","Tenue de Super-vilain : avec mouchoir":"Villain Costume: With Handkerchief","Tenue d’été Yuei":"U.A. Summer Uniform","Assassin nocturne":"Nocturnal Assassin","Majordome":"Butler","Style cuir ver. OFA":"Leather Style Ver. OFA","Costume pour les 100 millions de tomes vendus":"100 Million Volumes Sold Costume","Tenue sportive Yuei : version Tenya":"U.A. Sports Uniform: Tenya Version","Tenue de Héros avec bandages":"Hero Costume with Bandages","Costume de Dieu Sylvestre":"Forest God Costume","Tenue de Héros : version Gran Torino":"Hero Costume: Gran Torino Version","Survêtement":"Tracksuit","Tenue de sport Yuei":"U.A. Sportswear","Manteau de Super-vilain":"Villain Coat","Costume sans cravate":"Tie-less Suit","Shoot Style":"Shoot Style","Pour les 100 millions de tomes vendus":"For 100 Million Volumes Sold","Cauchemar Mineta":"Mineta Nightmare","Tenue de Héros : sans une égratignure":"Hero Costume: Unscathed"};
const costumeVariantExact={"Original":"Original","D'enfer":"Infernal","Combat":"Combat","Dangereux":"Dangerous","Élégant":"Elegant","Super-vilain":"Villain","Ver. Héros":"Hero Ver.","Bleu foncé":"Dark Blue","Ardent":"Blazing","Marin":"Navy","Horizon":"Horizon","Orange":"Orange","Noir":"Black","Rose":"Pink","Érable":"Maple","Citronnelle":"Lemongrass","Viola":"Viola","Écarlate":"Scarlet","Abricot":"Apricot","Mimosa":"Mimosa","Renoncule":"Buttercup","Bleu ciel":"Sky Blue","Crépuscule":"Twilight","Vert":"Green","Acier Ambre":"Amber Steel","Chrome Saphir":"Sapphire Chrome","Fer rubis":"Ruby Iron","Metal Emeraude":"Emerald Metal","Opale dorée":"Golden Opal"};
const costumeReplacements=[
  [/Tenue de Cyber-héros/gi,'Cyber Hero Costume'],[/Tenue de Super-vilain/gi,'Villain Costume'],[/Tenue de Héros/gi,'Hero Costume'],[/Tenue ordinaire/gi,'Casual Outfit'],[/Tenue de tous les jours/gi,'Everyday Outfit'],[/Style décontracté/gi,'Casual Style'],[/Tenue de tous les jours/gi,'Casual Outfit'],
  [/Tenue de ville/gi,'Street Clothes'],[/Uniforme de lycée/gi,'High School Uniform'],[/Tenue de combat/gi,'Combat Costume'],
  [/Costume de héros/gi,'Hero Costume'],[/Costume formel/gi,'Formal Suit'],[/Costume de soirée/gi,'Evening Suit'],[/Costume de soutien/gi,'Support Costume'],[/Costume de vilain/gi,'Villain Costume'],[/version/gi,'Version'],
  [/Super-vilain/gi,'Villain'],[/D['’]enfer/gi,'Infernal'],[/Élégant/gi,'Elegant'],[/Dangereux/gi,'Dangerous'],
  [/Décontracté/gi,'Casual'],[/Sans masque/gi,'Unmasked'],[/Sans casque/gi,'Helmetless'],[/Sans lunettes/gi,'No Glasses'],[/Hiver/gi,'Winter'],[/Été/gi,'Summer'],[/Anniversaire/gi,'Anniversary'],[/Fête/gi,'Festival']
];
function translateCostumeText(value){
  let s=String(value??'');
  if(!isEn())return s;
  if(costumeGroupExact[s]!==undefined)return costumeGroupExact[s];
  if(costumeVariantExact[s]!==undefined)return costumeVariantExact[s];
  if(costumeExact[s]!==undefined)return costumeExact[s];
  for(const [a,b] of costumeReplacements)s=s.replace(a,b);
  return s;
}
window.MHUR_TRANSLATE_COSTUME_TEXT=translateCostumeText;

function exactData(){
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el)return {};
  try{return JSON.parse(el.textContent||'{}')}catch(_){return {}}
}
const DATA=exactData();
function remoteForStyle(key){
  if(DATA.exact_by_style?.[key])return DATA.exact_by_style[key];
  if(key==='all_for_one_young_assault')return (DATA.characters||[]).find(x=>/\/character\/201(?:#|$)/.test(String(x.source_url||'')))||null;
  return null;
}
function remember(obj,key){
  if(!obj||typeof obj!=='object')return;
  if(!Object.prototype.hasOwnProperty.call(obj,'__v354Original')){
    Object.defineProperty(obj,'__v354Original',{value:{},writable:true,configurable:true,enumerable:false});
  }
  if(!Object.prototype.hasOwnProperty.call(obj.__v354Original,key))obj.__v354Original[key]=clone(obj[key]);
}
function restore(obj,key){if(obj?.__v354Original&&Object.prototype.hasOwnProperty.call(obj.__v354Original,key))obj[key]=clone(obj.__v354Original[key]);}
const roleEnglish={assault:'Increases the entire team’s defense. The effect grows when more teammates use the same role.',strike:'Increases the entire team’s attack power. The effect grows when more teammates use the same role.',rapid:'Increases the entire team’s movement speed. The effect grows when more teammates use the same role.',technical:'Increases the entire team’s reload speed. The effect grows when more teammates use the same role.',support:'Increases the entire team’s recovery effects. The effect grows when more teammates use the same role.'};
function applySkillLanguage(local,remote,charName){
  if(!local)return;
  for(const key of ['name','desc','tables'])remember(local,key);
  if(!isEn()){for(const key of ['name','desc','tables'])restore(local,key);if(local.sub)applySkillLanguage(local.sub,null,charName);return;}
  const rn=String(remote?.name||'').trim();
  local.name=rn||englishValue(local.__v354Original.name,`${charName} skill`);
  const rd=String(remote?.description||'').trim();
  const usefulRemoteDesc=rd&&!looksFrench(rd)&&rd.toLowerCase()!==String(rn||'').toLowerCase()?rd:'';
  local.desc=usefulRemoteDesc||englishValue(local.__v354Original.desc,`${local.name} is one of ${charName}’s Quirk Skills.`);
  local.tables=(clone(local.__v354Original.tables)||[]).map(tb=>({
    ...tb,
    title:translateText(tb.title),
    cols:(tb.cols||[]).map(translateText),
    rows:(tb.rows||[]).map(row=>row.map(translateText))
  }));
  if(local.sub)applySkillLanguage(local.sub,null,charName);
}
function applyCharacterLanguage(){
  if(typeof characters==='undefined')return;
  characters.forEach(c=>{
    remember(c,'name');
    if(!isEn())restore(c,'name');
    else if(c.id==='all_for_one_young')c.name='Young All For One';
  });
}
function applyStyleLanguage(){
  if(typeof styles==='undefined')return;
  Object.entries(styles).forEach(([key,st])=>{
    if(!st)return;
    const remote=remoteForStyle(key);
    const char=(typeof characters!=='undefined'&&characters.find(c=>(c.styles||[]).includes(key)))||{};
    const charName=remote?.base_name||remote?.name||char.name||'Character';
    for(const prop of ['name','description','roleDesc'])remember(st,prop);
    if(!isEn()){
      for(const prop of ['name','description','roleDesc'])restore(st,prop);
    }else{
      st.name=String(remote?.style_name||'').trim()||englishValue(st.__v354Original.name,'Original');
      st.description=englishValue(st.__v354Original.description,`Official ${st.name} style for ${charName}.`);
      st.roleDesc=englishValue(st.__v354Original.roleDesc,roleEnglish[st.role]||'Team role effect.');
    }
    if(st.special){
      for(const prop of ['name','desc','tables'])remember(st.special,prop);
      if(!isEn())for(const prop of ['name','desc','tables'])restore(st.special,prop);
      else{
        st.special.name=englishValue(st.special.__v354Original.name,'Special Action');
        st.special.desc=englishValue(st.special.__v354Original.desc,`Special action used by ${charName}.`);
        st.special.tables=(clone(st.special.__v354Original.tables)||[]).map(tb=>({...tb,title:translateText(tb.title),cols:(tb.cols||[]).map(translateText),rows:(tb.rows||[]).map(r=>r.map(translateText))}));
      }
    }
    (st.skills||[]).forEach((sk,i)=>applySkillLanguage(sk,remote?.skills?.[sk.letter]||remote?.skills?.[['α','β','γ'][i]],charName));
  });
}
function applyTuningLanguage(){
  if(typeof tunings==='undefined')return;
  Object.entries(tunings).forEach(([styleKey,list])=>{
    const remote=remoteForStyle(styleKey)||{};
    const normals=remote.normal_tuning||[];
    (list||[]).forEach(t=>{
      for(const prop of ['name','desc','effects'])remember(t,prop);
      if(!isEn()){
        for(const prop of ['name','desc','effects'])restore(t,prop);
        return;
      }
      if(t.type==='SP'){
        const r=remote.special_tuning||{};
        t.name=String(r.name||'').trim()||englishValue(t.__v354Original.name,'Special T.U.N.I.N.G');
        t.desc=String(r.description||'').trim()||englishValue(t.__v354Original.desc,'Special T.U.N.I.N.G effect.');
      }else if(normals.length){
        t.name=normals.map(x=>x.name).filter(Boolean).join(', ')||englishValue(t.__v354Original.name);
        t.desc=normals.map(x=>x.description).filter(Boolean).join('<br><br>')||englishValue(t.__v354Original.desc);
        if(Array.isArray(t.__v354Original.effects)){
          t.effects=t.__v354Original.effects.map((e,i)=>({
            ...e,
            name:normals[i]?.name||englishValue(e.name),
            desc:normals[i]?.description||englishValue(e.desc)
          }));
        }
      }else{
        t.name=englishValue(t.__v354Original.name);
        t.desc=englishValue(t.__v354Original.desc);
        if(Array.isArray(t.__v354Original.effects))t.effects=t.__v354Original.effects.map(e=>({...e,name:englishValue(e.name),desc:englishValue(e.desc)}));
      }
    });
  });
}

function dedupeYoungAFO(){
  try{
    if(typeof characters!=='undefined'&&Array.isArray(characters)){
      for(let i=characters.length-1;i>=0;i--){
        const c=characters[i]||{};
        if(c.id==='all_for_one_youth_age'||(String(c.name||'').toLowerCase().includes('all for one')&&/youth age/.test(String(c.name||'').toLowerCase())))characters.splice(i,1);
      }
      const existing=characters.find(c=>c.id==='all_for_one_young');
      if(existing)existing.styles=[...new Set((existing.styles||[]).filter(k=>k!=='all_for_one_youth_age_youth_age'))];
    }
    if(typeof styles!=='undefined')delete styles.all_for_one_youth_age_youth_age;
    if(typeof tunings!=='undefined')delete tunings.all_for_one_youth_age_youth_age;
  }catch(_){ }
}
function characterFamily(charId){const id=String(charId||'');return id==='midoriya'||id==='midoriya_ofa'?'midoriya':id;}
function tuningFamily(t){
  const key=String(t?.styleKey||'');
  if(['assault','fullbullet','ofa'].includes(key))return 'midoriya';
  const c=typeof characters!=='undefined'?characters.find(x=>(x.styles||[]).includes(key)):null;
  return characterFamily(c?.id||'');
}
function installTuningExclusion(){
  if(typeof compatibleTunings!=='function'||compatibleTunings.__v354)return;
  const base=compatibleTunings;
  const wrapped=function(color,kind,condition){
    const list=base.apply(this,arguments)||[];
    let charId='';
    try{charId=window.CB_STATE?.draft?.characterId||selectedChar||''}catch(_){ }
    const family=characterFamily(charId);
    return family?list.filter(t=>tuningFamily(t)!==family):list;
  };
  wrapped.__v354=true;
  compatibleTunings=wrapped;
}

function patchCostumeRenderers(){
  if(typeof costumeCard==='function'&&!costumeCard.__v354){
    const old=costumeCard;
    const fn=function(ct){
      const view={...ct,group:translateCostumeText(ct?.group||''),name:translateCostumeText(ct?.name||''),variant:translateCostumeText(ct?.variant||''),notes:''};
      return old(view);
    };fn.__v354=true;costumeCard=fn;
  }
  if(typeof costumeGalleryGroup==='function'&&!costumeGalleryGroup.__v354){
    const old=costumeGalleryGroup;
    const fn=function(g){return old({...g,group:translateCostumeText(g?.group||''),variants:(g?.variants||[]).map(v=>({...v,variant:translateCostumeText(v.variant||''),group:translateCostumeText(v.group||g.group||''),notes:''}))})};
    fn.__v354=true;costumeGalleryGroup=fn;
  }
  if(typeof costumeTuningDetail==='function'&&!costumeTuningDetail.__v354){
    const old=costumeTuningDetail;
    const fn=function(ct){return old({...ct,name:translateCostumeText(ct?.name||ct?.group||''),group:translateCostumeText(ct?.group||''),variant:translateCostumeText(ct?.variant||''),notes:''})};
    fn.__v354=true;costumeTuningDetail=fn;
  }
}

function cleanSkillBadges(){
  document.querySelectorAll('.skillText').forEach(box=>{
    const badges=[...box.querySelectorAll(':scope > .skillTypeBadge')];
    badges.forEach((b,i)=>{if(i>0)b.remove();else b.textContent=isEn()?'SKILL':'COMPÉTENCE'});
  });
}
const uiExact={
  'Filtres costumes':'Costume Filters','Rareté':'Rarity','T.U.N.I.N.G SP rapide':'Quick SP T.U.N.I.N.G','SP gauche':'Left SP','SP droite':'Right SP',
  'Condition droite':'Right Condition','Réinitialiser':'Reset','Tu peux combiner la rareté, les deux emplacements SP et la condition Héros/Vilain.':'You can combine rarity, both SP slots, and the Hero/Villain condition.',
  'Résumé slots':'Slot Summary','Compétence T.U.N.I.N.G SP gauche':'Left SP T.U.N.I.N.G Skill','Compétence T.U.N.I.N.G SP droite':'Right SP T.U.N.I.N.G Skill',
  'Disponible selon la couleur du slot gauche':'Available according to the left slot color','Disponible selon la couleur du slot droite':'Available according to the right slot color',
  'T.U.N.I.N.G compatibles':'Compatible T.U.N.I.N.G','T.U.N.I.N.G normal · Assaut':'Normal T.U.N.I.N.G · Assault',
  'Gauche':'Left','Droite':'Right','Supprimer le build':'Delete build','Aucune description.':'No description.','Actualiser':'Refresh','Plus aimés':'Most liked','Plus récents':'Most recent'
};
function translateUiNode(node){
  if(!node||!node.nodeValue)return;
  if(node.parentElement?.closest('script,style,textarea,[contenteditable="true"]'))return;
  if(node.__v354Fr===undefined)node.__v354Fr=node.nodeValue;
  if(!isEn()){node.nodeValue=node.__v354Fr;return;}
  const raw=node.__v354Fr;
  const lead=raw.match(/^\s*/)?.[0]||'',trail=raw.match(/\s*$/)?.[0]||'',core=raw.trim();
  if(!core)return;
  let out=uiExact[core]??translateText(core);
  node.nodeValue=lead+out+trail;
}
function translateUi(){
  const root=document.body||document.documentElement;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let n;while((n=walker.nextNode()))translateUiNode(n);
  cleanSkillBadges();
  document.querySelectorAll('.costumeInfoBox>p,.costumeNotes,.costumeDescription,.costumeMiniDesc').forEach(x=>x.remove());
}
function applyAll(){dedupeYoungAFO();applyCharacterLanguage();applyStyleLanguage();applyTuningLanguage();installTuningExclusion();patchCostumeRenderers();}

applyAll();
if(typeof render==='function'&&!render.__v354){
  const old=render;
  const fn=function(){applyAll();const result=old.apply(this,arguments);setTimeout(translateUi,0);return result};
  fn.__v354=true;render=fn;
}
if(typeof toggleLang==='function'&&!toggleLang.__v354){
  const old=toggleLang;
  const fn=function(){const result=old.apply(this,arguments);applyAll();if(typeof layout==='function')layout();setTimeout(translateUi,0);return result};
  fn.__v354=true;toggleLang=fn;
}
new MutationObserver(()=>translateUi()).observe(document.documentElement,{subtree:true,childList:true});
setTimeout(()=>{applyAll();if(typeof render==='function')render();translateUi()},0);
})();
