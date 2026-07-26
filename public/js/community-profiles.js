(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const KEY=String(cfg.supabaseKey||'').trim();
const remote=/^https:\/\/.+\.supabase\.co$/i.test(API)&&!!KEY;
const state={profile:null,builds:[],mods:[],favorites:new Set(),loading:false};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const currentLang=()=>{
  const html=String(document.documentElement.lang||'').toLowerCase();
  if(html.startsWith('en'))return 'en';
  try{if(localStorage.getItem('mhur_lang')==='en')return 'en'}catch(_){}
  return 'fr';
};
const tx=(fr,en)=>currentLang()==='en'?en:fr;
const locale=()=>currentLang()==='en'?'en-US':'fr-FR';
const memberDate=value=>new Date(value||Date.now()).toLocaleDateString(locale());
const genericAvatar='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm-7.5 8.5c.55-4.2 3.05-6.3 7.5-6.3s6.95 2.1 7.5 6.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
async function req(path,opt={}){const runner=window.MHUR_AUTH?.fetch||fetch;const r=await runner(API+path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});const t=await r.text();let d=null;try{d=t?JSON.parse(t):null}catch(_){d=t}if(!r.ok)throw new Error(d?.message||d?.hint||t||`HTTP ${r.status}`);return d}
function modal(){let m=document.getElementById('mhurPublicProfileModal');if(m)return m;m=document.createElement('div');m.id='mhurPublicProfileModal';m.className='mhurPublicProfileModal';m.innerHTML='<section class="mhurPublicProfilePanel"><button class="mhurPublicProfileClose" type="button" onclick="MHUR_PROFILES.close()" aria-label="Close">×</button><div id="mhurPublicProfileBody"></div></section>';m.addEventListener('click',e=>{if(e.target===m)close()});document.body.appendChild(m);return m}
function avatar(p,cls=''){return p?.avatar_url?`<img class="${cls}" src="${esc(p.avatar_url)}" alt="">`:`<span class="${cls} mhurInitialAvatar mhurGenericAvatar">${genericAvatar}</span>`}
function buildMini(b){return `<button class="mhurProfileBuild" onclick="MHUR_PROFILES.openBuild('${esc(b.id)}','${esc(b.character_id)}','${esc(b.style_id)}')"><span class="mhurProfileBuildImg">${b.costume_img?`<img src="${esc(b.costume_img)}" alt="">`:''}</span><span><b>${esc(b.title)}</b><small>${esc(b.costume_name)} — ${esc(b.costume_variant)}</small><em>♥ ${Number(b.likes_count||0)} · ${memberDate(b.created_at)}</em></span></button>`}
function modMini(r){return `<button class="mhurProfileBuild mhurProfileMod" onclick="MHUR_PROFILES.openMod('${esc(r.id)}')"><span class="mhurProfileBuildImg">${r.preview_url?`<img src="${esc(r.preview_url)}" alt="">`:'🧩'}</span><span><b>${esc(r.title)}</b><small>${esc(r.mod_version||'1.0')} · ${esc(r.game_version||'')}</small><em>♥ ${Number(r.likes_count||0)} · ⬇ ${Number(r.downloads_count||0)}</em></span></button>`}
function badges(builds,mods){
  const likes=[...builds,...mods].reduce((n,x)=>n+Number(x.likes_count||0),0),downloads=mods.reduce((n,x)=>n+Number(x.downloads_count||0),0),total=builds.length+mods.length;
  const out=[];
  if(total)out.push(['🌱',tx('Première création','First creation')]);
  if(total>=5)out.push(['⚡',tx('Créateur actif','Active creator')]);
  if(likes>=25)out.push(['❤️',tx('Créateur populaire','Popular creator')]);
  if(downloads>=100)out.push(['⬇️',tx('Modder populaire','Popular modder')]);
  if(builds.some(b=>b.is_verified))out.push(['✅',tx('Build vérifié','Verified build')]);
  if(total>=20)out.push(['🏆',tx('Vétéran communautaire','Community veteran')]);
  return out;
}
function render(){
  const body=document.getElementById('mhurPublicProfileBody');if(!body)return;
  const closeButton=document.querySelector('#mhurPublicProfileModal .mhurPublicProfileClose');
  if(closeButton)closeButton.setAttribute('aria-label',tx('Fermer','Close'));
  if(state.loading){body.innerHTML=`<div class="mhurProfileLoading">${tx('Chargement du profil…','Loading profile…')}</div>`;return}
  const p=state.profile;if(!p){body.innerHTML=`<div class="mhurProfileLoading">${tx('Profil introuvable.','Profile not found.')}</div>`;return}
  const totalLikes=[...state.builds,...state.mods].reduce((n,x)=>n+Number(x.likes_count||0),0);
  const totalDownloads=state.mods.reduce((n,x)=>n+Number(x.downloads_count||0),0);
  const badgeHtml=badges(state.builds,state.mods).map(([icon,name])=>`<span class="mhurProfileBadge">${icon} ${esc(name)}</span>`).join('');
  body.innerHTML=`<header class="mhurPublicProfileHero">${avatar(p,'mhurPublicProfileAvatar')}<div><span class="mhurPublicProfileProvider">${esc(p.provider||tx('compte','account'))}</span><h2>${esc(p.username)}</h2><p>${tx('Membre depuis','Member since')} ${memberDate(p.created_at)}</p><div class="mhurProfileBadges">${badgeHtml}</div></div></header><div class="mhurProfileStats"><div><b>${state.builds.length}</b><span>Builds</span></div><div><b>${state.mods.length}</b><span>Mods</span></div><div><b>${totalLikes}</b><span>${tx('Likes reçus','Likes received')}</span></div><div><b>${totalDownloads}</b><span>${tx('Téléchargements','Downloads')}</span></div></div><section class="mhurProfileBuilds"><h3>${tx('Builds publiés','Published builds')}</h3>${state.builds.length?state.builds.map(buildMini).join(''):`<div class="mhurProfileEmpty">${tx('Aucun build publié.','No published build.')}</div>`}</section><section class="mhurProfileBuilds"><h3>${tx('Mods publiés','Published mods')}</h3>${state.mods.length?state.mods.map(modMini).join(''):`<div class="mhurProfileEmpty">${tx('Aucun mod publié.','No published mod.')}</div>`}</section>`;
  /* Le bandeau administrateur est ajouté par le module de modération après le rendu. */
  setTimeout(()=>window.MHUR_USER_MODERATION?.injectProfileAdmin?.(),0);
}
async function open(id){if(!id)return;const m=modal();m.classList.add('open');document.body.classList.add('cbModalOpen');state.loading=true;state.profile=null;state.builds=[];state.mods=[];render();try{if(!remote)throw new Error(tx('Base communautaire non configurée','Community database is not configured'));const [profiles,builds,mods]=await Promise.all([req(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=*`),req(`/rest/v1/community_builds?creator_id=eq.${encodeURIComponent(id)}&is_hidden=eq.false&select=*&order=likes_count.desc,created_at.desc`),req(`/rest/v1/community_mods?creator_id=eq.${encodeURIComponent(id)}&is_hidden=eq.false&select=*&order=downloads_count.desc,created_at.desc`)]);state.profile=Array.isArray(profiles)?profiles[0]:null;state.builds=Array.isArray(builds)?builds:[];state.mods=Array.isArray(mods)?mods:[]}catch(e){console.error(e)}finally{state.loading=false;render()}}
function close(){modal().classList.remove('open');if(!document.querySelector('.cbModal.open,.mhurAuthOverlay.open'))document.body.classList.remove('cbModalOpen')}
async function loadFavorites(){state.favorites.clear();const user=window.MHUR_AUTH?.getUser?.();if(!remote||!user)return state.favorites;try{const rows=await req(`/rest/v1/community_build_favorites?user_id=eq.${user.id}&select=build_id`);for(const r of rows||[])state.favorites.add(String(r.build_id))}catch(e){console.warn(e)}window.dispatchEvent(new CustomEvent('mhur-favorites-change'));return state.favorites}
function isFavorite(id){return state.favorites.has(String(id))}
async function toggleFavorite(buildId){if(!window.MHUR_AUTH?.requireLogin?.(tx('Connecte-toi pour enregistrer un build en favori.','Sign in to save a build as a favorite.')))return false;const user=window.MHUR_AUTH.getUser();const id=String(buildId);try{if(state.favorites.has(id)){await req(`/rest/v1/community_build_favorites?user_id=eq.${user.id}&build_id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});state.favorites.delete(id)}else{await req('/rest/v1/community_build_favorites',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({user_id:user.id,build_id:id})});state.favorites.add(id)}window.dispatchEvent(new CustomEvent('mhur-favorites-change'));return state.favorites.has(id)}catch(e){alert(tx('Favori impossible : ','Unable to update favorite: ')+(e.message||e));return false}}
function openBuild(id,charId,styleId){close();window.openCommunityBuildDetail?.(id,charId,styleId)}
function openMod(id){const row=state.mods.find(x=>String(x.id)===String(id));if(row&&window.MHUR_MODS?.state&&!window.MHUR_MODS.state.rows.some(x=>String(x.id)===String(id)))window.MHUR_MODS.state.rows.push(row);close();window.MHUR_MODS?.openDetail?.(id)}
window.MHUR_PROFILES={state,open,close,loadFavorites,isFavorite,toggleFavorite,openBuild,openMod,render};
window.addEventListener('mhur-auth-change',loadFavorites);
window.addEventListener('mhur:languagechange',()=>{if(document.getElementById('mhurPublicProfileModal')?.classList.contains('open'))render()});
window.addEventListener('storage',event=>{if((event.key==='mhur_lang'||event.key==='lang')&&document.getElementById('mhurPublicProfileModal')?.classList.contains('open'))render()});
document.addEventListener('DOMContentLoaded',()=>setTimeout(loadFavorites,150));
})();
