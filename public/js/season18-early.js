/* MHUR Nexus — Saison 18 v10 : sorties prévues avant le premier rendu. */
(function(){
'use strict';
const L=()=>typeof lang!=='undefined'&&lang==='en'?'en':'fr';
const TX=(fr,en)=>L()==='en'?en:fr;
const ESC=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const NORM=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
function char(name){if(typeof characters==='undefined')return null;const n=NORM(name);return (characters||[]).find(c=>NORM(c.name).includes(n)||NORM(c.id).includes(n))||null}
function ids(c){return c&&typeof styles!=='undefined'?[...new Set((c.styles||[]).map(String))].filter(id=>styles[id]):[]}
function role(v){return ({strike:'attack',attack:'attack',assault:'assault',technical:'technical',support:'support',rapid:'rapid',speed:'rapid'})[NORM(v)]||'technical'}
function releases(){
 const gentle=char('gentle criminal'),twice=char('twice'),tsuyu=char('tsuyu')||char('froppy');
 const gs=ids(gentle)[0]||'',ts=ids(twice).find(id=>NORM(styles[id]?.name).includes('sad_man')||role(styles[id]?.role)==='support')||'',fs=ids(tsuyu).find(id=>role(styles[id]?.role)==='attack')||'';
 return [
  {key:'gentle',title:'Gentle Criminal',subtitle:TX('Nouveau personnage · Technique','New character · Technical'),character_id:gentle?.id||'gentle_criminal',style_id:gs,kind:'character',role:'technical',image:'assets/home/season18/gentle_portal_s18.webp',date:TX('Disponible depuis le 29 juillet','Available since July 29'),clickable:true},
  {key:'twice',title:'Twice',subtitle:"Sad Man's Parade · "+TX('Soutien','Support'),character_id:'',style_id:'',kind:'style',role:'support',image:'assets/home/season18/twice_portal_s18.webp',date:TX('Sortie prévue le 19 août','Planned for August 19'),clickable:false},
  {key:'tsuyu',title:tsuyu?.name||'Tsuyu Asui',subtitle:TX('Nouveau style · nom à venir','New style · name to be announced'),character_id:'',style_id:'',kind:'style',role:'attack',image:styles?.[fs]?.portrait||tsuyu?.portrait||'',date:TX('Prévu pendant la Saison 18','Planned during Season 18'),black:true,clickable:false}
 ];
}
if(window.MHUR_HOME_DATA)window.MHUR_HOME_DATA.latest_releases=releases();
window.openSeason18GentleV12=function(){
 const gentle=char('gentle criminal'); if(!gentle)return;
 page='characters'; selectedChar=gentle.id; selectedStyle=ids(gentle)[0]||null; selectedCostume=null;
 document.getElementById('drawer')?.classList.remove('open');
 if(location.hash!=='#characters')history.pushState(null,'','#characters');
 if(typeof layout==='function')layout();else if(typeof render==='function')render();
};
function card(x){
 const icon=x.kind==='character'?'assets/home/icons/release_character.png':'assets/home/icons/release_style.png';
 const art=x.black?`<span class="s18SeasonBlackV12">${typeof img==='function'?img(x.image,x.title,'s18SeasonProfileV12'):''}</span>`:`<span class="s18SeasonPortalV12" style="background-image:url('${ESC(x.image).replace(/'/g,'%27')}')"></span>`;
 const body=`${art}<span class="s18SeasonShadeV12"></span><span class="releaseBadgeV299 ${x.kind}">${typeof img==='function'?img(icon,x.kind):''}</span><span class="s18SeasonNewV12"></span><span class="releaseNamesV299"><b>${ESC(x.title)}</b><small>${ESC(x.subtitle)}</small><em>${ESC(x.date)}</em></span>`;
 if(x.clickable)return `<button type="button" class="releaseCardV299 s18SeasonReleaseV12 role-${role(x.role)} is-clickable" onclick="openSeason18GentleV12()" title="${ESC(x.title)} — ${ESC(x.subtitle)}">${body}</button>`;
 return `<article class="releaseCardV299 s18SeasonReleaseV12 role-${role(x.role)} is-coming" aria-label="${ESC(x.title)} — ${ESC(x.subtitle)}">${body}<span class="s18ComingSoonV12">${TX('BIENTÔT','COMING SOON')}</span></article>`;
}
if(typeof releaseCard==='function'){window.releaseCard=card;try{releaseCard=card}catch(_e){}}
})();
