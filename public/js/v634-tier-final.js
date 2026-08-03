/* MHUR Nexus — V634
   Tier List finale mobile + ordinateur. */
(function(){
  'use strict';

  if(window.MHUR_V634_TIER_FINAL_LOADED)return;
  window.MHUR_V634_TIER_FINAL_LOADED=true;

  let queued=false;

  function english(){
    try{
      if(typeof lang!=='undefined'&&lang==='en')return true;
    }catch(_error){}

    return String(
      document.documentElement.lang||'fr'
    ).toLowerCase().startsWith('en');
  }

  function normalize(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/\s+/g,' ')
      .trim();
  }

  function gentleCard(card){
    if(!card)return false;

    if(
      card.dataset.v544Gentle==='1'||
      card.dataset.v546Gentle==='1'||
      card.dataset.v628Gentle==='1'||
      card.dataset.v634Gentle==='1'
    ){
      return true;
    }

    const image=card.querySelector(':scope > img');
    const text=normalize(card.textContent);
    const alt=normalize(image?.alt);
    const src=normalize(
      image?.currentSrc||
      image?.getAttribute('src')||
      image?.src
    );

    return (
      text.includes('gentle criminal')||
      alt.includes('gentle criminal')||
      src.includes('gentle_criminal')||
      src.includes('/gentle')
    );
  }

  function looksLikeNewBadge(element){
    if(!(element instanceof Element))return false;
    if(element.classList.contains('mhurTierNewV634'))return false;

    const className=String(element.className||'').toLowerCase();
    const aria=normalize(element.getAttribute('aria-label'));
    const src=normalize(
      element.getAttribute('src')||
      element.getAttribute('href')
    );
    const text=String(element.textContent||'')
      .replace(/\s+/g,'')
      .trim();

    return (
      aria==='new'||
      /^(new!?)+$/i.test(text)||
      src.includes('new_badge')||
      src.includes('new-badge')||
      className.includes('mhurnew')||
      className.includes('tiernew')||
      className.includes('newbadge')
    );
  }

  function removeOldBadges(card){
    Array.from(card.querySelectorAll('*'))
      .filter(looksLikeNewBadge)
      .forEach(element=>{
        const parent=element.parentElement;
        element.remove();

        if(
          parent&&
          parent!==card&&
          parent.childElementCount===0&&
          !String(parent.textContent||'').trim()
        ){
          parent.remove();
        }
      });

    const own=Array.from(
      card.querySelectorAll(
        ':scope > .mhurTierNewV634'
      )
    );

    own.slice(1).forEach(node=>node.remove());
  }

  function ensureOneBadge(card){
    card.classList.remove(
      'mhurTierGentleV626',
      'mhurTierGentleV628'
    );

    card.classList.add('mhurTierGentleV634');
    card.dataset.v634Gentle='1';

    removeOldBadges(card);

    if(!card.querySelector(':scope > .mhurTierNewV634')){
      const badge=document.createElement('span');

      badge.className='mhurTierNewV634';
      badge.setAttribute('aria-label','NEW');
      badge.setAttribute('aria-hidden','true');
      badge.textContent='NEW';

      card.appendChild(badge);
    }
  }

  function repairTexts(tier){
    const isEnglish=english();

    tier.querySelectorAll('.mhurTierDropHint')
      .forEach(hint=>{
        hint.textContent=isEnglish
          ?'Drop here'
          :'Dépose ici';
      });

    tier.querySelectorAll('.mhurTierLabel.U')
      .forEach(label=>{
        label.textContent=isEnglish
          ?'Unranked'
          :'Non classés';
      });

    tier.querySelectorAll('.mhurTierDragHelp')
      .forEach(help=>{
        help.textContent=isEnglish
          ?'Changes are saved only in your browser. Publish your Tier List when you want to share it.'
          :'Les déplacements sont enregistrés uniquement dans ton navigateur. Publie ta Tier List lorsque tu veux la partager.';
      });
  }

  function repair(){
    const tier=document.getElementById('mhurTierList');

    if(!tier)return;

    repairTexts(tier);

    tier.querySelectorAll('.mhurTierItem')
      .forEach(card=>{
        if(gentleCard(card)){
          ensureOneBadge(card);
          return;
        }

        card.classList.remove('mhurTierGentleV634');
        card.querySelectorAll(
          ':scope > .mhurTierNewV634'
        ).forEach(node=>node.remove());
      });
  }

  function schedule(){
    if(queued)return;

    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      repair();
    });
  }

  function wrapRender(){
    const tier=window.MHUR_HUB?.tier;
    const current=tier?.render;

    if(
      !tier||
      typeof current!=='function'||
      current.__mhurV634Wrapped
    ){
      return;
    }

    const wrapped=function(){
      const result=current.apply(this,arguments);
      schedule();
      return result;
    };

    wrapped.__mhurV634Wrapped=true;
    wrapped.__mhurV634Original=current;
    tier.render=wrapped;
  }

  function install(){
    wrapRender();
    schedule();
  }

  new MutationObserver(mutations=>{
    const relevant=mutations.some(mutation=>{
      const target=mutation.target;

      return (
        target instanceof Element&&
        (
          target.id==='mhurTierList'||
          target.closest?.('#mhurTierList')
        )
      )||
      Array.from(mutation.addedNodes||[])
        .some(node=>
          node instanceof Element&&
          (
            node.id==='mhurTierList'||
            node.matches?.('.mhurTierItem')||
            node.querySelector?.(
              '#mhurTierList,.mhurTierItem'
            )
          )
        );
    });

    if(relevant)schedule();
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      install,
      {once:true}
    );
  }else{
    install();
  }

  window.addEventListener('load',install,{once:true});
  window.addEventListener('mhur:languagechange',schedule);
  window.addEventListener('hashchange',schedule);
  window.addEventListener('popstate',schedule);

  let attempts=0;
  const retry=setInterval(()=>{
    attempts++;
    install();

    if(attempts>=25){
      clearInterval(retry);
    }
  },160);

  window.MHUR_V634_TIER_FINAL={
    refresh:install,
    repair
  };
})();
