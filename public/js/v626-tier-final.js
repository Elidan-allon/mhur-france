/* MHUR Nexus — V626
   Tier List finale, mobile + ordinateur.
   Corrige Gentle, le NEW et le texte d'aide après chaque rendu. */
(function(){
  'use strict';

  if(window.MHUR_V626_TIER_LOADED)return;
  window.MHUR_V626_TIER_LOADED=true;

  let queued=false;

  function english(){
    return String(
      document.documentElement.lang||
      (typeof lang!=='undefined'?lang:'fr')||
      'fr'
    ).toLowerCase().startsWith('en');
  }

  function gentleCard(card){
    if(!card)return false;

    if(card.dataset.v544Gentle==='1')return true;

    const text=String(card.textContent||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase();

    const alt=String(
      card.querySelector(':scope > img')?.alt||''
    )
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase();

    return (
      text.includes('gentle criminal')||
      alt.includes('gentle criminal')
    );
  }

  function removeOldGentleBadges(card){
    const selectors=[
      '.mhurNewV582',
      '.s18NewBadge',
      '[class*="s18NewBadge"]',
      '[class*="mhurTierNew"]:not(.mhurTierNewV626)',
      '[aria-label="NEW"]:not(.mhurTierNewV626)'
    ].join(',');

    card.querySelectorAll(selectors).forEach(badge=>{
      const parent=badge.parentElement;
      badge.remove();

      if(
        parent&&
        parent!==card&&
        parent.childElementCount===0&&
        !String(parent.textContent||'').trim()
      ){
        parent.remove();
      }
    });
  }

  function fixHelp(output){
    const help=output.querySelector('.mhurTierDragHelp');

    if(!help)return;

    help.textContent=english()
      ?'Changes are saved only in your browser. Publish your Tier List when you want to share it.'
      :'Les déplacements sont enregistrés uniquement dans ton navigateur. Publie ta Tier List lorsque tu veux la partager.';
  }

  function fixCards(output){
    if(window.MHUR_V634_TIER_FINAL_LOADED)return;
    output.querySelectorAll('.mhurTierItem').forEach(card=>{
      card.classList.add('mhurTierCardV626');

      const name=card.querySelector(':scope > small');
      const style=card.querySelector(
        ':scope > .mhurTierStyleName'
      );

      if(name)name.classList.add('mhurTierNameV626');
      if(style)style.classList.add('mhurTierStyleV626');

      if(!gentleCard(card)){
        card.classList.remove('mhurTierGentleV626');
        card.querySelectorAll(
          ':scope > .mhurTierNewV626'
        ).forEach(node=>node.remove());
        return;
      }

      card.classList.add('mhurTierGentleV626');
      removeOldGentleBadges(card);

      if(!card.querySelector(':scope > .mhurTierNewV626')){
        const badge=document.createElement('span');
        badge.className='mhurTierNewV626';
        badge.setAttribute('aria-label','NEW');
        badge.textContent='NEW';
        card.insertBefore(badge,card.firstChild);
      }
    });
  }

  function repair(){
    const output=document.getElementById('mhurTierList');

    if(!output)return;

    output.classList.add('mhurTierV626');
    fixHelp(output);
    fixCards(output);
  }

  function schedule(){
    if(queued)return;

    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      repair();
    });
  }

  function wrapRenderer(){
    const tier=window.MHUR_HUB?.tier;
    const current=tier?.render;

    if(
      !tier||
      typeof current!=='function'||
      current.__mhurV626Wrapped
    ){
      return;
    }

    const wrapped=function(){
      const result=current.apply(this,arguments);
      schedule();
      return result;
    };

    wrapped.__mhurV626Wrapped=true;
    wrapped.__mhurV626Original=current;
    tier.render=wrapped;
  }

  function install(){
    wrapRenderer();
    schedule();
  }

  new MutationObserver(mutations=>{
    if(
      mutations.some(mutation=>
        mutation.addedNodes?.length||
        mutation.removedNodes?.length
      )
    ){
      install();
    }
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
  window.addEventListener('mhur:languagechange',install);

  let attempts=0;
  const retry=setInterval(()=>{
    attempts++;
    install();

    if(attempts>=25){
      clearInterval(retry);
    }
  },200);

  window.MHUR_V626_TIER={
    refresh:install,
    repair
  };
})();
