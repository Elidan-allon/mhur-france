(function(){
'use strict';
window.MHUR_RELEASE='364';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isEN=()=>typeof window.lang!=='undefined'&&window.lang==='en';
const txt=(fr,en)=>isEN()?en:fr;

/*
  Character pages used to build every statistics table immediately. Some characters
  contain thousands of cells, then several old MutationObservers scanned the whole
  page again. This lazy table renderer keeps those rows out of the DOM until opened.
*/
let tableStore=[];
window.mhurOpenLazyTable=function(id,button){
  const box=document.getElementById('mhurLazyTable'+id);if(!box)return;
  if(box.dataset.loaded==='1'){box.classList.toggle('hidden');return;}
  const tb=tableStore[id];if(!tb)return;
  const cols=Array.isArray(tb.cols)?tb.cols:[];
  const rows=Array.isArray(tb.rows)?tb.rows:[];
  box.innerHTML=`<table class="dataTable"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${(Array.isArray(r)?r:[]).map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  box.dataset.loaded='1';box.classList.remove('hidden');
  if(button)button.setAttribute('aria-expanded','true');
};
window.tables=function(ts){
  const list=Array.isArray(ts)?ts:[];
  return `<div class="tables">${list.map(tb=>{const id=tableStore.push(tb)-1;return `<button class="toggle" type="button" aria-expanded="false" onclick="mhurOpenLazyTable(${id},this)">${esc(tb?.title||txt('Valeurs','Values'))} ▾</button><div id="mhurLazyTable${id}" class="simpleTable hidden"></div>`}).join('')}</div>`;
};

function safeLabel(v){try{return typeof window.label==='function'?window.label(v):(v?.[isEN()?'en':'fr']??v??'')}catch(_){return v?.[isEN()?'en':'fr']??String(v??'')}}
function safeAsset(src,alt){try{return typeof window.asset==='function'?window.asset(src||'',alt||''):''}catch(_){return ''}}
function validCharacters(){return Array.isArray(window.characters)?window.characters:[]}
function styleMap(){return window.styles&&typeof window.styles==='object'?window.styles:{}}

window.stylePicker=function(){
  const c=validCharacters().find(x=>x&&x.id===window.selectedChar);
  if(!c)return `<button class="back" onclick="selectedChar=null;selectedStyle=null;render()">← ${txt('Retour','Back')}</button><div class="homeBox">${txt('Personnage introuvable.','Character not found.')}</div>`;
  const valid=(Array.isArray(c.styles)?c.styles:[]).filter(id=>styleMap()[id]);
  if(valid.length===1){window.selectedStyle=valid[0];return window.characterDetail(valid[0]);}
  return `<button class="back" onclick="selectedChar=null;selectedStyle=null;render()">← ${txt('Retour','Back')}</button><h1 class="title">${esc(c.name||txt('Personnage','Character'))}</h1><div class="styleGrid">${valid.map(id=>{const st=styleMap()[id]||{};let badges='';try{badges=(window.sideBadge?.(c.side)||'')+(window.roleBadge?.(st.role||'assault')||'')}catch(_){}return `<button class="styleCard" type="button" onclick="selectedStyle=${JSON.stringify(id)};render()"><div class="styleBanner">${safeAsset(st.portrait||c.portrait,c.name)}</div><div class="styleInfo"><h2>${esc(safeLabel(st.name)||id)}</h2><div class="badges">${badges}</div></div></button>`}).join('')||`<div class="homeBox">${txt('Aucun style disponible.','No style available.')}</div>`}</div>`;
};

window.characterDetail=function(styleId){
  tableStore=[];
  const st=styleMap()[styleId];
  if(!st)return `<button class="back" onclick="selectedStyle=null;render()">← ${txt('Retour','Back')}</button><div class="homeBox"><h2>${txt('Données indisponibles','Data unavailable')}</h2></div>`;
  const ch=validCharacters().find(x=>Array.isArray(x?.styles)&&x.styles.includes(styleId))||{name:txt('Personnage','Character')};
  let role='';try{role=window.roleBadge?.(st.role||'assault')||''}catch(_){}
  let special='';try{if(st.special&&typeof window.skillSection==='function')special=window.skillSection({letter:'SP',...st.special},true)}catch(e){console.warn('[V364 special]',e)}
  const skills=(Array.isArray(st.skills)?st.skills:[]).map(k=>{try{return window.skillSection?.(k,false)||''}catch(e){console.warn('[V364 skill]',e);return ''}}).join('');
  return `<button class="back" onclick="selectedStyle=null;render()">← ${txt('Retour','Back')}</button><div class="charPanel role-${esc(st.role||'assault')}"><div class="charTop"><div class="portrait">${safeAsset(st.portrait||ch.portrait,'portrait')}</div><div class="meta"><h2>${esc(ch.name||txt('Personnage','Character'))}</h2><div class="badges">${role}<span class="badge">${isEN()?'HP':'PV'} : ${esc(st.pv||'—')}</span></div><p><b>Style :</b> ${esc(safeLabel(st.name)||styleId)}</p><p>${esc(safeLabel(st.description)||'')}</p><p><b>${txt('Rôle','Role')} :</b> ${esc(safeLabel(st.roleDesc)||'')}</p></div></div>${special}<h2 class="quirkSectionTitle" style="padding:0 16px;color:#000">${txt('Alters','Quirks')}</h2>${skills||`<div class="homeBox">${txt('Compétences indisponibles.','Skills unavailable.')}</div>`}</div>`;
};

/* Prevent accidental recursive render chains. */
if(typeof window.render==='function'&&!window.render.__v364){
  const original=window.render;let rendering=false;
  const stable=function(){
    if(rendering)return;
    rendering=true;
    try{return original.apply(this,arguments)}
    catch(e){console.error('[MHUR V364 render]',e);const app=document.getElementById('app');if(app)app.innerHTML=`<div class="homeBox"><h2>${txt('Erreur d’affichage','Display error')}</h2><p>${esc(e?.message||e)}</p><button class="back" onclick="selectedStyle=null;selectedChar=null;page='characters';render()">← ${txt('Retour aux personnages','Back to characters')}</button></div>`}
    finally{rendering=false;}
  };
  stable.__v364=true;window.render=stable;
}

// Remove stale busy overlays/classes left by an interrupted render.
document.addEventListener('click',e=>{
  const card=e.target.closest('.card,.styleCard');if(!card)return;
  document.body.classList.remove('loading','is-loading');
},{capture:true});
})();
