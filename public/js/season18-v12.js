/* MHUR Nexus — Saison 18 v13 : portraits et fonds, sans MutationObserver. */
(function(){
'use strict';

const langNow=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const pick=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[langNow()]??v.fr??v.en??''):v;
const clean=v=>String(pick(v)??'').replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g,'').replace(/\s{2,}/g,' ').trim();
const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const roleKey=v=>({strike:'attack',attack:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[norm(v)]||'technical';
const roleColors={attack:'#e51b3e',assault:'#e6c800',technical:'#9a20ce',support:'#18b858',rapid:'#18bddb'};

function exactData(){
  if(window.__S18_EXACT_V13!==undefined) return window.__S18_EXACT_V13;
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el) return window.__S18_EXACT_V13=null;
  try{ window.__S18_EXACT_V13=JSON.parse(el.textContent||'{}'); }
  catch(_e){ window.__S18_EXACT_V13=null; }
  return window.__S18_EXACT_V13;
}
function charById(id){
  return typeof characters!=='undefined'?(characters||[]).find(c=>String(c.id)===String(id))||null:null;
}
function validStyleIds(ch){
  return ch&&typeof styles!=='undefined'?Array.from(new Set((ch.styles||[]).map(String))).filter(id=>styles[id]):[];
}
function exactRow(styleId){
  const data=exactData()||{};
  if(data.exact_by_style?.[styleId]) return data.exact_by_style[styleId];
  if(typeof characters==='undefined'||typeof styles==='undefined') return null;
  const ch=(characters||[]).find(c=>(c.styles||[]).map(String).includes(String(styleId)));
  if(!ch) return null;
  const candidates=(Array.isArray(data.characters)?data.characters:[]).filter(row=>norm(row?.base_name||row?.name)===norm(ch.name));
  if(!candidates.length) return null;
  const wanted=norm(styles[styleId]?.name||'Original');
  const index=Math.max(0,validStyleIds(ch).indexOf(String(styleId)));
  return candidates.find(row=>norm(row?.style_name||row?.style_header||'Original')===wanted)
    ||candidates.find(row=>Number(row?.variant_index||0)===index)
    ||candidates[index]
    ||candidates[0]
    ||null;
}
function portraitCandidates(styleId,fallback=''){
  const sync=window.MHUR_SEASON18_DATA?.official_portraits||{};
  const row=exactRow(styleId);
  const current=typeof styles!=='undefined'?styles?.[styleId]?.portrait||'':'';
  const id=String(styleId||'');
  const manual=/^fullbullet$/i.test(id)?'assets/home/season18/midoriya_fullbullet_profile.png':(/gentle[_-]?criminal/i.test(id)?'assets/home/season18/gentle_s18_profile_hd.webp':'');
  return Array.from(new Set([manual,sync[id],row?.assets?.portrait,current,fallback].filter(Boolean).map(String)));
}
function applyImage(img,candidates){
  if(!img||!candidates.length) return;
  img.loading='eager';
  img.decoding='async';
  try{img.fetchPriority='high'}catch(_e){}
  if(img.dataset.s18v14Applied==='1') return;
  const queue=Array.from(new Set(candidates.filter(Boolean)));
  const first=queue.shift();
  img.dataset.s18v14Applied='1';
  img.dataset.s18v13Fallbacks=encodeURIComponent(JSON.stringify(queue));
  img.onerror=function(){
    try{
      const left=JSON.parse(decodeURIComponent(this.dataset.s18v13Fallbacks||'%5B%5D'));
      const next=left.shift();
      this.dataset.s18v13Fallbacks=encodeURIComponent(JSON.stringify(left));
      if(next){ this.src=next; return; }
    }catch(_e){}
    this.onerror=null;
  };
  if(first&&img.getAttribute('src')!==first) img.src=first;
}
function oneRoleBackground(role){
  const color=roleColors[roleKey(role)]||roleColors.technical;
  return `radial-gradient(circle at 50% 22%,color-mix(in srgb, ${color} 48%, white) 0%,${color} 48%,color-mix(in srgb, ${color} 70%, black) 100%)`;
}
function characterBackground(ids){
  const original=(ids||[]).find(id=>norm(styles?.[id]?.name||'Original')==='original')||(ids||[])[0];
  return oneRoleBackground(styles?.[original]?.role||'technical');
}

function decorateCharacterCards(){
  document.querySelectorAll('.card[data-char]').forEach(card=>{
    const ch=charById(card.dataset.char); if(!ch) return;
    const ids=validStyleIds(ch); const first=ids.find(id=>norm(styles?.[id]?.name||'Original')==='original')||ids[0]||'';
    card.classList.add('s18V12CharacterCard','s18V13CharacterCard','s18V14CharacterCard');
    const thumb=card.querySelector('.thumb'); if(!thumb) return;
    thumb.style.setProperty('background',characterBackground(ids),'important');
    const image=thumb.querySelector('img');
    if(image) applyImage(image,portraitCandidates(first,ch.portrait));
  });
}
function decorateStyleCards(){
  document.querySelectorAll('.styleCard[data-style]').forEach(card=>{
    const id=String(card.dataset.style||'');
    const st=typeof styles!=='undefined'?styles?.[id]:null;
    if(!st) return;
    const role=roleKey(st.role);
    card.classList.add('s18V12StyleCard','s18V13StyleCard','s18V14StyleCard',`role-${role}`);
    const banner=card.querySelector('.styleBanner'); if(!banner) return;
    banner.style.setProperty('background',oneRoleBackground(role),'important');
    const image=banner.querySelector('img');
    if(image) applyImage(image,portraitCandidates(id,st.portrait));
  });
}
function decorateDetail(){
  document.querySelectorAll('.charPanel').forEach(panel=>{
    const id=typeof selectedStyle!=='undefined'?String(selectedStyle||''):'';
    const st=id&&typeof styles!=='undefined'?styles?.[id]:null;
    panel.classList.add('s18V12CharacterDetail','s18V13CharacterDetail','s18V14CharacterDetail');
    const portrait=panel.querySelector('.charTop .portrait');
    if(!portrait) return;
    portrait.style.setProperty('background',oneRoleBackground(st?.role||'technical'),'important');
    const image=portrait.querySelector('img');
    if(image) applyImage(image,portraitCandidates(id,st?.portrait));
  });
}
function decorateHomeFallback(){
  const home=document.querySelector('.homeV296');
  if(!home) return;
  const heading=[...home.querySelectorAll('.homeTitleV296')].find(node=>/derni[eè]res sorties|latest releases|sorties pr[eé]vues|planned releases/i.test(node.textContent||''));
  if(heading) heading.textContent=langNow()==='fr'?'SORTIES PRÉVUES — SAISON 18':'SEASON 18 PLANNED RELEASES';
  const grid=home.querySelector('.releaseGridV296');
  if(grid&&!grid.querySelector('.s18PlannedCardV14')&&typeof window.MHUR_S18_PLANNED_HTML==='function'){
    grid.className='releaseGridV296 s18PlannedGridV12 s18PlannedGridV13 s18PlannedGridV14';
    grid.innerHTML=window.MHUR_S18_PLANNED_HTML();
  }
}
function afterRender(){
  decorateHomeFallback();
  decorateCharacterCards();
  decorateStyleCards();
  decorateDetail();
  document.querySelectorAll('.card[data-char] .s18NewBadge').forEach(node=>node.remove());
}
function wrapRender(){
  if(typeof window.render!=='function'||window.render.__s18v13Decorated) return;
  const original=window.render;
  const wrapped=function(){
    const result=original.apply(this,arguments);
    requestAnimationFrame(afterRender);
    return result;
  };
  wrapped.__s18v13Decorated=true;
  window.render=wrapped;
  try{ render=wrapped; }catch(_e){}
}

wrapRender();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(afterRender),{once:true});
else requestAnimationFrame(afterRender);
window.addEventListener('mhur:languagechange',()=>requestAnimationFrame(afterRender));
window.MHUR_S18_V13_DECORATE=afterRender;
})();
