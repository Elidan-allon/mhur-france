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
function remoteRowForStyle(styleId){
  const data=exactData()||{};
  if(data.exact_by_style?.[styleId]) return data.exact_by_style[styleId];
  if(typeof characters==='undefined'||typeof styles==='undefined') return null;
  const ch=(characters||[]).find(c=>(c.styles||[]).map(String).includes(String(styleId)));
  if(!ch) return null;
  const candidates=(Array.isArray(data.characters)?data.characters:[]).filter(row=>norm(row?.base_name||row?.name)===norm(ch.name));
  if(!candidates.length) return null;
  const wanted=norm(styles[styleId]?.name||'Original');
  const byName=candidates.find(row=>norm(row?.style_name||row?.style_header||'Original')===wanted||norm(row?.style_header||'').includes(wanted));
  if(byName) return byName;
  const ids=Array.from(new Set((ch.styles||[]).map(String))).filter(id=>styles[id]);
  const index=Math.max(0,ids.indexOf(String(styleId)));
  return candidates.find(row=>Number(row?.variant_index||0)===index)||candidates[index]||candidates[0];
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
function releaseTimeV24(value){
  const time=Date.parse(String(value||''));
  return Number.isFinite(time)?time:null;
}
function latestReleasedCostumeIdsV24(sync){
  const now=Date.now();
  const released=Object.entries(sync?.costumes||{}).map(([id,row])=>({id:String(id),time:releaseTimeV24(row?.releaseDate),upcoming:Boolean(row?.upcoming)})).filter(row=>row.time!=null&&!row.upcoming&&row.time<=now);
  if(!released.length)return [];
  const latest=Math.max(...released.map(row=>row.time));
  return released.filter(row=>row.time===latest).map(row=>row.id);
}
function latestHomeIdsV24(kind,key){
  const rows=(window.MHUR_HOME_DATA?.latest_releases||[]).filter(row=>String(row?.release_kind||'').toLowerCase()===kind&&String(row?.[key]||''));
  if(!rows.length)return [];
  const now=Date.now();
  const dated=rows.map(row=>({id:String(row[key]),time:releaseTimeV24(row.releaseDate)})).filter(row=>row.time!=null&&row.time<=now);
  if(dated.length){const latest=Math.max(...dated.map(row=>row.time));return Array.from(new Set(dated.filter(row=>row.time===latest).map(row=>row.id)))}
  return [String(rows[0][key])];
}
function newSets(){
  const sync=window.MHUR_SEASON18_DATA||{};
  const hasActive=Boolean(sync.active_new_content&&typeof sync.active_new_content==='object');
  const data=hasActive?sync.active_new_content:(sync.new_content||{});  const characters=Array.from(new Set([...((data.characters)||[]),'gentle_criminal']));  const stylesList=Array.from(new Set([...((data.styles)||[]),'gentle_criminal_technical']));
  const latestCostumes=latestReleasedCostumeIdsV24(sync);
  /* V572 merge latest costume wave */  const costumes=Array.from(new Set([...((data.costumes)||[]),...latestCostumes,'108000000']));
  return {
    characters:new Set(characters.map(String)),
    styles:new Set(stylesList.map(String)),
    costumes:new Set(costumes.map(String))
  };
}

/* ---------- Portraits officiels ---------- */
function inferredRemotePortraits(row){
  const alpha=String(row?.assets?.alpha||'');
  if(!alpha) return [];
  const variant=Number(row?.variant_index||0);
  const base=alpha.replace('/GUI/Skill/','/GUI/FaceIcon/');
  const char=(alpha.match(/T_ui_Skill_(Ch\d+)_Unique1/i)||[])[1]||'';
  if(!char) return [];
  const prefix=base.replace(/T_ui_Skill_Ch\d+_Unique1\.png(?:\?.*)?$/i,'');
  const suffix=String(variant).padStart(2,'0');
  return [
    `${prefix}T_ui_${char}_CharaImage.png`,
    `${prefix}T_ui_${char}_CharaImage_${suffix}.png`,
    `${prefix}T_ui_${char}_${suffix}_CharaImage.png`,
    `${prefix}T_ui_${char}_CharaImage_Var${suffix}.png`
  ];
}
function originalRemotePortrait(row){
  const data=exactData()||{};
  const list=[...(Array.isArray(data.characters)?data.characters:[]),...Object.values(data.exact_by_style||{})];
  const base=norm(row?.base_name||row?.name||'');
  const original=list.find(x=>norm(x?.base_name||x?.name||'')===base&&Number(x?.variant_index||0)===0&&x?.assets?.portrait);
  return original?.assets?.portrait||'';
}
function databaseStyleAssets(styleId){
  const map=window.MHUR_DATABASE_ASSETS?.styles||{};
  const id=String(styleId||'');
  if(map[id]) return map[id];
  if(/gentle[_-]?criminal/i.test(id)) return map.gentle_criminal_technical||map.gentle_criminal||{};
  return {};
}
function manualPortrait(styleId){
  return databaseStyleAssets(styleId).portrait||'';
}
function portraitCandidates(styleId,fallback){
  const sync=window.MHUR_SEASON18_DATA?.official_portraits||{};
  const row=remoteRowForStyle(styleId)||null;
  const database=databaseStyleAssets(styleId);
  const official=[database.portrait,sync[styleId],row?.assets?.portrait,...inferredRemotePortraits(row),originalRemotePortrait(row)].filter(Boolean).map(String);
  if(official.length) return Array.from(new Set(official));
  return Array.from(new Set([fallback].filter(Boolean).map(String)));
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
  Object.keys(styles).forEach(id=>{
    const database=databaseStyleAssets(id);
    const st=styles[id];
    if(database.portrait) st.portrait=database.portrait;
    if(database.special&&st.special) st.special.img=database.special;
    const skillKeys={alpha:'α',beta:'β',gamma:'γ'};
    Object.entries(skillKeys).forEach(([key,letter])=>{
      if(!database[key]||!Array.isArray(st.skills)) return;
      const skill=st.skills.find(item=>norm(item?.letter)===norm(letter)||norm(item?.letter)===norm(key));
      if(skill) skill.img=database[key];
    });
    if(typeof tunings!=='undefined'&&Array.isArray(tunings?.[id])&&database.tuning){
      const specialTuning=tunings[id].find(item=>String(item?.type||'').toUpperCase()==='SP')||tunings[id][0];
      if(specialTuning) specialTuning.img=database.tuning;
    }
    const candidates=portraitCandidates(id,st.portrait);
    if(candidates[0]) st.portrait=candidates[0];
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
  ch.styles=[styleId];
  st.name={fr:'Original',en:'Original'}; st.role='technical'; st.pv=String(row?.stats?.['Max Main Health']||row?.stats?.['Max Health']||st.pv||300);
  st.portrait=databaseStyleAssets(styleId).portrait||databaseStyleAssets('gentle_criminal_technical').portrait||st.portrait;
  ch.portrait=st.portrait;
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
function roleGradient(ids){
  const colors={attack:'#d71938',assault:'#d6b600',technical:'#8c16bd',support:'#18a94d',rapid:'#16b9d6'};
  const roles=[];
  (ids||[]).forEach(id=>{const key=roleKey(styles[id]?.role);if(!roles.includes(key))roles.push(key)});
  if(!roles.length) roles.push('technical');
  if(roles.length===1){const c=colors[roles[0]];return `radial-gradient(circle at 50% 28%,color-mix(in srgb, ${c} 62%, white) 0%,${c} 52%,color-mix(in srgb, ${c} 62%, black) 100%)`;}
  const stops=[];roles.forEach((r,i)=>{const a=(i/roles.length)*100,b=((i+1)/roles.length)*100;stops.push(`${colors[r]} ${a}%`,`${colors[r]} ${b}%`)});
  return `linear-gradient(135deg,${stops.join(',')})`;
}
function cardV9(character,mode='characters'){
  const sets=newSets();
  const ids=uniqueStyleIds(character); character.styles=ids;
  const first=ids[0]||''; const role=roleKey(styles[first]?.role);
  const modeClass=mode==='costumes'?' costumeMode':mode==='builds'?' buildMode':mode==='tunings'?' tuningMode':' characterMode';
  const tag=mode==='costumes'?`<div class="cardModeTag">${tr('costumeTag')}</div>`:mode==='builds'?`<div class="cardModeTag">${tr('buildTag')}</div>`:mode==='tunings'?'<div class="cardModeTag">T.U.N.I.N.G</div>':'<div class="cardModeTag">PERSONNAGE</div>';
  const message=mode==='costumes'?tr('costumeChoose'):mode==='builds'?tr('buildChoose'):mode==='tunings'?tr('tuningChoose'):tr('choose');
  return `<button class="card${modeClass} s18CharacterCardV9 s18CharacterCardV10 role-${role}" style="--s18-card-bg:${esc(roleGradient(ids))}" data-char="${esc(character.id)}" onclick="selectChar('${String(character.id).replace(/'/g,"\\'")}')">${sets.characters.has(String(character.id))?NEW_HTML:''}${tag}<div class="thumb">${portraitImg(first,styles[first]?.portrait||character.portrait,character.name,'s18PortraitImgV9 s18PortraitImgV10')}</div><div class="cardBody"><h3>${esc(character.name)}</h3><div class="badges">${sideBadge(character.side)}${uniqueRoles(ids).map(r=>roleBadge(r)).join('')}</div><p style="color:#c9d7ee">${esc(message)}</p></div></button>`;
}
function stylePickerV9(){
  const sets=newSets();
  const character=characters.find(x=>x.id===selectedChar); if(!character) return '';
  const ids=uniqueStyleIds(character); character.styles=ids;
  return `<button class="back" onclick="selectedChar=null;render()">← ${tr('back')}</button><h1 class="title">${esc(character.name)}</h1><div class="styleGrid">${ids.map(id=>{ const st=styles[id]; const role=roleKey(st.role); return `<button class="styleCard s18StyleCardV9 s18StyleCardV10 role-${role}" data-style="${esc(id)}" onclick="selectStyle('${String(id).replace(/'/g,"\\'")}')">${sets.styles.has(String(id))?NEW_HTML:''}<div class="styleBanner">${portraitImg(id,st.portrait,`${character.name} ${clean(st.name)}`,'s18StylePortraitV9 s18StylePortraitV10')}</div><div class="styleInfo"><h2>${esc(clean(st.name)||'Original')}</h2><div class="badges">${sideBadge(character.side)}${roleBadge(st.role)}</div></div></button>`; }).join('')}</div>`;
}
function characterDetailV9(styleId){
  const st=styles[styleId]; if(!st) return '';
  const character=characters.find(x=>(x.styles||[]).includes(styleId))||{name:'Personnage',side:'hero'};
  const role=roleKey(st.role);
  const back=currentLang()==='fr'?'Retour':'Back';
  const roleTitle=currentLang()==='fr'?'Rôle':'Role';
  const quirkTitle=currentLang()==='fr'?'Alter':'Quirk Skills';
  return `<button class="back" onclick="selectedStyle=null;if((characters.find(x=>x.id===selectedChar)||{}).styles?.length===1)selectedChar=null;render()">← ${back}</button><div class="charPanel role-${role} s18CharacterDetailV9 s18CharacterDetailV10"><div class="charTop"><div class="portrait">${portraitImg(styleId,st.portrait,character.name,'s18DetailPortraitV9 s18DetailPortraitV10')}</div><div class="meta"><h2>${esc(character.name)}</h2><div class="badges">${roleBadge(st.role)}<span class="badge s18HpBadgeV9">${currentLang()==='fr'?'PV':'HP'} : ${esc(st.pv)}</span></div><p><b>Style :</b> ${esc(clean(st.name)||'Original')}</p><p>${esc(clean(st.description))}</p><p><b>${roleTitle} :</b> ${esc(clean(st.roleDesc))}</p></div></div>${skillSection({letter:'SP',...st.special},true)}<h2 class="s18QuirkTitleV9">${quirkTitle}</h2>${(st.skills||[]).map(skill=>skillSection(skill,false)).join('')}</div>`;
}

let baseCostumeCard=null;
function installRenders(){
  if(typeof card==='function'){ window.card=cardV9; try{card=cardV9}catch(_e){} }
  if(typeof stylePicker==='function'){ window.stylePicker=stylePickerV9; try{stylePicker=stylePickerV9}catch(_e){} }
  if(typeof characterDetail==='function'){ window.characterDetail=characterDetailV9; try{characterDetail=characterDetailV9}catch(_e){} }
  if(!baseCostumeCard&&typeof costumeCard==='function') baseCostumeCard=costumeCard;
  if(baseCostumeCard){
    const costumeV9=function(ct){
      const id=String(ct?.urId??ct?.ur_id??String(ct?.id||'').replace(/^ur_/,''));
      const official=window.MHUR_DATABASE_ASSETS?.costumes?.[id]||'';
      const officialCostume=official?{...ct,img:official}:ct;
      let html=String(baseCostumeCard(officialCostume)||'');
      /* V578 preserve data-costume */
      if(id&&!/\bdata-costume\s*=/.test(html)) html=html.replace(/^(<(?:button|div)\b)/i,`$1 data-costume="${esc(id)}"`);
      /* V572 preserve costume id */
      if(id&&!/\bdata-costume\s*=/.test(html)) html=html.replace(/^(<(?:button|div)\b)/i,`$1 data-costume="${esc(id)}"`);
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
/* Le layout initial est déjà exécuté par index.html. Aucun render() forcé ici :
   cela évite les doubles rendus et les boucles de chargement. */
window.addEventListener('mhur:languagechange',()=>{
  try{ applyAll(); }catch(_e){}
});
})();
/* ========================================================================== */
/* MHUR Nexus — Saison 18 v10 : navigation, sorties, patch/dev notes, mods   */
/* ========================================================================== */
(function(){
'use strict';

const L=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const TX=(fr,en)=>L()==='en'?en:fr;
const PICK=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[L()]??v.fr??v.en??''):v;
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CLEAN=v=>String(PICK(v)??'').replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g,'').replace(/\s{2,}/g,' ').trim();
const NORM=v=>CLEAN(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const ROLE=v=>({strike:'attack',attack:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[NORM(v)]||'technical';
const ROLE_TEXT=v=>({fr:{attack:'Attaque',assault:'Assaut',technical:'Technique',support:'Soutien',rapid:'Vitesse'},en:{attack:'Strike',assault:'Assault',technical:'Technical',support:'Support',rapid:'Rapid'}}[L()][ROLE(v)]||CLEAN(v));
const SIDE_TEXT=v=>TX(NORM(v)==='villain'?'SUPER-VILAINS':'HÉROS',NORM(v)==='villain'?'SUPER-VILLAINS':'HEROES');

function characterBy(fragment){
  if(typeof characters==='undefined')return null;
  const n=NORM(fragment);
  return (characters||[]).find(c=>NORM(c.id)===n||NORM(c.name)===n||NORM(c.id).includes(n)||NORM(c.name).includes(n))||null;
}
function styleIds(ch){
  if(!ch||typeof styles==='undefined')return [];
  const seen=new Set();const out=[];
  (ch.styles||[]).forEach(raw=>{const id=String(raw);if(!id||seen.has(id)||!styles[id])return;seen.add(id);out.push(id)});
  return out;
}
function findStyle(ch,matcher){
  return styleIds(ch).find(id=>matcher(styles[id],id))||'';
}
function imgHtml(src,alt,cls=''){
  return src?`<img src="${ESC(src)}" alt="${ESC(alt)}" class="${ESC(cls)}" loading="lazy">`:'';
}

/* --------------------------- Sorties de la saison ------------------------ */
function seasonReleases(){
  const gentle=characterBy('gentle criminal');
  const twice=characterBy('twice');
  const tsuyu=characterBy('tsuyu')||characterBy('froppy');
  const gentleStyle=styleIds(gentle)[0]||'';
  const twiceStyle=findStyle(twice,(st,id)=>NORM(st?.name).includes('sad_man')||ROLE(st?.role)==='support')||styleIds(twice)[0]||'';
  const tsuyuStyle=findStyle(tsuyu,st=>ROLE(st?.role)==='attack')||styleIds(tsuyu)[0]||'';
  return [
    {key:'gentle',kind:'character',charId:gentle?.id||'gentle_criminal',styleId:gentleStyle,title:'Gentle Criminal',subtitle:TX('Nouveau personnage · Technique','New character · Technical'),date:TX('Disponible depuis le 29 juillet','Available since July 29'),role:'technical',art:'assets/home/season18/gentle_s18_portrait.webp'},
    {key:'twice',kind:'style',charId:twice?.id||'twice',styleId:twiceStyle,title:'Twice',subtitle:"Sad Man's Parade · "+TX('Soutien','Support'),date:TX('Sortie le 19 août','Releases August 19'),role:'support',art:'assets/home/season18/twice_s18_portrait.webp'},
    {key:'tsuyu',kind:'style',charId:tsuyu?.id||'tsuyu',styleId:tsuyuStyle,title:tsuyu?.name||'Tsuyu Asui',subtitle:TX('Nouveau style · nom à venir','New style · name to be announced'),date:TX('Prévu pendant la Saison 18','Planned during Season 18'),role:'attack',art:'assets/mhur_database/characters/tsuyu_rapid/portrait.webp',black:true}
  ];
}
function seasonCard(item){
  const icon=item.kind==='character'?'assets/home/icons/release_character.png':'assets/home/icons/release_style.png';
  const art=item.black?`<span class="s18SeasonBlackV10">${imgHtml(item.art,item.title,'s18SeasonProfileV10')}</span>`:`<span class="s18SeasonArtV10" style="background-image:url('${ESC(item.art).replace(/'/g,'%27')}')"></span>`;
  return `<button type="button" class="releaseCardV299 s18SeasonReleaseV10 role-${ESC(ROLE(item.role))}" data-release-char="${ESC(item.charId)}" data-release-style="${ESC(item.styleId)}" onclick="openHomeReleaseV298(this)" title="${ESC(item.title)} — ${ESC(item.subtitle)}">${art}<span class="s18SeasonShadeV10"></span><span class="releaseBadgeV299 ${item.kind}">${typeof img==='function'?img(icon,item.kind):imgHtml(icon,item.kind)}</span>${item.key==='gentle'?'<span class="s18SeasonNewV10" aria-hidden="true"></span>':''}<span class="releaseNamesV299"><b>${ESC(item.title)}</b><small>${ESC(item.subtitle)}</small><em>${ESC(item.date)}</em></span></button>`;
}
function patchHome(){
  const home=document.querySelector('.homeV296');if(!home)return;
  const headings=[...home.querySelectorAll('.homeTitleV296')];
  const releaseHeading=headings.find(h=>/derni[eè]res sorties|latest releases|sorties pr[eé]vues|planned releases/i.test(h.textContent||''));
  if(releaseHeading)releaseHeading.textContent=TX('SORTIES PRÉVUES — SAISON 18','SEASON 18 PLANNED RELEASES');
  const grid=home.querySelector('.releaseGridV296');
  if(grid&&!grid.querySelector('.s18PlannedCardV14')&&typeof window.MHUR_S18_PLANNED_HTML==='function'){
    grid.className='releaseGridV296 s18PlannedGridV12 s18PlannedGridV13 s18PlannedGridV14';
    grid.innerHTML=window.MHUR_S18_PLANNED_HTML();
  }
  const patchHeading=headings.find(h=>/derni[eè]re note de mise [aà] jour|latest patch note/i.test(h.textContent||''));
  if(patchHeading){
    patchHeading.hidden=true;
    const previous=patchHeading.previousElementSibling;if(previous?.classList.contains('homeDividerV296'))previous.hidden=true;
    let next=patchHeading.nextElementSibling;
    while(next&&!next.classList.contains('homeFootV296')){const current=next;next=next.nextElementSibling;current.hidden=true;}
  }
}

/* --------------------------- Patch / Dev Notes --------------------------- */
function translatePatch(v){
  let out=CLEAN(v);
  if(L()==='en')return out;
  const exact={
    'HP':'PV','Foot Boost':'Boost du pied','Penalty Recharge':'Pénalité de recharge',
    'Hollow Point Shot':'Tir à pointe creuse','AP Shot Cluster':'Tir AP : Cluster',
    'Delaware Smash Airblast':"Delaware Smash : Rafale d'air",
    'Delaware Smash Full Bullet!':'Delaware Smash Full Bullet !',
    'No. of Rounds':'Munitions max.','Magazine':'Munitions max.',
    'Special Action':'Action spéciale','Adjustment':'Neutre'
  };
  if(exact[out])return exact[out];
  const replacements=[
    [/^Data Update/i,'Mise à jour des données'],[/^Balance Changes:\s*/i,"Équilibrage : "],
    [/Maximum Main Health|Maximum HP|Max HP/gi,'PV maximum'],[/^HP$/gi,'PV'],[/Health/gi,'PV'],
    [/No\. of Rounds|Magazine/gi,'Munitions max.'],[/Use Ammo/gi,'Consommation'],[/Ammo/gi,'Munitions'],
    [/Penalty Recharge/gi,'Pénalité de recharge'],[/Reload Speed/gi,'Vitesse de recharge'],[/Reload|Cooldown/gi,'Recharge'],
    [/Guard Break/gi,'Brise-garde'],[/Damage/gi,'Dégâts'],[/Special Action/gi,'Action spéciale'],[/Quirk Skill/gi,'Alter'],
    [/Foot Boost/gi,'Boost du pied'],[/Hollow Point Shot/gi,'Tir à pointe creuse'],[/Airblast/gi,"Rafale d'air"],
    [/Before/gi,'Avant'],[/After/gi,'Après'],[/Adjustment/gi,'Neutre'],[/No changes detected\.?/gi,'Aucun changement détecté.'],
    [/Technical/gi,'Technique'],[/Strike/gi,'Attaque'],[/Rapid/gi,'Vitesse'],[/Support/gi,'Soutien'],[/Assault/gi,'Assaut']
  ];
  replacements.forEach(([a,b])=>{out=out.replace(a,b)});return out;
}
function styleForChange(change){
  const ch=characterBy(change?.character||'');if(!ch)return {ch:null,id:'',st:null};
  const ids=styleIds(ch);const wanted=NORM(change?.style||'Original');
  let id=ids.find(x=>NORM(styles[x]?.name||'Original')===wanted)||'';
  if(!id){
    const skill=NORM(change?.skill_name||change?.label||'');
    id=ids.find(x=>[{...(styles[x]?.special||{}),letter:'SP'},...(styles[x]?.skills||[])].some(s=>{const n=NORM(s?.name),l=NORM(s?.letter);return (n&&skill.includes(n))||(l&&skill.startsWith(l))}))||'';
  }
  if(!id)id=ids[0]||'';
  return {ch,id,st:styles[id]||null};
}
function skillForChange(st,change){
  if(!st)return null;const raw=NORM(change?.skill_name||change?.label||'');
  const all=[{...(st.special||{}),letter:'SP'},...(st.skills||[])];
  return all.find(s=>{const n=NORM(s?.name),l=NORM(s?.letter);return (n&&raw.includes(n))||(l&&raw.startsWith(l))})||null;
}
function average(values){const n=(Array.isArray(values)?values:[values]).map(v=>parseFloat(String(v).replace(',','.'))).filter(Number.isFinite);return n.length?n.reduce((a,b)=>a+b,0)/n.length:null}
function toneFor(change,sectionTitle=''){
  const explicit=NORM(change?.tone||change?.type||'');
  if(/buff|increase|improve|up/.test(explicit))return 'buff';
  if(/nerf|decrease|reduce|down/.test(explicit))return 'nerf';
  const before=average(change?.before),after=average(change?.after);if(before==null||after==null||before===after)return 'adjust';
  const context=NORM(`${sectionTitle} ${change?.label||''} ${change?.skill_name||''}`);
  const lowerIsBetter=/reload|cooldown|recharge|time|second|seconde/.test(context);
  if(lowerIsBetter)return after<before?'buff':'nerf';
  return after>before?'buff':'nerf';
}
function valuesHtml(change,tone){
  const before=Array.isArray(change?.before)?change.before:[change?.before];const after=Array.isArray(change?.after)?change.after:[change?.after];const count=Math.max(before.length,after.length);
  if(count>1)return `<div class="s18PatchTableWrapV10"><table class="s18PatchTableV10"><thead><tr><th></th>${Array.from({length:count},(_,i)=>`<th>Lv.${i+1}</th>`).join('')}</tr></thead><tbody><tr class="before"><th>${TX('Avant','Before')}</th>${Array.from({length:count},(_,i)=>`<td>${ESC(CLEAN(before[i]??''))}</td>`).join('')}</tr><tr class="after ${tone}"><th>${TX('Après','After')}</th>${Array.from({length:count},(_,i)=>`<td>${ESC(CLEAN(after[i]??''))}</td>`).join('')}</tr></tbody></table></div>`;
  if(change?.before!=null||change?.after!=null)return `<div class="s18PatchRow"><span class="s18PatchBefore">${ESC(CLEAN(before[0]??'—'))}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter ${tone}">${ESC(CLEAN(after[0]??'—'))}</span></div>`;
  return '';
}
function groupsForSection(section){
  const groups=[];const map=new Map();
  (section?.changes||[]).forEach(change=>{
    if(/no changes detected|aucun changement/i.test(CLEAN(change?.text||change?.note||'')))return;
    const info=styleForChange(change);const key=`${NORM(change?.character)}__${info.id||NORM(change?.style||'Original')}`;
    if(!map.has(key)){const group={ch:info.ch,st:info.st,id:info.id,character:info.ch?.name||CLEAN(change?.character),style:CLEAN(info.st?.name||change?.style||'Original'),changes:[]};map.set(key,group);groups.push(group)}
    map.get(key).changes.push(change);
  });return groups;
}
function groupHtml(group,sectionTitle){
  const role=ROLE(group.st?.role||'technical');const side=group.ch?.side||'hero';
  return `<article class="s18PatchCharacterV10 role-${role}"><header><div class="s18PatchPortraitV10">${group.st?.portrait&&typeof asset==='function'?asset(group.st.portrait,group.character):''}</div><div><h4>${ESC(group.character)}</h4><strong>${ESC(group.style)}</strong><div class="s18PatchBadgesV10"><span class="badge ${side==='villain'?'villain':'hero'}">${ESC(SIDE_TEXT(side))}</span><span class="badge ${role}">${ESC(ROLE_TEXT(role))}</span></div></div></header><div class="s18PatchChangesV10">${group.changes.map(change=>{const tone=toneFor(change,sectionTitle);const skill=skillForChange(group.st,change);const title=translatePatch(CLEAN(skill?.name||change?.skill_name||change?.label||TX('Ajustement','Adjustment')));const picture=skill?.img||change?.skill_image||'';const bullets=(change?.bullets||[]).map(translatePatch).filter(Boolean);return `<section class="s18PatchChangeV10 ${tone}"><span class="s18ToneV10 ${tone}">${tone==='buff'?'BUFF':tone==='nerf'?'NERF':TX('NEUTRE','NEUTRAL')}</span><div class="s18PatchSkillV10">${picture&&typeof asset==='function'?`<div>${asset(picture,title)}</div>`:''}<main><h5>${ESC(title)}</h5>${change?.label?`<p class="s18PatchLabelV10">${ESC(translatePatch(change.label))}</p>`:''}${valuesHtml(change,tone)}${bullets.length?`<ul>${bullets.map(b=>`<li>${ESC(b)}</li>`).join('')}</ul>`:''}</main></div></section>`}).join('')}</div></article>`;
}
function patchDetailHtml(note){
  const sections=(note?.details||[]).map(sec=>({...sec,changes:(sec.changes||[]).filter(Boolean)})).filter(sec=>sec.changes.length);
  if(sections.length)return sections.map(sec=>`<section class="s18PatchSectionV10"><h3>${ESC(translatePatch(sec.title))}</h3>${sec.note?`<p>${ESC(translatePatch(sec.note))}</p>`:''}<div class="s18PatchSeparatedV10">${groupsForSection(sec).map(g=>groupHtml(g,sec.title)).join('')}</div></section>`).join('');
  if((note?.rich_blocks||[]).length)return `<div class="s18DevArticleV10">${note.rich_blocks.map(b=>b.type==='heading'?`<h3>${ESC(translatePatch(b.text))}</h3>`:b.type==='image'&&typeof asset==='function'?`<figure>${asset(b.src,b.alt||'')}</figure>`:`<p>${ESC(translatePatch(b.text))}</p>`).join('')}</div>`;
  return `<p>${TX('Aucun détail disponible.','No details available.')}</p>`;
}
function devHtml(){
  return `<article class="s18DevArticleV10"><div class="s18DevHeroV10"><span>DEV BLOG VOL. 27</span><h2>Developer Notes — Season 18</h2><p>29/07/2026 · Bandai Namco / Byking</p></div><section><h3>20 ${TX('millions de téléchargements','million downloads')}</h3><p>${TX('Un bonus de connexion spécial de 28 jours célèbre ce cap, avec notamment 6 000 Cristaux Héros et 100 Tickets de tirage.','A special 28-day login bonus celebrates the milestone, including 6,000 Hero Crystals and 100 Roll Tickets.')}</p></section><section><h3>Gentle Criminal & La Brava</h3><p>${TX("Gentle est pensé comme un personnage Technique très mobile. Son Alter Élasticité crée des rebonds, une barrière d'air et un trampoline utilisable par les alliés. La Brava le soutient avec son drone et Lover Mode augmente sa puissance et sa recharge pendant Plus Chaos.","Gentle is designed as a highly mobile Technical character. Elasticity creates rebounds, an air barrier, and an ally-usable trampoline. La Brava supports him with her drone, while Lover Mode boosts attack and reload during Plus Chaos.")}</p></section><section><h3>Chaos City Ver. 02</h3><p>${TX("Le quartier commercial a été profondément rénové et une nouvelle zone souterraine, Tentoin Alley, permet de circuler par des passages sous la ville.","The shopping district has been heavily renovated, with the new underground Tentoin Alley area connecting parts of the city.")}</p></section><section><h3>Research Notebook</h3><p>${TX('La Mission n° 3, plus difficile, est ajoutée. Le niveau maximum passe à 200 avec de nouvelles récompenses, dont des Tickets et des objets T.U.N.I.N.G.','The more challenging Mission No. 3 is added. The level cap rises to 200 with new rewards, including Tickets and T.U.N.I.N.G items.')}</p></section><section><h3>3-Pick Battle</h3><p>${TX('Ce nouveau mode est prévu à partir de la fin août. Chaque joueur choisit trois styles et le vainqueur est celui qui inflige le plus de dégâts.','This new mode is planned from late August. Each player selects three styles, and the winner is the player who deals the most damage.')}</p></section><div class="s18OfficialLinksV10"><a href="https://en.bandainamcoent.eu/my-hero-academia/news/my-hero-ultra-rumble-development-blog-vol-27" target="_blank" rel="noopener">${TX('Lire la Dev Note officielle','Read the official Dev Note')}</a><a href="https://en.bandainamcoent.eu/my-hero-academia/news/my-hero-ultra-rumble-season-18" target="_blank" rel="noopener">${TX('Voir la page officielle Saison 18','View the official Season 18 page')}</a></div></article>`;
}
function notesModal(){
  let modal=document.getElementById('s18NotesDevModalV10');
  if(!modal){
    modal=document.createElement('div');modal.id='s18NotesDevModalV10';modal.className='s18NotesOverlayV10';
    modal.innerHTML=`<section class="s18NotesPanelV10" tabindex="-1"><header><div><span>MHUR NEXUS</span><h2 data-notes-title></h2></div><button type="button" data-close>×</button></header><nav><button type="button" data-tab="patch" class="active"></button><button type="button" data-tab="dev"></button></nav><div class="s18NotesBodyV10"><aside></aside><main></main></div></section>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close]').onclick=()=>{modal.classList.remove('open');document.body.classList.remove('s18NotesOpenV11')};
    modal.onclick=e=>{if(e.target===modal){modal.classList.remove('open');document.body.classList.remove('s18NotesOpenV11')}};
    modal.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>showNotesTab(btn.dataset.tab));
  }
  modal.querySelector('[data-notes-title]').textContent='Patch Notes / Dev Notes';
  modal.querySelector('[data-tab="patch"]').textContent='Patch Notes';
  modal.querySelector('[data-tab="dev"]').textContent='Dev Notes';
  return modal;
}
function resetNotesScroll(modal,resetAside=false){
  const main=modal.querySelector('.s18NotesBodyV10>main'),aside=modal.querySelector('.s18NotesBodyV10>aside');
  if(main)main.scrollTop=0;if(resetAside&&aside)aside.scrollTop=0;
  const panel=modal.querySelector('.s18NotesPanelV10');if(panel)panel.scrollTop=0;
}
function showPatch(index=0){
  const modal=notesModal();const notes=window.MHUR_HOME_DATA?.patch_notes||[];const note=notes[index];
  modal.querySelector('aside').innerHTML=notes.map((n,i)=>`<button type="button" data-patch-index="${i}" class="${i===index?'active':''}"><b>${ESC(translatePatch(n.title))}</b><small>${n.date?new Date(n.date).toLocaleDateString(L()==='fr'?'fr-FR':'en-US'):''}</small></button>`).join('')||`<p>${TX('Aucune note disponible.','No notes available.')}</p>`;
  modal.querySelector('main').innerHTML=note?`<div class="s18PatchDetailHeadV10"><h2>${ESC(translatePatch(note.title))}</h2><div><span class="buff">BUFF</span><span class="nerf">NERF</span><span class="adjust">${TX('NEUTRE','NEUTRAL')}</span></div></div>${patchDetailHtml(note)}`:`<p>${TX('Aucune note disponible.','No notes available.')}</p>`;
  modal.querySelectorAll('[data-patch-index]').forEach(b=>b.onclick=()=>showPatch(Number(b.dataset.patchIndex)));
  requestAnimationFrame(()=>resetNotesScroll(modal,false));
}
function showNotesTab(tab){
  const modal=notesModal();modal.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  const aside=modal.querySelector('aside'),main=modal.querySelector('main');
  if(tab==='dev'){aside.innerHTML=`<div class="s18DevSideV10"><b>DEV BLOG VOL. 27</b><small>${TX('Saison 18','Season 18')}</small></div>`;main.innerHTML=devHtml();requestAnimationFrame(()=>resetNotesScroll(modal,true));}
  else showPatch(0);
}
function openNotes(){
  const modal=notesModal();
  modal.classList.add('open');document.body.classList.add('s18NotesOpenV11');
  showNotesTab('patch');
  requestAnimationFrame(()=>{
    window.MHUR_S18_V18?.refreshNotesLayout?.();
    window.MHUR_S18_V17?.refreshNotesLayout?.();
    resetNotesScroll(modal,true);
    modal.querySelector('.s18NotesPanelV10')?.focus?.({preventScroll:true});
  });
}
function ensureHeaderButton(){
  const candidates=[...document.querySelectorAll('button,a,[role="button"]')].filter(button=>{
    const id=String(button.id||'');
    const cls=String(button.className||'');
    const label=String(button.textContent||'');
    return /^mhurPatchDevButton/i.test(id)||/mhurPatchDevButton/i.test(cls)||/patch\s*notes|dev\s*notes|notes\s*de\s*patch|notes\s*des\s*d[ée]veloppeurs/i.test(label);
  });
  let button=candidates.shift()||null;
  candidates.forEach(extra=>extra.remove());
  document.querySelectorAll('#mhurAdminButton,.mhurAdminTopButton,[data-mhur-admin]').forEach(admin=>{
    if(admin.closest('header,.nexusHeader,.topbar,#topbar,#siteHeader'))admin.remove();
  });
  const account=document.getElementById('mhurAccountButton');
  if(!account?.parentNode)return;
  if(!button)button=document.createElement('button');
  button.id='mhurPatchDevButtonV14';
  button.dataset.s18NotesButton='1';
  button.type='button';
  button.className='nexusHeaderBtn mhurPatchDevButtonV10 mhurPatchDevButtonV14';
  button.innerHTML='<span class="mhurPatchDevIconV12">📝</span><span></span>';
  button.querySelector('span:last-child').textContent='Patch Notes / Dev Notes';
  button.onclick=openNotes;
  if(button.parentNode!==account.parentNode||button.nextSibling!==account)account.parentNode.insertBefore(button,account);
}

/* -------------------------- Administration profil ------------------------ */
const CFG=window.MHUR_COMMUNITY_CONFIG||{};const API=String(CFG.supabaseUrl||'').replace(/\/+$/,'');
async function api(path,opt={}){const runner=window.MHUR_AUTH?.fetch||fetch;const response=await runner(API+path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});const raw=await response.text();let data=raw;try{data=raw?JSON.parse(raw):null}catch(_e){}if(!response.ok)throw new Error(data?.message||data?.hint||data?.error||raw||`HTTP ${response.status}`);return data}
function isAdmin(){return Boolean(window.MHUR_MODERATION?.isAdmin?.()||['admin','administrator','moderator'].includes(String(window.MHUR_MODERATION?.state?.role||'').toLowerCase()))}
function adminCenter(){
  let modal=document.getElementById('s18AdminCenterV10');if(modal)return modal;
  modal=document.createElement('div');modal.id='s18AdminCenterV10';modal.className='s18AdminOverlayV10';modal.innerHTML=`<section class="s18AdminPanelV10"><header><div><span>ADMINISTRATION</span><h2>${TX('Panneau admin','Admin panel')}</h2></div><button type="button" data-admin-close>×</button></header><nav><button data-admin-tab="deletion" class="active">${TX('Suppressions de compte','Account deletions')}</button><button data-admin-tab="moderation">${TX('Modération','Moderation')}</button><button data-admin-tab="profiles">${TX('Profils','Profiles')}</button></nav><main></main></section>`;document.body.appendChild(modal);
  modal.querySelector('[data-admin-close]').onclick=()=>modal.classList.remove('open');modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
  modal.querySelectorAll('[data-admin-tab]').forEach(b=>b.onclick=()=>adminTab(b.dataset.adminTab));return modal;
}
async function deletionRequests(){
  const modal=adminCenter(),main=modal.querySelector('main');main.innerHTML=`<div class="s18AdminLoadingV10">${TX('Chargement des demandes…','Loading requests…')}</div>`;
  try{
    const rows=await api('/rest/v1/account_deletion_requests?select=*&order=requested_at.desc&limit=200')||[];
    const ids=[...new Set(rows.map(r=>r.user_id).filter(Boolean))];let profiles=[];
    if(ids.length)profiles=await api(`/rest/v1/profiles?select=id,username,avatar_url,provider&id=in.(${ids.map(encodeURIComponent).join(',')})`)||[];
    const map=new Map(profiles.map(p=>[String(p.id),p]));
    main.innerHTML=`<div class="s18AdminTitleV10"><div><h3>${TX('Demandes de suppression','Deletion requests')}</h3><p>${TX('Les demandes envoyées depuis Confidentialité apparaissent ici.','Requests submitted from Privacy appear here.')}</p></div><button type="button" data-refresh-deletions>${TX('Actualiser','Refresh')}</button></div>${rows.length?`<div class="s18DeletionListV10">${rows.map(r=>{const p=map.get(String(r.user_id))||{};return `<article><div class="s18DeletionUserV10">${p.avatar_url?imgHtml(p.avatar_url,p.username||''):'<span>👤</span>'}<div><b>${ESC(p.username||TX('Utilisateur inconnu','Unknown user'))}</b><small>${ESC(p.provider||'')} · ${ESC(String(r.user_id||''))}</small></div></div><div><strong class="status-${ESC(r.status||'pending')}">${ESC(r.status||'pending')}</strong><small>${r.requested_at?new Date(r.requested_at).toLocaleString(L()==='fr'?'fr-FR':'en-US'):''}</small></div><div class="s18DeletionActionsV10"><button type="button" data-copy-user="${ESC(r.user_id)}">${TX("Copier l'ID",'Copy ID')}</button><button type="button" data-delete-status="rejected" data-delete-user="${ESC(r.user_id)}">${TX('Refuser','Reject')}</button><button type="button" class="success" data-delete-status="processed" data-delete-user="${ESC(r.user_id)}">${TX('Marquer traitée','Mark processed')}</button></div></article>`}).join('')}</div>`:`<div class="s18AdminEmptyV10">${TX('Aucune demande de suppression.','No deletion requests.')}</div>`}`;
    main.querySelector('[data-refresh-deletions]')?.addEventListener('click',deletionRequests);
    main.querySelectorAll('[data-copy-user]').forEach(b=>b.onclick=()=>navigator.clipboard?.writeText(b.dataset.copyUser));
    main.querySelectorAll('[data-delete-status]').forEach(b=>b.onclick=async()=>{try{await api(`/rest/v1/account_deletion_requests?user_id=eq.${encodeURIComponent(b.dataset.deleteUser)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:b.dataset.deleteStatus})});await deletionRequests()}catch(e){alert(e.message)}});
  }catch(error){main.innerHTML=`<div class="s18AdminErrorV10">${ESC(error.message||error)}</div>`}
}
function adminTab(tab){
  const modal=adminCenter();modal.querySelectorAll('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));const main=modal.querySelector('main');
  if(tab==='deletion')deletionRequests();
  else if(tab==='moderation')main.innerHTML=`<div class="s18AdminLauncherV10"><span>🛡️</span><h3>${TX('Centre de modération','Moderation center')}</h3><p>${TX('Ouvre le panneau existant pour gérer les signalements et sanctions.','Open the existing panel to manage reports and sanctions.')}</p><button type="button" data-open-moderation>${TX('Ouvrir la modération','Open moderation')}</button></div>`,main.querySelector('[data-open-moderation]').onclick=()=>{modal.classList.remove('open');window.MHUR_MODERATION?.openAdmin?.()};
  else main.innerHTML=`<div class="s18AdminLauncherV10"><span>👥</span><h3>${TX('Liste des profils','Profile list')}</h3><p>${TX('Consulte les membres et ouvre leur profil public.','Browse members and open their public profile.')}</p><button type="button" data-open-profiles>${TX('Ouvrir la liste','Open list')}</button></div>`,main.querySelector('[data-open-profiles]').onclick=()=>{modal.classList.remove('open');window.MHUR_PROFILE_DIRECTORY?.open?.()};
}
function openAdminCenter(){if(!isAdmin())return;window.MHUR_AUTH?.close?.();const modal=adminCenter();modal.classList.add('open');adminTab('deletion')}
function injectAdminProfileButton(){
  const admin=document.getElementById('mhurAdminButton');if(admin)admin.style.setProperty('display','none','important');
  const card=document.querySelector('#mhurAuthOverlay .mhurProfileCard');if(!card||!isAdmin())return;
  let button=card.querySelector('.s18ProfileAdminButtonV10');if(button)return;
  button=document.createElement('button');button.type='button';button.className='s18ProfileAdminButtonV10';button.innerHTML=`🛡️ ${TX('Admin / Modération','Admin / Moderation')}`;button.onclick=openAdminCenter;
  const logout=card.querySelector('.mhurLogout');if(logout)card.insertBefore(button,logout);else card.appendChild(button);
}

/* ------------------------------- Mods ------------------------------------ */
let modsSeen=false;
function patchMods(){
  const page=document.querySelector('.modsPage');
  if(page&&!modsSeen){modsSeen=true;requestAnimationFrame(()=>{document.scrollingElement.scrollTop=0;window.scrollTo(0,0)});}
  if(!page)modsSeen=false;
  const details=document.querySelector('.modsTutorial');if(details){const summary=details.querySelector('summary');if(summary&&!summary.querySelector('.s18ModsHintV10'))summary.insertAdjacentHTML('beforeend',`<span class="s18ModsHintV10">${TX('Voir le tutoriel','Open tutorial')}</span>`);}
}

/* ------------------------------- DOM ------------------------------------- */
function watchHeaderButton(){
  if(window.__s18HeaderButtonEventsV18) return;
  window.__s18HeaderButtonEventsV18=true;
  let queued=false;
  const schedule=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;ensureHeaderButton();});
  };
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('mhur-auth-change',schedule);
  window.addEventListener('mhur-role-change',schedule);
  window.addEventListener('mhur:languagechange',schedule);
}
function removeCharacterNew(){}
function afterDom(){ensureHeaderButton();watchHeaderButton();injectAdminProfileButton();patchHome();patchMods();removeCharacterNew();}
function wrapDomRender(){
  if(typeof window.render!=='function'||window.render.__s18v13Dom)return;
  const original=window.render;
  const wrapped=function(){const result=original.apply(this,arguments);afterDom();return result;};
  wrapped.__s18v13Dom=true;window.render=wrapped;try{render=wrapped}catch(_e){}
}
function init(){
  ensureHeaderButton();wrapDomRender();requestAnimationFrame(afterDom);if(window.__s18OpenNotesRequested){window.__s18OpenNotesRequested=false;setTimeout(openNotes,0);}
  window.addEventListener('mhur-auth-change',()=>setTimeout(()=>{ensureHeaderButton();injectAdminProfileButton()},80));
  window.addEventListener('mhur-role-change',()=>setTimeout(()=>{ensureHeaderButton();injectAdminProfileButton()},80));
  window.addEventListener('mhur:languagechange',()=>requestAnimationFrame(afterDom));
}
window.MHUR_S18_V10={openNotes,openAdminCenter,showPatch};
window.MHUR_S18_V13={openNotes,openAdminCenter,showPatch,afterDom};
window.MHUR_S18_V14={openNotes,openAdminCenter,showPatch,afterDom};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* ========================================================================== */
/* MHUR Nexus — Saison 18 v17 : offset patch notes + finitions mobiles       */
/* ========================================================================== */
(function(){
'use strict';

function notesModalV17(){return document.getElementById('s18NotesDevModalV10')}
function noteButtonsV17(){return [...document.querySelectorAll('[data-s18-notes-button],#mhurPatchDevButtonV14,.mhurPatchDevButtonV14')].filter(Boolean)}
function measureHeaderOffsetV17(){
  const candidates=[];
  noteButtonsV17().forEach(btn=>{if(btn) candidates.push(btn); const wrap=btn?.closest('header,.top,#siteHeader,.nexusHeader,.topbar,#topbar'); if(wrap) candidates.push(wrap)});
  ['#siteHeader','.nexusHeader','header.top','.top','#topbar','.topbar'].forEach(sel=>document.querySelectorAll(sel).forEach(el=>candidates.push(el)));
  let bottom=0;
  candidates.forEach(el=>{try{const box=el.getBoundingClientRect(); if(box.width>0&&box.height>0) bottom=Math.max(bottom,box.bottom);}catch(_e){}});
  if(bottom<0||!Number.isFinite(bottom)) bottom=0;
  document.documentElement.style.setProperty('--s18-header-offset',Math.ceil(bottom)+'px');
  return bottom;
}
function refreshNotesLayoutV17(){
  const offset=measureHeaderOffsetV17();
  const modal=notesModalV17();
  if(!modal) return offset;
  const panel=modal.querySelector('.s18NotesPanelV10');
  const body=modal.querySelector('.s18NotesBodyV10');
  if(panel){
    const max=Math.max(320,Math.floor(window.innerHeight-offset-12));
    panel.style.maxHeight=max+'px';
  }
  if(body){
    const bodyMax=Math.max(180,Math.floor(window.innerHeight-offset-(window.innerWidth<=600?212:window.innerWidth<=900?238:170)));
    body.style.maxHeight=bodyMax+'px';
    body.style.height=bodyMax+'px';
  }
  return offset;
}
function closeNotesV17(){
  const modal=notesModalV17();
  if(!modal) return;
  modal.classList.remove('open');
  document.body.classList.remove('s18NotesOpenV11');
}
function installNotesGuardsV17(){
  if(window.__s18NotesGuardsV18) return;
  window.__s18NotesGuardsV18=true;
  let queued=false;
  const schedule=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;refreshNotesLayoutV17();});
  };
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&notesModalV17()?.classList.contains('open')) closeNotesV17();
  });
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,80),{passive:true});
  document.addEventListener('click',e=>{
    const modal=notesModalV17();
    if(!modal||!modal.classList.contains('open')) return;
    const panel=modal.querySelector('.s18NotesPanelV10');
    if(!panel||panel.contains(e.target)) return;
    if(noteButtonsV17().some(btn=>btn.contains(e.target))) return;
    closeNotesV17();
  },true);
}


measureHeaderOffsetV17();
installNotesGuardsV17();
refreshNotesLayoutV17();
window.addEventListener('mhur-auth-change',()=>setTimeout(refreshNotesLayoutV17,60));
window.addEventListener('mhur-role-change',()=>setTimeout(refreshNotesLayoutV17,60));
window.addEventListener('mhur:languagechange',()=>setTimeout(refreshNotesLayoutV17,20));
window.MHUR_S18_V17={refreshNotesLayout:refreshNotesLayoutV17,measureHeaderOffset:measureHeaderOffsetV17};
window.MHUR_S18_V18={refreshNotesLayout:refreshNotesLayoutV17,measureHeaderOffset:measureHeaderOffsetV17};
})();


/* ========================================================================== */
/* MHUR Nexus — Saison 18 v19 : portraits réductions + costumes PC           */
/* ========================================================================== */
(function(){
'use strict';

const L=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=v=>typeof rootAsset==='function'?rootAsset(v):String(v||'');
const NORM=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');

const DISCOUNT_PORTRAITS={
  dj_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',
  d_j_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',
  flow_runner:'assets/home/discounts/v559/flow_runner_v559.webp?v=559',
  gentle_criminal:'assets/home/discounts/v559/gentle_criminal_v559.webp?v=559',
  factor_fusion:'assets/home/discounts/v559/factor_fusion_v559.webp?v=559',
  cluster:'assets/home/discounts/v559/cluster_v559.webp?v=559',
  mirko:'assets/home/discounts/v559/mirko_v559.webp?v=559'
};

function discountPortrait(name,image){
  const key=NORM(name);
  return root(DISCOUNT_PORTRAITS[key]||image||'');
}
function renderDiscountCardV19(item){
  const src=discountPortrait(item?.name,item?.image);
  const pts=String(item?.points??'');
  const key=NORM(item?.name||'');
  return `<article class="discountCardV296 s18DiscountCardV19" data-discount="${ESC(key)}"><div class="s18DiscountArtV19"><img src="${ESC(src)}" alt="${ESC(item?.name||'Discount')}" loading="lazy" decoding="async"></div><b>${ESC(item?.name||'')}</b><span>${ESC(pts)} Pts.</span></article>`;
}
function patchDiscountGrid(html){
  const template=document.createElement('template');
  template.innerHTML=String(html||'').trim();
  const grid=template.content.querySelector('.discountGridV296');
  if(!grid) return html;
  const discounts=Array.isArray(window.MHUR_HOME_DATA?.discounts)?window.MHUR_HOME_DATA.discounts:[];
  const empty=L()==='en'?'No discount.':'Aucune réduction.';
  grid.innerHTML=discounts.length?discounts.map(renderDiscountCardV19).join(''):`<div class="emptyV296">${empty}</div>`;
  return template.innerHTML;
}
function wrapHomeDashboard(){
  if(typeof window.renderHomeDashboard!=='function'||window.renderHomeDashboard.__s18v19) return;
  const original=window.renderHomeDashboard;
  const wrapped=function(){ return patchDiscountGrid(original.apply(this,arguments)); };
  wrapped.__s18v19=true;
  window.renderHomeDashboard=wrapped;
}

function tileIdFromEl(el){
  if(!el) return '';
  const direct=[el.dataset?.costume,el.dataset?.id,el.getAttribute('data-costume'),el.getAttribute('data-id'),el.id].filter(Boolean);
  for(const value of direct){
    const m=String(value).match(/(\d{1,6})/);
    if(m) return m[1];
  }
  const sources=[el.getAttribute('onclick'),el.getAttribute('href'),el.outerHTML];
  for(const raw of sources){
    const text=String(raw||'');
    let m=text.match(/selectedCostume\s*=\s*['"](?:ur_)?(\d{1,6})['"]/i)||text.match(/openCostume[^\d]*(?:ur_)?(\d{1,6})/i)||text.match(/(?:costume|ur)[_-]?(\d{1,6})/i);
    if(m) return m[1];
  }
  return '';
}
function markCostumeLayouts(){
  document.querySelectorAll('.costumeGroupRow,.costumeGallery,.costumeGalleryGrid,.costumeGrid').forEach(el=>el.classList.add('s18CostumeDesktopGridV19'));
}
function injectUpcomingGroup(){
  if(String(window.page||'')!=='costumes') return;
  const meta=window.MHUR_SEASON18_DATA?.costumes||{};
  const upcomingIds=new Set(Object.entries(meta).filter(([,v])=>v&&v.upcoming).map(([id])=>String(id)));
  if(!upcomingIds.size) return;
  const existing=document.querySelector('.s18UpcomingCostumeGroupV19');
  if(existing) return;
  const allTiles=[...document.querySelectorAll('.costumeTile,.costumeCard')].filter(el=>!el.closest('.inlineCostumeFilters'));
  const upcomingTiles=allTiles.filter(el=>upcomingIds.has(tileIdFromEl(el)));
  if(!upcomingTiles.length) return;
  const groupsWrap=upcomingTiles[0].closest('.costumeGroupsWrap,.costumePage,.page,.content')||document.querySelector('.costumeGroupsWrap,.costumePage,.page,.content');
  if(!groupsWrap) return;
  const group=document.createElement('section');
  group.className='costumeGroup s18UpcomingCostumeGroupV19';
  group.innerHTML=`<h2 class="s18UpcomingCostumeTitleV19">${L()==='en'?'Upcoming Costumes':'Costumes à venir'}</h2><div class="s18CostumeDesktopGridV19 s18UpcomingCostumeGridV19"></div>`;
  const grid=group.querySelector('.s18UpcomingCostumeGridV19');
  upcomingTiles.forEach(tile=>grid.appendChild(tile));
  groupsWrap.appendChild(group);
}
function applyDomV19(){
  markCostumeLayouts();
  injectUpcomingGroup();
}
function wrapRenderV19(){
  if(typeof window.render!=='function'||window.render.__s18v19dom) return;
  const original=window.render;
  const wrapped=function(){ const result=original.apply(this,arguments); requestAnimationFrame(applyDomV19); return result; };
  wrapped.__s18v19dom=true;
  window.render=wrapped;
  try{ render=wrapped; }catch(_e){}
}

wrapHomeDashboard();
wrapRenderV19();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(applyDomV19),{once:true});
else requestAnimationFrame(applyDomV19);
window.addEventListener('mhur:languagechange',()=>requestAnimationFrame(applyDomV19));
})();


/* ========================================================================== */
/* MHUR Nexus — Saison 18 v20 : hotfix mobile header / notes / portraits     */
/* ========================================================================== */
(function(){
'use strict';

const ICON_V20 = `
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path fill="#f7fbff" d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
  <path fill="#1a2f4d" d="M14 2v5h5"/>
  <path fill="#17365d" d="M8 10h8v2H8zm0 4h8v2H8zm0 4h6v2H8z"/>
  <circle cx="18" cy="18" r="4" fill="#ffcb16" stroke="#0b111a" stroke-width="1.5"/>
  <path d="M18 15.8v4.4M15.8 18h4.4" stroke="#0b111a" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

function noteButtonsV20(){
  return [...document.querySelectorAll('#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-s18-notes-button]')];
}
function decorateNotesButtonV20(){
  noteButtonsV20().forEach(btn=>{
    if(!btn) return;
    btn.classList.add('mhurPatchDevButtonV20');
    btn.setAttribute('aria-label','Patch Notes / Dev Notes');
    btn.setAttribute('title','Patch Notes / Dev Notes');
    const label=(btn.querySelector('span:last-child')?.textContent||'').trim()||'Patch Notes / Dev Notes';
    btn.innerHTML=`<span class="mhurPatchDevIconV20" aria-hidden="true">${ICON_V20}</span><span>${label}</span>`;
    const icon=btn.querySelector('.mhurPatchDevIconV20');
    if(icon){
      icon.style.display='grid';
      icon.style.placeItems='center';
      icon.style.width='22px';
      icon.style.height='22px';
      icon.style.flex='0 0 22px';
      icon.style.lineHeight='0';
      icon.style.visibility='visible';
      icon.style.opacity='1';
    }
    const svg=btn.querySelector('.mhurPatchDevIconV20 svg');
    if(svg){
      svg.style.display='block';
      svg.style.width='22px';
      svg.style.height='22px';
    }
    btn.onclick=typeof openNotes==='function'?openNotes:btn.onclick;
  });
}
function wrapEnsureHeaderButtonV20(){
  if(typeof ensureHeaderButton!=='function' || ensureHeaderButton.__s18v20) return;
  const original=ensureHeaderButton;
  const wrapped=function(){ const out=original.apply(this,arguments); decorateNotesButtonV20(); return out; };
  wrapped.__s18v20=true;
  ensureHeaderButton=wrapped;
  try{ window.ensureHeaderButton=wrapped; }catch(_e){}
}
function patchScrollableNotesV20(root=document){
  root.querySelectorAll('.s18PatchTableWrapV10').forEach(wrap=>{
    wrap.style.overflowX='auto';
    wrap.style.overflowY='hidden';
    wrap.style.webkitOverflowScrolling='touch';
    wrap.style.touchAction='pan-x';
    wrap.setAttribute('tabindex','0');
  });
}
function fixHomeOffsetV20(){
  const home=document.querySelector('.homeV296');
  if(home) home.classList.add('s18HomeMobileOffsetV20');
}
function refreshV20(){
  decorateNotesButtonV20();
  patchScrollableNotesV20(document);
  fixHomeOffsetV20();
}

wrapEnsureHeaderButtonV20();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(refreshV20),{once:true});
else requestAnimationFrame(refreshV20);
window.addEventListener('mhur:languagechange',()=>setTimeout(refreshV20,20));
window.addEventListener('resize',()=>setTimeout(patchScrollableNotesV20,10),{passive:true});
document.addEventListener('click',e=>{
  if(e.target.closest?.('#mhurPatchDevButtonV14,.mhurPatchDevButtonV14,[data-s18-notes-button],[data-patch-index],[data-tab]')){
    setTimeout(refreshV20,40);
  }
},true);
})();

/* ========================================================================== */
/* MHUR Nexus — Saison 18 v23 : page Mods en haut + costumes à venir         */
/* ========================================================================== */
(function(){
'use strict';

const currentLangV23=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const txV23=(fr,en)=>currentLangV23()==='en'?en:fr;

function currentPageV23(){
  try{
    if(typeof page!=='undefined'&&page)return String(page);
  }catch(_e){}
  return String(window.page||'');
}

function scrollNodeTopV23(node){
  if(!node)return;
  try{node.scrollTop=0;node.scrollLeft=0}catch(_e){}
}
function scrollModsTopV23(){
  const mods=document.querySelector('.modsPage');
  if(!mods&&currentPageV23()!=='mods')return;
  const run=()=>{
    scrollNodeTopV23(document.scrollingElement);
    scrollNodeTopV23(document.documentElement);
    scrollNodeTopV23(document.body);
    scrollNodeTopV23(document.getElementById('app'));
    scrollNodeTopV23(document.querySelector('.wrap'));
    scrollNodeTopV23(mods||document.querySelector('.modsPage'));
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch(_e){window.scrollTo(0,0)}
  };
  run();
}

let lastPageV23='';
function afterNavigationV23(){
  const next=currentPageV23();
  const enteredMods=next==='mods'&&lastPageV23!=='mods';
  lastPageV23=next;
  if(enteredMods||document.querySelector('.modsPage'))scrollModsTopV23();
  requestAnimationFrame(()=>{restoreUpcomingCostumesV23();applyCostumeGridLayoutV25(document)});
}
function wrapRenderV23(){
  if(typeof window.render!=='function'||window.render.__s18v23)return;
  const original=window.render;
  const wrapped=function(){
    const result=original.apply(this,arguments);afterNavigationV23();return result;
  };
  wrapped.__s18v23=true;
  window.render=wrapped;
  try{render=wrapped}catch(_e){}
}

function parseReleaseV25(value){
  const raw=String(value||'').trim();
  if(!raw)return null;
  const normalized=/\bJST\b/i.test(raw)?raw.replace(/\s+JST$/i,'+09:00').replace(' ','T'):raw;
  const time=Date.parse(normalized);
  return Number.isFinite(time)?time:null;
}
function upcomingIdsV23(){
  const data=window.MHUR_SEASON18_DATA||{};
  const ids=new Set();
  const now=Date.now();
  (Array.isArray(data.upcoming_costumes)?data.upcoming_costumes:[]).forEach(id=>{
    const row=data.costumes?.[String(id)]||{};
    const release=parseReleaseV25(row.releaseDate||row.release_date);
    if(row.upcoming||release==null||release>now)ids.add(String(id));
  });
  Object.entries(data.costumes||{}).forEach(([id,row])=>{
    const release=parseReleaseV25(row?.releaseDate||row?.release_date);
    if(row&&(row.upcoming||release!=null&&release>now))ids.add(String(id));
  });
  return ids;
}
function formatReleaseDateV25(value){
  const time=parseReleaseV25(value);
  if(time==null)return txV23('Date à confirmer','Date to be confirmed');
  const date=new Date(time);
  return new Intl.DateTimeFormat(currentLangV23()==='en'?'en-GB':'fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Tokyo'}).format(date);
}
function costumeMetaV25(id){
  return window.MHUR_SEASON18_DATA?.costumes?.[String(id)]||{};
}
function decorateUpcomingTileV25(tile,id){
  if(!tile)return;
  tile.classList.add('s18UpcomingCostumeTileV25');
  const row=costumeMetaV25(id);
  const release=row.releaseDate||row.release_date||'';
  tile.dataset.s18ReleaseDate=release;
  let status=tile.querySelector(':scope > .s18UpcomingStatusV25');
  if(!status){status=document.createElement('span');status.className='s18UpcomingStatusV25';tile.appendChild(status)}
  status.textContent=txV23('À VENIR','UPCOMING');
  let date=tile.querySelector(':scope > .s18UpcomingDateV25');
  if(!date){date=document.createElement('span');date.className='s18UpcomingDateV25';tile.appendChild(date)}
  date.textContent=formatReleaseDateV25(release);
  date.title=txV23('Date de sortie prévue','Scheduled release date');
}
function applyCostumeGridLayoutV25(root=document){
  root.querySelectorAll('.costumeGalleryGrid,.costumeGroupRow,.costumeGrid').forEach(grid=>{
    const count=grid.querySelectorAll(':scope > .costumeTile,:scope > .costumeCard').length;
    if(!count)return;
    grid.classList.add('s18FilledCostumeGridV25');
    grid.style.setProperty('--s18-costume-cols',String(Math.min(count,6)));
  });
}
function tileIdV23(tile){
  if(!tile)return '';
  const values=[tile.dataset?.costume,tile.dataset?.id,tile.getAttribute('data-costume'),tile.getAttribute('data-id'),tile.id,tile.getAttribute('onclick'),tile.getAttribute('href')];
  for(const value of values){
    const match=String(value||'').match(/(?:ur[_-]?)?(\d{4,})/i);
    if(match)return match[1];
  }
  const html=String(tile.outerHTML||'');
  const match=html.match(/(?:ur[_-]?)?(\d{4,})/i);
  return match?match[1]:'';
}
function groupNameV23(group){
  return String(group?.querySelector('.costumeGalleryHead span,.costumeHead,.costumeGroupTitle,h2,h3')?.textContent||txV23('Costumes à venir','Upcoming Costumes')).trim();
}
function groupRarityV23(group){
  return group?.querySelector('.costumeRarity')?.outerHTML||'';
}
function removeEmptyGroupV23(group){
  if(!group||group.closest('.s18UpcomingCostumeGroupV23'))return;
  const grid=group.querySelector('.costumeGalleryGrid,.costumeGroupRow,.costumeGrid');
  if(grid&&!grid.querySelector('.costumeTile,.costumeCard'))group.remove();
}
function restoreUpcomingCostumesV23(){
  const wrap=document.querySelector('.costumeGroupsWrap');
  if(!wrap)return;
  const ids=upcomingIdsV23();
  if(!ids.size)return;

  wrap.querySelectorAll('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23').forEach(old=>{
    old.querySelectorAll('.costumeTile,.costumeCard').forEach(tile=>{
      const originalName=tile.dataset.s18OriginalGroup||txV23('Costume','Costume');
      let original=[...wrap.querySelectorAll('.costumeGalleryGroup,.costumeGroup')].find(group=>!group.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23')&&groupNameV23(group)===originalName);
      if(!original){
        original=document.createElement('div');
        original.className='costumeGalleryGroup';
        original.innerHTML=`<div class="costumeGalleryHead"><span>${originalName}</span></div><div class="costumeGalleryGrid"></div>`;
        wrap.appendChild(original);
      }
      (original.querySelector('.costumeGalleryGrid,.costumeGroupRow,.costumeGrid')||original).appendChild(tile);
    });
    old.remove();
  });

  const tiles=[...wrap.querySelectorAll('.costumeTile,.costumeCard')].filter(tile=>ids.has(tileIdV23(tile)));
  if(!tiles.length)return;

  const section=document.createElement('section');
  section.className='s18UpcomingCostumeGroupV23';
  section.innerHTML=`<h2 class="s18UpcomingCostumeTitleV23">${txV23('Costumes à venir','Upcoming Costumes')}</h2><p class="s18UpcomingCostumeIntroV25">${txV23("Ces costumes ne sont pas encore disponibles dans le jeu. La date affichée correspond à leur sortie prévue.","These costumes are not available in game yet. The displayed date is their scheduled release date.")}</p><div class="s18UpcomingCostumeFamiliesV23"></div>`;
  const families=section.querySelector('.s18UpcomingCostumeFamiliesV23');
  const map=new Map();

  tiles.forEach(tile=>{
    const source=tile.closest('.costumeGalleryGroup,.costumeGroup');
    const name=groupNameV23(source);
    const costumeId=tileIdV23(tile);
    tile.dataset.s18OriginalGroup=name;
    decorateUpcomingTileV25(tile,costumeId);
    if(!map.has(name)){
      const family=document.createElement('div');
      family.className='costumeGalleryGroup s18UpcomingCostumeFamilyV23';
      family.innerHTML=`<div class="costumeGalleryHead"><span>${name}</span>${groupRarityV23(source)}</div><div class="costumeGalleryGrid s18UpcomingCostumeGridV23"></div>`;
      map.set(name,family);
      families.appendChild(family);
    }
    map.get(name).querySelector('.s18UpcomingCostumeGridV23').appendChild(tile);
    removeEmptyGroupV23(source);
  });

  wrap.insertBefore(section,wrap.firstChild);
  applyCostumeGridLayoutV25(wrap);
}

wrapRenderV23();
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{lastPageV23=currentPageV23();requestAnimationFrame(afterNavigationV23)},{once:true});
}else{
  lastPageV23=currentPageV23();requestAnimationFrame(afterNavigationV23);
}
window.addEventListener('popstate',()=>setTimeout(afterNavigationV23,0));
window.addEventListener('hashchange',()=>setTimeout(afterNavigationV23,0));
window.addEventListener('mhur:languagechange',()=>requestAnimationFrame(()=>{restoreUpcomingCostumesV23();applyCostumeGridLayoutV25(document)}));
document.addEventListener('click',event=>{
  const target=event.target.closest?.('[data-page="mods"],a[href*="mods"],button[onclick*="mods"],.navItem');
  if(target&&/mods/i.test(`${target.dataset?.page||''} ${target.getAttribute('href')||''} ${target.getAttribute('onclick')||''} ${target.textContent||''}`)){
    setTimeout(scrollModsTopV23,0);
  }
},true);

window.MHUR_S18_V23={scrollModsTop:scrollModsTopV23,restoreUpcomingCostumes:restoreUpcomingCostumesV23};
})();


/* ========================================================================== */
/* MHUR Nexus — Saison 18 v24 : NEW automatique et contenu à venir           */
/* ========================================================================== */
(function(){
'use strict';
const BADGE_V24='<span class="s18NewBadge s18NewBadgeV9 s18NewBadgeV24" aria-label="NEW">NEW!</span>';
function releaseTime(value){const time=Date.parse(String(value||''));return Number.isFinite(time)?time:null}
function latestCostumes(sync){
  const now=Date.now();
  const rows=Object.entries(sync?.costumes||{}).map(([id,row])=>({id:String(id),time:releaseTime(row?.releaseDate),upcoming:Boolean(row?.upcoming)})).filter(row=>row.time!=null&&!row.upcoming&&row.time<=now);
  if(!rows.length)return [];
  const latest=Math.max(...rows.map(row=>row.time));
  return rows.filter(row=>row.time===latest).map(row=>row.id);
}
function latestHome(kind,key){
  const rows=(window.MHUR_HOME_DATA?.latest_releases||[]).filter(row=>String(row?.release_kind||'').toLowerCase()===kind&&String(row?.[key]||''));
  if(!rows.length)return [];
  const now=Date.now();
  const dated=rows.map(row=>({id:String(row[key]),time:releaseTime(row.releaseDate)})).filter(row=>row.time!=null&&row.time<=now);
  if(dated.length){const latest=Math.max(...dated.map(row=>row.time));return Array.from(new Set(dated.filter(row=>row.time===latest).map(row=>row.id)))}
  return [String(rows[0][key])];
}
function activeSets(){
  const sync=window.MHUR_SEASON18_DATA||{};
  const hasActive=Boolean(sync.active_new_content&&typeof sync.active_new_content==='object');
  const source=hasActive?sync.active_new_content:(sync.new_content||{});
  const homeCharacters=latestHome('character','character_id');
  const homeStyles=latestHome('style','style_id');
  const latestCostumeIds=latestCostumes(sync);  const characters=Array.from(new Set([...((source.characters)||[]),'gentle_criminal']));  const stylesList=Array.from(new Set([...((source.styles)||[]),'gentle_criminal_technical']));
  /* V572 merge latest costume wave v24 */  const costumes=Array.from(new Set([...((source.costumes)||[]),...latestCostumeIds,'108000000']));
  return {
    characters:new Set(characters.map(String)),
    styles:new Set(stylesList.map(String)),
    costumes:new Set(costumes.map(String))
  };
}
function costumeId(tile){
  if(!tile)return '';
  const values=[tile.dataset?.costume,tile.dataset?.id,tile.getAttribute('data-costume'),tile.getAttribute('data-id'),tile.id,tile.getAttribute('onclick'),tile.getAttribute('href'),tile.outerHTML];
  for(const value of values){const match=String(value||'').match(/(?:ur[_-]?)?(\d{4,})/i);if(match)return match[1]}
  return '';
}
function setBadge(node,active){
  if(!node)return;
  node.querySelectorAll(':scope > .s18NewBadge,.s18NewBadgeV24').forEach(badge=>badge.remove());
  if(active)node.insertAdjacentHTML('afterbegin',BADGE_V24);
}
function syncNewBadges(){
  const sets=activeSets();
  document.querySelectorAll('.card[data-char]').forEach(card=>setBadge(card,sets.characters.has(String(card.dataset.char||''))));
  document.querySelectorAll('.styleCard[data-style]').forEach(card=>setBadge(card,sets.styles.has(String(card.dataset.style||''))));
  document.querySelectorAll('.costumeTile,.costumeCard').forEach(card=>setBadge(card,sets.costumes.has(costumeId(card))&&!card.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23')));
}
function wrapRender(){
  if(typeof window.render!=='function'||window.render.__s18v24new)return;
  const original=window.render;
  const wrapped=function(){const result=original.apply(this,arguments);syncNewBadges();return result};
  wrapped.__s18v24new=true;
  window.render=wrapped;
  try{render=wrapped}catch(_e){}
}
wrapRender();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(syncNewBadges),{once:true});
else requestAnimationFrame(syncNewBadges);
window.addEventListener('mhur:languagechange',()=>requestAnimationFrame(syncNewBadges));
window.MHUR_S18_V24={syncNewBadges};
})();

/* MHUR Nexus — Saison 18 v29 : aucune image utilisateur dans les fiches DB */
(function(){
'use strict';
function costumeIdV29(ct){return String(ct?.urId??ct?.ur_id??String(ct?.id||'').replace(/^ur_/,''));}
function patchCostumeObjectV29(ct){
  if(!ct||typeof ct!=='object')return;
  const official=window.MHUR_DATABASE_ASSETS?.costumes?.[costumeIdV29(ct)];
  if(official)ct.img=official;
}
function patchDatabaseObjectsV29(){
  try{if(typeof applyOfficialPortraits==='function')applyOfficialPortraits();}catch(_e){}
  try{
    if(typeof characters!=='undefined'&&typeof allCostumesForCharId==='function'){
      (characters||[]).forEach(ch=>(allCostumesForCharId(ch.id)||[]).forEach(patchCostumeObjectV29));
    }
  }catch(_e){}
  try{
    if(typeof MIDORIYA_COSTUMES!=='undefined'){
      (MIDORIYA_COSTUMES||[]).forEach(group=>(group.variants||[]).forEach(patchCostumeObjectV29));
    }
  }catch(_e){}
}
function wrapRenderV29(){
  if(typeof window.render!=='function'||window.render.__mhurDbV29)return;
  const original=window.render;
  const wrapped=function(){patchDatabaseObjectsV29();return original.apply(this,arguments)};
  wrapped.__mhurDbV29=true;
  window.render=wrapped;
  try{render=wrapped}catch(_e){}
}
patchDatabaseObjectsV29();
wrapRenderV29();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{patchDatabaseObjectsV29();wrapRenderV29();},{once:true});
window.addEventListener('mhur:languagechange',patchDatabaseObjectsV29);
window.MHUR_DATABASE_PATCH_V29={apply:patchDatabaseObjectsV29};
})();


/* ========================================================================== */
/* MHUR Nexus — Saison 18 v35 : réductions + mini portraits communauté       */
/* ========================================================================== */
(function(){
'use strict';

const NORM=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const absAsset=v=>{
  const raw=String(v||'').trim();
  if(!raw) return '';
  if(/^https?:\/\//i.test(raw)||raw.startsWith('data:')) return raw;
  const clean=raw.replace(/^\/+/, '');
  return typeof rootAsset==='function' ? rootAsset(clean) : `/${clean}`;
};
const ROLE_KEYS={
  assault:['assaut','assault'],
  attack:['attaque','attack','strike'],
  rapid:['vitesse','rapid'],
  technical:['technique','technical'],
  support:['soutien','support']
};
const MINI_ROLE_CLASS={assault:'assault',attack:'attack',rapid:'rapid',technical:'technical',support:'support'};
const DISCOUNT_STYLE_KEYS={
  dj_board:'present_mic_technical',
  d_j_board:'present_mic_technical',
  flow_runner:'aizawa_strike',
  gentle_criminal:'gentle_criminal',
  factor_fusion:'all_for_one_strike',
  cluster:'bakugo_technical',
  mirko:'mirko_rapid',
  star_and_stripe:'star_and_stripe_strike',
  star_stripe:'star_and_stripe_strike'
};
const DISCOUNT_FALLBACK={
  dj_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',
  d_j_board:'assets/home/discounts/v559/d_j_board_v559.webp?v=559',
  flow_runner:'assets/home/discounts/v559/flow_runner_v559.webp?v=559',
  gentle_criminal:'assets/home/discounts/v559/gentle_criminal_v559.webp?v=559',
  factor_fusion:'assets/home/discounts/v559/factor_fusion_v559.webp?v=559',
  cluster:'assets/home/discounts/v559/cluster_v559.webp?v=559',
  mirko:'assets/home/discounts/v559/mirko_v559.webp?v=559'
};
const L=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';

function detectRole(text){
  const t=NORM(text).replace(/_/g,' ');
  for(const [role,terms] of Object.entries(ROLE_KEYS)){
    if(terms.some(term=>t.includes(term))) return role;
  }
  return '';
}
function discountPortraitV35(name,image){
  const key=NORM(name);
  if(key==='gentle_criminal'){
    const fixed=absAsset('assets/home/discounts/v559/gentle_criminal_v559.webp?v=559');
    return {src:fixed,fallback:fixed};
  }
  const styleKey=DISCOUNT_STYLE_KEYS[key]||'';
  const dbPath=styleKey ? window.MHUR_DATABASE_ASSETS?.styles?.[styleKey]?.portrait : '';
  const fallback=DISCOUNT_FALLBACK[key]||image||'';
  return {src:absAsset(fallback||dbPath),fallback:absAsset(fallback||dbPath)};
}
function renderDiscountCardV35(item){
  const art=discountPortraitV35(item?.name,item?.image);
  const pts=String(item?.points??'');
  const key=NORM(item?.name||'');
  const onerr = `if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.onerror=null;this.style.opacity='0';}`;
  return `<article class="discountCardV296 s18DiscountCardV19" data-discount="${ESC(key)}"><div class="s18DiscountArtV19"><img src="${ESC(art.src)}" data-fallback="${ESC(art.fallback)}" alt="${ESC(item?.name||'Discount')}" loading="lazy" decoding="async" onerror="${onerr}"></div><b>${ESC(item?.name||'')}</b><span>${ESC(pts)} Pts.</span></article>`;
}
function patchDiscountGridV35(){
  const discounts=Array.isArray(window.MHUR_HOME_DATA?.discounts)?window.MHUR_HOME_DATA.discounts:[];
  const empty=L()==='en'?'No discount.':'Aucune réduction.';
  const html=discounts.length?discounts.map(renderDiscountCardV35).join(''):`<div class="emptyV296">${empty}</div>`;
  const sig=String(discounts.length)+'|'+discounts.map(x=>`${NORM(x?.name)}:${x?.points??''}`).join('|')+'|'+L();
  document.querySelectorAll('.discountGridV296').forEach(grid=>{
    if(grid.dataset.s18DiscountSigV35===sig && grid.dataset.s18DiscountHtmlV35==='1') return;
    grid.innerHTML=html;
    grid.dataset.s18DiscountSigV35=sig;
    grid.dataset.s18DiscountHtmlV35='1';
  });
}
function wrapHomeDashboardV35(){
  if(typeof window.renderHomeDashboard!=='function'||window.renderHomeDashboard.__s18v35) return;
  const original=window.renderHomeDashboard;
  const wrapped=function(){
    const html=original.apply(this,arguments);
    try{
      const template=document.createElement('template');
      template.innerHTML=String(html||'').trim();
      const grid=template.content.querySelector('.discountGridV296');
      if(grid){
        const discounts=Array.isArray(window.MHUR_HOME_DATA?.discounts)?window.MHUR_HOME_DATA.discounts:[];
        const empty=L()==='en'?'No discount.':'Aucune réduction.';
        grid.innerHTML=discounts.length?discounts.map(renderDiscountCardV35).join(''):`<div class="emptyV296">${empty}</div>`;
        return template.innerHTML;
      }
    }catch(_e){}
    return html;
  };
  wrapped.__s18v35=true;
  window.renderHomeDashboard=wrapped;
  try{ renderHomeDashboard=wrapped; }catch(_e){}
}

function decorateMiniPortraitsV35(root=document){
  const imgs=root.querySelectorAll('img');
  imgs.forEach(img=>{
    if(img.dataset.s18MiniBgV35) return;
    const src=String(img.getAttribute('src')||'');
    if(!/(portrait|mhur_database\/characters|fullbullet|ofa|bakugo|ochaco|midoriya|aizawa|present_mic|overhaul|all_for_one|mirko|tsuyu|kirishima|todoroki|cementoss|all_might|hawks)/i.test(src)) return;
    const w=img.clientWidth||parseFloat(getComputedStyle(img).width)||0;
    const h=img.clientHeight||parseFloat(getComputedStyle(img).height)||0;
    if(w<24||h<24||w>90||h>90) return;
    const owner=img.closest('button,a,article,li,div') || img.parentElement;
    const text=[owner?.textContent,img.parentElement?.textContent,owner?.parentElement?.textContent].filter(Boolean).join(' ');
    const role=detectRole(text);
    if(!role) return;
    const wrapper=document.createElement('span');
    wrapper.className=`s18MiniPortraitRoleBgV35 role-${MINI_ROLE_CLASS[role]||role}`;
    wrapper.style.width=`${Math.round(w)}px`;
    wrapper.style.height=`${Math.round(h)}px`;
    img.parentNode.insertBefore(wrapper,img);
    wrapper.appendChild(img);
    img.classList.add('s18MiniPortraitImgV35');
    img.dataset.s18MiniBgV35='1';
  });
}

wrapHomeDashboardV35();
function runV35(){
  decorateMiniPortraitsV35(document);
}
let v35Queued=false;
function scheduleV35(){
  if(v35Queued)return;
  v35Queued=true;
  requestAnimationFrame(()=>{
    v35Queued=false;
    runV35();
  });
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',scheduleV35,{once:true});
}else{
  scheduleV35();
}
window.addEventListener('mhur:languagechange',scheduleV35);
window.addEventListener('mhur-auth-change',scheduleV35);
window.addEventListener('mhur-role-change',scheduleV35);
})();

/* MHUR Nexus — V578 : NEW source propre */
(function(){
  'use strict';

  const BADGE='<span class="s18NewBadge s18NewBadgeV9 s18NewBadgeV24 s18NewBadgeV578" aria-label="NEW">NEW!</span>';
  const GENTLE_CHARACTER='gentle_criminal';
  const GENTLE_STYLE='gentle_criminal_technical';
  const GENTLE_ORIGINAL='108000000';

  function time(value){
    const parsed=Date.parse(String(value||''));
    return Number.isFinite(parsed)?parsed:null;
  }

  function latestCostumesV578(){
    const sync=window.MHUR_SEASON18_DATA||{};
    const now=Date.now();
    const rows=Object.entries(sync.costumes||{})
      .map(([id,row])=>({
        id:String(id),
        time:time(row?.releaseDate||row?.release_date),
        upcoming:Boolean(row?.upcoming)
      }))
      .filter(row=>row.time!=null&&!row.upcoming&&row.time<=now);

    if(!rows.length)return [];
    const latest=Math.max(...rows.map(row=>row.time));
    return rows.filter(row=>row.time===latest).map(row=>row.id);
  }

  function setsV578(){
    const sync=window.MHUR_SEASON18_DATA||{};
    const active=sync.active_new_content||sync.new_content||{};

    return {
      characters:new Set([...(active.characters||[]).map(String),GENTLE_CHARACTER]),
      styles:new Set([...(active.styles||[]).map(String),GENTLE_STYLE]),
      costumes:new Set([
        ...(active.costumes||[]).map(String),
        ...latestCostumesV578(),
        GENTLE_ORIGINAL
      ])
    };
  }

  function costumeIdV578(tile){
    if(!tile)return '';
    const values=[
      tile.dataset?.costume,
      tile.dataset?.id,
      tile.getAttribute('data-costume'),
      tile.getAttribute('data-id'),
      tile.id,
      tile.getAttribute('onclick'),
      tile.getAttribute('href'),
      tile.outerHTML
    ];

    for(const value of values){
      const match=String(value||'').match(/(?:ur[_-]?)?(\d{4,})/i);
      if(match)return match[1];
    }
    return '';
  }

  function directBadges(node){
    try{return [...node.querySelectorAll(':scope > .s18NewBadge')]}
    catch(_error){return [...node.children].filter(child=>child.classList?.contains('s18NewBadge'))}
  }

  function setBadgeV578(node,active){
    if(!node)return;
    directBadges(node).forEach(badge=>badge.remove());
    if(active)node.insertAdjacentHTML('afterbegin',BADGE);
  }

  function syncV578(){
    const sets=setsV578();

    document.querySelectorAll('.card[data-char]').forEach(card=>{
      setBadgeV578(card,sets.characters.has(String(card.dataset.char||'')));
    });

    document.querySelectorAll('.styleCard[data-style]').forEach(card=>{
      setBadgeV578(card,sets.styles.has(String(card.dataset.style||'')));
    });

    document.querySelectorAll('.costumeTile,.costumeCard,.costumeResult').forEach(card=>{
      const id=costumeIdV578(card);
      if(id)card.dataset.costume=id;
      const upcoming=Boolean(card.closest('.s18UpcomingCostumeGroupV19,.s18UpcomingCostumeGroupV23'));
      setBadgeV578(card,Boolean(id&&sets.costumes.has(id)&&!upcoming));
    });
  }

  let queued=false;
  function scheduleV578(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      syncV578();
    });
  }

  function wrapRenderV578(){
    if(typeof window.render!=='function'||window.render.__mhurV578)return;
    const original=window.render;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      scheduleV578();
      return result;
    };
    wrapped.__mhurV578=true;
    window.render=wrapped;
    try{render=wrapped}catch(_error){}
  }

  wrapRenderV578();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',scheduleV578,{once:true});
  }else{
    scheduleV578();
  }

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes&&mutation.addedNodes.length)){
      scheduleV578();
    }
  }).observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('load',scheduleV578,{once:true});
  window.addEventListener('hashchange',scheduleV578);
  window.addEventListener('mhur:languagechange',scheduleV578);
  window.MHUR_V578_NEW={refresh:syncV578,latestCostumes:latestCostumesV578};
})();

