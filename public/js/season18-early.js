/* MHUR Nexus — Saison 18 v13 : premier affichage stable, sans boucle DOM. */
(function(){
'use strict';

const currentLang=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const tx=(fr,en)=>currentLang()==='en'?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');

function plannedCards(){
  return [
    `<button type="button" class="s18PlannedCardV12 s18PlannedCardV13 is-clickable role-technical" data-planned="gentle" onclick="MHUR_S18_OPEN_PLANNED('gentle')" title="Gentle Criminal"><span class="s18PlannedArtV12 s18PlannedArtV13" style="background-image:url('assets/home/season18/gentle_s18_banner.webp')"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 character"><img src="assets/home/icons/release_character.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Gentle Criminal</b><small>${tx('Nouveau personnage · Technique','New character · Technical')}</small><em>${tx('Disponible depuis le 29 juillet','Available since July 29')}</em></span></button>`,
    `<article class="s18PlannedCardV12 s18PlannedCardV13 is-disabled role-support" data-planned="twice" aria-disabled="true" title="Twice — Sad Man's Parade"><span class="s18PlannedArtV12 s18PlannedArtV13" style="background-image:url('assets/home/season18/twice_s18_banner.webp')"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="assets/home/icons/release_style.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Twice</b><small>Sad Man's Parade · ${tx('Soutien','Support')}</small><em>${tx('Sortie le 19 août','Releases August 19')}</em></span></article>`,
    `<article class="s18PlannedCardV12 s18PlannedCardV13 is-disabled role-attack tsuyu" data-planned="tsuyu" aria-disabled="true" title="Tsuyu Asui"><span class="s18PlannedTsuyuV12"><img src="assets/home/season18/tsuyu_profile.webp" alt="Tsuyu Asui"></span><span class="s18PlannedShadeV12"></span><span class="s18PlannedTypeV12 style"><img src="assets/home/icons/release_style.png" alt=""></span><span class="s18PlannedNewV12"></span><span class="s18PlannedTextV12"><b>Tsuyu Asui</b><small>${tx('Nouveau style · nom à venir','New style · name to be announced')}</small><em>${tx('Prévu pendant la Saison 18','Planned during Season 18')}</em></span></article>`
  ].join('');
}

function patchHomeMarkup(html){
  const template=document.createElement('template');
  template.innerHTML=String(html||'').trim();
  const root=template.content;
  const heading=[...root.querySelectorAll('.homeTitleV296')].find(node=>/derni[eè]res sorties|latest releases|sorties pr[eé]vues|planned releases/i.test(node.textContent||''));
  if(heading) heading.textContent=tx('SORTIES PRÉVUES — SAISON 18','SEASON 18 PLANNED RELEASES');
  const grid=root.querySelector('.releaseGridV296');
  if(grid){
    grid.className='releaseGridV296 s18PlannedGridV12 s18PlannedGridV13';
    grid.dataset.s18Season='18';
    grid.innerHTML=plannedCards();
  }
  return template.innerHTML;
}

/* home.js est chargé juste avant ce fichier et le premier layout() arrive juste
   après. Le remplacement est donc actif dès le premier rendu. */
if(typeof window.renderHomeDashboard==='function'&&!window.renderHomeDashboard.__s18v13){
  const original=window.renderHomeDashboard;
  const wrapped=function(){ return patchHomeMarkup(original.apply(this,arguments)); };
  wrapped.__s18v13=true;
  window.renderHomeDashboard=wrapped;
}

window.MHUR_S18_PLANNED_HTML=plannedCards;
window.MHUR_S18_PATCH_HOME_HTML=patchHomeMarkup;
window.MHUR_S18_OPEN_PLANNED=function(key){
  if(key!=='gentle'||typeof characters==='undefined') return;
  const ch=(characters||[]).find(c=>norm(c.name).includes('gentle_criminal')||norm(c.id).includes('gentle_criminal'));
  if(!ch) return;
  const ids=Array.from(new Set((ch.styles||[]).map(String))).filter(id=>typeof styles!=='undefined'&&styles[id]);
  const styleId=ids.find(id=>norm(styles[id]?.name||'Original')==='original')||ids[0]||null;
  page='characters'; selectedChar=ch.id; selectedStyle=styleId; selectedCostume=null;
  window.page=page; window.selectedChar=selectedChar; window.selectedStyle=selectedStyle; window.selectedCostume=null;
  document.getElementById('drawer')?.classList.remove('open');
  if(location.pathname!=='/characters'&&location.hash!=='#characters'){
    try{ history.pushState({page:'characters'},'',typeof cleanPathForPage==='function'?cleanPathForPage('characters'):'#characters'); }catch(_e){}
  }
  if(typeof layout==='function') layout(); else if(typeof render==='function') render();
};

/* Le bouton est injecté directement dans index.html par le post-traitement.
   Ce petit relais garantit que le clic reste valide avant le script tardif. */
window.MHUR_S18_OPEN_NOTES_EARLY=function(){
  window.MHUR_S18_V13?.openNotes?.();
};
})();
