/* MHUR Nexus — Saison 18 v12 : stabilité DOM, fonds de rôles et portraits. */
(function(){
'use strict';

const L=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const TX=(fr,en)=>L()==='en'?en:fr;
const PICK=v=>v&&typeof v==='object'&&!Array.isArray(v)?(v[L()]??v.fr??v.en??''):v;
const CLEAN=v=>String(PICK(v)??'').replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g,'').replace(/\s{2,}/g,' ').trim();
const NORM=v=>CLEAN(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const ROLE=v=>({strike:'attack',attack:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[NORM(v)]||'technical';
const COLORS={attack:'#e31b3a',assault:'#e3c400',technical:'#941bc4',support:'#19b852',rapid:'#16bad8'};

function exact(){
  if(window.__S18_EXACT_V12!==undefined)return window.__S18_EXACT_V12;
  const el=document.getElementById('ultrarumble-exact-data');
  if(!el)return window.__S18_EXACT_V12=null;
  try{window.__S18_EXACT_V12=JSON.parse(el.textContent||'{}');}catch(_e){window.__S18_EXACT_V12=null;}
  return window.__S18_EXACT_V12;
}
function charById(id){return typeof characters!=='undefined'?(characters||[]).find(c=>String(c.id)===String(id))||null:null;}
function styleIds(ch){return ch&&typeof styles!=='undefined'?Array.from(new Set((ch.styles||[]).map(String))).filter(id=>styles[id]):[];}
function exactRow(styleId){
  const data=exact()||{};
  if(data.exact_by_style?.[styleId])return data.exact_by_style[styleId];
  const ch=typeof characters!=='undefined'?(characters||[]).find(c=>(c.styles||[]).map(String).includes(String(styleId))):null;
  if(!ch)return null;
  const list=(Array.isArray(data.characters)?data.characters:[]).filter(r=>NORM(r?.base_name||r?.name)===NORM(ch.name));
  const ids=styleIds(ch);const index=Math.max(0,ids.indexOf(String(styleId)));
  const wanted=NORM(styles?.[styleId]?.name||'Original');
  return list.find(r=>NORM(r?.style_name||r?.style_header||'Original')===wanted)||list.find(r=>Number(r?.variant_index||0)===index)||list[index]||list[0]||null;
}
function portraitCandidates(styleId,fallback=''){
  const sync=window.MHUR_SEASON18_DATA?.official_portraits||{};
  const row=exactRow(styleId);
  const current=typeof styles!=='undefined'?styles?.[styleId]?.portrait||'':'';
  const list=[sync[styleId],row?.assets?.portrait,current,fallback].filter(Boolean).map(String);
  return Array.from(new Set(list));
}
function applyImage(img,candidates){
  if(!img||!candidates.length)return;
  const queue=Array.from(new Set(candidates.filter(Boolean)));
  const first=queue.shift();
  if(first&&img.getAttribute('src')!==first)img.src=first;
  img.dataset.s18v12Fallbacks=encodeURIComponent(JSON.stringify(queue));
  img.onerror=function(){
    try{
      const left=JSON.parse(decodeURIComponent(this.dataset.s18v12Fallbacks||'%5B%5D'));
      const next=left.shift();this.dataset.s18v12Fallbacks=encodeURIComponent(JSON.stringify(left));
      if(next){this.src=next;return;}
    }catch(_e){}
    this.onerror=null;
  };
}
function roleGradient(ids){
  const roles=[];
  ids.forEach(id=>{const r=ROLE(styles?.[id]?.role);if(!roles.includes(r))roles.push(r);});
  if(!roles.length)roles.push('technical');
  if(roles.length===1){const c=COLORS[roles[0]];return `radial-gradient(circle at 50% 24%,color-mix(in srgb, ${c} 48%, white) 0%,${c} 50%,color-mix(in srgb, ${c} 68%, black) 100%)`;}
  const stops=[];roles.forEach((r,i)=>{const a=Math.round(i*100/roles.length),b=Math.round((i+1)*100/roles.length);stops.push(`${COLORS[r]} ${a}%`,`${COLORS[r]} ${b}%`);});
  return `linear-gradient(135deg,${stops.join(',')})`;
}
function roleBackground(role){
  const c=COLORS[ROLE(role)]||COLORS.technical;
  return `radial-gradient(circle at 50% 24%,color-mix(in srgb, ${c} 48%, white) 0%,${c} 50%,color-mix(in srgb, ${c} 68%, black) 100%)`;
}

function decorateCharacterCards(){
  document.querySelectorAll('.card[data-char]').forEach(card=>{
    const ch=charById(card.dataset.char);if(!ch)return;
    const ids=styleIds(ch);const first=ids[0]||'';
    card.classList.add('s18V12CharacterCard');
    const thumb=card.querySelector('.thumb');if(!thumb)return;
    thumb.style.setProperty('--s18-v12-role-bg',roleGradient(ids));
    thumb.style.background=roleGradient(ids);
    const image=thumb.querySelector('img');if(image)applyImage(image,portraitCandidates(first,ch.portrait));
  });
}
function decorateStyleCards(){
  document.querySelectorAll('.styleCard[data-style]').forEach(card=>{
    const id=String(card.dataset.style||'');const st=typeof styles!=='undefined'?styles?.[id]:null;if(!st)return;
    const role=ROLE(st.role);card.classList.add('s18V12StyleCard',`role-${role}`);
    const banner=card.querySelector('.styleBanner');if(!banner)return;
    banner.style.background=roleBackground(st.role);
    const image=banner.querySelector('img');if(image)applyImage(image,portraitCandidates(id,st.portrait));
  });
}
function decorateCharacterDetail(){
  const panels=document.querySelectorAll('.charPanel');
  panels.forEach(panel=>{
    const id=typeof selectedStyle!=='undefined'?String(selectedStyle||''):'';
    const st=id&&typeof styles!=='undefined'?styles?.[id]:null;
    panel.classList.add('s18V12CharacterDetail');
    const box=panel.querySelector('.charTop .portrait,.portrait');if(!box)return;
    box.style.background=roleBackground(st?.role||'technical');
    const image=box.querySelector('img');if(image)applyImage(image,portraitCandidates(id,st?.portrait));
  });
}

function plannedCards(){
  return `<button type="button" class="s18PlannedCardV12 is-clickable role-technical" onclick="MHUR_S18_OPEN_PLANNED('gentle')"><span class="s18PlannedArtV12" style="background-image:url('assets/home/season18/gentle_s18_banner.webp')"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 character"><img src="assets/home/icons/release_character.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Gentle Criminal</b><small>${TX('Nouveau personnage · Technique','New character · Technical')}</small><em>${TX('Disponible depuis le 29 juillet','Available since July 29')}</em></span></button><article class="s18PlannedCardV12 is-disabled role-support" aria-disabled="true"><span class="s18PlannedArtV12" style="background-image:url('assets/home/season18/twice_s18_banner.webp')"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="assets/home/icons/release_style.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Twice</b><small>Sad Man's Parade · ${TX('Soutien','Support')}</small><em>${TX('Sortie le 19 août','Releases August 19')}</em></span></article><article class="s18PlannedCardV12 is-disabled role-attack tsuyu" aria-disabled="true"><span class="s18PlannedTsuyuV12"><img src="assets/home/season18/tsuyu_profile.webp" alt="Tsuyu Asui"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="assets/home/icons/release_style.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Tsuyu Asui</b><small>${TX('Nouveau style · nom à venir','New style · name to be announced')}</small><em>${TX('Prévu pendant la Saison 18','Planned during Season 18')}</em></span></article>`;
}
function decorateHome(){
  const home=document.querySelector('.homeV296');if(!home)return;
  const heading=[...home.querySelectorAll('.homeTitleV296')].find(h=>/derni[eè]res sorties|latest releases|sorties pr[eé]vues|planned releases/i.test(h.textContent||''));
  if(heading)heading.textContent=TX('SORTIES PRÉVUES — SAISON 18','SEASON 18 PLANNED RELEASES');
  const grid=home.querySelector('.releaseGridV296');
  if(grid&&(!grid.querySelector('.s18PlannedCardV12')||grid.children.length!==3)){
    grid.className='releaseGridV296 s18PlannedGridV12';grid.innerHTML=plannedCards();
  }
  if(grid){grid.dataset.s18SeasonV10=L();grid.dataset.s18V12=L();grid.style.setProperty('visibility','visible','important');grid.style.minHeight='0';}
}
function ensureHeader(){
  document.querySelectorAll('#mhurAdminButton,.mhurAdminTopButton,[data-mhur-admin]').forEach(el=>{if(el.id!=='mhurAccountButton')el.style.setProperty('display','none','important');});
  const account=document.getElementById('mhurAccountButton');if(!account?.parentNode)return;
  let b=document.getElementById('mhurPatchDevButtonV12')||document.getElementById('mhurPatchDevButtonV10');
  if(!b){b=document.createElement('button');b.id='mhurPatchDevButtonV12';b.type='button';b.className='nexusHeaderBtn mhurPatchDevButtonV10 mhurPatchDevButtonV12';account.parentNode.insertBefore(b,account);}
  b.innerHTML=`<span class="mhurPatchDevIconV12">📝</span><span>${TX('Notes de patch / Notes des développeurs','Patch Notes / Dev Notes')}</span>`;
  b.onclick=()=>window.MHUR_S18_V10?.openNotes?.();
}
function openNotes(){window.MHUR_S18_V10?.openNotes?.();}

function afterDom(){ensureHeader();decorateHome();decorateCharacterCards();decorateStyleCards();decorateCharacterDetail();}
let pending=false;
const observer=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;afterDom();});});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.MHUR_S18_V12={openNotes,afterDom};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',afterDom,{once:true});else afterDom();
window.addEventListener('mhur:languagechange',()=>setTimeout(afterDom,0));
})();
