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
const badge=()=>'<span class="s18NewBadge" aria-label="Nouveau">NEW!</span>';
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
        const list=Array.isArray(ch.styles)?Array.from(new Set(ch.styles.map(String))):[];
        ch.styles=[styleKey,...list.filter(id=>id!==styleKey)];
      }
    }
  }catch(_e){}
}
function skillByName(st,name){
  const target=normalize(name);
  const all=[st.special,...(st.skills||[])].filter(Boolean);
  return all.find(x=>normalize(x.letter+' '+clean(x.name))===target||normalize(clean(x.name))===target||target.startsWith(normalize(x.letter)))||null;
}
function patchTone(change){
  const t=normalize(change?.tone||change?.type||'');
  if(/buff|up|increase|improve/.test(t)) return 'buff';
  if(/nerf|down|decrease|weaken/.test(t)) return 'nerf';
  return 'adjust';
}
function patchToneLabel(change){
  const t=patchTone(change);
  if(t==='buff') return 'BUFF';
  if(t==='nerf') return 'NERF';
  return langNow()==='fr'?'NEUTRE':'NEUTRAL';
}
function patchChangeView(change,group){
  const info=resolvePatchStyle(change);
  const st=info?.st||null;
  let skill=skillByName(st,change?.skill_name||change?.label||'');
  if(!skill&&st&&Array.isArray(st.skills)){
    const letter=String(change?.skill_name||change?.label||'').trim().charAt(0).toLowerCase();
    if(['α','β','γ','a','b','g'].includes(letter)) skill=st.skills.find(sk=>String(sk?.letter||'').toLowerCase()===letter)||null;
  }
  const rawSkill=clean(change?.skill_name||change?.label||'');
  const skillTitle=skill?clean(`${skill.letter?`${skill.letter} - `:''}${pick(skill.name)||''}`):rawSkill;
  return {
    tone:patchTone(change),
    toneLabel:patchToneLabel(change),
    skillTitle,
    skillImg:skill?.img||change?.skill_image||'',
    label:clean(change?.label),
    before:clean(change?.before),
    after:clean(change?.after),
    bullets:localBullets(change?.bullets||[])
  };
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

/* ---------- Season 18 corrective pass v3: exact data, style picker, grouped patches ---------- */
(function(){
'use strict';
const langNow=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const pick=(v,l=langNow())=>v&&typeof v==='object'&&!Array.isArray(v)?(v[l]??v.fr??v.en??''):v;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CJK=/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;
const clean=v=>String(pick(v)??'').replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'').replace(CJK,'').replace(/\s{2,}/g,' ').trim();
const normalize=v=>String(clean(v)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const roleKey=r=>({attack:'strike',strike:'strike',assault:'assault',technical:'technical',support:'support',speed:'speed',rapid:'speed'})[normalize(r)]||'technical';
const newContent=window.MHUR_SEASON18_DATA?.new_content||{};
const newStylesSet=new Set((newContent.styles||[]).map(String));
const newCharsSet=new Set((newContent.characters||[]).map(String));
const NEW_BADGE='<span class="s18NewBadge" aria-label="NEW">NEW</span>';

function dedupeCharacterStyles(){
  if(typeof characters==='undefined' || !Array.isArray(characters)) return;
  characters.forEach(ch=>{
    const seen=new Set();
    ch.styles=(Array.isArray(ch.styles)?ch.styles:[]).filter(id=>{
      id=String(id);
      if(seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  });
}

let __exactCache=null;
function readExactData(){
  if(__exactCache) return __exactCache;
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el) return null;
  try{__exactCache=JSON.parse(el.textContent||'{}');}catch(_e){__exactCache=null;}
  return __exactCache;
}
function translateHeaderCell(value,l){
  const key=normalize(value);
  const fr={level:'Niveau',type:'Type',damage:'Dégâts',ammo:'Munitions',use_ammo:'Consommation',reload:'Recharge',level_up_effect:'Effet de montée',effect:'Effet',guard_break:'Brise-garde',hp:'PV',health:'PV'};
  const en={level:'Level',type:'Type',damage:'Damage',ammo:'Ammo',use_ammo:'Use Ammo',reload:'Reload',level_up_effect:'Level Up Effect',effect:'Effect',guard_break:'Guard Break',hp:'HP',health:'Health'};
  const dict=l==='fr'?fr:en;
  return dict[key]||clean(value);
}
function mapRows(rows){
  return (Array.isArray(rows)?rows:[]).map(r=>(Array.isArray(r)?r:[]).map(x=>clean(x)));
}
function mapCols(cols,l){
  const raw=Array.isArray(cols)?cols:[];
  const keep=[];
  raw.forEach((c,i)=>{ if(normalize(c)!=='down_power') keep.push([i,translateHeaderCell(c,l)]); });
  return {indexes:keep.map(x=>x[0]), labels:keep.map(x=>x[1])};
}
function localTable(titleFr,titleEn,cols,rows){
  const fr=mapCols(cols,'fr'), en=mapCols(cols,'en');
  const baseRows=mapRows(rows);
  const sliceRows=indexes=>baseRows.map(r=>indexes.map(i=>r[i]??''));
  if(!fr.labels.length || !baseRows.length) return null;
  return {title:{fr:titleFr,en:titleEn}, cols:{fr:fr.labels,en:en.labels}, rows:{fr:sliceRows(fr.indexes),en:sliceRows(en.indexes)}};
}
function usefulDesc(v,name){
  const txt=clean(v), nm=clean(name);
  if(!txt) return false;
  if(normalize(txt)===normalize(nm)) return false;
  return txt.length>8;
}
function remoteCandidatesForCharacter(localChar){
  const data=readExactData();
  const list=Array.isArray(data?.characters)?data.characters:[];
  const chNorm=normalize(localChar?.name||'');
  return list.filter(r=>{
    const n1=normalize(r.base_name||r.name||'');
    const n2=normalize(r.name||'');
    return n1===chNorm || n2===chNorm;
  }).sort((a,b)=>(Number(a.variant_index||0)-Number(b.variant_index||0)));
}
function findRemoteForStyle(styleKey){
  if(typeof styles==='undefined' || typeof characters==='undefined') return null;
  const st=styles[styleKey]; if(!st) return null;
  const ch=(characters||[]).find(x=>(x.styles||[]).includes(styleKey));
  if(!ch) return null;
  const candidates=remoteCandidatesForCharacter(ch);
  if(!candidates.length) return null;
  const localStyle=normalize(st.name||'Original');
  let hit=candidates.find(r=>normalize(r.style_name||'Original')===localStyle || normalize(r.style_header||'')===localStyle);
  if(!hit && (localStyle==='original' || !localStyle)) hit=candidates.find(r=>Number(r.variant_index||0)===0 || normalize(r.style_name||'Original')==='original');
  if(!hit){
    const uniqueStyles=[...new Set((ch.styles||[]).map(String))];
    const idx=Math.max(0,uniqueStyles.indexOf(String(styleKey)));
    hit=candidates[Math.min(idx,candidates.length-1)]||null;
  }
  if(!hit) hit=candidates.find(r=>roleKey(r.role)===roleKey(st.role))||candidates[0];
  return hit||null;
}
function setIfBetter(obj,key,value){ if(value!=null && value!=='' ) obj[key]=value; }
function rebuildStyleTablesFromRemote(styleKey){
  if(typeof styles==='undefined') return false;
  const st=styles[styleKey], remote=findRemoteForStyle(styleKey); if(!st || !remote) return false;
  let changed=false;
  const remotePortrait=remote.assets?.portrait||'';
  if(remotePortrait && st.portrait!==remotePortrait){ st.portrait=remotePortrait; changed=true; }
  if(remote.stats){
    const hp=remote.stats['Max Main Health']??remote.stats['Max Health']??remote.stats['Max HP']??remote.stats['HP'];
    if(hp && String(st.pv)!==String(hp)){ st.pv=hp; changed=true; }
  }
  const skillOrder=['α','β','γ'];
  const remoteSkills=remote.skills||{};
  (st.skills||[]).forEach((sk,idx)=>{
    const letter=sk.letter||skillOrder[idx];
    const rk=remoteSkills[letter];
    if(!rk) return;
    const tables=[];
    const levelRows=(rk.level_up_effects?.rows)||[];
    const levelCols=(rk.level_up_effects?.columns)||[];
    const baseRows=(rk.base_values?.rows)||[];
    const baseCols=(rk.base_values?.columns)||[];
    const addRows=(rk.additional_values?.rows)||[];
    const addCols=(rk.additional_values?.columns)||[];
    const t1=localTable(`Effets de montée ${letter}`,`${letter} Level Up Effects`,levelCols,levelRows); if(t1) tables.push(t1);
    const t2=localTable(`Valeurs de base ${letter}`,`${letter} Base Values`,baseCols,baseRows); if(t2) tables.push(t2);
    const t3=localTable(`Valeurs additionnelles ${letter}`,`${letter} Additional Values`,addCols,addRows); if(t3) tables.push(t3);
    if(tables.length){ sk.tables=tables; changed=true; }
    if(remote.assets){
      if(letter==='α' && remote.assets.alpha){ sk.img=remote.assets.alpha; changed=true; }
      if(letter==='β' && remote.assets.beta){ sk.img=remote.assets.beta; changed=true; }
      if(letter==='γ' && remote.assets.gamma){ sk.img=remote.assets.gamma; changed=true; }
    }
    if(!usefulDesc(sk.desc,sk.name) && usefulDesc(rk.description,rk.name)){ sk.desc={fr:clean(rk.description),en:clean(rk.description)}; changed=true; }
    if(clean(rk.name) && clean(sk.name)!==clean(rk.name) && (!clean(sk.name) || clean(sk.name).length<2)){ sk.name={fr:clean(rk.name),en:clean(rk.name)}; changed=true; }
  });
  if(st.special){
    const sp=remote.special_action||{};
    const spTable=localTable('Valeurs action spéciale','Special Action Values',sp.values?.columns||[],sp.values?.rows||[]);
    if(spTable){ st.special.tables=[spTable]; changed=true; }
    if(remote.assets?.special){ st.special.img=remote.assets.special; changed=true; }
    if(!usefulDesc(st.special.desc,st.special.name) && usefulDesc(sp.description,st.special.name)){ st.special.desc={fr:clean(sp.description),en:clean(sp.description)}; changed=true; }
  }
  return changed;
}
function applyExactData(){
  if(typeof styles==='undefined' || typeof characters==='undefined') return;
  dedupeCharacterStyles();
  Object.keys(styles).forEach(rebuildStyleTablesFromRemote);
  (characters||[]).forEach(ch=>{
    const first=(ch.styles||[]).find(id=>styles[id]);
    if(first && styles[first]?.portrait) ch.portrait=styles[first].portrait;
  });
}

function uniqRoles(styleIds){
  const seen=new Set();
  return (styleIds||[]).map(id=>styles[id]?.role).filter(Boolean).filter(r=>{ const k=roleKey(r); if(seen.has(k)) return false; seen.add(k); return true;});
}
function bestPortraitForCharacter(ch){
  const first=(ch.styles||[]).find(id=>styles[id]?.portrait);
  return first?styles[first].portrait:(ch.portrait||'');
}
function cardHtml(c,mode='characters'){
  const modeClass=mode==='costumes'?' costumeMode':mode==='builds'?' buildMode':mode==='tunings'?' tuningMode':' characterMode';
  const tag=mode==='costumes'?`<div class="cardModeTag">${tr('costumeTag')}</div>`:mode==='builds'?`<div class="cardModeTag">${tr('buildTag')}</div>`:mode==='tunings'?`<div class="cardModeTag">T.U.N.I.N.G</div>`:`<div class="cardModeTag">PERSONNAGE</div>`;
  const msg=mode==='costumes'?tr('costumeChoose'):mode==='builds'?tr('buildChoose'):mode==='tunings'?tr('tuningChoose'):tr('choose');
  const stylesList=[...new Set((c.styles||[]).map(String))].filter(id=>styles[id]);
  const firstStyle=stylesList[0]||'';
  const role=roleKey(styles[firstStyle]?.role||'technical');
  const roleBadges=uniqRoles(stylesList).map(r=>roleBadge(r)).join('');
  const portrait=bestPortraitForCharacter(c);
  return `<button class="card${modeClass} s18RoleCard role-${role}" data-char="${esc(c.id)}" onclick="selectChar('${String(c.id).replace(/'/g,"\\'")}')">${newCharsSet.has(String(c.id))?NEW_BADGE:''}${tag}<div class="thumb">${asset(portrait,c.name)}</div><div class="cardBody"><h3>${esc(c.name)}</h3><div class="badges">${sideBadge(c.side)}${roleBadges}</div><p style="color:#c9d7ee">${esc(msg)}</p></div></button>`;
}
function stylePickerHtml(){
  const c=(characters||[]).find(x=>x.id===selectedChar); if(!c) return '';
  const stylesList=[...new Set((c.styles||[]).map(String))].filter(id=>styles[id]);
  return `<button class="back" onclick="selectedChar=null;render()">← ${tr('back')}</button><h1 class="title">${esc(c.name)}</h1><div class="styleGrid">${stylesList.map(id=>{const st=styles[id];const role=roleKey(st.role);return `<button class="styleCard s18StyleCard role-${role}" data-style="${esc(id)}" onclick="selectStyle('${String(id).replace(/'/g,"\\'")}')">${newStylesSet.has(String(id))?NEW_BADGE:''}<div class="styleBanner">${asset(st.portrait,c.name+' '+clean(st.name))}</div><div class="styleInfo"><h2>${esc(clean(st.name)||'Original')}</h2><div class="badges">${sideBadge(c.side)}${roleBadge(st.role)}</div></div></button>`}).join('')}</div>`;
}

function fmtPatchDate(v){
  const d=new Date(v); if(Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(langNow()==='fr'?'fr-FR':'en-US',{dateStyle:'medium'}).format(d);
}
function renderPatchDiff(change){
  const b=Array.isArray(change.before)?change.before:[change.before];
  const a=Array.isArray(change.after)?change.after:[change.after];
  const isMulti=(b.length>1||a.length>1);
  if(!isMulti){
    return `<div class="s18PatchRow"><span class="s18PatchBefore">${esc(clean(b[0]??'—'))}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter">${esc(clean(a[0]??'—'))}</span></div>`;
  }
  return `<div class="s18PatchRows">${Array.from({length:Math.max(b.length,a.length)},(_,i)=>`<div class="s18PatchRow"><span class="s18PatchBefore">${esc(clean(b[i]??''))}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter">${esc(clean(a[i]??''))}</span></div>`).join('')}</div>`;
}
function groupedPatchSection(section){
  const groups=[]; const map=new Map();
  (section.changes||[]).forEach(change=>{
    const stHit=resolvePatchStyle(change);
    const key=`${clean(change.character)}__${stHit?.styleId||clean(change.style||'Original')}`;
    if(!map.has(key)){
      const hit=findRemoteForStyle(((characters||[]).find(ch=>normalize(ch.name)===normalize(change.character) || normalize(ch.id)===normalize(change.character))?.styles||[]).find(id=>normalize(styles[id]?.name||'')===normalize(change.style||'Original'))||'');
      const entry={key,character:clean(change.character),style:stHit?.st?clean(stHit.st.name||'Original'):clean(change.style||'Original'),role:stHit?.role||change.role||'',side:stHit?.side||'',portrait:stHit?.portrait||change.portrait||hit?.assets?.portrait||'',changes:[]};
      map.set(key,entry); groups.push(entry);
    }
    map.get(key).changes.push(change);
  });
  return `<section class="detailSectionV296 ${esc(section.accent||'')}"><h3>${esc(clean(section.title))}</h3>${section.note?`<p class="patchNoteV296">${esc(clean(section.note))}</p>`:''}<div class="s18PatchGroupGrid">${groups.map(group=>patchGroupCard(group)).join('')}</div></section>`;
}
function resolvePatchStyle(change){
  const charNorm=normalize(change.character||"");
  const styleNorm=normalize(change.style||"Original");
  let styleId="", st=null, side="";
  if(Array.isArray(characters)){
    for(const ch of characters){
      const nameHit=normalize(ch.name||ch.id||"")===charNorm;
      if(!nameHit) continue;
      const list=[...(new Set((ch.styles||[]).map(String)))];
      styleId=list.find(id=>normalize(styles[id]?.name||"Original")===styleNorm) || list[0] || "";
      st=styleId?styles[styleId]:null;
      side=ch.side||"";
      break;
    }
  }
  return {styleId, st, role:st?.role||change.role||"", side, portrait:st?.portrait||change.portrait||""};
}
function patchGroupCard(group){
  const role=roleKey(group.role);
  const sideBadgeHtml=group.side?`<span class="badge ${normalize(group.side)==='hero'?'hero':'villain'}">${normalize(group.side)==='hero'?(langNow()==='fr'?'HÉROS':'HEROES'):(langNow()==='fr'?'SUPER-VILAINS':'SUPER-VILLAINS')}</span>`:'';
  const roleBadgeHtml=typeof roleBadge==='function'?roleBadge(role):'';
  return `<article class="s18PatchGroupCard role-${role}"><header class="s18PatchHeader"><div class="s18PatchPortrait">${group.portrait?asset(group.portrait,group.character):''}</div><div class="s18PatchMeta"><div class="s18PatchTopLine"><h4>${esc(group.character)}</h4>${sideBadgeHtml}</div><div class="s18PatchStyle">${esc(group.style||'Original')}</div><div class="s18PatchBadges">${roleBadgeHtml}</div></div></header><div class="s18PatchGroupBody">${group.changes.map(change=>{ const view=patchChangeView(change,group); return `<div class="s18PatchSkillBlock ${esc(view.tone)}"><div class="s18PatchTone ${esc(view.tone)}">${esc(view.toneLabel)}</div><div class="s18PatchSkill"><div class="s18PatchSkillImg">${view.skillImg?asset(view.skillImg,view.skillTitle):''}</div><div class="s18PatchSkillMeta"><h5>${esc(view.skillTitle||'Skill')}</h5>${view.label?`<div class="s18PatchLabel">${esc(view.label)}</div>`:''}${view.before!=null||view.after!=null?`<div class="s18PatchRows"><div class="s18PatchRow"><span class="s18PatchBefore">${esc(view.before)}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter ${esc(view.tone)}">${esc(view.after)}</span></div></div>`:''}${(view.bullets||[]).length?`<ul class="s18PatchBullets">${view.bullets.map(x=>`<li>${esc(clean(x))}</li>`).join('')}</ul>`:''}</div></div></div>`; }).join('')}</div></article>`;
}
function ensurePatchModal(){
  let m=document.getElementById('patchModalV296');
  if(!m){
    m=document.createElement('div');
    m.id='patchModalV296';
    m.className='modalV296';
    m.innerHTML=`<div class="modalPanelV296 patchPanelV296"><header><h2></h2><button onclick="closeHomeModalV296('patchModalV296')">×</button></header><div class="modalBodyV296"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener('click',e=>{ if(e.target===m) closeHomeModalV296('patchModalV296'); });
  }
  return m;
}
function openGroupedPatch(i){
  const note=(window.MHUR_HOME_DATA?.patch_notes||[])[i]; if(!note) return;
  const m=ensurePatchModal();
  m.querySelector('header h2').textContent=clean(note.title);
  const details=Array.isArray(note.details)?note.details.filter(sec=>(sec.changes||[]).length||sec.note):[];
  let body=`<div class="patchDateV296">${esc(fmtPatchDate(note.date))}</div><div class="legendV296"><span class="buff">${langNow()==='fr'?'AMÉLIORATION':'BUFF'}</span><span class="nerf">${langNow()==='fr'?'RÉDUCTION':'NERF'}</span><span class="adjust">${langNow()==='fr'?'NEUTRE':'NEUTRAL'}</span></div>`;
  if(details.length) body+=details.map(groupedPatchSection).join('');
  else if((note.sections||[]).length) body+=(note.sections||[]).map(s=>`<section class="simplePatchV296"><h3>${esc(clean(s.title||''))}</h3><ul>${(s.items||[]).map(x=>`<li>${esc(clean(x))}</li>`).join('')}</ul></section>`).join('');
  else body+=`<div class="emptyV296">${langNow()==='fr'?'Aucun détail disponible.':'No details available.'}</div>`;
  m.querySelector('.modalBodyV296').innerHTML=body;
  m.classList.add('open');
  document.body.classList.add('homeModalOpenV296');
}

function installOverrides(){
  applyExactData();
  dedupeCharacterStyles();
  if(typeof card==='function'){ window.card=card=cardHtml; }
  if(typeof stylePicker==='function'){ window.stylePicker=stylePicker=stylePickerHtml; }
  window.openPatchNoteV296=openGroupedPatch;
}

installOverrides();
if(typeof render==='function') setTimeout(()=>{ try{ applyExactData(); dedupeCharacterStyles(); render(); }catch(_e){} },0);
window.addEventListener('mhur:languagechange',()=>{ applyExactData(); dedupeCharacterStyles(); if(typeof render==='function') render(); });
})();

/* ---------- Homepage latest releases redesign ---------- */
(function(){
'use strict';
if(typeof window==='undefined') return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentLang=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const pickLocal=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[currentLang()]??v.fr??v.en??''):v;
const cleanLocal=v=>String(pickLocal(v)??'').replace(/[぀-ヿ㐀-鿿豈-﫿]/g,'').replace(/\s{2,}/g,' ').trim();
const norm=v=>String(v??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const patchLabel=v=>typeof patchText==='function'?patchText(v):cleanLocal(v);
const releaseKindLabel=kind=>kind==='character'?(currentLang()==='fr'?'Personnage jouable':'Playable character'):kind==='costume'?(currentLang()==='fr'?'Nouveau costume':'New costume'):(currentLang()==='fr'?'Nouveau style':'New style');
const isGenericName=v=>/^character\s*\d+/i.test(String(v||''))||/^style\s*\d+/i.test(String(v||''));
function customReleaseTarget(x){
  let out={charId:String(x?.character_id||x?.char_id||''),styleId:String(x?.style_id||'')};
  if(typeof releaseTarget==='function'){ try{ out={...out,...(releaseTarget(x)||{})}; }catch(_e){} }
  const url=String(x?.url||'');
  const m=url.match(/character\/(\d+)(?:#Variant-(\d+))?/i);
  const idMap={'2':'bakugo','13':'aizawa','34':'overhaul','109':'present_mic','111':'mirko'};
  if(!out.charId&&m&&idMap[m[1]]) out.charId=idMap[m[1]];
  const c=(typeof characters!=='undefined'&&characters.find(v=>String(v.id)===String(out.charId)))||null;
  if(!out.styleId&&c){
    const rawSub=String((currentLang()==='fr'?(x?.subtitle_fr||x?.subtitle):(x?.subtitle_en||x?.subtitle))||'');
    const subNorm=norm(rawSub);
    if(m&&m[2]&&Array.isArray(c.styles)){ const idx=parseInt(m[2],10); if(!Number.isNaN(idx)&&c.styles[idx]) out.styleId=String(c.styles[idx]); }
    if(!out.styleId&&Array.isArray(c.styles)&&rawSub){ const hit=c.styles.find(id=>norm(cleanLocal(styles?.[id]?.name||''))===subNorm); if(hit) out.styleId=String(hit); }
    if(!out.styleId&&Array.isArray(c.styles)) out.styleId=String(c.styles[0]||'');
  }
  return out;
}
function overrideReleaseCard(){
  if(typeof releaseCard!=='function') return false;
  const fn=function(x){
    const kindRaw=String(x?.release_kind||x?.type||'').toLowerCase();
    const kind=kindRaw.includes('costume')?'costume':(kindRaw.includes('character')||kindRaw.includes('personnage'))?'character':'style';
    const badge=kind==='costume'?'assets/home/icons/release_costume.png':kind==='character'?'assets/home/icons/release_character.png':'assets/home/icons/release_style.png';
    const label=releaseKindLabel(kind);
    const target=customReleaseTarget(x);
    const c=(typeof characters!=='undefined'&&characters.find(v=>String(v.id)===String(target.charId)))||null;
    const st=(typeof styles!=='undefined'&&styles?.[target.styleId])||null;
    const theme=String(x?.theme||({technical:'purple',speed:'cyan',rapid:'cyan',assault:'yellow',strike:'red',attack:'red',support:'green'}[(st?.role||'').toLowerCase()]||'red'));
    const rawTitle=String(x?.title||'');
    const title=c?.name&&(!rawTitle||isGenericName(rawTitle))?c.name:patchLabel(rawTitle);
    const rawSub=String((currentLang()==='fr'?(x?.subtitle_fr||x?.subtitle):(x?.subtitle_en||x?.subtitle))||'');
    let subtitle=label;
    if(kind==='character'&&rawSub&&norm(rawSub)!=='personnage_jouable'&&norm(rawSub)!=='playable_character') subtitle=patchLabel(rawSub);
    const art=st?.portrait||c?.portrait||x?.art||x?.character_art||x?.image||x?.banner||'';
    return `<button type="button" class="releaseCardV299 releaseReframedV304 theme-${esc(theme)}" data-release-char="${esc(target.charId||'')}" data-release-style="${esc(target.styleId||'')}" onclick="openHomeReleaseV298(this)" aria-label="${esc(title)} — ${esc(subtitle||label)}" title="${esc(title)} — ${esc(subtitle||label)}"><span class="releaseDotsV299"></span><span class="releaseBadgeV299 ${kind==='costume'?'costume':kind==='character'?'character':'style'}">${typeof img==='function'?img(badge,label):''}</span><span class="releasePromoNewV304" aria-hidden="true"></span><span class="releasePersonWrapV299">${typeof img==='function'?img(art,title,'releasePersonV299 releasePersonHeroV304'):''}</span><span class="releaseSlashV299"></span><span class="releaseNamesV299"><b>${esc(title)}</b><small>${esc(subtitle||label)}</small></span></button>`;
  };
  window.releaseCard=releaseCard=fn;
  return true;
}
if(overrideReleaseCard() && typeof page!=='undefined' && page==='home' && typeof render==='function'){
  try{window.__keepScroll=true; render();}catch(_e){}
}
})();

/* ========================================================================== */
/* MHUR Nexus — Season 18 hard fix v6                                        */
/* This block is deliberately last: it replaces the fragile v5 overrides.    */
/* ========================================================================== */
(function(){
'use strict';

const v6Lang=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const v6Pick=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[v6Lang()]??v.fr??v.en??''):v;
const v6Esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const v6Cjk=/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;
const v6Clean=v=>String(v6Pick(v)??'')
  .replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'')
  .replace(v6Cjk,'').replace(/\s{2,}/g,' ').trim();
const v6Norm=v=>String(v6Clean(v)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const v6Badge=()=>'<span class="s18NewBadge s18NewBadgeV6" aria-label="Nouveau">NEW!</span>';

function v6Exact(){
  if(window.__mhurExactV6)return window.__mhurExactV6;
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el)return null;
  try{window.__mhurExactV6=JSON.parse(el.textContent||'{}');}catch(_e){window.__mhurExactV6=null;}
  return window.__mhurExactV6;
}
function v6RoleKey(v){
  return ({attack:'attack',strike:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[v6Norm(v)]||'technical';
}
function v6RoleText(v){
  const key=v6RoleKey(v);
  const fr={attack:'Attaque',assault:'Assaut',technical:'Technique',support:'Soutien',rapid:'Vitesse'};
  const en={attack:'Strike',assault:'Assault',technical:'Technical',support:'Support',rapid:'Rapid'};
  return (v6Lang()==='fr'?fr:en)[key]||v6Clean(v);
}
function v6SideText(v){
  const villain=v6Norm(v)==='villain';
  return v6Lang()==='fr'?(villain?'SUPER-VILAINS':'HÉROS'):(villain?'SUPER-VILLAINS':'HEROES');
}
function v6ExactStyleKeyFromUrl(url){
  const exact=v6Exact()?.exact_by_style||{};
  const raw=String(url||'').replace(/\/$/,'');
  if(!raw)return '';
  return Object.keys(exact).find(key=>String(exact[key]?.source_url||'').replace(/\/$/,'')===raw)||'';
}
function v6CharacterForStyle(styleId){
  if(typeof characters==='undefined')return null;
  return (characters||[]).find(ch=>(ch.styles||[]).map(String).includes(String(styleId)))||null;
}
function v6ResolveRelease(x){
  const source=String(x?.source_url||x?.url||'');
  let styleId=String(x?.style_id||'');
  if(!styleId)styleId=v6ExactStyleKeyFromUrl(source);
  let charId=String(x?.character_id||x?.char_id||'');
  let ch=charId&&typeof characters!=='undefined'?(characters||[]).find(c=>String(c.id)===charId):null;
  if(!ch&&styleId)ch=v6CharacterForStyle(styleId);
  if(!ch&&typeof characters!=='undefined'){
    const title=v6Norm(x?.title||'');
    ch=(characters||[]).find(c=>v6Norm(c.name)===title)||null;
  }
  if(ch&&!charId)charId=String(ch.id);
  if(ch&&!styleId){
    const sourceKey=v6ExactStyleKeyFromUrl(source);
    if(sourceKey)styleId=sourceKey;
    else{
      const subtitle=v6Norm(x?.subtitle_fr||x?.subtitle_en||x?.subtitle||'');
      styleId=(ch.styles||[]).find(id=>v6Norm(styles?.[id]?.name)===subtitle)||String((ch.styles||[])[0]||'');
    }
  }
  const st=styleId&&typeof styles!=='undefined'?styles[styleId]:null;
  return {charId,styleId,ch,st,source};
}
function v6NewSets(){
  const sync=window.MHUR_SEASON18_DATA?.new_content||{};
  const chars=new Set((sync.characters||[]).map(String));
  const styleSet=new Set((sync.styles||[]).map(String));
  const costumes=new Set((sync.costumes||[]).map(String));
  const releases=window.MHUR_HOME_DATA?.latest_releases||[];
  releases.forEach(x=>{
    const r=v6ResolveRelease(x);
    const kind=v6Norm(x?.release_kind||x?.type||'');
    if(kind.includes('character')||kind.includes('personnage')){if(r.charId)chars.add(r.charId);}
    else if(kind.includes('style')||kind.includes('alter')||kind.includes('quirk')){if(r.styleId)styleSet.add(r.styleId);}
  });
  return {chars,styles:styleSet,costumes};
}
function v6DedupeStyleIds(ch){
  if(!ch||typeof styles==='undefined')return [];
  const ids=[];const signatures=new Set();
  for(const raw of (ch.styles||[])){
    const id=String(raw),st=styles[id];
    if(!st||ids.includes(id))continue;
    const sig=[v6Norm(st.name||'Original'),v6RoleKey(st.role),v6Norm(st.portrait||'')].join('|');
    if(signatures.has(sig))continue;
    signatures.add(sig);ids.push(id);
  }
  return ids;
}
function v6DeduplicateAll(){
  if(typeof characters==='undefined')return;
  (characters||[]).forEach(ch=>{ch.styles=v6DedupeStyleIds(ch)});
}

/* ---------------- Gentle Criminal: one style and complete old-style data --- */
function v6Table(titleFr,titleEn,columns,rows){
  const keep=[];
  (columns||[]).forEach((c,i)=>{if(v6Norm(c)!=='down_power')keep.push(i)});
  const frNames={level:'Niveau',type:'Type',damage:'Dégâts',ammo:'Munitions',use_ammo:'Consommation',reload:'Recharge',level_up_effect:'Effet de montée',guard_break:'Brise-garde',duration:'Durée',range:'Portée'};
  const enNames={level:'Level',type:'Type',damage:'Damage',ammo:'Ammo',use_ammo:'Use Ammo',reload:'Reload',level_up_effect:'Level Up Effect',guard_break:'Guard Break',duration:'Duration',range:'Range'};
  const translate=(c,l)=>((l==='fr'?frNames:enNames)[v6Norm(c)]||v6Clean(c));
  const filtered=(rows||[]).map(row=>keep.map(i=>v6Clean((row||[])[i]??''))).filter(row=>row.some(Boolean));
  if(!keep.length||!filtered.length)return null;
  return {title:{fr:titleFr,en:titleEn},cols:{fr:keep.map(i=>translate(columns[i],'fr')),en:keep.map(i=>translate(columns[i],'en'))},rows:filtered};
}
function v6MeaningfulDescription(value,name){
  const txt=v6Clean(value),nm=v6Clean(name);
  return txt&&txt.length>8&&v6Norm(txt)!==v6Norm(nm);
}
function v6PatchGentle(){
  if(typeof styles==='undefined'||typeof characters==='undefined')return;
  const exact=v6Exact();
  let styleId='';let row=null;
  for(const [key,value] of Object.entries(exact?.exact_by_style||{})){
    if(v6Norm(value?.base_name||value?.name).includes('gentle_criminal')&&Number(value?.variant_index||0)===0){styleId=key;row=value;break;}
  }
  if(!styleId)styleId=Object.keys(styles).find(k=>/gentle[_-]?criminal/i.test(k))||'';
  const ch=(characters||[]).find(c=>v6Norm(c.name).includes('gentle_criminal')||v6Norm(c.id).includes('gentle_criminal')||(c.styles||[]).map(String).includes(styleId));
  if(!ch||!styleId||!styles[styleId])return;
  const st=styles[styleId];
  ch.name='Gentle Criminal';ch.side='villain';
  const otherDistinct=v6DedupeStyleIds(ch).filter(id=>id!==styleId&&v6Norm(styles[id]?.name)!=='original');
  ch.styles=[styleId,...otherDistinct];
  st.role='technical';st.name={fr:'Original',en:'Original'};st.pv=String(row?.stats?.['Max Main Health']||row?.stats?.['Max Health']||row?.stats?.HP||st.pv||300);
  if(row?.assets?.portrait)st.portrait=row.assets.portrait;
  ch.portrait=st.portrait;
  st.description={
    fr:"Un hors-la-loi des temps modernes qui entrera dans l'Histoire ! Son Alter Élasticité lui permet de virevolter dans les airs en narguant ses ennemis avec panache !",
    en:'A modern-day outlaw destined to go down in history. His Elasticity Quirk lets him dance through the air while styling on his enemies.'
  };
  st.roleDesc={
    fr:"Augmente la vitesse de rechargement de toute l'équipe. Plus il y a de membres avec le même rôle, plus l'effet est amplifié.",
    en:'Raises the reload speed of the whole team. The more allies with the same role, the stronger the effect.'
  };
  const sp=row?.special_action||{};
  const spTable=v6Table('Valeurs de l’action spéciale','Special Action Values',sp.values?.columns||[],sp.values?.rows||[]);
  st.special={
    name:{fr:'Gently Trampoline / Mode Lover',en:'Gently Trampoline / Mode Lover'},
    img:row?.assets?.special||st.special?.img||st.portrait,
    desc:{
      fr:"Déploie un point d'élasticité qui fait rebondir Gentle Criminal, ses alliés et les ennemis. Il peut ainsi se repositionner rapidement ou perturber une attaque.",
      en:'Deploys an elasticity point that bounces Gentle Criminal, allies, and enemies, allowing quick repositioning or disruption.'
    },
    tables:spTable?[spTable]:[]
  };
  const letters=['α','β','γ'];
  const fallback={
    'α':{fr:"Tire une flèche d'air comprimé qui crée une onde de choc à l'impact avant de poursuivre sa trajectoire.",en:'Fires a compressed-air arrow that creates a shockwave on impact before continuing forward.'},
    'β':{fr:"Crée une surface élastique qui permet de rebondir, de contrôler l'espace et de repousser les ennemis.",en:'Creates an elastic surface used to bounce, control space, and repel enemies.'},
    'γ':{fr:"Se propulse grâce à son Alter pour conserver l'avantage aérien et surprendre sa cible.",en:'Launches himself with Elasticity to maintain aerial advantage and surprise the target.'}
  };
  const oldSkills=Array.isArray(st.skills)?st.skills:[];
  st.skills=letters.map((letter,index)=>{
    const raw=row?.skills?.[letter]||{};
    const old=oldSkills.find(s=>s.letter===letter)||oldSkills[index]||{};
    const tables=[];
    const level=v6Table(`Effets de montée ${letter}`,`${letter} Level Up Effects`,raw.level_up_effects?.columns||[],raw.level_up_effects?.rows||[]);if(level)tables.push(level);
    const base=v6Table(`Valeurs de base ${letter}`,`${letter} Base Values`,raw.base_values?.columns||[],raw.base_values?.rows||[]);if(base)tables.push(base);
    const add=v6Table(`Valeurs détaillées ${letter}`,`${letter} Detailed Values`,raw.additional_values?.columns||[],raw.additional_values?.rows||[]);if(add)tables.push(add);
    const imgKey=letter==='α'?'alpha':letter==='β'?'beta':'gamma';
    const officialDesc=v6MeaningfulDescription(raw.description,raw.name)?v6Clean(raw.description):'';
    return {
      letter,
      name:v6Clean(raw.name)||v6Clean(old.name)||({α:'Gently Arrow',β:'Gently Trampoline',γ:'Gently Rebound'}[letter]),
      img:row?.assets?.[imgKey]||old.img||st.portrait,
      desc:{fr:fallback[letter].fr,en:officialDesc||fallback[letter].en},
      tables:tables.length?tables:(old.tables||[])
    };
  });
}

/* ---------------- Cards and NEW badges ------------------------------------- */
function v6Card(c,mode='characters'){
  const sets=v6NewSets();
  const styleIds=v6DedupeStyleIds(c);
  const first=styleIds[0],role=v6RoleKey(styles?.[first]?.role);
  const modeClass=mode==='costumes'?' costumeMode':mode==='builds'?' buildMode':mode==='tunings'?' tuningMode':' characterMode';
  const tag=mode==='costumes'?`<div class="cardModeTag">${tr('costumeTag')}</div>`:mode==='builds'?`<div class="cardModeTag">${tr('buildTag')}</div>`:mode==='tunings'?'<div class="cardModeTag">T.U.N.I.N.G</div>':'<div class="cardModeTag">PERSONNAGE</div>';
  const message=mode==='costumes'?tr('costumeChoose'):mode==='builds'?tr('buildChoose'):mode==='tunings'?tr('tuningChoose'):tr('choose');
  const roles=[];const seen=new Set();
  styleIds.forEach(id=>{const r=v6RoleKey(styles[id]?.role);if(!seen.has(r)){seen.add(r);roles.push(styles[id]?.role)}});
  const portrait=styles?.[first]?.portrait||c.portrait||'';
  return `<button class="card${modeClass} s18RoleCard role-${role}" data-char="${v6Esc(c.id)}" onclick="selectChar('${String(c.id).replace(/'/g,"\\'")}')">${sets.chars.has(String(c.id))?v6Badge():''}${tag}<div class="thumb">${asset(portrait,c.name)}</div><div class="cardBody"><h3>${v6Esc(c.name)}</h3><div class="badges">${sideBadge(c.side)}${roles.map(r=>roleBadge(r)).join('')}</div><p style="color:#c9d7ee">${v6Esc(message)}</p></div></button>`;
}
function v6StylePicker(){
  const sets=v6NewSets();
  const c=(characters||[]).find(x=>x.id===selectedChar);if(!c)return '';
  const ids=v6DedupeStyleIds(c);c.styles=ids;
  return `<button class="back" onclick="selectedChar=null;render()">← ${tr('back')}</button><h1 class="title">${v6Esc(c.name)}</h1><div class="styleGrid">${ids.map(id=>{const st=styles[id],role=v6RoleKey(st.role);return `<button class="styleCard s18StyleCard role-${role}" data-style="${v6Esc(id)}" onclick="selectStyle('${String(id).replace(/'/g,"\\'")}')">${sets.styles.has(String(id))?v6Badge():''}<div class="styleBanner">${asset(st.portrait,`${c.name} ${v6Clean(st.name)}`)}</div><div class="styleInfo"><h2>${v6Esc(v6Clean(st.name)||'Original')}</h2><div class="badges">${sideBadge(c.side)}${roleBadge(st.role)}</div></div></button>`}).join('')}</div>`;
}
const v6BaseCostumeCard=typeof costumeCard==='function'?costumeCard:null;
function v6CostumeCard(ct){
  if(!v6BaseCostumeCard)return '';
  let html=String(v6BaseCostumeCard(ct)||'');
  const id=String(ct?.urId??ct?.ur_id??String(ct?.id||'').replace(/^ur_/,''));
  if(v6NewSets().costumes.has(id)&&!html.includes('s18NewBadge'))html=html.replace(/^(<button\b[^>]*>|<div\b[^>]*class="[^"]*(?:costume|slot)[^"]*"[^>]*>)/i,`$1${v6Badge()}`);
  return html;
}

/* ---------------- Patch modal: safe, grouped, localized and correctly toned */
function v6PatchFr(value){
  let out=v6Clean(value);
  if(v6Lang()==='en')return typeof patchText==='function'?patchText(out):out;
  const exact={
    'Damage':'Dégâts','Damages':'Dégâts','Guard Break':'Brise-garde','Cooldown':'Recharge','Reload':'Recharge','Ammo':'Munitions','Use Ammo':'Consommation','Consumption':'Consommation','Special Action':'Action spéciale','Health':'PV','Maximum HP':'PV maximum','Adjustment':'Ajustement','Before':'Avant','After':'Après','No changes detected.':'Aucun changement détecté.'
  };
  if(exact[out])return exact[out];
  return out
    .replace(/^Balance Changes:\s*/i,"Changements d'équilibrage : ")
    .replace(/Damage/gi,'Dégâts').replace(/Guard Break/gi,'Brise-garde')
    .replace(/Cooldown/gi,'Recharge').replace(/Reload/gi,'Recharge')
    .replace(/Ammo/gi,'Munitions').replace(/Use Ammo/gi,'Consommation')
    .replace(/Special Action/gi,'Action spéciale').replace(/Maximum HP/gi,'PV maximum')
    .replace(/No changes detected\.?/gi,'Aucun changement détecté.');
}
function v6PatchTone(change){
  const tone=v6Norm(change?.tone||change?.type||'');
  if(/buff|increase|improve|up/.test(tone))return 'buff';
  if(/nerf|decrease|reduce|down/.test(tone))return 'nerf';
  return 'adjust';
}
function v6ToneLabel(tone){return tone==='buff'?'BUFF':tone==='nerf'?'NERF':(v6Lang()==='fr'?'NEUTRE':'NEUTRAL')}
function v6StyleForChange(change){
  if(typeof characters==='undefined'||typeof styles==='undefined')return {ch:null,id:'',st:null};
  const ch=(characters||[]).find(c=>v6Norm(c.name)===v6Norm(change?.character)||v6Norm(c.id)===v6Norm(change?.character));
  if(!ch)return {ch:null,id:'',st:null};
  const ids=v6DedupeStyleIds(ch);
  const styleName=v6Norm(change?.style||'Original');
  let id=ids.find(x=>v6Norm(styles[x]?.name||'Original')===styleName)||'';
  if(!id){
    const skillName=v6Norm(change?.skill_name||'');
    id=ids.find(x=>{
      const st=styles[x];
      const all=[st?.special,...(st?.skills||[])].filter(Boolean);
      return all.some(sk=>skillName&&((v6Norm(sk.name)&&skillName.includes(v6Norm(sk.name)))||skillName.startsWith(v6Norm(sk.letter))));
    })||'';
  }
  if(!id)id=ids[0]||'';
  return {ch,id,st:styles[id]||null};
}
function v6SkillForChange(st,change){
  if(!st)return null;
  const raw=v6Norm(change?.skill_name||change?.label||'');
  const all=[{...st.special,letter:'SP'},...(st.skills||[])].filter(Boolean);
  let hit=all.find(sk=>{
    const name=v6Norm(sk.name),letter=v6Norm(sk.letter);
    return (name&&raw.includes(name))||(letter&&raw.startsWith(letter));
  });
  if(!hit){
    const first=String(change?.skill_name||'').trim().charAt(0);
    hit=all.find(sk=>String(sk.letter||'')===first)||null;
  }
  return hit||null;
}
function v6PatchValue(change,tone){
  const before=Array.isArray(change?.before)?change.before:[change?.before];
  const after=Array.isArray(change?.after)?change.after:[change?.after];
  const count=Math.max(before.length,after.length);
  if(count>1){
    return `<div class="s18PatchTableWrapV6"><table class="s18PatchTableV6"><thead><tr><th></th>${Array.from({length:count},(_,i)=>`<th>Lv.${i+1}</th>`).join('')}</tr></thead><tbody><tr class="before"><th>${v6Lang()==='fr'?'Avant':'Before'}</th>${Array.from({length:count},(_,i)=>`<td>${v6Esc(v6Clean(before[i]??''))}</td>`).join('')}</tr><tr class="after ${tone}"><th>${v6Lang()==='fr'?'Après':'After'}</th>${Array.from({length:count},(_,i)=>`<td>${v6Esc(v6Clean(after[i]??''))}</td>`).join('')}</tr></tbody></table></div>`;
  }
  if(change?.before!=null||change?.after!=null)return `<div class="s18PatchRow"><span class="s18PatchBefore">${v6Esc(v6Clean(before[0]??'—'))}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter ${tone}">${v6Esc(v6Clean(after[0]??'—'))}</span></div>`;
  return '';
}
function v6PatchGroups(section){
  const groups=[];const map=new Map();
  (section?.changes||[]).forEach(change=>{
    const info=v6StyleForChange(change);const id=info.id||v6Norm(change?.style||'Original');
    const key=`${v6Norm(change?.character)}__${id}`;
    if(!map.has(key)){
      const group={key,ch:info.ch,id,st:info.st,character:info.ch?.name||v6Clean(change?.character),style:v6Clean(info.st?.name||change?.style||'Original'),changes:[]};
      map.set(key,group);groups.push(group);
    }
    map.get(key).changes.push(change);
  });
  return groups;
}
function v6PatchGroupCard(group){
  const st=group.st||{};const ch=group.ch||{};const role=v6RoleKey(st.role||'technical');
  return `<article class="s18PatchGroupCard role-${role}"><header class="s18PatchHeader"><div class="s18PatchPortrait">${st.portrait?asset(st.portrait,group.character):''}</div><div class="s18PatchMeta"><h4>${v6Esc(group.character)}</h4><div class="s18PatchStyle">${v6Esc(group.style)}</div><div class="s18PatchBadges"><span class="badge ${ch.side==='villain'?'villain':'hero'}">${v6Esc(v6SideText(ch.side))}</span><span class="badge ${role}">${v6Esc(v6RoleText(role))}</span></div></div></header><div class="s18PatchGroupBody">${group.changes.map(change=>{
    const tone=v6PatchTone(change),skill=v6SkillForChange(st,change),skillName=v6Clean(skill?.name||change?.skill_name||change?.label||'Ajustement');
    const image=skill?.img||change?.skill_image||'';
    const bullets=(change?.bullets||[]).map(v6PatchFr).filter(x=>x&&!/aucun changement détecté/i.test(x));
    return `<section class="s18PatchSkillBlock ${tone}"><div class="s18PatchTone ${tone}">${v6ToneLabel(tone)}</div><div class="s18PatchSkill">${image?`<div class="s18PatchSkillImg">${asset(image,skillName)}</div>`:''}<div class="s18PatchSkillMeta"><h5>${v6Esc(skillName)}</h5>${change?.label?`<div class="s18PatchLabel">${v6Esc(v6PatchFr(change.label))}</div>`:''}${v6PatchValue(change,tone)}${bullets.length?`<ul class="s18PatchBullets">${bullets.map(x=>`<li>${v6Esc(x)}</li>`).join('')}</ul>`:''}</div></div></section>`;
  }).join('')}</div></article>`;
}
function v6OpenPatch(index){
  try{
    const note=(window.MHUR_HOME_DATA?.patch_notes||[])[index];if(!note)return;
    let modal=document.getElementById('patchModalV296');
    if(!modal){
      modal=document.createElement('div');modal.id='patchModalV296';modal.className='modalV296';
      modal.innerHTML='<div class="modalPanelV296 patchPanelV296"><header><h2></h2><button type="button" class="v6PatchClose">×</button></header><div class="modalBodyV296"></div></div>';
      document.body.appendChild(modal);
      modal.querySelector('.v6PatchClose').addEventListener('click',()=>{modal.classList.remove('open');document.body.classList.remove('homeModalOpenV296')});
      modal.addEventListener('click',e=>{if(e.target===modal){modal.classList.remove('open');document.body.classList.remove('homeModalOpenV296')}});
    }
    modal.querySelector('header h2').textContent=v6PatchFr(note.title);
    const details=(note.details||[]).filter(sec=>(sec.changes||[]).some(c=>!/^no changes detected\.?$/i.test(v6Clean(c?.text||c?.note||''))));
    let html=`<div class="patchDateV296">${new Intl.DateTimeFormat(v6Lang()==='fr'?'fr-FR':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(note.date))}</div><div class="legendV296"><span class="buff">BUFF</span><span class="nerf">NERF</span><span class="adjust">${v6Lang()==='fr'?'NEUTRE':'NEUTRAL'}</span></div>`;
    if(details.length){
      html+=details.map(sec=>`<section class="detailSectionV296 ${v6Esc(sec.accent||'')}"><h3>${v6Esc(v6PatchFr(sec.title))}</h3>${sec.note?`<p class="patchNoteV296">${v6Esc(v6PatchFr(sec.note))}</p>`:''}<div class="s18PatchGroupGrid">${v6PatchGroups(sec).map(v6PatchGroupCard).join('')}</div></section>`).join('');
    }else if((note.rich_blocks||[]).length){
      html+=`<article class="richPatchV303">${note.rich_blocks.map(block=>block.type==='heading'?`<h3 class="richPatchHeadingV303">${v6Esc(v6PatchFr(block.text))}</h3>`:block.type==='image'?`<figure class="richPatchImageV303">${asset(block.src,block.alt||'Illustration')}</figure>`:`<p class="richPatchTextV303">${v6Esc(v6PatchFr(block.text))}</p>`).join('')}</article>`;
    }else html+=`<div class="emptyV296">${v6Lang()==='fr'?'Aucun détail disponible.':'No details available.'}</div>`;
    modal.querySelector('.modalBodyV296').innerHTML=html;
    modal.classList.add('open');document.body.classList.add('homeModalOpenV296');
  }catch(error){console.error('[MHUR V6 PATCH]',error);}
}

/* ---------------- Latest releases: correct new portrait, large and centred -- */
function v6ReleaseCard(x){
  const r=v6ResolveRelease(x);const kindRaw=v6Norm(x?.release_kind||x?.type||'');
  const kind=kindRaw.includes('character')||kindRaw.includes('personnage')?'character':kindRaw.includes('costume')?'costume':'style';
  const icon=kind==='character'?'assets/home/icons/release_character.png':kind==='costume'?'assets/home/icons/release_costume.png':'assets/home/icons/release_style.png';
  const label=kind==='character'?(v6Lang()==='fr'?'Personnage jouable':'Playable character'):kind==='costume'?(v6Lang()==='fr'?'Nouveau costume':'New costume'):(v6Lang()==='fr'?'Nouveau style':'New style');
  const title=r.ch?.name||(!/^Character\s*\d+/i.test(String(x?.title||''))?v6PatchFr(x?.title):'')||'My Hero Ultra Rumble';
  const subtitle=kind==='style'?v6Clean(r.st?.name||x?.subtitle||label):label;
  const art=r.st?.portrait||r.ch?.portrait||x?.art||x?.image||x?.banner||'';
  const role=v6RoleKey(r.st?.role||'technical');
  return `<button type="button" class="releaseCardV299 releaseV6 role-${role}" data-release-char="${v6Esc(r.charId)}" data-release-style="${v6Esc(r.styleId)}" onclick="openHomeReleaseV298(this)" title="${v6Esc(title)} — ${v6Esc(subtitle)}"><span class="releaseDotsV299"></span><span class="releaseBadgeV299 ${kind}">${img(icon,label)}</span><span class="releaseNewImageV6"></span><span class="releasePortraitV6">${img(art,title)}</span><span class="releaseSlashV299"></span><span class="releaseNamesV299"><b>${v6Esc(title)}</b><small>${v6Esc(subtitle)}</small></span></button>`;
}

function v6Install(){
  v6PatchGentle();v6DeduplicateAll();
  if(typeof card==='function'){window.card=v6Card;try{card=v6Card}catch(_e){}}
  if(typeof stylePicker==='function'){window.stylePicker=v6StylePicker;try{stylePicker=v6StylePicker}catch(_e){}}
  if(v6BaseCostumeCard){window.costumeCard=v6CostumeCard;try{costumeCard=v6CostumeCard}catch(_e){}}
  window.openPatchNoteV296=v6OpenPatch;
  if(typeof releaseCard==='function'){window.releaseCard=v6ReleaseCard;try{releaseCard=v6ReleaseCard}catch(_e){}}
}
v6Install();
setTimeout(()=>{
  try{
    v6PatchGentle();v6DeduplicateAll();
    if(typeof render==='function'){window.__keepScroll=true;render()}
  }catch(error){console.error('[MHUR V6 INIT]',error)}
},0);
window.addEventListener('mhur:languagechange',()=>{try{v6Install();if(typeof render==='function')render()}catch(_e){}});
})();
/* ========================================================================== */
/* MHUR Nexus — Season 18 emergency hotfix v7                                */
/* This block stays last and patches the DOM after render for maximum safety. */
/* ========================================================================== */
(function(){
'use strict';

const LANG=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const PICK=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[LANG()]??v.fr??v.en??''):v;
const CJK=/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CLEAN=v=>String(PICK(v)??'').replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'').replace(CJK,'').replace(/\s{2,}/g,' ').trim();
const NORM=v=>String(CLEAN(v)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const NEW_HTML='<span class="s18NewBadge s18NewBadgeV7" aria-label="NEW">NEW!</span>';

function EX(){
  if(window.__mhurExactV7!==undefined) return window.__mhurExactV7;
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el) return window.__mhurExactV7=null;
  try{ window.__mhurExactV7=JSON.parse(el.textContent||'{}'); }
  catch(_e){ window.__mhurExactV7=null; }
  return window.__mhurExactV7;
}
function roleKey(v){
  return ({attack:'attack',strike:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[NORM(v)]||'technical';
}
function roleText(v){
  const key=roleKey(v);
  const fr={attack:'Attaque',assault:'Assaut',technical:'Technique',support:'Soutien',rapid:'Vitesse'};
  const en={attack:'Strike',assault:'Assault',technical:'Technical',support:'Support',rapid:'Rapid'};
  return (LANG()==='fr'?fr:en)[key]||CLEAN(v);
}
function sideText(v){
  const villain=NORM(v)==='villain';
  return LANG()==='fr'?(villain?'SUPER-VILAINS':'HÉROS'):(villain?'SUPER-VILLAINS':'HEROES');
}
function patchFr(v){
  let out=CLEAN(v);
  if(LANG()==='en') return out;
  const pairs=[
    [/^Data Update/i,'Mise à jour des données'],[/^Balance Changes:\s*/i,"Changements d'équilibrage : "],
    [/Damage/gi,'Dégâts'],[/Guard Break/gi,'Brise-garde'],[/Reload/gi,'Recharge'],[/Cooldown/gi,'Recharge'],
    [/Use Ammo/gi,'Consommation'],[/Ammo/gi,'Munitions'],[/Health/gi,'PV'],[/Maximum HP|Max HP/gi,'PV maximum'],
    [/Special Action/gi,'Action spéciale'],[/Quirk Skill/gi,'Alter'],[/Before/gi,'Avant'],[/After/gi,'Après'],
    [/Original/gi,'Original'],[/No changes detected\.?/gi,'Aucun changement détecté.']
  ];
  pairs.forEach(([a,b])=>{ out=out.replace(a,b); });
  return out;
}
function newSets(){
  const sync=window.MHUR_SEASON18_DATA?.new_content||{};
  const chars=new Set((sync.characters||[]).map(String));
  const stylesSet=new Set((sync.styles||[]).map(String));
  const costumes=new Set((sync.costumes||[]).map(String));
  return {chars,styles:stylesSet,costumes};
}
function dedupeStyleIds(ch){
  if(!ch||typeof styles==='undefined') return [];
  const keep=[]; const seenId=new Set(); const seenSig=new Set();
  (Array.isArray(ch.styles)?ch.styles:[]).forEach(raw=>{
    const id=String(raw); if(!id||seenId.has(id)||!styles[id]) return;
    seenId.add(id);
    const st=styles[id];
    const sig=[NORM(st.name||'Original'),roleKey(st.role),NORM(st.portrait||'')].join('|');
    if(seenSig.has(sig)) return;
    seenSig.add(sig); keep.push(id);
  });
  return keep;
}
function dedupeAll(){
  if(typeof characters==='undefined'||!Array.isArray(characters)) return;
  characters.forEach(ch=>{ ch.styles=dedupeStyleIds(ch); });
}
function tableClean(columns, rows, titleFr, titleEn){
  const cols=Array.isArray(columns)?columns:[];
  const keep=[];
  cols.forEach((c,i)=>{ if(NORM(c)!=='down_power') keep.push(i); });
  if(!keep.length||!Array.isArray(rows)||!rows.length) return null;
  const dictFr={level:'Niveau',type:'Type',damage:'Dégâts',ammo:'Munitions',use_ammo:'Consommation',reload:'Recharge',guard_break:'Brise-garde',health:'PV',hp:'PV'};
  const dictEn={level:'Level',type:'Type',damage:'Damage',ammo:'Ammo',use_ammo:'Use Ammo',reload:'Reload',guard_break:'Guard Break',health:'HP',hp:'HP'};
  const mapHead=(c,l)=>((l==='fr'?dictFr:dictEn)[NORM(c)]||CLEAN(c));
  const outRows=rows.map(r=>keep.map(i=>CLEAN((r||[])[i]??''))).filter(r=>r.some(Boolean));
  if(!outRows.length) return null;
  return {title:{fr:titleFr,en:titleEn}, cols:{fr:keep.map(i=>mapHead(cols[i],'fr')), en:keep.map(i=>mapHead(cols[i],'en'))}, rows:outRows};
}
function patchGentle(){
  if(typeof styles==='undefined'||typeof characters==='undefined') return;
  const exact=EX()?.exact_by_style||{};
  let styleId=''; let row=null;
  Object.keys(exact).some(key=>{
    const item=exact[key]||{};
    if(NORM(item.base_name||item.name).includes('gentle_criminal') && Number(item.variant_index||0)===0){ styleId=key; row=item; return true; }
    return false;
  });
  if(!styleId) styleId=Object.keys(styles).find(k=>/gentle[_-]?criminal/i.test(k))||'';
  if(!styleId||!styles[styleId]) return;
  const ch=(characters||[]).find(c=>(c.styles||[]).map(String).includes(String(styleId))||NORM(c.id).includes('gentle_criminal')||NORM(c.name).includes('gentle_criminal'));
  if(!ch) return;
  const st=styles[styleId];
  ch.name='Gentle Criminal'; ch.side='villain'; ch.styles=[styleId];
  st.role='technical'; st.name={fr:'Original',en:'Original'}; st.pv=String(row?.stats?.['Max Main Health']||row?.stats?.['Max Health']||st.pv||300);
  if(row?.assets?.portrait) st.portrait=row.assets.portrait;
  ch.portrait=st.portrait||ch.portrait;
  st.description={
    fr:"Un hors-la-loi des temps modernes qui entrera dans l'Histoire ! Son Alter Élasticité lui permet de virevolter dans les airs en narguant ses ennemis avec panache !",
    en:'A modern-day outlaw destined to go down in history. His Elasticity Quirk lets him dance through the air while styling on his enemies.'
  };
  st.roleDesc={
    fr:"Augmente la vitesse de rechargement de toute l'équipe. Plus il y a de membres avec le même rôle dans l'équipe, plus l'effet est amplifié.",
    en:'Raises the reload speed of the whole team. The more allies with the same role, the stronger the effect becomes.'
  };
  const sp=row?.special_action||{};
  st.special={
    name:{fr:'Gently Trampoline / Mode Lover',en:'Gently Trampoline / Mode Lover'},
    img:row?.assets?.special||st.special?.img||st.portrait,
    desc:{
      fr:"Déploie un point d'élasticité qui fait rebondir Gentle Criminal, ses alliés et les ennemis. Il peut ainsi se repositionner rapidement ou perturber une attaque.",
      en:'Deploys an elasticity point that bounces Gentle Criminal, allies, and enemies, letting him reposition quickly or disrupt attacks.'
    },
    tables:(()=>{ const t=tableClean(sp.values?.columns||[], sp.values?.rows||[], "Valeurs de l'action spéciale", 'Special Action Values'); return t?[t]:[]; })()
  };
  const defaults={
    'α':{name:'Gently Arrow',fr:"Tire une flèche d'air comprimé qui crée une onde de choc à l'impact avant de poursuivre sa trajectoire.",en:'Fires a compressed-air arrow that creates a shockwave on impact before continuing forward.'},
    'β':{name:'Gently Trampoline',fr:"Crée une surface élastique qui permet de rebondir, de contrôler l'espace et de repousser les ennemis.",en:'Creates an elastic surface used to bounce, control space, and repel enemies.'},
    'γ':{name:'Gently Rebound',fr:"Se propulse grâce à son Alter pour conserver l'avantage aérien et surprendre sa cible.",en:'Launches himself with Elasticity to keep aerial advantage and surprise the target.'}
  };
  const oldSkills=Array.isArray(st.skills)?st.skills:[];
  st.skills=['α','β','γ'].map((letter,idx)=>{
    const raw=row?.skills?.[letter]||{};
    const old=oldSkills.find(s=>String(s.letter)===letter)||oldSkills[idx]||{};
    const tables=[];
    [
      tableClean(raw.level_up_effects?.columns||[], raw.level_up_effects?.rows||[], `Effets de montée ${letter}`, `${letter} Level Up Effects`),
      tableClean(raw.base_values?.columns||[], raw.base_values?.rows||[], `Valeurs de base ${letter}`, `${letter} Base Values`),
      tableClean(raw.additional_values?.columns||[], raw.additional_values?.rows||[], `Valeurs détaillées ${letter}`, `${letter} Detailed Values`)
    ].forEach(t=>{ if(t) tables.push(t); });
    const key=letter==='α'?'alpha':letter==='β'?'beta':'gamma';
    return {letter,name:CLEAN(raw.name)||defaults[letter].name,img:row?.assets?.[key]||old.img||st.portrait,desc:{fr:defaults[letter].fr,en:defaults[letter].en},tables:tables.length?tables:(old.tables||[])};
  });
}
function styleInfoForChange(change){
  if(typeof characters==='undefined'||typeof styles==='undefined') return {ch:null,styleId:'',st:null};
  const charNorm=NORM(change?.character||'');
  const ch=(characters||[]).find(c=>NORM(c.name)===charNorm||NORM(c.id)===charNorm) || null;
  if(!ch) return {ch:null,styleId:'',st:null};
  const ids=dedupeStyleIds(ch);
  const wanted=NORM(change?.style||'Original');
  let styleId=ids.find(id=>NORM(styles[id]?.name||'Original')===wanted)||'';
  if(!styleId){
    const rawSkill=NORM(change?.skill_name||change?.label||'');
    styleId=ids.find(id=>{
      const st=styles[id];
      const all=[st?.special,...(st?.skills||[])].filter(Boolean);
      return all.some(sk=>{ const nm=NORM(sk.name), lt=NORM(sk.letter); return (nm&&rawSkill.includes(nm))||(lt&&rawSkill.startsWith(lt)); });
    })||'';
  }
  if(!styleId) styleId=ids[0]||'';
  return {ch,styleId,st:styles[styleId]||null};
}
function skillForChange(st, change){
  if(!st) return null;
  const raw=NORM(change?.skill_name||change?.label||'');
  const all=[{...(st.special||{}),letter:'SP'},...(st.skills||[])].filter(Boolean);
  let hit=all.find(sk=>{ const nm=NORM(sk.name), lt=NORM(sk.letter); return (nm&&raw.includes(nm))||(lt&&raw.startsWith(lt)); });
  if(!hit){ const first=String(change?.skill_name||'').trim().charAt(0); hit=all.find(sk=>String(sk.letter||'')===first)||null; }
  return hit||null;
}
function numericTone(change){
  const tone=NORM(change?.tone||change?.type||'');
  if(/buff|increase|improve|up/.test(tone)) return 'buff';
  if(/nerf|decrease|reduce|down/.test(tone)) return 'nerf';
  const before=(Array.isArray(change?.before)?change.before:[change?.before]).map(x=>parseFloat(String(x).replace(',', '.'))).filter(Number.isFinite);
  const after=(Array.isArray(change?.after)?change.after:[change?.after]).map(x=>parseFloat(String(x).replace(',', '.'))).filter(Number.isFinite);
  if(before.length&&after.length){
    const b=before.reduce((a,c)=>a+c,0)/before.length;
    const a=after.reduce((x,c)=>x+c,0)/after.length;
    if(a>b) return 'buff';
    if(a<b) return 'nerf';
  }
  return 'adjust';
}
function toneLabel(t){ return t==='buff'?'BUFF':t==='nerf'?'NERF':(LANG()==='fr'?'NEUTRE':'NEUTRAL'); }
function renderValue(change,tone){
  const before=Array.isArray(change?.before)?change.before:[change?.before];
  const after=Array.isArray(change?.after)?change.after:[change?.after];
  const count=Math.max(before.length,after.length);
  if(count>1){
    return `<div class="s18PatchTableWrapV7"><table class="s18PatchTableV7"><thead><tr><th></th>${Array.from({length:count},(_,i)=>`<th>Lv.${i+1}</th>`).join('')}</tr></thead><tbody><tr class="before"><th>${LANG()==='fr'?'Avant':'Before'}</th>${Array.from({length:count},(_,i)=>`<td>${ESC(CLEAN(before[i]??''))}</td>`).join('')}</tr><tr class="after ${tone}"><th>${LANG()==='fr'?'Après':'After'}</th>${Array.from({length:count},(_,i)=>`<td>${ESC(CLEAN(after[i]??''))}</td>`).join('')}</tr></tbody></table></div>`;
  }
  if(change?.before!=null||change?.after!=null){
    return `<div class="s18PatchRow"><span class="s18PatchBefore">${ESC(CLEAN(before[0]??'—'))}</span><span class="s18PatchArrow">→</span><span class="s18PatchAfter ${tone}">${ESC(CLEAN(after[0]??'—'))}</span></div>`;
  }
  return '';
}
function patchGroups(section){
  const groups=[]; const map=new Map();
  (section?.changes||[]).forEach(change=>{
    const txt=NORM(change?.text||change?.note||'');
    if(txt==='no_changes_detected' || txt==='no_changes_detected_') return;
    const info=styleInfoForChange(change);
    const key=`${NORM(change?.character)}__${info.styleId||NORM(change?.style||'Original')}`;
    if(!map.has(key)){
      const group={key,ch:info.ch,styleId:info.styleId,st:info.st,character:info.ch?.name||CLEAN(change?.character),style:CLEAN(info.st?.name||change?.style||'Original'),changes:[]};
      map.set(key,group); groups.push(group);
    }
    map.get(key).changes.push(change);
  });
  return groups;
}
function patchGroupCard(group){
  const st=group.st||{}; const ch=group.ch||{}; const role=roleKey(st.role||'technical');
  return `<article class="s18PatchGroupCard role-${role}"><header class="s18PatchHeader"><div class="s18PatchPortrait">${st.portrait&&typeof asset==='function'?asset(st.portrait,group.character):''}</div><div class="s18PatchMeta"><h4>${ESC(group.character)}</h4><div class="s18PatchStyle">${ESC(group.style)}</div><div class="s18PatchBadges"><span class="badge ${ch.side==='villain'?'villain':'hero'}">${ESC(sideText(ch.side))}</span><span class="badge ${role}">${ESC(roleText(role))}</span></div></div></header><div class="s18PatchGroupBody">${group.changes.map(change=>{ const tone=numericTone(change); const skill=skillForChange(st,change); const skillName=CLEAN(skill?.name||change?.skill_name||change?.label||(LANG()==='fr'?'Ajustement':'Adjustment')); const bullets=(change?.bullets||[]).map(patchFr).filter(Boolean); const imgSrc=skill?.img||change?.skill_image||''; return `<section class="s18PatchSkillBlock ${tone}"><div class="s18PatchTone ${tone}">${toneLabel(tone)}</div><div class="s18PatchSkill">${imgSrc&&typeof asset==='function'?`<div class="s18PatchSkillImg">${asset(imgSrc,skillName)}</div>`:''}<div class="s18PatchSkillMeta"><h5>${ESC(skillName)}</h5>${change?.label?`<div class="s18PatchLabel">${ESC(patchFr(change.label))}</div>`:''}${renderValue(change,tone)}${bullets.length?`<ul class="s18PatchBullets">${bullets.map(x=>`<li>${ESC(x)}</li>`).join('')}</ul>`:''}</div></div></section>`; }).join('')}</div></article>`;
}
function openPatch(index){
  try{
    const note=(window.MHUR_HOME_DATA?.patch_notes||[])[index]; if(!note) return;
    let modal=document.getElementById('patchModalV296');
    if(!modal){
      modal=document.createElement('div'); modal.id='patchModalV296'; modal.className='modalV296';
      modal.innerHTML='<div class="modalPanelV296 patchPanelV296"><header><h2></h2><button type="button" class="v7PatchClose">×</button></header><div class="modalBodyV296"></div></div>';
      document.body.appendChild(modal);
      modal.querySelector('.v7PatchClose').addEventListener('click',()=>{ modal.classList.remove('open'); document.body.classList.remove('homeModalOpenV296'); });
      modal.addEventListener('click',e=>{ if(e.target===modal){ modal.classList.remove('open'); document.body.classList.remove('homeModalOpenV296'); } });
    }
    modal.querySelector('header h2').textContent=patchFr(note.title);
    const sections=(note.details||[]).map(sec=>({...(sec||{}),changes:(sec?.changes||[]).filter(ch=>NORM(ch?.text||ch?.note||'')!=='no_changes_detected')})).filter(sec=>(sec.changes||[]).length);
    const date=new Date(note.date);
    let html=`<div class="patchDateV296">${Number.isNaN(date.getTime())?ESC(note.date||''):new Intl.DateTimeFormat(LANG()==='fr'?'fr-FR':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(date)}</div><div class="legendV296"><span class="buff">BUFF</span><span class="nerf">NERF</span><span class="adjust">${LANG()==='fr'?'NEUTRE':'NEUTRAL'}</span></div>`;
    if(sections.length){
      html+=sections.map(sec=>`<section class="detailSectionV296 ${ESC(sec.accent||'')}"><h3>${ESC(patchFr(sec.title))}</h3>${sec.note?`<p class="patchNoteV296">${ESC(patchFr(sec.note))}</p>`:''}<div class="s18PatchGroupGrid">${patchGroups(sec).map(patchGroupCard).join('')}</div></section>`).join('');
    }else if((note.rich_blocks||[]).length){
      html+=`<article class="richPatchV303">${(note.rich_blocks||[]).map(block=>block.type==='heading'?`<h3 class="richPatchHeadingV303">${ESC(patchFr(block.text))}</h3>`:block.type==='image'&&typeof asset==='function'?`<figure class="richPatchImageV303">${asset(block.src,block.alt||'Illustration')}</figure>`:`<p class="richPatchTextV303">${ESC(patchFr(block.text))}</p>`).join('')}</article>`;
    }else{
      html+=`<div class="emptyV296">${LANG()==='fr'?'Aucun détail disponible.':'No details available.'}</div>`;
    }
    modal.querySelector('.modalBodyV296').innerHTML=html;
    modal.classList.add('open'); document.body.classList.add('homeModalOpenV296');
  }catch(err){ console.error('[MHUR V7 PATCH]', err); }
}
function exactStyleKeyFromUrl(url){
  const exact=EX()?.exact_by_style||{}; const raw=String(url||'').replace(/\/$/,''); if(!raw) return '';
  return Object.keys(exact).find(key=>String(exact[key]?.source_url||'').replace(/\/$/,'')===raw)||'';
}
function characterForStyle(styleId){
  if(typeof characters==='undefined') return null;
  return (characters||[]).find(ch=>(ch.styles||[]).map(String).includes(String(styleId)))||null;
}
function resolveRelease(item){
  const source=String(item?.source_url||item?.url||'');
  let styleId=String(item?.style_id||'')||exactStyleKeyFromUrl(source);
  let charId=String(item?.character_id||item?.char_id||'');
  let ch=charId&&typeof characters!=='undefined'?(characters||[]).find(c=>String(c.id)===charId):null;
  if(!ch&&styleId) ch=characterForStyle(styleId);
  if(!ch&&typeof characters!=='undefined'){
    const title=NORM(item?.title||''); ch=(characters||[]).find(c=>NORM(c.name)===title)||null;
  }
  if(ch&&!charId) charId=String(ch.id);
  if(ch&&!styleId){
    const wanted=NORM(item?.subtitle_fr||item?.subtitle_en||item?.subtitle||'');
    styleId=dedupeStyleIds(ch).find(id=>NORM(styles?.[id]?.name||'Original')===wanted)||String(dedupeStyleIds(ch)[0]||'');
  }
  const st=styleId&&typeof styles!=='undefined'?styles[styleId]:null;
  const kindRaw=NORM(item?.release_kind||item?.type||'');
  const kind=kindRaw.includes('character')||kindRaw.includes('personnage')?'character':kindRaw.includes('costume')?'costume':'style';
  return {charId,styleId,ch,st,kind};
}
function badgeIcon(kind){
  return kind==='character'?'assets/home/icons/release_character.png':kind==='costume'?'assets/home/icons/release_costume.png':'assets/home/icons/release_style.png';
}
function releaseLabel(kind){
  return kind==='character'?(LANG()==='fr'?'Personnage jouable':'Playable character'):kind==='costume'?(LANG()==='fr'?'Nouveau costume':'New costume'):(LANG()==='fr'?'Nouveau style':'New style');
}
function releaseTitle(item,res){
  const raw=String(item?.title||'');
  if(res.ch?.name) return res.ch.name;
  if(/^character\s*\d+/i.test(raw)) return 'My Hero Ultra Rumble';
  return patchFr(raw)||'My Hero Ultra Rumble';
}
function releaseSubtitle(item,res){
  if(res.kind==='style') return CLEAN(res.st?.name||item?.subtitle||releaseLabel(res.kind));
  return releaseLabel(res.kind);
}
function releaseArt(item,res){
  return item?.image||item?.banner||item?.art||item?.character_art||res.st?.portrait||res.ch?.portrait||'';
}
function releaseGridHtml(){
  const items=window.MHUR_HOME_DATA?.latest_releases||[];
  return items.map(item=>{
    const res=resolveRelease(item); const title=releaseTitle(item,res); const subtitle=releaseSubtitle(item,res); const art=releaseArt(item,res); const role=roleKey(res.st?.role||'technical');
    return `<button type="button" class="releaseCardV299 releaseV7 role-${role}" data-release-char="${ESC(res.charId||'')}" data-release-style="${ESC(res.styleId||'')}" onclick="openHomeReleaseV298(this)" title="${ESC(title)} — ${ESC(subtitle)}"><span class="releaseV7Bg" style="background-image:url('${ESC(String(art).replace(/'/g,'%27'))}')"></span><span class="releaseV7Overlay"></span><span class="releaseBadgeV299 ${res.kind}">${typeof img==='function'?img(badgeIcon(res.kind),releaseLabel(res.kind)):''}</span><span class="releaseNewImageV7" aria-hidden="true"></span><span class="releaseNamesV299"><b>${ESC(title)}</b><small>${ESC(subtitle)}</small></span></button>`;
  }).join('') || `<div class="emptyV296">${LANG()==='fr'?'Aucune sortie.':'No releases.'}</div>`;
}
function patchHomeReleases(){
  const grid=document.querySelector('.releaseGridV296');
  if(!grid||grid.dataset.s18v7==='1') return;
  grid.innerHTML=releaseGridHtml();
  grid.dataset.s18v7='1';
}
function patchStyleGridDom(){
  const grid=document.querySelector('.styleGrid'); if(!grid) return;
  const seen=new Set();
  Array.from(grid.children).forEach(card=>{
    const key=[NORM(card.querySelector('h2')?.textContent||''),NORM(card.querySelector('.badges')?.textContent||'')].join('|');
    if(seen.has(key)) card.remove(); else seen.add(key);
  });
}
function patchNewBadgesDom(){
  const sets=newSets();
  document.querySelectorAll('.card[data-char]').forEach(card=>{ if(sets.chars.has(card.getAttribute('data-char')) && !card.querySelector('.s18NewBadge')) card.insertAdjacentHTML('afterbegin',NEW_HTML); });
  document.querySelectorAll('.styleCard[data-style]').forEach(card=>{ if(sets.styles.has(card.getAttribute('data-style')) && !card.querySelector('.s18NewBadge')) card.insertAdjacentHTML('afterbegin',NEW_HTML); });
  document.querySelectorAll('[data-costume-id],[data-costume],[data-id]').forEach(card=>{
    const id=card.getAttribute('data-costume-id')||card.getAttribute('data-costume')||String(card.getAttribute('data-id')||'').replace(/^ur_/,'');
    if(id && sets.costumes.has(String(id)) && !card.querySelector('.s18NewBadge') && /costume/i.test(card.className)) card.insertAdjacentHTML('afterbegin',NEW_HTML);
  });
}
function patchUiTextDom(){
  if(LANG()!=='fr') return;
  document.querySelectorAll('.latestPatchTagV303').forEach(el=>{ el.textContent='DERNIÈRE MISE À JOUR'; });
  document.querySelectorAll('.gachaViewV303').forEach(el=>{ el.textContent='DISPONIBLE'; });
  document.querySelectorAll('.homeTitleV296').forEach(el=>{ el.textContent=patchFr(el.textContent); });
}
function afterRender(){
  try{ patchGentle(); dedupeAll(); patchHomeReleases(); patchStyleGridDom(); patchNewBadgesDom(); patchUiTextDom(); }catch(err){ console.error('[MHUR V7 AFTER RENDER]', err); }
}
function wrapRender(){
  if(typeof window.render!=='function' || window.render.__s18v7) return;
  const old=window.render;
  const next=function(){ const out=old.apply(this,arguments); setTimeout(afterRender,0); return out; };
  next.__s18v7=true; window.render=next; try{ render=next; }catch(_e){}
}
function install(){
  patchGentle(); dedupeAll();
  window.openPatchNoteV296=openPatch;
  wrapRender();
  setTimeout(afterRender,0);
}
install();
window.addEventListener('mhur:languagechange',()=>setTimeout(afterRender,0));
document.addEventListener('DOMContentLoaded',()=>setTimeout(afterRender,0));
})();
