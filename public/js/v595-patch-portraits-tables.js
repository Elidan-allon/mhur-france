/* MHUR Nexus — V595 : portraits des personnages et tableaux Patch Notes */
(function(){
  'use strict';

  const VERSION='595';

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

  function localPath(value){
    const path=clean(value)
      .replace(/^\.?\//,'')
      .replace(/^public\//,'');

    return path.startsWith('assets/')?path:'';
  }

  function localManifest(){
    return window.MHUR_PATCH_LOCAL_ASSETS_V595?.styles||{};
  }

  function charactersList(){
    try{
      if(typeof characters!=='undefined'&&Array.isArray(characters)){
        return characters;
      }
    }catch(_error){}

    return Array.isArray(window.characters)?window.characters:[];
  }

  function stylesMap(){
    try{
      if(typeof styles!=='undefined'&&styles)return styles;
    }catch(_error){}

    return window.styles||{};
  }

  function characterStyleIds(character){
    const map=stylesMap();

    return (character?.styles||[])
      .map(String)
      .filter(id=>map[id]);
  }

  function removeQuotedStyle(value){
    return clean(value)
      .replace(/\s*["“”'‘’][^"“”'‘’]+["“”'‘’]\s*$/u,'')
      .replace(/\s*\([^)]*\)\s*$/u,'')
      .trim();
  }

  function characterScore(character,label){
    const raw=normal(label);
    const base=normal(removeQuotedStyle(label));
    const id=normal(character?.id);
    const name=normal(character?.name);

    if(!raw&&!base)return -1;
    if(raw===id||raw===name)return 1000;
    if(base===id||base===name)return 950;
    if(raw.startsWith(name+'_')||raw.startsWith(id+'_'))return 900;
    if(base.startsWith(name)||name.startsWith(base))return 850;
    if(raw.includes(name)||name.includes(raw))return 800;
    if(base.includes(name)||name.includes(base))return 780;

    const wantedTokens=new Set(base.split('_').filter(Boolean));
    const characterTokens=name.split('_').filter(Boolean);
    const matching=characterTokens.filter(token=>wantedTokens.has(token)).length;

    return matching?matching*100:0;
  }

  function resolveCharacter(label){
    return charactersList()
      .map(character=>({
        character,
        score:characterScore(character,label)
      }))
      .sort((a,b)=>b.score-a.score)
      .find(row=>row.score>0)
      ?.character||null;
  }

  function localized(value){
    if(value&&typeof value==='object'&&!Array.isArray(value)){
      let language='fr';

      try{
        language=typeof lang!=='undefined'&&lang==='en'?'en':'fr';
      }catch(_error){}

      return value[language]??value.fr??value.en??'';
    }

    return value;
  }

  function extractQuotedStyle(value){
    const match=clean(value).match(
      /["“”'‘’]([^"“”'‘’]+)["“”'‘’]\s*$/u
    );

    return match?.[1]||'';
  }

  function skillKey(value){
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

    if(
      /^(?:sp|special|action_speciale|special_action)(?:\s|[-—:(]|$)/i.test(raw)||
      key.startsWith('sp_')||
      key.startsWith('special_action')
    )return 'special';

    return '';
  }

  function skillsOf(style){
    return [
      {...(style?.special||{}),letter:'SP'},
      ...(style?.skills||[])
    ];
  }

  function styleSkillMatch(style,skillLabel){
    const wanted=normal(skillLabel);
    if(!wanted)return 0;

    let best=0;

    skillsOf(style).forEach(skill=>{
      const name=normal(localized(skill?.name));
      const letter=skillKey(skill?.letter);
      const requestedLetter=skillKey(skillLabel);

      if(name&&wanted===name)best=Math.max(best,1000);
      else if(name&&(wanted.includes(name)||name.includes(wanted))){
        best=Math.max(best,900);
      }

      if(letter&&requestedLetter===letter){
        best=Math.max(best,700);
      }
    });

    return best;
  }

  function resolveStyle(character,styleLabel,skillLabel,characterLabel){
    const map=stylesMap();
    const ids=characterStyleIds(character);
    const requested=normal(
      styleLabel||
      extractQuotedStyle(characterLabel)||
      'Original'
    );

    const rows=ids.map((id,index)=>{
      const style=map[id];
      const name=normal(localized(style?.name)||'Original');
      let score=0;

      if(name===requested)score+=1000;
      else if(
        requested&&name&&
        (name.includes(requested)||requested.includes(name))
      )score+=850;

      score+=styleSkillMatch(style,skillLabel);
      score-=index;

      return {id,style,score};
    });

    return rows.sort((a,b)=>b.score-a.score)[0]||{
      id:'',
      style:null,
      score:0
    };
  }

  function manifestForStyle(styleId){
    const map=localManifest();

    if(map[styleId])return map[styleId];

    const wanted=normal(styleId);

    return Object.entries(map).find(
      ([id])=>normal(id)===wanted
    )?.[1]||{};
  }

  function databaseForStyle(styleId){
    return window.MHUR_DATABASE_ASSETS?.styles?.[styleId]||{};
  }

  function firstLocal(){
    for(const value of arguments){
      const path=localPath(value);
      if(path)return path;
    }

    return '';
  }

  function portraitFor(styleId,style,character){
    const local=manifestForStyle(styleId);
    const database=databaseForStyle(styleId);

    return firstLocal(
      local.portrait,
      database.portrait,
      style?.portrait,
      character?.portrait
    );
  }

  function resolvedSkill(style,skillLabel){
    const wanted=normal(skillLabel);
    const requestedKey=skillKey(skillLabel);
    let best=null;
    let bestScore=-1;

    skillsOf(style).forEach(skill=>{
      const name=normal(localized(skill?.name));
      const key=skillKey(skill?.letter);
      let score=0;

      if(name&&wanted===name)score=1000;
      else if(name&&(wanted.includes(name)||name.includes(wanted)))score=900;

      if(requestedKey&&key===requestedKey)score=Math.max(score,750);

      if(score>bestScore){
        bestScore=score;
        best=skill;
      }
    });

    return best;
  }

  function imageForSkill(styleId,style,skillLabel){
    const local=manifestForStyle(styleId);
    const database=databaseForStyle(styleId);
    const skill=resolvedSkill(style,skillLabel);
    const key=(
      skillKey(skill?.letter)||
      skillKey(skillLabel)
    );

    return firstLocal(
      local[key],
      database[key],
      skill?.img
    );
  }

  function safeImage(path,alt,className){
    const image=document.createElement('img');
    image.src=path;
    image.alt=alt||'';
    image.className=className;
    image.loading='lazy';
    image.decoding='async';
    image.onerror=function(){
      this.hidden=true;
      this.closest('.s18PatchSkillV10')
        ?.classList.add('s18NoSkillImageV595');
    };
    return image;
  }

  function fixPortrait(card,styleId,style,character,name){
    const box=card.querySelector(
      ':scope > header .s18PatchPortraitV10'
    );

    if(!box)return;

    const path=portraitFor(styleId,style,character);

    if(!path)return;

    let image=box.querySelector('img');

    if(!image){
      box.replaceChildren(
        safeImage(path,name,'s18PatchPortraitImageV595')
      );
      return;
    }

    image.hidden=false;
    image.classList.add('s18PatchPortraitImageV595');
    image.removeAttribute('srcset');
    image.onerror=function(){
      this.hidden=true;
    };

    if(image.getAttribute('src')!==path){
      image.setAttribute('src',path);
    }
  }

  function ensureSkillSlot(layout,path,title){
    const main=layout.querySelector(':scope > main');
    if(!main)return;

    let slot=[
      ...layout.children
    ].find(child=>child!==main&&child.tagName==='DIV');

    if(path){
      layout.classList.remove('s18NoSkillImageV595');

      if(!slot){
        slot=document.createElement('div');
        slot.className='s18PatchSkillImageV595';
        layout.insertBefore(slot,main);
      }

      slot.classList.add('s18PatchSkillImageV595');

      let image=slot.querySelector('img');

      if(!image){
        image=safeImage(
          path,
          title,
          's18PatchSkillImageElementV595'
        );
        slot.replaceChildren(image);
      }else{
        image.hidden=false;
        image.classList.add('s18PatchSkillImageElementV595');
        image.removeAttribute('srcset');

        if(image.getAttribute('src')!==path){
          image.setAttribute('src',path);
        }
      }
    }else{
      layout.classList.add('s18NoSkillImageV595');
    }
  }

  function fixChange(change,styleId,style){
    const title=clean(
      change.querySelector('h5')?.textContent||''
    );

    const path=imageForSkill(styleId,style,title);
    const layout=change.querySelector('.s18PatchSkillV10');

    if(layout){
      ensureSkillSlot(layout,path,title);
    }

    change.querySelectorAll(
      '.s18PatchTableWrapV10,.s18PatchTableV10,.s18MetricV593'
    ).forEach(element=>{
      element.classList.add('s18PatchWideV595');
    });
  }

  function fixPatchCharacter(card){
    const header=card.querySelector(':scope > header');
    if(!header)return;

    const name=clean(header.querySelector('h4')?.textContent||'');
    const styleLabel=clean(header.querySelector('strong')?.textContent||'');
    const firstSkill=clean(
      card.querySelector('.s18PatchChangeV10 h5')?.textContent||''
    );

    const character=resolveCharacter(name);
    if(!character)return;

    const resolved=resolveStyle(
      character,
      styleLabel,
      firstSkill,
      name
    );

    if(!resolved.style)return;

    card.dataset.v595StyleId=resolved.id;
    fixPortrait(
      card,
      resolved.id,
      resolved.style,
      character,
      name
    );

    card.querySelectorAll('.s18PatchChangeV10').forEach(change=>{
      fixChange(change,resolved.id,resolved.style);
    });
  }

  function fixAll(){
    document.querySelectorAll('.s18PatchCharacterV10')
      .forEach(fixPatchCharacter);
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      fixAll();
    });
  }

  new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length||
        mutation.type==='attributes'
      )
    ){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','src','hidden']
  });

  document.addEventListener('click',event=>{
    if(
      event.target?.closest?.(
        '[data-patch-index],'+
        '[data-tab="patch"],'+
        '#mhurPatchDevButtonV14,'+
        '[data-s18-notes-button]'
      )
    ){
      setTimeout(fixAll,0);
      setTimeout(fixAll,60);
      setTimeout(fixAll,180);
    }
  },true);

  window.addEventListener('mhur:languagechange',()=>{
    setTimeout(fixAll,0);
    setTimeout(fixAll,100);
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      fixAll,
      {once:true}
    );
  }else{
    fixAll();
  }

  window.addEventListener('load',fixAll,{once:true});

  window.MHUR_V595={
    version:VERSION,
    refresh:fixAll,
    resolveCharacter,
    resolveStyle
  };
})();
