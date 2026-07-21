/* V422 — refresh des routes, stats compactes et libellés FR */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const frMap=[
    [/Activation Checks(?:\s*\([^)]*\))?/gi,"Vérifications d’activation"],
    [/Heel Drop(?:\s*\([^)]*\))?/gi,'Coup de talon'],
    [/Slamming(?:\s*\([^)]*\))?/gi,'Écrasement'],
    [/Grab(?:\s*\([^)]*\))?/gi,'Saisie'],
    [/Target Detection(?:\s*\([^)]*\))?/gi,'Détection de la cible'],
    [/Ground Impact(?:\s*\([^)]*\))?/gi,'Impact au sol'],
    [/Shockwave(?:\s*\([^)]*\))?/gi,'Onde de choc']
  ];
  function localText(v){
    let s=String(v??'');
    if(typeof lang!=='undefined'&&lang==='en') return window.MHUR_TRANSLATE_GAME_TEXT?window.MHUR_TRANSLATE_GAME_TEXT(s):s;
    for(const [rx,to] of frMap)s=s.replace(rx,to);
    return s.replace(/\s*\([^)]*[\u3040-\u30ff\u3400-\u9fff][^)]*\)/g,'').replace(/\s{2,}/g,' ').trim();
  }
  window.tables=function(ts){
    const ordered=[...(ts||[])].sort((a,b)=>(String(b.title).includes('Effets')?1:0)-(String(a.title).includes('Effets')?1:0));
    return `<div class="tables">${ordered.map(tb=>`<button type="button" class="toggle" aria-expanded="false" onclick="const panel=this.nextElementSibling;panel.classList.toggle('hidden');this.setAttribute('aria-expanded',String(!panel.classList.contains('hidden')))"><span class="statsToggleTitle">${esc(localText(tb.title))}</span><span class="statsToggleArrow" aria-hidden="true">▾</span></button><div class="simpleTable hidden"><table class="dataTable"><thead><tr>${(tb.cols||[]).map(c=>`<th>${esc(localText(c))}</th>`).join('')}</tr></thead><tbody>${(tb.rows||[]).map(r=>`<tr>${(r||[]).map(x=>`<td>${esc(localText(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
  };
  function route(){
    const a=location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    const allowed=new Set(['characters','tunings','costumes','builds','mods']);
    return {page:allowed.has(a[0])?a[0]:'home',char:a[1]||null,costume:a[2]||null};
  }
  function applyRoute(){
    const r=route();
    if(typeof page!=='undefined')page=r.page;
    if(typeof selectedChar!=='undefined')selectedChar=r.char;
    if(typeof selectedCostume!=='undefined')selectedCostume=r.costume;
    if(r.char&&typeof characters!=='undefined'&&Array.isArray(characters)&&typeof selectedStyle!=='undefined'){
      const c=characters.find(x=>x.id===r.char);
      if(c&&c.styles?.length===1)selectedStyle=c.styles[0];
    }
    if(r.page==='mods'&&window.MHUR_MODS?.open)window.MHUR_MODS.open();
    else if(typeof layout==='function')layout();
    window.MHUR_SEO?.sync?.();
  }
  function restoreRoute(){applyRoute();setTimeout(applyRoute,80);setTimeout(applyRoute,350)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',restoreRoute,{once:true});else restoreRoute();
  addEventListener('load',restoreRoute,{once:true});
  addEventListener('popstate',restoreRoute);
})();
