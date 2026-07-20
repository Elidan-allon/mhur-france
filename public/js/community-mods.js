(function(){
'use strict';
const CFG=window.MHUR_COMMUNITY_CONFIG||{};
const API=String(CFG.supabaseUrl||'').replace(/\/+$/,'');
const KEY=String(CFG.supabaseKey||'');
const REMOTE=/^https:\/\/.+\.supabase\.co$/i.test(API)&&!!KEY;
const state={rows:[],profiles:{},liked:new Set(),favorites:new Set(),loading:false,error:'',category:'all',character:'all',query:'',sort:'recent',active:null,comments:[],editingId:null};
const CATEGORIES=['skin','ui','audio','vfx','animation','environment','gameplay','misc'];
const LEGACY={skins:'skin',sounds:'audio',effects:'vfx',maps:'environment',characters:'skin',other:'misc'};
const tx=(fr,en)=>{try{return typeof lang!=='undefined'&&lang==='en'?en:fr}catch(_){return fr}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const user=()=>window.MHUR_AUTH?.getUser?.()||null;
const token=()=>window.MHUR_AUTH?.getAccessToken?.()||KEY;
const safeName=v=>String(v||'file').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(-140);
const normalizedCategory=c=>LEGACY[c]||c||'misc';
function categoryLabel(c){const k=normalizedCategory(c);const fr={skin:'Skin',ui:'Interface',audio:'Audio',vfx:'VFX',animation:'Animation',environment:'Environnement',gameplay:'Gameplay',misc:'Divers'};const en={skin:'Skin',ui:'UI',audio:'Audio',vfx:'VFX',animation:'Animation',environment:'Environment',gameplay:'Gameplay',misc:'Misc'};return (tx(fr,en))[k]||k}
function formatDate(v){try{return new Intl.DateTimeFormat(typeof lang!=='undefined'&&lang==='en'?'en-GB':'fr-FR',{dateStyle:'medium'}).format(new Date(v))}catch(_){return ''}}
function formatSize(n){n=Number(n)||0;if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
async function request(path,opt={}){const headers={apikey:KEY,Authorization:`Bearer ${token()}`,...(opt.headers||{})};if(opt.body&&!(opt.body instanceof Blob)&&!headers['Content-Type'])headers['Content-Type']='application/json';const r=await fetch(API+path,{...opt,headers});const text=await r.text();let data=text;try{data=text?JSON.parse(text):null}catch(_){}if(!r.ok)throw new Error(data?.message||data?.error||data?.hint||text||`HTTP ${r.status}`);return data}
async function loadProfiles(ids){ids=[...new Set(ids.filter(Boolean))];if(!ids.length||!REMOTE)return;try{const q=new URLSearchParams({select:'id,username,avatar_url',id:`in.(${ids.join(',')})`});for(const p of await request(`/rest/v1/profiles?${q}`)||[])state.profiles[p.id]=p}catch(_){} }
async function loadLikes(){state.liked.clear();const u=user();if(!u||!REMOTE)return;try{const q=new URLSearchParams({select:'mod_id',user_id:`eq.${u.id}`});for(const r of await request(`/rest/v1/community_mod_likes?${q}`)||[])state.liked.add(String(r.mod_id))}catch(_){} }
async function loadFavorites(){state.favorites.clear();const u=user();if(!u||!REMOTE)return;try{const q=new URLSearchParams({select:'mod_id',user_id:`eq.${u.id}`});for(const r of await request(`/rest/v1/community_mod_favorites?${q}`)||[])state.favorites.add(String(r.mod_id))}catch(_){} }
async function load(){if(state.loading)return;state.loading=true;state.error='';renderPage();try{if(!REMOTE)throw new Error(tx('Supabase n’est pas configuré.','Supabase is not configured.'));const q=new URLSearchParams({select:'*',is_hidden:'eq.false',order:'created_at.desc'});state.rows=await request(`/rest/v1/community_mods?${q}`)||[];await Promise.all([loadProfiles(state.rows.map(r=>r.creator_id)),loadLikes(),loadFavorites()])}catch(e){state.error=String(e.message||e)}finally{state.loading=false;renderPage()}}
function availableCharacters(){
  const source=Array.isArray(window.MHUR_CHARACTER_LIST)?window.MHUR_CHARACTER_LIST:[];
  if(source.length)return source.map(c=>c.name).filter(Boolean).sort((a,b)=>a.localeCompare(b));
  return [...new Set(state.rows.map(r=>r.character_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function filtered(){let rows=state.rows.filter(r=>{const cat=normalizedCategory(r.category);const text=`${r.title||''} ${r.description||''} ${r.character_name||''} ${r.file_name||''} ${(r.tags||[]).join(' ')}`.toLowerCase();return (state.category==='all'||cat===state.category)&&(state.character==='all'||r.character_name===state.character)&&(!state.query||text.includes(state.query.toLowerCase()))});return rows.sort((a,b)=>state.sort==='downloads'?(b.downloads_count||0)-(a.downloads_count||0):state.sort==='likes'?(b.likes_count||0)-(a.likes_count||0):state.sort==='name'?String(a.title).localeCompare(String(b.title)):new Date(b.created_at)-new Date(a.created_at))}
function preview(r,controls=false){if(r.preview_url&&r.preview_type==='video')return `<video src="${esc(r.preview_url)}" ${controls?'controls':'muted loop playsinline'} preload="metadata"></video>`;if(r.preview_url)return `<img src="${esc(r.preview_url)}" alt="${esc(r.title)}" loading="lazy">`;return `<div class="modPreviewFallback">🧩</div>`}
function tags(r){const arr=[categoryLabel(r.category),r.character_name,...(Array.isArray(r.tags)?r.tags:[])].filter(Boolean);return [...new Set(arr)].map(t=>`<button class="modTag" data-mod-tag="${esc(t)}">${esc(t)}</button>`).join('')}
function isMine(r){const u=user();return Boolean(u&&r&&String(u.id)===String(r.creator_id||''))}
function securityLabel(r){const status=String(r?.security_status||'extension_checked');const map={verified:[tx('Fichier vérifié','Verified file'),'verified'],checksum:[tx('Empreinte SHA-256','SHA-256 fingerprint'),'verified'],extension_checked:[tx('Format contrôlé','Format checked'),'checked'],unverified:[tx('Non vérifié','Unverified'),'warning'],blocked:[tx('Bloqué','Blocked'),'blocked']};const [label,cls]=map[status]||map.unverified;return `<span class="modSecurityBadge ${cls}">🛡️ ${esc(label)}</span>`}
function card(r){
  const p=state.profiles[r.creator_id]||{};
  const mine=isMine(r);
  return `<article class="modCard" data-mod-id="${esc(r.id)}">
    <button class="modCardOpen" data-mod-open="${esc(r.id)}" aria-label="${tx('Ouvrir le mod','Open mod')}"><div class="modPreview">${preview(r)}</div></button>
    <div class="modBody">
      <div class="modTags">${tags(r)}</div>
      <button class="modTitle" data-mod-open="${esc(r.id)}"><h3>${esc(r.title)}</h3></button>
      ${r.character_name?`<b>👤 ${esc(r.character_name)}</b>`:''}
      <p>${esc(r.description)}</p>
      <div class="modMeta">${esc(p.username||tx('Membre','Member'))} · ${formatDate(r.created_at)} · ${formatSize(r.file_size)}</div>${securityLabel(r)}
      <div class="modStats"><span>♥ ${Number(r.likes_count)||0}</span><span>⬇ ${Number(r.downloads_count)||0}</span><button class="modFavorite ${state.favorites.has(String(r.id))?'active':''}" type="button" data-mod-favorite="${esc(r.id)}" title="${tx('Favori','Favorite')}">★</button></div>
      ${mine?`<div class="modOwnerActions"><button class="modEdit" type="button" data-mod-edit="${esc(r.id)}">✏️ ${tx('Modifier','Edit')}</button></div>`:''}
    </div>
  </article>`;
}
function tutorial(){return `<details class="modsTutorial"><summary>📘 ${tx('Installer des mods — PC Steam uniquement','Install mods — PC Steam only')}</summary><div class="modsTutorialBody"><div class="modsWarning">⚠️ ${tx('Ce tutoriel concerne uniquement la version PC Steam de My Hero Ultra Rumble. Les mods ne fonctionnent pas sur console.','This tutorial is only for the PC Steam version of My Hero Ultra Rumble. Mods do not work on console.')}</div><section class="modsTutorialSteps modsTutorialStepsFinal"><article><h3>1. ${tx('Activer l’option de lancement','Enable the launch option')}</h3><ol><li>${tx('Va dans ta bibliothèque Steam.','Go to your Steam library.')}</li><li>${tx('Fais un clic droit sur My Hero Ultra Rumble.','Right-click My Hero Ultra Rumble.')}</li><li>${tx('Clique sur Propriétés.','Click Properties.')}</li><li>${tx('Dans Général, trouve Options de lancement.','In General, find Launch Options.')}</li><li>${tx('Copie-colle exactement cette commande :','Copy and paste this exact command:')} <button class="modsCopyCommand" type="button" data-copy="-fileopenlog"><code>-fileopenlog</code><span>${tx('Copier','Copy')}</span></button></li></ol><p class="modsImportant">${tx('Sans cette commande, le jeu ne chargera pas les mods.','Without this command, the game will not load mods.')}</p><img class="modsTutorialStepImage" src="assets/mods-tutorial/steps/etape-1.png" data-fr-src="assets/mods-tutorial/steps/etape-1.png" data-en-src="assets/mods-tutorial/steps/etape-1-en.png" loading="lazy" decoding="async" alt="${tx('Steam : Propriétés et option de lancement -fileopenlog','Steam: Properties and the -fileopenlog launch option')}"></article><article><h3>2. ${tx('Ouvrir les fichiers locaux','Open local files')}</h3><ol><li>${tx('Refais un clic droit sur My Hero Ultra Rumble.','Right-click My Hero Ultra Rumble again.')}</li><li>${tx('Clique sur Gérer.','Click Manage.')}</li><li>${tx('Puis clique sur Parcourir les fichiers locaux.','Then click Browse local files.')}</li></ol><img class="modsTutorialStepImage" src="assets/mods-tutorial/steps/etape-2.png" data-fr-src="assets/mods-tutorial/steps/etape-2.png" data-en-src="assets/mods-tutorial/steps/etape-2-en.png" loading="lazy" decoding="async" alt="${tx('Steam : Gérer puis Parcourir les fichiers locaux','Steam: Manage then Browse local files')}"></article><article><h3>3. ${tx('Ouvrir HerovsGame','Open HerovsGame')}</h3><ol><li>${tx('Dans le dossier du jeu, double-clique sur','In the game folder, double-click')} <code>HerovsGame</code>.</li></ol><img class="modsTutorialStepImage" src="assets/mods-tutorial/steps/etape-3.png" data-fr-src="assets/mods-tutorial/steps/etape-3.png" data-en-src="assets/mods-tutorial/steps/etape-3-en.png" loading="lazy" decoding="async" alt="${tx('Dossier HerovsGame','HerovsGame folder')}"></article><article><h3>4. ${tx('Ouvrir Content puis Paks','Open Content then Paks')}</h3><ol><li>${tx('Dans HerovsGame, ouvre','Inside HerovsGame, open')} <code>Content</code>.</li><li>${tx('Ensuite, ouvre','Then open')} <code>Paks</code>.</li></ol><img class="modsTutorialStepImage" src="assets/mods-tutorial/steps/etape-4.png" data-fr-src="assets/mods-tutorial/steps/etape-4.png" data-en-src="assets/mods-tutorial/steps/etape-4-en.png" loading="lazy" decoding="async" alt="${tx('Dossiers Content et Paks','Content and Paks folders')}"></article><article><h3>5. ${tx('Créer le dossier Mods','Create the Mods folder')}</h3><ol><li>${tx('Dans Paks, crée un nouveau dossier.','Inside Paks, create a new folder.')}</li><li>${tx('Nomme-le exactement','Name it exactly')} <code>Mods</code> ${tx('(avec une majuscule).','(with a capital M).')}</li></ol><img class="modsTutorialStepImage" src="assets/mods-tutorial/steps/etape-5.png" data-fr-src="assets/mods-tutorial/steps/etape-5.png" data-en-src="assets/mods-tutorial/steps/etape-5-en.png" loading="lazy" decoding="async" alt="${tx('Création du dossier Mods','Creating the Mods folder')}"></article><article><h3>6. ${tx('Ajouter les fichiers .pak','Add the .pak files')}</h3><ol><li>${tx('Ouvre le dossier Mods.','Open the Mods folder.')}</li><li>${tx('Place tous les fichiers .pak téléchargés dans ce dossier.','Place all downloaded .pak files in this folder.')}</li><li>${tx('Lance ensuite le jeu depuis Steam.','Then launch the game from Steam.')}</li></ol><p><code>SteamLibrary/steamapps/common/My Hero Ultra Rumble/HerovsGame/Content/Paks/Mods</code></p><img class="modsTutorialStepImage" src="assets/mods-tutorial/steps/etape-6.png" data-fr-src="assets/mods-tutorial/steps/etape-6.png" data-en-src="assets/mods-tutorial/steps/etape-6-en.png?v=406" loading="lazy" decoding="async" alt="${tx('Ajout des fichiers pak dans Mods','Adding pak files to Mods')}"></article><article class="modsTutorialDone"><h3>✅ ${tx('C’est terminé','You are done')}</h3><p>${tx('Si le mod est compatible et correctement installé, il sera chargé automatiquement. Pour retirer un mod, supprime simplement son fichier .pak du dossier Mods.','If the mod is compatible and installed correctly, it will load automatically. To remove a mod, simply delete its .pak file from the Mods folder.')}</p></article></section></div></details>`}
function pageHtml(){const catOptions=CATEGORIES.map(c=>`<option value="${c}" ${state.category===c?'selected':''}>${esc(categoryLabel(c))}</option>`).join('');const charOptions=availableCharacters().map(c=>`<option value="${esc(c)}" ${state.character===c?'selected':''}>${esc(c)}</option>`).join('');const rows=filtered();return `<div class="modsPage"><section class="modsHero"><div><h1>🧩 Mods</h1><p>${tx('Découvre, filtre et partage les créations de la communauté MHUR.','Discover, filter and share MHUR community creations.')}</p></div><button class="modsPrimary" id="modsPublishBtn">＋ ${tx('Publier un mod','Publish a mod')}</button></section>${tutorial()}<section class="modsToolbar" aria-label="Filtres"><input id="modsSearch" value="${esc(state.query)}" placeholder="${tx('Rechercher par nom, auteur, personnage…','Search by name, author, character…')}"><select id="modsCategory"><option value="all">${tx('Toutes les catégories','All categories')}</option>${catOptions}</select><select id="modsCharacter"><option value="all">${tx('Tous les personnages','All characters')}</option>${charOptions}</select><select id="modsSort"><option value="recent" ${state.sort==='recent'?'selected':''}>${tx('Plus récents','Newest')}</option><option value="downloads" ${state.sort==='downloads'?'selected':''}>${tx('Plus téléchargés','Most downloaded')}</option><option value="likes" ${state.sort==='likes'?'selected':''}>${tx('Plus aimés','Most liked')}</option><option value="name" ${state.sort==='name'?'selected':''}>A–Z</option></select></section><div class="modsResultCount">${rows.length} ${tx(rows.length>1?'mods trouvés':'mod trouvé',rows.length===1?'mod found':'mods found')}</div>${state.loading?`<div class="modsEmpty">${tx('Chargement…','Loading…')}</div>`:state.error?`<div class="modsError">${esc(state.error)}<br><small>${tx('Exécute les scripts SQL V387 puis V390 dans Supabase.','Run the V387 then V390 SQL scripts in Supabase.')}</small></div>`:rows.length?`<div class="modsGrid">${rows.map(card).join('')}</div>`:`<div class="modsEmpty">${tx('Aucun mod ne correspond aux filtres.','No mods match these filters.')}</div>`}</div>`}
function renderPage(){if(typeof page==='undefined'||page!=='mods')return;const root=document.getElementById('content')||document.querySelector('main')||document.body;root.innerHTML=pageHtml();bindPage()}
function bindPage(){
  document.querySelectorAll('.modsCopyCommand').forEach(b=>b.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText(b.dataset.copy||'-fileopenlog');
      const span=b.querySelector('span');
      if(span){const old=span.textContent;span.textContent=tx('Copié !','Copied!');setTimeout(()=>span.textContent=old,1400)}
    }catch(_){prompt(tx('Copie cette commande :','Copy this command:'),b.dataset.copy||'-fileopenlog')}
  }));
  document.getElementById('modsPublishBtn')?.addEventListener('click',openPublish);
  document.getElementById('modsSearch')?.addEventListener('input',e=>{state.query=e.target.value;renderPage()});
  document.getElementById('modsCategory')?.addEventListener('change',e=>{state.category=e.target.value;renderPage()});
  document.getElementById('modsCharacter')?.addEventListener('change',e=>{state.character=e.target.value;renderPage()});
  document.getElementById('modsSort')?.addEventListener('change',e=>{state.sort=e.target.value;renderPage()});
  document.querySelectorAll('[data-mod-open]').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.modOpen)));
  document.querySelectorAll('[data-mod-edit]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openEdit(b.dataset.modEdit)}));
  document.querySelectorAll('[data-mod-favorite]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();toggleFavorite(b.dataset.modFavorite)}));
  document.querySelectorAll('[data-mod-tag]').forEach(b=>b.addEventListener('click',()=>{
    const t=b.dataset.modTag;
    if(CATEGORIES.includes(t.toLowerCase()))state.category=t.toLowerCase();else state.character=t;
    renderPage();
  }));
}
function characterOptions(){let arr=[];try{const source=window.MHUR_CHARACTER_LIST||window.CHARACTERS||window.characterData||[];arr=Array.isArray(source)?source:Object.values(source);arr=arr.map(x=>({id:x.id||x.slug||x.key||x.name,name:x.name||x.character_name||x.title})).filter(x=>x.id&&x.name)}catch(_){}return arr.sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(x=>`<option value="${esc(x.id)}" data-name="${esc(x.name)}">${esc(x.name)}</option>`).join('')}
function ensurePublishModal(){
  let m=document.getElementById('modsPublishModal');
  if(m)return m;
  m=document.createElement('div');
  m.id='modsPublishModal';
  m.className='modsModal';
  m.hidden=true;
  m.innerHTML=`<div class="modsDialog">
    <div class="modsDialogHead"><h2 id="modsFormTitle">${tx('Publier un mod','Publish a mod')}</h2><button class="modsClose" type="button">×</button></div>
    <form class="modsForm" id="modsForm">
      <label>${tx('Nom du mod','Mod name')}<input name="title" maxlength="100" required></label>
      <label>${tx('Description','Description')}<textarea name="description" maxlength="3000" required></textarea></label>
      <div class="modsFormGrid">
        <label>${tx('Catégorie','Category')}<select name="category" required>${CATEGORIES.map(c=>`<option value="${c}">${categoryLabel(c)}</option>`).join('')}</select></label>
        <label>${tx('Version du mod','Mod version')}<input name="mod_version" value="1.0" maxlength="30"></label>
        <label>${tx('Version du jeu','Game version')}<input name="game_version" placeholder="Saison 18 / Season 18" maxlength="50"></label>
      </div>
      <label class="modsCharacterField">${tx('Personnage concerné','Related character')}<select name="character_id"><option value="">${tx('Aucun / général','None / general')}</option>${characterOptions()}</select></label>
      <label>${tx('Tags supplémentaires','Additional tags')}<input name="tags" placeholder="HUD, recolor, voice…"><span class="modsFieldHint">${tx('Sépare les tags avec des virgules.','Separate tags with commas.')}</span></label>
      <label>${tx('Fichier du mod','Mod file')}<input name="mod_file" type="file"><span class="modsFieldHint modsModFileHint">.pak, .utoc, .ucas ou .zip — 200 MB maximum</span></label>
      <label>${tx('Image ou vidéo de présentation','Preview image or video')}<input name="preview_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"><span class="modsFieldHint modsPreviewFileHint">JPG, PNG, WEBP, GIF, MP4 ou WEBM — 20 MB maximum</span></label>
      <button class="modsSubmit" type="submit">${tx('Publier','Publish')}</button>
      <div class="modsProgress" id="modsProgress"></div>
    </form>
  </div>`;
  document.body.appendChild(m);
  m.querySelector('.modsClose').onclick=()=>m.hidden=true;
  m.addEventListener('click',e=>{if(e.target===m)m.hidden=true});
  m.querySelector('#modsForm').addEventListener('submit',publish);
  return m;
}
async function upload(bucket,path,file){
  const r=await fetch(`${API}/storage/v1/object/${bucket}/${path}`,{
    method:'POST',
    headers:{apikey:KEY,Authorization:`Bearer ${token()}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},
    body:file
  });
  const txt=await r.text();
  if(!r.ok)throw new Error((()=>{try{return JSON.parse(txt).message}catch(_){return txt}})());
  return `${API}/storage/v1/object/public/${bucket}/${path}`;
}
async function deleteStorageObject(bucket,path){
  if(!path)return;
  await request(`/storage/v1/object/${bucket}`,{method:'DELETE',body:JSON.stringify({prefixes:[path]})});
}
function fileExtension(file){return (file?.name?.match(/\.[^.]+$/)?.[0]||'').toLowerCase()}
function validateModFile(file,required=false){
  if(!file){if(required)throw new Error(tx('Choisis un fichier de mod.','Choose a mod file.'));return}
  if(!['.pak','.utoc','.ucas','.zip'].includes(fileExtension(file)))throw new Error(tx('Format de mod non accepté.','Unsupported mod format.'));
  if(file.size>200*1024*1024)throw new Error(tx('Le fichier dépasse 200 MB.','The file exceeds 200 MB.'));
}
function validatePreviewFile(file,required=false){
  if(!file){if(required)throw new Error(tx('Choisis une image ou une vidéo de présentation.','Choose a preview image or video.'));return}
  const allowedMime=/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm))$/i.test(file.type||'');
  const allowedExt=['.jpg','.jpeg','.png','.webp','.gif','.mp4','.webm'].includes(fileExtension(file));
  if(!allowedMime&&!allowedExt)throw new Error(tx('Format de présentation non accepté.','Unsupported preview format.'));
  if(file.size>20*1024*1024)throw new Error(tx('La présentation dépasse 20 MB.','The preview exceeds 20 MB.'));
}
async function fileSha256(file){
  if(!file||!window.crypto?.subtle||file.size>64*1024*1024)return '';
  const data=await file.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function inspectModFile(file){
  if(!file)return {file_sha256:null,security_status:'extension_checked',security_note:null};
  const lower=String(file.name||'').toLowerCase();
  const dangerous=['.exe','.msi','.bat','.cmd','.com','.scr','.ps1','.vbs','.js','.jar','.apk','.dmg'];
  if(dangerous.some(ext=>lower.includes(ext+'.')||lower.endsWith(ext)))throw new Error(tx('Nom de fichier dangereux ou double extension interdite.','Dangerous filename or forbidden double extension.'));
  if(/\.(pak|utoc|ucas|zip)\s*\.(?!pak$|utoc$|ucas$|zip$)/i.test(lower))throw new Error(tx('Double extension suspecte.','Suspicious double extension.'));
  if(file.size<=0)throw new Error(tx('Le fichier est vide.','The file is empty.'));
  const ext=fileExtension(file);
  if(ext==='.zip'){
    const sig=new Uint8Array(await file.slice(0,4).arrayBuffer());
    const ok=sig[0]===0x50&&sig[1]===0x4b&&[[0x03,0x04],[0x05,0x06],[0x07,0x08]].some(x=>sig[2]===x[0]&&sig[3]===x[1]);
    if(!ok)throw new Error(tx('Ce fichier porte l’extension ZIP mais sa signature est invalide.','This file has a ZIP extension but an invalid signature.'));
  }
  const hash=await fileSha256(file);
  return {file_sha256:hash||null,security_status:hash?'checksum':'extension_checked',security_note:hash?tx('SHA-256 calculé dans le navigateur.','SHA-256 calculated in the browser.'):tx('Extension, taille et nom contrôlés.','Extension, size and filename checked.')};
}
function setModFormMode(row=null){
  const m=ensurePublishModal();
  const f=m.querySelector('#modsForm');
  f.reset();
  state.editingId=row?.id||null;
  f.dataset.editId=row?.id||'';
  m.querySelector('#modsFormTitle').textContent=row?tx('Modifier le mod','Edit mod'):tx('Publier un mod','Publish a mod');
  f.querySelector('.modsSubmit').textContent=row?tx('Enregistrer les modifications','Save changes'):tx('Publier','Publish');
  f.elements.title.value=row?.title||'';
  f.elements.description.value=row?.description||'';
  f.elements.category.value=normalizedCategory(row?.category||'skin');
  f.elements.mod_version.value=row?.mod_version||'1.0';
  f.elements.game_version.value=row?.game_version||'';
  f.elements.tags.value=Array.isArray(row?.tags)?row.tags.join(', '):'';
  const characterSelect=f.elements.character_id;
  if(row?.character_id&&!Array.from(characterSelect.options).some(o=>o.value===String(row.character_id))){
    characterSelect.add(new Option(row.character_name||String(row.character_id),String(row.character_id)));
  }
  characterSelect.value=row?.character_id||'';
  f.elements.mod_file.required=!row;
  f.elements.preview_file.required=!row;
  f.querySelector('.modsModFileHint').textContent=row
    ?`${tx('Fichier actuel','Current file')} : ${row.file_name||'—'} · ${tx('laisse vide pour le conserver','leave empty to keep it')}`
    :'.pak, .utoc, .ucas ou .zip — 200 MB maximum';
  f.querySelector('.modsPreviewFileHint').textContent=row
    ?tx('Laisse vide pour conserver la présentation actuelle.','Leave empty to keep the current preview.')
    :'JPG, PNG, WEBP, GIF, MP4 ou WEBM — 20 MB maximum';
  f.querySelector('#modsProgress').textContent='';
  m.hidden=false;
  m.querySelector('.modsDialog').scrollTop=0;
  requestAnimationFrame(()=>f.elements.title.focus());
}
function openEdit(id){
  const row=state.rows.find(r=>String(r.id)===String(id));
  if(!row||!isMine(row))return alert(tx('Seul le créateur peut modifier ce mod.','Only the creator can edit this mod.'));
  document.getElementById('modsDetailModal')?.setAttribute('hidden','');
  setModFormMode(row);
}
function openPublish(){
  if(!user()){window.MHUR_AUTH?.open?.();return}
  setModFormMode(null);
}
async function publish(e){
  e.preventDefault();
  const f=e.currentTarget;
  const u=user();
  const editingId=f.dataset.editId||'';
  const oldRow=editingId?state.rows.find(r=>String(r.id)===String(editingId)):null;
  const mod=f.elements.mod_file.files[0]||null;
  const pre=f.elements.preview_file.files[0]||null;
  const submit=f.querySelector('.modsSubmit');
  const progress=f.querySelector('#modsProgress');
  if(!u)return window.MHUR_AUTH?.open?.();
  if(!REMOTE)return alert(tx('Supabase n’est pas configuré.','Supabase is not configured.'));
  if(editingId&&(!oldRow||!isMine(oldRow)))return alert(tx('Seul le créateur peut modifier ce mod.','Only the creator can edit this mod.'));
  let security=null;
  try{
    validateModFile(mod,!editingId);
    validatePreviewFile(pre,!editingId);
    security=await inspectModFile(mod);
  }catch(error){return alert(error.message||String(error))}
  submit.disabled=true;
  const uploaded=[];
  let committed=false;
  try{
    const id=editingId||crypto.randomUUID();
    const payload={
      title:f.elements.title.value.trim(),
      description:f.elements.description.value.trim(),
      category:f.elements.category.value,
      character_id:f.elements.character_id.value||null,
      character_name:null,
      game_version:f.elements.game_version.value.trim()||null,
      mod_version:f.elements.mod_version.value.trim()||'1.0',
      tags:f.elements.tags.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,10),
      updated_at:new Date().toISOString()
    };
    const selected=f.elements.character_id.selectedOptions[0];
    payload.character_name=f.elements.character_id.value?(selected?.dataset.name||selected?.textContent||oldRow?.character_name):null;
    if(!editingId){payload.id=id;payload.creator_id=u.id}
    if(mod){
      const filePath=`${u.id}/${id}/${Date.now()}_${safeName(mod.name)}`;
      progress.textContent=tx('Envoi du mod…','Uploading mod…');
      payload.file_url=await upload('community-mods',filePath,mod);
      payload.file_path=filePath;
      payload.file_name=mod.name;
      payload.file_size=mod.size;
      payload.file_sha256=security?.file_sha256||null;
      payload.security_status=security?.security_status||'extension_checked';
      payload.security_note=security?.security_note||null;
      uploaded.push(['community-mods',filePath]);
    }
    if(pre){
      const previewPath=`${u.id}/${id}/${Date.now()}_${safeName(pre.name)}`;
      progress.textContent=tx('Envoi de la présentation…','Uploading preview…');
      payload.preview_url=await upload('mod-previews',previewPath,pre);
      payload.preview_path=previewPath;
      payload.preview_type=pre.type.startsWith('video/')?'video':'image';
      uploaded.push(['mod-previews',previewPath]);
    }
    progress.textContent=editingId?tx('Enregistrement…','Saving…'):tx('Publication…','Publishing…');
    if(editingId){
      await request('/rest/v1/community_mod_versions',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
        mod_id:id,creator_id:u.id,mod_version:oldRow?.mod_version||'1.0',game_version:oldRow?.game_version||null,
        description:oldRow?.description||'',file_url:oldRow?.file_url||'',file_path:oldRow?.file_path||'',file_name:oldRow?.file_name||'',
        file_size:Number(oldRow?.file_size)||0,created_at:oldRow?.updated_at||oldRow?.created_at||new Date().toISOString()
      })});
      const rows=await request(`/rest/v1/community_mods?id=eq.${encodeURIComponent(id)}&creator_id=eq.${encodeURIComponent(u.id)}&select=*`,{
        method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)
      });
      if(!Array.isArray(rows)||!rows.length)throw new Error(tx('Modification refusée ou mod introuvable.','Update refused or mod not found.'));
      /* L'ancien fichier est conservé pour l'historique des versions. */
      if(pre&&oldRow?.preview_path&&oldRow.preview_path!==payload.preview_path)try{await deleteStorageObject('mod-previews',oldRow.preview_path)}catch(_){}
    }else{
      await request('/rest/v1/community_mods',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});
    }
    committed=true;
    ensurePublishModal().hidden=true;
    f.reset();
    state.editingId=null;
    await load();
    if(editingId)await openDetail(editingId);
  }catch(err){
    if(!committed)for(const [bucket,path] of uploaded)try{await deleteStorageObject(bucket,path)}catch(_){}
    alert(err.message||String(err));
  }finally{
    submit.disabled=false;
    progress.textContent='';
  }
}
async function openDetail(id){
  const r=state.rows.find(x=>String(x.id)===String(id));
  if(!r)return;
  state.active=r;
  await loadComments(id);
  const p=state.profiles[r.creator_id]||{};
  const mine=isMine(r);
  const liked=state.liked.has(String(id));
  let m=document.getElementById('modsDetailModal');
  if(!m){
    m=document.createElement('div');
    m.id='modsDetailModal';
    m.className='modsModal';
    m.addEventListener('click',e=>{if(e.target===m)m.hidden=true});
    document.body.appendChild(m);
  }
  m.hidden=false;
  m.innerHTML=`<div class="modsDialog modsDetailDialog">
    <div class="modsDialogHead"><h2>${esc(r.title)}</h2><button class="modsClose" type="button">×</button></div>
    <div class="modsDetailPreview">${preview(r,true)}</div>
    <div class="modsDetailBody">
      <div class="modTags">${tags(r)}</div>
      <div class="modsDetailInfo"><span>👤 ${esc(p.username||tx('Membre','Member'))}</span><span>📦 ${esc(r.mod_version||'1.0')}</span>${r.game_version?`<span>🎮 ${esc(r.game_version)}</span>`:''}<span>💾 ${formatSize(r.file_size)}</span><span>📅 ${formatDate(r.created_at)}</span></div>
      <div class="modSecurityPanel">${securityLabel(r)}${r.file_sha256?`<code title="SHA-256">${esc(r.file_sha256.slice(0,16))}…</code>`:''}<small>${esc(r.security_note||tx('Le site contrôle le format, mais un mod reste une création communautaire.','The site checks the format, but a mod remains community-created.'))}</small></div>
      <p class="modsDetailDescription">${esc(r.description)}</p>
      <div class="modsDetailActions">
        <button class="modsLike ${liked?'active':''}" data-like="${esc(r.id)}">♥ ${Number(r.likes_count)||0}</button>
        <button class="modFavorite ${state.favorites.has(String(r.id))?'active':''}" data-favorite="${esc(r.id)}">★ ${tx('Favori','Favorite')}</button>
        <a class="modDownload" data-download="${esc(r.id)}" href="${esc(r.file_url)}" download="${esc(r.file_name||'mod.pak')}" target="_blank" rel="noopener">⬇ ${tx('Télécharger','Download')} · ${esc(r.file_name||'')}</a>
        <button class="modInstallGuide" data-install-guide="${esc(r.id)}">🛠 ${tx('Guide d’installation','Installation guide')}</button>
        <button class="modReport" data-report="${esc(r.id)}">⚑ ${tx('Signaler','Report')}</button>
        ${mine?`<button class="modEdit" data-edit="${esc(r.id)}">✏️ ${tx('Modifier','Edit')}</button><button class="modDelete" data-delete="${esc(r.id)}">🗑 ${tx('Supprimer','Delete')}</button>`:''}
      </div>
      <section class="modVersionHistory"><h3>🕘 ${tx('Historique des versions','Version history')}</h3><div id="modVersionHistoryList">${tx('Chargement…','Loading…')}</div></section>
      <section class="modsComments"><h3>💬 ${tx('Commentaires','Comments')}</h3>${user()?`<form id="modCommentForm"><textarea maxlength="1500" required placeholder="${tx('Écrire un commentaire…','Write a comment…')}"></textarea><button class="modsPrimary">${tx('Publier','Post')}</button></form>`:`<button class="modsPrimary" id="modsLoginComment">${tx('Se connecter pour commenter','Sign in to comment')}</button>`}<div class="modsCommentsList">${commentsHtml()}</div></section>
    </div>
  </div>`;
  m.querySelector('.modsClose').onclick=()=>m.hidden=true;
  m.querySelector('[data-like]')?.addEventListener('click',()=>toggleLike(r.id));
  m.querySelector('[data-favorite]')?.addEventListener('click',()=>toggleFavorite(r.id));
  m.querySelector('[data-install-guide]')?.addEventListener('click',()=>window.MHUR_PLUS?.modGuide?.open(r));
  m.querySelector('[data-report]')?.addEventListener('click',()=>window.MHUR_PLUS?.modReport?.open(r.id));
  m.querySelector('[data-download]')?.addEventListener('click',()=>incrementDownload(r.id));
  m.querySelector('[data-edit]')?.addEventListener('click',()=>openEdit(r.id));
  m.querySelector('[data-delete]')?.addEventListener('click',()=>removeMod(r.id));
  m.querySelector('#modCommentForm')?.addEventListener('submit',e=>postComment(e,r.id));
  m.querySelector('#modsLoginComment')?.addEventListener('click',()=>window.MHUR_AUTH?.open?.());
  window.MHUR_PLUS?.modHistory?.mount?.(r.id,document.getElementById('modVersionHistoryList'));
}
async function loadComments(id){state.comments=[];if(!REMOTE)return;try{const q=new URLSearchParams({select:'*',mod_id:`eq.${id}`,is_hidden:'eq.false',order:'created_at.asc'});state.comments=await request(`/rest/v1/community_mod_comments?${q}`)||[];await loadProfiles(state.comments.map(x=>x.user_id))}catch(_){} }
function commentsHtml(){if(!state.comments.length)return `<div class="modsEmpty">${tx('Aucun commentaire pour le moment.','No comments yet.')}</div>`;return state.comments.map(c=>{const p=state.profiles[c.user_id]||{};return `<article class="modComment"><div class="modCommentAvatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:'👤'}</div><div><b>${esc(p.username||tx('Membre','Member'))}</b><small>${formatDate(c.created_at)}</small><p>${esc(c.body)}</p></div></article>`}).join('')}
async function postComment(e,id){e.preventDefault();const body=e.currentTarget.querySelector('textarea').value.trim(),u=user();if(!body||!u)return;try{await request('/rest/v1/community_mod_comments',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({mod_id:id,user_id:u.id,body})});await openDetail(id)}catch(err){alert(err.message||String(err))}}
async function toggleLike(id){const u=user();if(!u)return window.MHUR_AUTH?.open?.();try{const liked=state.liked.has(String(id));if(liked){await request(`/rest/v1/community_mod_likes?mod_id=eq.${id}&user_id=eq.${u.id}`,{method:'DELETE'});state.liked.delete(String(id))}else{await request('/rest/v1/community_mod_likes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({mod_id:id,user_id:u.id})});state.liked.add(String(id))}let count=0;try{count=await request('/rest/v1/rpc/refresh_mod_likes',{method:'POST',body:JSON.stringify({target_mod:id})})}catch(_){count=Math.max(0,(state.rows.find(r=>r.id===id)?.likes_count||0)+(liked?-1:1))}const row=state.rows.find(r=>String(r.id)===String(id));if(row)row.likes_count=count;await openDetail(id)}catch(err){alert(err.message||String(err))}}
async function toggleFavorite(id){
  const u=user();if(!u)return window.MHUR_AUTH?.open?.();
  try{
    if(state.favorites.has(String(id))){await request(`/rest/v1/community_mod_favorites?mod_id=eq.${encodeURIComponent(id)}&user_id=eq.${u.id}`,{method:'DELETE'});state.favorites.delete(String(id));}
    else{await request('/rest/v1/community_mod_favorites',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({mod_id:id,user_id:u.id})});state.favorites.add(String(id));}
    renderPage();if(state.active&&String(state.active.id)===String(id))await openDetail(id);window.dispatchEvent(new CustomEvent('mhur-mod-favorites-change'));
  }catch(err){alert(err.message||String(err))}
}
async function incrementDownload(id){
  if(!user())return;
  try{
    const count=Number(await request('/rest/v1/rpc/increment_mod_downloads',{method:'POST',body:JSON.stringify({target_mod:id})}))||0;
    const row=state.rows.find(r=>String(r.id)===String(id));
    if(row)row.downloads_count=count;
    document.querySelectorAll(`[data-mod-id="${id}"] .modStats span:last-child`).forEach(el=>el.textContent=`⬇ ${count}`);
  }catch(error){console.warn('Téléchargement non comptabilisé',error)}
}
async function removeMod(id){
  const row=state.rows.find(r=>String(r.id)===String(id));
  const u=user();
  if(!row||!u||!isMine(row))return;
  if(!confirm(tx('Supprimer définitivement ce mod ?','Permanently delete this mod?')))return;
  try{
    let history=[];try{history=await request(`/rest/v1/community_mod_versions?mod_id=eq.${encodeURIComponent(id)}&select=file_path`)}catch(_){}
    await request(`/rest/v1/community_mods?id=eq.${encodeURIComponent(id)}&creator_id=eq.${encodeURIComponent(u.id)}`,{method:'DELETE'});
    for(const [bucket,path] of [['community-mods',row.file_path],['mod-previews',row.preview_path],...(history||[]).map(v=>['community-mods',v.file_path])])if(path)try{await deleteStorageObject(bucket,path)}catch(_){}
    document.getElementById('modsDetailModal')?.setAttribute('hidden','');
    await load();
  }catch(e){alert(e.message||String(e))}
}
function addMenu(){const drawer=document.getElementById('drawer');if(!drawer)return;let btn=drawer.querySelector('[data-mhur-mods]');if(!btn){btn=document.createElement('a');btn.href='#mods';btn.className='navItem';btn.dataset.mhurMods='1';btn.dataset.mhurHub='1';btn.innerHTML='🧩 <span>Mods</span>';btn.addEventListener('click',e=>{e.preventDefault();openPage()});const builds=[...drawer.querySelectorAll('.navItem')].find(x=>/community builds|builds communaut|build communaut/i.test(x.textContent));(builds?.parentElement||drawer).insertBefore(btn,builds?.nextSibling||null)}btn.classList.toggle('active',typeof page!=='undefined'&&page==='mods');window.MHUR_V386?.refreshMenuSections?.()}
function openPage(){page='mods';selectedChar=null;selectedStyle=null;selectedCostume=null;document.getElementById('drawer')?.classList.remove('open');if(location.hash!=='#mods')history.pushState(null,'','#mods');renderPage();addMenu()}
const originalLayout=window.layout;window.layout=function(){const out=originalLayout?.apply(this,arguments);setTimeout(()=>{addMenu();if(typeof page!=='undefined'&&page==='mods')renderPage()},0);return out};
window.addEventListener('hashchange',()=>{if(location.hash==='#mods')openPage()});
new MutationObserver(addMenu).observe(document.documentElement,{childList:true,subtree:true});
window.MHUR_MODS={open:openPage,refresh:load,state,request,openDetail,toggleFavorite,loadFavorites};
window.addEventListener('mhur-auth-change',()=>{Promise.all([loadLikes(),loadFavorites()]).finally(()=>{renderPage();const detail=document.getElementById('modsDetailModal');if(detail&&!detail.hidden&&state.active)openDetail(state.active.id)})});
window.addEventListener('load',()=>{addMenu();if(location.hash==='#mods')openPage();load()},{once:true});
})();
