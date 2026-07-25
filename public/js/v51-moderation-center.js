(function(){
'use strict';

const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const state={record:null,appeal:null,appealKey:'',countdown:null,adminTarget:null,renderToken:0,legacyObserver:null};
const en=()=>((typeof lang!=='undefined'?lang:window.lang)==='en');
const t=(fr,eng)=>en()?eng:fr;
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const currentUser=()=>window.MHUR_AUTH?.getUser?.()||null;
const isAdmin=()=>Boolean(window.MHUR_MODERATION?.isSiteAdmin?.());
const authFetch=()=>window.MHUR_AUTH?.fetch||fetch;

async function req(path,opt={}){
  if(!API)throw new Error(t('Supabase n’est pas configuré.','Supabase is not configured.'));
  const response=await authFetch()(API+path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});
  const text=await response.text();
  let data=null;
  try{data=text?JSON.parse(text):null}catch(_){data=text}
  if(!response.ok)throw new Error(data?.message||data?.hint||data?.error_description||data?.error||text||`HTTP ${response.status}`);
  return data;
}

function activeBan(record=state.record){
  if(!record)return false;
  if(record.banned_permanent)return true;
  const until=Date.parse(record.banned_until||'');
  return Number.isFinite(until)&&until>Date.now();
}
function sanctionKind(record=state.record){
  if(!record)return null;
  if(record.banned_permanent)return 'permanent';
  if(activeBan(record))return 'temporary';
  if(record.warning_message&&!record.warning_acknowledged_at)return 'warning';
  return null;
}
function fmtDate(value){
  if(!value)return '—';
  try{return new Intl.DateTimeFormat(en()?'en-GB':'fr-FR',{dateStyle:'long',timeStyle:'short'}).format(new Date(value))}
  catch(_){return String(value)}
}
function remaining(value){
  let total=Date.parse(value||'')-Date.now();
  let ms=Math.max(0,total);
  const d=Math.floor(ms/86400000);ms%=86400000;
  const h=Math.floor(ms/3600000);ms%=3600000;
  const m=Math.floor(ms/60000);
  const s=Math.floor((ms%60000)/1000);
  return {d,h,m,s,total};
}
function firstRow(data){return Array.isArray(data)?data[0]||null:data||null}
function sanctionKey(record=state.record){
  const type=sanctionKind(record);
  if(!type)return '';
  return String(record?.sanction_id||[type,record?.warning_created_at||'',record?.banned_at||'',record?.banned_until||'',record?.updated_at||''].join('|'));
}
function friendlySqlError(error){
  const message=String(error?.message||error||'');
  if(/mhur_(submit_moderation_appeal|admin_apply_sanction|get_my_current_appeal)|schema cache|PGRST202|Could not find the function/i.test(message)){
    return t('Exécute le fichier configuration/A_EXECUTER_DANS_SUPABASE_V51.sql dans Supabase, puis réessaie.','Run configuration/A_EXECUTER_DANS_SUPABASE_V51.sql in Supabase, then try again.');
  }
  return message;
}

function neutralizeLegacy(){
  const root=document.documentElement;
  root.classList.add('mhurModerationV51Ready');
  root.classList.remove('mhurUserBannedV29');
  document.querySelectorAll('#mhurBanOverlayV29,#mhurWarningOverlayV29').forEach(node=>{
    node.classList.remove('open');
    node.setAttribute('aria-hidden','true');
  });
}
function watchLegacyClass(){
  if(state.legacyObserver)return;
  state.legacyObserver=new MutationObserver(()=>{
    if(document.documentElement.classList.contains('mhurUserBannedV29'))neutralizeLegacy();
  });
  state.legacyObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
}

function ensureOverlay(){
  let overlay=document.getElementById('mhurSanctionV51');
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.id='mhurSanctionV51';
  overlay.className='mhurSanctionV51';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.innerHTML=`
    <main class="mhurSanctionCardV51">
      <div class="mhurSanctionIconV51" id="mhurSanctionIconV51"></div>
      <p class="mhurSanctionKickerV51">MHUR NEXUS · MODÉRATION</p>
      <h1 id="mhurSanctionTitleV51"></h1>
      <div class="mhurSanctionTypeV51" id="mhurSanctionTypeV51"></div>
      <section class="mhurSanctionReasonV51">
        <b>${t('MESSAGE DE LA MODÉRATION','MODERATION MESSAGE')}</b>
        <p id="mhurSanctionMessageV51"></p>
      </section>
      <div class="mhurCountdownV51" id="mhurCountdownV51" hidden>
        <div><strong data-time="d">0</strong><span>${t('JOURS','DAYS')}</span></div>
        <div><strong data-time="h">00</strong><span>${t('HEURES','HOURS')}</span></div>
        <div><strong data-time="m">00</strong><span>${t('MINUTES','MINUTES')}</span></div>
        <div><strong data-time="s">00</strong><span>${t('SECONDES','SECONDS')}</span></div>
      </div>
      <p class="mhurSanctionDatesV51" id="mhurSanctionDatesV51"></p>
      <div class="mhurSanctionActionsV51">
        <button id="mhurAppealBtnV51" type="button">📩 ${t('Contacter la modération','Contact moderation')}</button>
        <button id="mhurAckBtnV51" type="button">✓ ${t('J’ai compris','I understand')}</button>
      </div>
      <p class="mhurAppealStatusV51" id="mhurAppealStatusV51"></p>
    </main>`;
  document.documentElement.appendChild(overlay);
  overlay.querySelector('#mhurAckBtnV51').addEventListener('click',ackWarning);
  overlay.querySelector('#mhurAppealBtnV51').addEventListener('click',openAppeal);
  return overlay;
}

function ensureAppealDialog(){
  let dialog=document.getElementById('mhurAppealDialogV51');
  if(dialog)return dialog;
  dialog=document.createElement('dialog');
  dialog.id='mhurAppealDialogV51';
  dialog.className='mhurAppealDialogV51';
  dialog.innerHTML=`<form method="dialog">
    <button class="mhurCloseV51" value="cancel" aria-label="${t('Fermer','Close')}">×</button>
    <span>📩 MODÉRATION</span>
    <h2>${t('Envoyer un message','Send a message')}</h2>
    <p>${t('Tu peux envoyer un seul message pour cette sanction. Explique calmement la situation.','You can send one message for this sanction. Explain the situation calmly.')}</p>
    <textarea id="mhurAppealTextV51" maxlength="1500" required placeholder="${t('Écris ton message…','Write your message…')}"></textarea>
    <div class="mhurAppealButtonsV51">
      <button value="cancel">${t('Annuler','Cancel')}</button>
      <button type="button" id="mhurAppealSendV51">${t('Envoyer mon message','Send my message')}</button>
    </div>
    <p id="mhurAppealResultV51"></p>
  </form>`;
  document.body.appendChild(dialog);
  dialog.querySelector('#mhurAppealSendV51').addEventListener('click',sendAppeal);
  return dialog;
}

function updateAppealUi(){
  const overlay=document.getElementById('mhurSanctionV51');
  if(!overlay)return;
  const button=overlay.querySelector('#mhurAppealBtnV51');
  const status=overlay.querySelector('#mhurAppealStatusV51');
  button.disabled=Boolean(state.appeal);
  button.textContent=state.appeal?`✓ ${t('Message déjà envoyé','Message already sent')}`:`📩 ${t('Contacter la modération','Contact moderation')}`;
  status.textContent=state.appeal?.response_message?`${t('Réponse de la modération','Moderation response')} : ${state.appeal.response_message}`:'';
}
async function fetchAppeal(){
  state.appeal=null;
  if(!currentUser()||!sanctionKind())return null;
  try{
    const rpcRows=await req('/rest/v1/rpc/mhur_get_my_current_appeal',{method:'POST',body:'{}'});
    state.appeal=firstRow(rpcRows);
  }catch(error){
    const sanctionId=state.record?.sanction_id;
    if(sanctionId){
      try{
        const rows=await req(`/rest/v1/moderation_appeals?sanction_id=eq.${encodeURIComponent(sanctionId)}&user_id=eq.${encodeURIComponent(currentUser()?.id||'')}&select=*`);
        state.appeal=firstRow(rows);
      }catch(fallbackError){console.warn('MHUR appeal:',fallbackError)}
    }else console.debug('MHUR appeal RPC:',error);
  }
  return state.appeal;
}

function updateCountdown(){
  const countdown=document.getElementById('mhurCountdownV51');
  if(!countdown||sanctionKind()!=='temporary')return;
  const value=remaining(state.record?.banned_until);
  countdown.querySelector('[data-time="d"]').textContent=value.d;
  countdown.querySelector('[data-time="h"]').textContent=String(value.h).padStart(2,'0');
  countdown.querySelector('[data-time="m"]').textContent=String(value.m).padStart(2,'0');
  countdown.querySelector('[data-time="s"]').textContent=String(value.s).padStart(2,'0');
  if(value.total<=0){
    clearInterval(state.countdown);state.countdown=null;
    setTimeout(()=>window.MHUR_USER_MODERATION?.loadSelfStatus?.(),250);
  }
}

function unlockPage(){
  clearInterval(state.countdown);state.countdown=null;
  document.documentElement.classList.remove('mhurSanctionLockedV50','mhurSanctionLockedV51');
  const overlay=document.getElementById('mhurSanctionV51');
  overlay?.classList.remove('open','warning','temporary','permanent');
}
async function render(record){
  neutralizeLegacy();
  if(record!==undefined)state.record=record||null;
  else state.record=window.MHUR_USER_MODERATION?.state?.record||state.record||null;
  const token=++state.renderToken;
  const type=sanctionKind();
  const overlay=ensureOverlay();
  clearInterval(state.countdown);state.countdown=null;

  if(!type){state.appeal=null;state.appealKey='';unlockPage();return}

  const labels={
    warning:['⚠️',t('AVERTISSEMENT','WARNING'),t('Avertissement','Warning')],
    temporary:['⏳',t('VOUS AVEZ ÉTÉ BANNI TEMPORAIREMENT','YOU HAVE BEEN TEMPORARILY BANNED'),t('Bannissement temporaire','Temporary ban')],
    permanent:['🚫',t('VOUS AVEZ ÉTÉ BANNI DÉFINITIVEMENT','YOU HAVE BEEN PERMANENTLY BANNED'),t('Bannissement définitif','Permanent ban')]
  };
  overlay.className=`mhurSanctionV51 open ${type}`;
  overlay.setAttribute('aria-label',labels[type][1]);
  document.documentElement.classList.toggle('mhurSanctionLockedV51',type!=='warning');
  document.documentElement.classList.remove('mhurSanctionLockedV50');
  overlay.querySelector('#mhurSanctionIconV51').textContent=labels[type][0];
  overlay.querySelector('#mhurSanctionTitleV51').textContent=labels[type][1];
  overlay.querySelector('#mhurSanctionTypeV51').textContent=`${t('SANCTION','SANCTION')} : ${labels[type][2]}`;
  overlay.querySelector('#mhurSanctionMessageV51').textContent=type==='warning'
    ?(state.record?.warning_message||t('Aucun message précisé.','No message provided.'))
    :(state.record?.ban_reason||t('Aucun motif précisé.','No reason provided.'));

  const countdown=overlay.querySelector('#mhurCountdownV51');
  countdown.hidden=type!=='temporary';
  if(type==='temporary'){updateCountdown();state.countdown=setInterval(updateCountdown,1000)}
  const created=type==='warning'?state.record?.warning_created_at:(state.record?.banned_at||state.record?.updated_at);
  overlay.querySelector('#mhurSanctionDatesV51').textContent=type==='temporary'
    ?`${t('Début','Start')} : ${fmtDate(created)} · ${t('Fin','End')} : ${fmtDate(state.record?.banned_until)}`
    :`${t('Date','Date')} : ${fmtDate(created)}`;
  overlay.querySelector('#mhurAckBtnV51').hidden=type!=='warning';
  const key=sanctionKey();
  if(state.appealKey!==key){
    state.appealKey=key;
    state.appeal=null;
    updateAppealUi();
    try{
      await fetchAppeal();
      if(token===state.renderToken&&type===sanctionKind())updateAppealUi();
    }catch(error){console.warn('MHUR appeal refresh:',error)}
  }else updateAppealUi();
}

async function ackWarning(){
  try{
    await req('/rest/v1/rpc/mhur_ack_warning',{method:'POST',body:'{}'});
    await window.MHUR_USER_MODERATION?.loadSelfStatus?.();
  }catch(error){alert(error.message||String(error))}
}
function openAppeal(){
  if(state.appeal||!sanctionKind())return;
  const dialog=ensureAppealDialog();
  dialog.querySelector('#mhurAppealTextV51').value='';
  dialog.querySelector('#mhurAppealResultV51').textContent='';
  try{dialog.showModal()}catch(_){dialog.setAttribute('open','')}
}
async function sendAppeal(){
  const dialog=ensureAppealDialog();
  const textarea=dialog.querySelector('#mhurAppealTextV51');
  const result=dialog.querySelector('#mhurAppealResultV51');
  const sendButton=dialog.querySelector('#mhurAppealSendV51');
  const message=textarea.value.trim();
  if(!message){result.textContent=t('Écris un message.','Write a message.');return}
  if(!sanctionKind()){result.textContent=t('Cette sanction n’est plus active.','This sanction is no longer active.');return}
  sendButton.disabled=true;result.textContent=t('Envoi…','Sending…');
  try{
    const rows=await req('/rest/v1/rpc/mhur_submit_moderation_appeal',{method:'POST',body:JSON.stringify({appeal_message:message})});
    state.appeal=firstRow(rows)||{message};
    try{dialog.close()}catch(_){dialog.removeAttribute('open')}
    updateAppealUi();
  }catch(error){result.textContent=friendlySqlError(error)}
  finally{sendButton.disabled=false}
}

function ensureAdmin(){
  let dialog=document.getElementById('mhurAdminV51');
  if(dialog)return dialog;
  dialog=document.createElement('dialog');
  dialog.id='mhurAdminV51';dialog.className='mhurAdminV51';
  dialog.innerHTML=`<section>
    <button class="mhurCloseV51" type="button" aria-label="${t('Fermer','Close')}">×</button>
    <span class="kick">ADMINISTRATION</span>
    <h2 id="mhurAdminTitleV51"></h2>
    <div id="mhurAdminCurrentV51"></div>
    <label>${t('Message / motif','Message / reason')}<textarea id="mhurAdminMessageV51" maxlength="1000"></textarea></label>
    <label>${t('Durée du bannissement temporaire','Temporary ban duration')}
      <select id="mhurAdminDurationV51">
        <option value="1h">1 ${t('heure','hour')}</option><option value="6h">6 ${t('heures','hours')}</option>
        <option value="12h">12 ${t('heures','hours')}</option><option value="1d" selected>1 ${t('jour','day')}</option>
        <option value="3d">3 ${t('jours','days')}</option><option value="7d">7 ${t('jours','days')}</option>
        <option value="14d">14 ${t('jours','days')}</option><option value="30d">30 ${t('jours','days')}</option>
        <option value="90d">90 ${t('jours','days')}</option><option value="custom">${t('Date et heure personnalisées','Custom date and time')}</option>
      </select>
    </label>
    <label id="mhurCustomDateWrapV51" hidden>${t('Fin personnalisée','Custom end')}<input id="mhurCustomDateV51" type="datetime-local"></label>
    <div class="mhurAdminActionsV51">
      <button data-action="warn">⚠️ ${t('Avertir','Warn')}</button>
      <button data-action="temporary">⏳ ${t('Ban temporaire','Temporary ban')}</button>
      <button data-action="permanent" class="danger">🚫 ${t('Ban définitif','Permanent ban')}</button>
      <button data-action="unban" class="success">✓ ${t('Débannir','Unban')}</button>
      <button data-action="clear_warning">🧹 ${t('Retirer l’avertissement','Clear warning')}</button>
    </div>
    <div id="mhurAdminAppealV51"></div>
    <p id="mhurAdminResultV51"></p>
  </section>`;
  document.body.appendChild(dialog);
  dialog.querySelector('.mhurCloseV51').addEventListener('click',()=>dialog.close());
  dialog.querySelector('#mhurAdminDurationV51').addEventListener('change',event=>{
    dialog.querySelector('#mhurCustomDateWrapV51').hidden=event.target.value!=='custom';
  });
  dialog.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>adminAction(button.dataset.action)));
  return dialog;
}
function durationEnd(value){
  const milliseconds={'1h':3600000,'6h':21600000,'12h':43200000,'1d':86400000,'3d':259200000,'7d':604800000,'14d':1209600000,'30d':2592000000,'90d':7776000000};
  return milliseconds[value]?new Date(Date.now()+milliseconds[value]):null;
}
async function openAdmin(target){
  if(!isAdmin())return;
  const profile=typeof target==='string'?{id:target,username:target}:target;
  if(!profile?.id)return;
  state.adminTarget=profile;
  const dialog=ensureAdmin();
  dialog.querySelector('#mhurAdminTitleV51').textContent=`${t('Modérer','Moderate')} ${profile.username||profile.id}`;
  dialog.querySelector('#mhurAdminMessageV51').value='';
  dialog.querySelector('#mhurAdminResultV51').textContent='';
  dialog.querySelector('#mhurAdminCurrentV51').textContent=t('Chargement…','Loading…');
  const tomorrow=new Date(Date.now()+86400000);tomorrow.setMinutes(tomorrow.getMinutes()-tomorrow.getTimezoneOffset());
  dialog.querySelector('#mhurCustomDateV51').value=tomorrow.toISOString().slice(0,16);
  try{dialog.showModal()}catch(_){dialog.setAttribute('open','')}
  await refreshAdmin();
}
async function refreshAdmin(){
  const dialog=ensureAdmin();
  const id=state.adminTarget?.id;
  if(!id)return;
  try{
    const rows=await req(`/rest/v1/user_moderation?user_id=eq.${encodeURIComponent(id)}&select=*`);
    const record=firstRow(rows);
    state.adminTarget.record=record;
    const label=record?.banned_permanent?t('Ban définitif','Permanent ban')
      :activeBan(record)?t('Ban temporaire','Temporary ban')
      :record?.warning_message&&!record.warning_acknowledged_at?t('Avertissement','Warning')
      :t('Aucune sanction active','No active sanction');
    dialog.querySelector('#mhurAdminCurrentV51').innerHTML=record
      ?`<div class="mhurCurrentV51"><b>${label}</b><p>${esc(record.ban_reason||record.warning_message||'')}</p>${record.banned_until?`<small>${fmtDate(record.banned_until)}</small>`:''}</div>`
      :`<div class="mhurCurrentV51">${label}</div>`;
    let appeal=null;
    if(record?.sanction_id){
      const appeals=await req(`/rest/v1/moderation_appeals?sanction_id=eq.${encodeURIComponent(record.sanction_id)}&select=*&order=created_at.desc&limit=1`);
      appeal=firstRow(appeals);
    }
    dialog.querySelector('#mhurAdminAppealV51').innerHTML=appeal?`<article class="mhurAdminAppealCardV51">
      <b>📩 ${t('Message du membre','Member message')}</b><p>${esc(appeal.message)}</p>
      <textarea id="mhurAdminReplyV51" maxlength="1500" placeholder="${t('Réponse facultative…','Optional reply…')}">${esc(appeal.response_message||'')}</textarea>
      <button type="button" id="mhurSaveReplyV51">${t('Enregistrer la réponse / traiter','Save response / resolve')}</button>
    </article>`:'';
    dialog.querySelector('#mhurSaveReplyV51')?.addEventListener('click',()=>saveReply(appeal.id));
  }catch(error){dialog.querySelector('#mhurAdminCurrentV51').textContent=friendlySqlError(error)}
}
async function saveReply(id){
  const dialog=ensureAdmin();
  const message=dialog.querySelector('#mhurAdminReplyV51').value.trim();
  try{
    await req(`/rest/v1/moderation_appeals?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({response_message:message||null,status:'resolved',responded_at:new Date().toISOString(),responded_by:currentUser()?.id})});
    dialog.querySelector('#mhurAdminResultV51').textContent=t('Réponse enregistrée.','Response saved.');
  }catch(error){dialog.querySelector('#mhurAdminResultV51').textContent=friendlySqlError(error)}
}
async function adminAction(action){
  const dialog=ensureAdmin();
  const output=dialog.querySelector('#mhurAdminResultV51');
  const message=dialog.querySelector('#mhurAdminMessageV51').value.trim();
  let until=null;
  if(action==='warn'&&!message){output.textContent=t('Écris le message d’avertissement.','Write the warning message.');return}
  if(action==='temporary'){
    until=durationEnd(dialog.querySelector('#mhurAdminDurationV51').value);
    if(!until){const raw=dialog.querySelector('#mhurCustomDateV51').value;until=raw?new Date(raw):null}
    if(!until||Number.isNaN(until.getTime())||until<=new Date()){output.textContent=t('Choisis une date future.','Choose a future date.');return}
  }
  if(action==='permanent'&&!confirm(t('Confirmer le bannissement définitif ?','Confirm permanent ban?')))return;
  output.textContent=t('Enregistrement…','Saving…');
  dialog.querySelectorAll('[data-action]').forEach(button=>button.disabled=true);
  try{
    const rows=await req('/rest/v1/rpc/mhur_admin_apply_sanction',{method:'POST',body:JSON.stringify({target_user:state.adminTarget.id,sanction_action:action,moderation_message:message||null,temporary_until:until?until.toISOString():null})});
    state.adminTarget.record=firstRow(rows);
    output.textContent=t('Sanction enregistrée.','Sanction saved.');
    await refreshAdmin();
  }catch(error){output.textContent=friendlySqlError(error)}
  finally{dialog.querySelectorAll('[data-action]').forEach(button=>button.disabled=false)}
}

function install(){
  neutralizeLegacy();watchLegacyClass();
  window.MHUR_MODERATION_V51={render,openAdmin,refreshAdmin,sanctionKind};
  const legacy=window.MHUR_USER_MODERATION;
  if(legacy){
    legacy.openAdmin=openAdmin;
    legacy.showBan=()=>render(legacy.state?.record);
    legacy.showWarning=()=>render(legacy.state?.record);
  }
  window.addEventListener('mhur-moderation-live-update',event=>{void render(event.detail)});
  window.addEventListener('mhur-community-live-change',event=>{
    if(event.detail?.table==='user_moderation')setTimeout(()=>window.MHUR_USER_MODERATION?.loadSelfStatus?.(),60);
    if(event.detail?.table==='moderation_appeals')setTimeout(async()=>{
      if(sanctionKind()){await fetchAppeal();updateAppealUi()}
      if(document.getElementById('mhurAdminV51')?.open)await refreshAdmin();
    },80);
  });
  window.addEventListener('mhur-auth-change',()=>setTimeout(async()=>{const record=await window.MHUR_USER_MODERATION?.loadSelfStatus?.();await render(record)},180));
  void render(window.MHUR_USER_MODERATION?.state?.record);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
