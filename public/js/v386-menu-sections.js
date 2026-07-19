/* V386 — sépare le menu en Jeu / Communauté / Outils, sans modifier les actions. */
(()=>{
  'use strict';
  let applying=false, queued=false;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const currentLang=()=>{
    try{return (typeof lang!=='undefined'?lang:localStorage.getItem('mhur_lang'))==='en'?'en':'fr'}catch(_){return 'fr'}
  };
  const titles=()=>currentLang()==='en'
    ?{game:'GAME',community:'COMMUNITY',tools:'TOOLS'}
    :{game:'JEU',community:'COMMUNAUTÉ',tools:'OUTILS'};

  function keyFor(el){
    const t=norm(el.textContent);
    if(t.includes('home')||t.includes('accueil')) return 'home';
    if(t.includes('character')||t.includes('personnage')) return 'game';
    if(t.includes('t.u.n.i.n.g')||t.includes('tuning')) return 'game';
    if(t.includes('costume')) return 'game';
    if(t.includes('community build')||t.includes('build communaute')||t.includes('build recommande')||t.includes('recommended build')) return 'community';
    if(t==='mods'||t.includes(' mod')) return 'community';
    if(t.includes('creator ranking')||t.includes('creator leaderboard')||t.includes('classement createur')) return 'community';
    if(t.includes('tier list')) return 'community';
    if(t.includes('global search')||t.includes('recherche globale')) return 'tools';
    if(t.includes('install app')||t.includes('installer')||t.includes('installation')||t.includes('browser menu')) return 'tools';
    return 'other';
  }

  function makeSection(key,title){
    const section=document.createElement('section');
    section.className='v386-menu-section';
    section.dataset.v386Section=key;
    const head=document.createElement('div');
    head.className='v386-menu-section-title';
    head.textContent=title;
    section.appendChild(head);
    return section;
  }

  function apply(){
    if(applying)return;
    const drawer=document.getElementById('drawer');
    if(!drawer)return;
    applying=true;
    try{
      const existing=[...drawer.querySelectorAll(':scope > .v386-menu-section')];
      existing.forEach(sec=>{
        [...sec.querySelectorAll(':scope > .navItem')].forEach(btn=>drawer.insertBefore(btn,sec));
        sec.remove();
      });

      const buttons=[...drawer.children].filter(el=>el.classList?.contains('navItem'));
      if(!buttons.length)return;
      buttons.forEach(b=>b.classList.remove('v386-menu-home'));
      const t=titles();
      const sections={
        game:makeSection('game',t.game),
        community:makeSection('community',t.community),
        tools:makeSection('tools',t.tools)
      };
      const home=buttons.find(b=>keyFor(b)==='home');
      if(home)home.classList.add('v386-menu-home');

      const anchor=home?home.nextSibling:drawer.firstChild;
      drawer.insertBefore(sections.game,anchor);
      drawer.insertBefore(sections.community,sections.game.nextSibling);
      drawer.insertBefore(sections.tools,sections.community.nextSibling);

      buttons.forEach(btn=>{
        const key=keyFor(btn);
        if(sections[key])sections[key].appendChild(btn);
      });
      Object.values(sections).forEach(sec=>{
        if(sec.querySelectorAll(':scope > .navItem').length===0)sec.remove();
      });
    }finally{applying=false}
  }

  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  window.addEventListener('load',schedule,{once:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('#langBtn,[data-lang],.langBtn'))setTimeout(schedule,0);
  });
  const startObserver=()=>{
    const drawer=document.getElementById('drawer');
    if(!drawer)return setTimeout(startObserver,100);
    new MutationObserver(schedule).observe(drawer,{childList:true,subtree:false,characterData:false});
    schedule();
  };
  startObserver();
  window.MHUR_V386={refreshMenuSections:schedule};
})();
