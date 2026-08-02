/* MHUR Nexus — V589 : photos locales obligatoires pour les Alters */
(function(){
  'use strict';

  function clean(value){
    return String(value??'').trim();
  }

  function normal(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function localMap(){
    return window.MHUR_LOCAL_SKILL_ASSETS_V589?.styles||{};
  }

  function stylesMap(){
    try{
      if(typeof styles!=='undefined'&&styles)return styles;
    }catch(_error){}

    return window.styles||{};
  }

  function localPath(value){
    const path=clean(value)
      .replace(/^\.?\//,'')
      .replace(/^public\//,'');

    return path.startsWith('assets/')?path:'';
  }

  function letterKey(value){
    const raw=clean(value);
    const key=normal(raw);

    if(
      /^(?:α|a|alpha)(?:\s|[-—:(]|$)/i.test(raw)||
      key==='alpha'||
      key.startsWith('alpha_')
    )return 'alpha';

    if(
      /^(?:β|b|beta)(?:\s|[-—:(]|$)/i.test(raw)||
      key==='beta'||
      key.startsWith('beta_')
    )return 'beta';

    if(
      /^(?:γ|y|g|gamma)(?:\s|[-—:(]|$)/i.test(raw)||
      key==='gamma'||
      key.startsWith('gamma_')
    )return 'gamma';

    return '';
  }

  function assetsForStyle(styleId){
    const direct=localMap()[String(styleId)];
    if(direct)return direct;

    const wanted=normal(styleId);
    const entry=Object.entries(localMap()).find(
      ([key])=>normal(key)===wanted
    );

    return entry?.[1]||null;
  }

  function mergeDatabase(){
    const database=window.MHUR_DATABASE_ASSETS=
      window.MHUR_DATABASE_ASSETS||{};

    database.styles=database.styles||{};

    Object.entries(localMap()).forEach(([styleId,row])=>{
      const target=database.styles[styleId]=
        database.styles[styleId]||{};

      for(const key of ['alpha','beta','gamma']){
        const path=localPath(row?.[key]);
        if(path)target[key]=path;
      }
    });
  }

  function applyLocalToObjects(){
    mergeDatabase();

    const map=stylesMap();

    Object.keys(map).forEach(styleId=>{
      const style=map[styleId];
      const local=assetsForStyle(styleId);

      if(!style||!local)return;

      (style.skills||[]).forEach(skill=>{
        const key=letterKey(skill?.letter);
        const path=localPath(local?.[key]);

        if(key&&path)skill.img=path;

        if(skill?.sub){
          const subKey=letterKey(skill.sub.letter);
          const subPath=localPath(local?.[subKey]);

          if(subKey&&subPath)skill.sub.img=subPath;
        }
      });
    });
  }

  function currentStyleId(){
    try{
      if(typeof selectedStyle!=='undefined'&&selectedStyle){
        return String(selectedStyle);
      }
    }catch(_error){}

    return String(
      window.selectedStyle||
      document.querySelector('[data-style].active')?.dataset?.style||
      ''
    );
  }

  function removeFallbacks(image){
    if(!image)return;

    image.onerror=null;
    image.removeAttribute('onerror');
    image.removeAttribute('srcset');

    if(image.dataset){
      delete image.dataset.s18Fallbacks;
      delete image.dataset.s18v13Fallbacks;
      delete image.dataset.s18v14Applied;
    }
  }

  function repairCharacterPage(){
    const styleId=currentStyleId();
    const style=stylesMap()[styleId];
    const local=assetsForStyle(styleId);

    if(!style||!local)return;

    document.querySelectorAll('.charPanel .skill').forEach(block=>{
      const heading=block.querySelector('.skillHead');
      const key=letterKey(heading?.textContent||'');
      const path=localPath(local?.[key]);

      if(!key||!path)return;

      const image=block.querySelector('.skillImgBox img');
      if(!image)return;

      removeFallbacks(image);

      if(image.getAttribute('src')!==path){
        image.setAttribute('src',path);
      }
    });
  }

  function refresh(){
    applyLocalToObjects();
    repairCharacterPage();
  }

  function wrapRender(){
    if(typeof window.render!=='function')return;
    if(window.render.__mhurV589)return;

    const original=window.render;

    const wrapped=function(){
      applyLocalToObjects();
      const result=original.apply(this,arguments);
      applyLocalToObjects();
      repairCharacterPage();
      requestAnimationFrame(repairCharacterPage);
      return result;
    };

    wrapped.__mhurV589=true;
    window.render=wrapped;

    try{
      render=wrapped;
    }catch(_error){}
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      refresh();
    });
  }

  applyLocalToObjects();
  wrapRender();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      applyLocalToObjects();
      wrapRender();
      repairCharacterPage();
      schedule();
    },{once:true});
  }else{
    repairCharacterPage();
    schedule();
  }

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  window.addEventListener('load',()=>{
    applyLocalToObjects();
    wrapRender();
    repairCharacterPage();
    schedule();
  },{once:true});

  window.addEventListener('hashchange',schedule);
  window.addEventListener('mhur:languagechange',schedule);

  window.MHUR_V589={
    refresh,
    applyLocalToObjects,
    repairCharacterPage,
    localMap
  };
})();
