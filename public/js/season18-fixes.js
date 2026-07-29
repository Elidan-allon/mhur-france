/* MHUR Nexus — Season 18 runtime compatibility layer.
   This file is intentionally loaded after every historical inline override. */
(function(){
'use strict';

const S18=window.MHUR_SEASON18_DATA||{costumes:{},new_content:{}};
const COSTUME_META=S18.costumes||{};
const NEW=S18.new_content||{};
const newStyles=new Set((NEW.styles||[]).map(String));
const newCharacters=new Set((NEW.characters||[]).map(String));
const newCostumes=new Set((NEW.costumes||[]).map(String));
const CJK=/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;
const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentLang=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const pick=(v,l=currentLang())=>v&&typeof v==='object'&&!Array.isArray(v)?(v[l]??v.fr??v.en??''):v;
const stripJP=v=>String(v??'')
  .replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'')
  .replace(CJK,'').replace(/\s{2,}/g,' ').trim();
const text=v=>stripJP(pick(v));
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const badge=()=>'<span class="s18NewBadge" aria-label="Nouveau">NEW</span>';
const injectBadge=html=>String(html||'').replace(/^(<button\b[^>]*>)/i,'$1'+badge());
const costumeRid=ct=>String(ct?.urId??ct?.ur_id??String(ct?.id||'').replace(/^ur_/,''));

/* ---------- Character value tables ---------- */
function localRows(v){return Array.isArray(v)?v:(v&&typeof v==='object'?(v[currentLang()]||v.fr||v.en||[]):[])}
function localCols(v){return Array.isArray(v)?v:(v&&typeof v==='object'?(v[currentLang()]||v.fr||v.en||[]):[])}
function patchedTables(ts){
  const source=Array.isArray(ts)?ts:[];
  const localized=source.map(tb=>{
    let cols=localCols(tb?.cols||tb?.columns).map(text);
    let rows=localRows(tb?.rows).map(r=>Array.isArray(r)?r.map(text):[]);
    const drop=[];
    cols.forEach((c,i)=>{if(normalize(c)==='down_power')drop.push(i)});
    drop.reverse().forEach(i=>{cols.splice(i,1);rows.forEach(r=>{if(i<r.length)r.splice(i,1)})});
    return {title:text(tb?.title),cols,rows};
  }).filter(tb=>tb.rows.length&&tb.cols.length);
  localized.sort((a,b)=>(/effet|effect/i.test(b.title)?1:0)-(/effet|effect/i.test(a.title)?1:0));
  return `<div class="tables">${localized.map(tb=>`<button class="toggle s18TableTitle" onclick="this.nextElementSibling.classList.toggle('hidden')"><span>${escHtml(tb.title)}</span><span>▾</span></button><div class="simpleTable hidden"><table class="dataTable"><thead><tr>${tb.cols.map(c=>`<th>${escHtml(c)}</th>`).join('')}</tr></thead><tbody>${tb.rows.map(r=>`<tr>${r.map(x=>`<td>${escHtml(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
}
try{tables=patchedTables}catch(_e){} window.tables=patchedTables;

/* ---------- Bilingual generated T.U.N.I.N.G ---------- */
function translatedLevel(v){
  let s=text(v);
  if(currentLang()==='fr')s=s.replace(/^Level\s*/i,'Niv. ').replace(/^Sub\s*Effect\s*/i,'Effet secondaire ');
  return s;
}
function patchedTuningDetail(styleKey){
  const ch=(typeof characters!=='undefined'&&characters.find(x=>(x.styles||[]).includes(styleKey)))||{name:currentLang()==='fr'?'Personnage':'Character'};
  const list=(typeof tunings!=='undefined'&&tunings[styleKey])||[];
  const back=currentLang()==='fr'?'Retour':'Back';
  const empty=currentLang()==='fr'?'Aucun T.U.N.I.N.G renseigné pour ce style.':'No T.U.N.I.N.G data for this style.';
  return `<button class="back" onclick="selectedStyle=null;if((characters.find(x=>x.id===selectedChar)||{}).styles?.length===1)selectedChar=null;render()">← ${back}</button><h1 class="title">T.U.N.I.N.G — ${escHtml(ch.name)}</h1>${list.length?list.map(tu=>{
    const isSp=tu.type==='SP';
    const title=isSp?(currentLang()==='fr'?'Compétence T.U.N.I.N.G SP':'Special T.U.N.I.N.G Skill'):(currentLang()==='fr'?'Compétence T.U.N.I.N.G':'T.U.N.I.N.G Skill');
    const levels=Array.isArray(tu.levels)?`<div class="chips tuningLevels">${tu.levels.map(l=>{const value=translatedLevel(l);return `<span class="chip ${/^Effet secondaire|^Sub Effect/i.test(value)?'subChip':''}">${escHtml(value)}</span>`}).join('')}</div>`:'';
    const normal=Array.isArray(tu.effects)?`<div class="tuningText">${tu.effects.map(e=>`<div class="tuningEffect"><div class="tuningEffectName">${escHtml(text(e.name))}</div><div class="tuningEffectDesc">${escHtml(text(e.desc))}</div><div class="chips">${(e.levels||[]).map(l=>`<span class="chip">${escHtml(translatedLevel(l))}</span>`).join('')}</div></div>`).join('')}</div>`:`<div class="tuningText">${escHtml(text(tu.desc))}</div>`;
    const role=tu.role||'support';
    const memory=currentLang()==='fr'?`Éclat de souvenir de ${ch.name}`:`${ch.name} Memory Fragment`;
    const icon=tu.img?(typeof asset==='function'?asset(tu.img,text(tu.name)):`<img src="${escHtml(tu.img)}" alt="">`):(typeof roleOnly==='function'?roleOnly(role):'');
    const roleClass=(typeof roles!=='undefined'&&roles[role]?.cls)||role;
    return `<div class="gamePanel tuningCard ${isSp?'spTuning':'normalTuning'}"><div class="gameHeader"><div class="gameIcon">${icon}</div><div class="gameName">${escHtml(memory)}</div></div><div class="tuningBlock"><div class="tuningTitle ${roleClass}Bg"><span>${escHtml(title)}</span><br>${escHtml(text(tu.name))}</div>${normal}${levels}</div></div>`;
  }).join(''):`<div class="homeBox">${empty}</div>`}`;
}
try{tuningDetail=patchedTuningDetail}catch(_e){} window.tuningDetail=patchedTuningDetail;

/* ---------- NEW badges on characters and styles ---------- */
try{
  const oldCard=card;
  const nextCard=function(c,mode='characters'){
    const html=oldCard(c,mode);
    return newCharacters.has(String(c?.id))?injectBadge(html):html;
  };
  card=nextCard;window.card=nextCard;
}catch(_e){}
try{
  const oldStylePicker=stylePicker;
  const nextStylePicker=function(){
    let html=oldStylePicker();
    newStyles.forEach(id=>{
      const safe=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      const rx=new RegExp(`(<button\\b[^>]*data-style=["']${safe}["'][^>]*>)`,'g');
      html=html.replace(rx,'$1'+badge());
    });
    return html;
  };
  stylePicker=nextStylePicker;window.stylePicker=nextStylePicker;
}catch(_e){}

/* ---------- Release-aware, bilingual costumes ---------- */
function costumeMeta(ct){return COSTUME_META[costumeRid(ct)]||null}
function enrichedCostume(ct){
  if(!ct)return ct;
  const meta=costumeMeta(ct);
  if(!meta)return {...ct};
  const l=currentLang();
  const release=meta.releaseDate||'';
  return {...ct,
    name:text(l==='fr'?meta.group_fr:meta.group_en)||ct.name,
    group:text(l==='fr'?meta.group_fr:meta.group_en)||ct.group||ct.name,
    variant:text(l==='fr'?meta.variant_fr:meta.variant_en)||ct.variant,
    acquisition:text(l==='fr'?meta.acquisition_fr:meta.acquisition_en)||ct.acquisition||'',
    releaseDate:release,
    _s18Upcoming:!!release&&!Number.isNaN(Date.parse(release))&&Date.parse(release)>Date.now()
  };
}
let renderingReleasedCostumes=false;
let originalAllCostumes=null,originalCostumeCard=null,originalCostumesPage=null,originalGalleryGroup=null,originalFindCostume=null,originalCostumeDetail=null;
try{originalAllCostumes=allCostumesForCharId}catch(_e){}
try{originalCostumeCard=costumeCard}catch(_e){}
try{originalCostumesPage=costumesPage}catch(_e){}
try{originalGalleryGroup=costumeGalleryGroup}catch(_e){}
try{originalFindCostume=findCostume}catch(_e){}
try{originalCostumeDetail=costumeTuningDetail}catch(_e){}

if(originalAllCostumes){
  const nextAll=function(charId){
    const list=(originalAllCostumes(charId)||[]).map(enrichedCostume);
    return renderingReleasedCostumes?list.filter(x=>!x._s18Upcoming):list;
  };
  try{allCostumesForCharId=nextAll}catch(_e){} window.allCostumesForCharId=nextAll;
}
if(originalCostumeCard){
  const nextCostumeCard=function(raw){
    const ct=enrichedCostume(raw);
    let html=originalCostumeCard(ct);
    const rid=costumeRid(ct);
    if(newCostumes.has(rid))html=injectBadge(html);
    if(ct.acquisition){
      html=html.replace(/(<div class="costumeMiniDesc">[\s\S]*?<\/div>)/,`$1<small class="s18CostumeAcquisition">${escHtml(ct.acquisition)}</small>`);
    }
    return html;
  };
  try{costumeCard=nextCostumeCard}catch(_e){} window.costumeCard=nextCostumeCard;
}

if(originalFindCostume){
  const nextFindCostume=function(id){return enrichedCostume(originalFindCostume(id))};
  try{findCostume=nextFindCostume}catch(_e){} window.findCostume=nextFindCostume;
}
if(originalCostumeDetail){
  const nextCostumeDetail=function(ct){return originalCostumeDetail(enrichedCostume(ct))};
  try{costumeTuningDetail=nextCostumeDetail}catch(_e){} window.costumeTuningDetail=nextCostumeDetail;
}
if(originalGalleryGroup){
  const nextGallery=function(g){
    const variants=(g?.variants||[]).map(v=>enrichedCostume({...v,group:g.group,name:g.group,rarity:v.rarity||g.rarity||'C',char:'midoriya'}));
    const visible=renderingReleasedCostumes?variants.filter(x=>!x._s18Upcoming):variants;
    if(!visible.length)return '';
    const localGroup=visible[0]?.group||g.group;
    return `<div class="costumeGalleryGroup"><div class="costumeGalleryHead"><span>${escHtml(localGroup)}</span></div><div class="costumeGalleryGrid">${visible.map(costumeCard).join('')}</div></div>`;
  };
  try{costumeGalleryGroup=nextGallery}catch(_e){} window.costumeGalleryGroup=nextGallery;
}
function localDate(v){
  const d=new Date(v);if(Number.isNaN(d.getTime()))return '';
  return new Intl.DateTimeFormat(currentLang()==='fr'?'fr-FR':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(d);
}
function upcomingSection(list){
  if(!list.length)return '';
  const title=currentLang()==='fr'?'Costumes à venir':'Upcoming Costumes';
  const copy=currentLang()==='fr'?'Ils passeront automatiquement dans les costumes disponibles à leur date de sortie.':'They automatically move to available costumes when their release date arrives.';
  const dateLabel=currentLang()==='fr'?'Sortie':'Release';
  return `<section class="s18UpcomingSection"><div class="s18UpcomingHead"><div><h2>${title}</h2><p>${copy}</p></div></div><div class="s18UpcomingGrid">${list.map(ct=>`<div class="s18UpcomingItem"><div class="s18ReleaseDate">${dateLabel} · ${escHtml(localDate(ct.releaseDate))}</div>${costumeCard(ct)}</div>`).join('')}</div></section>`;
}
if(originalCostumesPage&&originalAllCostumes){
  const nextCostumesPage=function(){
    if(!selectedChar)return originalCostumesPage();
    const all=(originalAllCostumes(selectedChar)||[]).map(enrichedCostume);
    const upcoming=all.filter(x=>x._s18Upcoming);
    renderingReleasedCostumes=true;
    let html='';
    try{html=originalCostumesPage()}finally{renderingReleasedCostumes=false}
    if(currentLang()==='en'){
      html=html.replace(/Costumes —/g,'Costumes —').replace(/Filtres costumes/g,'Costume filters').replace(/Aucun costume trouvé\./g,'No costume found.');
    }
    const section=upcomingSection(upcoming);
    if(section){
      const marker='<div class="costumeGroupsWrap">';
      const markerGrid='<div class="costumeGalleryGrid">';
      const at=html.indexOf(marker);
      const atGrid=html.indexOf(markerGrid);
      if(at>=0)html=html.slice(0,at)+section+`<h2 class="s18AvailableTitle">${currentLang()==='fr'?'Costumes disponibles':'Available Costumes'}</h2>`+html.slice(at);
      else if(atGrid>=0)html=html.slice(0,atGrid)+section+`<h2 class="s18AvailableTitle">${currentLang()==='fr'?'Costumes disponibles':'Available Costumes'}</h2>`+html.slice(atGrid);
      else html+=section;
    }
    return html;
  };
  try{costumesPage=nextCostumesPage}catch(_e){} window.costumesPage=nextCostumesPage;
}

/* ---------- Home: clean bilingual data, patch archive and Season 18 releases ---------- */
const patchOriginal=new WeakMap();
function translatePatchFR(v){
  let s=stripJP(v);
  const replacements=[
    [/^Data Update/i,'Mise à jour des données'],[/Balance Changes:\s*Health/gi,'Équilibrage : PV'],[/Balance Changes:\s*Damage/gi,'Équilibrage : Dégâts'],[/Balance Changes:\s*Reload/gi,'Équilibrage : Recharge'],[/Balance Changes:\s*Magazine/gi,'Équilibrage : Munitions'],[/Balance Changes/gi,'Équilibrage'],
    [/Special Action/gi,'Action spéciale'],[/Quirk Skill/gi,'Alter'],[/Maximum Health|Maximum HP|Max HP/gi,'PV maximum'],[/Health/gi,'PV'],[/Damage/gi,'Dégâts'],[/Ammo/gi,'Munitions'],[/Reload/gi,'Recharge'],[/Guard Break/gi,'Brise-garde'],[/Movement Speed/gi,'Vitesse de déplacement'],[/Before/gi,'Avant'],[/After/gi,'Après'],[/Original/gi,'Original']
  ];
  replacements.forEach(([a,b])=>{s=s.replace(a,b)});return s;
}
function patchLocalized(v){return currentLang()==='fr'?translatePatchFR(v):stripJP(v)}
function localizePatchObject(obj){
  if(!obj||typeof obj!=='object')return;
  if(!patchOriginal.has(obj))patchOriginal.set(obj,JSON.parse(JSON.stringify(obj)));
  const original=patchOriginal.get(obj);
  function walk(target,source,key=''){
    Object.keys(source||{}).forEach(k=>{
      const value=source[k];
      if(Array.isArray(value))target[k]=value.map((x,i)=>{if(x&&typeof x==='object'){const o={};walk(o,x,String(i));return o}return typeof x==='string'?patchLocalized(x):x});
      else if(value&&typeof value==='object'){target[k]={};walk(target[k],value,k)}
      else target[k]=typeof value==='string'&&['title','note','character','style','role','skill_name','label','text'].includes(k)?patchLocalized(value):value;
    });
  }
  walk(obj,original);
}
function syncHomeLanguage(){
  const d=window.MHUR_HOME_DATA||{};
  (d.login_bonuses||[]).forEach(x=>{x.title=stripJP(currentLang()==='fr'?(x.title_fr||x.title):(x.title_en||x.title));x.type=stripJP(currentLang()==='fr'?(x.type_fr||x.type):(x.type_en||x.type))});
  (d.latest_releases||[]).forEach(x=>{x.title=stripJP(x.title);x.subtitle=stripJP(currentLang()==='fr'?(x.subtitle_fr||x.subtitle):(x.subtitle_en||x.subtitle));});
  (d.patch_notes||[]).forEach(localizePatchObject);
}
function fmtArchiveDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat(currentLang()==='fr'?'fr-FR':'en-US',{day:'2-digit',month:'short',year:'numeric'}).format(d)}
function patchArchive(){
  const list=(window.MHUR_HOME_DATA?.patch_notes||[]).slice(1);
  if(!list.length)return '';
  return `<section class="s18PatchArchive"><h3>${currentLang()==='fr'?'Anciennes mises à jour':'Previous updates'}</h3><div class="s18PatchArchiveGrid">${list.map((p,i)=>`<button type="button" onclick="openPatchNoteV296(${i+1})"><span>${escHtml(stripJP(p.title))}</span><small>${escHtml(fmtArchiveDate(p.date))}</small></button>`).join('')}</div></section>`;
}
try{
  const oldDashboard=window.renderHomeDashboard;
  if(typeof oldDashboard==='function')window.renderHomeDashboard=function(){
    syncHomeLanguage();
    let html=oldDashboard();
    const archive=patchArchive();
    if(archive)html=html.replace(/(<footer class="homeFootV296">)/,archive+'$1');
    return html;
  };
}catch(_e){}
try{
  const oldOpen=window.openPatchNoteV296;
  if(typeof oldOpen==='function')window.openPatchNoteV296=function(i){syncHomeLanguage();return oldOpen(i)};
}catch(_e){}

/* Language changes call render(); data is selected immediately before rendering. */
syncHomeLanguage();
if(typeof page!=='undefined'&&page==='home'&&typeof render==='function'){
  try{window.__keepScroll=true;render()}catch(_e){}
}
})();


/* ---------- Season 18 polish pass: Gentle Criminal, cards, patch cards ---------- */
(function(){
'use strict';
const curLang=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const pick=(v,l=curLang())=>v&&typeof v==='object'&&!Array.isArray(v)?(v[l]??v.fr??v.en??''):v;
const CJK=/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(pick(v)??'').replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'').replace(CJK,'').replace(/\s{2,}/g,' ').trim();
const normalize=v=>String(clean(v)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const roleCls=r=>({strike:'strike',attack:'strike',assault:'assault',technical:'technical',support:'support',rapid:'speed',speed:'speed'})[normalize(r)]||normalize(r)||'technical';
const roleLabel=r=>{
  const key=roleCls(r);
  const dict={fr:{strike:'Attaque',assault:'Assaut',technical:'Technique',support:'Support',speed:'Rapide'},en:{strike:'Strike',assault:'Assault',technical:'Technical',support:'Support',speed:'Rapid'}};
  return dict[curLang()][key]||clean(r)||r;
};
const sideLabel=s=>curLang()==='fr'? (normalize(s)==='hero'?'Héros':'Super-vilains') : (normalize(s)==='hero'?'Heroes':'Super-Villains');
const NEW_HTML='<span class="s18NewBadge" aria-label="New">NEW</span>';
const variantMap={
  fr:{'original':'Original','combat':'Combat','vers_hero':'Vers. Héros','ver_hero':'Vers. Héros','hero_ver':'Vers. Héros','super_villain':'Super-vilain','super_vilains':'Super-vilain','elegant':'Élégant','dangerous':'Dangereux','fancy':'Fancy','heat':'Heat','casual':'Décontracté','formal':'Formel'},
  en:{'original':'Original','combat':'Combat','vers_heros':'Hero Ver.','ver_heros':'Hero Ver.','d_enfer':'Heat','super_vilain':'Super-Villain','elegant':'Elegant','dangereux':'Dangerous','fancy':'Fancy','tenue_de_boost_d_alters':'Quirk Boost Gear','costume_sans_cravate':'Necktie-less Costume','costume_formel':'Formal Costume','tenue_de_heros':'Hero Costume'}
};
function translateCostumeText(v){
  const raw=clean(v); if(!raw) return raw;
  const key=normalize(raw);
  const dict=variantMap[curLang()];
  return dict[key]||raw;
}
function patchGentle(){
  try{
    if(typeof styles==='undefined') return;
    const styleKey=(Object.keys(styles).find(k=>/gentle[_-]?criminal/i.test(k))||'gentle_criminal_support');
    const st=styles[styleKey]; if(!st) return;
    st.role='technical';
    st.pv='300';
    st.name={fr:'Original',en:'Original'};
    st.description={
      fr:"Un hors-la-loi des temps modernes qui entrera dans l'Histoire ! Son Alter Élasticité lui permet de virevolter dans les airs en narguant ses ennemis avec panache !",
      en:'A modern-day outlaw who is destined to go down in history! His Elasticity Quirk lets him dance through the air while styling on his enemies.'
    };
    st.roleDesc={
      fr:"Augmente la vitesse de rechargement de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.",
      en:'Raises the reload speed of the whole team. The more allies with the same role, the stronger the effect becomes.'
    };
    st.special={
      name:{fr:'Gently Trampoline / Mode Lover',en:'Gently Trampoline / Mode Lover'},
      img:st.special?.img||st.special?.image||st.portrait,
      desc:{
        fr:"Crée un trampoline gonflable aux pieds de Gentle. Les alliés qui le touchent effectuent un énorme saut, tandis que les ennemis sont repoussés. Après activation, Mode Lover améliore ses déplacements aériens.",
        en:'Creates an inflatable trampoline at Gentle’s feet. Allies who touch it perform a huge jump, while enemies are bounced away. After activation, Mode Lover enhances his aerial mobility.'
      },
      tables:[{title:{fr:'Valeurs action spéciale',en:'Special Action Values'},cols:{fr:['Niveau','Munitions','Consommation','Recharge'],en:['Level','Ammo','Consumption','Reload']},rows:[['Lv.1','x1','x1','14s'],['Lv.2','x1','x1','14s'],['Lv.3','x1','x1','14s'],['Lv.4','x1','x1','13s'],['Lv.5','x1','x1','13s'],['Lv.6','x1','x1','13s'],['Lv.7','x1','x1','12s'],['Lv.8','x1','x1','12s'],['Lv.9','x1','x1','12s']]}]
    };
    st.skills=[
      {
        letter:'α',
        name:'Gently Arrow',
        img:st.skills?.[0]?.img||st.alpha||st.portrait,
        desc:{
          fr:"Tire une flèche d'air comprimé qui produit une onde de choc à l'impact, puis poursuit sa course comme un projectile. Polyvalent à mi-distance.",
          en:'Fires a compressed-air arrow that creates a shockwave on impact and then continues forward as a projectile. A flexible mid-range tool.'
        },
        tables:[
          {title:{fr:'Valeurs α',en:'α Values'},cols:{fr:['Type','Niveau','Dégâts'],en:['Type','Level','Damage']},rows:[['Shockwave','Lv.1','70'],['Shockwave','Lv.2','75'],['Shockwave','Lv.3','80'],['Shockwave','Lv.4','85'],['Shockwave','Lv.5','90'],['Shockwave','Lv.6','95'],['Shockwave','Lv.7','100'],['Shockwave','Lv.8','105'],['Shockwave','Lv.9','110'],['Bullet','Lv.1','20'],['Bullet','Lv.2','21'],['Bullet','Lv.3','22'],['Bullet','Lv.4','23'],['Bullet','Lv.5','24'],['Bullet','Lv.6','25'],['Bullet','Lv.7','26'],['Bullet','Lv.8','27'],['Bullet','Lv.9','28']]},
          {title:{fr:'Munitions α',en:'α Ammo'},cols:{fr:['Niveau','Munitions','Consommation','Recharge'],en:['Level','Ammo','Consumption','Reload']},rows:[['Lv.1','x6','x1','2s'],['Lv.2','x6','x1','2s'],['Lv.3','x6','x1','2s'],['Lv.4','x7','x1','2s'],['Lv.5','x7','x1','2s'],['Lv.6','x7','x1','2s'],['Lv.7','x8','x1','2s'],['Lv.8','x8','x1','2s'],['Lv.9','x8','x1','2s']]}
        ]
      },
      {
        letter:'β',
        name:{fr:'Elasticité montante',en:'Rising Elasticity'},
        img:st.skills?.[1]?.img||st.portrait,
        desc:{
          fr:"Déploie de l'élasticité pour rebondir, contrôler l'espace et repousser les ennemis. Les données qui manquaient sont maintenant affichées proprement.",
          en:'Deploys elasticity to bounce, control space, and push enemies back. The previously missing values are now shown cleanly.'
        },
        tables:[{title:{fr:'Valeurs β',en:'β Values'},cols:{fr:['Niveau','Munitions','Consommation','Recharge'],en:['Level','Ammo','Consumption','Reload']},rows:[['Lv.1','x2','x1','8s'],['Lv.2','x2','x1','8s'],['Lv.3','x2','x1','8s'],['Lv.4','x2','x1','7s'],['Lv.5','x2','x1','7s'],['Lv.6','x2','x1','7s'],['Lv.7','x2','x1','6s'],['Lv.8','x2','x1','6s'],['Lv.9','x2','x1','6s']]}]
      },
      {
        letter:'γ',
        name:{fr:'Rebond du gentleman',en:'Gentle Rebound'},
        img:st.skills?.[2]?.img||st.portrait,
        desc:{
          fr:"Se propulse en exploitant son Alter pour garder l'avantage en l'air et surprendre sa cible.",
          en:'Launches himself using Elasticity to keep aerial advantage and catch targets off guard.'
        },
        tables:[{title:{fr:'Valeurs γ',en:'γ Values'},cols:{fr:['Niveau','Dégâts','Munitions','Consommation','Recharge'],en:['Level','Damage','Ammo','Consumption','Reload']},rows:[['Lv.1','80','x1','x1','10s'],['Lv.2','82','x1','x1','10s'],['Lv.3','84','x1','x1','10s'],['Lv.4','86','x1','x1','9s'],['Lv.5','88','x1','x1','9s'],['Lv.6','90','x1','x1','9s'],['Lv.7','92','x1','x1','8s'],['Lv.8','95','x1','x1','8s'],['Lv.9','100','x1','x1','8s']]}]
      }
    ];
    if(typeof characters!=='undefined'){
      const ch=characters.find(c=>/gentle/i.test(c.id||'')||/gentle/i.test(c.name||''));
      if(ch){
        ch.side='villain';
        ch.name='Gentle Criminal';
        const list=Array.isArray(ch.styles)?ch.styles:[];
        if(!list.includes(styleKey)) list.unshift(styleKey);
        ch.styles=list;
      }
    }
  }catch(_e){}
}
function skillByName(st,name){
  const target=normalize(name);
  const all=[st.special,...(st.skills||[])].filter(Boolean);
  return all.find(x=>normalize(x.letter+' '+clean(x.name))===target||normalize(clean(x.name))===target||target.startsWith(normalize(x.letter)))||null;
}
function resolveCharacterStyle(character, styleName){
  if(typeof characters==='undefined' || typeof styles==='undefined') return null;
  const ch=(characters||[]).find(c=>normalize(c.name)===normalize(character)||normalize(c.id)===normalize(character));
  if(!ch) return null;
  const list=(ch.styles||[]).map(id=>({id,st:styles[id]})).filter(x=>x.st);
  if(!list.length) return null;
  if(styleName){
    const found=list.find(x=>normalize(clean(x.st.name))===normalize(styleName)||normalize(x.id)===normalize(styleName));
    if(found) return found;
  }
  return list[0];
}
function isNoChange(change){
  const t=normalize(change?.text||change?.note||'');
  if(t.includes('no_changes_detected')) return true;
  if(change && 'before' in change && 'after' in change){
    try{return JSON.stringify(change.before)===JSON.stringify(change.after);}catch(_e){}
  }
  return false;
}
function scrubPatchData(){
  const patches=window.MHUR_HOME_DATA?.patch_notes;
  if(!Array.isArray(patches)) return;
  patches.forEach(note=>{
    if(Array.isArray(note.details)){
      note.details=note.details.map(sec=>{
        const changes=(sec.changes||[]).filter(ch=>!isNoChange(ch)).map(ch=>{
          const hit=resolveCharacterStyle(ch.character,ch.style);
          if(hit){
            ch.role=roleLabel(hit.st.role);
            ch.portrait=hit.st.portrait||ch.portrait;
            const skill=skillByName(hit.st,ch.skill_name);
            if(skill?.img) ch.skill_image=skill.img;
          }
          ch.character=clean(ch.character);
          ch.style=clean(ch.style);
          ch.skill_name=clean(ch.skill_name);
          ch.label=clean(ch.label);
          return ch;
        });
        return {...sec,changes};
      }).filter(sec=>(sec.changes||[]).length);
    }
  });
}
function renderDiff(before,after){
  const b=Array.isArray(before)?before:[before];
  const a=Array.isArray(after)?after:[after];
  if(b.length===1 && a.length===1 && typeof b[0]!=='object' && typeof a[0]!=='object'){
    return `<div class="s18PatchRow"><span class="s18PatchBefore">${esc(clean(b[0]))}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter">${esc(clean(a[0]))}</span></div>`;
  }
  const rows=Math.max(b.length,a.length);
  return `<div class="s18PatchRows">${Array.from({length:rows},(_,i)=>`<div class="s18PatchRow"><span class="s18PatchBefore">${esc(clean(b[i]??''))}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter">${esc(clean(a[i]??''))}</span></div>`).join('')}</div>`;
}
function betterDetailCard(c,index,color){
  if(!c || isNoChange(c)) return '';
  const hit=resolveCharacterStyle(c.character,c.style);
  const st=hit?.st||null;
  const portrait=c.portrait || st?.portrait || c.skill_image || '';
  const skill=skillByName(st||{},c.skill_name)||null;
  const skillImg=c.skill_image || skill?.img || st?.special?.img || portrait || '';
  const role=roleCls(st?.role||c.role);
  const roleTxt=roleLabel(st?.role||c.role);
  const side=(st && typeof characters!=='undefined' ? (characters.find(x=>(x.styles||[]).includes(hit.id))||{}).side : '')||'';
  const tone=normalize(c.tone||'adjust');
  const border=tone==='buff'?'#2cff6d':tone==='nerf'?'#ff5c6a':'#f0b21f';
  const sideBadgeHtml=side?`<span class="badge ${normalize(side)==='hero'?'hero':'villain'}">${esc(sideLabel(side))}</span>`:'';
  const roleBadgeHtml=`<span class="badge ${role}">${typeof roleOnly==='function'?roleOnly(role==='strike'?'attack':role==='speed'?'rapid':role):''}<span>${esc(roleTxt)}</span></span>`;
  return `<article class="homePatchCardV296 s18PatchCard" style="border-color:${border}"><header class="s18PatchHeader"><div class="s18PatchPortrait">${portrait?(typeof asset==='function'?asset(portrait,clean(c.character)||'portrait'):`<img src="${esc(portrait)}" alt="">`):''}</div><div class="s18PatchMeta"><div class="s18PatchTopLine"><h4>${esc(clean(c.character)||'Character')}</h4>${sideBadgeHtml}</div><div class="s18PatchStyle">${esc(clean(c.style)||'Original')}</div><div class="s18PatchBadges">${roleBadgeHtml}</div></div></header><div class="s18PatchSkill"><div class="s18PatchSkillImg">${skillImg?(typeof asset==='function'?asset(skillImg,clean(c.skill_name)||'skill'):`<img src="${esc(skillImg)}" alt="">`):''}</div><div class="s18PatchSkillMeta"><h5>${esc(clean(c.skill_name)||'Skill')}</h5>${c.label?`<div class="s18PatchLabel">${esc(clean(c.label))}</div>`:''}${renderDiff(c.before,c.after)}</div></div></article>`;
}
function patchCharacterDetail(){
  try{
    const old=characterDetail;
    const next=function(s){
      const st=styles[s]; if(!st) return old(s);
      const ch=characters.find(x=>(x.styles||[]).includes(s))||{name:'Character'};
      const role=roleCls(st.role);
      const back=curLang()==='fr'?'Retour':'Back';
      const roleTitle=curLang()==='fr'?'Rôle':'Role';
      const styleTitle='Style';
      const quirkTitle=curLang()==='fr'?'Alter':'Quirk Skills';
      return `<button class="back" onclick="selectedStyle=null;if((characters.find(x=>x.id===selectedChar)||{}).styles?.length===1)selectedChar=null;render()">← ${back}</button><div class="charPanel role-${role} s18EnhancedCharPanel"><div class="charTop"><div class="portrait">${typeof asset==='function'?asset(st.portrait,'portrait'):`<img src="${esc(st.portrait)}" alt="">`}</div><div class="meta"><h2>${esc(ch.name)}</h2><div class="badges">${typeof roleBadge==='function'?roleBadge(role==='strike'?'attack':role==='speed'?'rapid':role):''}<span class="badge">PV : ${esc(st.pv)}</span></div><p><b>${styleTitle} :</b> ${esc(clean(st.name))}</p><p>${esc(clean(st.description))}</p><p><b>${roleTitle} :</b> ${esc(clean(st.roleDesc))}</p></div></div>${typeof skillSection==='function'?skillSection({letter:'SP',...st.special},true):''}<h2 class="s18QuirkTitle">${quirkTitle}</h2>${(st.skills||[]).map(k=>typeof skillSection==='function'?skillSection(k,false):'').join('')}</div>`;
    };
    characterDetail=next; window.characterDetail=next;
  }catch(_e){}
}
function enhanceCards(){
  try{
    const oldCard=window.card||card;
    const next=function(c,mode='characters'){
      let html=oldCard(c,mode);
      const first=(c.styles||[]).find(id=>typeof styles!=='undefined'&&styles[id]);
      const role=roleCls(first&&styles[first]?.role);
      html=String(html).replace(/<button class="card([^\"]*)"/i,`<button class="card$1 s18RoleCard role-${role}"`);
      if((window.MHUR_SEASON18_DATA?.new_content?.characters||[]).includes(String(c.id)) && !/s18NewBadge/.test(html)) html=html.replace(/^(<button\b[^>]*>)/i,'$1'+NEW_HTML);
      return html;
    };
    if(typeof card!=='undefined'){ card=next; window.card=next; }
  }catch(_e){}
}
function enhanceCostumes(){
  try{
    const old=window.costumeCard||costumeCard;
    const next=function(ct){
      const copy={...(ct||{})};
      copy.name=translateCostumeText(copy.name);
      copy.group=translateCostumeText(copy.group||copy.name);
      copy.variant=translateCostumeText(copy.variant);
      let html=old(copy);
      html=String(html).replace(/(<div class="s18ReleaseDate"[^>]*>)/g,'$1');
      return html;
    };
    if(typeof costumeCard!=='undefined'){ costumeCard=next; window.costumeCard=next; }
  }catch(_e){}
}
function decorateDom(){
  document.querySelectorAll('.card[data-char]').forEach(btn=>{
    if(!btn.classList.contains('s18RoleCard')){
      const id=btn.getAttribute('data-char')||'';
      const ch=(typeof characters!=='undefined'?(characters.find(x=>String(x.id)===String(id))):null);
      const first=ch?.styles?.find(s=>typeof styles!=='undefined'&&styles[s]);
      btn.classList.add('s18RoleCard');
      btn.classList.add(`role-${roleCls(first&&styles[first]?.role)}`);
    }
    if((window.MHUR_SEASON18_DATA?.new_content?.characters||[]).includes(btn.getAttribute('data-char')) && !btn.querySelector('.s18NewBadge')) btn.insertAdjacentHTML('afterbegin',NEW_HTML);
  });
  document.querySelectorAll('.charPanel').forEach(p=>p.classList.add('s18EnhancedCharPanel'));
  document.querySelectorAll('.s18PatchCard .badge.technical,.homePatchCardV296 .badge.technical').forEach(x=>x.classList.add('technical'));
  document.querySelectorAll('.homePatchCardV296').forEach(card=>{
    if(/No changes detected/i.test(card.textContent||'')) card.remove();
  });
}
function wrapRender(){
  if(typeof render!=='function' || render.__s18Wrapped) return;
  const old=render;
  const next=function(){ const r=old.apply(this,arguments); setTimeout(decorateDom,0); return r; };
  next.__s18Wrapped=true; render=next; window.render=next;
}
patchGentle();
scrubPatchData();
if(typeof detailCard!=='undefined'){ detailCard=betterDetailCard; window.detailCard=betterDetailCard; }
patchCharacterDetail();
enhanceCards();
enhanceCostumes();
wrapRender();
if(typeof render==='function') setTimeout(()=>{try{decorateDom()}catch(_e){}},0);
const mo=new MutationObserver(()=>decorateDom());
if(document.documentElement) mo.observe(document.documentElement,{childList:true,subtree:true});
})();
