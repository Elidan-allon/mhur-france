/* MHUR Nexus — V624
   Corrige uniquement la carte NEW de la tier list mobile :
   - badge NEW en haut à gauche, plus petit, avec animation ;
   - espacement entre nom du perso et style.
*/
(function(){
  'use strict';

  if(window.MHUR_V624_TIERLIST_FIX_LOADED)return;
  window.MHUR_V624_TIERLIST_FIX_LOADED=true;

  const MOBILE_QUERY='(max-width:760px)';
  let queued=false;

  function isMobile(){
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function visible(el){
    if(!el||!el.isConnected)return false;
    const style=getComputedStyle(el);
    if(
      style.display==='none'||
      style.visibility==='hidden'||
      Number(style.opacity)===0
    ){
      return false;
    }
    const rect=el.getBoundingClientRect();
    return rect.width>0&&rect.height>0;
  }

  function textOnly(el){
    return String(el?.textContent||'')
      .replace(/\s+/g,' ')
      .trim();
  }

  function matchesNewText(el){
    const text=textOnly(el);
    return /^new!?$/i.test(text);
  }

  function likelyTierScope(root=document){
    return Array.from(
      root.querySelectorAll(
        '[id*="tier" i],[class*="tier" i]'
      )
    );
  }

  function nearestCardFromBadge(badge){
    let current=badge instanceof Element ? badge : null;

    while(current&&current!==document.body){
      const rect=current.getBoundingClientRect();
      const hasImage=current.querySelector('img');
      const texts=getLeafTextNodes(current);

      if(
        hasImage&&
        rect.width>=80&&
        rect.height>=110&&
        texts.length>=2
      ){
        return current;
      }

      current=current.parentElement;
    }

    return badge?.parentElement||null;
  }

  function getLeafTextNodes(root){
    return Array.from(root.querySelectorAll('*'))
      .filter(el=>{
        if(!visible(el))return false;
        if(el.children.length>0)return false;
        if(
          el.classList.contains('mhurV624TierNew')||
          el.classList.contains('mhurV624TierName')||
          el.classList.contains('mhurV624TierStyle')
        ){
          return false;
        }

        const text=textOnly(el);
        if(!text)return false;
        if(/^new!?$/i.test(text))return false;
        if(/^(s|a|b|c|d|f)$/i.test(text))return false;
        if(text.length>42)return false;

        return true;
      });
  }

  function pickNameAndStyle(card){
    const rect=card.getBoundingClientRect();

    const candidates=getLeafTextNodes(card)
      .filter(el=>{
        const text=textOnly(el);
        const top=el.getBoundingClientRect().top-rect.top;

        if(top<rect.height*0.38)return false;
        if(text.length<2)return false;

        return true;
      })
      .sort((a,b)=>{
        const ar=a.getBoundingClientRect();
        const br=b.getBoundingClientRect();

        if(Math.abs(ar.top-br.top)>2){
          return ar.top-br.top;
        }

        return ar.left-br.left;
      });

    const unique=[];
    const seen=new Set();

    candidates.forEach(el=>{
      if(seen.has(el))return;
      seen.add(el);
      unique.push(el);
    });

    if(unique.length<2)return null;

    for(let i=0;i<unique.length-1;i++){
      const a=unique[i];
      const b=unique[i+1];
      const ar=a.getBoundingClientRect();
      const br=b.getBoundingClientRect();

      if(
        br.top>=ar.top-1&&
        br.top-ar.top<34
      ){
        return {name:a,style:b};
      }
    }

    return {name:unique[0],style:unique[1]};
  }

  function groupText(nameEl,styleEl){
    if(
      !nameEl||
      !styleEl||
      !nameEl.parentElement||
      !styleEl.parentElement
    ){
      return;
    }

    nameEl.classList.add('mhurV624TierName');
    styleEl.classList.add('mhurV624TierStyle');

    if(nameEl.parentElement===styleEl.parentElement){
      const parent=nameEl.parentElement;
      const children=Array.from(parent.children);

      if(
        children.includes(nameEl)&&
        children.includes(styleEl)
      ){
        parent.classList.add('mhurV624TierTextGroup');
      }
    }
  }

  function fixBadge(card){
    const badgeCandidates=Array.from(
      card.querySelectorAll('*')
    ).filter(el=>matchesNewText(el));

    if(!badgeCandidates.length)return;

    const badge=badgeCandidates[0];
    badge.classList.add('mhurV624TierNew');
    card.classList.add('mhurV624TierCard');

    const wrap=badge.parentElement;
    if(
      wrap&&
      wrap!==card&&
      wrap.getBoundingClientRect().width<160
    ){
      wrap.classList.add('mhurV624TierNewWrap');
    }
  }

  function fixCard(card){
    if(!visible(card))return;

    const hasNew=Array.from(card.querySelectorAll('*'))
      .some(matchesNewText);

    if(!hasNew)return;

    fixBadge(card);

    const pair=pickNameAndStyle(card);
    if(pair){
      groupText(pair.name,pair.style);
    }
  }

  function scan(root=document){
    if(!isMobile())return;

    const scopes=likelyTierScope(root);
    const cards=new Set();

    scopes.forEach(scope=>{
      Array.from(scope.querySelectorAll('*')).forEach(el=>{
        if(!visible(el))return;
        if(
          Array.from(el.querySelectorAll('*'))
            .some(matchesNewText)
        ){
          const card=nearestCardFromBadge(
            Array.from(el.querySelectorAll('*'))
              .find(matchesNewText)
          );
          if(card)cards.add(card);
        }
      });
    });

    Array.from(document.querySelectorAll('*')).forEach(el=>{
      if(matchesNewText(el)){
        const card=nearestCardFromBadge(el);
        if(card)cards.add(card);
      }
    });

    cards.forEach(fixCard);
  }

  function schedule(root=document){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      scan(root);
    });
  }

  new MutationObserver(mutations=>{
    for(const mutation of mutations){
      mutation.addedNodes.forEach(node=>{
        if(node.nodeType===Node.ELEMENT_NODE){
          schedule(node);
        }
      });
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      ()=>schedule(),
      {once:true}
    );
  }else{
    schedule();
  }

  window.addEventListener('load',()=>schedule(),{once:true});
  window.addEventListener('resize',()=>schedule());
  window.addEventListener('orientationchange',()=>schedule());

  window.MHUR_V624_TIERLIST_FIX={
    refresh:schedule,
    scan
  };
})();
