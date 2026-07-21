(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(cfg.supabaseUrl||'').replace(/\/+$/,'');
const KEY=String(cfg.supabaseKey||'').trim();
const remote=/^https:\/\/.+\.supabase\.co$/i.test(API)&&!!KEY;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tx=(fr,en)=>typeof lang!=='undefined'&&lang==='en'?en:fr;
const user=()=>window.MHUR_AUTH?.getUser?.()||null;
async function req(path,opt={}){
  const headers={...(opt.headers||{})};
  if(opt.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
  const runner=window.MHUR_AUTH?.fetch||fetch;
  const r=await runner(API+path,{...opt,headers});const text=await r.text();let data=null;
  try{data=text?JSON.parse(text):null}catch(_){data=text}
  if(!r.ok)throw new Error(data?.message||data?.hint||text||`HTTP ${r.status}`);return data;
}
function overlay(id,title,subtitle=''){
  let m=document.getElementById(id);
  if(!m){m=document.createElement('div');m.id=id;m.className='mhurPlusOverlay';m.addEventListener('click',e=>{if(e.target===m)close(id)});document.body.appendChild(m)}
  m.innerHTML=`<section class="mhurPlusPanel"><button class="mhurPlusClose" data-plus-close>×</button><header><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</header><div class="mhurPlusBody"></div></section>`;
  m.querySelector('[data-plus-close]').onclick=()=>close(id);return m;
}
function open(id){document.getElementById(id)?.classList.add('open');document.body.classList.add('cbModalOpen')}
function close(id){document.getElementById(id)?.classList.remove('open');if(!document.querySelector('.mhurPlusOverlay.open,.cbModal.open,.modsModal:not([hidden]),.mhurAuthOverlay.open'))document.body.classList.remove('cbModalOpen')}
function toast(message){let t=document.getElementById('mhurPlusToast');if(!t){t=document.createElement('div');t.id='mhurPlusToast';t.className='mhurPlusToast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2600)}

const reactions={
  types:[['useful','👍',tx('Utile','Useful')],['tested','🎮',tx('Testé en partie','Tested in game')],['recommended','🏆',tx('Recommandé','Recommended')],['outdated','⚠️',tx('Ne fonctionne plus','No longer works')]],
  async mount(build){const root=document.getElementById('mhurBuildReactionsMount');if(!root)return;root.innerHTML=`<section class="mhurBuildReactions"><h3>${tx('Avis de la communauté','Community feedback')}</h3><div class="mhurReactionButtons">${this.types.map(x=>`<button disabled>${x[1]} ${esc(x[2])}</button>`).join('')}</div></section>`;if(!remote||!/^[0-9a-f-]{36}$/i.test(build.id))return;try{const rows=await req(`/rest/v1/community_build_reactions?build_id=eq.${encodeURIComponent(build.id)}&select=user_id,reaction`);const counts={};const mine=new Set();for(const r of rows||[]){counts[r.reaction]=(counts[r.reaction]||0)+1;if(user()?.id===r.user_id)mine.add(r.reaction)}root.innerHTML=`<section class="mhurBuildReactions"><h3>${tx('Avis de la communauté','Community feedback')}</h3><div class="mhurReactionButtons">${this.types.map(([key,icon,label])=>`<button class="${mine.has(key)?'active':''}" data-reaction="${key}">${icon} ${esc(label)} <b>${counts[key]||0}</b></button>`).join('')}</div></section>`;root.querySelectorAll('[data-reaction]').forEach(b=>b.onclick=()=>this.toggle(build,b.dataset.reaction));}catch(e){root.innerHTML=''}},
  async toggle(build,type){if(!window.MHUR_AUTH?.requireLogin?.(tx('Connecte-toi pour donner ton avis.','Sign in to react.')))return;try{const uid=user().id;const q=`build_id=eq.${encodeURIComponent(build.id)}&user_id=eq.${uid}&reaction=eq.${encodeURIComponent(type)}`;const existing=await req(`/rest/v1/community_build_reactions?${q}&select=reaction`);if(existing?.length)await req(`/rest/v1/community_build_reactions?${q}`,{method:'DELETE'});else await req('/rest/v1/community_build_reactions',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({build_id:build.id,user_id:uid,reaction:type})});await this.mount(build)}catch(e){alert(e.message||e)}}
};

const compare={
  first:null,
  refresh(){window.MHUR_COMMUNITY_BUILDS?.refresh?.()},
  pick(id){
    const api=window.MHUR_COMMUNITY_BUILDS;
    const build=api?.find?.(id);
    if(!build)return;
    if(!this.first){
      this.first=build;
      this.refresh();
      toast(tx(`Build « ${build.title} » choisi. Clique sur « Comparer avec ce build » sur un deuxième build.`,`Build “${build.title}” selected. Click “Compare with this build” on a second build.`));
      return;
    }
    if(String(this.first.id)===String(build.id)){
      this.first=null;
      this.refresh();
      toast(tx('Comparaison annulée.','Comparison cancelled.'));
      return;
    }
    const a=this.first;
    this.first=null;
    this.refresh();
    this.open(a,build);
  },
  open(a,b){const m=overlay('mhurCompareModal',tx('Comparaison de builds','Build comparison'),`${a.title} ↔ ${b.title}`);const body=m.querySelector('.mhurPlusBody');const render=x=>`<article class="mhurCompareBuild"><header><img src="${esc(x.costume_img||'')}" alt=""><div><h3>${esc(x.title)}</h3><p>${esc(x.author)} · ${esc(x.game_version||tx('Version inconnue','Unknown version'))}</p><small>${esc(x.costume_name)} — ${esc(x.costume_variant)}</small></div></header>${window.MHUR_COMMUNITY_BUILDS?.renderTuningColumns?.(x,'micro')||''}</article>`;const slots=x=>new Map((x.tuning_slots||[]).map(s=>[s.id,s.tuning?.name||'—']));const ma=slots(a),mb=slots(b),diff=[...new Set([...ma.keys(),...mb.keys()])].filter(k=>ma.get(k)!==mb.get(k));body.innerHTML=`<div class="mhurCompareGrid">${render(a)}${render(b)}</div><section class="mhurCompareDiff"><h3>${tx('Différences','Differences')} · ${diff.length}</h3>${diff.length?diff.map(k=>`<div><code>${esc(k)}</code><span>${esc(ma.get(k)||'—')}</span><b>→</b><span>${esc(mb.get(k)||'—')}</span></div>`).join(''):`<p>${tx('Les deux builds utilisent les mêmes T.U.N.I.N.G.','Both builds use the same T.U.N.I.N.G.')}</p>`}</section>`;open(m.id)}
};

async function putBuildInCache(row){const api=window.MHUR_COMMUNITY_BUILDS;if(!api)return null;const b=api.normalize(row);const key=`${b.character_id}::${b.style_id}`;api.state.cache[key]=api.state.cache[key]||[];if(!api.state.cache[key].some(x=>String(x.id)===String(b.id)))api.state.cache[key].push(b);return b}
const library={
  async open(){if(!window.MHUR_AUTH?.requireLogin?.(tx('Connecte-toi pour ouvrir ta bibliothèque.','Sign in to open your library.')))return;const m=overlay('mhurLibraryModal',tx('Ma bibliothèque','My library'),tx('Tes builds et mods enregistrés','Your saved builds and mods'));const body=m.querySelector('.mhurPlusBody');body.innerHTML=`<div class="mhurPlusLoading">${tx('Chargement…','Loading…')}</div>`;open(m.id);try{const uid=user().id;const [bf,mf]=await Promise.all([req(`/rest/v1/community_build_favorites?user_id=eq.${uid}&select=build_id,created_at&order=created_at.desc`),req(`/rest/v1/community_mod_favorites?user_id=eq.${uid}&select=mod_id,created_at&order=created_at.desc`)]);const bids=(bf||[]).map(x=>x.build_id),mids=(mf||[]).map(x=>x.mod_id);const [builds,mods]=await Promise.all([bids.length?req(`/rest/v1/community_builds?id=in.(${bids.join(',')})&is_hidden=eq.false&select=*`):[],mids.length?req(`/rest/v1/community_mods?id=in.(${mids.join(',')})&is_hidden=eq.false&select=*`):[]]);body.innerHTML=`<section class="mhurLibrarySection"><h3>⭐ Builds (${builds.length})</h3><div class="mhurLibraryGrid">${builds.map(b=>`<button data-lib-build="${b.id}"><img src="${esc(b.costume_img||'')}" alt=""><span><b>${esc(b.title)}</b><small>${esc(b.author)} · ${esc(b.game_version||'')}</small></span></button>`).join('')||`<p>${tx('Aucun build favori.','No favorite builds.')}</p>`}</div></section><section class="mhurLibrarySection"><h3>🧩 Mods (${mods.length})</h3><div class="mhurLibraryGrid">${mods.map(r=>`<button data-lib-mod="${r.id}"><img src="${esc(r.preview_url||'')}" alt=""><span><b>${esc(r.title)}</b><small>♥ ${Number(r.likes_count)||0} · ⬇ ${Number(r.downloads_count)||0}</small></span></button>`).join('')||`<p>${tx('Aucun mod favori.','No favorite mods.')}</p>`}</div></section>`;body.querySelectorAll('[data-lib-build]').forEach(btn=>btn.onclick=async()=>{const row=builds.find(x=>x.id===btn.dataset.libBuild);const b=await putBuildInCache(row);close(m.id);window.openCommunityBuildDetail?.(b.id,b.character_id,b.style_id)});body.querySelectorAll('[data-lib-mod]').forEach(btn=>btn.onclick=()=>{close(m.id);const row=mods.find(x=>x.id===btn.dataset.libMod);if(window.MHUR_MODS?.state&&!window.MHUR_MODS.state.rows.some(x=>x.id===row.id))window.MHUR_MODS.state.rows.push(row);window.MHUR_MODS?.openDetail?.(row.id)});}catch(e){body.innerHTML=`<div class="modsError">${esc(e.message||e)}</div>`}}
};

const weekly={
  async open(){const m=overlay('mhurWeeklyModal',tx('Tendances de la semaine','Weekly trends'),tx('Les créations publiées pendant les 7 derniers jours','Creations published in the last 7 days'));const body=m.querySelector('.mhurPlusBody');body.innerHTML=`<div class="mhurPlusLoading">${tx('Calcul du classement…','Calculating ranking…')}</div>`;open(m.id);try{const since=new Date(Date.now()-7*86400000).toISOString();const [builds,mods]=await Promise.all([req(`/rest/v1/community_builds?created_at=gte.${encodeURIComponent(since)}&is_hidden=eq.false&select=id,title,creator_id,author,likes_count,character_id,style_id,costume_img,created_at&order=likes_count.desc&limit=30`),req(`/rest/v1/community_mods?created_at=gte.${encodeURIComponent(since)}&is_hidden=eq.false&select=id,title,creator_id,preview_url,likes_count,downloads_count,created_at&order=downloads_count.desc&limit=30`)]);const score={};for(const b of builds||[])score[b.creator_id]=(score[b.creator_id]||0)+Number(b.likes_count||0)*2+1;for(const r of mods||[])score[r.creator_id]=(score[r.creator_id]||0)+Number(r.likes_count||0)*2+Number(r.downloads_count||0)+1;const ids=Object.keys(score);const profiles=ids.length?await req(`/rest/v1/profiles?id=in.(${ids.join(',')})&select=id,username,avatar_url`):[];const byId=Object.fromEntries((profiles||[]).map(p=>[p.id,p]));const creators=Object.entries(score).sort((a,b)=>b[1]-a[1]).slice(0,10);body.innerHTML=`<section class="mhurWeeklyCreators"><h3>🏅 ${tx('Créateurs en tendance','Trending creators')}</h3>${creators.map(([id,s],i)=>`<article><b>#${i+1}</b>${byId[id]?.avatar_url?`<img src="${esc(byId[id].avatar_url)}" alt="">`:'<span>👤</span>'}<strong>${esc(byId[id]?.username||tx('Membre','Member'))}</strong><em>${s} pts</em></article>`).join('')||`<p>${tx('Aucune publication cette semaine.','No posts this week.')}</p>`}</section><div class="mhurWeeklyColumns"><section><h3>🔥 Builds</h3>${(builds||[]).slice(0,10).map((b,i)=>`<button data-week-build="${b.id}"><b>#${i+1}</b><img src="${esc(b.costume_img||'')}" alt=""><span>${esc(b.title)}<small>♥ ${Number(b.likes_count)||0}</small></span></button>`).join('')}</section><section><h3>🧩 Mods</h3>${(mods||[]).slice(0,10).map((r,i)=>`<button data-week-mod="${r.id}"><b>#${i+1}</b><img src="${esc(r.preview_url||'')}" alt=""><span>${esc(r.title)}<small>♥ ${Number(r.likes_count)||0} · ⬇ ${Number(r.downloads_count)||0}</small></span></button>`).join('')}</section></div>`;body.querySelectorAll('[data-week-build]').forEach(btn=>btn.onclick=async()=>{const row=(builds||[]).find(x=>x.id===btn.dataset.weekBuild);const full=(await req(`/rest/v1/community_builds?id=eq.${row.id}&select=*`))[0];const b=await putBuildInCache(full);close(m.id);window.openCommunityBuildDetail?.(b.id,b.character_id,b.style_id)});body.querySelectorAll('[data-week-mod]').forEach(btn=>btn.onclick=async()=>{let row=window.MHUR_MODS?.state?.rows?.find(x=>x.id===btn.dataset.weekMod);if(!row){row=(await req(`/rest/v1/community_mods?id=eq.${btn.dataset.weekMod}&select=*`))[0];window.MHUR_MODS?.state?.rows?.push(row)}close(m.id);window.MHUR_MODS?.openDetail?.(row.id)});}catch(e){body.innerHTML=`<div class="modsError">${esc(e.message||e)}</div>`}}
};

const modHistory={async mount(id,root){if(!root)return;if(!remote){root.textContent=tx('Supabase non configuré.','Supabase not configured.');return}try{const rows=await req(`/rest/v1/community_mod_versions?mod_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.desc&limit=30`);root.innerHTML=(rows||[]).map(v=>`<article class="modVersionRow"><div><b>v${esc(v.mod_version||'1.0')}</b>${v.game_version?`<span>🎮 ${esc(v.game_version)}</span>`:''}<small>${new Date(v.created_at).toLocaleString()}</small></div><p>${esc(v.description||'')}</p>${v.file_url?`<a href="${esc(v.file_url)}" download="${esc(v.file_name||'mod.pak')}" target="_blank" rel="noopener">⬇ ${tx('Télécharger cette version','Download this version')} · ${esc(v.file_name||'')}</a>`:''}</article>`).join('')||`<p>${tx('Aucune ancienne version.','No older versions.')}</p>`}catch(e){root.textContent=tx('Historique indisponible.','History unavailable.')}}};
const modGuide={open(mod){const name=String(mod?.file_name||'mod.pak');const ext=name.toLowerCase().split('.').pop();const archive=ext==='zip';const m=overlay('mhurModGuideModal',tx('Guide d’installation','Installation guide'),name);m.querySelector('.mhurPlusBody').innerHTML=`<div class="mhurInstallPath"><code>SteamLibrary/steamapps/common/My Hero Ultra Rumble/HerovsGame/Content/Paks/Mods</code><button data-copy-path>${tx('Copier','Copy')}</button></div><ol class="mhurInstallSteps"><li>${tx('Dans Steam, ajoute','In Steam, add')} <code>-fileopenlog</code> ${tx('dans les options de lancement.','to the launch options.')}</li><li>${tx('Ouvre le dossier','Open the')} <code>HerovsGame/Content/Paks/Mods</code>.</li><li>${archive?tx('Décompresse le ZIP, puis copie tous les fichiers .pak, .utoc et .ucas ensemble dans Mods.','Extract the ZIP, then copy all .pak, .utoc and .ucas files together into Mods.'):tx(`Copie « ${name} » dans Mods. Si le téléchargement contient aussi des fichiers .utoc ou .ucas, garde-les ensemble.`,`Copy “${name}” into Mods. If the download also contains .utoc or .ucas files, keep them together.`)}</li><li>${tx('Relance le jeu. Pour désinstaller le mod, retire ses fichiers du dossier Mods.','Restart the game. To uninstall, remove its files from the Mods folder.')}</li></ol><div class="modsWarning">⚠️ ${tx('Mods PC Steam uniquement. Vérifie toujours la version du jeu indiquée par le créateur.','PC Steam mods only. Always check the game version stated by the creator.')}</div>`;m.querySelector('[data-copy-path]').onclick=()=>navigator.clipboard?.writeText('SteamLibrary/steamapps/common/My Hero Ultra Rumble/HerovsGame/Content/Paks/Mods');open(m.id)}};
const modReport={
  current:'',
  open(id){
    if(!window.MHUR_AUTH?.requireLogin?.(tx('Connecte-toi pour signaler ce mod.','Sign in to report this mod.')))return;
    this.current=id;
    const m=overlay('mhurModReportModal',tx('Signaler ce mod','Report this mod'));
    m.querySelector('.mhurPlusBody').innerHTML=`<label class="mhurPlusField">${tx('Raison','Reason')}<select id="mhurModReportReason"><option value="broken">${tx('Fichier cassé ou dangereux','Broken or unsafe file')}</option><option value="stolen">${tx('Création volée','Stolen creation')}</option><option value="inappropriate">${tx('Contenu inapproprié','Inappropriate content')}</option><option value="misleading">${tx('Description trompeuse','Misleading description')}</option><option value="other">${tx('Autre','Other')}</option></select></label><label class="mhurPlusField">${tx('Détails','Details')}<textarea id="mhurModReportDetails" maxlength="700"></textarea></label><button class="mhurPlusPrimary" data-send-report>${tx('Envoyer','Send')}</button>`;
    m.querySelector('[data-send-report]').onclick=()=>this.send();open(m.id);
  },
  async send(){
    try{
      await req('/rest/v1/community_mod_reports',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({mod_id:this.current,reporter_id:user().id,reason:document.getElementById('mhurModReportReason').value,details:document.getElementById('mhurModReportDetails').value.trim()})});
      toast(tx('Signalement envoyé.','Report sent.'));close('mhurModReportModal');
    }catch(e){alert(e.message?.includes('duplicate')?tx('Tu as déjà signalé ce mod.','You already reported this mod.'):e.message||e)}
  },
  async admin(){
    if(!window.MHUR_MODERATION?.isAdmin?.())return;
    const m=overlay('mhurModReportAdminModal',tx('Signalements des mods','Mod reports'));
    const body=m.querySelector('.mhurPlusBody');body.innerHTML=tx('Chargement…','Loading…');open(m.id);
    try{
      const rows=await req('/rest/v1/community_mod_reports?status=eq.open&select=*,mod:community_mods(id,title,creator_id,is_hidden)&order=created_at.asc');
      body.innerHTML=(rows||[]).map(r=>`<article class="mhurModReportAdmin"><header><b>${esc(r.reason)}</b><small>${new Date(r.created_at).toLocaleString()}</small></header><h3>${esc(r.mod?.title||tx('Mod supprimé','Deleted mod'))}</h3><p>${esc(r.details||tx('Aucun détail.','No details.'))}</p><div><button data-report-resolve="${r.id}">${tx('Classer sans suite','Dismiss')}</button>${r.mod?`<button class="danger" data-report-hide="${r.id}" data-mod="${r.mod.id}">${tx('Masquer le mod','Hide mod')}</button>`:''}</div></article>`).join('')||`<p>${tx('Aucun signalement ouvert.','No open reports.')}</p>`;
      body.querySelectorAll('[data-report-resolve]').forEach(b=>b.onclick=()=>this.resolve(b.dataset.reportResolve,'dismissed'));
      body.querySelectorAll('[data-report-hide]').forEach(b=>b.onclick=()=>this.hide(b.dataset.mod,b.dataset.reportHide));
    }catch(e){body.textContent=e.message||e}
  },
  async resolve(id,status){await req(`/rest/v1/community_mod_reports?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status,resolved_at:new Date().toISOString(),resolved_by:user()?.id})});this.admin()},
  async hide(modId,reportId){if(!confirm(tx('Masquer ce mod pour tout le monde ?','Hide this mod for everyone?')))return;await req(`/rest/v1/community_mods?id=eq.${encodeURIComponent(modId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_hidden:true})});await this.resolve(reportId,'actioned')}
};

const followNotifications={key:'mhur_follow_snapshots_v411',async check(){if(!remote||!user())return;try{const uid=user().id;const [bf,mf]=await Promise.all([req(`/rest/v1/community_build_favorites?user_id=eq.${uid}&select=build_id`),req(`/rest/v1/community_mod_favorites?user_id=eq.${uid}&select=mod_id`)]);const bids=(bf||[]).map(x=>x.build_id),mids=(mf||[]).map(x=>x.mod_id);const [builds,mods]=await Promise.all([bids.length?req(`/rest/v1/community_builds?id=in.(${bids.join(',')})&select=id,title,updated_at`):[],mids.length?req(`/rest/v1/community_mods?id=in.(${mids.join(',')})&select=id,title,updated_at,mod_version`):[]]);const prev=JSON.parse(localStorage.getItem(this.key)||'{}'),next={};for(const b of builds||[]){const k=`b:${b.id}`;next[k]=b.updated_at;if(prev[k]&&prev[k]!==b.updated_at)window.MHUR_HUB?.notifications?.add?.(tx('Build favori mis à jour','Favorite build updated'),b.title)}for(const r of mods||[]){const k=`m:${r.id}`;next[k]=r.updated_at;if(prev[k]&&prev[k]!==r.updated_at)window.MHUR_HUB?.notifications?.add?.(tx('Mod favori mis à jour','Favorite mod updated'),`${r.title} · v${r.mod_version||'1.0'}`)}localStorage.setItem(this.key,JSON.stringify(next))}catch(_){}}};

function mountBuildDetail(build){reactions.mount(build)}
function menu(){const drawer=document.getElementById('drawer');if(!drawer)return;const anchor=drawer.querySelector('[data-mhur-mods], [data-v395-key="mods"]');function add(key,icon,label,fn){let b=drawer.querySelector(`[data-mhur-plus="${key}"]`);if(b)return;b=document.createElement('button');b.className='navItem';b.dataset.mhurPlus=key;b.innerHTML=`${icon} <span>${label}</span>`;b.onclick=e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();drawer.classList.remove('open');fn()};(anchor?.parentElement||drawer).insertBefore(b,anchor?.nextSibling||null)}add('library','📚',tx('Ma bibliothèque','My library'),()=>library.open());add('weekly','🔥',tx('Tendances semaine','Weekly trends'),()=>weekly.open())}
window.MHUR_PLUS={req,mountBuildDetail,reactions,compare,library,weekly,modHistory,modGuide,modReport,followNotifications};
new MutationObserver(menu).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('load',()=>{menu();setTimeout(()=>followNotifications.check(),2200)},{once:true});
window.addEventListener('mhur-auth-change',()=>setTimeout(()=>followNotifications.check(),600));
})();
