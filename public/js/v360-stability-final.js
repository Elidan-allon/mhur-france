(function(){
'use strict';
const RELEASE='360';
const isEN=()=>typeof lang!=='undefined'&&lang==='en';
const tr=(fr,en)=>isEN()?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.MHUR_RELEASE=RELEASE;

async function clearOldRuntime(){
  try{if('serviceWorker'in navigator){for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();}}catch(_){}
  try{if('caches'in window){for(const k of await caches.keys())await caches.delete(k);}}catch(_){}
}
clearOldRuntime();

/* OAuth: return to the production root, then perform one clean reload only after the session is stored. */
function patchAuth(){
  const auth=window.MHUR_AUTH, cfg=window.MHUR_COMMUNITY_CONFIG||{};
  if(!auth||auth.__v360)return false;
  auth.__v360=true;
  auth.login=function(provider){
    const base=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
    if(!base||!cfg.supabaseKey){auth.open?.();return;}
    sessionStorage.setItem('mhur_oauth_pending_v360','1');
    const callback=new URL('/',location.origin);
    callback.searchParams.set('release',RELEASE);
    callback.searchParams.set('oauth','1');
    callback.searchParams.set('ts',Date.now().toString());
    location.href=`${base}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(callback.href)}`;
  };
  window.addEventListener('mhur-auth-change',()=>{
    if(sessionStorage.getItem('mhur_oauth_pending_v360')==='1' && auth.getUser?.()){
      sessionStorage.removeItem('mhur_oauth_pending_v360');
      sessionStorage.setItem('mhur_oauth_clean_reload_v360','1');
      clearOldRuntime().finally(()=>location.replace('/?release='+RELEASE+'&connected=1#home'));
    }
  });
  return true;
}
patchAuth(); setTimeout(patchAuth,100);

/* Prevent a character click from freezing the whole application. */
function installSafeNavigation(){
  if(typeof selectChar==='function'&&!selectChar.__v360){
    const fn=function(id){
      try{
        const c=(characters||[]).find(x=>x&&x.id===id);
        if(!c)throw new Error('Character not found: '+id);
        selectedChar=id;
        const valid=(c.styles||[]).filter(s=>styles&&styles[s]);
        selectedStyle=valid.length===1?valid[0]:null;
        if(!valid.length)selectedStyle=null;
        render();
      }catch(e){showSafeError(e);}
    };fn.__v360=true;selectChar=fn;
  }
  if(typeof selectStyle==='function'&&!selectStyle.__v360){
    const fn=function(s){try{if(!styles?.[s])throw new Error('Style not found: '+s);selectedStyle=s;render();}catch(e){showSafeError(e)}};fn.__v360=true;selectStyle=fn;
  }
  if(typeof stylePicker==='function'&&!stylePicker.__v360){
    const old=stylePicker;const fn=function(){try{return old()}catch(e){return safeErrorHtml(e)}};fn.__v360=true;stylePicker=fn;
  }
  if(typeof characterDetail==='function'&&!characterDetail.__v360){
    const old=characterDetail;const fn=function(s){try{if(!styles?.[s])throw new Error('Missing character style data');return old(s)}catch(e){return safeErrorHtml(e)}};fn.__v360=true;characterDetail=fn;
  }
  if(typeof render==='function'&&!render.__v360){
    const old=render;const fn=function(){try{const r=old();queueTranslate();return r}catch(e){showSafeError(e)}};fn.__v360=true;render=fn;
  }
}
function safeErrorHtml(e){return `<div class="homeBox mhurSafeError"><h2>${tr('La fiche ne peut pas être affichée','This page could not be displayed')}</h2><p>${esc(e?.message||e)}</p><button class="back" onclick="selectedChar=null;selectedStyle=null;page='characters';render()">← ${tr('Retour aux personnages','Back to characters')}</button></div>`}
function showSafeError(e){console.error('[MHUR V360]',e);const app=document.getElementById('app');if(app)app.innerHTML=safeErrorHtml(e)}

/* Exact English records bundled with the site. */
let exactData=null, localMap=null;
function readExact(){
  if(exactData)return exactData;
  try{exactData=JSON.parse(document.getElementById('ultrarumble-exact-data')?.textContent||'{}')}catch(_){exactData={}}
  return exactData;
}
async function loadLocalMap(){if(localMap)return localMap;try{localMap=await fetch('data/local_style_map.json?v='+RELEASE,{cache:'no-store'}).then(r=>r.json())}catch(_){localMap=[]}return localMap}
function exactForStyle(styleKey){
  const map=(localMap||[]).find(x=>x.style_key===styleKey);
  if(!map)return null;
  const rows=readExact().characters||[];
  return rows.find(x=>x.base_name===map.character_name&&x.style_name===map.style_name)
    || rows.find(x=>x.base_name===map.character_name&&String(x.role)===String(map.role));
}
function currentExact(){return selectedStyle?exactForStyle(selectedStyle):null}

const phrasePairs=[
['Rôle','Role'],['Compétence','Skill'],['COMPÉTENCE','SKILL'],['Alter','Quirk Skills'],['PV','HP'],['Héros','Heroes'],['HÉROS','HEROES'],['Super-vilain','Villain'],['SUPER-VILAIN','VILLAIN'],['Vilain','Villain'],['Assaut','Assault'],['Attaque','Strike'],['Vitesse','Rapid'],['Technique','Technical'],['Soutien','Support'],
['Filtres costumes','Costume filters'],['Rareté','Rarity'],['Toutes','All'],['Tous','All'],['Réinitialiser','Reset'],['SP gauche','Left SP'],['SP droite','Right SP'],['Condition droite','Right condition'],['Résumé slots','Slot summary'],['Costumes','Costumes'],['Costume','Costume'],['Variantes','Variants'],['Description','Description'],
['Compétence T.U.N.I.N.G SP gauche','Left SP T.U.N.I.N.G skill'],['Compétence T.U.N.I.N.G SP droite','Right SP T.U.N.I.N.G skill'],['Compétence T.U.N.I.N.G SP','SP T.U.N.I.N.G skill'],['Compétence T.U.N.I.N.G','T.U.N.I.N.G skill'],['T.U.N.I.N.G compatibles','Compatible T.U.N.I.N.G'],['Choix compatible','Compatible choice'],['Aucun T.U.N.I.N.G compatible.','No compatible T.U.N.I.N.G.'],['Éclat de souvenir de','Memory Shard of'],
['Disponible selon la couleur du slot gauche','Available for the left slot color'],['Disponible selon la couleur du slot droite','Available for the right slot color'],['Sans condition','No condition'],['Slot gauche','Left slot'],['Slot droit','Right slot'],['Clique sur un emplacement pour afficher les T.U.N.I.N.G compatibles.','Select a slot to display compatible T.U.N.I.N.G.'],['Les emplacements normaux suivent aussi la couleur du slot. Clique sur une bande pour voir les T.U.N.I.N.G compatibles.','Normal slots also follow their color. Select a band to view compatible T.U.N.I.N.G.']
];
const replacements=[
[/Réduit les dégâts subis par l['’]Alter/gi,'Reduces damage taken from Quirk Skill'],[/Augmente les dégâts infligés par l['’]Alter/gi,'Increases damage dealt by Quirk Skill'],[/Augmente la puissance d['’]attaque/gi,'Increases attack power'],[/Augmente la défense/gi,'Increases defense'],[/Augmente la vitesse de rechargement/gi,'Increases reload speed'],[/Augmente la vitesse de déplacement/gi,'Increases movement speed'],[/Augmente la vitesse de course/gi,'Increases running speed'],[/Augmente la hauteur du saut vertical/gi,'Increases vertical jump height'],[/Augmente la hauteur du saut en avant/gi,'Increases forward jump height'],[/Défense de l['’]Alter/gi,'Quirk Skill Defense'],[/Puissance d['’]attaque de l['’]Alter/gi,'Quirk Skill Attack Power'],[/Rechargement de l['’]Alter/gi,'Quirk Skill Reload'],[/Tenue de Héros/gi,'Hero Costume'],[/Tenue de Super-vilain/gi,'Villain Costume'],[/Tenue ordinaire/gi,'Casual Outfit'],[/Tenue de tous les jours/gi,'Everyday Outfit']
];
function translateText(s,costume){
  let out=String(s??'');if(!isEN())return out;
  try{if(costume&&window.MHUR_TRANSLATE_COSTUME_TEXT)out=window.MHUR_TRANSLATE_COSTUME_TEXT(out);else if(window.MHUR_TRANSLATE_GAME_TEXT)out=window.MHUR_TRANSLATE_GAME_TEXT(out)}catch(_){}
  for(const [fr,en]of phrasePairs){if(out===fr)out=en;else out=out.replaceAll(fr,en)}
  for(const [a,b]of replacements)out=out.replace(a,b);
  return out;
}
function applyExactCharacterEnglish(){
  if(!isEN()||page!=='characters'||!selectedStyle)return;
  const ex=currentExact();if(!ex)return;
  const app=document.getElementById('app');if(!app)return;
  const title=app.querySelector('.charTop .meta h2');if(title)title.textContent=ex.name||ex.base_name||title.textContent;
  const styleLine=[...app.querySelectorAll('.charTop .meta p')].find(x=>/^Style\s*:/i.test(x.textContent));if(styleLine)styleLine.innerHTML='<b>Style:</b> '+esc(ex.style_name||'Original');
  const cards=[...app.querySelectorAll('.skillCard,.quirkCard,.gameSkill,.skillBlock')];
  const vals=['α','β','γ']; cards.slice(-3).forEach((card,i)=>{const sk=ex.skills?.[vals[i]];if(!sk)return;const h=card.querySelector('h2,h3,.skillName,.gameName');if(h)h.textContent=(vals[i]+' — '+sk.name);const p=card.querySelector('p,.skillDesc,.gameText');if(p&&sk.description)p.textContent=sk.description});
}
let translateQueued=false;
function queueTranslate(){if(translateQueued)return;translateQueued=true;requestAnimationFrame(()=>{translateQueued=false;translateDom()})}
function translateDom(){
  if(!isEN())return;
  const root=document.getElementById('app')||document.body;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while((n=walker.nextNode())){
    if(n.parentElement?.closest('script,style,textarea,input,[contenteditable=true]'))continue;
    const raw=n.nodeValue||'', core=raw.trim();if(!core)continue;
    const costume=!!n.parentElement?.closest('.costumeTile,.costumeDetail,.gameCostumeScreen,.costumeGalleryGroup,.inlineCostumeFilters');
    const out=translateText(core,costume);if(out!==core)n.nodeValue=raw.replace(core,out);
  }
  document.querySelectorAll('option').forEach(o=>{o.textContent=translateText(o.textContent,true)});
  applyExactCharacterEnglish();
}

/* Exclude every normal and SP tuning belonging to the selected character family, across all styles. */
function familyForStyle(styleKey){
  const key=String(styleKey||'');const c=(characters||[]).find(x=>(x.styles||[]).includes(key));
  return String(c?.id||key).replace(/_ofa$/,'').replace(/_young$/,'');
}
function selectedFamily(){return String(selectedChar||window.CB_STATE?.draft?.characterId||'').replace(/_ofa$/,'').replace(/_young$/,'')}
function patchCompatible(){
  if(typeof compatibleTunings!=='function'||compatibleTunings.__v360)return;
  const base=compatibleTunings;const fn=function(){const f=selectedFamily();return (base.apply(this,arguments)||[]).filter(t=>!f||familyForStyle(t?.styleKey)!==f)};fn.__v360=true;compatibleTunings=fn;
}

/* Leaderboard without a PostgREST foreign-key relationship. */
async function api(path){const cfg=window.MHUR_COMMUNITY_CONFIG||{};const token=window.MHUR_AUTH?.getAccessToken?.()||cfg.supabaseKey;const r=await fetch(String(cfg.supabaseUrl||'').replace(/\/$/,'')+path,{cache:'no-store',headers:{apikey:cfg.supabaseKey,Authorization:'Bearer '+token}});if(!r.ok)throw new Error(await r.text()||('HTTP '+r.status));return r.json()}
async function openLeaderboard(){
  document.getElementById('drawer')?.classList.remove('open');
  const old=window.MHUR_V355;let modal=document.getElementById('mhurLeaderboardModalV355');
  if(!modal){old?.openLeaderboard?.();modal=document.getElementById('mhurLeaderboardModalV355')}
  if(!modal)return;
  modal.querySelector('h2').textContent='🏆 '+tr('Classement des créateurs','Creator leaderboard');modal.querySelector('.mhurHubHead p').textContent=tr('Classement calculé avec les builds publics et les likes reçus.','Ranking based on public builds and received likes.');modal.classList.add('open');document.body.classList.add('cbModalOpen');
  const out=modal.querySelector('.mhurLeaderboardGrid');out.textContent=tr('Chargement…','Loading…');
  try{
    const builds=await api('/rest/v1/community_builds?is_hidden=eq.false&select=creator_id,likes_count&limit=1000');
    const ids=[...new Set((builds||[]).map(b=>b.creator_id).filter(Boolean))];
    let profiles=[];if(ids.length){const encoded=ids.map(id=>'"'+String(id).replace(/"/g,'')+'"').join(',');profiles=await api('/rest/v1/profiles?id=in.('+encodeURIComponent(encoded)+')&select=id,username,avatar_url,provider')}
    const pmap=new Map((profiles||[]).map(p=>[p.id,p]));const map=new Map();
    for(const b of builds||[]){if(!b.creator_id)continue;const p=pmap.get(b.creator_id)||{};const x=map.get(b.creator_id)||{id:b.creator_id,username:p.username||tr('Utilisateur','User'),avatar:p.avatar_url||'',provider:p.provider||'',builds:0,likes:0};x.builds++;x.likes+=Number(b.likes_count||0);map.set(b.creator_id,x)}
    const ranked=[...map.values()].sort((a,b)=>(b.likes-a.likes)||(b.builds-a.builds)||a.username.localeCompare(b.username)).slice(0,50);
    out.innerHTML=ranked.map((x,i)=>`<button class="mhurLeaderboardRow" data-profile="${esc(x.id)}"><span class="mhurLeaderboardRank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="mhurLeaderboardUser">${x.avatar?`<img class="mhurLeaderboardAvatar" src="${esc(x.avatar)}" alt="">`:'<span class="mhurLeaderboardAvatar fallback">👤</span>'}<span><b>${esc(x.username)}</b><small>${esc(x.provider||tr('Compte','Account'))} · ${x.builds} builds</small></span></span><span class="mhurLeaderboardScore"><b>♥ ${x.likes}</b><small>${tr('likes reçus','likes received')}</small></span></button>`).join('')||`<div>${tr('Aucun créateur classé pour le moment.','No ranked creators yet.')}</div>`;
    out.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{window.MHUR_PROFILES?.open(b.dataset.profile);window.MHUR_V355?.closeLeaderboard?.()});
  }catch(e){console.error(e);out.innerHTML=`<div class="mhurLeaderboardError">${tr('Impossible de charger le classement. Vérifie que les tables community_builds et profiles existent.','Unable to load the leaderboard. Check that the community_builds and profiles tables exist.')}</div>`}
}
function patchLeaderboard(){if(window.MHUR_V355){window.MHUR_V355.openLeaderboard=openLeaderboard}document.querySelectorAll('[data-v355-leaderboard]').forEach(b=>b.onclick=openLeaderboard)}

/* Always show installation. iOS uses Add to Home Screen; Chromium uses the native prompt. */
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;ensureInstallButton()});
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function showInstallHelp(){
  if(installPrompt){installPrompt.prompt();installPrompt.userChoice.finally(()=>{installPrompt=null});return}
  const text=isIOS()?tr('Sur iPhone : ouvre le bouton Partager de Safari, puis choisis « Sur l’écran d’accueil ».','On iPhone: open Safari’s Share button, then choose “Add to Home Screen”.'):tr('Ouvre le menu du navigateur puis choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».','Open the browser menu, then choose “Install app” or “Add to Home Screen”.');
  alert(text);
}
function ensureInstallButton(){
  const d=document.getElementById('drawer');if(!d)return;
  let b=d.querySelector('[data-v360-install]');if(!b){b=document.createElement('button');b.className='navItem mhurInstallButtonV360';b.dataset.v360Install='1';d.appendChild(b)}
  b.innerHTML='📲 '+tr("Installer l’application",'Install the app');b.onclick=showInstallHelp;
}

const observer=new MutationObserver(()=>{clearTimeout(observer.t);observer.t=setTimeout(()=>{ensureInstallButton();patchLeaderboard();patchCompatible();queueTranslate()},60)});observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',async()=>{await loadLocalMap();installSafeNavigation();patchCompatible();patchLeaderboard();ensureInstallButton();queueTranslate()});
setTimeout(async()=>{await loadLocalMap();installSafeNavigation();patchCompatible();patchLeaderboard();ensureInstallButton();queueTranslate()},300);
if(typeof toggleLang==='function'&&!toggleLang.__v360){const old=toggleLang;const fn=function(){const r=old();setTimeout(()=>{ensureInstallButton();queueTranslate()},0);return r};fn.__v360=true;toggleLang=fn}
window.MHUR_V360={openLeaderboard,showInstallHelp};
})();
