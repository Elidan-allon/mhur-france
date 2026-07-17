(function(){
'use strict';
const RELEASE='358';

// Supprime les anciennes PWA et tous les caches avant/après un retour OAuth.
async function purgeOldVersions(){
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }catch(e){console.warn('[V358 cache cleanup]',e)}
}
purgeOldVersions();

// Remplace réellement la connexion après le chargement de community-auth.js.
function installAuthFix(){
  if(!window.MHUR_AUTH)return false;
  window.MHUR_AUTH.login=function(provider){
    const cfg=window.MHUR_COMMUNITY_CONFIG||{};
    const base=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
    const key=String(cfg.supabaseKey||'').trim();
    if(!/^https:\/\/.+\.supabase\.co$/i.test(base)||!key){window.MHUR_AUTH.open?.();return}
    const callback=new URL(location.origin+location.pathname);
    callback.searchParams.set('auth_return','1');
    callback.searchParams.set('v',RELEASE);
    const target=`${base}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(callback.href)}`;
    location.replace(target);
  };
  return true;
}
if(!installAuthFix()) document.addEventListener('DOMContentLoaded',installAuthFix,{once:true});

// Ne laisse jamais une référence de style invalide faire disparaître la page entière.
window.stylePicker=function(){
  const list=Array.isArray(window.characters)?window.characters:(typeof characters!=='undefined'?characters:[]);
  const map=window.styles||(typeof styles!=='undefined'?styles:{});
  const c=list.find(x=>x&&x.id===selectedChar);
  if(!c)return `<button class="back" onclick="selectedChar=null;selectedStyle=null;render()">← Retour</button><div class="homeBox"><h2>Personnage introuvable</h2></div>`;
  const valid=(Array.isArray(c.styles)?c.styles:[]).filter(id=>id&&map[id]);
  if(valid.length===1){selectedStyle=valid[0];return window.characterDetail(valid[0])}
  if(!valid.length)return `<button class="back" onclick="selectedChar=null;selectedStyle=null;render()">← Retour</button><h1 class="title">${c.name||'Personnage'}</h1><div class="homeBox">Aucun style valide n'est disponible.</div>`;
  return `<button class="back" onclick="selectedChar=null;selectedStyle=null;render()">← ${typeof tr==='function'?tr('back'):'Retour'}</button><h1 class="title">${c.name||'Personnage'}</h1><div class="styleGrid">${valid.map(id=>{const st=map[id]||{};let pic='',nm=id,badges='';try{pic=typeof asset==='function'?asset(st.portrait||c.portrait||'',c.name):''}catch(_){}try{nm=typeof label==='function'?(label(st.name)||id):id}catch(_){}try{badges=(typeof sideBadge==='function'?sideBadge(c.side):'')+(typeof roleBadge==='function'?roleBadge(st.role||'assault'):'')}catch(_){}return `<button class="styleCard" data-style="${id}" onclick="selectedStyle='${id}';render()"><div class="styleBanner">${pic}</div><div class="styleInfo"><h2>${nm}</h2><div class="badges">${badges}</div></div></button>`}).join('')}</div>`;
};

window.characterDetail=function(styleId){
  try{
    const map=window.styles||(typeof styles!=='undefined'?styles:{});
    const list=Array.isArray(window.characters)?window.characters:(typeof characters!=='undefined'?characters:[]);
    const st=map[styleId];
    if(!st)throw new Error('style absent: '+styleId);
    const ch=list.find(x=>Array.isArray(x?.styles)&&x.styles.includes(styleId))||{name:'Personnage'};
    const lab=v=>{try{return typeof label==='function'?label(v):(v?.fr||v?.en||v||'')}catch(_){return v?.fr||v?.en||String(v||'')}};
    const a=(src,alt)=>{try{return typeof asset==='function'?asset(src||'',alt||''):''}catch(_){return ''}};
    const rb=()=>{try{return typeof roleBadge==='function'?roleBadge(st.role||'assault'):''}catch(_){return ''}};
    let special='';try{if(st.special&&typeof skillSection==='function')special=skillSection({letter:'SP',...st.special},true)}catch(e){console.warn(e)}
    const skills=(Array.isArray(st.skills)?st.skills:[]).map(k=>{try{return k&&typeof skillSection==='function'?skillSection(k,false):''}catch(e){console.warn(e);return ''}}).join('');
    return `<button class="back" onclick="selectedStyle=null;render()">← ${typeof tr==='function'?tr('back'):'Retour'}</button><div class="charPanel role-${st.role||'assault'}"><div class="charTop"><div class="portrait">${a(st.portrait||ch.portrait,'portrait')}</div><div class="meta"><h2>${ch.name||'Personnage'}</h2><div class="badges">${rb()}<span class="badge">PV : ${st.pv||'—'}</span></div><p><b>Style :</b> ${lab(st.name)||styleId}</p><p>${lab(st.description)||''}</p><p><b>Rôle :</b> ${lab(st.roleDesc)||''}</p></div></div>${special}<h2 style="padding:0 16px;color:#000">Alter</h2>${skills||'<div class="homeBox">Les compétences de ce style ne sont pas encore disponibles.</div>'}</div>`;
  }catch(e){
    console.error('[V358 character]',e);
    return `<button class="back" onclick="selectedStyle=null;selectedChar=null;render()">← Retour</button><div class="homeBox"><h2>Impossible d'afficher ce personnage</h2><p>Une donnée de ce style est manquante, mais le site reste utilisable.</p></div>`;
  }
};

// Au retour OAuth, nettoie l'URL et recharge une seule fois depuis le réseau.
document.addEventListener('DOMContentLoaded',async()=>{
  const q=new URLSearchParams(location.search);
  if(q.get('auth_return')==='1' && sessionStorage.getItem('mhur_v358_oauth_reload')!=='1'){
    sessionStorage.setItem('mhur_v358_oauth_reload','1');
    await purgeOldVersions();
    location.reload();
  }else if(q.get('auth_return')!=='1') sessionStorage.removeItem('mhur_v358_oauth_reload');
});
})();
