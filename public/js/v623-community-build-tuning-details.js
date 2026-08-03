/* MHUR Nexus — V623
   Ajoute les descriptions, effets et niveaux complets aux T.U.N.I.N.G
   du créateur de builds communautaires, sur mobile uniquement. */
(function(){
  'use strict';

  if(window.MHUR_V623_COMMUNITY_DETAILS_LOADED)return;
  window.MHUR_V623_COMMUNITY_DETAILS_LOADED=true;

  const MOBILE_QUERY='(max-width:760px)';
  let queued=false;

  function mobile(){
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function english(){
    return String(
      document.documentElement.lang||
      (typeof lang!=='undefined'?lang:'fr')||
      'fr'
    ).toLowerCase().startsWith('en');
  }

  function ui(){
    return english()
      ?{
          details:'Full details',
          levels:'Levels'
        }
      :{
          details:'Détails complets',
          levels:'Niveaux'
        };
  }

  function translate(value){
    const text=String(value??'');
    const translator=window.MHUR_TRANSLATE_GAME_TEXT;

    if(english()&&typeof translator==='function'){
      try{
        return String(translator(text)??text);
      }catch(_error){}
    }

    return text;
  }

  function plain(value){
    const holder=document.createElement('div');

    holder.innerHTML=translate(value)
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

  function node(tag,className,text){
    const element=document.createElement(tag);

    if(className)element.className=className;

    if(text!==undefined&&text!==null){
      element.textContent=String(text);
    }

    return element;
  }

  function effectsFor(tuning){
    if(
      Array.isArray(tuning?.effects)&&
      tuning.effects.length
    ){
      return tuning.effects;
    }

    return [{
      name:tuning?.name||'',
      desc:tuning?.desc||'',
      levels:Array.isArray(tuning?.levels)
        ?tuning.levels
        :[]
    }];
  }

  function addLevels(parent,values,labels){
    const levels=Array.isArray(values)
      ?values.filter(value=>String(value??'').trim())
      :[];

    if(!levels.length)return;

    parent.appendChild(
      node(
        'div',
        'mhurV623CommunityLevelsLabel',
        labels.levels
      )
    );

    const list=node(
      'div',
      'mhurV623CommunityLevels'
    );

    levels.forEach(value=>{
      const text=String(value);
      const chip=node(
        'span',
        'mhurV623CommunityLevel'+(
          /^sub\s*effect/i.test(text)
            ?' mhurV623CommunitySub'
            :''
        ),
        text
      );

      list.appendChild(chip);
    });

    parent.appendChild(list);
  }

  function addEffect(
    parent,
    effect,
    labels,
    showName
  ){
    const section=node(
      'section',
      'mhurV623CommunityEffect'
    );

    const name=plain(effect?.name||'');

    if(showName&&name){
      section.appendChild(
        node(
          'div',
          'mhurV623CommunityEffectName',
          name
        )
      );
    }

    const description=plain(effect?.desc||'');

    if(description){
      section.appendChild(
        node(
          'p',
          'mhurV623CommunityEffectDesc',
          description
        )
      );
    }

    addLevels(
      section,
      effect?.levels||[],
      labels
    );

    parent.appendChild(section);
  }

  function enrichButton(button,tuning,index){
    if(!button||!tuning)return;

    const effects=effectsFor(tuning);

    const signature=[
      tuning.styleKey||'',
      tuning.character||'',
      tuning.name||'',
      effects.length,
      Array.isArray(tuning.levels)
        ?tuning.levels.length
        :0,
      english()?'en':'fr'
    ].join('|');

    if(
      button.dataset.mhurV623Signature===signature&&
      button.querySelector(
        ':scope > .mhurV623CommunityDetails'
      )
    ){
      return;
    }

    button.dataset.mhurV623Signature=signature;
    button.dataset.mhurV623Index=String(index);

    button.querySelectorAll(
      ':scope > .mhurV623CommunityDetails'
    ).forEach(element=>element.remove());

    const labels=ui();

    const details=node(
      'div',
      'mhurV623CommunityDetails'
    );

    details.appendChild(
      node(
        'div',
        'mhurV623CommunityDetailsTitle',
        labels.details
      )
    );

    effects.forEach((effect,effectIndex)=>{
      addEffect(
        details,
        effect,
        labels,
        effects.length>1||effectIndex>0
      );
    });

    button.appendChild(details);
  }

  function enrich(){
    if(!mobile())return;

    const modal=document.getElementById(
      'cbBuilderModal'
    );

    if(!modal||!modal.classList.contains('open')){
      return;
    }

    const options=Array.isArray(
      window.__cbTuningOptions
    )
      ?window.__cbTuningOptions
      :[];

    const buttons=Array.from(
      modal.querySelectorAll(
        '#cbBuilderContent '+
        '[data-cb-picker] .tuningOption'
      )
    );

    buttons.forEach((button,index)=>{
      enrichButton(
        button,
        options[index],
        index
      );
    });
  }

  function schedule(){
    if(queued)return;

    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      enrich();
    });
  }

  new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length||
        mutation.removedNodes?.length
      )
    ){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  document.addEventListener(
    'click',
    event=>{
      if(
        event.target?.closest?.(
          '#cbBuilderModal,'+
          '[onclick*="openCommunityBuildCreator"]'
        )
      ){
        schedule();
        setTimeout(schedule,80);
      }
    },
    true
  );

  window.addEventListener(
    'mhur:languagechange',
    ()=>{
      document.querySelectorAll(
        '#cbBuilderModal '+
        '.mhurV623CommunityDetails'
      ).forEach(element=>element.remove());

      schedule();
    }
  );

  window.addEventListener('resize',schedule);
  window.addEventListener(
    'orientationchange',
    schedule
  );

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      schedule,
      {once:true}
    );
  }else{
    schedule();
  }

  window.addEventListener(
    'load',
    schedule,
    {once:true}
  );

  window.MHUR_V623_COMMUNITY_DETAILS={
    refresh:schedule,
    enrich
  };
})();
