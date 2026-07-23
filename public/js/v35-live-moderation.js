(function(){
'use strict';
let timer=null,busy=false,lastSignature='';
const api=()=>window.MHUR_USER_MODERATION;
const currentUser=()=>window.MHUR_AUTH?.getUser?.()||null;
function signature(record){return JSON.stringify({w:record?.warning_message||'',wa:record?.warning_acknowledged_at||'',wc:record?.warning_created_at||'',bp:!!record?.banned_permanent,bu:record?.banned_until||'',br:record?.ban_reason||'',u:record?.updated_at||''})}
async function check(){
  if(busy||!currentUser()||!api()?.loadSelfStatus)return;
  busy=true;
  try{
    const before=lastSignature;
    const record=await api().loadSelfStatus();
    const now=signature(record);
    if(now!==before){lastSignature=now;window.dispatchEvent(new CustomEvent('mhur-moderation-live-update',{detail:record||null}))}
  }catch(error){console.warn('MHUR live moderation:',error)}finally{busy=false}
}
function start(){
  clearInterval(timer);
  check();
  timer=setInterval(check,1800);
}
window.addEventListener('mhur-auth-change',start);
window.addEventListener('focus',check);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
window.addEventListener('online',check);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
