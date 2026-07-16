(function(){
'use strict';
const D=()=>window.MHUR_HOME_DATA||{};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const locale=()=>typeof lang!=='undefined'&&lang==='en'?'en-GB':'fr-FR';
const ht=(fr,en)=>typeof lang!=='undefined'&&lang==='en'?en:fr;
const isEn=()=>typeof lang!=='undefined'&&lang==='en';
const patchTerms={
  'PV':'HP','Dégâts':'Damage','Rechargement et munitions':'Cooldown and ammo','T.U.N.I.N.G':'T.U.N.I.N.G',
  'Original':'Original','Technique':'Technical','Assaut':'Assault','Attaque':'Strike','Soutien':'Support','Vitesse':'Rapid',
  'PV maximum':'Maximum HP','Dégâts par niveau':'Damage by level','Dégâts de finition':'Finisher damage','Dégâts de rotation':'Spin damage',
  'Secondes par niveau':'Seconds by level','Action spéciale':'Special Action','Recharge':'Cooldown','Munitions':'Ammo',
  'Consommation':'Consumption','Pénalité de recharge':'Cooldown penalty','Mur défensif':'Defensive Wall','Vol':'Flight',
  'attaque normale':'normal attack','attaque chargée':'charged attack','temps de recharge':'cooldown time',
  'Avant':'Before','Après':'After','Ajustement':'Adjustment','Changements':'Changes',
  'Mise à jour des données':'Data update','détail(s)':'detail(s)','Aucun détail disponible.':'No details available.'
};
function patchText(v){
  let out=String(v??'');
  if(!isEn())return out;
  const exact=patchTerms[out];
  if(exact)return exact;
  const replacements=[
    [/Mise à jour des données/gi,'Data update'],[/Dégâts/gi,'Damage'],[/Recharge/gi,'Cooldown'],[/Munitions/gi,'Ammo'],
    [/Consommation/gi,'Consumption'],[/Action spéciale/gi,'Special Action'],[/Pénalité/gi,'Penalty'],
    [/selon le niveau/gi,'depending on level'],[/Augmente/gi,'Increases'],[/Réduit/gi,'Reduces'],
    [/Amélioration/gi,'Buff'],[/Réduction/gi,'Nerf'],[/Ajustement/gi,'Adjustment'],
    [/Avant/gi,'Before'],[/Après/gi,'After'],[/niveau/gi,'level'],[/secondes/gi,'seconds'],[/seconde/gi,'second'],
    [/Dégâts de finition/gi,'Finisher damage'],[/Dégâts de rotation/gi,'Spin damage'],
    [/attaque normale/gi,'normal attack'],[/attaque chargée/gi,'charged attack'],
    [/Mur défensif/gi,'Defensive Wall'],[/Vol/gi,'Flight']
  ];
  replacements.forEach(([a,b])=>{out=out.replace(a,b)});
  return out;
}
const fmt=(v,time=false)=>{if(!v)return '—';const d=new Date(v);if(Number.isNaN(d.getTime()))return esc(v);return new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'short',year:'numeric',...(time?{hour:'2-digit',minute:'2-digit'}:{})}).format(d)};
const remain=v=>{if(!v)return '';const n=new Date(v)-Date.now();if(n<=0)return ht('Terminé','Ended');if(n>172800000000)return ht('Permanent','Permanent');const d=Math.floor(n/86400000),h=Math.floor(n/3600000)%24,m=Math.floor(n/60000)%60;return d?`${d}${ht('j','d')} ${h}h`:`${h}h ${m}min`};
const pct=v=>v==null||Number.isNaN(Number(v))?'—':`${Number(v).toFixed(3)} %`;
const img=(src,alt='',cls='')=>src?`<img class="${esc(cls)}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.classList.add('homeImageError')">`:'';
const divider=()=>'<div class="homeDividerV296"></div>';
const heading=(txt,color='orange')=>`<h2 class="homeTitleV296 ${color}">${esc(txt)}</h2>`;
const countdown=end=>`<div class="countdownV296" data-home-count="${esc(end)}"><span><b data-u="d">--</b><small>${ht('JOURS','DAYS')}</small></span><span><b data-u="h">--</b><small>${ht('HEURES','HOURS')}</small></span><span><b data-u="m">--</b><small>${ht('MINUTES','MINUTES')}</small></span><span><b data-u="s">--</b><small>${ht('SECONDES','SECONDS')}</small></span></div>`;

function normalizeReleaseText(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function releaseTarget(x){
  const fixed={
    'shota aizawa|flow runner':['aizawa','aizawa_strike'],
    'present mic|d j board':['present_mic','present_mic_technical'],
    'mirko|personnage jouable':['mirko','mirko_rapid'],
    'katsuki bakugo|cluster':['bakugo','bakugo_technical']
  };
  const key=`${normalizeReleaseText(x.title)}|${normalizeReleaseText(x.subtitle)}`;
  let charId=x.character_id||x.char_id||'',styleId=x.style_id||'';
  if((!charId||!styleId)&&fixed[key]){charId=charId||fixed[key][0];styleId=styleId||fixed[key][1]}
  if(!charId&&typeof characters!=='undefined'){
    const hit=characters.find(c=>normalizeReleaseText(c.name)===normalizeReleaseText(x.title));
    if(hit)charId=hit.id;
  }
  if(charId&&!styleId&&typeof characters!=='undefined'&&typeof styles!=='undefined'){
    const c=characters.find(v=>v.id===charId);
    const wanted=normalizeReleaseText(x.subtitle);
    if(c){
      styleId=(c.styles||[]).find(s=>normalizeReleaseText(typeof label==='function'?label(styles[s]?.name||''):styles[s]?.name||'')===wanted)||'';
      if(!styleId&&c.styles?.length===1)styleId=c.styles[0];
    }
  }
  return {charId,styleId};
}
function releaseCard(x){
  const kind=String(x.release_kind||x.type||'').toLowerCase();
  const isCostume=kind.includes('costume');
  const isChar=!isCostume&&(kind.includes('character')||kind.includes('personnage'));
  const badge=isCostume?'assets/home/icons/release_costume.png':isChar?'assets/home/icons/release_character.png':'assets/home/icons/release_style.png';
  const label=isCostume?'Nouveau costume':isChar?'Nouveau personnage':'Nouveau style';
  const target=releaseTarget(x);
  const word=x.word||({aizawa:'FLOW!',present_mic:'YEAH!',mirko:'RABBIT!',bakugo:'BOOM!'}[target.charId]||'NEW!');
  const theme=x.theme||({aizawa:'red',present_mic:'purple',mirko:'cyan',bakugo:'orange'}[target.charId]||'red');
  const art=x.art||x.character_art||x.image||x.banner;
  return `<button type="button" class="releaseCardV299 theme-${esc(theme)}" data-release-char="${esc(target.charId)}" data-release-style="${esc(target.styleId)}" onclick="openHomeReleaseV298(this)" aria-label="Ouvrir ${esc(x.title)} — ${esc(x.subtitle||label)}" title="${esc(x.title)} — ${esc(x.subtitle||label)}"><span class="releaseDotsV299"></span><strong class="releaseWordV299">${esc(word)}</strong><span class="releasePersonWrapV299">${img(art,x.title,'releasePersonV299')}</span><span class="releaseSlashV299"></span><span class="releaseBadgeV299 ${isCostume?'costume':isChar?'character':'style'}">${img(badge,label)}</span><span class="releaseNamesV299"><b>${esc(patchText(x.title))}</b><small>${esc(x.subtitle||label)}</small></span></button>`;
}
window.openHomeReleaseV298=function(button){
  const charId=button?.dataset?.releaseChar||'';
  const c=typeof characters!=='undefined'?characters.find(x=>x.id===charId):null;
  if(!c)return;
  let styleId=button?.dataset?.releaseStyle||'';
  if(!styleId||!(c.styles||[]).includes(styleId))styleId=(c.styles||[]).length===1?c.styles[0]:null;
  page='characters';selectedChar=c.id;selectedStyle=styleId;selectedCostume=null;
  document.getElementById('drawer')?.classList.remove('open');
  if(location.hash!=='#characters')history.pushState(null,'','#characters');
  if(typeof layout==='function')layout();else if(typeof render==='function')render();
};
function gachaCard(g){
  return `<article class="gachaCardV303">
    <div class="gachaBannerV296">${img(g.image,g.title)}</div>
    <div class="gachaOverlayV296"></div>
    <span class="gachaKindV296">${esc(g.type||ht('Tirage','Gacha'))}</span>
    <span class="gachaViewV303">${ht('DISPONIBLE','AVAILABLE')}</span>
    <div class="gachaCaptionV296">
      <b>${esc(g.title)}</b>
      <small>${fmt(g.start)} → ${fmt(g.end)} <em>${remain(g.end)}</em></small>
    </div>
  </article>`;
}
function eventCard(e){
  return `<article class="eventCardV296">${img(e.image,e.title)}<span class="eventTypeV296">${esc(e.type||ht('ÉVÉNEMENT','EVENT'))}</span><div><b>${esc(e.title)}</b><small>${fmt(e.start,true)} → ${fmt(e.end,true)}</small><em>${remain(e.end)}</em></div></article>`;
}
function bonusCard(x){return `<article class="bonusCardV296">${img(x.image,x.title)}<div><span>${esc(x.type||'BONUS')}</span><b>${esc(patchText(x.title))}</b><small>${fmt(x.start)} → ${fmt(x.end)} · ${remain(x.end)}</small></div></article>`}
function discountCard(x){return `<article class="discountCardV296">${img(x.image,x.name)}<b>${esc(x.name)}</b><span>${esc(x.points)} Pts.</span></article>`}
function latestPatchCard(x){
  if(!x)return `<div class="emptyV296">${ht('Aucune note de mise à jour.','No patch note available.')}</div>`;
  const count=(x.details||[]).reduce((n,s)=>n+(s.changes||[]).length,0)
    +(x.rich_blocks||[]).filter(b=>b.type==='text').length;
  return `<button class="latestPatchCardV303" onclick="openPatchNoteV296(0)">
    <span class="latestPatchTagV303">${ht('DERNIÈRE MISE À JOUR','LATEST UPDATE')}</span>
    <div>
      <b>${esc(patchText(x.title))}</b>
      <small>${fmt(x.date,true)}${count?` · ${count} ${ht('détail(s)','detail(s)')}`:''}</small>
    </div>
    <strong>${ht('VOIR LES CHANGEMENTS','VIEW CHANGES')}</strong>
  </button>`;
}

window.renderHomeDashboard=function(){
  const d=D(),s=d.season||{},latest=(d.patch_notes||[])[0];
  return `<main class="homeV296">
    <section class="seasonV296">
      <h1>${ht('SAISON','SEASON')} ${esc(s.number||'?')}</h1>
      <div class="seasonLineV296">
        <strong>${ht('FIN DE LA SAISON DANS :','SEASON ENDS IN:')}</strong>${countdown(s.end)}
      </div>
      <small>${ht('Début','Start')} ${fmt(s.start,true)} · ${ht('Fin','End')} ${fmt(s.end,true)}</small>
    </section>
    ${divider()}
    ${heading(ht('Dernières sorties','Latest releases'),'orange')}
    <div class="releaseGridV296">${(d.latest_releases||[]).map(releaseCard).join('')||('<div class="emptyV296">'+ht('Aucune sortie.','No releases.')+'</div>')}</div>
    ${divider()}
    ${heading(ht('Tirages disponibles','Available gachas'),'yellow')}
    <div class="gachaGridV296">${(d.gachas||[]).map(gachaCard).join('')||('<div class="emptyV296">'+ht('Aucun tirage disponible.','No gacha available.')+'</div>')}</div>
    ${divider()}
    ${heading(ht('Événements en cours','Current events'),'cyan')}
    <div class="eventGridV296">${(d.events||[]).map(eventCard).join('')||('<div class="emptyV296">'+ht('Aucun événement.','No current event.')+'</div>')}</div>
    ${divider()}
    ${heading(ht('Bonus de connexion','Login bonuses'),'purple')}
    <div class="bonusGridV296">${(d.login_bonuses||[]).map(bonusCard).join('')||('<div class="emptyV296">'+ht('Aucun bonus.','No login bonus.')+'</div>')}</div>
    ${divider()}
    ${heading(ht('Réductions de points personnage','Character point discounts'),'green')}
    <div class="discountGridV296">${(d.discounts||[]).map(discountCard).join('')||('<div class="emptyV296">'+ht('Aucune réduction.','No discount.')+'</div>')}</div>
    ${divider()}
    ${heading(ht('Dernière note de mise à jour','Latest patch note'),'orange')}
    ${latestPatchCard(latest)}
    <footer class="homeFootV296">${ht('Mise à jour automatique chaque mardi · Anciens costumes verrouillés.','Automatic update every Tuesday · Older costumes remain locked.')}</footer>
  </main>`;
};

function refresh(){document.querySelectorAll('[data-home-count]').forEach(el=>{const n=new Date(el.dataset.homeCount)-Date.now();el.classList.toggle('urgent',n>0&&n<=86400000);el.classList.toggle('ended',n<=0);if(n<=0){el.innerHTML=`<div class="seasonEndedV334">${ht('NOUVELLE SAISON DISPONIBLE !','NEW SEASON AVAILABLE!')}<small>${ht('Mise à jour en attente…','Waiting for update…')}</small></div>`;return;}const v=[Math.floor(n/86400000),Math.floor(n/3600000)%24,Math.floor(n/60000)%60,Math.floor(n/1000)%60];['d','h','m','s'].forEach((k,i)=>{const q=el.querySelector(`[data-u="${k}"]`);if(q){const next=String(v[i]).padStart(2,'0');if(q.textContent!==next){q.textContent=next;q.classList.remove('tickV334');void q.offsetWidth;q.classList.add('tickV334')}}})})}
function modal(id,panelClass=''){let m=document.getElementById(id);if(!m){m=document.createElement('div');m.id=id;m.className='modalV296';m.innerHTML=`<div class="modalPanelV296 ${panelClass}"><header><h2></h2><button onclick="closeHomeModalV296('${id}')">×</button></header><div class="modalBodyV296"></div></div>`;document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)closeHomeModalV296(id)})}return m}
window.closeHomeModalV296=id=>{document.getElementById(id)?.classList.remove('open');if(!document.querySelector('.modalV296.open'))document.body.classList.remove('homeModalOpenV296')};
function valueTable(c){if(Array.isArray(c.before)&&Array.isArray(c.after)){const levels=c.before.map((_,i)=>`<th>Lv.${i+1}</th>`).join('');const before=c.before.map(v=>`<td>${esc(v)}</td>`).join('');const after=c.after.map(v=>`<td>${esc(v)}</td>`).join('');return `<div class="changeLabelV296">${esc(patchText(c.label||ht('Valeurs par niveau','Values by level')))}</div><div class="valueTableWrapV296"><table class="valueTableV296"><thead><tr><th></th>${levels}</tr></thead><tbody><tr class="before"><th>${ht('Avant','Before')}</th>${before}</tr><tr class="after"><th>${ht('Après','After')}</th>${after}</tr></tbody></table></div>`}if(c.before!=null||c.after!=null)return `<div class="singleChangeV296"><span>${ht('Avant','Before')} <b>${esc(c.before??'—')}</b></span><i>→</i><span>${ht('Après','After')} <b>${esc(c.after??'—')}</b></span></div>`;return ''}
function detailCard(c){return `<article class="detailCardV296 ${esc(c.tone||'adjust')}"><div class="detailIdentityV296">${img(c.portrait,c.character)}<div><b>${esc(c.character)}</b><small>${esc(patchText(c.style||'Original'))}</small><em>${esc(patchText(c.role||''))}</em></div></div><div class="detailSkillV296">${img(c.skill_image,c.skill_name)}<div><h4>${esc(patchText(c.skill_name||ht('Ajustement','Adjustment')))}</h4>${valueTable(c)}${(c.bullets||[]).length?`<ul>${c.bullets.map(x=>`<li>${esc(patchText(x))}</li>`).join('')}</ul>`:''}</div></div></article>`}
function richPatchBlocksV303(blocks){
  return (blocks||[]).map(block=>{
    if(block.type==='heading'){
      const level=Math.min(4,Math.max(2,Number(block.level||3)));
      return `<h${level} class="richPatchHeadingV303">${esc(block.text||'')}</h${level}>`;
    }
    if(block.type==='image'){
      return `<figure class="richPatchImageV303">${img(block.src,block.alt||'Illustration de la mise à jour')}${block.alt?`<figcaption>${esc(block.alt)}</figcaption>`:''}</figure>`;
    }
    if(block.type==='text'){
      return `<p class="richPatchTextV303">${esc(block.text||'')}</p>`;
    }
    return '';
  }).join('');
}
window.openPatchNoteV296=function(i){
  const p=(D().patch_notes||[])[i];
  if(!p)return;
  const m=modal('patchModalV296','patchPanelV296');
  m.querySelector('header h2').textContent=patchText(p.title);
  const details=p.details||[];
  let body=`<div class="patchDateV296">${fmt(p.date,true)}</div>
    <div class="legendV296">
      <span class="buff">${ht('AMÉLIORATION','BUFF')}</span>
      <span class="nerf">${ht('RÉDUCTION','NERF')}</span>
      <span class="adjust">${ht('AJUSTEMENT','ADJUSTMENT')}</span>
    </div>`;
  if(details.length){
    body+=details.map(s=>`<section class="detailSectionV296 ${esc(s.accent||'')}">
      <h3>${esc(patchText(s.title))}</h3>
      ${s.note?`<p class="patchNoteV296">${esc(patchText(s.note))}</p>`:''}
      <div class="detailGridV296">${(s.changes||[]).map(detailCard).join('')}</div>
    </section>`).join('');
  }else if((p.rich_blocks||[]).length){
    body+=`<article class="richPatchV303">${richPatchBlocksV303(p.rich_blocks)}</article>`;
  }else{
    body+=(p.sections||[]).map(s=>`<section class="simplePatchV296">
      <h3>${esc(patchText(s.title||ht('Changements','Changes')))}</h3>
      <ul>${(s.items||[]).map(x=>`<li>${esc(patchText(x))}</li>`).join('')}</ul>
    </section>`).join('')||`<div class="emptyV296">${ht('Aucun détail disponible.','No details available.')}</div>`;
  }
  m.querySelector('.modalBodyV296').innerHTML=body;
  m.classList.add('open');
  document.body.classList.add('homeModalOpenV296');
};

window.home=function(){return window.renderHomeDashboard()};
setInterval(refresh,1000);setTimeout(()=>{if(typeof page!=='undefined'&&page==='home'&&typeof render==='function')render();refresh()},0);
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modalV296.open').forEach(m=>closeHomeModalV296(m.id))});
})();
