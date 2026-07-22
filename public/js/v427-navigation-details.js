/* V427 — navigation propre et tableaux de compétences réellement repliables. */
(function(){
  'use strict';

  const ROUTES=new Set(['characters','tunings','costumes','builds','mods']);

  function routeFromPath(){
    const parts=location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    return {
      page:ROUTES.has(parts[0])?parts[0]:'home',
      char:(parts[1] && parts[1]!=='communaute')?parts[1]:null,
      costume:parts[0]==='costumes'?(parts[2]||null):null
    };
  }

  function pathFromState(){
    const p=(typeof page!=='undefined'&&page)||'home';
    const c=(typeof selectedChar!=='undefined'&&selectedChar)||null;
    const costume=(typeof selectedCostume!=='undefined'&&selectedCostume)||null;
    if(p==='home') return '/';
    if(c){
      if(p==='costumes'&&costume) return '/costumes/'+encodeURIComponent(c)+'/'+encodeURIComponent(costume);
      return '/'+p+'/'+encodeURIComponent(c);
    }
    return '/'+p;
  }

  function syncUrl(replace=true){
    const path=pathFromState();
    if(location.pathname!==path || location.hash){
      history[replace?'replaceState':'pushState'](null,'',path+location.search);
    }
  }

  function applyRoute(){
    const route=routeFromPath();
    try{
      page=route.page;
      selectedChar=route.char;
      selectedCostume=route.costume;
      selectedStyle=null;
      if(route.char && Array.isArray(characters)){
        const character=characters.find(x=>x.id===route.char);
        if(character?.styles?.length===1) selectedStyle=character.styles[0];
      }
      if(route.page==='mods' && window.MHUR_MODS?.open) window.MHUR_MODS.open();
      else if(typeof layout==='function') layout();
      else if(typeof render==='function') render();
      window.MHUR_SEO?.sync?.();
    }catch(error){
      console.error('[V427] restauration de route impossible',error);
    }
  }

  /* Les anciens correctifs utilisent cet objet : on remplace leurs fonctions par
     une version qui lit les vraies variables globales lexicales du site. */
  window.MHUR_CLEAN_ROUTES=Object.assign(window.MHUR_CLEAN_ROUTES||{}, {
    parse:routeFromPath,
    apply:applyRoute,
    currentPath:pathFromState,
    syncUrl
  });

  window.toggleStatsTable=function(button){
    if(!button) return;
    const panel=button.nextElementSibling;
    if(!panel || !panel.classList.contains('simpleTable')) return;
    const opening=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(opening));
    panel.classList.toggle('hidden',!opening);
    panel.hidden=!opening;
    panel.setAttribute('aria-hidden',String(!opening));
    panel.style.setProperty('display',opening?'block':'none','important');
  };

  /* Un seul gestionnaire : aucun double basculement avec un onclick inline. */
  document.addEventListener('click',function(event){
    const button=event.target.closest?.('.skillText .toggle');
    if(!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.toggleStatsTable(button);
  },true);

  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const translated=v=>typeof window.MHUR_TRANSLATE_GAME_TEXT==='function'
    ? window.MHUR_TRANSLATE_GAME_TEXT(String(v??''))
    : String(v??'');

  try{
    tables=function(ts){
      const ordered=[...(ts||[])].sort((a,b)=>(String(b.title).includes('Effets')?1:0)-(String(a.title).includes('Effets')?1:0));
      return `<div class="tables">${ordered.map(tb=>`<button type="button" class="toggle" aria-expanded="false"><span class="statsToggleTitle">${esc(translated(tb.title))}</span><span class="statsToggleArrow" aria-hidden="true">▾</span></button><div class="simpleTable hidden" hidden aria-hidden="true" style="display:none!important"><table class="dataTable"><thead><tr>${(tb.cols||[]).map(c=>`<th>${esc(translated(c))}</th>`).join('')}</tr></thead><tbody>${(tb.rows||[]).map(r=>`<tr>${(r||[]).map(x=>`<td>${esc(translated(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
    };
  }catch(error){
    console.error('[V427] remplacement du rendu des tableaux impossible',error);
  }

  /* Après chaque rendu, tout tableau non explicitement ouvert reste fermé. */
  function normalizeTables(root=document){
    root.querySelectorAll?.('.skillText .toggle').forEach(button=>{
      const panel=button.nextElementSibling;
      if(!panel?.classList.contains('simpleTable')) return;
      if(button.getAttribute('aria-expanded')!=='true'){
        button.setAttribute('aria-expanded','false');
        panel.classList.add('hidden');
        panel.hidden=true;
        panel.setAttribute('aria-hidden','true');
        panel.style.setProperty('display','none','important');
      }
    });
  }

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===1) normalizeTables(node);
      }
    }
  });
  addEventListener('DOMContentLoaded',()=>{
    normalizeTables();
    observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  },{once:true});

  addEventListener('popstate',applyRoute);
  addEventListener('pageshow',()=>{ applyRoute(); normalizeTables(); });
})();
