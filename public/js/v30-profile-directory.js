(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const KEY=String(cfg.supabaseKey||'').trim();
const remote=/^https:\/\/.+\.supabase\.co$/i.test(API)&&!!KEY;
const state={rows:[],filtered:[],loading:false,query:'',error:''};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const isEnglish=()=>((typeof lang!=='undefined'?lang:window.lang)==='en');
const tx=(fr,en)=>isEnglish()?en:fr;
const isAdmin=()=>Boolean(window.MHUR_MODERATION?.isSiteAdmin?.());
async function req(path,opt={}){
  if(!remote)throw new Error(tx('Supabase n’est pas configuré.','Supabase is not configured.'));
  const runner=window.MHUR_AUTH?.fetch||fetch;
  const response=await runner(API+path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});
  const text=await response.text();let data=null;
  try{data=text?JSON.parse(text):null}catch(_){data=text}
  if(!response.ok)throw new Error(data?.message||data?.hint||data?.error||text||`HTTP ${response.status}`);
  return data;
}
function initials(name){return String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function avatar(profile){return profile.avatar_url?`<img src="${esc(profile.avatar_url)}" alt="">`:`<span>${esc(initials(profile.username))}</span>`}
function ensureModal(){
  let modal=document.getElementById('mhurProfileDirectoryV30');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='mhurProfileDirectoryV30';
  modal.className='mhurProfileDirectoryV30';
  modal.innerHTML=`<section class="mhurProfileDirectoryPanelV30" role="dialog" aria-modal="true" aria-labelledby="mhurProfileDirectoryTitleV30"><button type="button" class="mhurProfileDirectoryCloseV30" aria-label="${tx('Fermer','Close')}">×</button><header><span>ADMIN</span><h2 id="mhurProfileDirectoryTitleV30">${tx('Liste des profils','Profile list')}</h2><p>${tx('Clique sur un membre pour ouvrir son profil public et accéder à la modération.','Click a member to open their public profile and access moderation.')}</p></header><div class="mhurProfileDirectorySearchV30"><span>🔎</span><input id="mhurProfileDirectorySearchV30" type="search" autocomplete="off" placeholder="${tx('Rechercher un pseudo…','Search a username…')}"></div><div id="mhurProfileDirectoryCountV30" class="mhurProfileDirectoryCountV30"></div><div id="mhurProfileDirectoryListV30" class="mhurProfileDirectoryListV30"></div></section>`;
  document.documentElement.appendChild(modal);
  modal.addEventListener('click',event=>{if(event.target===modal)close()});
  modal.querySelector('.mhurProfileDirectoryCloseV30').addEventListener('click',close);
  modal.querySelector('#mhurProfileDirectorySearchV30').addEventListener('input',event=>{state.query=event.target.value||'';filter();render()});
  return modal;
}
function memberDate(value){
  try{return new Intl.DateTimeFormat(isEnglish()?'en-GB':'fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value||Date.now()))}
  catch(_){return ''}
}
function filter(){
  const q=state.query.trim().toLowerCase();
  state.filtered=!q?state.rows:state.rows.filter(row=>[row.username,row.provider,row.role].some(value=>String(value||'').toLowerCase().includes(q)));
}
function render(){
  const modal=ensureModal();
  const list=modal.querySelector('#mhurProfileDirectoryListV30');
  const count=modal.querySelector('#mhurProfileDirectoryCountV30');
  if(state.loading){count.textContent='';list.innerHTML=`<div class="mhurProfileDirectoryEmptyV30">${tx('Chargement des profils…','Loading profiles…')}</div>`;return}
  if(state.error){count.textContent='';list.innerHTML=`<div class="mhurProfileDirectoryEmptyV30 error">${esc(state.error)}</div>`;return}
  count.textContent=`${state.filtered.length} ${state.filtered.length===1?tx('profil','profile'):tx('profils','profiles')}`;
  if(!state.filtered.length){list.innerHTML=`<div class="mhurProfileDirectoryEmptyV30">${tx('Aucun profil trouvé.','No profile found.')}</div>`;return}
  list.innerHTML=state.filtered.map(profile=>{
    const role=String(profile.role||'user').toLowerCase();
    const roleLabel=role==='admin'||role==='administrator'?tx('Administrateur','Administrator'):role==='moderator'?tx('Modérateur','Moderator'):tx('Membre','Member');
    return `<button type="button" class="mhurProfileDirectoryCardV30" data-profile-id="${esc(profile.id)}"><span class="mhurProfileDirectoryAvatarV30">${avatar(profile)}</span><span class="mhurProfileDirectoryIdentityV30"><b>${esc(profile.username||tx('Utilisateur','User'))}</b><small>${esc(String(profile.provider||tx('compte','account')).toUpperCase())} · ${tx('Membre depuis','Member since')} ${memberDate(profile.created_at)}</small></span><span class="mhurProfileDirectoryRoleV30 ${esc(role)}">${esc(roleLabel)}</span><span class="mhurProfileDirectoryArrowV30">›</span></button>`
  }).join('');
  list.querySelectorAll('[data-profile-id]').forEach(button=>button.addEventListener('click',()=>openProfile(button.dataset.profileId)));
}
async function load(){
  state.loading=true;state.error='';render();
  try{
    const rows=await req('/rest/v1/profiles?select=id,username,avatar_url,provider,created_at,role&order=created_at.desc&limit=500');
    state.rows=Array.isArray(rows)?rows:[];filter();
  }catch(error){
    state.rows=[];state.filtered=[];state.error=error.message||String(error);
  }finally{state.loading=false;render()}
}
async function open(){
  if(!isAdmin()){alert(tx('Accès réservé à l’administrateur.','Administrator access only.'));return}
  window.MHUR_AUTH?.close?.();
  const modal=ensureModal();
  modal.classList.add('open');
  document.documentElement.classList.add('mhurProfileDirectoryOpenV30');
  const input=modal.querySelector('#mhurProfileDirectorySearchV30');
  input.value='';state.query='';
  await load();
  requestAnimationFrame(()=>input.focus({preventScroll:true}));
}
function close(){document.getElementById('mhurProfileDirectoryV30')?.classList.remove('open');document.documentElement.classList.remove('mhurProfileDirectoryOpenV30')}
function openProfile(id){close();window.MHUR_PROFILES?.open?.(id)}
function injectAccountButton(){
  const card=document.querySelector('#mhurAuthOverlay.open .mhurProfileCard')||document.querySelector('#mhurAuthOverlay .mhurProfileCard');
  if(!card||!isAdmin())return;
  let button=card.querySelector('.mhurAuthProfileListV30');
  if(button)return;
  button=document.createElement('button');
  button.type='button';button.className='mhurAuthProfileListV30';
  button.innerHTML=`👥 ${tx('Liste des profils','Profile list')}`;
  button.addEventListener('click',open);
  const logout=card.querySelector('.mhurLogout');
  if(logout)card.insertBefore(button,logout);else card.appendChild(button);
}
const observer=new MutationObserver(()=>injectAccountButton());
function init(){observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('mhur-role-change',injectAccountButton);window.addEventListener('mhur-auth-change',()=>setTimeout(injectAccountButton,80));setTimeout(injectAccountButton,300)}
window.MHUR_PROFILE_DIRECTORY={state,open,close,load,openProfile};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
