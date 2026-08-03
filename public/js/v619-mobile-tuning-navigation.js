/* MHUR Nexus — V619
   - clic sur un emplacement : descend aux T.U.N.I.N.G compatibles ;
   - sélection d'un T.U.N.I.N.G : remonte à l'emplacement actif ;
   - ajoute les descriptions, effets et niveaux complets sur mobile. */
(function(){
  'use strict';

  if(window.MHUR_V619_TUNING_MOBILE_LOADED)return;
  window.MHUR_V619_TUNING_MOBILE_LOADED=true;

  const MOBILE_QUERY='(max-width:760px)';
  let refreshQueued=false;
  let navigationToken=0;

  function mobile(){
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function language(){
    return String(
      document.documentElement.lang||
      (typeof lang!=='undefined'?lang:'fr')||
      'fr'
    ).toLowerCase().startsWith('en')?'en':'fr';
  }

  function labels(){
    return language()==='en'
      ?{
          details:'Full details',
          effect:'Effect',
          levels:'Levels'
        }
      :{
          details:'Détails complets',
          effect:'Effet',
          levels:'Niveaux'
        };
  }

  function cleanText(value){
    const holder=document.createElement('div');
    holder.innerHTML=String(value??'')
      .replace(/<br\s*\/?>\s*<br\s*\/?>/gi,'\n\n')
      .replace(/<br\s*\/?>/gi,'\n');

    return String(holder.textContent||holder.innerText||'')
      .replace(/\u00a0/g,' ')
      .replace(/[ \t]+\n/g,'\n')
      .replace(/\n[ \t]+/g,'\n')
      .replace(/[ \t]{2,}/g,' ')
      .replace(/\n{3,}/g,'\n\n')
      .trim();
  }

  function element(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined&&text!==null)node.textContent=String(text);
    return node;
  }

  function addLevels(parent,levelValues,texts){
    const levels=Array.isArray(levelValues)
      ?levelValues.filter(value=>String(value??'').trim())
      :[];

    if(!levels.length)return;

    parent.appendChild(
      element('div','mhurV619LevelsLabel',texts.levels)
    );

    const list=element('div','mhurV619Levels');

    levels.forEach(value=>{
      const text=String(value);
      const chip=element(
        'span',
        'mhurV619Level'+(
          /^sub\s*effect/i.test(text)
            ?' mhurV619Sub'
            :''
        ),
        text
      );
      list.appendChild(chip);
    });

    parent.appendChild(list);
  }

  function addEffect(parent,effect,texts,showName){
    const block=element('section','mhurV619Effect');

    if(showName&&effect?.name){
      block.appendChild(
        element(
          'div',
          'mhurV619EffectName',
          cleanText(effect.name)
        )
      );
    }

    const description=cleanText(effect?.desc||'');

    if(description){
      block.appendChild(
        element('p','mhurV619EffectDesc',description)
      );
    }

    addLevels(block,effect?.levels||[],texts);
    parent.appendChild(block);
  }

  function fullEffects(tuning){
    if(Array.isArray(tuning?.effects)&&tuning.effects.length){
      return tuning.effects;
    }

    return [{
      name:tuning?.name||'',
      desc:tuning?.desc||'',
      levels:Array.isArray(tuning?.levels)?tuning.levels:[]
    }];
  }

  function enrichOption(button,tuning,index){
    if(!button||!tuning)return;

    const signature=[
      tuning.styleKey||'',
      tuning.character||'',
      tuning.name||'',
      Array.isArray(tuning.levels)?tuning.levels.length:0,
      Array.isArray(tuning.effects)?tuning.effects.length:0,
      language()
    ].join('|');

    if(
      button.dataset.mhurV619Signature===signature&&
      button.querySelector(':scope > .mhurV619Details')
    ){
      return;
    }

    button.dataset.mhurV619Signature=signature;
    button.dataset.mhurV619Index=String(index);

    button.querySelectorAll(
      ':scope > .mhurV619Details'
    ).forEach(node=>node.remove());

    const texts=labels();
    const details=element('div','mhurV619Details');
    details.appendChild(
      element('div','mhurV619DetailsTitle',texts.details)
    );

    const effects=fullEffects(tuning);
    effects.forEach((effect,effectIndex)=>{
      addEffect(
        details,
        effect,
        texts,
        effects.length>1||effectIndex>0
      );
    });

    button.appendChild(details);
  }

  function enrich(){
    if(!mobile())return;

    const options=Array.isArray(window.__lastTuningOptions)
      ?window.__lastTuningOptions
      :[];

    const buttons=Array.from(
      document.querySelectorAll(
        '#app .gameCostumeScreen .tuningOption'
      )
    );

    buttons.forEach((button,index)=>{
      enrichOption(button,options[index],index);
    });

    updateScrollOffset();
  }

  function updateScrollOffset(){
    if(!mobile())return;

    const header=document.querySelector('header');
    const back=document.querySelector(
      '#app .gameCostumeScreen .back,'+
      '#app > .back,'+
      '#app .back'
    );

    let bottom=0;

    [header,back].forEach(node=>{
      if(!node)return;

      const style=getComputedStyle(node);
      if(
        node===header||
        style.position==='fixed'||
        style.position==='sticky'
      ){
        const rect=node.getBoundingClientRect();
        if(rect.bottom>bottom&&rect.bottom<innerHeight){
          bottom=rect.bottom;
        }
      }
    });

    document.documentElement.style.setProperty(
      '--mhur-v619-scroll-offset',
      `${Math.max(90,Math.ceil(bottom))}px`
    );
  }

  function scrollOffset(){
    updateScrollOffset();

    const value=parseFloat(
      getComputedStyle(document.documentElement)
        .getPropertyValue('--mhur-v619-scroll-offset')
    );

    return Number.isFinite(value)?value+12:202;
  }

  function smoothScrollTo(target){
    if(!target||!target.isConnected)return;

    const top=Math.max(
      0,
      window.scrollY+
      target.getBoundingClientRect().top-
      scrollOffset()
    );

    const reduced=window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    window.scrollTo({
      top,
      left:0,
      behavior:reduced?'auto':'smooth'
    });
  }

  function navigateAfterRender(kind){
    const token=++navigationToken;

    const perform=()=>{
      if(token!==navigationToken||!mobile())return;

      enrich();

      const target=kind==='picker'
        ?document.querySelector(
            '#app .gameCostumeScreen .tuningPicker'
          )
        :document.querySelector(
            '#app .gameCostumeScreen .gameSlot.active'
          );

      smoothScrollTo(target);
    };

    /*
      Les fonctions existantes restaurent d'abord l'ancienne position
      dans requestAnimationFrame. V619 passe volontairement après.
    */
    setTimeout(()=>{
      requestAnimationFrame(()=>{
        requestAnimationFrame(perform);
      });
    },70);
  }

  function scheduleRefresh(){
    if(refreshQueued)return;

    refreshQueued=true;

    requestAnimationFrame(()=>{
      refreshQueued=false;
      enrich();
    });
  }

  document.addEventListener('click',event=>{
    if(!mobile())return;

    const slot=event.target?.closest?.(
      '#app .gameCostumeScreen .gameSlot'
    );

    if(slot){
      navigateAfterRender('picker');
      return;
    }

    const option=event.target?.closest?.(
      '#app .gameCostumeScreen .tuningOption'
    );

    if(option&&!option.disabled){
      navigateAfterRender('slot');
    }
  });

  new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length||
        mutation.removedNodes?.length
      )
    ){
      scheduleRefresh();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  window.addEventListener('resize',scheduleRefresh);
  window.addEventListener('orientationchange',scheduleRefresh);
  window.addEventListener('load',scheduleRefresh,{once:true});
  window.addEventListener('mhur:languagechange',()=>{
    document.querySelectorAll(
      '.mhurV619Details'
    ).forEach(node=>node.remove());

    scheduleRefresh();
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      scheduleRefresh,
      {once:true}
    );
  }else{
    scheduleRefresh();
  }

  window.MHUR_V619_TUNING_MOBILE={
    refresh:scheduleRefresh,
    enrich,
    scrollToPicker(){
      navigateAfterRender('picker');
    },
    scrollToActiveSlot(){
      navigateAfterRender('slot');
    }
  };
})();
