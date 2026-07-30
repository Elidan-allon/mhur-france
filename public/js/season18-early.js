/* Charge le cache officiel MHUR Database avant le premier rendu, même si
   l'index n'a pas encore été retraité par le programme de mise à jour. */
if(!window.MHUR_LOCAL_ASSETS&&document.readyState==='loading'){
  document.write('<script src="data/local_assets_index.js?v=32000"><\/script>');
}
if(!window.MHUR_DATABASE_ASSETS&&document.readyState==='loading'){
  document.write('<script src="data/mhur_database_assets.js?v=31000"><\/script>');
}

/* MHUR Nexus — Saison 18 v14 : premier affichage stable et idempotent. */
(function(){
'use strict';

const currentLang=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const tx=(fr,en)=>currentLang()==='en'?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const root=v=>typeof rootAsset==='function'?rootAsset(v):String(v||'');

function plannedCards(){
  return [
    `<button type="button" class="s18PlannedCardV12 s18PlannedCardV13 s18PlannedCardV14 is-clickable role-technical" data-planned="gentle" onclick="MHUR_S18_OPEN_PLANNED('gentle')" title="Gentle Criminal"><span class="s18PlannedArtV12 s18PlannedArtV13 s18PlannedArtV14"><img src="${root('assets/home/season18/gentle_s18_banner.webp')}" alt="Gentle Criminal" loading="eager" decoding="async" fetchpriority="high"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 character"><img src="${root('assets/home/icons/release_character.png')}" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Gentle Criminal</b><small>${tx('Nouveau personnage · Technique','New character · Technical')}</small><em>${tx('Disponible depuis le 29 juillet','Available since July 29')}</em></span></button>`,
    `<article class="s18PlannedCardV12 s18PlannedCardV13 s18PlannedCardV14 is-disabled role-support" data-planned="twice" aria-disabled="true" title="Twice — Sad Man's Parade"><span class="s18PlannedArtV12 s18PlannedArtV13 s18PlannedArtV14"><img src="${root('assets/home/season18/twice_s18_banner.webp')}" alt="Twice — Sad Man's Parade" loading="eager" decoding="async" fetchpriority="high"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="${root('assets/home/icons/release_style.png')}" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Twice</b><small>Sad Man's Parade · ${tx('Soutien','Support')}</small><em>${tx('Sortie le 19 août','Releases August 19')}</em></span></article>`,
    `<article class="s18PlannedCardV12 s18PlannedCardV13 s18PlannedCardV14 is-disabled role-attack tsuyu wide" data-planned="tsuyu" aria-disabled="true" title="Tsuyu Asui"><span class="s18PlannedTsuyuV12 s18PlannedTsuyuV14"><img src="${root('assets/tsuyu/tsuyu_rapid/portrait.png')}" alt="Tsuyu Asui" loading="eager" decoding="async" fetchpriority="high"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="${root('assets/home/icons/release_style.png')}" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Tsuyu Asui</b><small>${tx('Nouveau style · nom à venir','New style · name to be announced')}</small><em>${tx('Prévu pendant la Saison 18','Planned during Season 18')}</em></span></article>`
  ].join('');
}

function patchHomeMarkup(html){
  const template=document.createElement('template');
  template.innerHTML=String(html||'').trim();
  const rootNode=template.content;
  const heading=[...rootNode.querySelectorAll('.homeTitleV296')].find(node=>/derni[eè]res sorties|latest releases|sorties pr[eé]vues|planned releases/i.test(node.textContent||''));
  if(heading) heading.textContent=tx('SORTIES PRÉVUES — SAISON 18','SEASON 18 PLANNED RELEASES');
  const grid=rootNode.querySelector('.releaseGridV296');
  if(grid){
    grid.className='releaseGridV296 s18PlannedGridV12 s18PlannedGridV13 s18PlannedGridV14';
    grid.dataset.s18Season='18';
    grid.innerHTML=plannedCards();
  }
  return template.innerHTML;
}

function localStyleAssetsV32(styleId){
  const local=window.MHUR_LOCAL_ASSETS||{};
  const map=local.styles||{};
  const aliases=local.aliases||{};
  const id=String(styleId||'');
  const key=aliases[id]||id;
  return map[id]||map[key]||(/gentle[_-]?criminal/i.test(id)?map.gentle_criminal_technical:null)||{};
}
function installOfficialPortraits(){
  if(typeof styles==='undefined') return;
  const database=window.MHUR_DATABASE_ASSETS?.styles||{};
  Object.keys(styles).forEach(id=>{
    const localRow=localStyleAssetsV32(id);
    const databaseRow=database[id]||(/gentle[_-]?criminal/i.test(id)?database.gentle_criminal_technical:null)||{};
    if(localRow.portrait) styles[id].portrait=String(localRow.portrait);
    const row={...databaseRow,...localRow};
    if(row.special&&styles[id].special)styles[id].special.img=String(row.special);
    const byLetter={alpha:'α',beta:'β',gamma:'γ'};
    Object.entries(byLetter).forEach(([key,letter])=>{
      if(!row[key]||!Array.isArray(styles[id].skills))return;
      const skill=styles[id].skills.find(item=>String(item?.letter||'').toLowerCase()===letter||String(item?.letter||'').toLowerCase()===key);
      if(skill)skill.img=String(row[key]);
    });
    if(typeof tunings!=='undefined'&&Array.isArray(tunings?.[id])&&row.tuning){
      const item=tunings[id].find(x=>String(x?.type||'').toUpperCase()==='SP')||tunings[id][0];
      if(item)item.img=String(row.tuning);
    }
  });
  if(typeof characters!=='undefined'){
    (characters||[]).forEach(ch=>{
      const ids=Array.from(new Set((ch.styles||[]).map(String))).filter(id=>styles[id]);
      const original=ids.find(id=>norm(typeof styles[id].name==='object'?(styles[id].name.fr||styles[id].name.en):styles[id].name)==='original')||ids[0];
      if(original&&localStyleAssetsV32(original).portrait) ch.portrait=localStyleAssetsV32(original).portrait;
    });
  }
}

function notesButtons(){
  return [...document.querySelectorAll('button,a,[role="button"]')].filter(button=>{
    const id=String(button.id||'');
    const cls=String(button.className||'');
    const label=String(button.textContent||'');
    return /^mhurPatchDevButton/i.test(id)||/mhurPatchDevButton/i.test(cls)||/patch\s*notes|dev\s*notes|notes\s*de\s*patch|notes\s*des\s*d[ée]veloppeurs/i.test(label);
  });
}
function repairHeader(){
  const account=document.getElementById('mhurAccountButton');
  const found=notesButtons();
  let button=found.shift()||null;
  found.forEach(extra=>extra.remove());
  document.querySelectorAll('#mhurAdminButton,.mhurAdminTopButton,[data-mhur-admin]').forEach(admin=>{
    if(admin.closest('header,.nexusHeader,.topbar,#topbar,#siteHeader')) admin.remove();
  });
  if(!account?.parentNode) return;
  if(!button) button=document.createElement('button');
  button.id='mhurPatchDevButtonV14';
  button.dataset.s18NotesButton='1';
  button.type='button';
  button.className='nexusHeaderBtn mhurPatchDevButtonV10 mhurPatchDevButtonV14';
  button.innerHTML=`<span class="mhurPatchDevIconV12">📝</span><span>Patch Notes / Dev Notes</span>`;
  button.onclick=()=>window.MHUR_S18_OPEN_NOTES_EARLY();
  if(button.parentNode!==account.parentNode||button.nextSibling!==account) account.parentNode.insertBefore(button,account);
}

function preloadPortraits(){
  const map=window.MHUR_LOCAL_ASSETS?.styles||{};
  const urls=Array.from(new Set(Object.values(map).map(row=>row?.portrait).filter(Boolean))).slice(0,100);
  const run=()=>urls.forEach(url=>{ const image=new Image(); image.decoding='async'; image.src=root(url); });
  if('requestIdleCallback' in window) requestIdleCallback(run,{timeout:1800}); else setTimeout(run,500);
}

if(typeof window.renderHomeDashboard==='function'&&!window.renderHomeDashboard.__s18v14){
  const original=window.renderHomeDashboard;
  const wrapped=function(){ return patchHomeMarkup(original.apply(this,arguments)); };
  wrapped.__s18v14=true;
  window.renderHomeDashboard=wrapped;
}

window.MHUR_S18_PLANNED_HTML=plannedCards;
window.MHUR_S18_PATCH_HOME_HTML=patchHomeMarkup;
window.MHUR_S18_OPEN_PLANNED=function(key){
  if(key!=='gentle'||typeof characters==='undefined') return;
  const ch=(characters||[]).find(c=>norm(c.name).includes('gentle_criminal')||norm(c.id).includes('gentle_criminal'));
  if(!ch) return;
  const ids=Array.from(new Set((ch.styles||[]).map(String))).filter(id=>typeof styles!=='undefined'&&styles[id]);
  const styleId=ids.find(id=>norm(typeof styles[id]?.name==='object'?(styles[id].name.fr||styles[id].name.en):styles[id]?.name)==='original')||ids[0]||null;
  page='characters';selectedChar=ch.id;selectedStyle=styleId;selectedCostume=null;
  window.page=page;window.selectedChar=selectedChar;window.selectedStyle=selectedStyle;window.selectedCostume=null;
  document.getElementById('drawer')?.classList.remove('open');
  try{history.pushState({page:'characters'},'',typeof cleanPathForPage==='function'?cleanPathForPage('characters'):'#characters')}catch(_e){}
  if(typeof layout==='function')layout();else if(typeof render==='function')render();
};
window.MHUR_S18_OPEN_NOTES_EARLY=function(){
  if(window.MHUR_S18_V14?.openNotes) window.MHUR_S18_V14.openNotes();
  else if(window.MHUR_S18_V13?.openNotes) window.MHUR_S18_V13.openNotes();
  else window.__s18OpenNotesRequested=true;
};

installOfficialPortraits();
repairHeader();
preloadPortraits();
const watchHeader=()=>{
  if(window.__s18HeaderEventsV18) return;
  window.__s18HeaderEventsV18=true;
  let queued=false;
  const schedule=()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;repairHeader();});
  };
  window.addEventListener('mhur-auth-change',schedule);
  window.addEventListener('mhur-role-change',schedule);
  window.addEventListener('mhur:languagechange',schedule);
  window.addEventListener('resize',schedule,{passive:true});
};
watchHeader();
window.MHUR_S18_V14_EARLY={repairHeader,installOfficialPortraits,patchHomeMarkup,watchHeader};
})();
