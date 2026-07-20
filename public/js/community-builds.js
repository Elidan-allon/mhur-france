(function(){
'use strict';

const CB_CFG = window.MHUR_COMMUNITY_CONFIG || {};
const CB_REMOTE = Boolean(
  /^https:\/\/.+\.supabase\.co\/?$/i.test(String(CB_CFG.supabaseUrl || '').trim())
  && String(CB_CFG.supabaseKey || '').trim()
);
const CB_API = String(CB_CFG.supabaseUrl || '').replace(/\/+$/, '');
const CB_KEY = String(CB_CFG.supabaseKey || '').trim();
const CB_STATE = {
  cache: Object.create(null),
  loading: Object.create(null),
  errors: Object.create(null),
  sort: Object.create(null),
  draft: null,
  currentDetail: null,
  publishing: false
};
const CB_LOCAL_KEY = 'mhur_community_builds_v304';
const CB_LIKED_KEY = 'mhur_community_liked_v304';
const CB_VOTER_KEY = 'mhur_community_voter_v304';

function cbEsc(value){
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
function cbPlain(value, max=500){
  return String(value ?? '').replace(/\s+/g,' ').trim().slice(0,max);
}
function cbIsEnglish(){return typeof lang!=='undefined'&&lang==='en'}
function cbGameText(value){
  const fn=window.MHUR_TRANSLATE_GAME_TEXT;
  return cbIsEnglish()&&typeof fn==='function'?fn(value):String(value??'');
}
function cbCostumeText(value){
  const fn=window.MHUR_TRANSLATE_COSTUME_TEXT;
  return cbIsEnglish()&&typeof fn==='function'?fn(value):String(value??'');
}
function cbTuningName(tuning){return cbGameText(tuning?.name||'')}
function cbTuningDesc(tuning){return cbGameText(tuning?.desc||'')}
function cbCharacterFamilyId(charId){
  const id=String(charId||'');
  if(id==='midoriya'||id==='midoriya_ofa')return 'midoriya';
  return id;
}
function cbTuningFamilyId(tuning){
  const styleKey=String(tuning?.styleKey||'');
  if(styleKey==='ofa'||styleKey==='assault'||styleKey==='fullbullet')return 'midoriya';
  const ch=characters.find(c=>(c.styles||[]).includes(styleKey));
  return cbCharacterFamilyId(ch?.id||'');
}
const cbIconStar=filled=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.7l2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.9l-5.56 2.92 1.06-6.2L3 9.23l6.22-.9L12 2.7z" ${filled?'fill="currentColor"':'fill="none"'} stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;
const cbIconHeart=filled=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" ${filled?'fill="currentColor"':'fill="none"'} stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;
const cbGenericAvatar=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm-7.5 8.5c.55-4.2 3.05-6.3 7.5-6.3s6.95 2.1 7.5 6.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
function cbUuid(){
  if(window.crypto && typeof window.crypto.randomUUID === 'function'){
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
    const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8);
    return v.toString(16);
  });
}
function cbVoterId(){
  const authId=window.MHUR_AUTH?.getUser?.()?.id;
  if(authId) return authId;
  let id=localStorage.getItem(CB_VOTER_KEY);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||'')){
    id=cbUuid();
    localStorage.setItem(CB_VOTER_KEY,id);
  }
  return id;
}
function cbLikedSet(){
  try{return new Set(JSON.parse(localStorage.getItem(CB_LIKED_KEY)||'[]'))}
  catch(_){return new Set()}
}
function cbSaveLiked(set){
  localStorage.setItem(CB_LIKED_KEY,JSON.stringify([...set]));
}
function cbLocalAll(){
  try{
    const data=JSON.parse(localStorage.getItem(CB_LOCAL_KEY)||'[]');
    return Array.isArray(data)?data:[];
  }catch(_){return []}
}
function cbSaveLocal(data){
  localStorage.setItem(CB_LOCAL_KEY,JSON.stringify(data));
}
function cbKey(charId,styleId){return `${charId}::${styleId}`}
function cbCharacter(charId){return characters.find(x=>x.id===charId)||null}
function cbStyle(styleId){return styles[styleId]||null}
function cbStyleName(styleId){
  try{return styleKeyLabel(styleId)}
  catch(_){return label(cbStyle(styleId)?.name||styleId)}
}
function cbRoleName(styleId){
  const role=cbStyle(styleId)?.role||'';
  return label(roles[role]||role);
}
function cbNormalizeBuild(row){
  const slots=Array.isArray(row.tuning_slots)?row.tuning_slots:(Array.isArray(row.slots)?row.slots:[]);
  return {
    id:String(row.id||''),
    character_id:String(row.character_id||row.characterId||''),
    style_id:String(row.style_id||row.styleId||''),
    costume_id:String(row.costume_id||row.costumeId||''),
    costume_name:String(row.costume_name||row.costumeName||'Costume'),
    costume_variant:String(row.costume_variant||row.costumeVariant||'Original'),
    costume_img:String(row.costume_img||row.costumeImg||''),
    title:String(row.title||'Build sans nom'),
    author:String(row.author||'Anonyme'),
    description:String(row.description||''),
    tuning_slots:slots,
    likes_count:Number(row.likes_count??row.likes??0),
    created_at:String(row.created_at||row.createdAt||new Date().toISOString()),
    creator_id:String(row.creator_id||row.creatorId||''),
    is_verified:Boolean(row.is_verified),
    author_profile:row.profile||row.author_profile||null,
    source:row.source||(/^[0-9a-f-]{36}$/i.test(String(row.id||''))?'remote':'local')
  };
}
function cbSortBuilds(list,key){
  const mode=CB_STATE.sort[key]||'popular';
  return [...list].sort((a,b)=>{
    if(mode==='recent') return String(b.created_at).localeCompare(String(a.created_at));
    return (b.likes_count-a.likes_count)||String(b.created_at).localeCompare(String(a.created_at));
  });
}
async function cbRequest(path,options={}){
  const authToken=window.MHUR_AUTH?.getAccessToken?.()||CB_KEY;
  const headers={
    apikey:CB_KEY,
    Authorization:`Bearer ${authToken}`,
    'Content-Type':'application/json',
    ...(options.headers||{})
  };
  const response=await fetch(CB_API+path,{...options,headers});
  const text=await response.text();
  let data=null;
  if(text){
    try{data=JSON.parse(text)}catch(_){data=text}
  }
  if(!response.ok){
    const message=data?.message||data?.error_description||data?.hint||text||`HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}
async function cbLoadRemote(charId,styleId){
  const query=new URLSearchParams({
    select:'*,profile:profiles!community_builds_creator_profile_fkey(id,username,avatar_url,provider,created_at)',
    character_id:`eq.${charId}`,
    style_id:`eq.${styleId}`,
    is_hidden:'eq.false',
    order:'likes_count.desc,created_at.desc'
  });
  let rows;
  try{
    rows=await cbRequest(`/rest/v1/community_builds?${query.toString()}`);
  }catch(error){
    if(!/relationship|schema cache|profiles/i.test(String(error.message||error))) throw error;
    query.set('select','*');
    rows=await cbRequest(`/rest/v1/community_builds?${query.toString()}`);
  }
  return (Array.isArray(rows)?rows:[]).map(cbNormalizeBuild);
}
function cbLoadLocal(charId,styleId){
  return cbLocalAll()
    .filter(x=>x.character_id===charId&&x.style_id===styleId)
    .map(cbNormalizeBuild);
}
function cbRefreshVisible(){
  window.__keepScroll=true;
  window.__scrollY=window.scrollY;
  if(typeof render==='function') render();
  requestAnimationFrame(()=>window.scrollTo(0,window.__scrollY||0));
  if(CB_STATE.currentDetail){
    requestAnimationFrame(()=>cbRenderBuildDetail(CB_STATE.currentDetail));
  }
}
async function cbEnsureLoaded(charId,styleId,force=false){
  const key=cbKey(charId,styleId);
  if(!force && CB_STATE.cache[key]) return CB_STATE.cache[key];
  if(CB_STATE.loading[key]) return CB_STATE.loading[key];
  CB_STATE.errors[key]='';
  const promise=(async()=>{
    try{
      const list=CB_REMOTE
        ?await cbLoadRemote(charId,styleId)
        :cbLoadLocal(charId,styleId);
      CB_STATE.cache[key]=cbSortBuilds(list,key);
      return CB_STATE.cache[key];
    }catch(error){
      CB_STATE.errors[key]=error.message||String(error);
      const fallback=cbLoadLocal(charId,styleId);
      CB_STATE.cache[key]=cbSortBuilds(fallback,key);
      return CB_STATE.cache[key];
    }finally{
      delete CB_STATE.loading[key];
      cbRefreshVisible();
    }
  })();
  CB_STATE.loading[key]=promise;
  return promise;
}
function cbBuilds(charId,styleId){
  const key=cbKey(charId,styleId);
  if(!CB_STATE.cache[key]&&!CB_STATE.loading[key]){
    setTimeout(()=>cbEnsureLoaded(charId,styleId),0);
  }
  return cbSortBuilds(CB_STATE.cache[key]||[],key);
}
function cbFormatDate(value){
  try{
    return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'})
      .format(new Date(value));
  }catch(_){return ''}
}
function cbHeartHtml(build,compact=false){
  const liked=cbLikedSet().has(build.id);
  const title=cbIsEnglish()?(liked?'Remove like':'Like'):(liked?'Retirer le cœur':'Ajouter un cœur');
  return `<button class="cbHeart cbIconAction ${liked?'liked':''} ${compact?'compact':''}" title="${title}" aria-label="${title}" onclick="event.stopPropagation();communityToggleHeart('${cbEsc(build.id)}')"><span class="cbActionIcon">${cbIconHeart(liked)}</span><b>${build.likes_count||0}</b></button>`;
}
function cbSlotEntries(build){
  return Array.isArray(build.tuning_slots)?build.tuning_slots:[];
}
function cbBuildTuningCardV306(entry,size='normal',clickable=false){
  const tuning=entry.tuning||{};
  const color=entry.color||tuning.slot||'gray';
  const isSp=entry.kind==='sp';
  const condition=entry.condition||'';
  const nm=safeTuningName(cbTuningName(tuning));
  const fs=slotFontSize(nm);
  const text=tuning&&Object.keys(tuning).length
    ?(isSp
      ?`<span class="equippedChar">${cbEsc(tuning.character||'')}</span><span class="equippedName" style="--equip-font:${Math.max(14,fs-1)}px">${cbEsc(nm)}</span>`
      :`<span class="equippedName" style="--equip-font:${fs}px">${cbEsc(nm)}</span>`)
    :'';
  const tag=clickable?'button':'div';
  const click=clickable?` type="button" onclick="communitySelectDraftSlot('${cbEsc(entry.id)}');return false;"`:'';
  const max=Number(entry.max||0)||(isSp?(entry.side==='left'?3:4):3);
  return `<${tag}${click} class="gameSlot ${slotColorClass(color)} ${isSp?'spBand':''} ${tuning&&Object.keys(tuning).length?'filled':'empty'}" style="--slot-color:${slotHex(color)}">
    <div class="slotBandText">${text}</div><span class="slotMax">MAX ${max}</span>
    ${slotGem(color,isSp?condition:'',tuning.img||'')}
  </${tag}>`;
}
function cbBuildTuningColumnsV306(build,size='normal'){
  const entries=cbSlotEntries(build);
  const costume=cbBuildCostumeData(build);
  const enrich=entry=>({...entry,max:entry.max||(costume?costumeMaxLevel(costume,entry.kind,entry.side,Number(entry.index)||0):0)});
  const column=side=>`<section class="cbCostumeTuningColumnV306 ${size}">
    <h4>${side==='left'?(cbIsEnglish()?'Left':'Gauche'):(cbIsEnglish()?'Right':'Droite')}</h4>
    <div>${entries.filter(entry=>entry.side===side).map(entry=>cbBuildTuningCardV306(enrich(entry),size)).join('')}</div>
  </section>`;
  return `<div class="cbCostumeTuningGridV306 ${size}">${column('left')}${column('right')}</div>`;
}
function cbMiniSlots(build){
  return cbBuildTuningColumnsV306(build,'mini');
}
function cbAuthorProfile(build){
  const p=build.author_profile||{};
  const u=window.MHUR_AUTH?.getUser?.();
  const own=u&&String(build.creator_id||'')===String(u.id||'');
  const m=u?.user_metadata||{};
  const profile=window.MHUR_AUTH?.getProfile?.()||{};
  return {id:p.id||build.creator_id||'',username:(own?(profile.username||m.full_name||m.name):p.username)||build.author||'Anonyme',avatar_url:(own?(profile.avatar_url||m.avatar_url||m.picture):p.avatar_url)||'',provider:p.provider||u?.app_metadata?.provider||''};
}
function cbInitials(name){return String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function cbAuthorAvatar(profile){return profile.avatar_url?`<img class="cbAuthorAvatar" src="${cbEsc(profile.avatar_url)}" alt="${cbEsc(profile.username||'')}">`:`<span class="cbAuthorAvatar cbAuthorAvatarFallback">${cbGenericAvatar}</span>`}
function cbAuthorButton(build){const p=cbAuthorProfile(build);return p.id?`<button class="cbAuthorButton" onclick="event.stopPropagation();MHUR_PROFILES?.open('${cbEsc(p.id)}')">${cbAuthorAvatar(p)}<span>${cbEsc(p.username)}</span></button>`:`<span>${cbEsc(p.username)}</span>`}
function cbFavoriteHtml(build){
  const active=window.MHUR_PROFILES?.isFavorite?.(build.id);
  const title=cbIsEnglish()?(active?'Remove from favorites':'Add to favorites'):(active?'Retirer des favoris':'Ajouter aux favoris');
  return `<button class="cbFavorite cbIconAction ${active?'active':''}" title="${title}" aria-label="${title}" onclick="event.stopPropagation();communityToggleFavorite('${cbEsc(build.id)}')"><span class="cbActionIcon">${cbIconStar(active)}</span></button>`;
}
window.communityToggleFavorite=async function(id){await window.MHUR_PROFILES?.toggleFavorite?.(id);cbRefreshVisible()};
function cbBuildCard(build,index=0,compact=false){
  const char=cbCharacter(build.character_id);
  const styleName=cbStyleName(build.style_id);
  const costumeData=cbBuildCostumeData(build);
  return `<article class="cbBuildCard ${compact?'compact':''}" onclick="openCommunityBuildDetail('${cbEsc(build.id)}','${cbEsc(build.character_id)}','${cbEsc(build.style_id)}')">
    <div class="cbRank">${index+1}</div>
    <div class="cbBuildCostume">${asset(build.costume_img,build.costume_name+' '+build.costume_variant)}${cbCostumeRarityBadge(costumeData)}</div>
    <div class="cbBuildMain">
      <div class="cbBuildTitleLine"><h3>${cbEsc(build.title)}${window.MHUR_MODERATION?.verifiedBadge?.(build)||''}</h3><div class="cbBuildActions">${cbFavoriteHtml(build)}${cbHeartHtml(build,compact)}${cbOwnDeleteHtml(build,true)}</div></div>
      <div class="cbBuildMeta">
        ${cbAuthorButton(build)}
        <span>${cbEsc(char?.name||build.character_id)}</span>
        <span>${cbEsc(styleName)}</span>
        <span>${cbEsc(build.costume_name)} — ${cbEsc(build.costume_variant)}</span>
      </div>
      ${compact
        ?cbBuildTuningColumnsV306(build,'micro')
        :`<p>${cbEsc(build.description||'Aucune description.')}</p>${cbMiniSlots(build)}`}
    </div>
  </article>`;
}
function cbConnectionNotice(){
  if(CB_REMOTE){
    return `<div class="cbConnection online"><b>● Communauté en ligne</b><span>Les builds et les cœurs sont partagés avec tous les visiteurs.</span></div>`;
  }
  return `<div class="cbConnection local"><b>Mode local de test</b><span>Les builds fonctionnent, mais restent dans ce navigateur. Lance <code>0_CONFIGURER_COMMUNAUTE.bat</code> pour les partager avec toute la communauté.</span></div>`;
}
function cbListHtml(charId,styleId,limit=0,compact=false){
  const key=cbKey(charId,styleId);
  const list=cbBuilds(charId,styleId);
  if(CB_STATE.loading[key]&&!CB_STATE.cache[key]){
    return `<div class="cbLoading"><span></span>Chargement des builds…</div>`;
  }
  if(CB_STATE.errors[key]&&!list.length){
    return `<div class="cbEmpty">Impossible de charger la base en ligne. Mode local utilisé.<small>${cbEsc(CB_STATE.errors[key])}</small></div>`;
  }
  const shown=limit?list.slice(0,limit):list;
  if(!shown.length){
    return `<div class="cbEmpty">Aucun build pour ce style.<strong>Sois le premier à en publier un.</strong></div>`;
  }
  return `<div class="${compact?'cbCompactList':'cbBuildList'}">${shown.map((b,i)=>cbBuildCard(b,i,compact)).join('')}</div>`;
}
function cbOpenBuildsPage(charId,styleId){
  page='builds';
  selectedChar=charId;
  selectedStyle=styleId;
  selectedCostume=null;
  history.replaceState(null,'','#builds');
  render();
}
window.openCommunityBuildsPage=cbOpenBuildsPage;

function cbCharacterWidget(styleId){
  const char=characters.find(x=>x.styles.includes(styleId));
  if(!char) return '';
  cbEnsureLoaded(char.id,styleId);
  return `<section class="cbCharacterWidget">
    <div class="cbWidgetHead">
      <div><h2>${tr('communityBuildsTitle')}</h2><p>${cbEsc(char.name)} · ${cbEsc(cbStyleName(styleId))}</p></div>
      <div class="cbWidgetActions">
        <button onclick="openCommunityBuildCreator('${cbEsc(char.id)}','${cbEsc(styleId)}')">+ Créer un build</button>
        <button class="secondary" onclick="openCommunityBuildsPage('${cbEsc(char.id)}','${cbEsc(styleId)}')">Voir tous</button>
      </div>
    </div>
    ${cbListHtml(char.id,styleId,3,true)}
  </section>`;
}

const cbOldCharacterDetail=characterDetail;
characterDetail=function(styleId){
  return cbOldCharacterDetail(styleId)+cbCharacterWidget(styleId);
};

function cbStatusFor(charId,styleId){
  const key=cbKey(charId,styleId);
  const count=(CB_STATE.cache[key]||[]).length;
  return `<div class="cbToolbar">
    <div><b>${count}</b> build${count>1?'s':''}</div>
    <button class="${(CB_STATE.sort[key]||'popular')==='popular'?'active':''}" onclick="communitySortBuilds('${cbEsc(charId)}','${cbEsc(styleId)}','popular')">Plus aimés</button>
    <button class="${CB_STATE.sort[key]==='recent'?'active':''}" onclick="communitySortBuilds('${cbEsc(charId)}','${cbEsc(styleId)}','recent')">Plus récents</button>
    <button onclick="communityReloadBuilds('${cbEsc(charId)}','${cbEsc(styleId)}')">Actualiser</button>
  </div>`;
}
window.communitySortBuilds=function(charId,styleId,mode){
  const key=cbKey(charId,styleId);
  CB_STATE.sort[key]=mode;
  if(CB_STATE.cache[key]) CB_STATE.cache[key]=cbSortBuilds(CB_STATE.cache[key],key);
  cbRefreshVisible();
};
window.communityReloadBuilds=function(charId,styleId){
  delete CB_STATE.cache[cbKey(charId,styleId)];
  cbEnsureLoaded(charId,styleId,true);
};

buildsPage=function(){
  if(!selectedChar){
    return `<h1 class="title">${tr('recommendedBuildsTitle')}</h1>
      <div class="builderHero"><h2>${tr('communityBuildsTitle')}</h2><p>${tr('communityBuildsIntro')}</p></div>
      ${rosterSections(false,'builds')}`;
  }
  const char=cbCharacter(selectedChar);
  if(!char) return `<div class="homeBox">${tr('characterNotFound')}</div>`;
  if(!selectedStyle||!char.styles.includes(selectedStyle)) selectedStyle=char.styles[0];
  cbEnsureLoaded(char.id,selectedStyle);
  return `<button class="back" onclick="selectedChar=null;selectedStyle=null;render()">← ${tr('back')}</button>
    <div class="cbPageHead">
      <div><h1 class="title">${tr('communityBuildsTitle')} — ${cbEsc(char.name)}</h1><p>${tr('eachStyleRanking')}</p></div>
      <button class="cbAddBuild" onclick="openCommunityBuildCreator('${cbEsc(char.id)}','${cbEsc(selectedStyle)}')"><span>+</span> ${tr('createFullBuild')}</button>
    </div>
    <div class="styleChoiceCompact cbStyleTabs">${char.styles.map(styleId=>{
      const style=cbStyle(styleId)||{};
      const portrait=style.portrait||char.portrait||'';
      return `<button class="${selectedStyle===styleId?'active':''}" onclick="selectedStyle='${cbEsc(styleId)}';render()">
        <span class="cbStylePortrait">${portrait?`<img src="${cbEsc(portrait)}" alt="">`:''}</span>
        <span class="cbStyleText"><b>${cbEsc(cbStyleName(styleId))}</b><small>${cbEsc(cbRoleName(styleId))}</small></span>
      </button>`;
    }).join('')}</div>
    ${cbConnectionNotice()}
    ${cbStatusFor(char.id,selectedStyle)}
    ${cbListHtml(char.id,selectedStyle)}`;
};

try{
  txt.fr.builds='Builds communauté';
  txt.en.builds='Community Builds';
  txt.fr.buildChoose='Choisis un personnage pour voir les builds de chaque style.';
  txt.en.buildChoose='Choose a character to see builds for each style.';
}catch(_){}

function cbCostumes(charId){
  const source=typeof allCostumesForCharId==='function'?allCostumesForCharId(charId):[];
  const seen=new Set();
  return source.filter(costume=>{
    if(!costume||!costume.id||seen.has(costume.id)) return false;
    seen.add(costume.id);
    return true;
  });
}
function cbCostumeName(costume){
  return `${cbCostumeText(costume.group||costume.name||'Costume')} — ${cbCostumeText(costume.variant||'Original')}`;
}

function cbRarityMeta(code){
  const rarity=String(code||'C').toUpperCase();
  const stars={PUR:'★★★',SR:'★★',R:'★',C:''}[rarity]??'';
  return {rarity,stars,label:stars?`${rarity} ${stars}`:rarity};
}
function cbCostumeFilterDefaults(){
  return {rarity:'',any:'',left:'',right:'',condition:''};
}
function cbFilteredCostumes(costumes){
  const filters=CB_STATE.draft?.costumeFilters||cbCostumeFilterDefaults();
  return (costumes||[]).filter(item=>
    (!filters.rarity||String(item.rarity||'C').toUpperCase()===filters.rarity)
    &&(!filters.left||item.spLeft===filters.left)
    &&(!filters.right||item.spRight===filters.right)
    &&(!filters.condition||String(item.condition||'Tous')===filters.condition)
    &&(!filters.any||item.spLeft===filters.any||item.spRight===filters.any)
  );
}
function cbColorOptions(selected=''){
  const names=cbIsEnglish()?{all:'All',yellow:'Assault',red:'Strike',cyan:'Rapid',violet:'Technical',green:'Support'}:{all:'Tous',yellow:'Assaut',red:'Attaque',cyan:'Vitesse',violet:'Technique',green:'Soutien'};
  return [['',names.all],['yellow',names.yellow],['red',names.red],['cyan',names.cyan],['violet',names.violet],['green',names.green]]
    .map(([value,name])=>`<option value="${value}" ${selected===value?'selected':''}>${name}</option>`).join('');
}
function cbBuildCostumeData(build){
  return cbCostumes(build.character_id).find(item=>item.id===build.costume_id)||null;
}
function cbCostumeRarityBadge(costume){
  const meta=cbRarityMeta(costume?.rarity||'C');
  const badgeText=meta.stars||meta.rarity;
  return `<span class="cbCostumeRarity cbRarity-${meta.rarity.toLowerCase()}" title="Rareté : ${meta.label}"><small>${badgeText}</small></span>`;
}
function cbCostumeSlotBadges(costume){
  const condition=costume?.condition&&costume.condition!=='Tous'?costume.condition:'';
  const officialIcon=(color,cond='')=>{
    if(typeof slotIconPath==='function') return slotIconPath(color,cond);
    const suffix=cond==='Héros'?'_h':cond==='Vilain'?'_v':'';
    return `assets/ui/tuning/${slotColorClass(color||'gray')}${suffix}.webp`;
  };
  return `<span class="cbCostumeSlots">
    <i class="cbCostumeSlotBadge left" title="SP gauche : ${cbEsc(slotLabelLong(costume?.spLeft||''))}"><img src="${officialIcon(costume?.spLeft||'gray')}" alt=""></i>
    <i class="cbCostumeSlotBadge right" title="SP droite : ${cbEsc(slotLabelLong(costume?.spRight||''))}${condition?` · ${cbEsc(condition)}`:''}"><img src="${officialIcon(costume?.spRight||'gray',condition)}" alt=""></i>
  </span>`;
}
function cbSlotSpecs(costume){
  const left=normalSlots(costume,'left');
  const right=normalSlots(costume,'right');
  return [
    {id:'sp|left|0',kind:'sp',side:'left',index:0,color:costume.spLeft,condition:slotFactionCondition(costume,'left','sp',0),max:costumeMaxLevel(costume,'sp','left',0)},
    ...left.map((color,index)=>({id:`normal|left|${index}`,kind:'normal',side:'left',index,color,condition:slotFactionCondition(costume,'left','normal',index),max:costumeMaxLevel(costume,'normal','left',index)})),
    {id:'sp|right|0',kind:'sp',side:'right',index:0,color:costume.spRight,condition:slotFactionCondition(costume,'right','sp',0),max:costumeMaxLevel(costume,'sp','right',0)},
    ...right.map((color,index)=>({id:`normal|right|${index}`,kind:'normal',side:'right',index,color,condition:slotFactionCondition(costume,'right','normal',index),max:costumeMaxLevel(costume,'normal','right',index)}))
  ];
}
function cbTuningSnapshot(tuning){
  return {
    key:[tuning.kind,tuning.styleKey,tuning.character,tuning.name].join('|'),
    kind:tuning.kind,
    styleKey:tuning.styleKey||'',
    character:tuning.character||'',
    side:tuning.side||'',
    role:tuning.role||'',
    slot:tuning.slot||'',
    name:cbTuningName(tuning),
    desc:cbPlain(cbTuningDesc(tuning),400),
    img:tuning.img||''
  };
}
function cbUsedStyles(exceptId=''){
  const used=new Set();
  Object.entries(CB_STATE.draft?.slots||{}).forEach(([slotId,tuning])=>{
    if(slotId!==exceptId&&tuning){
      used.add(tuning.styleKey||tuning.character);
    }
  });
  return used;
}
function cbDraftCostume(){
  if(!CB_STATE.draft) return null;
  return cbCostumes(CB_STATE.draft.characterId).find(x=>x.id===CB_STATE.draft.costumeId)||null;
}
function cbBuilderModal(){
  let modal=document.getElementById('cbBuilderModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='cbBuilderModal';
    modal.className='cbModal';
    modal.innerHTML=`<div class="cbModalPanel cbBuilderPanel"><button class="cbClose" onclick="closeCommunityBuildCreator()">×</button><div id="cbBuilderContent"></div></div>`;
    modal.addEventListener('click',event=>{if(event.target===modal) closeCommunityBuildCreator()});
    document.body.appendChild(modal);
  }
  return modal;
}
function cbDetailModal(){
  let modal=document.getElementById('cbDetailModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='cbDetailModal';
    modal.className='cbModal';
    modal.innerHTML=`<div class="cbModalPanel cbDetailPanel"><button class="cbClose" onclick="closeCommunityBuildDetail()">×</button><div id="cbDetailContent"></div></div>`;
    modal.addEventListener('click',event=>{if(event.target===modal) closeCommunityBuildDetail()});
    document.body.appendChild(modal);
  }
  return modal;
}
function cbPreloadBuilderImages(charId){
  try{
    const urls=[];
    const char=cbCharacter(charId);
    if(char?.img) urls.push(char.img);
    cbCostumes(charId).slice(0,28).forEach(c=>c?.img&&urls.push(c.img));
    const seen=new Set();
    Object.values(window.styles||{}).forEach(style=>{
      (style?.tunings||[]).forEach(t=>{if(t?.img&&!seen.has(t.img)&&urls.length<70){seen.add(t.img);urls.push(t.img)}});
    });
    urls.forEach(src=>{const im=new Image();im.decoding='async';im.src=src});
  }catch(_){}
}
window.openCommunityBuildCreator=function(charId,styleId){
  const char=cbCharacter(charId);
  if(!char||!char.styles.includes(styleId)) return;
  if(CB_REMOTE && !window.MHUR_AUTH?.requireLogin?.('Connecte-toi avec Google ou Discord pour publier un build.')) return;
  const authProfile=window.MHUR_AUTH?.getProfile?.();
  const authUser=window.MHUR_AUTH?.getUser?.();
  const accountName=authProfile?.username||authUser?.user_metadata?.full_name||authUser?.user_metadata?.name||authUser?.email?.split('@')[0]||'';
  cbPreloadBuilderImages(charId);
  const costumes=cbCostumes(charId);
  CB_STATE.draft={
    characterId:charId,
    styleId,
    costumeId:costumes[0]?.id||'',
    title:'',
    author:window.MHUR_AUTH?.getProfile?.()?.username||accountName||localStorage.getItem('mhur_build_author_v304')||'',
    description:'',
    selectedSlot:'sp|left|0',
    slots:{},
    costumeFilters:cbCostumeFilterDefaults()
  };
  const modal=cbBuilderModal();
  modal.classList.add('open');
  document.body.classList.add('cbModalOpen');
  cbRenderBuilder();
};
window.closeCommunityBuildCreator=function(){
  cbBuilderModal().classList.remove('open');
  document.body.classList.remove('cbModalOpen');
  CB_STATE.draft=null;
  CB_STATE.publishing=false;
};
window.communityBuildCostumeFilter=function(field,value){
  const draft=CB_STATE.draft;
  if(!draft)return;
  draft.costumeFilters=draft.costumeFilters||cbCostumeFilterDefaults();
  draft.costumeFilters[field]=value;
  cbRenderBuilder();
};
window.communityResetBuildCostumeFilters=function(){
  if(!CB_STATE.draft)return;
  CB_STATE.draft.costumeFilters=cbCostumeFilterDefaults();
  cbRenderBuilder();
};

window.communityRememberCostumeScroll=function(scrollLeft){
  if(CB_STATE.draft) CB_STATE.draft.costumeScrollLeft=Number(scrollLeft)||0;
};
window.communityChooseCostume=function(costumeId){
  if(!CB_STATE.draft) return;
  const strip=document.querySelector('#cbBuilderContent .cbCostumeChoices');
  if(strip) CB_STATE.draft.costumeScrollLeft=strip.scrollLeft;
  CB_STATE.draft.costumeId=costumeId;
  CB_STATE.draft.selectedSlot='sp|left|0';
  CB_STATE.draft.slots={};
  cbRenderBuilder();
};
window.communitySelectDraftSlot=function(slotId){
  if(!CB_STATE.draft) return;
  CB_STATE.draft.selectedSlot=slotId;
  cbRenderBuilder();
};
window.communityEquipDraftTuning=function(index){
  const tuning=window.__cbTuningOptions?.[index];
  const draft=CB_STATE.draft;
  if(!draft||!tuning) return;
  const styleKey=tuning.styleKey||tuning.character;
  if(cbUsedStyles(draft.selectedSlot).has(styleKey)){
    alert('Ce style de T.U.N.I.N.G est déjà utilisé dans ce build. Choisis un autre style.');
    return;
  }
  draft.slots[draft.selectedSlot]=cbTuningSnapshot(tuning);
  cbRenderBuilder();
};
window.communityClearDraftSlot=function(){
  const draft=CB_STATE.draft;
  if(!draft) return;
  delete draft.slots[draft.selectedSlot];
  cbRenderBuilder();
};
window.communityDraftField=function(field,value){
  if(CB_STATE.draft) CB_STATE.draft[field]=value;
};
function cbBuilderOfficialSlotV308(spec){
  const draft=CB_STATE.draft;
  const tuning=draft.slots[spec.id];
  const active=draft.selectedSlot===spec.id;
  const isSp=spec.kind==='sp';
  let text='';

  if(tuning){
    const nm=safeTuningName(cbTuningName(tuning));
    const fs=slotFontSize(nm);
    text=isSp
      ?`<span class="equippedChar">${cbEsc(tuning.character||'')}</span><span class="equippedName" style="--equip-font:${Math.max(14,fs-1)}px">${cbEsc(nm)}</span>`
      :`<span class="equippedName" style="--equip-font:${fs}px">${cbEsc(nm)}</span>`;
  }

  return `<button type="button"
      class="gameSlot ${isSp?'spBand':''} ${active?'active':''} ${tuning?'filled':'empty'}"
      style="--slot-color:${slotHex(spec.color)}"
      onclick="communitySelectDraftSlot('${cbEsc(spec.id)}');return false;">
    <div class="slotBandText">${text}</div>
    ${slotGem(spec.color,spec.condition||'',tuning?tuning.img:'')}
  </button>`;
}
function cbBuilderSlot(spec){
  return cbBuilderOfficialSlotV308(spec);
}
function cbBuilderPicker(costume,spec){
  const used=cbUsedStyles(spec.id);
  const ownFamily=cbCharacterFamilyId(CB_STATE.draft?.characterId);
  const options=compatibleTunings(spec.color,spec.kind,spec.condition)
    .filter(t=>cbTuningFamilyId(t)!==ownFamily)
    .slice(0,80);
  window.__cbTuningOptions=options;

  const kindLabel=spec.kind==='sp'
    ?'T.U.N.I.N.G SP'
    :'T.U.N.I.N.G normal';

  return `<div class="cbOfficialPickerWrapV308">
    ${CB_STATE.draft.slots[spec.id]
      ?'<button type="button" class="cbOfficialRemoveV308" onclick="communityClearDraftSlot()">Retirer le T.U.N.I.N.G de cet emplacement</button>'
      :''}
    <div class="tuningPicker">
      <div class="tuningPickerHead">T.U.N.I.N.G compatibles</div>
      <div class="tuningPickerSub">${kindLabel} · ${cbEsc(slotLabelLong(spec.color))}${spec.condition?' · '+cbEsc(spec.condition):''}</div>
      <div class="tuningOptions">
        ${options.map((tuning,index)=>{
          const isUsed=used.has(tuning.styleKey||tuning.character);
          const nm=safeTuningName(cbTuningName(tuning));
          const fs=tuningFontSize(nm,21);
          const ds=cbPlain(cbTuningDesc(tuning),180);
          return `<button type="button"
              class="tuningOption ${slotColorClass(tuning.slot)} ${isUsed?'alreadyUsed':''}"
              ${isUsed?'disabled':''}
              style="--option-font:${fs}px;--desc-font:${ds.length>95?12:13}px"
              onclick="communityEquipDraftTuning(${index});return false;">
            ${tuning.img
              ?`<span class="tuningOptionIconWrap"><img src="${cbEsc(tuning.img)}" alt="${cbEsc(tuning.character||'')}" loading="eager" decoding="async"></span>`
              :'<div class="tuningOptionImg"></div>'}
            <div class="tuningOptionMain">
              <div class="tuningOptionChar">${cbEsc(tuning.character||'')}</div>
              <div class="tuningOptionName">${cbEsc(nm)}</div>
              <div class="tuningOptionDesc">${cbEsc(ds)}</div>
            </div>
            <div class="tuningFaction">${tuning.side==='Héros'?'HÉROS':'SUPER-VILAIN'}</div>
          </button>`;
        }).join('')||'<div class="homeBox">Aucun T.U.N.I.N.G compatible.</div>'}
      </div>
    </div>
  </div>`;
}
function cbRenderBuilder(){
  const draft=CB_STATE.draft;
  const content=document.getElementById('cbBuilderContent');
  if(!draft||!content) return;
  const oldCostumeStrip=content.querySelector('.cbCostumeChoices');
  const costumeScrollLeft=oldCostumeStrip
    ?oldCostumeStrip.scrollLeft
    :(Number(draft.costumeScrollLeft)||0);
  const char=cbCharacter(draft.characterId);
  const costumes=cbCostumes(draft.characterId);
  const filteredCostumes=cbFilteredCostumes(costumes);
  const costume=cbDraftCostume();
  const filters=draft.costumeFilters||cbCostumeFilterDefaults();
  const specs=costume?cbSlotSpecs(costume):[];
  const selectedSpec=specs.find(x=>x.id===draft.selectedSlot)||specs[0];
  const filled=specs.filter(x=>draft.slots[x.id]).length;
  content.innerHTML=`<div class="cbBuilderHeader">
      <span>CRÉATEUR DE BUILD</span>
      <h2>${cbEsc(char?.name)} — ${cbEsc(cbStyleName(draft.styleId))}</h2>
      <p>Choisis un costume puis remplis tous ses emplacements T.U.N.I.N.G.</p>
    </div>
    <div class="cbBuildFields">
      <label>Nom du build<input maxlength="80" value="${cbEsc(draft.title)}" oninput="communityDraftField('title',this.value)" placeholder="Ex : Mobilité maximale, DPS, survie…"></label>
      <label>Pseudo<input maxlength="40" value="${cbEsc(draft.author)}" ${window.MHUR_AUTH?.getUser?.()?'readonly title="Pseudo lié à ton compte"':'oninput="communityDraftField(\'author\',this.value)"'} placeholder="Ton pseudo"></label>
      <label class="wide">Description<textarea maxlength="700" oninput="communityDraftField('description',this.value)" placeholder="Explique comment jouer le build…">${cbEsc(draft.description)}</textarea></label>
    </div>
    <h3 class="cbSectionTitle">1. Costume <span>${filteredCostumes.length}/${costumes.length}</span></h3>
    <div class="cbCostumeFilters">
      <label>Rareté<select onchange="communityBuildCostumeFilter('rarity',this.value)">
        <option value="" ${!filters.rarity?'selected':''}>Toutes</option>
        <option value="PUR" ${filters.rarity==='PUR'?'selected':''}>PUR ★★★</option>
        <option value="SR" ${filters.rarity==='SR'?'selected':''}>SR ★★</option>
        <option value="R" ${filters.rarity==='R'?'selected':''}>R ★</option>
        <option value="C" ${filters.rarity==='C'?'selected':''}>C</option>
      </select></label>
      <label>SP rapide<select onchange="communityBuildCostumeFilter('any',this.value)">${cbColorOptions(filters.any)}</select></label>
      <label>SP gauche<select onchange="communityBuildCostumeFilter('left',this.value)">${cbColorOptions(filters.left)}</select></label>
      <label>SP droite<select onchange="communityBuildCostumeFilter('right',this.value)">${cbColorOptions(filters.right)}</select></label>
      <label>Condition droite<select onchange="communityBuildCostumeFilter('condition',this.value)">
        <option value="" ${!filters.condition?'selected':''}>Toutes</option>
        <option value="Héros" ${filters.condition==='Héros'?'selected':''}>Héros</option>
        <option value="Vilain" ${filters.condition==='Vilain'?'selected':''}>Vilain</option>
        <option value="Tous" ${filters.condition==='Tous'?'selected':''}>Tous</option>
      </select></label>
      <button onclick="communityResetBuildCostumeFilters()">Réinitialiser</button>
    </div>
    <div class="cbCostumeChoices" onscroll="communityRememberCostumeScroll(this.scrollLeft)">${filteredCostumes.map(item=>`<button class="${draft.costumeId===item.id?'selected':''}" onclick="communityChooseCostume('${cbEsc(item.id)}')">
      <div class="cbCostumeChoiceImage"><img src="${cbEsc(item.img||'')}" alt="${cbEsc(cbCostumeName(item))}" loading="eager" decoding="async">${cbCostumeRarityBadge(item)}${cbCostumeSlotBadges(item)}</div>
      <b>${cbEsc(cbCostumeText(item.group||item.name||'Costume'))}</b><span>${cbEsc(cbCostumeText(item.variant||'Original'))}</span>
    </button>`).join('')||'<div class="cbEmpty cbCostumeFilterEmpty">Aucun costume ne correspond aux filtres.</div>'}</div>
    ${costume?`<h3 class="cbSectionTitle">2. T.U.N.I.N.G <span>${filled}/${specs.length}</span></h3>
      <div class="gameCostumeScreen cbOfficialCreatorScreenV308">
        <div class="gameTuningArea">
          <div class="tuningColumns gameSlots">
            <div class="tuningColumn leftCol">
              <div class="tuningColumnHead">Compétence T.U.N.I.N.G SP gauche</div>
              <div class="conditionBox">Disponible selon la couleur du slot gauche</div>
              <div class="slotList">${specs.filter(x=>x.side==='left').map(cbBuilderSlot).join('')}</div>
            </div>
            <div class="tuningColumn rightCol">
              <div class="tuningColumnHead">Compétence T.U.N.I.N.G SP droite</div>
              <div class="conditionBox">${costume.condition&&costume.condition!=='Tous'?'Condition : '+cbEsc(costume.condition):'Disponible selon la couleur du slot droite'}</div>
              <div class="slotList">${specs.filter(x=>x.side==='right').map(cbBuilderSlot).join('')}</div>
            </div>
          </div>
          ${selectedSpec?cbBuilderPicker(costume,selectedSpec):''}
        </div>
      </div>
      <div class="cbPublishBar">
        <div><b>${filled===specs.length?'Build complet':'Build incomplet'}</b><span>${filled} emplacement${filled>1?'s':''} rempli${filled>1?'s':''} sur ${specs.length}</span></div>
        <button ${CB_STATE.publishing||filled!==specs.length?'disabled':''} onclick="communityPublishBuild()">${CB_STATE.publishing?'Publication…':'Publier le build'}</button>
      </div>`:'<div class="cbEmpty">Aucun costume disponible.</div>'}`;
  const restoreCostumeScroll=()=>{
    const strip=content.querySelector('.cbCostumeChoices');
    if(!strip) return;
    strip.scrollLeft=costumeScrollLeft;
    draft.costumeScrollLeft=strip.scrollLeft;
  };
  restoreCostumeScroll();
  requestAnimationFrame(restoreCostumeScroll);
}
function cbPayloadFromDraft(){
  const draft=CB_STATE.draft;
  const costume=cbDraftCostume();
  if(!draft||!costume) throw new Error('Choisis un costume.');
  draft.title=cbPlain(document.querySelector('#cbBuilderContent input[placeholder^="Ex :"]')?.value||draft.title,80);
  draft.author=cbPlain(window.MHUR_AUTH?.getProfile?.()?.username||document.querySelector('#cbBuilderContent input[placeholder="Ton pseudo"]')?.value||draft.author,40);
  draft.description=cbPlain(document.querySelector('#cbBuilderContent textarea')?.value||draft.description,700);
  if(draft.title.length<3) throw new Error('Le nom du build doit contenir au moins 3 caractères.');
  if(draft.author.length<2) throw new Error('Ajoute un pseudo.');
  const specs=cbSlotSpecs(costume);
  if(specs.some(spec=>!draft.slots[spec.id])) throw new Error('Remplis les 12 emplacements T.U.N.I.N.G.');
  const authUser=window.MHUR_AUTH?.getUser?.();
  if(CB_REMOTE && !authUser) throw new Error('Connecte-toi pour publier ce build.');
  localStorage.setItem('mhur_build_author_v304',draft.author);
  return {
    character_id:draft.characterId,
    style_id:draft.styleId,
    costume_id:costume.id,
    costume_name:costume.group||costume.name||'Costume',
    costume_variant:costume.variant||'Original',
    costume_img:costume.img||'',
    title:draft.title,
    author:draft.author,
    description:draft.description,
    tuning_slots:specs.map(spec=>({...spec,tuning:draft.slots[spec.id]})),
    creator_id:authUser?.id||cbVoterId(),
    likes_count:0,
    is_hidden:false
  };
}
async function cbPublishRemote(payload){
  const rows=await cbRequest('/rest/v1/community_builds?select=*',{
    method:'POST',
    headers:{Prefer:'return=representation'},
    body:JSON.stringify(payload)
  });
  return cbNormalizeBuild(Array.isArray(rows)?rows[0]:rows);
}
function cbPublishLocal(payload){
  const item=cbNormalizeBuild({
    ...payload,
    id:'local_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),
    created_at:new Date().toISOString(),
    source:'local'
  });
  const all=cbLocalAll();
  all.push(item);
  cbSaveLocal(all);
  return item;
}
window.communityPublishBuild=async function(){
  if(CB_STATE.publishing) return;
  try{
    const payload=cbPayloadFromDraft();
    CB_STATE.publishing=true;
    cbRenderBuilder();
    const build=CB_REMOTE?await cbPublishRemote(payload):cbPublishLocal(payload);
    const key=cbKey(build.character_id,build.style_id);
    delete CB_STATE.cache[key];
    await cbEnsureLoaded(build.character_id,build.style_id,true);
    closeCommunityBuildCreator();
    cbOpenBuildsPage(build.character_id,build.style_id);
  }catch(error){
    alert(error.message||String(error));
    CB_STATE.publishing=false;
    cbRenderBuilder();
  }
};

function cbFindBuild(id,charId='',styleId=''){
  if(charId&&styleId){
    return (CB_STATE.cache[cbKey(charId,styleId)]||[]).find(x=>x.id===id)||null;
  }
  for(const list of Object.values(CB_STATE.cache)){
    const found=(list||[]).find(x=>x.id===id);
    if(found) return found;
  }
  return cbLocalAll().map(cbNormalizeBuild).find(x=>x.id===id)||null;
}
function cbDetailSlot(entry,build){
  const costume=cbBuildCostumeData(build);
  const enriched={...entry,max:entry.max||(costume?costumeMaxLevel(costume,entry.kind,entry.side,Number(entry.index)||0):0)};
  return cbBuildTuningCardV306(enriched,'detail');
}
function cbDetailColumn(build,side){
  const entries=cbSlotEntries(build).filter(entry=>entry.side===side);
  return `<section class="cbCostumeTuningColumnV306 detail">
    <h4>${side==='left'?(cbIsEnglish()?'Left':'Gauche'):(cbIsEnglish()?'Right':'Droite')}</h4>
    <div>${entries.map(entry=>cbDetailSlot(entry,build)).join('')}</div>
  </section>`;
}


function cbOwnDeleteHtml(build,compact=false){
  const uid=window.MHUR_AUTH?.getUser?.()?.id||'';
  const own=uid&&String(uid)===String(build.creator_id||'');
  if(!own) return '';
  const txt=(typeof lang!=='undefined'&&lang==='en')?'Delete build':'Supprimer le build';
  return `<button class="cbDeleteOwn ${compact?'compact':''}" title="${txt}" aria-label="${txt}" onclick="event.stopPropagation();communityDeleteOwnBuild('${cbEsc(build.id)}')">🗑 ${txt}</button>`;
}
window.communityDeleteOwnBuild=async function(id){
  const build=cbFindBuild(id);
  const uid=window.MHUR_AUTH?.getUser?.()?.id||'';
  if(!build||!uid||String(uid)!==String(build.creator_id||'')) return;
  const en=typeof lang!=='undefined'&&lang==='en';
  if(!confirm(en?'Delete this build permanently?':'Supprimer définitivement ce build ?')) return;
  try{
    if(CB_REMOTE&&/^[0-9a-f-]{36}$/i.test(id)){
      await cbRequest(`/rest/v1/community_builds?id=eq.${encodeURIComponent(id)}&creator_id=eq.${encodeURIComponent(uid)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
    }else{
      cbSaveLocal(cbLocalAll().filter(x=>String(x.id)!==String(id)));
    }
    Object.keys(CB_STATE.cache).forEach(k=>CB_STATE.cache[k]=(CB_STATE.cache[k]||[]).filter(x=>String(x.id)!==String(id)));
    closeCommunityBuildDetail(); cbRefreshVisible();
  }catch(e){alert((en?'Unable to delete build: ':'Suppression impossible : ')+(e.message||e));}
};

function cbRenderBuildDetail(id){
  const build=cbFindBuild(id);
  const content=document.getElementById('cbDetailContent');
  if(!build||!content) return;
  const char=cbCharacter(build.character_id);
  content.innerHTML=`<div class="cbDetailHero">
      <div>${asset(build.costume_img,build.costume_name)}</div>
      <div><span>BUILD COMMUNAUTAIRE</span><h2>${cbEsc(build.title)}</h2>
        <p>${cbEsc(char?.name||build.character_id)} · ${cbEsc(cbStyleName(build.style_id))}</p>
        <p>${cbEsc(build.costume_name)} — ${cbEsc(build.costume_variant)}</p>
        <div class="cbDetailAuthor">Par ${cbAuthorButton(build)} · ${cbFormatDate(build.created_at)}</div>
        <div class="cbBuildActions">${cbFavoriteHtml(build)}${cbHeartHtml(build)}${cbOwnDeleteHtml(build)}${window.MHUR_MODERATION?.detailActions?.(build)||''}</div>
      </div>
    </div>
    <div class="cbDetailDescription">${cbEsc(build.description||'Aucune description.')}</div>
    <div class="cbCostumeTuningGridV306 detail">${cbDetailColumn(build,'left')}${cbDetailColumn(build,'right')}</div>`;
}
window.openCommunityBuildDetail=function(id,charId,styleId){
  const build=cbFindBuild(id,charId,styleId);
  if(!build) return;
  CB_STATE.currentDetail=id;
  const modal=cbDetailModal();
  modal.classList.add('open');
  document.body.classList.add('cbModalOpen');
  cbRenderBuildDetail(id);
};
window.closeCommunityBuildDetail=function(){
  cbDetailModal().classList.remove('open');
  document.body.classList.remove('cbModalOpen');
  CB_STATE.currentDetail=null;
};

function cbUpdateCachedBuild(id,updater){
  Object.keys(CB_STATE.cache).forEach(key=>{
    const index=(CB_STATE.cache[key]||[]).findIndex(x=>x.id===id);
    if(index>=0){
      CB_STATE.cache[key][index]=updater({...CB_STATE.cache[key][index]});
      CB_STATE.cache[key]=cbSortBuilds(CB_STATE.cache[key],key);
    }
  });
}
async function cbToggleRemoteHeart(id){
  return cbRequest('/rest/v1/rpc/toggle_community_build_like',{
    method:'POST',
    body:JSON.stringify({p_build_id:id,p_voter_id:cbVoterId()})
  });
}
function cbToggleLocalHeart(id){
  const liked=cbLikedSet();
  const all=cbLocalAll();
  const index=all.findIndex(x=>String(x.id)===String(id));
  if(index<0) throw new Error('Build introuvable.');
  const nowLiked=!liked.has(id);
  if(nowLiked) liked.add(id); else liked.delete(id);
  all[index].likes_count=Math.max(0,Number(all[index].likes_count||0)+(nowLiked?1:-1));
  cbSaveLiked(liked);
  cbSaveLocal(all);
  return {liked:nowLiked,likes_count:all[index].likes_count};
}
window.communityToggleHeart=async function(id){
  if(CB_REMOTE && !window.MHUR_AUTH?.requireLogin?.('Connecte-toi avec Google ou Discord pour aimer un build.')) return;
  const liked=cbLikedSet();
  const wasLiked=liked.has(id);
  cbUpdateCachedBuild(id,build=>{
    build.likes_count=Math.max(0,build.likes_count+(wasLiked?-1:1));
    return build;
  });
  if(wasLiked) liked.delete(id); else liked.add(id);
  cbSaveLiked(liked);
  cbRefreshVisible();
  try{
    const result=CB_REMOTE&&/^[0-9a-f-]{36}$/i.test(id)
      ?await cbToggleRemoteHeart(id)
      :cbToggleLocalHeart(id);
    const isLiked=Boolean(result?.liked);
    const count=Number(result?.likes_count??0);
    const finalLiked=cbLikedSet();
    if(isLiked) finalLiked.add(id); else finalLiked.delete(id);
    cbSaveLiked(finalLiked);
    cbUpdateCachedBuild(id,build=>({...build,likes_count:count}));
  }catch(error){
    const rollback=cbLikedSet();
    if(wasLiked) rollback.add(id); else rollback.delete(id);
    cbSaveLiked(rollback);
    cbUpdateCachedBuild(id,build=>{
      build.likes_count=Math.max(0,build.likes_count+(wasLiked?1:-1));
      return build;
    });
    alert('Le cœur n’a pas pu être enregistré : '+(error.message||error));
  }
  cbRefreshVisible();
};

window.addEventListener('mhur-favorites-change',()=>cbRefreshVisible());

window.addEventListener('keydown',event=>{
  if(event.key!=='Escape') return;
  if(document.getElementById('cbBuilderModal')?.classList.contains('open')) closeCommunityBuildCreator();
  if(document.getElementById('cbDetailModal')?.classList.contains('open')) closeCommunityBuildDetail();
});

if(page==='builds'||(page==='characters'&&selectedStyle)){
  window.__keepScroll=true;
  render();
}
})();
