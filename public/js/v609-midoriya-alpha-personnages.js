/* MHUR Nexus — V609
   Correctif cible des images Alpha de Midoriya dans les fiches personnages.

   Ce correctif :
   - impose les trois chemins locaux exacts ;
   - agit uniquement sur Original, Full Bullet et OFA ;
   - ne modifie pas Beta, Gamma, les actions speciales ou les autres personnages ;
   - conserve l'image speciale Full Burst de l'Original ;
   - passe apres les anciennes couches de compatibilite.
*/
(function(){
  'use strict';

  if(window.MHUR_V609_MIDORIYA_ALPHA_LOADED)return;
  window.MHUR_V609_MIDORIYA_ALPHA_LOADED=true;

  const VERSION='609';

  const EXACT=Object.freeze({
    assault:Object.freeze({
      alpha:'assets/midoriya/midoriya_assault/alpha.webp',
      alphaSub:'assets/midoriya/midoriya_assault/alpha_fullburst.webp'
    }),
    fullbullet:Object.freeze({
      alpha:'assets/midoriya/midoriya_attack/alpha.webp'
    }),
    ofa:Object.freeze({
      alpha:'assets/midoriya_ofa/alpha.webp'
    })
  });

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

  function isAlpha(value){
    const raw=clean(value);
    const key=normal(raw);

    return (
      /^(?:α|a|alpha)(?:\s|[-—:(]|$)/i.test(raw)||
      key==='alpha'||
      key.startsWith('alpha_')
    );
  }

  function stylesMap(){
    try{
      if(
        typeof styles!=='undefined'&&
        styles&&
        typeof styles==='object'
      ){
        return styles;
      }
    }catch(_error){}

    return window.styles||{};
  }

  function currentStyleId(){
    try{
      if(
        typeof selectedStyle!=='undefined'&&
        selectedStyle
      ){
        return String(selectedStyle);
      }
    }catch(_error){}

    return clean(
      window.selectedStyle||
      document.querySelector(
        '.styleCard.active[data-style], [data-style].active'
      )?.dataset?.style||
      ''
    );
  }

  function mainAlphaSkill(style){
    if(!style||!Array.isArray(style.skills))return null;

    return style.skills.find(skill=>
      isAlpha(skill?.letter)
    )||null;
  }

  function patchDatabase(){
    const database=window.MHUR_DATABASE_ASSETS=
      window.MHUR_DATABASE_ASSETS||{};

    database.styles=database.styles||{};

    Object.entries(EXACT).forEach(([styleId,paths])=>{
      const target=database.styles[styleId]=
        database.styles[styleId]||{};

      /*
        Les IDs utilises par les fiches sont :
        assault, fullbullet et ofa.
        On corrige uniquement leur cle Alpha.
      */
      target.alpha=paths.alpha;
    });
  }

  function patchObjects(){
    patchDatabase();

    const map=stylesMap();

    Object.entries(EXACT).forEach(([styleId,paths])=>{
      const style=map[styleId];
      const alpha=mainAlphaSkill(style);

      if(!alpha)return;

      alpha.img=paths.alpha;

      /*
        L'Original possede un second affichage Alpha :
        Delaware Smash Air Force Full Burst.
        Il garde son fichier dedie et ne doit surtout pas
        recevoir l'image de l'Alpha principal.
      */
      if(
        styleId==='assault'&&
        alpha.sub&&
        isAlpha(alpha.sub.letter)&&
        paths.alphaSub
      ){
        alpha.sub.img=paths.alphaSub;
      }
    });
  }

  function versionedAbsolute(path){
    const cleanPath=clean(path)
      .replace(/^\.?\//,'')
      .replace(/^public\//,'');

    return `/${cleanPath}?v=${VERSION}`;
  }

  function clearOldFallbacks(image){
    if(!image)return;

    image.onerror=null;
    image.removeAttribute('onerror');
    image.removeAttribute('srcset');

    if(image.dataset){
      delete image.dataset.s18Fallbacks;
      delete image.dataset.s18v13Fallbacks;
      delete image.dataset.s18v14Fallbacks;
      delete image.dataset.s18v14Applied;
      delete image.dataset.v589Fallbacks;
    }
  }

  function setImage(block,path,kind){
    if(!block||!path)return;

    const image=block.querySelector(
      '.skillImgBox img, .skillImg img, img'
    );

    if(!image)return;

    clearOldFallbacks(image);

    const wanted=versionedAbsolute(path);

    if(image.getAttribute('src')!==wanted){
      image.setAttribute('src',wanted);
    }

    image.setAttribute('loading','eager');
    image.setAttribute('decoding','async');
    image.setAttribute('fetchpriority','high');
    image.dataset.mhurV609MidoriyaAlpha=kind;
  }

  function alphaBlocks(){
    return Array.from(
      document.querySelectorAll('.charPanel .skill')
    ).filter(block=>{
      const heading=block.querySelector('.skillHead');

      return isAlpha(heading?.textContent||'');
    });
  }

  function repairCharacterPage(){
    const styleId=currentStyleId();
    const paths=EXACT[styleId];

    if(!paths)return;

    const blocks=alphaBlocks();

    /*
      Le premier bloc Alpha est toujours la competence Alpha
      principale du style selectionne.
    */
    setImage(blocks[0],paths.alpha,'main');

    /*
      Chez Midoriya Original uniquement, le second bloc Alpha
      est Full Burst et possede sa propre image.
    */
    if(styleId==='assault'&&paths.alphaSub){
      const fullBurstBlock=blocks.find((block,index)=>{
        if(index===0)return false;

        const heading=normal(
          block.querySelector('.skillHead')?.textContent||''
        );

        return heading.includes('full_burst');
      })||blocks[1];

      setImage(fullBurstBlock,paths.alphaSub,'full-burst');
    }
  }

  function refresh(){
    patchObjects();
    repairCharacterPage();
  }

  function getRender(){
    try{
      if(typeof render==='function')return render;
    }catch(_error){}

    return typeof window.render==='function'
      ?window.render
      :null;
  }

  function wrapRender(){
    const original=getRender();

    if(
      typeof original!=='function'||
      original.__mhurV609MidoriyaAlpha
    ){
      return;
    }

    const wrapped=function(){
      /*
        Corrige la base AVANT les couches precedentes :
        season18-fixes lira donc deja les bons chemins.
      */
      patchObjects();

      const result=original.apply(this,arguments);

      /*
        Puis reverifie les objets et le DOM APRES le rendu.
      */
      patchObjects();
      repairCharacterPage();
      requestAnimationFrame(repairCharacterPage);

      return result;
    };

    wrapped.__mhurV609MidoriyaAlpha=true;
    wrapped.__mhurV609Original=original;

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
      patchObjects();
      wrapRender();
      repairCharacterPage();
    });
  }

  patchObjects();
  wrapRender();

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      ()=>{
        patchObjects();
        wrapRender();
        repairCharacterPage();
        schedule();
      },
      {once:true}
    );
  }else{
    repairCharacterPage();
    schedule();
  }

  window.addEventListener(
    'load',
    ()=>{
      patchObjects();
      wrapRender();
      repairCharacterPage();
      schedule();
    },
    {once:true}
  );

  window.addEventListener('popstate',schedule);
  window.addEventListener('hashchange',schedule);
  window.addEventListener('mhur:languagechange',schedule);

  /*
    Les changements de personnage/style passent deja par render.
    Ce filet leger couvre aussi les anciens boutons qui mettent
    parfois le DOM a jour dans une tache suivante.
  */
  document.addEventListener('click',schedule,true);

  window.MHUR_V609_MIDORIYA_ALPHA={
    version:VERSION,
    paths:EXACT,
    refresh,
    patchObjects,
    repairCharacterPage
  };
})();
