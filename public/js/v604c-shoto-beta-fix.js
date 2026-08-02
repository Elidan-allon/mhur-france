/* MHUR Nexus — V604C */
(function(){
  'use strict';

  if(window.MHUR_V604C_LOADED)return;
  window.MHUR_V604C_LOADED=true;

  const TEXT={
    fr:{
      name:'Mur de glace transperçant les cieux',
      desc:'Crée un immense bloc de glace dans la direction visée. Le bloc de glace peut traverser les murs.'
    },
    en:{
      name:'Heaven-Piercing Ice Wall',
      desc:'Creates a massive block of ice in the aim direction. The ice block can pass through walls.'
    }
  };

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

  function language(){
    try{
      if(typeof lang!=='undefined'&&(lang==='fr'||lang==='en')){
        return lang;
      }
    }catch(_error){}

    const html=clean(document.documentElement.lang).toLowerCase();
    if(html.startsWith('en'))return 'en';
    if(html.startsWith('fr'))return 'fr';

    return 'fr';
  }

  function styleMap(){
    try{
      if(typeof styles!=='undefined'&&styles)return styles;
    }catch(_error){}
    return window.styles||{};
  }

  function betaSkill(style){
    if(!style||!Array.isArray(style.skills))return null;

    return style.skills.find(skill=>
      /^(?:β|b|beta)(?:\s|[-—:(]|$)/i.test(
        clean(skill?.letter)
      )
    )||null;
  }

  function shotoTechnicalStyle(){
    const map=styleMap();

    for(const id of [
      'shoto_technical',
      'todoroki_technical',
      'shoto_todoroki_technical'
    ]){
      if(map[id])return map[id];
    }

    const entry=Object.entries(map).find(([id,style])=>{
      const joined=normal(
        id+' '+clean(style?.name)+' '+clean(style?.role)
      );

      return (
        (
          joined.includes('shoto')||
          joined.includes('todoroki')
        )&&
        (
          joined.includes('technical')||
          joined.includes('technique')
        )
      );
    });

    return entry?.[1]||null;
  }

  function patchData(){
    const beta=betaSkill(shotoTechnicalStyle());
    if(!beta)return false;

    const current=TEXT[language()];
    beta.name=current.name;
    beta.desc=current.desc;
    beta.description=current.desc;

    return true;
  }

  function looksLikeTarget(element){
    const image=normal(
      element.querySelector('img')?.getAttribute('src')
    );

    if(
      (
        image.includes('shoto')||
        image.includes('todoroki')
      )&&
      image.includes('beta')
    ){
      return true;
    }

    const text=normal(element.textContent);

    return (
      text.includes('heaven_piercing_ice_wall')||
      text.includes('mur_de_glace_transpercant')||
      text.includes('cascada_de_hielo_rasgadora')||
      text.includes('causes_an_explosion')||
      text.includes('blast_pierces_walls')
    );
  }

  function patchDom(){
    const current=TEXT[language()];

    document.querySelectorAll(
      '.charPanel .skill,'+
      '.charPanel .gamePanel,'+
      '[data-skill-letter="beta"]'
    ).forEach(element=>{
      if(!looksLikeTarget(element))return;

      const heading=element.querySelector(
        '.skillHead,.skillTitle,.gameName,h2,h3,h4'
      );

      const description=element.querySelector(
        '.skillDesc,.skillDescription,.gameDescription,p'
      );

      if(heading)heading.textContent='β — '+current.name;
      if(description)description.textContent=current.desc;
    });
  }

  function refresh(){
    patchData();
    patchDom();
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      try{refresh();}catch(_error){}
    });
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      schedule();
    }
  });

  function start(){
    refresh();
    observer.observe(document.documentElement,{
      childList:true,
      subtree:true
    });
  }

  window.addEventListener('mhur:languagechange',()=>{
    setTimeout(schedule,0);
    setTimeout(schedule,100);
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once:true}
    );
  }else{
    start();
  }

  window.addEventListener('load',schedule,{once:true});

  window.MHUR_V604C={refresh};
})();
