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
 const gs=ids(gentle)[0]||'',ts=ids(twice).find(id=>NORM(styles[id]?.name).includes('sad_man')||role(styles[id]?.role)==='support')||ids(twice)[0]||'',fs=ids(tsuyu).find(id=>role(styles[id]?.role)==='attack')||ids(tsuyu)[0]||'';
 return [
  {title:'Gentle Criminal',subtitle:TX('Nouveau personnage · Technique','New character · Technical'),character_id:gentle?.id||'gentle_criminal',style_id:gs,kind:'character',role:'technical',image:'assets/home/season18/gentle_s18_portrait.webp',date:TX('Disponible depuis le 29 juillet','Available since July 29')},
  {title:'Twice',subtitle:"Sad Man's Parade · "+TX('Soutien','Support'),character_id:twice?.id||'twice',style_id:ts,kind:'style',role:'support',image:'assets/home/season18/twice_s18_portrait.webp',date:TX('Sortie le 19 août','Releases August 19')},
  {title:tsuyu?.name||'Tsuyu Asui',subtitle:TX('Nouveau style · nom à venir','New style · name to be announced'),character_id:tsuyu?.id||'tsuyu',style_id:fs,kind:'style',role:'attack',image:styles?.[fs]?.portrait||tsuyu?.portrait||'',date:TX('Prévu pendant la Saison 18','Planned during Season 18'),black:true}
 ];
}
if(window.MHUR_HOME_DATA)window.MHUR_HOME_DATA.latest_releases=releases();
function card(x){
 const icon=x.kind==='character'?'assets/home/icons/release_character.png':'assets/home/icons/release_style.png';
 const art=x.black?`<span class="s18SeasonBlackV10">${typeof img==='function'?img(x.image,x.title,'s18SeasonProfileV10'):''}</span>`:`<span class="s18SeasonArtV10" style="background-image:url('${ESC(x.image).replace(/'/g,'%27')}')"></span>`;
 return `<button type="button" class="releaseCardV299 s18SeasonReleaseV10 role-${role(x.role)}" data-release-char="${ESC(x.character_id)}" data-release-style="${ESC(x.style_id)}" onclick="openHomeReleaseV298(this)" title="${ESC(x.title)} — ${ESC(x.subtitle)}">${art}<span class="s18SeasonShadeV10"></span><span class="releaseBadgeV299 ${x.kind}">${typeof img==='function'?img(icon,x.kind):''}</span><span class="s18SeasonNewV10"></span><span class="releaseNamesV299"><b>${ESC(x.title)}</b><small>${ESC(x.subtitle)}</small><em>${ESC(x.date)}</em></span></button>`;
}
if(typeof releaseCard==='function'){window.releaseCard=card;try{releaseCard=card}catch(_e){}}
})();
