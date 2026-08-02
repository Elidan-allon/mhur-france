
/* MHUR Nexus — V601
   - Mirio Sheer Counter identique sur PC et mobile
   - Gentle Criminal γ entièrement bilingue
*/
(function(){
  'use strict';

  const VERSION='601';

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

    const html=String(document.documentElement.lang||'').toLowerCase();

    if(html.startsWith('en'))return 'en';
    if(html.startsWith('fr'))return 'fr';

    try{
      const stored=localStorage.getItem('mhur_lang');
      if(stored==='fr'||stored==='en')return stored;
    }catch(_error){}

    return 'fr';
  }

  function localized(value){
    if(value&&typeof value==='object'&&!Array.isArray(value)){
      const current=language();
      return value[current]??value.fr??value.en??'';
    }

    return value;
  }

  function stylesMap(){
    try{
      if(typeof styles!=='undefined'&&styles){
        return styles;
      }
    }catch(_error){}

    return window.styles||{};
  }

  function charactersList(){
    try{
      if(typeof characters!=='undefined'&&Array.isArray(characters)){
        return characters;
      }
    }catch(_error){}

    return Array.isArray(window.characters)?window.characters:[];
  }

  function localPath(value){
    const path=clean(value)
      .replace(/^\.?\//,'')
      .replace(/^public\//,'');

    return path.startsWith('assets/')?path:'';
  }

  function setImage(box,path,alt){
    if(!box||!path)return;

    let image=box.querySelector('img');

    if(!image){
      image=document.createElement('img');
      image.loading='lazy';
      image.decoding='async';
      box.replaceChildren(image);
    }

    image.hidden=false;
    image.removeAttribute('srcset');
    image.alt=alt||'';
    image.onerror=null;

    const versioned=path.includes('?')
      ?path
      :path+'?v=601';

    if(image.getAttribute('src')!==versioned){
      image.setAttribute('src',versioned);
    }
  }

  function mirioStyle(){
    return stylesMap().mirio_technical||null;
  }

  function mirioCharacter(){
    return charactersList().find(character=>
      normal(character?.id)==='mirio'||
      normal(character?.name)==='mirio_togata'
    )||null;
  }

  function technicalRoleText(){
    return language()==='en'?'Technical':'Technique';
  }

  function forceMirioPatchCard(card){
    const heading=card.querySelector(':scope > header h4');
    const name=normal(heading?.textContent);

    if(!name.includes('mirio_togata'))return;

    const style=mirioStyle();
    if(!style)return;

    const character=mirioCharacter();
    const alpha=(style.skills||[]).find(skill=>
      /^(?:α|a|alpha)(?:\s|[-—:(]|$)/i.test(
        clean(skill?.letter)
      )
    )||style.skills?.[0];

    card.dataset.patchStyleId='mirio_technical';
    card.dataset.v595StyleId='mirio_technical';

    const styleName=card.querySelector(':scope > header strong');

    if(styleName){
      styleName.textContent=localized(style.name)||'Sheer Counter';
    }

    const roleBadge=card.querySelector(
      ':scope > header .s18PatchBadgesV10 '+
      '.badge:not(.hero):not(.villain)'
    );

    if(roleBadge){
      roleBadge.classList.remove(
        'rapid',
        'speed',
        'strike',
        'attack',
        'assault',
        'support'
      );
      roleBadge.classList.add('technical');
      roleBadge.textContent=technicalRoleText();
    }

    setImage(
      card.querySelector(
        ':scope > header .s18PatchPortraitV10'
      ),
      localPath(style.portrait),
      heading?.textContent||'Mirio Togata'
    );

    card.querySelectorAll('.s18PatchChangeV10')
      .forEach(change=>{
        const title=change.querySelector('h5');
        const titleKey=normal(title?.textContent);
        const isAlpha=(
          titleKey.includes('phantom_smash')||
          titleKey.includes('rupture_ophtalmique')||
          change.dataset.patchSkillKey==='alpha'
        );

        if(!isAlpha)return;

        const image=localPath(alpha?.img);

        change.dataset.patchStyleId='mirio_technical';
        change.dataset.patchSkillKey='alpha';
        change.dataset.patchSkillImage=image;

        if(title){
          /*
            Le nom officiel reste Phantom Smash dans les deux langues.
          */
          title.textContent=localized(alpha?.name)||'Phantom Smash';
        }

        const layout=change.querySelector('.s18PatchSkillV10');
        const main=layout?.querySelector(':scope > main');

        if(!layout||!main)return;

        let box=[...layout.children].find(
          child=>child!==main&&child.tagName==='DIV'
        );

        if(!box){
          box=document.createElement('div');
          box.className='s18PatchSkillImageV595';
          layout.insertBefore(box,main);
        }

        layout.classList.remove('s18NoSkillImageV595');

        setImage(
          box,
          image,
          title?.textContent||'Phantom Smash'
        );
      });
  }

  function bilingualRows(sourceRows){
    const rows=Array.isArray(sourceRows)?sourceRows:[];
    const resultFr=[];
    const resultEn=[];

    rows.forEach((row,index)=>{
      const values=Array.isArray(row)?[...row]:[];
      const block=Math.floor(index/9);

      const frType=block===0
        ?'Ruée'
        :block===1
          ?'Rebond'
          :'Impact final';

      const enType=block===0
        ?'Rush'
        :block===1
          ?'Rebound'
          :'Final Impact';

      values[0]=frType;
      resultFr.push([...values]);

      values[0]=enType;
      resultEn.push([...values]);
    });

    return {
      fr:resultFr,
      en:resultEn
    };
  }

  function patchGentleGammaData(){
    const style=stylesMap().gentle_criminal_technical;
    if(!style)return;

    const gamma=(style.skills||[]).find(skill=>
      /^(?:γ|y|g|gamma)(?:\s|[-—:(]|$)/i.test(
        clean(skill?.letter)
      )
    );

    if(!gamma)return;

    const tables=Array.isArray(gamma.tables)
      ?gamma.tables
      :[];

    let additional=tables.find(table=>{
      const title=normal(localized(table?.title));

      return (
        title.includes('additional_gamma')||
        title.includes('valeurs_supplementaires_gamma')||
        title.includes('degats_gamma_supplementaires')
      );
    });

    if(!additional&&tables.length>1){
      additional=tables[tables.length-1];
    }

    if(!additional)return;

    additional.title={
      fr:'Dégâts γ supplémentaires',
      en:'Additional γ damage'
    };

    additional.cols={
      fr:['Type','Niveau','Dégâts'],
      en:['Type','Level','Damage']
    };

    const existing=additional.rows;
    const baseRows=Array.isArray(existing)
      ?existing
      :(
        existing?.en?.length
          ?existing.en
          :existing?.fr||[]
      );

    if(baseRows.length>=27){
      additional.rows=bilingualRows(baseRows.slice(0,27));
    }
  }

  const GENTLE_TEXT={
    fr:new Map([
      ['Rush','Ruée'],
      ['Rebound','Rebond'],
      ['Final Impact','Impact final'],
      ['Additional γ damage','Dégâts γ supplémentaires'],
      ['Additional γ values','Dégâts γ supplémentaires'],
      ['Level','Niveau'],
      ['Damage','Dégâts']
    ]),
    en:new Map([
      ['Ruée','Rush'],
      ['Rush','Rush'],
      ['Rebond','Rebound'],
      ['Rebound','Rebound'],
      ['Impact final','Final Impact'],
      ['Final Impact','Final Impact'],
      ['Dégâts γ supplémentaires','Additional γ damage'],
      ['Valeurs supplémentaires γ','Additional γ damage'],
      ['Additional γ values','Additional γ damage'],
      ['Niveau','Level'],
      ['Dégâts','Damage']
    ])
  };

  function gentlePanel(){
    return [...document.querySelectorAll('.charPanel')]
      .find(panel=>
        normal(panel.querySelector('h2')?.textContent)
          .includes('gentle_criminal')
      )||null;
  }

  function fixGentleGammaDom(){
    const panel=gentlePanel();
    if(!panel)return;

    const current=language();
    const replacements=GENTLE_TEXT[current];

    panel.querySelectorAll(
      '.toggle,th,td,.miniTableTitle'
    ).forEach(element=>{
      const value=clean(element.textContent);
      const replacement=replacements.get(value);

      if(replacement){
        element.textContent=replacement;
      }
    });
  }

  function patchData(){
    patchGentleGammaData();
  }

  function fixDom(){
    document.querySelectorAll('.s18PatchCharacterV10')
      .forEach(forceMirioPatchCard);

    fixGentleGammaDom();
  }

  function refresh(){
    patchData();
    fixDom();
  }

  function wrapRender(){
    if(typeof window.render!=='function')return;
    if(window.render.__mhurV601)return;

    const original=window.render;

    const wrapped=function(){
      patchData();
      const result=original.apply(this,arguments);

      requestAnimationFrame(fixDom);
      setTimeout(fixDom,40);
      setTimeout(fixDom,160);

      return result;
    };

    wrapped.__mhurV601=true;
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
        '[data-s18-notes-button],'+
        '.costumeTile,'+
        '.toggle'
      )
    ){
      setTimeout(refresh,0);
      setTimeout(refresh,80);
      setTimeout(refresh,220);
    }
  },true);

  window.addEventListener('mhur:languagechange',()=>{
    patchData();
    setTimeout(refresh,0);
    setTimeout(refresh,100);
    setTimeout(refresh,260);
  });

  wrapRender();

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      ()=>{
        wrapRender();
        refresh();
      },
      {once:true}
    );
  }else{
    refresh();
  }

  window.addEventListener('load',refresh,{once:true});

  window.MHUR_V601={
    version:VERSION,
    refresh,
    patchGentleGammaData,
    forceMirioPatchCard
  };
})();
