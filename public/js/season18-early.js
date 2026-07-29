/* MHUR Nexus — Saison 18 v12 : premier rendu sans flash. */
(function(){
'use strict';

const L=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const TX=(fr,en)=>L()==='en'?en:fr;
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NORM=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');

/* Le bouton Modération ne doit jamais apparaître dans le header, même pendant
   la vérification du rôle. Le vrai accès admin reste dans Mon compte. */
function hideModeration(){
  document.querySelectorAll('#mhurAdminButton,.mhurAdminTopButton,[data-mhur-admin]').forEach(el=>{
    if(el.id==='mhurAccountButton')return;
    el.style.setProperty('display','none','important');
    el.setAttribute('aria-hidden','true');
    el.setAttribute('tabindex','-1');
  });
}

function patchButtonLabel(){return TX('Notes de patch / Notes des développeurs','Patch Notes / Dev Notes');}
function ensurePatchButton(){
  hideModeration();
  const account=document.getElementById('mhurAccountButton');
  if(!account||!account.parentNode)return;
  let button=document.getElementById('mhurPatchDevButtonV12')||document.getElementById('mhurPatchDevButtonV10');
  if(!button){
    button=document.createElement('button');
    button.id='mhurPatchDevButtonV12';
    button.type='button';
    button.className='nexusHeaderBtn mhurPatchDevButtonV10 mhurPatchDevButtonV12';
    account.parentNode.insertBefore(button,account);
  }
  button.innerHTML=`<span class="mhurPatchDevIconV12">📝</span><span>${ESC(patchButtonLabel())}</span>`;
  button.onclick=()=>{
    if(window.MHUR_S18_V12?.openNotes)window.MHUR_S18_V12.openNotes();
    else if(window.MHUR_S18_V10?.openNotes)window.MHUR_S18_V10.openNotes();
  };
}

function plannedCards(){
  const gentle=`<button type="button" class="s18PlannedCardV12 is-clickable role-technical" data-planned="gentle" onclick="MHUR_S18_OPEN_PLANNED('gentle')" title="Gentle Criminal"><span class="s18PlannedArtV12" style="background-image:url('assets/home/season18/gentle_s18_banner.webp')"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 character"><img src="assets/home/icons/release_character.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Gentle Criminal</b><small>${TX('Nouveau personnage · Technique','New character · Technical')}</small><em>${TX('Disponible depuis le 29 juillet','Available since July 29')}</em></span></button>`;
  const twice=`<article class="s18PlannedCardV12 is-disabled role-support" data-planned="twice" aria-disabled="true" title="Twice — Sad Man's Parade"><span class="s18PlannedArtV12" style="background-image:url('assets/home/season18/twice_s18_banner.webp')"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="assets/home/icons/release_style.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Twice</b><small>Sad Man's Parade · ${TX('Soutien','Support')}</small><em>${TX('Sortie le 19 août','Releases August 19')}</em></span></article>`;
  const tsuyu=`<article class="s18PlannedCardV12 is-disabled role-attack tsuyu" data-planned="tsuyu" aria-disabled="true" title="Tsuyu Asui"><span class="s18PlannedTsuyuV12"><img src="assets/home/season18/tsuyu_profile.webp" alt="Tsuyu Asui"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="assets/home/icons/release_style.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Tsuyu Asui</b><small>${TX('Nouveau style · nom à venir','New style · name to be announced')}</small><em>${TX('Prévu pendant la Saison 18','Planned during Season 18')}</em></span></article>`;
  return gentle+twice+tsuyu;
}

function patchHomeHtml(html){
  let out=String(html||'');
  out=out.replace(/(<h2 class="homeTitleV296[^>]*>)[\s\S]*?(<\/h2>\s*<div class="releaseGridV296")/i,`$1${TX('SORTIES PRÉVUES — SAISON 18','SEASON 18 PLANNED RELEASES')}$2`);
  out=out.replace(/<div class="releaseGridV296"[^>]*>[\s\S]*?<\/div>\s*(?=<div class="homeDividerV296">)/i,`<div class="releaseGridV296 s18PlannedGridV12" data-s18-season-v10="${L()}" data-s18-v12="1">${plannedCards()}</div>`);
  return out;
}

window.MHUR_S18_OPEN_PLANNED=function(key){
  if(key!=='gentle'||typeof characters==='undefined')return;
  const ch=(characters||[]).find(c=>NORM(c.name).includes('gentle_criminal')||NORM(c.id).includes('gentle_criminal'));
  if(!ch)return;
  const ids=Array.from(new Set((ch.styles||[]).map(String)));
  const styleId=ids.find(id=>typeof styles!=='undefined'&&styles[id]&&NORM(styles[id].name||'Original')==='original')||ids[0]||null;
  page='characters';selectedChar=ch.id;selectedStyle=styleId;selectedCostume=null;
  document.getElementById('drawer')?.classList.remove('open');
  if(location.hash!=='#characters')history.pushState(null,'','#characters');
  if(typeof layout==='function')layout();else if(typeof render==='function')render();
};

/* home.js est déjà chargé lorsque ce fichier est injecté. On remplace donc le
   HTML avant le tout premier layout, pas après un flash visuel. */
if(typeof window.renderHomeDashboard==='function'&&!window.renderHomeDashboard.__s18v12){
  const old=window.renderHomeDashboard;
  const next=function(){return patchHomeHtml(old.apply(this,arguments));};
  next.__s18v12=true;
  window.renderHomeDashboard=next;
}

function patchHomeDom(){
  const home=document.querySelector('.homeV296');if(!home)return;
  const heading=[...home.querySelectorAll('.homeTitleV296')].find(h=>/derni[eè]res sorties|latest releases|sorties pr[eé]vues|planned releases/i.test(h.textContent||''));
  if(heading)heading.textContent=TX('SORTIES PRÉVUES — SAISON 18','SEASON 18 PLANNED RELEASES');
  const grid=home.querySelector('.releaseGridV296');
  if(grid&&grid.dataset.s18V12!==L()){
    grid.classList.add('s18PlannedGridV12');
    grid.innerHTML=plannedCards();
    grid.dataset.s18SeasonV10=L();
    grid.dataset.s18V12=L();
    grid.style.visibility='visible';
  }
}

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;ensurePatchButton();patchHomeDom();});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
ensurePatchButton();
hideModeration();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensurePatchButton();patchHomeDom();},{once:true});
else patchHomeDom();
})();
