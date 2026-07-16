(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const url=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const key=String(cfg.supabaseKey||'').trim();
const configured=/^https:\/\/.+\.supabase\.co$/i.test(url)&&!!key;
const STORE='mhur_auth_session_v323';
const state={session:null,user:null,profile:null,ready:false,listeners:[]};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function decode(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch(_){return null}}
function save(session){state.session=session||null;if(session)localStorage.setItem(STORE,JSON.stringify(session));else localStorage.removeItem(STORE)}
function stored(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch(_){return null}}
function expired(session){const p=decode(session?.access_token||'');return !p?.exp||p.exp*1000<Date.now()+30000}
async function request(path,opt={}){const token=opt.token||state.session?.access_token||key;const res=await fetch(url+path,{...opt,headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(opt.headers||{})}});const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=text}if(!res.ok)throw new Error(data?.msg||data?.message||data?.error_description||text||`HTTP ${res.status}`);return data}
async function refresh(){if(!state.session?.refresh_token)return false;try{const s=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',token:key,body:JSON.stringify({refresh_token:state.session.refresh_token})});save(s);return true}catch(_){save(null);return false}}
async function user(){if(!configured||!state.session)return null;if(expired(state.session)&&!await refresh())return null;try{return await request('/auth/v1/user')}catch(_){save(null);return null}}
function meta(u){const m=u?.user_metadata||{};const provider=u?.app_metadata?.provider||'compte';return {id:u?.id||'',name:m.full_name||m.name||m.user_name||m.preferred_username||u?.email?.split('@')[0]||'Joueur',avatar:m.avatar_url||m.picture||'',email:u?.email||'',provider}}
function initials(name){return String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
async function syncProfile(){if(!state.user)return null;const m=meta(state.user);try{const rows=await request('/rest/v1/profiles?on_conflict=id&select=*',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:m.id,username:m.name.slice(0,40),avatar_url:m.avatar,provider:m.provider,updated_at:new Date().toISOString()})});state.profile=Array.isArray(rows)?rows[0]:rows}catch(_){state.profile={id:m.id,username:m.name,avatar_url:m.avatar,provider:m.provider}}return state.profile}
function notify(){renderButton();state.listeners.forEach(fn=>{try{fn(state)}catch(_){}});window.dispatchEvent(new CustomEvent('mhur-auth-change',{detail:state}))}
function parseCallback(){const raw=location.hash.startsWith('#access_token=')?location.hash.slice(1):location.search.slice(1);if(!raw)return false;const p=new URLSearchParams(raw);const access=p.get('access_token'),refreshToken=p.get('refresh_token');if(!access)return false;save({access_token:access,refresh_token:refreshToken,expires_in:Number(p.get('expires_in')||3600),token_type:p.get('token_type')||'bearer'});history.replaceState(null,'',location.pathname+'#home');return true}
async function init(){if(!configured){state.ready=true;renderButton();return}parseCallback();state.session=stored();state.user=await user();if(state.user)await syncProfile();state.ready=true;notify()}
function redirectTo(){return location.origin+location.pathname}
function login(provider){if(!configured){showError('Configure Supabase avant d’activer les comptes.');return}const target=`${url}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirectTo())}`;location.href=target}
async function logout(){if(state.session){try{await request('/auth/v1/logout',{method:'POST'})}catch(_){}}save(null);state.session=null;state.user=null;state.profile=null;close();notify()}
function ensure(){let m=document.getElementById('mhurAuthOverlay');if(m)return m;m=document.createElement('div');m.id='mhurAuthOverlay';m.className='mhurAuthOverlay';m.innerHTML='<section class="mhurAuthPanel"><div class="mhurAuthHead"><span>COMPTE COMMUNAUTÉ</span><h2>MY HERO ULTRA RUMBLE FRANCE</h2><p id="mhurAuthSubtitle">Connecte-toi pour publier et aimer des builds.</p><button class="mhurAuthClose" type="button" onclick="MHUR_AUTH.close()">×</button></div><div class="mhurAuthBody" id="mhurAuthBody"></div></section>';m.addEventListener('click',e=>{if(e.target===m)close()});document.body.appendChild(m);return m}
function showError(msg){open();const e=document.getElementById('mhurAuthError');if(e){e.textContent=msg;e.classList.add('show')}}
function open(){const m=ensure(),body=m.querySelector('#mhurAuthBody');if(state.user){const p=state.profile||meta(state.user),name=p.username||meta(state.user).name,avatar=p.avatar_url||meta(state.user).avatar;body.innerHTML=`<div class="mhurProfileCard">${avatar?`<img class="mhurProfileLarge" src="${esc(avatar)}" alt="">`:`<div class="mhurProfileLarge">${esc(initials(name))}</div>`}<h3>${esc(name)}</h3><p>${esc(meta(state.user).email)}</p><span class="mhurProviderBadge">Connecté avec ${esc(p.provider||meta(state.user).provider)}</span><button class="mhurAuthProfileOpen" type="button" onclick="MHUR_AUTH.close();MHUR_PROFILES?.open('${esc(p.id||state.user.id)}')">Voir mon profil public</button><button class="mhurLogout" type="button" onclick="MHUR_AUTH.logout()">Se déconnecter</button></div>`}else{body.innerHTML=`<div id="mhurAuthError" class="mhurAuthError"></div><button class="mhurAuthProvider google" type="button" onclick="MHUR_AUTH.login('google')"><i>G</i>Continuer avec Google</button><button class="mhurAuthProvider discord" type="button" onclick="MHUR_AUTH.login('discord')"><i>◉</i>Continuer avec Discord</button><button class="mhurAuthGuest" type="button" onclick="MHUR_AUTH.close()">Continuer en invité</button><p class="mhurAuthHint">Le mode invité permet de consulter le site. Un compte sera nécessaire pour publier un build ou enregistrer un cœur.</p>`}m.classList.add('open');document.body.classList.add('cbModalOpen')}
function close(){document.getElementById('mhurAuthOverlay')?.classList.remove('open');if(!document.querySelector('.cbModal.open'))document.body.classList.remove('cbModalOpen')}
function renderButton(){
  const b=document.getElementById('mhurAccountButton');
  if(!b)return;
  const L=(typeof lang!=='undefined'?lang:window.lang)==='en';
  if(state.user){
    const p=state.profile||meta(state.user),name=p.username||meta(state.user).name,av=p.avatar_url||meta(state.user).avatar;
    b.innerHTML=`${av?`<img src="${esc(av)}" alt="">`:`<span class="mhurAccountAvatar">${esc(initials(name))}</span>`}<span class="mhurAccountButtonText"><b>${esc(name)}</b><small>${L?'My account':'Mon compte'}</small></span>`;
  }else{
    b.innerHTML=`<span class="mhurAccountAvatar">👤</span><span class="mhurAccountButtonText"><b>${L?'Sign In':'Se connecter'}</b><small>${L?'Google or Discord':'Google ou Discord'}</small></span>`;
  }
}
function requireLogin(message='Connecte-toi pour utiliser cette fonctionnalité.'){if(state.user)return true;open();setTimeout(()=>showError(message),0);return false}
window.MHUR_AUTH={state,configured,init,open,close,login,logout,requireLogin,renderButton,getUser:()=>state.user,getProfile:()=>state.profile,getAccessToken:()=>state.session?.access_token||'',onChange:fn=>state.listeners.push(fn)};
document.addEventListener('DOMContentLoaded',init);
})();
