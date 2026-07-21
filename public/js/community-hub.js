(function(){
'use strict';
const cfg=window.MHUR_COMMUNITY_CONFIG||{};const remote=Boolean(cfg.supabaseUrl&&cfg.supabaseKey&&!String(cfg.supabaseUrl).includes('VOTRE_'));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=(fr,en)=>typeof lang!=='undefined'&&lang==='en'?en:fr;
const user=()=>window.MHUR_AUTH?.getUser?.();const profile=()=>window.MHUR_AUTH?.getProfile?.();
async function req(path,opt={}){if(!remote)throw new Error(t('Supabase non configuré','Supabase is not configured'));const runner=window.MHUR_AUTH?.fetch||fetch;const r=await runner(cfg.supabaseUrl.replace(/\/$/,'')+path,{...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});if(!r.ok){const x=await r.text();throw new Error(x||`HTTP ${r.status}`)}if(r.status===204)return null;const txt=await r.text();return txt?JSON.parse(txt):null}
function overlay(id,title,subtitle=''){let m=document.getElementById(id);if(!m){m=document.createElement('div');m.id=id;m.className='mhurHubOverlay';m.innerHTML=`<section class="mhurHubPanel"><button class="mhurHubClose">×</button><header class="mhurHubHead"><h2></h2><p></p></header><div class="mhurHubBody"></div></section>`;m.querySelector('.mhurHubClose').onclick=()=>close(id);m.onclick=e=>{if(e.target===m)close(id)};document.body.appendChild(m)}m.querySelector('h2').textContent=title;m.querySelector('.mhurHubHead p').textContent=subtitle;return m}
function open(id){document.getElementById(id)?.classList.add('open');document.body.classList.add('cbModalOpen')}
function close(id){document.getElementById(id)?.classList.remove('open');if(!document.querySelector('.mhurHubOverlay.open,.cbModal.open,.mhurAuthOverlay.open,.mhurPublicProfileModal.open,.mhurAdminOverlay.open'))document.body.classList.remove('cbModalOpen')}

// Hub buttons inserted into builds pages and drawer.
function hubButtons(){return `<div class="mhurHubButtons"><button class="primary" onclick="MHUR_HUB.search.open()">🔎 ${t('Recherche','Search')}</button><button onclick="event.preventDefault();event.stopPropagation();MHUR_HUB.tier.open();return false">🏆 Tier List</button><button onclick="MHUR_HUB.notifications.open()">🔔 ${t('Notifications','Notifications')}</button>${window.MHUR_MODERATION?.isAdmin?.()?`<button onclick="MHUR_HUB.admin.open()">🛡️ Admin</button>`:''}</div>`}
function injectHub(){const target=document.querySelector('.cbPageHead,.builderHero');if(target&&!document.querySelector('.mhurHubButtons'))target.insertAdjacentHTML('afterend',hubButtons());const drawer=document.getElementById('drawer');if(drawer&&!drawer.querySelector('[data-mhur-hub]'))drawer.insertAdjacentHTML('beforeend',`<button data-mhur-hub class="navItem" onclick="MHUR_HUB.search.open()">🔎 ${t('Recherche globale','Global search')}</button><button data-mhur-hub class="navItem" onclick="event.preventDefault();event.stopPropagation();MHUR_HUB.tier.open();return false">🏆 Tier List</button>`)}
new MutationObserver(injectHub).observe(document.documentElement,{childList:true,subtree:true});setTimeout(injectHub,0);

// Search
const search={open(){document.getElementById('drawer')?.classList.remove('open');const m=overlay('mhurSearchModal',t('Recherche globale','Global search'),t('Personnages, styles, costumes et builds','Characters, styles, costumes and builds'));m.querySelector('.mhurHubBody').innerHTML=`<input id="mhurGlobalSearch" class="mhurHubInput" placeholder="${t('Ex : Toga, Assaut, Shoot Style…','E.g. Toga, Assault, Shoot Style…')}"><div id="mhurSearchResults" class="mhurSearchResults"></div>`;m.querySelector('input').oninput=e=>this.run(e.target.value);open(m.id)},async run(q){const out=document.getElementById('mhurSearchResults');if(!out)return;q=String(q||'').trim().toLowerCase();if(q.length<2){out.innerHTML='';return}const rows=[];((typeof characters!=='undefined'?characters:[])).filter(c=>String(c.name||'').toLowerCase()!=='all for one (youth age)').forEach(c=>{if(`${c.name} ${c.id}`.toLowerCase().includes(q))rows.push({type:t('Personnage','Character'),title:c.name,sub:(c.styles||[]).length+' styles',go:`page='characters';selectedChar='${c.id}';selectedStyle=null;render();MHUR_HUB.close('mhurSearchModal')`})});if(typeof styles!=='undefined')Object.entries(styles).forEach(([id,s])=>{const name=typeof label==='function'?label(s.name):id;if(`${name} ${id} ${s.role}`.toLowerCase().includes(q)){const c=((typeof characters!=='undefined'?characters:[])).find(x=>(x.styles||[]).includes(id));rows.push({type:t('Style','Style'),title:`${c?.name||''} — ${name}`,sub:s.role||'',go:`page='characters';selectedChar='${c?.id||''}';selectedStyle='${id}';render();MHUR_HUB.close('mhurSearchModal')`})}});if(typeof allCostumesForCharId==='function')((typeof characters!=='undefined'?characters:[])).filter(c=>String(c.name||'').toLowerCase()!=='all for one (youth age)').forEach(c=>(allCostumesForCharId(c.id)||[]).forEach(ct=>{if(`${ct.group||ct.name} ${ct.variant} ${c.name}`.toLowerCase().includes(q))rows.push({type:t('Costume','Costume'),title:`${c.name} — ${ct.group||ct.name}`,sub:ct.variant||'',go:`page='costumes';selectedChar='${c.id}';selectedCostume='${ct.id}';render();MHUR_HUB.close('mhurSearchModal')`})}));if(remote){try{const builds=await req(`/rest/v1/community_builds?or=(title.ilike.*${encodeURIComponent(q)}*,author.ilike.*${encodeURIComponent(q)}*,costume_name.ilike.*${encodeURIComponent(q)}*)&is_hidden=eq.false&select=id,title,author,character_id,style_id&limit=12`);for(const b of builds||[])rows.push({type:'Build',title:b.title,sub:b.author,go:`MHUR_HUB.close('mhurSearchModal');openCommunityBuildsPage('${b.character_id}','${b.style_id}');setTimeout(()=>openCommunityBuildDetail('${b.id}','${b.character_id}','${b.style_id}'),300)`})}catch(_){}}out.innerHTML=rows.slice(0,60).map(r=>`<button class="mhurSearchCard" onclick="${r.go}"><small>${esc(r.type)}</small><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></button>`).join('')||`<div>${t('Aucun résultat','No results')}</div>`}}

// Comments
const comments={buildId:null,async mount(buildId){this.buildId=String(buildId);const content=document.getElementById('cbDetailContent');if(!content)return;content.querySelector('.mhurCommentBox')?.remove();content.insertAdjacentHTML('beforeend',`<section class="mhurCommentBox"><h3>💬 ${t('Commentaires','Comments')}</h3><div class="mhurCommentComposer"><textarea id="mhurCommentText" class="mhurHubInput" maxlength="700" placeholder="${t('Écris un commentaire…','Write a comment…')}"></textarea><button onclick="MHUR_HUB.comments.send()">${t('Publier','Post')}</button></div><div id="mhurCommentList" class="mhurCommentList"><div>${t('Chargement…','Loading…')}</div></div></section>`);await this.load()},async load(){const out=document.getElementById('mhurCommentList');if(!out)return;if(!remote){out.innerHTML=`<div>${t('Configure Supabase pour activer les commentaires.','Configure Supabase to enable comments.')}</div>`;return}try{const rows=await req(`/rest/v1/community_build_comments?build_id=eq.${encodeURIComponent(this.buildId)}&is_hidden=eq.false&select=*,profile:profiles(id,username,avatar_url,role)&order=created_at.asc`);out.innerHTML=(rows||[]).map(c=>{const p=c.profile||{},mine=user()?.id===c.user_id,admin=window.MHUR_MODERATION?.isAdmin?.();const av=p.avatar_url?`<img class="mhurCommentAvatar" src="${esc(p.avatar_url)}">`:`<span class="mhurCommentAvatar">${esc((p.username||'?').slice(0,2).toUpperCase())}</span>`;return `<article class="mhurComment"> <div class="mhurCommentHead">${av}<b>${esc(p.username||'Utilisateur')}</b><small>${new Date(c.created_at).toLocaleString(typeof lang!=='undefined'&&lang==='en'?'en-GB':'fr-FR')}</small>${mine||admin?`<button class="mhurCommentDelete" onclick="MHUR_HUB.comments.remove('${c.id}')">×</button>`:''}</div><p>${esc(c.content)}</p></article>`}).join('')||`<div>${t('Aucun commentaire.','No comments yet.')}</div>`}catch(e){out.textContent=e.message}},async send(){if(!window.MHUR_AUTH?.requireLogin?.(t('Connecte-toi pour commenter.','Sign in to comment.')))return;const input=document.getElementById('mhurCommentText'),content=String(input?.value||'').trim();if(content.length<2)return;try{await req('/rest/v1/community_build_comments',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({build_id:this.buildId,user_id:user().id,content})});input.value='';await this.load()}catch(e){alert(e.message)}},async remove(id){if(!confirm(t('Supprimer ce commentaire ?','Delete this comment?')))return;try{await req(`/rest/v1/community_build_comments?id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});await this.load()}catch(e){alert(e.message)}}};
const oldOpenDetail=window.openCommunityBuildDetail;window.openCommunityBuildDetail=function(...a){const r=oldOpenDetail?.apply(this,a);setTimeout(()=>comments.mount(a[0]),80);return r};

// Tier list — personnelle, avec publication volontaire
const tier={
  ownVotes:{},
  storageKey(){return `mhur_personal_tier_v347_${user()?.id||'guest'}`},
  loadLocal(){try{this.ownVotes=JSON.parse(localStorage.getItem(this.storageKey())||'{}')||{}}catch(_){this.ownVotes={}}},
  saveLocal(){localStorage.setItem(this.storageKey(),JSON.stringify(this.ownVotes))},
  async open(){
    const app=document.getElementById('app');
    if(!app)return;
    document.getElementById('drawer')?.classList.remove('open');
    this.loadLocal();
    app.innerHTML=`<section class="mhurTierPage">
      <div class="mhurTierPageTop">
        <button type="button" class="mhurTierBack" onclick="MHUR_HUB.tier.closePage()">← ${t('Retour','Back')}</button>
        <div>
          <span class="mhurTierKicker">COMMUNAUTÉ</span>
          <h1>🏆 Tier List</h1>
          <p>${t('Ta Tier List est personnelle. Elle ne sera visible par les autres que lorsque tu la publies.','Your Tier List is personal. Other users can only see it after you publish it.')}</p>
        </div>
        <div class="mhurTierTopActions">
          <label class="mhurTierFilter">${t('Rôle','Role')}
            <select id="mhurTierRole">
              <option value="">${t('Tous les rôles','All roles')}</option>
              <option value="assault">${t('Assaut','Assault')}</option>
              <option value="strike">${t('Attaque','Strike')}</option>
              <option value="speed">${t('Rapide','Rapid')}</option>
              <option value="technical">${t('Technique','Technical')}</option>
              <option value="support">${t('Soutien','Support')}</option>
            </select>
          </label>
          <div class="mhurTierActionButtons">
            <button class="mhurTierPublishedBtn" onclick="MHUR_HUB.tier.openPublished()">🌍 ${t('Tier Lists publiées','Published Tier Lists')}</button>
            <button class="mhurTierPublishBtn" onclick="MHUR_HUB.tier.publish()">📤 ${t('Publier ma Tier List','Publish my Tier List')}</button>
            <button class="mhurTierResetBtn" onclick="MHUR_HUB.tier.reset()">↺ ${t('Réinitialiser','Reset')}</button>
          </div>
        </div>
      </div>
      <div id="mhurTierList" class="mhurTierList mhurTierListPage"></div>
    </section>`;
    document.getElementById('mhurTierRole').onchange=()=>this.render();
    window.scrollTo({top:0,behavior:'instant'});
    this.render();
  },
  closePage(){if(typeof render==='function')render();window.scrollTo({top:0,behavior:'instant'})},
  dragStart(event,styleId){event.dataTransfer.setData('text/plain',styleId);event.dataTransfer.effectAllowed='move';event.currentTarget.classList.add('dragging')},
  dragEnd(event){event.currentTarget.classList.remove('dragging')},
  dragOver(event){event.preventDefault();event.dataTransfer.dropEffect='move';event.currentTarget.classList.add('dragOver')},
  dragLeave(event){event.currentTarget.classList.remove('dragOver')},
  drop(event,tierLetter){event.preventDefault();event.currentTarget.classList.remove('dragOver');const styleId=event.dataTransfer.getData('text/plain');if(!styleId)return;if(tierLetter==='U')delete this.ownVotes[styleId];else this.ownVotes[styleId]=tierLetter;this.saveLocal();this.render()},
  reset(){if(!confirm(t('Réinitialiser entièrement ta Tier List ?','Reset your entire Tier List?')))return;this.ownVotes={};this.saveLocal();this.render()},
  rankings(){const out={S:[],A:[],B:[],C:[],D:[]};for(const [styleId,letter] of Object.entries(this.ownVotes)){if(out[letter])out[letter].push(styleId)}return out},
  async publish(){
    if(!window.MHUR_AUTH?.requireLogin?.(t('Connecte-toi pour publier ta Tier List.','Sign in to publish your Tier List.')))return;
    if(!remote){alert(t('Supabase doit être configuré pour publier.','Supabase must be configured to publish.'));return}
    const rankings=this.rankings();
    if(!Object.values(rankings).some(a=>a.length)){alert(t('Classe au moins un style avant de publier.','Rank at least one style before publishing.'));return}
    try{
      await req('/rest/v1/community_tier_lists?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:user().id,title:`Tier List de ${profile()?.username||user()?.email?.split('@')[0]||'Utilisateur'}`,rankings,updated_at:new Date().toISOString()})});
      alert(t('Ta Tier List a été publiée.','Your Tier List has been published.'));
    }catch(e){alert(e.message)}
  },
  async openPublished(){
    const m=overlay('mhurPublishedTierModal',t('Tier Lists publiées','Published Tier Lists'),t('Les classements publiés volontairement par la communauté.','Rankings voluntarily published by the community.'));
    const body=m.querySelector('.mhurHubBody');body.innerHTML=`<div>${t('Chargement…','Loading…')}</div>`;open(m.id);
    if(!remote){body.innerHTML=`<div>${t('Supabase non configuré.','Supabase is not configured.')}</div>`;return}
    try{
      const rows=await req('/rest/v1/community_tier_lists?select=id,user_id,title,rankings,updated_at,profile:profiles(username,avatar_url)&order=updated_at.desc&limit=50');
      body.innerHTML=(rows||[]).map(r=>{const p=r.profile||{},av=p.avatar_url?`<img src="${esc(p.avatar_url)}">`:`<span>${esc((p.username||'?').slice(0,1).toUpperCase())}</span>`;const counts=['S','A','B','C','D'].map(k=>`<b class="${k}">${k}: ${(r.rankings?.[k]||[]).length}</b>`).join('');return `<article class="mhurPublishedTierCard"><div class="mhurPublishedTierAuthor">${av}<div><strong>${esc(r.title||'Tier List')}</strong><small>${esc(p.username||'Utilisateur')} · ${new Date(r.updated_at).toLocaleString(lang==='en'?'en-GB':'fr-FR')}</small></div></div><div class="mhurPublishedTierCounts">${counts}</div><button onclick="MHUR_HUB.tier.viewPublished('${r.id}')">${t('Voir','View')}</button></article>`}).join('')||`<div>${t('Aucune Tier List publiée.','No published Tier Lists.')}</div>`;
    }catch(e){body.textContent=e.message}
  },
  async viewPublished(id){
    try{
      const rows=await req(`/rest/v1/community_tier_lists?id=eq.${encodeURIComponent(id)}&select=title,rankings,profile:profiles(username,avatar_url)&limit=1`);const r=rows?.[0];if(!r)return;
      const m=overlay('mhurPublishedTierView',esc(r.title||'Tier List'),t('Tier List publiée — lecture seule','Published Tier List — read only'));const body=m.querySelector('.mhurHubBody');
      const getStyle=id=>{const s=typeof styles!=='undefined'?styles[id]:null;const c=(typeof characters!=='undefined'?characters:[]).find(x=>(x.styles||[]).includes(id));return s&&c?{id,s,c}:null};
      body.innerHTML=['S','A','B','C','D'].map(letter=>`<div class="mhurPublishedTierRow"><div class="mhurTierLabel ${letter}">${letter}</div><div>${(r.rankings?.[letter]||[]).map(id=>{const x=getStyle(id);return x?`<div class="mhurPublishedMini"><img src="${esc(x.s.portrait||x.c.portrait||'')}"><small>${esc(x.c.name)}</small></div>`:''}).join('')}</div></div>`).join('');open(m.id)
    }catch(e){alert(e.message)}
  },
  render(){
    const out=document.getElementById('mhurTierList');if(!out)return;
    const role=document.getElementById('mhurTierRole')?.value||'';const items=[];
    ((typeof characters!=='undefined'?characters:[])).filter(c=>String(c.name||'').toLowerCase()!=='all for one (youth age)').forEach(c=>(c.styles||[]).forEach(id=>{const s=(typeof styles!=='undefined'?styles[id]:null);if(!s||role&&s.role!==role)return;items.push({id,c,s,tier:this.ownVotes[id]||'U'})}));
    const row=letter=>`<div class="mhurTierRow ${letter==='U'?'unranked':''}"><div class="mhurTierLabel ${letter}">${letter==='U'?t('Non classés','Unranked'):letter}</div><div class="mhurTierItems" ondragover="MHUR_HUB.tier.dragOver(event)" ondragleave="MHUR_HUB.tier.dragLeave(event)" ondrop="MHUR_HUB.tier.drop(event,'${letter}')">${items.filter(x=>x.tier===letter).map(x=>`<div class="mhurTierItem" draggable="true" ondragstart="MHUR_HUB.tier.dragStart(event,'${x.id}')" ondragend="MHUR_HUB.tier.dragEnd(event)"><img src="${esc(x.s.portrait||x.c.portrait||'')}" alt="${esc(x.c.name)}"><small>${esc(x.c.name)}</small><span class="mhurTierStyleName">${esc(typeof label==='function'?label(x.s.name||''):x.id)}</span></div>`).join('')}<div class="mhurTierDropHint">${t('Dépose ici','Drop here')}</div></div></div>`;
    out.innerHTML=`<div class="mhurTierDragHelp">${t('Les déplacements sont enregistrés uniquement dans ton navigateur. Publie ta Tier List lorsque tu veux la partager.','Changes are saved only in your browser. Publish your Tier List when you want to share it.')}</div>`+['S','A','B','C','D','U'].map(row).join('');
  }
};

// Stats
const stats={async open(){const m=overlay('mhurStatsModal',t('Statistiques de la communauté','Community statistics'),t('Données calculées à partir des builds publiés','Calculated from published builds'));const body=m.querySelector('.mhurHubBody');body.innerHTML=`<div>${t('Chargement…','Loading…')}</div>`;open(m.id);if(!remote){body.innerHTML=`<div>${t('Configure Supabase pour afficher les statistiques.','Configure Supabase to show statistics.')}</div>`;return}try{const rows=await req('/rest/v1/community_builds?is_hidden=eq.false&select=character_id,style_id,costume_name,costume_variant,tuning_slots,likes_count,author');const builds=rows||[],sum=builds.reduce((n,b)=>n+Number(b.likes_count||0),0),chars={},costumes={},tunings={};for(const b of builds){chars[b.character_id]=(chars[b.character_id]||0)+1;const co=`${b.costume_name} — ${b.costume_variant}`;costumes[co]=(costumes[co]||0)+1;for(const s of b.tuning_slots||[]){const n=s.tuning?.name;if(n)tunings[n]=(tunings[n]||0)+1}}const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,10);body.innerHTML=`<div class="mhurStatsGrid"><div class="mhurStatCard"><b>${builds.length}</b><span>Builds</span></div><div class="mhurStatCard"><b>${sum}</b><span>Likes</span></div><div class="mhurStatCard"><b>${new Set(builds.map(b=>b.author)).size}</b><span>${t('Créateurs','Creators')}</span></div></div>${this.table(t('Personnages les plus joués','Most used characters'),top(chars))}${this.table(t('Costumes les plus utilisés','Most used costumes'),top(costumes))}${this.table('T.U.N.I.N.G',top(tunings))}`}catch(e){body.textContent=e.message}},table(title,rows){return `<h3>${esc(title)}</h3><table class="mhurStatsTable"><thead><tr><th>${t('Nom','Name')}</th><th>${t('Utilisations','Uses')}</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>`}};

// Notifications (local change detection + browser permission)
const notifications={
  key:'mhur_notifications_v327',
  list(){try{return JSON.parse(localStorage.getItem(this.key)||'[]')}catch(_){return[]}},
  save(a){localStorage.setItem(this.key,JSON.stringify(a.slice(0,100)));this.badge()},
  add(title,text){
    const a=this.list();
    a.unshift({id:Date.now(),title,text,date:new Date().toISOString(),read:false});
    this.save(a);
    if('Notification' in window&&Notification.permission==='granted')new Notification(title,{body:text,icon:'assets/home/icons/release_character.png'});
  },
  async request(){if('Notification'in window)await Notification.requestPermission()},
  open(){
    const m=overlay('mhurNoticesModal',t('Notifications','Notifications'),t('Nouveautés du site et de la communauté','Site and community updates'));
    const a=this.list();
    const items=a.map(n=>`<article class="mhurNoticeItem ${n.read?'':'unread'}"><b>${esc(n.title)}</b><small>${esc(n.text).replace(/\n/g,'<br>')}<br>${new Date(n.date).toLocaleString()}</small></article>`).join('');
    m.querySelector('.mhurHubBody').innerHTML=`<div class="mhurHubButtons"><button onclick="MHUR_HUB.notifications.request()">${t('Activer les notifications du navigateur','Enable browser notifications')}</button><button onclick="MHUR_HUB.notifications.readAll()">${t('Tout marquer comme lu','Mark all read')}</button></div>${items||`<div>${t('Aucune notification.','No notifications.')}</div>`}`;
    open(m.id);
  },
  readAll(){const a=this.list().map(x=>({...x,read:true}));this.save(a);this.open()},
  badge(){
    let b=document.getElementById('mhurNoticeBell');
    if(!b){b=document.createElement('button');b.id='mhurNoticeBell';b.className='mhurNoticeBell';b.textContent='🔔';b.onclick=()=>this.open();document.body.appendChild(b)}
    const n=this.list().filter(x=>!x.read).length;
    if(n)b.dataset.count=n;else b.removeAttribute('data-count');
  },
  async check(){
    try{
      const response=await fetch(`version.json?t=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const info=await response.json();
      const current=String(info.version||'').trim();
      if(!current)return;
      const key='mhur_seen_version_v354';
      const previous=localStorage.getItem(key);
      if(previous&&previous!==current){
        const changes=(typeof lang!=='undefined'&&lang==='en'?info.changes_en:info.changes_fr)||info.changes||[];
        const details=(Array.isArray(changes)?changes:[]).map(x=>`• ${x}`).join('\n');
        this.add(
          t(`Mise à jour ${current}`,`${current} update`),
          details||t('Consulte les notes de version pour voir les changements.','Check the release notes to see what changed.')
        );
      }
      localStorage.setItem(key,current);
    }catch(_){
      const d=window.MHUR_HOME_DATA||{};
      const sig=JSON.stringify({r:d.latest_releases?.[0]?.title,p:d.patch_notes?.[0]?.id,e:d.events?.[0]?.id});
      localStorage.setItem('mhur_data_signature_v327',sig);
    }
  }
};

// Admin console
const admin={tab:'builds',async open(){if(!window.MHUR_MODERATION?.isAdmin?.())return alert(t('Accès administrateur requis.','Administrator access required.'));const m=overlay('mhurSuperAdminModal',t('Console d’administration','Admin console'),t('Gestion des builds, commentaires et comptes','Manage builds, comments and accounts'));m.querySelector('.mhurHubBody').innerHTML=`<div class="mhurAdminTabs"><button onclick="MHUR_HUB.admin.load('builds')">Builds</button><button onclick="MHUR_HUB.admin.load('comments')">Commentaires</button><button onclick="MHUR_HUB.admin.load('users')">Utilisateurs</button><button onclick="MHUR_MODERATION.openAdmin()">Signalements builds</button><button onclick="MHUR_PLUS?.modReport?.admin()">Signalements mods</button></div><div id="mhurAdminContent"></div>`;open(m.id);this.load('builds')},async load(tab){this.tab=tab;const out=document.getElementById('mhurAdminContent');if(!out)return;out.textContent=t('Chargement…','Loading…');try{if(tab==='builds'){const rows=await req('/rest/v1/community_builds?select=id,title,author,is_hidden,is_verified,likes_count,created_at&order=created_at.desc&limit=100');out.innerHTML=(rows||[]).map(b=>`<div class="mhurAdminRow"><div><b>${esc(b.title)}</b><small>${esc(b.author)} · ❤️ ${b.likes_count||0}${b.is_hidden?' · MASQUÉ':''}${b.is_verified?' · VÉRIFIÉ':''}</small></div><div class="mhurAdminActions"><button class="ok" onclick="MHUR_HUB.admin.patchBuild('${b.id}',{is_verified:${!b.is_verified}})">${b.is_verified?'Dévérifier':'Vérifier'}</button><button class="danger" onclick="MHUR_HUB.admin.patchBuild('${b.id}',{is_hidden:${!b.is_hidden}})">${b.is_hidden?'Afficher':'Masquer'}</button></div></div>`).join('')}else if(tab==='comments'){const rows=await req('/rest/v1/community_build_comments?select=id,content,is_hidden,created_at,profile:profiles(username)&order=created_at.desc&limit=100');out.innerHTML=(rows||[]).map(c=>`<div class="mhurAdminRow"><div><b>${esc(c.profile?.username||'Utilisateur')}</b><small>${esc(c.content)}</small></div><div class="mhurAdminActions"><button class="danger" onclick="MHUR_HUB.admin.patchComment('${c.id}',${!c.is_hidden})">${c.is_hidden?'Afficher':'Masquer'}</button></div></div>`).join('')}else{const rows=await req('/rest/v1/profiles?select=id,username,provider,role,created_at&order=created_at.desc&limit=100');out.innerHTML=(rows||[]).map(p=>`<div class="mhurAdminRow"><div><b>${esc(p.username)}</b><small>${esc(p.provider||'')} · ${esc(p.role||'user')}</small></div><div class="mhurAdminActions"><button onclick="MHUR_HUB.admin.role('${p.id}','user')">User</button><button onclick="MHUR_HUB.admin.role('${p.id}','moderator')">Modo</button><button class="ok" onclick="MHUR_HUB.admin.role('${p.id}','admin')">Admin</button></div></div>`).join('')}}catch(e){out.textContent=e.message}},async patchBuild(id,obj){await req(`/rest/v1/community_builds?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(obj)});this.load('builds')},async patchComment(id,hidden){await req(`/rest/v1/community_build_comments?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({is_hidden:hidden})});this.load('comments')},async role(id,role){if(!confirm(`${role} ?`))return;await req('/rest/v1/rpc/set_community_user_role',{method:'POST',body:JSON.stringify({p_user:id,p_role:role})});this.load('users')}};

window.MHUR_HUB={close,search,comments,tier,stats,notifications,admin};
notifications.badge();setTimeout(()=>notifications.check(),800);
// PWA
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
})();
