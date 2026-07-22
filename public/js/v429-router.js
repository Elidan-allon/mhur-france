/* V429 — une seule source de vérité pour les routes propres et le refresh. */
(function(){
  'use strict';
  const aliases={home:'home',character:'characters',characters:'characters',tuning:'tunings',tunings:'tunings',costume:'costumes',costumes:'costumes',build:'builds',builds:'builds',mod:'mods',mods:'mods'};
  const valid=new Set(['home','characters','tunings','costumes','builds','mods']);
  const canonical=value=>aliases[String(value||'home').toLowerCase()]||'home';
  function parse(pathname=location.pathname){
    const parts=String(pathname||'/').split('/').filter(Boolean).map(decodeURIComponent);
    const route={page:canonical(parts[0]||'home'),char:null,costume:null};
    if(['characters','tunings','costumes','builds'].includes(route.page)&&parts[1]&&parts[1]!=='communaute')route.char=parts[1];
    if(route.page==='costumes')route.costume=parts[2]||null;
    return route;
  }
  function state(){
    let route={page:'home',char:null,costume:null};
    try{
      route.page=canonical(typeof page!=='undefined'?page:window.page);
      route.char=typeof selectedChar!=='undefined'?(selectedChar||null):(window.selectedChar||null);
      route.costume=typeof selectedCostume!=='undefined'?(selectedCostume||null):(window.selectedCostume||null);
    }catch(_e){}
    return route;
  }
  function pathFrom(route=state()){
    if(route.page==='home')return '/';
    if(route.char){
      if(route.page==='costumes'&&route.costume)return `/costumes/${encodeURIComponent(route.char)}/${encodeURIComponent(route.costume)}`;
      return `/${route.page}/${encodeURIComponent(route.char)}`;
    }
    return `/${route.page}`;
  }
  function mirror(){
    try{
      if(typeof page!=='undefined')window.page=page;
      if(typeof selectedChar!=='undefined')window.selectedChar=selectedChar||null;
      if(typeof selectedStyle!=='undefined')window.selectedStyle=selectedStyle||null;
      if(typeof selectedCostume!=='undefined')window.selectedCostume=selectedCostume||null;
    }catch(_e){}
  }
  function apply(route=parse(),renderPage=true){
    try{
      page=canonical(route.page);
      selectedChar=route.char||null;
      selectedCostume=route.costume||null;
      selectedStyle=null;
      if(selectedChar&&Array.isArray(characters)){
        const character=characters.find(item=>item.id===selectedChar);
        if(character?.styles?.length===1)selectedStyle=character.styles[0];
      }
      mirror();
      if(renderPage){
        if(page==='mods'&&window.MHUR_MODS?.open)window.MHUR_MODS.open();
        else if(typeof layout==='function')layout();
        else if(typeof render==='function')render();
      }
      window.MHUR_SEO?.sync?.();
    }catch(error){console.error('[V429] restauration de route impossible',error)}
    return route;
  }
  function syncFromState(mode='replace'){
    mirror();
    const target=pathFrom();
    if(location.pathname===target&&!location.hash)return target;
    history[mode==='push'?'pushState':'replaceState']({page:state().page},'',target+location.search);
    return target;
  }
  function normalizeAndRestore(){
    const route=parse();
    const normalized=pathFrom(route);
    if(location.pathname!==normalized||location.hash)history.replaceState(history.state,'',normalized+location.search);
    apply(route,true);
  }
  window.MHUR_ROUTER={canonical,parse,state,pathFrom,apply,syncFromState,restore:normalizeAndRestore};
  window.MHUR_CLEAN_ROUTES=Object.assign(window.MHUR_CLEAN_ROUTES||{}, {
    parse,
    apply:()=>apply(parse(),false),
    currentPath:()=>pathFrom(),
    syncUrl:replace=>syncFromState(replace===false?'push':'replace')
  });
  addEventListener('popstate',normalizeAndRestore);
  addEventListener('pageshow',event=>{if(event.persisted)normalizeAndRestore()});
  if('serviceWorker' in navigator&&location.protocol==='https:'){
    navigator.serviceWorker.register('/service-worker.js?v=429',{scope:'/',updateViaCache:'none'}).then(registration=>registration.update().catch(()=>{})).catch(()=>{});
  }
  mirror();
  syncFromState('replace');
})();
