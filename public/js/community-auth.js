(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const url=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const key=String(cfg.supabaseKey||'').trim();
const configured=/^https:\/\/.+\.supabase\.co$/i.test(url)&&!!key;
const STORE='mhur_auth_session_v323';
const state={session:null,user:null,profile:null,ready:false,listeners:[]};
let refreshPromise=null;
let refreshTimer=null;
const isEn=()=>((typeof lang!=='undefined'?lang:window.lang)==='en');
const L=(fr,en)=>isEn()?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function decode(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch(_){return null}}
function sessionExpiry(session){const p=decode(session?.access_token||'');return Number(session?.expires_at||p?.exp||0)*1000}
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=null;if(!state.session?.refresh_token)return;const expiresAt=sessionExpiry(state.session);if(!expiresAt)return;const delay=Math.max(5000,expiresAt-Date.now()-90000);refreshTimer=setTimeout(()=>refresh(true).catch(()=>{}),delay)}
function save(session){state.session=session||null;if(session){localStorage.setItem(STORE,JSON.stringify(session));scheduleRefresh()}else{localStorage.removeItem(STORE);clearTimeout(refreshTimer);refreshTimer=null}}
function stored(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch(_){return null}}
function expired(session){const expiresAt=sessionExpiry(session);return !expiresAt||expiresAt<Date.now()+60000}
async function request(path,opt={}){const token=opt.token||state.session?.access_token||key;const res=await fetch(url+path,{...opt,headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json',...(opt.headers||{})}});const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch(_){data=text}if(!res.ok)throw new Error(data?.msg||data?.message||data?.error_description||text||`HTTP ${res.status}`);return data}
function isJwtProblem(status,text=''){return status===401||/jwt|token.*expired|invalid.*token|session.*expired/i.test(String(text||''))}
async function refresh(force=false){if(!state.session?.refresh_token)return false;if(!force&&!expired(state.session))return true;if(refreshPromise)return refreshPromise;refreshPromise=(async()=>{try{const s=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',token:key,body:JSON.stringify({refresh_token:state.session.refresh_token})});save(s);return true}catch(_){save(null);state.user=null;state.profile=null;if(state.ready)notify();return false}finally{refreshPromise=null}})();return refreshPromise}
async function authenticatedFetch(input,opt={}){
  const method=String(opt.method||'GET').toUpperCase();
  const allowAnonFallback=opt.allowAnonFallback!==false&&(method==='GET'||method==='HEAD');
  const forceAnon=opt.forceAnon===true;
  const cleanOpt={...opt};delete cleanOpt.allowAnonFallback;delete cleanOpt.forceAnon;
  if(!forceAnon&&state.session&&expired(state.session))await refresh(true);
  const make=async token=>fetch(input,{...cleanOpt,headers:{apikey:key,Authorization:`Bearer ${token||key}`,...(cleanOpt.headers||{})}});
  let response=await make(forceAnon?key:(state.session?.access_token||key));
  if(!forceAnon&&!response.ok){
    const detail=await response.clone().text().catch(()=> '');
    if(isJwtProblem(response.status,detail)){
      const renewed=await refresh(true);
      if(renewed){
        response=await make(state.session?.access_token||key);
        if(!response.ok){
          const retryDetail=await response.clone().text().catch(()=> '');
          if(isJwtProblem(response.status,retryDetail)){
            if(allowAnonFallback)response=await make(key);
            else{const err=new Error(L('Ta session a expiré. Reconnecte-toi pour continuer.','Your session expired. Sign in again to continue.'));err.code='AUTH_EXPIRED';throw err}
          }
        }
      }else if(allowAnonFallback)response=await make(key);
      else{const err=new Error(L('Ta session a expiré. Reconnecte-toi pour continuer.','Your session expired. Sign in again to continue.'));err.code='AUTH_EXPIRED';throw err}
    }
  }
  return response
}
async function user(){if(!configured||!state.session)return null;if(expired(state.session)&&!await refresh())return null;try{return await request('/auth/v1/user')}catch(_){save(null);return null}}
function meta(u){const m=u?.user_metadata||{};const provider=u?.app_metadata?.provider||'compte';return {id:u?.id||'',name:m.full_name||m.name||m.user_name||m.preferred_username||u?.email?.split('@')[0]||'Joueur',avatar:m.avatar_url||m.picture||'',email:u?.email||'',provider}}
function initials(name){return String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
async function syncProfile(){if(!state.user)return null;const m=meta(state.user);try{const rows=await request('/rest/v1/profiles?on_conflict=id&select=*',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:m.id,username:m.name.slice(0,40),avatar_url:m.avatar,provider:m.provider,updated_at:new Date().toISOString()})});state.profile=Array.isArray(rows)?rows[0]:rows}catch(_){state.profile={id:m.id,username:m.name,avatar_url:m.avatar,provider:m.provider}}return state.profile}
function notify(){renderButton();state.listeners.forEach(fn=>{try{fn(state)}catch(_){}});window.dispatchEvent(new CustomEvent('mhur-auth-change',{detail:state}))}
const PKCE_STORE='mhur_auth_pkce_verifier_v396';

function base64Url(bytes){
  let binary='';
  const arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  for(const b of arr)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function randomVerifier(){
  const bytes=new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256(value){
  return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
}

function cleanOAuthUrl(){
  const clean=location.pathname+'#home';
  history.replaceState(null,'',clean);
}

async function parseCallback(){
  const hashParams=new URLSearchParams(location.hash.replace(/^#/,''));
  const queryParams=new URLSearchParams(location.search);
  const error=hashParams.get('error_description')||queryParams.get('error_description')||hashParams.get('error')||queryParams.get('error');

  if(error){
    cleanOAuthUrl();
    setTimeout(()=>showError(error),0);
    return false;
  }

  const access=hashParams.get('access_token');
  const refreshToken=hashParams.get('refresh_token');

  if(access){
    save({
      access_token:access,
      refresh_token:refreshToken,
      expires_in:Number(hashParams.get('expires_in')||3600),
      expires_at:Number(hashParams.get('expires_at')||0),
      token_type:hashParams.get('token_type')||'bearer'
    });
    localStorage.removeItem(PKCE_STORE);
    cleanOAuthUrl();
    return true;
  }

  const code=queryParams.get('code');

  if(code){
    const verifier=localStorage.getItem(PKCE_STORE);

    if(!verifier){
      cleanOAuthUrl();
      setTimeout(()=>showError(L(
        'La connexion a expiré. Relance Google ou Discord.',
        'The sign-in attempt expired. Start Google or Discord again.'
      )),0);
      return false;
    }

    try{
      const session=await request('/auth/v1/token?grant_type=pkce',{
        method:'POST',
        token:key,
        body:JSON.stringify({
          auth_code:code,
          code_verifier:verifier
        })
      });

      save(session);
      localStorage.removeItem(PKCE_STORE);
      cleanOAuthUrl();
      return true;
    }catch(err){
      localStorage.removeItem(PKCE_STORE);
      cleanOAuthUrl();
      setTimeout(()=>showError(err?.message||L('Connexion impossible.','Unable to sign in.')),0);
      return false;
    }
  }

  return false;
}

async function init(){
  if(!configured){
    state.ready=true;
    renderButton();
    return;
  }

  await parseCallback();
  state.session=stored();
  scheduleRefresh();
  state.user=await user();

  if(state.user){await syncProfile();window.MHUR_ANALYTICS?.track?.('login_completed',{method:meta(state.user).provider||''});}

  state.ready=true;
  notify();
}

function redirectTo(){
  return location.origin+location.pathname;
}

async function login(provider){
  window.MHUR_ANALYTICS?.track?.('login_started',{method:String(provider||'')});
  if(!configured){
    showError(L('Configure Supabase avant d’activer les comptes.','Configure Supabase before enabling accounts.'));
    return;
  }

  try{
    const verifier=randomVerifier();
    const challenge=base64Url(await sha256(verifier));
    localStorage.setItem(PKCE_STORE,verifier);

    const params=new URLSearchParams({
      provider:String(provider),
      redirect_to:redirectTo(),
      code_challenge:challenge,
      code_challenge_method:'s256'
    });

    location.assign(`${url}/auth/v1/authorize?${params.toString()}`);
  }catch(err){
    localStorage.removeItem(PKCE_STORE);
    showError(err?.message||L('Impossible de démarrer la connexion.','Unable to start sign-in.'));
  }
}
async function logout(){if(state.session){try{await request('/auth/v1/logout',{method:'POST'})}catch(_){}}save(null);state.session=null;state.user=null;state.profile=null;close();notify()}
function ensure(){let m=document.getElementById('mhurAuthOverlay');if(m)return m;m=document.createElement('div');m.id='mhurAuthOverlay';m.className='mhurAuthOverlay';m.innerHTML='<section class="mhurAuthPanel"><div class="mhurAuthHead"><span id="mhurAuthLabel"></span><h2>MY HERO ULTRA RUMBLE FRANCE</h2><p id="mhurAuthSubtitle"></p><button class="mhurAuthClose" type="button" onclick="MHUR_AUTH.close()">×</button></div><div class="mhurAuthBody" id="mhurAuthBody"></div></section>';m.addEventListener('click',e=>{if(e.target===m)close()});document.body.appendChild(m);return m}
function showError(msg){open();const e=document.getElementById('mhurAuthError');if(e){e.textContent=msg;e.classList.add('show')}}
function open(){
  const m=ensure(),body=m.querySelector('#mhurAuthBody');
  const label=m.querySelector('#mhurAuthLabel'),subtitle=m.querySelector('#mhurAuthSubtitle');
  if(label)label.textContent=L('COMPTE COMMUNAUTÉ','COMMUNITY ACCOUNT');
  if(subtitle)subtitle.textContent=L('Connecte-toi pour publier et aimer des builds.','Sign in to publish and like builds.');
  if(state.user){
    const p=state.profile||meta(state.user),name=p.username||meta(state.user).name,avatar=p.avatar_url||meta(state.user).avatar;
    body.innerHTML=`<div class="mhurProfileCard">${avatar?`<img class="mhurProfileLarge" src="${esc(avatar)}" alt="">`:`<div class="mhurProfileLarge">${esc(initials(name))}</div>`}<h3>${esc(name)}</h3><p>${esc(meta(state.user).email)}</p><span class="mhurProviderBadge">${L('Connecté avec','Signed in with')} ${esc(p.provider||meta(state.user).provider)}</span><button class="mhurAuthProfileOpen" type="button" onclick="MHUR_AUTH.close();MHUR_PROFILES?.open('${esc(p.id||state.user.id)}')">${L('Voir mon profil public','View my public profile')}</button><button class="mhurLogout" type="button" onclick="MHUR_AUTH.logout()">${L('Se déconnecter','Sign out')}</button></div>`;
  }else{
    body.innerHTML=`<div id="mhurAuthError" class="mhurAuthError"></div><button class="mhurAuthProvider google" type="button" onclick="MHUR_AUTH.login('google')"><i>G</i>${L('Continuer avec Google','Continue with Google')}</button><button class="mhurAuthProvider discord" type="button" onclick="MHUR_AUTH.login('discord')"><i class="mhurDiscordIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.5 5.3A16 16 0 0 0 15.7 4l-.5 1.1a13.2 13.2 0 0 0-6.4 0L8.3 4a15.7 15.7 0 0 0-3.8 1.3C2.1 8.8 1.5 12.2 1.8 15.6A15.5 15.5 0 0 0 6.5 18l1.1-1.5a9.7 9.7 0 0 1-1.8-.9l.4-.3a11.4 11.4 0 0 0 11.6 0l.4.3c-.6.4-1.2.7-1.8.9l1.1 1.5a15.5 15.5 0 0 0 4.7-2.4c.4-4-.7-7.4-2.7-10.3ZM8.6 14.1c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.8 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2.2-.9 2.2-2 2.2Z"/></svg></i>${L('Continuer avec Discord','Continue with Discord')}</button><button class="mhurAuthGuest" type="button" onclick="MHUR_AUTH.close()">${L('Continuer en invité','Continue as guest')}</button><p class="mhurAuthHint">${L('Le mode invité permet de consulter le site. Un compte sera nécessaire pour publier un build ou enregistrer un cœur.','Guest mode lets you browse the site. An account is required to publish a build or save a like.')}</p>`;
  }
  m.classList.add('open');document.body.classList.add('cbModalOpen');
}
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
function requireLogin(message){message=message||L('Connecte-toi pour utiliser cette fonctionnalité.','Sign in to use this feature.');if(state.user)return true;open();setTimeout(()=>showError(message),0);return false}
window.MHUR_AUTH={state,configured,init,open,close,login,logout,requireLogin,renderButton,refreshSession:()=>refresh(true),fetch:authenticatedFetch,getUser:()=>state.user,getProfile:()=>state.profile,getAccessToken:()=>state.session?.access_token||'',onChange:fn=>state.listeners.push(fn)};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.session)refresh(false).catch(()=>{})});
window.addEventListener('online',()=>{if(state.session)refresh(false).catch(()=>{})});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
