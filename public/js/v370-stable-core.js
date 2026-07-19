(function(){
'use strict';

const RELEASE='378';
window.MHUR_RELEASE=RELEASE;
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const isEN=()=>{try{return typeof lang!=='undefined'&&lang==='en'}catch(_){return false}};
const tr=(fr,en)=>isEN()?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return v}};
const french=/[àâçéèêëîïôûùüÿœ]|(avec|pour|dans|sur|les|des|une|ennemi|allié|attaque|défense|permet|augmente|réduit|frappe|lance|crée|maintenir|appuyer|durée|dégâts|munitions|recharge)/i;

function exactData(){
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el)return {};
  try{return JSON.parse(el.textContent||'{}')}catch(e){console.warn('[V370 exact data]',e);return {}}
}
const DATA=exactData();
const REMOTE=DATA.exact_by_style||{};

const roleDescriptions={
  assault:'Increases the entire team’s defense. The effect grows when more teammates use the same role.',
  strike:'Increases the entire team’s attack power. The effect grows when more teammates use the same role.',
  rapid:'Increases the entire team’s movement speed. The effect grows when more teammates use the same role.',
  technical:'Increases the entire team’s reload speed. The effect grows when more teammates use the same role.',
  support:'Increases the entire team’s recovery effects. The effect grows when more teammates use the same role.'
};
const officialEnglishOverrides={
  momo_support:{
    description:'Create anything out of thin air except living things! Use the weapons and items you create to support your allies!',
    special:{name:"Yaoyorozu's Lucky Bag",description:"Creates Yaoyorozu's Lucky Bag and produces an item. If an ally is K.O.'d, it is guaranteed to contain a Revive Card."},
    skills:[
      {name:'Create: Strike and Stop',description:'Swings a blunt weapon she created, releasing shockwaves. Hold the button to continue attacking.'},
      {name:'Create: Unfalling Castle Wall',description:'Creates and places a shield in front of her. Hold the button to dash forward while guarding. The shield disappears over time or after taking enough damage.'},
      {name:'Create: Bullet Rain',description:'Places a cannon on the ground and fires explosive shells like fireworks.'}
    ]
  }
};
const exactGameText={
  'Assaut':'Assault','Attaque':'Strike','Vitesse':'Rapid','Technique':'Technical','Soutien':'Support',
  'Héros':'Hero','HÉROS':'HERO','Vilain':'Villain','SUPER-VILAIN':'VILLAIN','SUPER-VILAINS':'VILLAINS','Tous':'All','Toutes':'All',
  'Personnage jouable':'Playable character','Nouveau personnage':'New character','Nouveau style':'New style',
  'Guerrier enragé':'Raging Warrior','Bastion enragé':'Raging Bastion','Saut enragé':'Raging Leap',
  'Bourrasque nébuleuse':'Nebula Gale','Service comète':'Comet Home Run','Scène galactique':'Galactic Stage','Fracture pyroglaciaire':'Pyroglacial Fracture',
  'Feu frénétique':'Crazy Torch','Flammes enragées':'Raging Flames','Préceptes ardents':'Burning Precepts',
  'Fœhn glacial':'Glacial Foehn','Mur de glace céleste':'Heaven-Piercing Ice Wall','Chemin de glace':'Ice Path',
  'Éclair funèbre':'Thunder Sepulture','Annihilation':'Meteor Annihilation','Jugement divin':'Divine Judgment',
  'Durcissement':'Hardening','Flammes indéfectibles':'Unquenchable Flames','Gravité Zéro':'Zero Gravity','Transporter / Courir sur un mur':'Carry / Wall Run',
  'Action spéciale':'Special Action','Valeurs Action spéciale':'Special Action Values','Alter':'Quirk Skill',
  'Rôle':'Role','Style':'Style','Rareté':'Rarity','Niveau':'Level','Effet':'Effect','Dégâts':'Damage','Munitions':'Ammo','Consommation':'Use Ammo','Recharge':'Reload',
  'Aucun build pour ce style.':'No build for this style.','Sois le premier à en publier un.':'Be the first to publish one.',
  'Plus aimés':'Most liked','Plus récents':'Most recent','Actualiser':'Refresh','Communauté en ligne':'Community online',
  'Les builds et les cœurs sont partagés avec tous les visiteurs.':'Builds and likes are shared with all visitors.',
  'Aucun T.U.N.I.N.G renseigné pour ce style.':'No T.U.N.I.N.G data for this style.',
  'Personnage introuvable.':'Character not found.','Aucun style disponible.':'No style available.','À compléter':'To be completed'
};
const textReplacements=[
  [/Effets de montée/gi,'Level-up Effects'],[/Valeurs de base/gi,'Base Values'],[/Valeurs supplémentaires/gi,'Additional Values'],
  [/Valeurs Action spéciale/gi,'Special Action Values'],[/Action spéciale/gi,'Special Action'],[/Vitesse de rechargement/gi,'Reload Speed'],
  [/Vitesse de déplacement/gi,'Movement Speed'],[/Puissance d['’]attaque/gi,'Attack Power'],[/Défense de l['’]Alter/gi,'Quirk Skill Defense'],
  [/Attaque de l['’]Alter/gi,'Quirk Skill Attack'],[/Dégâts/gi,'Damage'],[/Munitions/gi,'Ammo'],[/Consommation/gi,'Use Ammo'],
  [/Recharge/gi,'Reload'],[/Niveau/gi,'Level'],[/Effet/gi,'Effect'],[/Portée/gi,'Range'],[/Taille/gi,'Size'],[/Durée/gi,'Duration'],
  [/Valeurs/gi,'Values'],[/mode visée/gi,'Aim Mode'],[/Distance courte/gi,'Short Range'],[/Distance moyenne/gi,'Medium Range'],[/Distance longue/gi,'Long Range'],
  [/au sol/gi,'Ground'],[/contact pendant la charge/gi,'Contact During Charge'],[/Maintenir/gi,'Hold'],[/Attaque aérienne/gi,'Aerial Attack'],[/supplémentaires/gi,'Additional'],
  [/Dégât initial/gi,'Initial Damage'],[/Plongée/gi,'Dive'],[/Impact au sol/gi,'Ground Impact'],[/Onde de choc au sol/gi,'Ground Shockwave'],
  [/Détermination de la cible/gi,'Target Detection'],[/Coup à Range maximale/gi,'Max-Range Hit'],[/Coup à portée maximale/gi,'Max-Range Hit'],[/Projectile renforcé/gi,'Enhanced Projectile'],
  [/Écrasement/gi,'Slam'],[/Dernier coup/gi,'Final Hit'],[/Brûlure/gi,'Burn'],[/Saisie aérienne/gi,'Aerial Grab'],[/Charge entravante/gi,'Binding Charge'],
  [/Exécuter de nouveau/gi,'Use Again'],[/Pilier/gi,'Pillar'],[/Corps à corps/gi,'Melee'],[/Rush aérien/gi,'Aerial Rush'],[/Rotation aérienne/gi,'Aerial Spin'],
  [/Première onde de choc/gi,'First Shockwave'],[/Deuxième onde de choc/gi,'Second Shockwave'],[/Appui court/gi,'Short Press'],[/À l['’]activation/gi,'On Activation'],
  [/Charge max/gi,'Max Charge'],[/Relâchement/gi,'Release'],[/Déploiement/gi,'Deployment'],[/accroupi/gi,'Crouching'],[/déployée/gi,'Deployed'],[/Sueur/gi,'Sweat'],
  [/Zone de lévitation/gi,'Levitation Zone'],[/Coup chargé/gi,'Charged Hit'],[/Onde de choc/gi,'Shockwave'],[/Finisher de charge/gi,'Charge Finisher'],
  [/spéciales/gi,'Special'],[/Spécial/gi,'Special'],[/Compétence/gi,'Skill'],[/Disponible selon la couleur du slot/gi,'Available according to the slot color'],[/Condition/gi,'Condition'],[/normal/gi,'Normal'],[/rapide/gi,'Quick'],[/Assaut/gi,'Assault'],[/Attaque/gi,'Strike'],[/Vitesse/gi,'Rapid'],[/Technique/gi,'Technical'],[/Soutien/gi,'Support'],[/Héros/gi,'Hero'],[/Vilain/gi,'Villain'],[/chargé/gi,'Charged'],[/déplacement/gi,'movement'],[/En mode visée/gi,'Aim Mode'],[/Sol/gi,'Ground'],[/balle/gi,'Bullet']
];
function englishGameText(value){
  let s=String(value??'');
  if(exactGameText[s]!==undefined)return exactGameText[s];
  for(const [rx,to] of textReplacements)s=s.replace(rx,to);
  return s;
}
function translateGameText(value){
  const s=String(value??'');
  return isEN()?englishGameText(s):s;
}

const costumeGroups={
  'Tenue de Héros':'Hero Costume','Tenue de héros':'Hero Costume','Tenue de Cyber-héros':'Cyber Hero Costume',
  'Tenue ordinaire':'Casual Outfit','Tenue de tous les jours':'Everyday Outfit','Tenue de l’autre monde':'Otherworld Outfit',"Tenue de l'autre monde":'Otherworld Outfit',
  'Cœur vaillant':'Undefeatable','Style décontracté':'Casual Style','Tenue de Super-vilain':'Villain Costume','Tenue de Kung-fu':'Kung Fu Outfit',
  'Tenue de Noël':'Christmas Outfit',"Uniforme d'antan":'Old-Fashioned Uniform',"Tenue de soutien d'Alters":'Quirk Support Outfit',
  'Tenue de festival':'Festival Outfit','Volontariat':'Volunteer Outfit','Tenue sportive Yuei':'U.A. Sports Uniform','Costume formel':'Formal Costume',
  'Tenue de soirée':'Evening Outfit',"Fan d'aventure":'Adventure Fan','Tenue d’été Yuei':'U.A. Summer Uniform',"Tenue d'été Yuei":'U.A. Summer Uniform',
  'Carte à jouer : Valet de pique':'Playing Card: Jack of Spades','Carte a jouer : Valet de trèfle':'Playing Card: Jack of Clubs',
  'Carte à jouer : Dame de cœur':'Playing Card: Queen of Hearts','Robe chinoise':'Chinese Dress','Jour de repos':'Day Off',
  'Tenue des Sables brûlants':'Scorching Sands Outfit','Tenue de Héros : version α':'Hero Costume: Alpha Ver.',
  'Tenue de Héros : version β':'Hero Costume: Beta Ver.','Pirate ennemi':'Enemy Pirate',"Loisirs d'été":'Summer Leisure',
  'Sans masque':'Maskless','Style cuir':'Leather Style','À visage découvert':'Unmasked','Revêtement intégral à 100 %':'100% Full Cowling',
  'Costume ε':'Costume Epsilon','One For All ver. Bataille décisive':'One For All: Decisive Battle Ver.',
  "Tenue de soutien d'Alters OFA":'OFA Quirk Support Outfit','Tenue de Héros : version hiver':'Hero Costume: Winter Ver.',
  'Tenue de Héros : version All Might':'Hero Costume: All Might Ver.','Sans casque':'Helmetless','Tenue Jiangshi':'Jiangshi Outfit',
  'Armure abyssale':'Abyssal Armor','Sans lunettes':'Without Glasses','Armure céleste':'Celestial Armor',"Tenue d'hiver Yuei":'U.A. Winter Uniform',
  'Tenue de Miss':'Pageant Outfit','Costume de soutien':'Support Costume','Tenue d’entraînement':'Training Outfit',"Tenue d'entraînement":'Training Outfit',
  'Déguisement : long manteau':'Disguise: Long Coat','Chevalier du mal':'Evil Knight','Évadé de prison':'Prison Escapee'
};
const costumeVariants={
  'Original':'Original','Super-vilain':'Villain Style','Vilain':'Villain Style',"D'enfer":'Heat','D’enfer':'Heat','Infernal':'Heat',
  'Élégant':'Fancy','Elegant':'Fancy','Ardent':'Burning','Combat':'Combat','Dangereux':'Dangerous','Bleu foncé':'Dark Blue',
  'Bleu ciel':'Sky Blue','Crépuscule':'Twilight','Érable':'Maple','Marin':'Navy','Citronnelle':'Lemongrass','Noir':'Black','Rose':'Pink',
  'Orange':'Orange','Horizon':'Horizon','Jaune':'Yellow','Rouge':'Red','Vert':'Green','Violet':'Purple','Blanc':'White','Argent':'Silver','Or':'Gold'
};
function translateCostume(value){
  const s=String(value??'');
  if(!isEN())return s;
  if(costumeGroups[s]!==undefined)return costumeGroups[s];
  if(costumeVariants[s]!==undefined)return costumeVariants[s];
  return s.replace(/Tenue de Héros/gi,'Hero Costume').replace(/Tenue de Super-vilain/gi,'Villain Costume').replace(/Super-vilain/gi,'Villain Style').replace(/Élégant/gi,'Fancy').replace(/D['’]enfer/gi,'Heat').replace(/Ardent/gi,'Burning').replace(/Bleu foncé/gi,'Dark Blue').replace(/Bleu ciel/gi,'Sky Blue');
}
window.MHUR_TRANSLATE_GAME_TEXT=translateGameText;
window.MHUR_TRANSLATE_COSTUME_TEXT=translateCostume;

function makeBilingual(value,en){
  const fr=typeof value==='object'&&value!==null?String(value.fr??value.en??''):String(value??'');
  return {fr,en:String(en||fr||'')};
}
function usefulEnglish(value){const s=String(value||'').trim();return s&&!french.test(s)?s:''}
function fillEnglishData(){
  if(typeof styles==='undefined'||typeof characters==='undefined')return;
  for(const [key,st] of Object.entries(styles)){
    if(!st)continue;
    const remote=REMOTE[key]||{};
    const override=officialEnglishOverrides[key]||{};
    const ch=characters.find(c=>(c.styles||[]).includes(key))||{};
    const charName=remote.base_name||remote.name||ch.name||'Character';
    const styleName=usefulEnglish(remote.style_name)||usefulEnglish(st.name?.en)||englishGameText(st.name?.fr||st.name||'Original');
    st.name=makeBilingual(st.name,styleName||'Original');
    const localDescription=typeof st.description==='object'?st.description.en:'';
    st.description=makeBilingual(st.description,override.description||usefulEnglish(localDescription)||usefulEnglish(remote.description)||'');
    st.roleDesc=makeBilingual(st.roleDesc,roleDescriptions[st.role]||'Applies this role’s team bonus.');
    if(st.special){
      const rawSpecial=String(st.special.name?.fr||st.special.name||'Special Action');
      const translatedSpecial=englishGameText(rawSpecial);
      const specialName=override.special?.name||(translatedSpecial!==rawSpecial?translatedSpecial:'')||usefulEnglish(st.special.name?.en)||translatedSpecial;
      st.special.name=makeBilingual(st.special.name,usefulEnglish(specialName)||'Special Action');
      const remoteSpecialDesc=usefulEnglish(remote.special_action?.description);
      const specialDesc=override.special?.description||usefulEnglish(st.special.desc?.en)||remoteSpecialDesc||'';
      st.special.desc=makeBilingual(st.special.desc,specialDesc);
      if(Array.isArray(st.special.tables))st.special.tables=st.special.tables.map(tb=>({...tb,title:translateGameText(tb.title),cols:(tb.cols||[]).map(translateGameText),rows:(tb.rows||[]).map(r=>(r||[]).map(translateGameText))}));
    }
    const remoteSkills=remote.skills||{};
    (st.skills||[]).forEach((sk,i)=>{
      const r=remoteSkills[sk.letter]||remoteSkills[['α','β','γ'][i]]||{};
      const skillOverride=Array.isArray(override.skills)?(override.skills[i]||{}):(override.skills?.[sk.letter]||{});
      const official=skillOverride.name||usefulEnglish(r.name)||usefulEnglish(sk.name?.en)||englishGameText(sk.name?.fr||sk.name||`${charName} Skill`);
      sk.name=makeBilingual(sk.name,official||`${charName} Skill`);
      const remoteDesc=usefulEnglish(r.description)&&String(r.description).trim().toLowerCase()!==String(r.name||'').trim().toLowerCase()?String(r.description).trim():'';
      const localEn=usefulEnglish(sk.desc?.en);
      sk.desc=makeBilingual(sk.desc,skillOverride.description||remoteDesc||localEn||'');
      if(Array.isArray(sk.tables))sk.tables=sk.tables.map(tb=>({...tb,title:translateGameText(tb.title),cols:(tb.cols||[]).map(translateGameText),rows:(tb.rows||[]).map(rw=>(rw||[]).map(translateGameText))}));
      if(sk.sub){
        const rawSub=String(sk.sub.name?.fr||sk.sub.name||'Follow-up Skill');
        const translatedSub=englishGameText(rawSub);
        const subName=(translatedSub!==rawSub?translatedSub:'')||usefulEnglish(sk.sub.name?.en)||translatedSub;
        sk.sub.name=makeBilingual(sk.sub.name,subName||'Follow-up Skill');
        sk.sub.desc=makeBilingual(sk.sub.desc,usefulEnglish(sk.sub.desc?.en)||'');
      }
    });
  }
  if(typeof tunings!=='undefined'){
    const raw=v=>typeof v==='object'&&v!==null?String(v.fr??v.en??''):String(v??'');
    for(const [styleKey,list] of Object.entries(tunings)){
      const remote=REMOTE[styleKey]||{};
      const normal=remote.normal_tuning||[];
      (list||[]).forEach(t=>{
        if(!t.__v370I18n){
          const frName=raw(t.name),frDesc=raw(t.desc);
          const rt=t.type==='SP'?(remote.special_tuning||{}):{};
          const enName=t.type==='SP'?(usefulEnglish(rt.name)||'Special T.U.N.I.N.G'):(normal.map(x=>x.name).filter(Boolean).join(' / ')||'Normal T.U.N.I.N.G');
          const enDesc=t.type==='SP'?(usefulEnglish(rt.description)||'Activates a special T.U.N.I.N.G effect.'):(normal.map(x=>x.description).filter(Boolean).join('<br><br>')||'Normal T.U.N.I.N.G effects.');
          Object.defineProperty(t,'__v370I18n',{value:{frName,frDesc,enName,enDesc},enumerable:false,configurable:true});
        }
        t.name=isEN()?t.__v370I18n.enName:t.__v370I18n.frName;
        t.desc=isEN()?t.__v370I18n.enDesc:t.__v370I18n.frDesc;
        if(Array.isArray(t.effects))t.effects.forEach((e,i)=>{
          if(!e.__v370I18n){
            const frName=raw(e.name),frDesc=raw(e.desc);
            Object.defineProperty(e,'__v370I18n',{value:{frName,frDesc,enName:usefulEnglish(normal[i]?.name)||'T.U.N.I.N.G Effect',enDesc:usefulEnglish(normal[i]?.description)||'Improves the selected stat.'},enumerable:false,configurable:true});
          }
          e.name=isEN()?e.__v370I18n.enName:e.__v370I18n.frName;
          e.desc=isEN()?e.__v370I18n.enDesc:e.__v370I18n.frDesc;
        });
      });
    }
  }
}
fillEnglishData();

/* Stable lazy tables: large character pages do not create thousands of cells until opened. */
let lazyTables=[];
window.mhurV370ToggleTable=function(id,button){
  const box=document.getElementById('mhurV370Table'+id);if(!box)return;
  if(box.dataset.loaded==='1'){box.classList.toggle('hidden');button?.setAttribute('aria-expanded',String(!box.classList.contains('hidden')));return;}
  const tb=lazyTables[id]||{};
  box.innerHTML=`<table class="dataTable"><thead><tr>${(tb.cols||[]).map(c=>`<th>${esc(translateGameText(c))}</th>`).join('')}</tr></thead><tbody>${(tb.rows||[]).map(r=>`<tr>${(r||[]).map(v=>`<td>${esc(translateGameText(v))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  box.dataset.loaded='1';box.classList.remove('hidden');button?.setAttribute('aria-expanded','true');
};
tables=function(ts){
  return `<div class="tables">${(Array.isArray(ts)?ts:[]).map(tb=>{const id=lazyTables.push(tb)-1;return `<button class="toggle" type="button" aria-expanded="false" onclick="mhurV370ToggleTable(${id},this)">${esc(translateGameText(tb?.title||tr('Valeurs','Values')))} ▾</button><div id="mhurV370Table${id}" class="simpleTable hidden"></div>`}).join('')}</div>`;
};

stylePicker=function(){
  const c=(typeof characters!=='undefined'?characters:[]).find(x=>x&&x.id===selectedChar);
  if(!c)return `<button class="back" type="button" data-mhur-back="characters">← ${tr('Retour','Back')}</button><div class="homeBox">${tr('Personnage introuvable.','Character not found.')}</div>`;
  const valid=(c.styles||[]).filter(id=>styles&&styles[id]);
  if(valid.length===1){selectedStyle=valid[0];return characterDetail(valid[0]);}
  return `<button class="back" type="button" data-mhur-back="characters">← ${tr('Retour','Back')}</button><h1 class="title">${esc(c.name)}</h1><div class="styleGrid">${valid.map(id=>{const st=styles[id];return `<button class="styleCard" type="button" data-mhur-style="${esc(id)}"><div class="styleBanner">${asset(st.portrait,c.name+' '+label(st.name))}</div><div class="styleInfo"><h2>${esc(label(st.name))}</h2><div class="badges">${sideBadge(c.side)}${roleBadge(st.role)}</div></div></button>`}).join('')||`<div class="homeBox">${tr('Aucun style disponible.','No style available.')}</div>`}</div>`;
};
characterDetail=function(styleId){
  lazyTables=[];
  const st=styles&&styles[styleId];
  if(!st)return `<button class="back" type="button" data-mhur-back="styles">← ${tr('Retour','Back')}</button><div class="homeBox">${tr('Données indisponibles.','Data unavailable.')}</div>`;
  const ch=(characters||[]).find(x=>(x.styles||[]).includes(styleId))||{name:tr('Personnage','Character'),styles:[]};
  const back=(ch.styles||[]).length>1?'styles':'characters';
  const special=st.special?skillSection({letter:'SP',...st.special},true):'';
  const skills=(st.skills||[]).map(k=>skillSection(k,false)).join('');
  return `<button class="back" type="button" data-mhur-back="${back}">← ${tr('Retour','Back')}</button><div class="charPanel role-${esc(st.role||'assault')}"><div class="charTop"><div class="portrait">${asset(st.portrait||ch.portrait,'portrait')}</div><div class="meta"><h2>${esc(ch.name)}</h2><div class="badges">${roleBadge(st.role)}<span class="badge">${tr('PV','HP')} : ${esc(st.pv||'—')}</span></div><p><b>${tr('Style','Style')} :</b> ${esc(label(st.name))}</p><p>${label(st.description)}</p><p><b>${tr('Rôle','Role')} :</b> ${label(st.roleDesc)}</p></div></div>${special}<h2 class="quirkSectionTitle" style="padding:0 16px;color:#000">${tr('Alter','Quirk Skills')}</h2>${skills||`<div class="homeBox">${tr('Compétences indisponibles.','Skills unavailable.')}</div>`}</div>`;
};

/* Costume translation and removal of the unwanted family label between tuning icons. */
function translatedCostume(ct){
  const copy={...ct};
  copy.group=translateCostume(ct?.group||ct?.name||'');
  copy.name=translateCostume(ct?.name||ct?.group||'');
  copy.variant=translateCostume(ct?.variant||'');
  if(isEN()){
    const char=(characters||[]).find(c=>c.id===ct?.char)?.name||'this character';
    copy.notes=`${copy.name}${copy.variant&&copy.variant!=='Original'?' — '+copy.variant:''} costume for ${char}.`;
  }
  return copy;
}
if(typeof costumeCard==='function'){
  const baseCostumeCard=costumeCard;
  costumeCard=function(ct){return baseCostumeCard(translatedCostume(ct)).replace(/<div class="costumeMiniDesc">[\s\S]*?<\/div>/,'')};
}
if(typeof costumeGalleryGroup==='function'){
  const baseCostumeGroup=costumeGalleryGroup;
  costumeGalleryGroup=function(g){return baseCostumeGroup({...g,group:translateCostume(g?.group||''),variants:(g?.variants||[]).map(translatedCostume)}).replace(/<div class="costumeMiniDesc">[\s\S]*?<\/div>/g,'')};
}
if(typeof costumeTuningDetail==='function'){
  const baseCostumeDetail=costumeTuningDetail;
  costumeTuningDetail=function(ct){return baseCostumeDetail(translatedCostume(ct))};
}

/* Exclude every normal and SP tuning from the selected character, across all of their styles. */
function familyForCharacter(id){
  const c=(characters||[]).find(x=>x.id===id);
  return new Set(c?.styles||[]);
}
if(typeof compatibleTunings==='function'&&!compatibleTunings.__v370){
  const baseCompatible=compatibleTunings;
  const fn=function(){
    const list=baseCompatible.apply(this,arguments)||[];
    let charId='';
    try{charId=window.CB_STATE?.draft?.characterId||selectedChar||''}catch(_){ }
    const blocked=familyForCharacter(charId);
    if(!blocked.size)return list;
    return list.filter(t=>!blocked.has(String(t?.styleKey||t?.style||'')));
  };
  fn.__v370=true;compatibleTunings=fn;
}

/* One navigation handler only. No malformed inline JavaScript and no blocked Back button. */
document.addEventListener('click',event=>{
  const style=event.target.closest('[data-mhur-style]');
  if(style){event.preventDefault();event.stopPropagation();selectedStyle=style.dataset.mhurStyle;render();return;}
  const back=event.target.closest('[data-mhur-back]');
  if(back){
    event.preventDefault();event.stopPropagation();
    const target=back.dataset.mhurBack;
    if(target==='styles'){selectedStyle=null;}
    else{selectedStyle=null;selectedChar=null;}
    render();return;
  }
},true);

/* Safe, bounded UI translation. It only translates newly-added text nodes. */
const uiExact={
  ...exactGameText,
  'Classement créateurs':'Creator ranking','Installer l’application':'Install the app','Installer l\'application':'Install the app',
  'Confidentialité':'Privacy','Règles':'Rules','À propos':'About','Projet communautaire non officiel':'Unofficial community project',
  'Aucun costume trouvé.':'No costume found.','Filtres costumes':'Costume Filters','Rareté':'Rarity','T.U.N.I.N.G SP rapide':'Quick SP T.U.N.I.N.G','SP rapide':'Quick SP','SP gauche':'Left SP','SP droite':'Right SP',
  'Condition droite':'Right Condition','Réinitialiser':'Reset','Résumé slots':'Slot Summary','T.U.N.I.N.G compatibles':'Compatible T.U.N.I.N.G',
  'Compétence T.U.N.I.N.G SP gauche':'Left SP T.U.N.I.N.G Skill','Compétence T.U.N.I.N.G SP droite':'Right SP T.U.N.I.N.G Skill',
  'Disponible selon la couleur du slot gauche':'Available according to the left slot color','Disponible selon la couleur du slot droite':'Available according to the right slot color',
  'Tu peux combiner la rareté, les deux emplacements SP et la condition Héros/Vilain.':'You can combine rarity, both SP slots, and the Hero/Villain condition.',
  'Choix compatible':'Compatible Choice','Aucun T.U.N.I.N.G compatible.':'No compatible T.U.N.I.N.G.'
};
function translateNode(root){
  if(!isEN()||!root)return;
  const nodes=[];
  if(root.nodeType===Node.TEXT_NODE)nodes.push(root);
  else if(root.nodeType===Node.ELEMENT_NODE){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())&&nodes.length<6000)nodes.push(n)}
  for(const n of nodes){
    if(n.parentElement?.closest('script,style,textarea,input'))continue;
    const raw=n.nodeValue,core=raw.trim();if(!core)continue;
    let out=uiExact[core]??translateCostume(core)??core;
    if(out===core)out=translateGameText(core);
    if(out!==core)n.nodeValue=raw.replace(core,out);
  }
}
let translateQueued=false;
function scheduleTranslate(root=document.getElementById('app')||document.body){if(translateQueued)return;translateQueued=true;requestAnimationFrame(()=>{translateQueued=false;translateNode(root);document.querySelectorAll('.costumeMiniDesc').forEach(x=>x.remove())})}

/* Clean render wrapper: apply data before rendering, translate once afterwards. */
if(typeof render==='function'&&!render.__v370){
  const baseRender=render;
  const stable=function(){
    try{fillEnglishData();const result=baseRender.apply(this,arguments);scheduleTranslate();ensureNavigationButtons();return result;}
    catch(error){
      console.error('[MHUR V370 render]',error);
      const app=document.getElementById('app');
      if(app)app.innerHTML=`<div class="homeBox"><h2>${tr('Erreur d’affichage','Display error')}</h2><p>${esc(error?.message||error)}</p><button class="back" type="button" data-mhur-back="characters">← ${tr('Retour aux personnages','Back to characters')}</button></div>`;
    }
  };
  stable.__v370=true;render=stable;window.render=stable;
}
if(typeof toggleLang==='function'&&!toggleLang.__v370){
  const baseToggle=toggleLang;
  const fn=function(){const result=baseToggle.apply(this,arguments);fillEnglishData();scheduleTranslate(document.body);ensureNavigationButtons();return result};
  fn.__v370=true;toggleLang=fn;window.toggleLang=fn;
}

const appObserver=new MutationObserver(records=>{
  if(!isEN())return;
  for(const record of records)for(const node of record.addedNodes)translateNode(node);
  document.querySelectorAll('.costumeMiniDesc').forEach(x=>x.remove());
});
function startObserver(){const app=document.getElementById('app');if(app)appObserver.observe(app,{childList:true,subtree:true})}

/* Creator leaderboard: button always exists and query does not depend on a missing FK relationship. */
async function api(path){
  if(!cfg.supabaseUrl||!cfg.supabaseKey)throw new Error(tr('Supabase non configuré.','Supabase is not configured.'));
  const token=window.MHUR_AUTH?.getAccessToken?.()||cfg.supabaseKey;
  const r=await fetch(String(cfg.supabaseUrl).replace(/\/$/,'')+path,{cache:'no-store',headers:{apikey:cfg.supabaseKey,Authorization:'Bearer '+token}});
  if(!r.ok)throw new Error(await r.text()||('HTTP '+r.status));return r.json();
}
function leaderboardModal(){
  let modal=document.getElementById('mhurLeaderboardModalV370');
  if(!modal){
    modal=document.createElement('div');modal.id='mhurLeaderboardModalV370';modal.className='mhurHubOverlay';
    modal.innerHTML='<section class="mhurHubPanel"><button class="mhurHubClose" type="button">×</button><header class="mhurHubHead"><h2></h2><p></p></header><div class="mhurHubBody"><div class="mhurLeaderboardGrid"></div></div></section>';
    document.body.appendChild(modal);modal.querySelector('.mhurHubClose').onclick=()=>closeLeaderboard();modal.onclick=e=>{if(e.target===modal)closeLeaderboard()};
  }
  return modal;
}
function closeLeaderboard(){document.getElementById('mhurLeaderboardModalV370')?.classList.remove('open');document.body.classList.remove('cbModalOpen')}
async function openLeaderboard(){
  document.getElementById('drawer')?.classList.remove('open');
  const modal=leaderboardModal();modal.querySelector('h2').textContent='🏆 '+tr('Classement des créateurs','Creator leaderboard');modal.querySelector('.mhurHubHead p').textContent=tr('Classement calculé avec les builds publics et les likes reçus.','Ranking based on public builds and received likes.');
  const out=modal.querySelector('.mhurLeaderboardGrid');out.textContent=tr('Chargement…','Loading…');modal.classList.add('open');document.body.classList.add('cbModalOpen');
  try{
    const builds=await api('/rest/v1/community_builds?is_hidden=eq.false&select=creator_id,likes_count&limit=1000');
    const ids=[...new Set((builds||[]).map(x=>x.creator_id).filter(Boolean))];let profiles=[];
    if(ids.length){const quoted=ids.map(id=>'"'+String(id).replace(/"/g,'')+'"').join(',');profiles=await api('/rest/v1/profiles?id=in.('+encodeURIComponent(quoted)+')&select=id,username,avatar_url,provider')}
    const profileMap=new Map((profiles||[]).map(x=>[x.id,x]));const scores=new Map();
    for(const b of builds||[]){if(!b.creator_id)continue;const p=profileMap.get(b.creator_id)||{};const row=scores.get(b.creator_id)||{id:b.creator_id,username:p.username||tr('Utilisateur','User'),avatar:p.avatar_url||'',provider:p.provider||'',builds:0,likes:0};row.builds++;row.likes+=Number(b.likes_count||0);scores.set(b.creator_id,row)}
    const ranked=[...scores.values()].sort((a,b)=>(b.likes-a.likes)||(b.builds-a.builds)||a.username.localeCompare(b.username)).slice(0,50);
    out.innerHTML=ranked.map((x,i)=>`<button type="button" class="mhurLeaderboardRow" data-profile="${esc(x.id)}"><span class="mhurLeaderboardRank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="mhurLeaderboardUser">${x.avatar?`<img class="mhurLeaderboardAvatar" src="${esc(x.avatar)}" alt="">`:'<span class="mhurLeaderboardAvatar fallback">👤</span>'}<span><b>${esc(x.username)}</b><small>${esc(x.provider||tr('Compte','Account'))} · ${x.builds} builds</small></span></span><span class="mhurLeaderboardScore"><b>♥ ${x.likes}</b><small>${tr('likes reçus','likes received')}</small></span></button>`).join('')||`<div>${tr('Aucun créateur classé pour le moment.','No ranked creators yet.')}</div>`;
    out.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{closeLeaderboard();window.MHUR_PROFILES?.open(b.dataset.profile)});
  }catch(error){console.error('[V370 leaderboard]',error);out.textContent=tr('Impossible de charger le classement pour le moment.','Unable to load the leaderboard right now.')}
}
window.MHUR_V370={openLeaderboard,closeLeaderboard};

/* PWA: stable identity, controlled service worker, and no blocking fallback modal. */
let installPrompt=null;
let installState='preparing';
const installWaiters=[];
function resolveInstallWaiters(value){while(installWaiters.length)installWaiters.shift()(value)}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  installPrompt=event;
  installState='ready';
  resolveInstallWaiters(event);
  ensureNavigationButtons();
});
window.addEventListener('appinstalled',()=>{
  installPrompt=null;
  installState='installed';
  resolveInstallWaiters(null);
  ensureNavigationButtons();
});
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
async function preparePwa(){
  if(standalone()){installState='installed';ensureNavigationButtons();return}
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol)){installState='unsupported';ensureNavigationButtons();return}
  try{
    const registration=await navigator.serviceWorker.register('/service-worker.js?v=370',{scope:'/',updateViaCache:'none'});
    registration.update().catch(()=>{});
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller&&!sessionStorage.getItem('mhurPwaControlled370')){
      sessionStorage.setItem('mhurPwaControlled370','1');
      location.reload();
      return;
    }
    installState=installPrompt?'ready':'waiting';
  }catch(error){console.warn('[MHUR V370 PWA]',error);installState='unsupported'}
  ensureNavigationButtons();
}
function waitForInstallPrompt(timeout=3500){
  if(installPrompt)return Promise.resolve(installPrompt);
  return new Promise(resolve=>{
    const done=value=>resolve(value||null);
    installWaiters.push(done);
    setTimeout(()=>{const i=installWaiters.indexOf(done);if(i>=0)installWaiters.splice(i,1);resolve(installPrompt||null)},timeout);
  });
}
async function installApp(){
  if(standalone()){installState='installed';ensureNavigationButtons();return}
  const prompt=installPrompt||await waitForInstallPrompt();
  if(prompt){
    installPrompt=null;
    installState='installing';
    ensureNavigationButtons();
    await prompt.prompt();
    const choice=await prompt.userChoice.catch(()=>null);
    installState=choice?.outcome==='accepted'?'installed':'waiting';
    ensureNavigationButtons();
    return;
  }
  installState='menu';
  ensureNavigationButtons();
}
function installLabel(){
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(standalone()||installState==='installed')return tr('Application installée','App installed');
  if(installState==='ready')return tr('Installer l’application','Install the app');
  if(installState==='installing')return tr('Installation…','Installing…');
  if(installState==='menu')return ios?tr('Safari : Partager → Sur l’écran d’accueil','Safari: Share → Add to Home Screen'):tr('Menu du navigateur → Installer l’application','Browser menu → Install app');
  if(installState==='unsupported')return tr('Installer l’application','Install App');
  return tr('Préparation de l’installation…','Preparing installation…');
}
function ensureNavigationButtons(){
  const drawer=document.getElementById('drawer');if(!drawer)return;
  let rank=drawer.querySelector('[data-mhur-leaderboard]');
  if(!rank){rank=document.createElement('button');rank.type='button';rank.className='navItem';rank.dataset.mhurHub='1';rank.dataset.mhurLeaderboard='1';drawer.appendChild(rank)}
  rank.innerHTML='🏅 '+tr('Classement créateurs','Creator ranking');rank.onclick=openLeaderboard;
  let install=drawer.querySelector('[data-mhur-install]');
  if(!install){install=document.createElement('button');install.type='button';install.className='navItem mhurInstallButtonV370';install.dataset.mhurHub='1';install.dataset.mhurInstall='1';drawer.appendChild(install)}
  install.innerHTML='📲 '+installLabel();
  install.classList.toggle('is-ready',installState==='ready');
  install.classList.toggle('is-pending',['preparing','waiting','installing'].includes(installState));
  install.classList.toggle('is-installed',standalone()||installState==='installed');
  install.disabled=standalone()||installState==='installed'||installState==='installing';
  install.onclick=installApp;
  const keys=new Map();
  [...drawer.querySelectorAll('button,a')].forEach(el=>{
    const text=String(el.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    let key='';
    if(el.dataset.mhurInstall!==undefined||text.includes('install'))key='install';
    else if(el.dataset.mhurLeaderboard!==undefined||text.includes('creator rank')||text.includes('creator leader')||text.includes('classement createur'))key='creator';
    else if(text.includes('global search')||text.includes('recherche globale'))key='search';
    else if(text.includes('tier list'))key='tier';
    if(!key)return;
    if(keys.has(key))el.remove();else keys.set(key,el);
  });
}
/* OAuth always returns to the current root, without an old release URL. */
function patchAuth(){ /* V398: legacy OAuth override disabled; community-auth.js owns the complete PKCE flow. */ }

function boot(){fillEnglishData();patchAuth();ensureNavigationButtons();startObserver();scheduleTranslate(document.body);document.querySelectorAll('.costumeMiniDesc').forEach(x=>x.remove());preparePwa()}
document.addEventListener('DOMContentLoaded',boot,{once:true});
setTimeout(boot,50);setTimeout(boot,500);
})();
