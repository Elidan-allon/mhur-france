/* MHUR Nexus — Saison 18 v9
   Couche ciblée : portraits, choix de styles, NEW, Gentle Criminal.
   Aucun remplacement du reste du site. */
(function(){
'use strict';

const currentLang=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const pick=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[currentLang()]??v.fr??v.en??''):v;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cjk=/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;
const clean=v=>String(pick(v)??'').replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'').replace(cjk,'').replace(/\s{2,}/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const NEW_HTML='<span class="s18NewBadge s18NewBadgeV9" aria-label="NEW">NEW!</span>';

function exactData(){
  if(window.__S18_EXACT_V9!==undefined) return window.__S18_EXACT_V9;
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el) return window.__S18_EXACT_V9=null;
  try{ window.__S18_EXACT_V9=JSON.parse(el.textContent||'{}'); }
  catch(_e){ window.__S18_EXACT_V9=null; }
  return window.__S18_EXACT_V9;
}
function roleKey(v){
  return ({strike:'attack',attack:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[norm(v)]||norm(v)||'technical';
}
function uniqueStyleIds(ch){
  if(!ch||typeof styles==='undefined') return [];
  const ids=[]; const seenIds=new Set(); const seenOriginal=new Set();
  (Array.isArray(ch.styles)?ch.styles:[]).forEach(raw=>{
    const id=String(raw); const st=styles[id];
    if(!id||!st||seenIds.has(id)) return;
    seenIds.add(id);
    const signature=`${norm(st.name||'Original')}|${roleKey(st.role)}|${norm(st.portrait||'')}`;
    if(norm(st.name||'Original')==='original'){
      const originalKey=`original|${roleKey(st.role)}|${norm(st.portrait||'')}`;
      if(seenOriginal.has(originalKey)) return;
      seenOriginal.add(originalKey);
    }
    if(ids.some(existing=>{
      const s=styles[existing];
      return `${norm(s.name||'Original')}|${roleKey(s.role)}|${norm(s.portrait||'')}`===signature;
    })) return;
    ids.push(id);
  });
  return ids;
}
function dedupeAll(){
  if(typeof characters==='undefined'||!Array.isArray(characters)) return;
  characters.forEach(ch=>{ ch.styles=uniqueStyleIds(ch); });
}
function newSets(){
  const data=window.MHUR_SEASON18_DATA?.new_content||{};
  return {
    characters:new Set((data.characters||[]).map(String)),
    styles:new Set((data.styles||[]).map(String)),
    costumes:new Set((data.costumes||[]).map(String))
  };
}

/* ---------- Portraits officiels ---------- */
function inferredRemotePortrait(row){
  const alpha=String(row?.assets?.alpha||'');
  if(!alpha) return '';
  return alpha.replace('/GUI/Skill/','/GUI/FaceIcon/').replace(/T_ui_Skill_(Ch\d+)_Unique1\.png(?:\?.*)?$/i,'T_ui_$1_CharaImage.png');
}
function originalRemotePortrait(row){
  const data=exactData()?.exact_by_style||{};
  const base=norm(row?.base_name||row?.name||'');
  const original=Object.values(data).find(x=>norm(x?.base_name||x?.name||'')===base&&Number(x?.variant_index||0)===0&&x?.assets?.portrait);
  return original?.assets?.portrait||'';
}
function portraitCandidates(styleId,fallback){
  const sync=window.MHUR_SEASON18_DATA?.official_portraits||{};
  const row=exactData()?.exact_by_style?.[styleId]||null;
  const list=[sync[styleId],row?.assets?.portrait,inferredRemotePortrait(row),fallback,originalRemotePortrait(row)].filter(Boolean).map(String);
  return Array.from(new Set(list));
}
window.MHUR_S18_NEXT_IMAGE=function(image){
  try{
    const list=JSON.parse(decodeURIComponent(image.dataset.s18Fallbacks||'%5B%5D'));
    const next=list.shift();
    image.dataset.s18Fallbacks=encodeURIComponent(JSON.stringify(list));
    if(next){ image.src=next; return; }
  }catch(_e){}
  image.onerror=null;
};
function portraitImg(styleId,fallback,alt,className=''){
  const candidates=portraitCandidates(styleId,fallback);
  const src=candidates.shift()||fallback||'';
  const encoded=encodeURIComponent(JSON.stringify(candidates));
  return `<img src="${esc(src)}" alt="${esc(alt)}" class="${esc(className)}" data-s18-fallbacks="${esc(encoded)}" onerror="MHUR_S18_NEXT_IMAGE(this)">`;
}
function applyOfficialPortraits(){
  if(typeof styles==='undefined') return;
  const sync=window.MHUR_SEASON18_DATA?.official_portraits||{};
  const exact=exactData()?.exact_by_style||{};
  Object.keys(styles).forEach(id=>{
    const official=sync[id]||exact[id]?.assets?.portrait||'';
    if(official) styles[id].portrait=official;
  });
  if(typeof characters!=='undefined'){
    characters.forEach(ch=>{
      const first=uniqueStyleIds(ch)[0];
      if(first&&styles[first]?.portrait) ch.portrait=styles[first].portrait;
    });
  }
}

/* ---------- Tableaux bilingues et suppression Down Power ---------- */
function localizedTableValue(v){ return pick(v); }
function normalizeRows(rows){
  const selected=localizedTableValue(rows);
  return Array.isArray(selected)?selected:[];
}
function normalizeCols(cols){
  const selected=localizedTableValue(cols);
  return Array.isArray(selected)?selected:[];
}
function filterDownPower(table){
  const cols=normalizeCols(table?.cols||table?.columns||[]);
  const rows=normalizeRows(table?.rows||[]);
  const keep=[];
  cols.forEach((col,i)=>{ if(norm(col)!=='down_power') keep.push(i); });
  return {title:clean(table?.title),cols:keep.map(i=>clean(cols[i])),rows:rows.map(row=>keep.map(i=>clean((row||[])[i]??'')))};
}
function tablesV9(list){
  const tablesList=(Array.isArray(list)?list:[]).map(filterDownPower).filter(tb=>tb.cols.length&&tb.rows.length);
  const ordered=[...tablesList].sort((a,b)=>(/effets|effects/i.test(a.title)?1:0)-(/effets|effects/i.test(b.title)?1:0));
  return `<div class="tables">${ordered.map(tb=>`<button class="toggle" type="button" onclick="this.nextElementSibling.classList.toggle('hidden')"><span class="statsToggleTitle">${esc(tb.title)}</span><span class="statsToggleArrow">▾</span></button><div class="simpleTable hidden"><table class="dataTable"><thead><tr>${tb.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${tb.rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
}
if(typeof tables==='function'){ window.tables=tablesV9; try{tables=tablesV9}catch(_e){} }

function makeTable(titleFr,titleEn,colsFr,colsEn,rows){
  return {title:{fr:titleFr,en:titleEn},cols:{fr:colsFr,en:colsEn},rows};
}
function levelRows(values){ return values.map((v,i)=>[`Lv.${i+1}`,...v]); }

/* ---------- Gentle Criminal : données détaillées ---------- */
function patchGentle(){
  if(typeof styles==='undefined'||typeof characters==='undefined') return;
  const exact=exactData()?.exact_by_style||{};
  let styleId=Object.keys(exact).find(id=>norm(exact[id]?.base_name||exact[id]?.name).includes('gentle_criminal')&&Number(exact[id]?.variant_index||0)===0);
  if(!styleId) styleId=Object.keys(styles).find(id=>/gentle[_-]?criminal/i.test(id));
  if(!styleId||!styles[styleId]) return;
  const st=styles[styleId];
  const ch=characters.find(c=>(c.styles||[]).map(String).includes(String(styleId))||norm(c.id).includes('gentle_criminal')||norm(c.name).includes('gentle_criminal'));
  if(!ch) return;
  const row=exact[styleId]||{};
  const oldSkills=Array.isArray(st.skills)?st.skills:[];
  ch.name='Gentle Criminal'; ch.side='villain';
  ch.styles=[styleId,...uniqueStyleIds(ch).filter(id=>id!==styleId&&norm(styles[id]?.name)!=='original')];
  st.name={fr:'Original',en:'Original'}; st.role='technical'; st.pv=String(row?.stats?.['Max Main Health']||row?.stats?.['Max Health']||st.pv||300);
  if(row?.assets?.portrait) st.portrait=row.assets.portrait;
  ch.portrait=st.portrait||ch.portrait;
  st.description={
    fr:"Un hors-la-loi des temps modernes qui entrera dans l'Histoire ! Son Alter Élasticité lui permet de virevolter dans les airs en narguant ses ennemis avec panache !",
    en:'A modern-day gentleman thief whose name will go down in history! With his Quirk, Elasticity, he flies freely in every direction and gracefully toys with his opponents!'
  };
  st.roleDesc={
    fr:"Augmente la vitesse de rechargement de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.",
    en:'Gives your entire team Reload Speed UP! The more teammates with the same role, the stronger the effect!'
  };
  st.special={
    name:{fr:'Gently Trampoline / Mode Lover',en:'Gently Trampoline / Rubber Mode'},
    img:row?.assets?.special||st.special?.img||st.portrait,
    desc:{
      fr:"Gently Trampoline : crée un trampoline gonflable à vos pieds. Vous et vos alliés effectuez un grand saut en le touchant, tandis que les ennemis sont projetés au loin. Mode Lover : l'Alter de La Brava améliore la puissance d'attaque et la vitesse de rechargement en mode Plus Chaos. À 100 %, il s'active automatiquement et empêche les PV de tomber à 0 après une attaque ennemie.",
      en:"Gently Trampoline: creates an air trampoline beneath your feet. Allies who touch it make a huge jump, while opponents are launched away. Rubber Mode: La Brava's Quirk boosts Attack Power and Reload Speed during Plus Chaos. At 100%, it activates automatically instead of letting an enemy attack reduce HP to 0."
    },
    tables:[makeTable("Valeurs de l'action spéciale",'Special Action values',['Dégâts','Munitions','Consommation','Recharge'],['Damage','Ammo','Use Ammo','Reload'],[['0','x1','x1','11s']])]
  };
  const oldA=oldSkills.find(x=>x.letter==='α')||oldSkills[0]||{};
  const oldB=oldSkills.find(x=>x.letter==='β')||oldSkills[1]||{};
  const oldG=oldSkills.find(x=>x.letter==='γ')||oldSkills[2]||{};
  st.skills=[
    {
      letter:'α',name:'Gently Arrow',img:row?.assets?.alpha||oldA.img||st.portrait,
      desc:{fr:"Attaque qui utilise l'élasticité de l'air pour projeter des plumes dans l'axe de visée. Maintenir la commande augmente la vitesse du tir et rend sa trajectoire plus rectiligne.",en:'Fire a feather pen using the elasticity of the air. Hold to charge, increasing its speed and making its trajectory straighter.'},
      tables:[
        makeTable('Effets de montée α','α level-up effects',['Niveau','Effet de montée'],['Level','Level Up Effect'],[['Lv.2','Dégâts +'],['Lv.3','Dégâts +'],['Lv.4','Dégâts +, Munitions +, Taille +'],['Lv.5','Dégâts +'],['Lv.6','Dégâts +'],['Lv.7','Dégâts +'],['Lv.8','Dégâts +'],['Lv.9','Dégâts +, Munitions +, Taille +']]),
        makeTable('Valeurs de base α','Base α values',['Niveau','Dégâts','Munitions','Consommation','Recharge'],['Level','Damage','Ammo','Use Ammo','Reload'],levelRows([[60,'x6','x1','1s'],[63,'x6','x1','1s'],[66,'x6','x1','1s'],[69,'x7','x1','1s'],[72,'x7','x1','1s'],[75,'x7','x1','1s'],[78,'x7','x1','1s'],[81,'x7','x1','1s'],[84,'x8','x1','1s']]))
      ]
    },
    {
      letter:'β',name:'Gently Rebound',img:row?.assets?.beta||oldB.img||st.portrait,
      desc:{fr:"Confère de l'élasticité à l'air dans l'axe de visée pour bloquer les attaques et les projectiles ennemis. Lorsqu'elle reçoit une attaque, la barrière libère une onde de choc et des projectiles.",en:'Give elasticity to the air in the aim direction to block opponent attacks and projectiles. When the air barrier receives an attack, it releases a shockwave and air bullets.'},
      tables:[
        makeTable('Effets de montée β','β level-up effects',['Niveau','Effet de montée'],['Level','Level Up Effect'],[['Lv.2','Dégâts +'],['Lv.3','Dégâts +'],['Lv.4','Dégâts +, Vitesse de rechargement +, Taille +'],['Lv.5','Dégâts +'],['Lv.6','Dégâts +'],['Lv.7','Dégâts +'],['Lv.8','Dégâts +'],['Lv.9','Dégâts +, Vitesse de rechargement +, Taille +']]),
        makeTable('Valeurs de base β','Base β values',['Niveau','Munitions','Consommation','Recharge'],['Level','Ammo','Use Ammo','Reload'],levelRows([['x2','x1','8s'],['x2','x1','8s'],['x2','x1','8s'],['x2','x1','7.5s'],['x2','x1','7.5s'],['x2','x1','7.5s'],['x2','x1','7.5s'],['x2','x1','7.5s'],['x2','x1','7s']])),
        makeTable('Dégâts supplémentaires β','Additional β damage',['Type','Niveau','Dégâts'],['Type','Level','Damage'],[
          ...levelRows([[70],[75],[80],[85],[90],[95],[100],[105],[110]]).map(r=>['Onde de choc',...r]),
          ...levelRows([[20],[21],[22],[24],[25],[26],[27],[28],[30]]).map(r=>['Projectile',...r])
        ])
      ]
    },
    {
      letter:'γ',name:{fr:'Gently Rush',en:'Gently Avant'},img:row?.assets?.gamma||oldG.img||st.portrait,
      desc:{fr:"Effectue une charge dans la direction visée puis enchaîne l'ennemi touché. Maintenir la commande permet jusqu'à quatre rebonds, augmentant la durée et les dégâts. La charge peut aussi rebondir sur la barrière créée par l'Alter β ou l'action spéciale. Appuyer à nouveau met fin à la charge.",en:'Dash in the aim direction. On hitting an opponent, zip around the area at high speed to continue the assault. Hold to make the dash ricochet up to four times, increasing its duration and damage. It can also bounce off the barrier from Quirk Skill β or the Special Action. Press again to end the dash.'},
      tables:[
        makeTable('Effets de montée γ','γ level-up effects',['Niveau','Effet de montée'],['Level','Level Up Effect'],[['Lv.2','Dégâts +'],['Lv.3','Dégâts +'],['Lv.4','Dégâts +, Munitions +, Portée +'],['Lv.5','Dégâts +'],['Lv.6','Dégâts +'],['Lv.7','Dégâts +'],['Lv.8','Dégâts +'],['Lv.9','Dégâts +, Vitesse de rechargement +, Portée +']]),
        makeTable('Valeurs de base γ','Base γ values',['Niveau','Munitions','Consommation','Recharge'],['Level','Ammo','Use Ammo','Reload'],levelRows([['x1','x1','8s'],['x1','x1','8s'],['x1','x1','8s'],['x2','x1','8s'],['x2','x1','8s'],['x2','x1','8s'],['x2','x1','8s'],['x2','x1','8s'],['x2','x1','7s']])),
        makeTable('Dégâts supplémentaires γ','Additional γ damage',['Type','Niveau','Dégâts'],['Type','Level','Damage'],[
          ...levelRows([[40],[42],[44],[48],[50],[52],[54],[56],[60]]).map(r=>['Ruée',...r]),
          ...levelRows([[5],[5],[5],[5],[5],[5],[5],[5],[5]]).map(r=>['Rebond',...r]),
          ...levelRows([[40],[42],[44],[48],[50],[52],[54],[56],[60]]).map(r=>['Impact final',...r])
        ])
      ]
    }
  ];
}

/* ---------- Rendus des cartes et styles ---------- */
function uniqueRoles(ids){
  const seen=new Set(); const out=[];
  ids.forEach(id=>{ const role=styles[id]?.role; const key=roleKey(role); if(role&&!seen.has(key)){seen.add(key);out.push(role);} });
  return out;
}
function cardV9(character,mode='characters'){
  const sets=newSets();
  const ids=uniqueStyleIds(character); character.styles=ids;
  const first=ids[0]||''; const role=roleKey(styles[first]?.role);
  const modeClass=mode==='costumes'?' costumeMode':mode==='builds'?' buildMode':mode==='tunings'?' tuningMode':' characterMode';
  const tag=mode==='costumes'?`<div class="cardModeTag">${tr('costumeTag')}</div>`:mode==='builds'?`<div class="cardModeTag">${tr('buildTag')}</div>`:mode==='tunings'?'<div class="cardModeTag">T.U.N.I.N.G</div>':'<div class="cardModeTag">PERSONNAGE</div>';
  const message=mode==='costumes'?tr('costumeChoose'):mode==='builds'?tr('buildChoose'):mode==='tunings'?tr('tuningChoose'):tr('choose');
  return `<button class="card${modeClass} s18CharacterCardV9 role-${role}" data-char="${esc(character.id)}" onclick="selectChar('${String(character.id).replace(/'/g,"\\'")}')">${sets.characters.has(String(character.id))?NEW_HTML:''}${tag}<div class="thumb">${portraitImg(first,styles[first]?.portrait||character.portrait,character.name,'s18PortraitImgV9')}</div><div class="cardBody"><h3>${esc(character.name)}</h3><div class="badges">${sideBadge(character.side)}${uniqueRoles(ids).map(r=>roleBadge(r)).join('')}</div><p style="color:#c9d7ee">${esc(message)}</p></div></button>`;
}
function stylePickerV9(){
  const sets=newSets();
  const character=characters.find(x=>x.id===selectedChar); if(!character) return '';
  const ids=uniqueStyleIds(character); character.styles=ids;
  return `<button class="back" onclick="selectedChar=null;render()">← ${tr('back')}</button><h1 class="title">${esc(character.name)}</h1><div class="styleGrid">${ids.map(id=>{ const st=styles[id]; const role=roleKey(st.role); return `<button class="styleCard s18StyleCardV9 role-${role}" data-style="${esc(id)}" onclick="selectStyle('${String(id).replace(/'/g,"\\'")}')">${sets.styles.has(String(id))?NEW_HTML:''}<div class="styleBanner">${portraitImg(id,st.portrait,`${character.name} ${clean(st.name)}`,'s18StylePortraitV9')}</div><div class="styleInfo"><h2>${esc(clean(st.name)||'Original')}</h2><div class="badges">${sideBadge(character.side)}${roleBadge(st.role)}</div></div></button>`; }).join('')}</div>`;
}
function characterDetailV9(styleId){
  const st=styles[styleId]; if(!st) return '';
  const character=characters.find(x=>(x.styles||[]).includes(styleId))||{name:'Personnage',side:'hero'};
  const role=roleKey(st.role);
  const back=currentLang()==='fr'?'Retour':'Back';
  const roleTitle=currentLang()==='fr'?'Rôle':'Role';
  const quirkTitle=currentLang()==='fr'?'Alter':'Quirk Skills';
  return `<button class="back" onclick="selectedStyle=null;if((characters.find(x=>x.id===selectedChar)||{}).styles?.length===1)selectedChar=null;render()">← ${back}</button><div class="charPanel role-${role} s18CharacterDetailV9"><div class="charTop"><div class="portrait">${portraitImg(styleId,st.portrait,character.name,'s18DetailPortraitV9')}</div><div class="meta"><h2>${esc(character.name)}</h2><div class="badges">${roleBadge(st.role)}<span class="badge s18HpBadgeV9">${currentLang()==='fr'?'PV':'HP'} : ${esc(st.pv)}</span></div><p><b>Style :</b> ${esc(clean(st.name)||'Original')}</p><p>${esc(clean(st.description))}</p><p><b>${roleTitle} :</b> ${esc(clean(st.roleDesc))}</p></div></div>${skillSection({letter:'SP',...st.special},true)}<h2 class="s18QuirkTitleV9">${quirkTitle}</h2>${(st.skills||[]).map(skill=>skillSection(skill,false)).join('')}</div>`;
}

let baseCostumeCard=null;
function installRenders(){
  if(typeof card==='function'){ window.card=cardV9; try{card=cardV9}catch(_e){} }
  if(typeof stylePicker==='function'){ window.stylePicker=stylePickerV9; try{stylePicker=stylePickerV9}catch(_e){} }
  if(typeof characterDetail==='function'){ window.characterDetail=characterDetailV9; try{characterDetail=characterDetailV9}catch(_e){} }
  if(!baseCostumeCard&&typeof costumeCard==='function') baseCostumeCard=costumeCard;
  if(baseCostumeCard){
    const costumeV9=function(ct){
      let html=String(baseCostumeCard(ct)||'');
      const id=String(ct?.urId??ct?.ur_id??String(ct?.id||'').replace(/^ur_/,''));
      if(newSets().costumes.has(id)&&!html.includes('s18NewBadge')) html=html.replace(/^(<button\b[^>]*>|<div\b[^>]*>)/i,`$1${NEW_HTML}`);
      return html;
    };
    window.costumeCard=costumeV9; try{costumeCard=costumeV9}catch(_e){}
  }
}
function applyAll(){
  applyOfficialPortraits();
  patchGentle();
  dedupeAll();
  installRenders();
}
function wrapRender(){
  if(typeof render!=='function'||render.__s18V9) return;
  const old=render;
  const next=function(){ applyAll(); const result=old.apply(this,arguments); return result; };
  next.__s18V9=true;
  window.render=next; try{render=next}catch(_e){}
}

applyAll();
wrapRender();
setTimeout(()=>{
  try{
    applyAll();
    if(typeof render==='function'){ window.__keepScroll=true; render(); }
  }catch(error){ console.error('[MHUR S18 V9]',error); }
},0);
window.addEventListener('mhur:languagechange',()=>{
  try{ applyAll(); if(typeof render==='function') render(); }catch(_e){}
});
})();

/* ========================================================================== */
/* MHUR Nexus — Saison 18 v10 : portraits, styles, tableaux et patchs FR      */
/* ========================================================================== */
(function(){
'use strict';

const langNow=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const pick=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[langNow()]??v.fr??v.en??''):v;
const cjk=/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(pick(v)??'').replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'').replace(cjk,'').replace(/\s{2,}/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const roleKey=v=>({strike:'attack',attack:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[norm(v)]||norm(v)||'technical';
const NEW_HTML='<span class="s18NewBadge s18NewBadgeV10" aria-label="NEW">NEW!</span>';

function exactData(){
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el) return null;
  if(window.__S18_EXACT_V10!==undefined) return window.__S18_EXACT_V10;
  try{window.__S18_EXACT_V10=JSON.parse(el.textContent||'{}');}
  catch(_e){window.__S18_EXACT_V10=null;}
  return window.__S18_EXACT_V10;
}
function uniqueStyleIds(character){
  if(!character||typeof styles==='undefined') return [];
  const output=[]; const ids=new Set(); const signatures=new Set();
  (Array.isArray(character.styles)?character.styles:[]).forEach(raw=>{
    const id=String(raw),st=styles[id];
    if(!id||!st||ids.has(id)) return;
    ids.add(id);
    const sig=[norm(st.name||'Original'),roleKey(st.role),norm(st.portrait||'')].join('|');
    if(signatures.has(sig)) return;
    signatures.add(sig); output.push(id);
  });
  return output;
}
function originalStyleId(character){
  const ids=uniqueStyleIds(character);
  if(!ids.length) return '';
  const exact=exactData()?.exact_by_style||{};
  return ids.find(id=>Number(exact[id]?.variant_index||0)===0)
    ||ids.find(id=>norm(styles[id]?.name||'Original')==='original')
    ||ids.find(id=>/_original(?:_|$)/i.test(id))
    ||ids[0];
}
function officialPortrait(styleId,fallback=''){
  const sync=window.MHUR_SEASON18_DATA?.official_portraits||{};
  const exact=exactData()?.exact_by_style||{};
  return sync[styleId]||exact[styleId]?.assets?.portrait||styles?.[styleId]?.portrait||fallback||'';
}
window.MHUR_S18_NEXT_IMAGE_V10=function(image){
  try{
    const list=JSON.parse(decodeURIComponent(image.dataset.s18Fallbacks||'%5B%5D'));
    const next=list.shift();
    image.dataset.s18Fallbacks=encodeURIComponent(JSON.stringify(list));
    if(next){image.src=next;return;}
  }catch(_e){}
  image.onerror=null;
};
function portraitImg(styleId,fallback,alt,className=''){
  const sync=window.MHUR_SEASON18_DATA?.official_portraits||{};
  const exact=exactData()?.exact_by_style||{};
  const list=Array.from(new Set([sync[styleId],exact[styleId]?.assets?.portrait,styles?.[styleId]?.portrait,fallback].filter(Boolean).map(String)));
  const src=list.shift()||'';
  return `<img src="${esc(src)}" alt="${esc(alt)}" class="${esc(className)}" loading="eager" decoding="async" fetchpriority="high" data-s18-fallbacks="${esc(encodeURIComponent(JSON.stringify(list)))}" onload="this.classList.add('s18PortraitLoadedV10')" onerror="MHUR_S18_NEXT_IMAGE_V10(this)">`;
}
function newSets(){
  const data=window.MHUR_SEASON18_DATA?.new_content||{};
  return {styles:new Set((data.styles||[]).map(String)),costumes:new Set((data.costumes||[]).map(String))};
}
function uniqueRoles(ids){
  const seen=new Set(),out=[];
  ids.forEach(id=>{const role=styles?.[id]?.role,key=roleKey(role);if(role&&!seen.has(key)){seen.add(key);out.push(role);}});
  return out;
}

/* La carte d'un personnage garde toujours le portrait de son style Original. */
function characterCardV10(character,mode='characters'){
  const ids=uniqueStyleIds(character); character.styles=ids;
  const original=originalStyleId(character); const role=roleKey(styles?.[original]?.role);
  const modeClass=mode==='costumes'?' costumeMode':mode==='builds'?' buildMode':mode==='tunings'?' tuningMode':' characterMode';
  const tag=mode==='costumes'?`<div class="cardModeTag">${tr('costumeTag')}</div>`:mode==='builds'?`<div class="cardModeTag">${tr('buildTag')}</div>`:mode==='tunings'?'<div class="cardModeTag">T.U.N.I.N.G</div>':'<div class="cardModeTag">PERSONNAGE</div>';
  const message=mode==='costumes'?tr('costumeChoose'):mode==='builds'?tr('buildChoose'):mode==='tunings'?tr('tuningChoose'):tr('choose');
  /* Le NEW a été retiré des cartes personnages à la demande de l'utilisateur. */
  return `<button class="card${modeClass} s18CharacterCardV10 role-${role}" data-char="${esc(character.id)}" onclick="selectChar('${String(character.id).replace(/'/g,"\\'")}')">${tag}<div class="thumb">${portraitImg(original,character.portrait,character.name,'s18PortraitImgV10')}</div><div class="cardBody"><h3>${esc(character.name)}</h3><div class="badges">${sideBadge(character.side)}${uniqueRoles(ids).map(r=>roleBadge(r)).join('')}</div><p style="color:#c9d7ee">${esc(message)}</p></div></button>`;
}
function stylePickerV10(){
  const sets=newSets();
  const character=characters.find(x=>x.id===selectedChar); if(!character) return '';
  const ids=uniqueStyleIds(character); character.styles=ids;
  return `<button class="back" onclick="selectedChar=null;render()">← ${tr('back')}</button><h1 class="title">${esc(character.name)}</h1><div class="styleGrid">${ids.map(id=>{const st=styles[id],role=roleKey(st.role);return `<button class="styleCard s18StyleCardV10 role-${role}" data-style="${esc(id)}" onclick="selectStyle('${String(id).replace(/'/g,"\\'")}')">${sets.styles.has(String(id))?NEW_HTML:''}<div class="styleBanner">${portraitImg(id,st.portrait,`${character.name} ${clean(st.name)}`,'s18StylePortraitV10')}</div><div class="styleInfo"><h2>${esc(clean(st.name)||'Original')}</h2><div class="badges">${sideBadge(character.side)}${roleBadge(st.role)}</div></div></button>`;}).join('')}</div>`;
}

/* Effets de montée toujours en première position et traduction des tableaux. */
const frWords={
  level:'Niveau',type:'Type',damage:'Dégâts',ammo:'Munitions',use_ammo:'Consommation',reload:'Recharge',reload_time:'Temps de recharge',cooldown:'Recharge',cooldown_time:'Temps de recharge',guard_break:'Brise-garde',health:'PV',hp:'PV',size:'Taille',range:'Portée',duration:'Durée',level_up_effect:'Effet de montée',effect:'Effet',penalty_recharge:'Pénalité de recharge',recharge_time:'Temps de recharge'
};
function translateFr(value){
  let text=clean(value); if(langNow()!=='fr') return text;
  const exact=frWords[norm(text)]; if(exact) return exact;
  const replacements=[
    [/Level Up Effects?/gi,'Effets de montée'],[/Base Values?/gi,'Valeurs de base'],[/Additional Values?/gi,'Valeurs supplémentaires'],[/Detailed Values?/gi,'Valeurs détaillées'],
    [/Recharge Time/gi,'Temps de recharge'],[/Reload Time/gi,'Temps de recharge'],[/Penalty Recharge/gi,'Pénalité de recharge'],[/Use Ammo/gi,'Consommation'],[/Guard Break/gi,'Brise-garde'],[/Damage/gi,'Dégâts'],[/Ammo/gi,'Munitions'],[/Health/gi,'PV'],[/Level/gi,'Niveau'],[/Effect/gi,'Effet']
  ];
  replacements.forEach(([a,b])=>{text=text.replace(a,b);});
  return text;
}
function localArray(value){
  const selected=pick(value); return Array.isArray(selected)?selected:[];
}
function cleanTable(table){
  const cols=localArray(table?.cols||table?.columns||[]); const rows=localArray(table?.rows||[]); const keep=[];
  cols.forEach((column,index)=>{if(norm(column)!=='down_power')keep.push(index);});
  return {title:translateFr(table?.title),cols:keep.map(i=>translateFr(cols[i])),rows:rows.map(row=>keep.map(i=>translateFr((row||[])[i]??'')))};
}
function tablePriority(table){
  const title=norm(table.title);
  if(title.includes('effets_de_montee')||title.includes('level_up_effect')) return 0;
  if(title.includes('valeurs_de_base')||title.includes('base_value')) return 1;
  return 2;
}
function tablesV10(value){
  const source=Array.isArray(value)?value:[];
  const list=source.map(cleanTable).filter(t=>t.cols.length&&t.rows.length).sort((a,b)=>tablePriority(a)-tablePriority(b));
  return `<div class="tables">${list.map((table,index)=>`<button class="toggle s18TableToggleV10" type="button" onclick="this.nextElementSibling.classList.toggle('hidden')"><span class="statsToggleTitle">${esc(table.title)}</span><span class="statsToggleArrow">▾</span></button><div class="simpleTable ${index===0?'':'hidden'}"><table class="dataTable"><thead><tr>${table.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
}

/* Notes de patch : métadonnées exactes, traduction et sens des changements. */
let originalPatchNotes=null;
function clone(value){return JSON.parse(JSON.stringify(value));}
function roleText(role){
  const key=roleKey(role); const fr={attack:'Attaque',assault:'Assaut',technical:'Technique',support:'Soutien',rapid:'Vitesse'}; const en={attack:'Strike',assault:'Assault',technical:'Technical',support:'Support',rapid:'Rapid'};
  return (langNow()==='fr'?fr:en)[key]||clean(role);
}
function resolvePatchStyle(change){
  if(typeof characters==='undefined'||typeof styles==='undefined') return {character:null,id:'',style:null};
  const ch=(characters||[]).find(c=>norm(c.name)===norm(change?.character)||norm(c.id)===norm(change?.character))||null;
  if(!ch) return {character:null,id:'',style:null};
  const ids=uniqueStyleIds(ch); const wanted=norm(change?.style||'Original');
  let id=ids.find(key=>norm(styles[key]?.name||'Original')===wanted)||'';
  if(!id){
    const raw=norm(change?.skill_name||change?.label||'');
    id=ids.find(key=>[{...(styles[key]?.special||{}),letter:'SP'},...(styles[key]?.skills||[])].some(skill=>{const n=norm(skill.name),l=norm(skill.letter);return (n&&raw.includes(n))||(l&&raw.startsWith(l));}))||'';
  }
  if(!id) id=originalStyleId(ch)||ids[0]||'';
  return {character:ch,id,style:styles[id]||null};
}
function resolvePatchSkill(style,change){
  if(!style) return null;
  const raw=norm(change?.skill_name||change?.label||'');
  const skills=[{...(style.special||{}),letter:'SP'},...(style.skills||[])];
  return skills.find(skill=>{const n=norm(skill.name),l=norm(skill.letter);return (n&&raw.includes(n))||(l&&raw.startsWith(l));})||null;
}
function numericValues(value){
  return (Array.isArray(value)?value:[value]).map(v=>parseFloat(String(v??'').replace(',','.'))).filter(Number.isFinite);
}
function toneForMetric(label,before,after,existing){
  const b=numericValues(before),a=numericValues(after); if(!b.length||!a.length) return ['buff','nerf','adjust'].includes(norm(existing))?norm(existing):'adjust';
  const beforeAvg=b.reduce((x,y)=>x+y,0)/b.length,afterAvg=a.reduce((x,y)=>x+y,0)/a.length;
  if(afterAvg===beforeAvg) return 'adjust';
  const metric=norm(label);
  const lowerIsBetter=/(reload|recharge|cooldown|temps_de_recharge|penalty|penalite|consommation|use_ammo)/.test(metric);
  const improved=lowerIsBetter?afterAvg<beforeAvg:afterAvg>beforeAvg;
  return improved?'buff':'nerf';
}
function transformPatchNotes(){
  const data=window.MHUR_HOME_DATA; if(!data||!Array.isArray(data.patch_notes)) return;
  if(!originalPatchNotes) originalPatchNotes=clone(data.patch_notes);
  const notes=clone(originalPatchNotes);
  notes.forEach(note=>{
    note.title=translateFr(note.title);
    (note.details||[]).forEach(section=>{
      section.title=translateFr(section.title); section.note=translateFr(section.note);
      section.changes=(section.changes||[]).filter(change=>!/^no_changes_detected\.?$/i.test(norm(change?.text||change?.note||''))).map(change=>{
        const info=resolvePatchStyle(change); const skill=resolvePatchSkill(info.style,change);
        const rawLabel=change.label||change.skill_name||'';
        change.character=info.character?.name||clean(change.character);
        change.style=clean(info.style?.name||change.style||'Original');
        change.role=roleText(info.style?.role||change.role);
        change.portrait=officialPortrait(info.id,change.portrait);
        if(skill?.img) change.skill_image=skill.img;
        if(skill?.name) change.skill_name=clean(`${skill.letter&&skill.letter!=='SP'?`${skill.letter} - `:''}${pick(skill.name)}`);
        else change.skill_name=translateFr(change.skill_name);
        change.label=translateFr(change.label);
        change.bullets=(change.bullets||[]).map(translateFr);
        change.tone=toneForMetric(rawLabel,change.before,change.after,change.tone);
        return change;
      });
    });
  });
  data.patch_notes=notes;
}
function decoratePatchModal(){
  const modal=document.getElementById('patchModalV296'); if(!modal) return;
  const adjust=modal.querySelector('.legendV296 .adjust'); if(adjust) adjust.textContent=langNow()==='fr'?'NEUTRE':'NEUTRAL';
  modal.querySelectorAll('.detailCardV296').forEach(card=>{
    const tone=card.classList.contains('buff')?'BUFF':card.classList.contains('nerf')?'NERF':(langNow()==='fr'?'NEUTRE':'NEUTRAL');
    card.dataset.toneLabel=tone;
  });
}
let originalOpenPatch=null;
function installPatchWrapper(){
  if(!originalOpenPatch&&typeof window.openPatchNoteV296==='function') originalOpenPatch=window.openPatchNoteV296;
  if(!originalOpenPatch) return;
  window.openPatchNoteV296=function(index){transformPatchNotes();const result=originalOpenPatch(index);setTimeout(decoratePatchModal,0);return result;};
}

function install(){
  if(typeof characters!=='undefined') characters.forEach(ch=>{ch.styles=uniqueStyleIds(ch);});
  if(typeof card==='function'){window.card=characterCardV10;try{card=characterCardV10}catch(_e){}}
  if(typeof stylePicker==='function'){window.stylePicker=stylePickerV10;try{stylePicker=stylePickerV10}catch(_e){}}
  window.tables=tablesV10;try{tables=tablesV10}catch(_e){}
  transformPatchNotes(); installPatchWrapper();
}
function wrapRender(){
  if(typeof render!=='function'||render.__s18V10) return;
  const old=render;
  const next=function(){install();const output=old.apply(this,arguments);return output;};
  next.__s18V10=true;window.render=next;try{render=next}catch(_e){}
}
install();wrapRender();
setTimeout(()=>{try{install();if(typeof render==='function'){window.__keepScroll=true;render();}}catch(error){console.error('[MHUR S18 V10]',error);}},0);
window.addEventListener('mhur:languagechange',()=>{try{install();if(typeof render==='function')render();}catch(_e){}});
})();
