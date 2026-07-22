/* V426 — tableaux repliables fiables et restauration de toutes les routes. */
(function(){
  'use strict';

  window.toggleStatsTable=function(button){
    if(!button) return;
    const panel=button.nextElementSibling;
    if(!panel || !panel.classList.contains('simpleTable')) return;
    const willOpen=panel.classList.contains('hidden');
    panel.classList.toggle('hidden',!willOpen);
    panel.hidden=!willOpen;
    button.setAttribute('aria-expanded',String(willOpen));
  };

  /* Sécurité supplémentaire si un ancien rendu ne possède pas le bon onclick. */
  document.addEventListener('click',function(event){
    const button=event.target.closest?.('.skillText .toggle');
    if(!button) return;
    event.preventDefault();
    event.stopPropagation();
    window.toggleStatsTable(button);
  },true);

  /* Remplace le générateur final pour que tous les détails soient fermés au chargement. */
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function translated(v){
    const s=String(v??'');
    return typeof window.MHUR_TRANSLATE_GAME_TEXT==='function' ? window.MHUR_TRANSLATE_GAME_TEXT(s) : s;
  }
  try{
    tables=function(ts){
      const ordered=[...(ts||[])].sort((a,b)=>(String(b.title).includes('Effets')?1:0)-(String(a.title).includes('Effets')?1:0));
      return `<div class="tables">${ordered.map(tb=>`<button type="button" class="toggle" aria-expanded="false" onclick="toggleStatsTable(this)"><span class="statsToggleTitle">${esc(translated(tb.title))}</span><span class="statsToggleArrow" aria-hidden="true">▾</span></button><div class="simpleTable hidden" hidden><table class="dataTable"><thead><tr>${(tb.cols||[]).map(c=>`<th>${esc(translated(c))}</th>`).join('')}</tr></thead><tbody>${(tb.rows||[]).map(r=>`<tr>${(r||[]).map(x=>`<td>${esc(translated(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
    };
  }catch(_e){}

  const allowed=new Set(['characters','tunings','costumes','builds','mods']);
  function readRoute(){
    const parts=location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    return {
      page:allowed.has(parts[0])?parts[0]:'home',
      char:parts[1]&&parts[1]!=='communaute'?parts[1]:null,
      costume:parts[0]==='costumes'?(parts[2]||null):null
    };
  }
  function applyRoute(){
    const route=readRoute();
    try{
      page=route.page;
      selectedChar=route.char;
      selectedCostume=route.costume;
      selectedStyle=null;
      if(route.char && Array.isArray(characters)){
        const character=characters.find(x=>x.id===route.char);
        if(character?.styles?.length===1) selectedStyle=character.styles[0];
      }
      if(route.page==='mods' && window.MHUR_MODS?.open){
        window.MHUR_MODS.open();
      }else if(typeof layout==='function'){
        layout();
      }else if(typeof render==='function'){
        render();
      }
      window.MHUR_SEO?.sync?.();
    }catch(error){
      console.error('[V426] restauration de route impossible',error);
    }
  }

  /* pathname est la source de vérité au premier affichage et lors du retour navigateur. */
  queueMicrotask(applyRoute);
  addEventListener('DOMContentLoaded',applyRoute,{once:true});
  addEventListener('load',applyRoute,{once:true});
  addEventListener('pageshow',applyRoute);
  addEventListener('popstate',applyRoute);
})();
