(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const configured=Boolean(cfg.supabaseUrl&&cfg.supabaseKey);
const tr=(fr,en)=>typeof lang!=='undefined'&&lang==='en'?en:fr;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path){
  if(!configured) throw new Error(tr('Supabase non configuré.','Supabase is not configured.'));
  const token=window.MHUR_AUTH?.getAccessToken?.()||cfg.supabaseKey;
  const r=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+path,{headers:{apikey:cfg.supabaseKey,Authorization:`Bearer ${token}`}});
  if(!r.ok) throw new Error(await r.text()||`HTTP ${r.status}`);
  return r.json();
}
function modal(){
  let m=document.getElementById('mhurLeaderboardModalV355');
  if(m)return m;
  m=document.createElement('div');m.id='mhurLeaderboardModalV355';m.className='mhurHubOverlay';
  m.innerHTML='<section class="mhurHubPanel"><button class="mhurHubClose">×</button><header class="mhurHubHead"><h2></h2><p></p></header><div class="mhurHubBody"><div class="mhurLeaderboardGrid"></div></div></section>';
  m.querySelector('.mhurHubClose').onclick=()=>closeLeaderboard();m.onclick=e=>{if(e.target===m)closeLeaderboard()};document.body.appendChild(m);return m;
}
function closeLeaderboard(){document.getElementById('mhurLeaderboardModalV355')?.classList.remove('open');if(!document.querySelector('.mhurHubOverlay.open,.cbModal.open,.mhurAuthOverlay.open,.mhurPublicProfileModal.open'))document.body.classList.remove('cbModalOpen')}
async function openLeaderboard(){
  document.getElementById('drawer')?.classList.remove('open');const m=modal();m.querySelector('h2').textContent='🏆 '+tr('Classement des créateurs','Creator leaderboard');m.querySelector('.mhurHubHead p').textContent=tr('Classement calculé avec les builds publics et les likes reçus.','Ranking based on public builds and received likes.');const out=m.querySelector('.mhurLeaderboardGrid');out.innerHTML=`<div>${tr('Chargement…','Loading…')}</div>`;m.classList.add('open');document.body.classList.add('cbModalOpen');
  try{
    const rows=await api('/rest/v1/community_builds?is_hidden=eq.false&select=creator_id,likes_count,profile:profiles!community_builds_creator_profile_fkey(id,username,avatar_url,provider)&limit=1000');
    const map=new Map();for(const b of rows||[]){const id=b.creator_id||b.profile?.id;if(!id)continue;const x=map.get(id)||{id,username:b.profile?.username||tr('Utilisateur','User'),avatar:b.profile?.avatar_url||'',provider:b.profile?.provider||'',builds:0,likes:0};x.builds++;x.likes+=Number(b.likes_count||0);map.set(id,x)}
    const ranked=[...map.values()].sort((a,b)=>(b.likes-a.likes)||(b.builds-a.builds)||a.username.localeCompare(b.username)).slice(0,50);
    out.innerHTML=ranked.map((x,i)=>`<button class="mhurLeaderboardRow" onclick="MHUR_PROFILES?.open('${esc(x.id)}');MHUR_V355.closeLeaderboard()"><span class="mhurLeaderboardRank">${i<3?['🥇','🥈','🥉'][i]:i+1}</span><span class="mhurLeaderboardUser">${x.avatar?`<img class="mhurLeaderboardAvatar" src="${esc(x.avatar)}" alt="">`:`<span class="mhurLeaderboardAvatar fallback">👤</span>`}<span><b>${esc(x.username)}</b><small>${esc(x.provider||tr('Compte','Account'))} · ${x.builds} ${tr('builds','builds')}</small></span></span><span class="mhurLeaderboardScore"><b>♥ ${x.likes}</b><small>${tr('likes reçus','likes received')}</small></span></button>`).join('')||`<div>${tr('Aucun créateur classé pour le moment.','No ranked creators yet.')}</div>`;
  }catch(e){out.textContent=e.message}
}
function addNav(){
  const d=document.getElementById('drawer');if(!d)return;
  if(!d.querySelector('[data-v355-leaderboard]')){const b=document.createElement('button');b.className='navItem';b.dataset.v355Leaderboard='1';b.innerHTML='🏅 '+tr('Classement créateurs','Creator ranking');b.onclick=openLeaderboard;d.appendChild(b)}
  if(deferredPrompt&&!d.querySelector('[data-v355-install]')){const b=document.createElement('button');b.className='navItem mhurInstallButtonV355';b.dataset.v355Install='1';b.innerHTML='📲 '+tr("Installer l’application","Install the app");b.onclick=installApp;d.appendChild(b)}
}
function addHubButton(){document.querySelectorAll('.mhurHubButtons').forEach(box=>{if(box.querySelector('[data-v355-leaderboard]'))return;const b=document.createElement('button');b.dataset.v355Leaderboard='1';b.textContent='🏅 '+tr('Classement','Leaderboard');b.onclick=openLeaderboard;box.appendChild(b)})}
function profileBadges(){
  const body=document.getElementById('mhurPublicProfileBody');if(!body||body.querySelector('.mhurProfileBadgesV355'))return;
  const stats=body.querySelectorAll('.mhurProfileStats > div > b');if(stats.length<2)return;const builds=parseInt(stats[0].textContent)||0,likes=parseInt(stats[1].textContent)||0;const badges=[];
  badges.push(['👤',tr('Membre','Member'),'blue']);if(builds>=1)badges.push(['🛠️',tr('Builder','Builder'),'green']);if(builds>=5)badges.push(['📚',tr('Builder expert','Expert builder'),'gold']);if(likes>=10)badges.push(['🔥',tr('Populaire','Popular'),'pink']);if(likes>=50)badges.push(['🏆',tr('Créateur élite','Elite creator'),'gold']);
  const el=document.createElement('div');el.className='mhurProfileBadgesV355';el.innerHTML=badges.map(x=>`<span class="mhurProfileBadgeV355 ${x[2]}">${x[0]} ${x[1]}</span>`).join('');body.querySelector('.mhurPublicProfileHero')?.after(el)
}
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;addNav()});
async function installApp(){if(!deferredPrompt)return alert(tr("L’installation n’est pas disponible dans ce navigateur.","Installation is not available in this browser."));deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.querySelectorAll('[data-v355-install]').forEach(x=>x.remove())}
const observer=new MutationObserver(()=>{addNav();addHubButton();profileBadges()});observer.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{addNav();addHubButton();profileBadges()},300);
window.MHUR_V355={openLeaderboard,closeLeaderboard,installApp};
})();
