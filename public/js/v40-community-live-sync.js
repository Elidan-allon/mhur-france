(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const KEY=String(cfg.supabaseKey||'');
const REMOTE=/^https:\/\/.+\.supabase\.co$/i.test(API)&&!!KEY;
const INTERVAL=2200;
const tables=[
  ['community_mods','id,updated_at,created_at,likes_count,downloads_count'],
  ['community_mod_comments','id,updated_at,created_at,is_hidden'],
  ['community_mod_likes','mod_id,user_id'],
  ['community_builds','id,updated_at,created_at,likes_count,is_hidden'],
  ['community_build_comments','id,updated_at,created_at,is_hidden'],
  ['community_build_reactions','build_id,user_id,reaction'],
  ['profiles','id,updated_at,username,avatar_url,role'],
  ['user_moderation','user_id,updated_at,warning_created_at,warning_acknowledged_at,banned_permanent,banned_until']
];
const signatures=new Map();
let running=false,timer=null,initialized=false;
const channel=('BroadcastChannel'in window)?new BroadcastChannel('mhur-nexus-live-v40'):null;
function authHeaders(){
  const access=window.MHUR_AUTH?.getAccessToken?.();
  return {apikey:KEY,Authorization:`Bearer ${access||KEY}`,'Cache-Control':'no-cache'};
}
async function signature(table,select){
  const url=`${API}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${table==='user_moderation'?'user_id':'id'}.asc`;
  const r=await fetch(url,{headers:authHeaders(),cache:'no-store'});
  if(!r.ok){if(r.status===404||r.status===400)return null;throw new Error(`${table}: ${r.status}`)}
  const rows=await r.json();
  return JSON.stringify(rows||[]);
}
function announce(table){
  const detail={table,at:Date.now()};
  window.dispatchEvent(new CustomEvent('mhur-community-live-change',{detail}));
  try{channel?.postMessage(detail)}catch(_){}
}
function refreshMods(){
  const api=window.MHUR_MODS;
  if(!api)return;
  api.refresh?.();
  if(api.state?.active&&document.getElementById('modsDetailModal')&&!document.getElementById('modsDetailModal').hidden){
    setTimeout(()=>api.openDetail?.(api.state.active.id),120);
  }
}
function refreshBuilds(){
  const api=window.MHUR_COMMUNITY_BUILDS;
  if(!api)return;
  if(api.state?.cache)Object.keys(api.state.cache).forEach(k=>delete api.state.cache[k]);
  api.refresh?.();
}
function refreshProfiles(){
  window.dispatchEvent(new CustomEvent('mhur-profiles-live-change'));
  if(document.getElementById('mhurProfilesDirectoryV30')?.classList.contains('open'))window.MHUR_PROFILE_DIRECTORY?.open?.();
}
function refreshModeration(){window.MHUR_USER_MODERATION?.loadSelfStatus?.()}
function apply(table){
  if(table.startsWith('community_mod'))refreshMods();
  if(table.startsWith('community_build'))refreshBuilds();
  if(table==='profiles')refreshProfiles();
  if(table==='user_moderation')refreshModeration();
}
async function tick(){
  if(!REMOTE||running||document.hidden)return;
  running=true;
  try{
    for(const [table,select] of tables){
      try{
        const next=await signature(table,select);
        if(next===null)continue;
        const prev=signatures.get(table);
        signatures.set(table,next);
        if(initialized&&prev!==undefined&&prev!==next){announce(table);apply(table)}
      }catch(error){console.debug('MHUR live sync:',error.message||error)}
    }
    initialized=true;
  }finally{running=false}
}
function start(){clearInterval(timer);tick();timer=setInterval(tick,INTERVAL)}
channel?.addEventListener('message',event=>{if(event.data?.table)apply(event.data.table)});
window.addEventListener('mhur-community-live-change',event=>apply(event.detail?.table||''));
window.addEventListener('mhur-auth-change',()=>{signatures.clear();initialized=false;start()});
window.addEventListener('focus',tick);
window.addEventListener('online',tick);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.MHUR_LIVE_SYNC_V40={tick,start,interval:INTERVAL};
})();
