
/* MHUR Nexus — V598B : images locales exactes des Patch Notes */
(function(){
  'use strict';

  const VERSION='598B';

  const STYLE_RULES=[
    {
      test:(name)=>name.includes('izuku_midoriya_ofa'),
      styleId:'ofa'
    },
    {
      test:(name,style)=>(
        name.includes('katsuki_bakugo')&&
        (
          name.includes('cluster')||
          style.includes('cluster')
        )
      ),
      styleId:'bakugo_technical'
    },
    {
      test:(name)=>name.includes('katsuki_bakugo'),
      styleId:'bakugo_attack'
    },
    {
      test:(name)=>name.includes('denki_kaminari'),
      styleId:'kaminari_strike'
    },
    {
      test:(name,style)=>(
        name.includes('mirio_togata')&&
        (
          name.includes('sheer_counter')||
          style.includes('sheer_counter')
        )
      ),
      styleId:'mirio_technical'
    },
    {
      test:(name)=>name.includes('armored_all_might'),
      styleId:'armored_all_might_technical'
    },
    {
      test:(name)=>name==='hawks'||name.startsWith('hawks_'),
      styleId:'hawks_rapid'
    },
    {
      test:(name)=>name.includes('lady_nagant'),
      styleId:'lady_nagant_strike'
    },
    {
      test:(name)=>name.includes('itsuka_kendo'),
      styleId:'kendo_assault'
    },
    {
      test:(name)=>name==='twice'||name.startsWith('twice_'),
      styleId:'twice_rapid'
    }
  ];

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
      if(typeof lang!=='undefined'&&lang==='en'){
        return 'en';
      }
    }catch(_error){}

    return String(document.documentElement.lang||'')
      .toLowerCase()
      .startsWith('en')
      ?'en'
      :'fr';
  }

  function localized(value){
    if(value&&typeof value==='object'&&!Array.isArray(value)){
      return (
        value[language()]??
        value.fr??
        value.en??
        ''
      );
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

  function localPath(value){
    const path=clean(value)
      .replace(/^\.?\//,'')
      .replace(/^public\//,'');

    return path.startsWith('assets/')?path:'';
  }

  function styleIdForCard(card){
    const name=normal(
      card.querySelector(':scope > header h4')?.textContent
    );

    const style=normal(
      card.querySelector(':scope > header strong')?.textContent
    );

    const rule=STYLE_RULES.find(
      item=>item.test(name,style)
    );

    return rule?.styleId||'';
  }

  function keyFromText(styleId,text){
    const value=normal(text);

    if(styleId==='armored_all_might_technical'){
      return 'alpha';
    }

    if(styleId==='ofa'){
      if(value.includes('delaware'))return 'alpha';
    }

    if(styleId==='bakugo_attack'){
      if(value.includes('howitzer'))return 'gamma';
    }

    if(styleId==='bakugo_technical'){
      if(value.includes('ap_shot'))return 'alpha';
      if(value.includes('nitro_cluster'))return 'beta';
      if(value.includes('howitzer'))return 'gamma';
    }

    if(styleId==='kaminari_strike'){
      if(
        value.includes('electro')||
        value.includes('target')
      )return 'alpha';

      if(value.includes('electrification')){
        return 'special';
      }
    }

    if(styleId==='mirio_technical'){
      if(value.includes('phantom_smash'))return 'alpha';
    }

    if(styleId==='hawks_rapid'){
      if(value.includes('wingbeat'))return 'alpha';
      if(value.includes('wind_cross'))return 'beta';
    }

    if(styleId==='lady_nagant_strike'){
      if(value.includes('hollow_point'))return 'alpha';
      if(value.includes('high_angle'))return 'beta';
      if(value.includes('kickback'))return 'gamma';
      if(value.includes('scope_mode'))return 'special';
    }

    if(styleId==='kendo_assault'){
      if(value.includes('big_fist_grip'))return 'gamma';
    }

    if(styleId==='twice_rapid'){
      if(value.includes('foot_boost'))return 'gamma';
    }

    if(
      /^(?:alpha|a)(?:_|$)/.test(value)||
      value.includes('_alpha_')
    )return 'alpha';

    if(
      /^(?:beta|b)(?:_|$)/.test(value)||
      value.includes('_beta_')
    )return 'beta';

    if(
      /^(?:gamma|g|y)(?:_|$)/.test(value)||
      value.includes('_gamma_')
    )return 'gamma';

    if(
      value.includes('special_action')||
      value.startsWith('sp_')
    )return 'special';

    return '';
  }

  function letterKey(value){
    const raw=clean(value);

    if(/^(?:α|a|alpha)(?:\s|[-—:(]|$)/i.test(raw)){
      return 'alpha';
    }

    if(/^(?:β|b|beta)(?:\s|[-—:(]|$)/i.test(raw)){
      return 'beta';
    }

    if(/^(?:γ|y|g|gamma)(?:\s|[-—:(]|$)/i.test(raw)){
      return 'gamma';
    }

    if(/^(?:sp|special)(?:\s|[-—:(]|$)/i.test(raw)){
      return 'special';
    }

    return '';
  }

  function skillForKey(style,key){
    if(!style||!key)return null;

    if(key==='special'){
      return style.special||null;
    }

    return (style.skills||[]).find(
      skill=>letterKey(skill?.letter)===key
    )||null;
  }

  function exactImage(styleId,style,key){
    if(
      styleId==='armored_all_might_technical'&&
      key==='alpha'
    ){
      return (
        'assets/armored_all_might/'+
        'armored_all_might_technical/alpha.webp'
      );
    }

    const skill=skillForKey(style,key);

    return localPath(skill?.img);
  }

  function exactPortrait(styleId,style){
    if(styleId==='armored_all_might_technical'){
      return (
        'assets/armored_all_might/'+
        'armored_all_might_technical/portrait.webp'
      );
    }

    return localPath(style?.portrait);
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
    image.onerror=null;
    image.alt=alt||'';

    if(image.getAttribute('src')!==path){
      image.setAttribute('src',path);
    }
  }

  function ensureSkillBox(layout){
    if(!layout)return null;

    const main=layout.querySelector(':scope > main');

    if(!main)return null;

    let box=[...layout.children].find(
      child=>child!==main&&child.tagName==='DIV'
    );

    if(!box){
      box=document.createElement('div');
      box.className='s18PatchSkillImageV598B';
      layout.insertBefore(box,main);
    }

    return box;
  }

  function fixChange(change,styleId,style){
    const heading=change.querySelector('h5');
    const label=change.querySelector(
      '.s18PatchLabelV10,.s18PatchVariantV593'
    );

    const combined=[
      heading?.textContent,
      label?.textContent
    ].filter(Boolean).join(' ');

    const key=keyFromText(styleId,combined);
    const path=exactImage(styleId,style,key);

    if(!key||!path)return;

    change.dataset.patchStyleId=styleId;
    change.dataset.patchSkillKey=key;
    change.dataset.patchSkillImage=path;

    if(
      styleId==='armored_all_might_technical'&&
      key==='alpha'&&
      heading
    ){
      heading.textContent=language()==='en'
        ?'Ice Bullet Shot'
        :'Tir de balle de glace';
    }

    const layout=change.querySelector('.s18PatchSkillV10');
    const box=ensureSkillBox(layout);

    if(layout){
      layout.classList.remove('s18NoSkillImageV595');
    }

    setImage(
      box,
      path,
      clean(heading?.textContent)
    );
  }

  function fixCard(card){
    const styleId=styleIdForCard(card);
    const style=stylesMap()[styleId];

    if(!styleId||!style)return;

    card.dataset.patchStyleId=styleId;

    const characterName=clean(
      card.querySelector(':scope > header h4')?.textContent
    );

    setImage(
      card.querySelector(
        ':scope > header .s18PatchPortraitV10'
      ),
      exactPortrait(styleId,style),
      characterName
    );

    card.querySelectorAll('.s18PatchChangeV10')
      .forEach(
        change=>fixChange(change,styleId,style)
      );
  }

  function refresh(){
    document.querySelectorAll('.s18PatchCharacterV10')
      .forEach(fixCard);
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
        '[data-s18-notes-button]'
      )
    ){
      setTimeout(refresh,0);
      setTimeout(refresh,60);
      setTimeout(refresh,180);
    }
  },true);

  window.addEventListener('mhur:languagechange',()=>{
    setTimeout(refresh,0);
    setTimeout(refresh,100);
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      refresh,
      {once:true}
    );
  }else{
    refresh();
  }

  window.addEventListener('load',refresh,{once:true});

  window.MHUR_V598B={
    version:VERSION,
    refresh
  };
})();
