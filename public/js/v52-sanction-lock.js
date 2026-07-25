(()=>{
  'use strict';
  const KEY='mhur_active_ban_v52';
  let trapped=false;
  const user=()=>window.MHUR_AUTH?.getUser?.()||null;
  const parse=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}};
  const valid=lock=>{
    if(!lock||!['temporary','permanent'].includes(lock.kind))return false;
    if(lock.kind==='permanent')return true;
    const until=Date.parse(lock.banned_until||'');
    return Number.isFinite(until)&&until>Date.now();
  };
  const asRecord=lock=>lock?{
    banned_permanent:lock.kind==='permanent',
    banned_until:lock.banned_until||null,
    ban_reason:lock.message||'',
    banned_at:lock.created_at||lock.saved_at||new Date().toISOString(),
    sanction_id:lock.sanction_id||`device-${lock.saved_at||Date.now()}`,
    updated_at:lock.saved_at||new Date().toISOString()
  }:null;
  function save(record){
    const permanent=Boolean(record?.banned_permanent);
    const until=Date.parse(record?.banned_until||'');
    if(!permanent&&(!Number.isFinite(until)||until<=Date.now()))return clear();
    const lock={
      kind:permanent?'permanent':'temporary',
      banned_until:permanent?null:record.banned_until,
      message:record.ban_reason||'',created_at:record.banned_at||record.updated_at||new Date().toISOString(),
      sanction_id:record.sanction_id||'',saved_at:new Date().toISOString()
    };
    try{localStorage.setItem(KEY,JSON.stringify(lock))}catch(_){}
    document.documentElement.classList.add('mhurSanctionLockedV52');
    trapHistory();
  }
  function clear(){
    try{localStorage.removeItem(KEY)}catch(_){}
    document.documentElement.classList.remove('mhurSanctionLockedV52');
  }
  function trapHistory(){
    if(trapped)return;trapped=true;
    try{history.pushState({mhurBanGuard:true},'',location.href)}catch(_){}
  }
  function forceFromDevice(){
    const lock=parse();
    if(!valid(lock)){if(lock)clear();return false}
    document.documentElement.classList.add('mhurSanctionLockedV52');
    trapHistory();
    const render=window.MHUR_MODERATION_V51?.render;
    if(render)void render(asRecord(lock));
    return true;
  }
  function inspect(record){
    const permanent=Boolean(record?.banned_permanent);
    const until=Date.parse(record?.banned_until||'');
    const active=permanent||(Number.isFinite(until)&&until>Date.now());
    if(active){save(record);return}
    /* On efface uniquement après une vérification authentifiée. Une déconnexion
       ou un retour navigateur ne doit jamais retirer le verrou local. */
    if(user())clear();
    else forceFromDevice();
  }
  addEventListener('popstate',()=>{
    if(forceFromDevice()){
      try{history.pushState({mhurBanGuard:true},'',location.href)}catch(_){}
    }
  });
  addEventListener('pageshow',()=>setTimeout(forceFromDevice,0));
  addEventListener('focus',()=>setTimeout(forceFromDevice,0));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)forceFromDevice()});
  addEventListener('storage',event=>{if(event.key===KEY)forceFromDevice()});
  addEventListener('mhur-moderation-live-update',event=>inspect(event.detail));
  addEventListener('mhur-auth-change',()=>setTimeout(()=>{
    const record=window.MHUR_USER_MODERATION?.state?.record;
    if(record)inspect(record);else forceFromDevice();
  },250));

  function hook(){
    const api=window.MHUR_MODERATION_V51;
    if(api&&!api.__v52Hooked){
      api.__v52Hooked=true;
      const original=api.render;
      api.render=async record=>{
        if(record)inspect(record);
        else if(!user()&&valid(parse()))record=asRecord(parse());
        const result=await original(record);
        const lock=parse();
        if(valid(lock))document.documentElement.classList.add('mhurSanctionLockedV52');
        return result;
      };
    }
    forceFromDevice();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook,{once:true});else hook();
  setTimeout(hook,50);setTimeout(hook,300);setInterval(()=>{
    const lock=parse();
    if(lock?.kind==='temporary'&&!valid(lock)){
      clear();
      window.MHUR_USER_MODERATION?.loadSelfStatus?.();
    }else if(valid(lock))forceFromDevice();
  },1000);
})();
