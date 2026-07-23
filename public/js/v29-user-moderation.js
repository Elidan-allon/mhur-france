(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const KEY=String(cfg.supabaseKey||'').trim();
const REMOTE=/^https:\/\/.+\.supabase\.co$/i.test(API)&&!!KEY;
const state={record:null,loaded:false,profileId:null,adminTarget:null,originalFetch:null,originalRequireLogin:null};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const isEnglish=()=>((typeof lang!=='undefined'?lang:window.lang)==='en');
const tx=(fr,en)=>isEnglish()?en:fr;
const user=()=>window.MHUR_AUTH?.getUser?.()||null;
const isAdmin=()=>Boolean(window.MHUR_MODERATION?.isSiteAdmin?.());
function authFetch(){return state.originalFetch||window.MHUR_AUTH?.fetch||fetch}
async function request(path,opt={}){
  if(!REMOTE)throw new Error(tx('Supabase n’est pas configuré.','Supabase is not configured.'));
  const response=await authFetch()(API+path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});
  const text=await response.text();let data=null;
  try{data=text?JSON.parse(text):null}catch(_){data=text}
  if(!response.ok)throw new Error(data?.message||data?.hint||data?.error||text||`HTTP ${response.status}`);
  return data;
}
function activeBan(record=state.record){
  if(!record)return false;
  if(record.banned_permanent)return true;
  const until=record.banned_until?Date.parse(record.banned_until):0;
  return Boolean(until&&until>Date.now());
}
function banText(record=state.record){
  if(!record)return '';
  if(record.banned_permanent)return tx('Bannissement définitif','Permanent ban');
  if(record.banned_until){
    try{return `${tx('Suspendu jusqu’au','Suspended until')} ${new Intl.DateTimeFormat(isEnglish()?'en-GB':'fr-FR',{dateStyle:'long',timeStyle:'short'}).format(new Date(record.banned_until))}`}
    catch(_){return record.banned_until}
  }
  return '';
}
function ensureWarningModal(){
  let modal=document.getElementById('mhurWarningOverlayV29');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='mhurWarningOverlayV29';
  modal.className='mhurUserModerationOverlay warning';
  modal.innerHTML=`<section class="mhurUserModerationDialog warning"><div class="mhurModerationIcon">⚠️</div><h2>${tx('AVERTISSEMENT DE LA MODÉRATION','MODERATION WARNING')}</h2><p id="mhurWarningMessageV29"></p><small id="mhurWarningDateV29"></small><button type="button" id="mhurWarningAckV29">${tx('J’ai compris','I understand')}</button></section>`;
  document.documentElement.appendChild(modal);
  modal.querySelector('#mhurWarningAckV29').addEventListener('click',acknowledgeWarning);
  return modal;
}
function ensureBanModal(){
  let modal=document.getElementById('mhurBanOverlayV29');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='mhurBanOverlayV29';
  modal.className='mhurUserModerationOverlay ban';
  modal.innerHTML=`<section class="mhurUserModerationDialog ban"><div class="mhurModerationIcon">⛔</div><h2>${tx('COMPTE SUSPENDU','ACCOUNT SUSPENDED')}</h2><strong id="mhurBanStatusV29"></strong><p id="mhurBanReasonV29"></p><div class="mhurBanActionsV29"><button type="button" id="mhurBanReadOnlyV29">${tx('Continuer en lecture seule','Continue in read-only mode')}</button><button type="button" id="mhurBanLogoutV29">${tx('Se déconnecter','Sign out')}</button></div></section>`;
  document.body.appendChild(modal);
  modal.querySelector('#mhurBanReadOnlyV29').addEventListener('click',()=>modal.classList.remove('open'));
  modal.querySelector('#mhurBanLogoutV29').addEventListener('click',()=>window.MHUR_AUTH?.logout?.());
  return modal;
}
function renderStatus(){
  document.documentElement.classList.toggle('mhurUserBannedV29',activeBan());
  let badge=document.getElementById('mhurReadOnlyBadgeV29');
  if(activeBan()){
    if(!badge){badge=document.createElement('button');badge.id='mhurReadOnlyBadgeV29';badge.type='button';badge.onclick=showBan;document.body.appendChild(badge)}
    badge.textContent=`⛔ ${tx('Compte suspendu — lecture seule','Account suspended — read-only')}`;
  }else badge?.remove();
}
function showWarning(){
  const record=state.record;
  if(!record?.warning_message||record.warning_acknowledged_at)return;
  const modal=ensureWarningModal();
  modal.querySelector('#mhurWarningMessageV29').textContent=record.warning_message;
  modal.querySelector('#mhurWarningDateV29').textContent=record.warning_created_at?new Date(record.warning_created_at).toLocaleString(isEnglish()?'en-GB':'fr-FR'):'';
  modal.classList.add('open');
}
function showBan(){
  if(!activeBan())return;
  const modal=ensureBanModal();
  modal.querySelector('#mhurBanStatusV29').textContent=banText();
  modal.querySelector('#mhurBanReasonV29').textContent=state.record?.ban_reason||tx('Aucun motif précisé.','No reason provided.');
  modal.classList.add('open');
}
async function acknowledgeWarning(){
  try{
    await request('/rest/v1/rpc/mhur_ack_warning',{method:'POST',body:'{}'});
    state.record={...(state.record||{}),warning_acknowledged_at:new Date().toISOString()};
    ensureWarningModal().classList.remove('open');
  }catch(error){alert(error.message||String(error))}
}
async function loadSelfStatus(){
  state.loaded=false;state.record=null;
  const current=user();
  if(!REMOTE||!current){renderStatus();return null}
  try{
    const rows=await request(`/rest/v1/user_moderation?user_id=eq.${encodeURIComponent(current.id)}&select=*`);
    state.record=Array.isArray(rows)?rows[0]||null:null;
  }catch(error){console.warn('MHUR moderation status:',error)}
  state.loaded=true;renderStatus();
  if(activeBan())showBan();else showWarning();
  return state.record;
}
function isBlocked(){return activeBan()}
function denyAction(){showBan();return false}
function wrapAuth(){
  const auth=window.MHUR_AUTH;if(!auth||auth.__v29Guarded)return;
  auth.__v29Guarded=true;
  state.originalFetch=auth.fetch.bind(auth);
  state.originalRequireLogin=auth.requireLogin.bind(auth);
  auth.requireLogin=function(message){
    const allowed=state.originalRequireLogin(message);
    if(!allowed)return false;
    return isBlocked()?denyAction():true;
  };
  auth.fetch=async function(input,opt={}){
    const method=String(opt.method||'GET').toUpperCase();
    const url=String(input||'');
    const mutation=!['GET','HEAD','OPTIONS'].includes(method);
    const protectedMutation=mutation&&(/\/rest\/v1\/(community_|mod_|tier_|user_)/.test(url)||/\/storage\/v1\//.test(url));
    const moderationAction=/\/rest\/v1\/(user_moderation|rpc\/mhur_ack_warning)/.test(url);
    if(protectedMutation&&!moderationAction&&isBlocked()){
      denyAction();
      throw new Error(tx('Ton compte est suspendu. Les fonctions communautaires sont en lecture seule.','Your account is suspended. Community features are read-only.'));
    }
    return state.originalFetch(input,opt);
  };
}
function ensureAdminDialog(){
  let modal=document.getElementById('mhurUserAdminOverlayV29');
  if(modal&&modal.tagName==='DIALOG')return modal;
  /* V3.2: a native modal dialog is placed in the browser top layer. This
     guarantees that the moderation form can never render behind the public
     profile modal, regardless of any legacy stacking context or z-index. */
  modal?.remove();
  modal=document.createElement('dialog');
  modal.id='mhurUserAdminOverlayV29';
  modal.className='mhurUserAdminOverlayV29 mhurUserAdminNativeV32';
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','mhurUserAdminTitleV29');
  modal.innerHTML=`<section class="mhurUserAdminDialogV29"><button type="button" class="mhurUserAdminCloseV29" aria-label="${tx('Fermer','Close')}">×</button><span class="mhurAdminKickerV29">ADMINISTRATION</span><h2 id="mhurUserAdminTitleV29"></h2><div id="mhurUserAdminCurrentV29"></div><label>${tx('Message / motif','Message / reason')}<textarea id="mhurUserAdminMessageV29" maxlength="1000" placeholder="${tx('Écris le message affiché à l’utilisateur…','Write the message shown to the user…')}"></textarea></label><label id="mhurTempBanDateWrapV29">${tx('Fin du bannissement temporaire','Temporary ban end')}<input id="mhurTempBanDateV29" type="datetime-local"></label><div class="mhurUserAdminButtonsV29"><button type="button" data-admin-action="warn">⚠️ ${tx('Avertir','Warn')}</button><button type="button" data-admin-action="temp">⏳ ${tx('Bannir temporairement','Temporary ban')}</button><button type="button" data-admin-action="permanent" class="danger">⛔ ${tx('Bannir définitivement','Permanent ban')}</button><button type="button" data-admin-action="unban" class="success">✅ ${tx('Débannir','Unban')}</button><button type="button" data-admin-action="clear-warning">🧹 ${tx('Retirer l’avertissement','Clear warning')}</button></div><p id="mhurUserAdminResultV29"></p></section>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',event=>{if(event.target===modal)closeAdmin()});
  modal.addEventListener('cancel',event=>{event.preventDefault();closeAdmin()});
  modal.addEventListener('close',()=>{modal.classList.remove('open');document.documentElement.classList.remove('mhurUserAdminOpenV30')});
  modal.querySelector('.mhurUserAdminCloseV29').onclick=closeAdmin;
  modal.querySelectorAll('[data-admin-action]').forEach(button=>button.onclick=()=>submitAdminAction(button.dataset.adminAction));
  return modal;
}
async function fetchTargetStatus(id){
  const rows=await request(`/rest/v1/user_moderation?user_id=eq.${encodeURIComponent(id)}&select=*`);
  return Array.isArray(rows)?rows[0]||null:null;
}
function statusSummary(record){
  if(!record)return `<div class="mhurModerationStatusV29 neutral">${tx('Aucune sanction active.','No active moderation action.')}</div>`;
  const warning=record.warning_message?`<div><b>⚠️ ${tx('Avertissement','Warning')}</b><span>${esc(record.warning_message)}</span><small>${record.warning_acknowledged_at?tx('Lu par l’utilisateur','Acknowledged by user'):tx('Pas encore lu','Not acknowledged yet')}</small></div>`:'';
  const ban=(record.banned_permanent||record.banned_until)?`<div><b>⛔ ${record.banned_permanent?tx('Bannissement définitif','Permanent ban'):banText(record)}</b><span>${esc(record.ban_reason||tx('Aucun motif','No reason'))}</span></div>`:'';
  return `<div class="mhurModerationStatusV29">${warning}${ban}${!warning&&!ban?tx('Aucune sanction active.','No active moderation action.'):''}</div>`;
}
async function openAdmin(target){
  if(!isAdmin())return;
  const profile=typeof target==='string'?{id:target,username:target}:target;
  if(!profile?.id)return;
  state.adminTarget=profile;
  const modal=ensureAdminDialog();
  modal.querySelector('#mhurUserAdminTitleV29').textContent=`${tx('Modérer','Moderate')} ${profile.username||profile.id}`;
  modal.querySelector('#mhurUserAdminMessageV29').value='';
  modal.querySelector('#mhurUserAdminResultV29').textContent='';
  const end=new Date(Date.now()+24*60*60*1000);end.setMinutes(end.getMinutes()-end.getTimezoneOffset());
  modal.querySelector('#mhurTempBanDateV29').value=end.toISOString().slice(0,16);
  modal.querySelector('#mhurUserAdminCurrentV29').innerHTML=`<div class="mhurModerationLoadingV29">${tx('Chargement…','Loading…')}</div>`;
  document.documentElement.classList.add('mhurUserAdminOpenV30');
  modal.classList.add('open');
  try{
    if(typeof modal.showModal==='function'&&!modal.open)modal.showModal();
    else modal.setAttribute('open','');
  }catch(_){modal.setAttribute('open','')}
  requestAnimationFrame(()=>modal.querySelector('#mhurUserAdminMessageV29')?.focus({preventScroll:true}));
  try{state.adminTarget.record=await fetchTargetStatus(profile.id);modal.querySelector('#mhurUserAdminCurrentV29').innerHTML=statusSummary(state.adminTarget.record)}
  catch(error){modal.querySelector('#mhurUserAdminCurrentV29').textContent=error.message||String(error)}
}
function closeAdmin(){
  const modal=document.getElementById('mhurUserAdminOverlayV29');
  if(modal){
    modal.classList.remove('open');
    try{if(typeof modal.close==='function'&&modal.open)modal.close();else modal.removeAttribute('open')}catch(_){modal.removeAttribute('open')}
  }
  document.documentElement.classList.remove('mhurUserAdminOpenV30');
}
async function upsertModeration(payload){
  const rows=await request('/rest/v1/user_moderation?on_conflict=user_id&select=*',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
  return Array.isArray(rows)?rows[0]:rows;
}
async function submitAdminAction(action){
  if(!isAdmin()||!state.adminTarget?.id)return;
  const modal=ensureAdminDialog();
  const message=modal.querySelector('#mhurUserAdminMessageV29').value.trim();
  const result=modal.querySelector('#mhurUserAdminResultV29');
  const now=new Date().toISOString();
  let payload={user_id:state.adminTarget.id,updated_at:now};
  if(action==='warn'){
    if(!message)return result.textContent=tx('Écris un message d’avertissement.','Write a warning message.');
    Object.assign(payload,{warning_message:message,warning_created_at:now,warning_acknowledged_at:null,warned_by:user().id});
  }else if(action==='temp'){
    const raw=modal.querySelector('#mhurTempBanDateV29').value;
    const until=raw?new Date(raw):null;
    if(!until||Number.isNaN(until.getTime())||until<=new Date())return result.textContent=tx('Choisis une date de fin future.','Choose a future end date.');
    Object.assign(payload,{banned_permanent:false,banned_until:until.toISOString(),ban_reason:message||tx('Suspension temporaire','Temporary suspension'),banned_by:user().id});
  }else if(action==='permanent'){
    if(!confirm(tx('Bannir définitivement cet utilisateur ?','Permanently ban this user?')))return;
    Object.assign(payload,{banned_permanent:true,banned_until:null,ban_reason:message||tx('Bannissement définitif','Permanent ban'),banned_by:user().id});
  }else if(action==='unban'){
    Object.assign(payload,{banned_permanent:false,banned_until:null,ban_reason:null,banned_by:null});
  }else if(action==='clear-warning'){
    Object.assign(payload,{warning_message:null,warning_created_at:null,warning_acknowledged_at:null,warned_by:null});
  }
  result.textContent=tx('Enregistrement…','Saving…');
  try{
    state.adminTarget.record=await upsertModeration(payload);
    modal.querySelector('#mhurUserAdminCurrentV29').innerHTML=statusSummary(state.adminTarget.record);
    result.textContent=tx('Action enregistrée.','Action saved.');
    result.className='success';
  }catch(error){result.textContent=error.message||String(error);result.className='error'}
}
function injectProfileControls(){
  const body=document.getElementById('mhurPublicProfileBody');
  const profile=window.MHUR_PROFILES?.state?.profile;
  if(!body||!profile||!isAdmin())return;
  let box=body.querySelector('.mhurProfileAdminV29');
  if(box)return;
  box=document.createElement('section');box.className='mhurProfileAdminV29';
  box.innerHTML=`<div><span>ADMIN</span><h3>${tx('Modération du membre','Member moderation')}</h3></div><button type="button">🛡️ ${tx('Avertir / bannir','Warn / ban')}</button>`;
  box.querySelector('button').onclick=()=>openAdmin({id:profile.id,username:profile.username||profile.id});
  body.prepend(box);
}
const observer=new MutationObserver(()=>injectProfileControls());
function init(){
  wrapAuth();
  observer.observe(document.body,{subtree:true,childList:true});
  window.addEventListener('mhur-role-change',injectProfileControls);
  window.addEventListener('mhur-auth-change',()=>setTimeout(loadSelfStatus,120));
  if(user())setTimeout(loadSelfStatus,350);
}
window.MHUR_USER_MODERATION={state,loadSelfStatus,isBlocked,showBan,showWarning,openAdmin,closeAdmin,injectProfileControls};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
