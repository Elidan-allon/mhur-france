/* MHUR V658 — correctif visuel final du patch 1785298405.
   Chargé après season18-fixes.js et season18-v12.js. */
(function(){
  'use strict';

  if(window.MHUR_PATCH_1785298405_V658)return;
  window.MHUR_PATCH_1785298405_V658=true;

  const PATCH_VERSION=/1\.17\.0-14\.5/i;

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

  function clean(value){
    return String(value??'').replace(/\s+/g,' ').trim();
  }

  function normal(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase();
  }

  function numbers(card,selector){
    return [...card.querySelectorAll(selector)]
      .map(cell=>Number(
        clean(cell.textContent).replace(',','.')
      ))
      .filter(Number.isFinite);
  }

  function same(values,expected){
    return (
      values.length===expected.length&&
      values.every(
        (value,index)=>
          Math.abs(value-expected[index])<0.001
      )
    );
  }

  function metric(card){
    const value=normal(
      card.querySelector('.s18PatchLabelV10')
        ?.textContent
    );

    if(/brise|guard/.test(value)){
      return {
        fr:'Brise-garde',
        en:'Guard Break'
      };
    }

    return {
      fr:'Dégâts',
      en:'Damage'
    };
  }

  function setCard(card,frTitle,enTitle){
    const title=card.querySelector('h5');
    const label=card.querySelector(
      '.s18PatchLabelV10'
    );

    if(title){
      const wanted=language()==='en'
        ?enTitle
        :frTitle;
      if(clean(title.textContent)!==wanted){
        title.textContent=wanted;
      }
    }

    if(label){
      const names=metric(card);
      const wanted=names[language()];
      if(clean(label.textContent)!==wanted){
        label.textContent=wanted;
      }
    }
  }

  function fixBakugo(article){
    const oldAlpha=[
      30,31,32,34,35,36,37,38,40
    ];
    const newAlpha=[
      40,41,42,44,45,46,47,48,50
    ];
    const newBeta=[
      35,36,37,39,40,41,42,43,45
    ];
    const oldFollow=[
      40,41,42,44,45,46,47,48,50
    ];
    const newFollow=[
      44,46,48,50,52,54,56,58,60
    ];

    article.querySelectorAll(
      '.s18PatchChangeV10'
    ).forEach(card=>{
      const before=numbers(card,'tr.before td');
      const after=numbers(card,'tr.after td');

      if(same(before,oldAlpha)&&same(after,newAlpha)){
        setCard(
          card,
          'α - AP Shot Cluster (Normal)',
          'α - AP Shot Cluster (Normal)'
        );
        return;
      }

      if(same(before,oldAlpha)&&same(after,newBeta)){
        setCard(
          card,
          'β - Nitro Cluster (Explosion)',
          'β - Nitro Cluster (Explosion)'
        );
        return;
      }

      if(same(before,oldFollow)&&same(after,newFollow)){
        setCard(
          card,
          'β - Nitro Cluster (Explosion renforcée)',
          'β - Nitro Cluster (ExplosionFollow-up)'
        );
      }
    });
  }

  function fixArmoredAllMight(article){
    const expectedBefore=[
      52,54,56,58,60,62,64,66,68
    ];
    const expectedAfter=[
      48,50,52,54,55,56,57,58,60
    ];

    article.querySelectorAll(
      '.s18PatchChangeV10'
    ).forEach(card=>{
      const before=numbers(card,'tr.before td');
      const after=numbers(card,'tr.after td');

      if(
        same(before,expectedBefore)&&
        same(after,expectedAfter)
      ){
        setCard(
          card,
          'α - Ice Bullet Shot (Brûlure)',
          'α - Ice Bullet Shot (Burn)'
        );
      }
    });
  }

  function inferSymbol(card){
    const image=clean(
      card.querySelector(
        '.s18PatchImageV608 img,'
        +'.s18PatchSkillV10 img'
      )?.getAttribute('src')
    ).toLowerCase();

    if(/unique1|alpha/.test(image))return 'α';
    if(/unique2|beta/.test(image))return 'β';
    if(/unique3|gamma/.test(image))return 'γ';
    return '';
  }

  function addMissingSign(card){
    const title=card.querySelector('h5');
    if(!title)return;

    const current=clean(title.textContent);
    if(
      !current||
      /^[αβγ]\s*[-–—:]/.test(current)||
      /^(?:hp|pv)$/i.test(current)||
      /special action|action spéciale/i.test(current)
    ){
      return;
    }

    const symbol=inferSymbol(card);
    if(symbol){
      title.textContent=`${symbol} - ${current}`;
    }
  }

  function isTargetPatch(modal){
    const title=clean(
      modal.querySelector(
        '.s18PatchDetailHeadV10 h2'
      )?.textContent
    );
    return PATCH_VERSION.test(title);
  }

  let applying=false;

  function apply(){
    if(applying)return;

    const modal=document.getElementById(
      's18NotesDevModalV10'
    );
    if(!modal||!isTargetPatch(modal))return;

    applying=true;
    try{
      modal.querySelectorAll(
        'article.s18PatchCharacterV10'
      ).forEach(article=>{
        const character=normal(
          article.querySelector('header h4')
            ?.textContent
        );
        const style=normal(
          article.querySelector('header strong')
            ?.textContent
        );

        if(
          character.includes('katsuki bakugo')&&
          style.includes('cluster')
        ){
          fixBakugo(article);
        }

        if(character.includes('armored all might')){
          fixArmoredAllMight(article);
        }

        article.querySelectorAll(
          '.s18PatchChangeV10'
        ).forEach(addMissingSign);
      });
    }finally{
      applying=false;
    }
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      apply();
    });
  }

  document.addEventListener(
    'click',
    ()=>{
      setTimeout(schedule,0);
      setTimeout(schedule,80);
      setTimeout(schedule,300);
    },
    true
  );

  new MutationObserver(mutations=>{
    if(
      mutations.some(
        mutation=>
          mutation.addedNodes?.length||
          mutation.type==='characterData'
      )
    ){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    characterData:true
  });

  window.addEventListener(
    'mhur:languagechange',
    schedule
  );
  window.addEventListener(
    'load',
    schedule,
    {once:true}
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

  window.MHUR_PATCH_1785298405_REFRESH_V658=
    schedule;
})();
