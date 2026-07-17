(function(){
'use strict';
const RELEASE='357';

// Supprime définitivement les anciens caches/PWA qui pouvaient réafficher une vieille version après OAuth.
async function purgeLegacyPwa(){
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }catch(_){/* le site doit rester utilisable même si le navigateur refuse */}
}
purgeLegacyPwa();

// Force le retour OAuth vers la version réseau actuelle, jamais vers une ancienne page mise en cache.
if(window.MHUR_AUTH && typeof window.MHUR_AUTH.login==='function'){
  window.MHUR_AUTH.login=function(provider){
    const cfg=window.MHUR_COMMUNITY_CONFIG||{};
    const url=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
    const key=String(cfg.supabaseKey||'').trim();
    const configured=/^https:\/\/.+\.supabase\.co$/i.test(url)&&!!key;
    if(!configured){window.MHUR_AUTH.open?.();return;}
    const cleanPath=location.pathname.replace(/\/+$/,'/')||'/';
    const redirect=`${location.origin}${cleanPath}?auth_return=1&release=${RELEASE}`;
    location.assign(`${url}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(redirect)}`);
  };
}

// Rendu défensif des personnages : une donnée manquante ne peut plus casser toute la page.
const oldCharacterDetail=window.characterDetail;
window.characterDetail=function(styleId){
  try{
    const st=(typeof styles!=='undefined'&&styles)?styles[styleId]:null;
    if(!st){
      return `<button class="back" onclick="selectedStyle=null;render()">← Retour</button><div class="homeBox"><h2>Données indisponibles</h2><p>Ce style n'a pas encore toutes ses données. Le reste du site reste accessible.</p></div>`;
    }
    const roleKey=st.role||'assault';
    const ch=(typeof characters!=='undefined'?characters:[]).find(x=>Array.isArray(x.styles)&&x.styles.includes(styleId))||{name:'Personnage'};
    const safeLabel=v=>{try{return typeof label==='function'?label(v):(v?.fr||v?.en||v||'')}catch(_){return v?.fr||v?.en||String(v||'')}};
    const safeAsset=(src,alt)=>{try{return typeof asset==='function'?asset(src,alt):''}catch(_){return ''}};
    const safeRoleBadge=()=>{try{return typeof roleBadge==='function'?roleBadge(roleKey):''}catch(_){return ''}};
    const safeSkill=k=>{try{return k&&typeof skillSection==='function'?skillSection(k,false):''}catch(_){return ''}};
    let special='';
    try{if(st.special&&typeof skillSection==='function')special=skillSection({letter:'SP',...st.special},true)}catch(_){special=''}
    const skills=Array.isArray(st.skills)?st.skills:[];
    return `<button class="back" onclick="selectedStyle=null;if((characters.find(x=>x.id===selectedChar)||{}).styles?.length===1)selectedChar=null;render()">← ${typeof tr==='function'?tr('back'):'Retour'}</button><div class="charPanel role-${roleKey}"><div class="charTop"><div class="portrait">${safeAsset(st.portrait,'portrait')}</div><div class="meta"><h2>${ch.name||'Personnage'}</h2><div class="badges">${safeRoleBadge()}<span class="badge">PV : ${st.pv||'—'}</span></div><p><b>Style :</b> ${safeLabel(st.name)||styleId}</p><p>${safeLabel(st.description)||''}</p><p><b>Rôle :</b> ${safeLabel(st.roleDesc)||''}</p></div></div>${special}<h2 style="padding:0 16px;color:#000">Alter</h2>${skills.map(safeSkill).join('')||'<div class="homeBox">Données de compétences en cours de chargement.</div>'}</div>`;
  }catch(error){
    console.error('[V357 character detail]',error);
    if(typeof oldCharacterDetail==='function'){
      try{return oldCharacterDetail(styleId)}catch(_){/* fallback ci-dessous */}
    }
    return `<button class="back" onclick="selectedStyle=null;render()">← Retour</button><div class="homeBox"><h2>Impossible d'afficher ce style</h2><p>Retourne à la liste des personnages puis réessaie.</p></div>`;
  }
};

// Protège aussi le sélecteur de styles contre une entrée absente.
const oldStylePicker=window.stylePicker;
window.stylePicker=function(){
  try{
    const c=(typeof characters!=='undefined'?characters:[]).find(x=>x.id===selectedChar);
    if(!c)return `<button class="back" onclick="selectedChar=null;render()">← Retour</button><div class="homeBox">Personnage introuvable.</div>`;
    const valid=(Array.isArray(c.styles)?c.styles:[]).filter(id=>typeof styles!=='undefined'&&styles[id]);
    if(valid.length===1){selectedStyle=valid[0];return window.characterDetail(valid[0]);}
    if(!valid.length)return `<button class="back" onclick="selectedChar=null;render()">← Retour</button><h1 class="title">${c.name}</h1><div class="homeBox">Aucun style disponible pour le moment.</div>`;
    return oldStylePicker();
  }catch(error){console.error('[V357 style picker]',error);return `<button class="back" onclick="selectedChar=null;render()">← Retour</button><div class="homeBox">Impossible d'afficher les styles.</div>`}
};
})();
