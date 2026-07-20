/* V391 — stabilise définitivement le menu bilingue et la liste des personnages des Mods. */
(()=>{
  'use strict';
  let busy=false, timer=0;
  const isEn=()=>{try{return typeof lang!=='undefined'&&lang==='en'}catch(_){return false}};
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

  function semanticKey(el){
    if(!el)return '';
    const pageKey=el.dataset?.page;
    if(pageKey==='home')return 'home';
    if(pageKey==='characters')return 'characters';
    if(pageKey==='tunings')return 'tunings';
    if(pageKey==='costumes')return 'costumes';
    if(pageKey==='builds')return 'builds';
    if(el.dataset?.mhurMods!==undefined)return 'mods';
    if(el.dataset?.mhurFinalNav==='creator'||el.dataset?.mhurLeaderboard!==undefined)return 'creator';
    if(el.dataset?.mhurFinalNav==='tier'||el.dataset?.mhurTierShortcut!==undefined)return 'tier';
    if(el.dataset?.mhurFinalNav==='search')return 'search';
    if(el.dataset?.mhurFinalNav==='install'||el.dataset?.mhurInstall!==undefined)return 'install';
    const t=norm(el.textContent);
    if(t==='accueil'||t==='home')return 'home';
    if(t.includes('personnage')||t.includes('character'))return 'characters';
    if(t.includes('t.u.n.i.n.g')||t==='tuning')return 'tunings';
    if(t.includes('costume'))return 'costumes';
    if(t.includes('build'))return 'builds';
    if(t==='mods'||t.includes('🧩'))return 'mods';
    if(t.includes('classement createur')||t.includes('creator ranking')||t.includes('creator leaderboard'))return 'creator';
    if(t.includes('tier list'))return 'tier';
    if(t.includes('recherche globale')||t.includes('global search'))return 'search';
    if(t.includes('installation')||t.includes('install app')||t.includes('installer'))return 'install';
    return '';
  }

  function section(title,key){
    const s=document.createElement('section');s.className='v386-menu-section';s.dataset.v386Section=key;
    const h=document.createElement('div');h.className='v386-menu-section-title';h.textContent=title;s.appendChild(h);return s;
  }

  function repair(){
    if(busy)return;
    const drawer=document.getElementById('drawer');if(!drawer)return;
    busy=true;
    try{
      // Flatten the previous generated sections while preserving the real buttons and their handlers.
      [...drawer.querySelectorAll(':scope > .v386-menu-section')].forEach(sec=>{
        [...sec.querySelectorAll(':scope > .navItem')].forEach(el=>drawer.insertBefore(el,sec));
        sec.remove();
      });
      const nodes=[...drawer.querySelectorAll(':scope > .navItem')];
      const chosen=new Map();
      for(const el of nodes){
        const key=semanticKey(el);
        if(!key)continue;
        const previous=chosen.get(key);
        // For main pages, always prefer the original data-page navigation item.
        const preferred=el.dataset?.page || el.dataset?.mhurFinalNav || el.dataset?.mhurMods!==undefined;
        const prevPreferred=previous&&(previous.dataset?.page||previous.dataset?.mhurFinalNav||previous.dataset?.mhurMods!==undefined);
        if(!previous||(preferred&&!prevPreferred)){if(previous)previous.remove();chosen.set(key,el)}else el.remove();
      }
      const en=isEn();
      const labels={
        home:en?'Home':'Accueil',characters:en?'Characters':'Personnages',tunings:'T.U.N.I.N.G',costumes:'Costumes',
        builds:en?'Community Builds':'Builds communauté',mods:'Mods',creator:en?'Creator Ranking':'Classement créateurs',
        tier:'Tier List',search:en?'Global Search':'Recherche globale',install:en?'Preparing installation…':'Préparation de l’installation…'
      };
      const icons={home:'🏠',characters:'🏠',tunings:'👥',costumes:'🔧',builds:'👥',mods:'🧩',creator:'🏅',tier:'🏆',search:'🔎',install:'📲'};
      for(const [key,el] of chosen){
        // Keep the icon and force one stable translated label.
        el.innerHTML=`${icons[key]||''} <span>${labels[key]}</span>`;
        el.classList.toggle('v386-menu-home',key==='home');
      }
      const game=section(en?'GAME':'JEU','game');
      const community=section(en?'COMMUNITY':'COMMUNAUTÉ','community');
      const tools=section(en?'TOOLS':'OUTILS','tools');
      const home=chosen.get('home');if(home)drawer.appendChild(home);
      ['characters','tunings','costumes'].forEach(k=>chosen.get(k)&&game.appendChild(chosen.get(k)));
      ['builds','mods','creator','tier'].forEach(k=>chosen.get(k)&&community.appendChild(chosen.get(k)));
      ['search','install'].forEach(k=>chosen.get(k)&&tools.appendChild(chosen.get(k)));
      if(game.querySelector('.navItem'))drawer.appendChild(game);
      if(community.querySelector('.navItem'))drawer.appendChild(community);
      if(tools.querySelector('.navItem'))drawer.appendChild(tools);
    }finally{busy=false}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(repair,20)}
  const oldLayout=window.layout;
  if(typeof oldLayout==='function'&&!oldLayout.__v391){
    const wrapped=function(){const result=oldLayout.apply(this,arguments);schedule();return result};
    wrapped.__v391=true;window.layout=wrapped;
  }
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  window.addEventListener('load',schedule,{once:true});
  document.addEventListener('click',e=>{if(e.target.closest('#langBtn,[data-lang],.langBtn'))setTimeout(schedule,30)});
  const wait=()=>{const d=document.getElementById('drawer');if(!d)return setTimeout(wait,100);new MutationObserver(schedule).observe(d,{childList:true,subtree:true});schedule()};wait();
  window.MHUR_V391={repairMenu:repair};
})();
