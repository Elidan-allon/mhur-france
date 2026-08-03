/* MHUR Nexus — V620
   Correctif EXCLUSIF de l'aller-retour automatique T.U.N.I.N.G sur mobile.

   - Clic sur un emplacement : descend vers .tuningPicker.
   - Choix d'un T.U.N.I.N.G : remonte vers .gameSlot.active.
   - Aucun changement de style, de données, de carte ou de détail.
*/
(function(){
  'use strict';

  if(window.MHUR_V620_TUNING_AUTO_NAV_LOADED)return;
  window.MHUR_V620_TUNING_AUTO_NAV_LOADED=true;

  const MOBILE_QUERY='(max-width:760px)';
  let navigationId=0;

  function isMobile(){
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function isVisible(element){
    if(!element||!element.isConnected)return false;

    const style=getComputedStyle(element);
    if(
      style.display==='none'||
      style.visibility==='hidden'||
      Number(style.opacity)===0
    ){
      return false;
    }

    const rect=element.getBoundingClientRect();
    return rect.width>0&&rect.height>0;
  }

  function firstVisible(selectors){
    for(const selector of selectors){
      const elements=Array.from(document.querySelectorAll(selector));
      const found=elements.find(isVisible);
      if(found)return found;
    }

    return null;
  }

  function fixedOffset(){
    let bottom=0;

    const candidates=[
      document.querySelector('header'),
      firstVisible([
        '#app .costumeDetail .back',
        '#app .gameLikeDetail .back',
        '#app .gameCostumeScreen .back',
        '#app > .back',
        '#app .back'
      ])
    ];

    candidates.forEach(element=>{
      if(!element)return;

      const style=getComputedStyle(element);
      const rect=element.getBoundingClientRect();

      if(
        element.tagName==='HEADER'||
        style.position==='fixed'||
        style.position==='sticky'
      ){
        if(
          rect.bottom>bottom&&
          rect.bottom<window.innerHeight
        ){
          bottom=rect.bottom;
        }
      }
    });

    return Math.max(90,Math.ceil(bottom)+12);
  }

  function navigationTarget(kind){
    if(kind==='picker'){
      return firstVisible([
        '#app .costumeDetail .tuningPicker',
        '#app .gameLikeDetail .tuningPicker',
        '#app .gameCostumeScreen .tuningPicker',
        '#app .tuningPicker',
        '.tuningPicker'
      ]);
    }

    return firstVisible([
      '#app .costumeDetail .gameSlot.active',
      '#app .gameLikeDetail .gameSlot.active',
      '#app .gameCostumeScreen .gameSlot.active',
      '#app .gameSlot.active',
      '.gameSlot.active'
    ]);
  }

  function scrollToTarget(kind,behavior){
    const target=navigationTarget(kind);
    if(!target)return false;

    const top=Math.max(
      0,
      window.scrollY+
      target.getBoundingClientRect().top-
      fixedOffset()
    );

    window.scrollTo({
      top,
      left:0,
      behavior
    });

    return true;
  }

  function navigate(kind){
    if(!isMobile())return;

    const id=++navigationId;

    /*
      chooseSlot() et equipTuning() rendent la page, puis restaurent
      l'ancienne position dans requestAnimationFrame. Ces passages
      répétés s'exécutent volontairement après cette restauration.
    */
    const attempts=[
      {delay:35,behavior:'auto'},
      {delay:90,behavior:'auto'},
      {delay:180,behavior:'auto'},
      {delay:320,behavior:'smooth'},
      {delay:600,behavior:'auto'}
    ];

    attempts.forEach(({delay,behavior})=>{
      setTimeout(()=>{
        if(id!==navigationId||!isMobile())return;

        requestAnimationFrame(()=>{
          if(id!==navigationId)return;
          scrollToTarget(kind,behavior);
        });
      },delay);
    });
  }

  function insideTuningDetail(element){
    return Boolean(
      element?.closest?.(
        '#app .costumeDetail,'+
        '#app .gameLikeDetail,'+
        '#app .gameCostumeScreen'
      )
    );
  }

  /*
    Capture le clic avant que le rendu ne supprime le bouton d'origine.
    Cela fonctionne même si les fonctions globales sont ensuite remplacées
    par une autre couche du site.
  */
  document.addEventListener(
    'click',
    event=>{
      if(!isMobile())return;

      const target=event.target;
      if(!(target instanceof Element))return;
      if(!insideTuningDetail(target))return;

      const option=target.closest('.tuningOption');

      if(option){
        if(!option.disabled&&!option.classList.contains('alreadyUsed')){
          navigate('slot');
        }
        return;
      }

      const slot=target.closest('.gameSlot');

      if(slot){
        navigate('picker');
      }
    },
    true
  );

  /*
    Deuxième sécurité : enveloppe directement les fonctions finales.
    Le résultat fonctionnel original reste strictement inchangé.
  */
  function installWrappers(){
    const currentChoose=window.chooseSlot;

    if(
      typeof currentChoose==='function'&&
      !currentChoose.__mhurV620Wrapped
    ){
      const wrappedChoose=function(){
        const result=currentChoose.apply(this,arguments);
        navigate('picker');
        return result;
      };

      wrappedChoose.__mhurV620Wrapped=true;
      wrappedChoose.__mhurV620Original=currentChoose;

      window.chooseSlot=wrappedChoose;

      try{
        chooseSlot=wrappedChoose;
      }catch(_error){}
    }

    const currentEquip=window.equipTuning;

    if(
      typeof currentEquip==='function'&&
      !currentEquip.__mhurV620Wrapped
    ){
      const wrappedEquip=function(){
        const result=currentEquip.apply(this,arguments);
        navigate('slot');
        return result;
      };

      wrappedEquip.__mhurV620Wrapped=true;
      wrappedEquip.__mhurV620Original=currentEquip;

      window.equipTuning=wrappedEquip;

      try{
        equipTuning=wrappedEquip;
      }catch(_error){}
    }
  }

  installWrappers();

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      installWrappers,
      {once:true}
    );
  }

  window.addEventListener(
    'load',
    installWrappers,
    {once:true}
  );

  setTimeout(installWrappers,0);
  setTimeout(installWrappers,250);
  setTimeout(installWrappers,1000);

  window.MHUR_V620_TUNING_AUTO_NAV={
    toCompatible(){
      navigate('picker');
    },
    toActiveSlot(){
      navigate('slot');
    },
    reinstall:installWrappers
  };
})();
