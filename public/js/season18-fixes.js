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
