/* MHUR Nexus — V621
   Navigation T.U.N.I.N.G mobile avec animation fluide uniquement.

   - Emplacement -> défilement progressif vers les T.U.N.I.N.G compatibles.
   - T.U.N.I.N.G choisi -> défilement progressif vers l'emplacement actif.
   - Aucun CSS, aucune donnée et aucun autre affichage modifiés.
*/
(function(){
  'use strict';

  if(window.MHUR_V621_TUNING_SMOOTH_NAV_LOADED)return;
  window.MHUR_V621_TUNING_SMOOTH_NAV_LOADED=true;

  const MOBILE_QUERY='(max-width:760px)';
  let navigationId=0;
  let activeAnimation=0;
  let lastKind='';
  let lastRequestAt=0;

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
      const found=Array.from(
        document.querySelectorAll(selector)
      ).find(isVisible);

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

  function targetFor(kind){
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

  function targetScrollY(target){
    return Math.max(
      0,
      window.scrollY+
      target.getBoundingClientRect().top-
      fixedOffset()
    );
  }

  function easeInOutCubic(progress){
    return progress<0.5
      ?4*progress*progress*progress
      :1-Math.pow(-2*progress+2,3)/2;
  }

  function stopAnimation(){
    if(activeAnimation){
      cancelAnimationFrame(activeAnimation);
      activeAnimation=0;
    }
  }

  function animateTo(target,id){
    if(
      id!==navigationId||
      !isMobile()||
      !isVisible(target)
    ){
      return;
    }

    stopAnimation();

    const startY=window.scrollY;
    const endY=targetScrollY(target);
    const distance=endY-startY;

    if(Math.abs(distance)<3){
      window.scrollTo(0,endY);
      return;
    }

    const duration=Math.min(
      950,
      Math.max(480,420+(Math.abs(distance)*0.16))
    );

    const startedAt=performance.now();

    function frame(now){
      if(id!==navigationId||!isMobile()){
        stopAnimation();
        return;
      }

      const elapsed=now-startedAt;
      const progress=Math.min(1,elapsed/duration);
      const eased=easeInOutCubic(progress);

      window.scrollTo(
        0,
        startY+(distance*eased)
      );

      if(progress<1){
        activeAnimation=requestAnimationFrame(frame);
      }else{
        activeAnimation=0;
        window.scrollTo(0,targetScrollY(target));
      }
    }

    activeAnimation=requestAnimationFrame(frame);
  }

  function waitForStableTarget(kind,id){
    const startedAt=performance.now();
    let previousTop=null;
    let stableFrames=0;

    function inspect(){
      if(id!==navigationId||!isMobile())return;

      const target=targetFor(kind);

      if(target){
        const top=target.getBoundingClientRect().top;

        if(
          previousTop!==null&&
          Math.abs(top-previousTop)<1
        ){
          stableFrames++;
        }else{
          stableFrames=0;
        }

        previousTop=top;

        /*
          Le rendu actuel restaure l'ancien scroll dans un
          requestAnimationFrame. On attend que la cible soit stable
          pendant plusieurs images avant de démarrer l'animation.
        */
        if(
          stableFrames>=3||
          performance.now()-startedAt>650
        ){
          animateTo(target,id);
          return;
        }
      }

      if(performance.now()-startedAt<1100){
        requestAnimationFrame(inspect);
      }
    }

    setTimeout(()=>{
      requestAnimationFrame(inspect);
    },80);
  }

  function navigate(kind){
    if(!isMobile())return;

    const now=performance.now();

    /*
      Le clic capturé et l'enveloppe de fonction peuvent demander
      la même navigation presque simultanément. Une seule animation
      doit démarrer.
    */
    if(
      kind===lastKind&&
      now-lastRequestAt<180
    ){
      return;
    }

    lastKind=kind;
    lastRequestAt=now;

    stopAnimation();

    const id=++navigationId;
    waitForStableTarget(kind,id);
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

  document.addEventListener(
    'click',
    event=>{
      if(!isMobile())return;

      const target=event.target;
      if(!(target instanceof Element))return;
      if(!insideTuningDetail(target))return;

      const option=target.closest('.tuningOption');

      if(option){
        if(
          !option.disabled&&
          !option.classList.contains('alreadyUsed')
        ){
          navigate('slot');
        }
        return;
      }

      if(target.closest('.gameSlot')){
        navigate('picker');
      }
    },
    true
  );

  function installWrappers(){
    const currentChoose=window.chooseSlot;

    if(
      typeof currentChoose==='function'&&
      !currentChoose.__mhurV621Wrapped
    ){
      const wrappedChoose=function(){
        const result=currentChoose.apply(this,arguments);
        navigate('picker');
        return result;
      };

      wrappedChoose.__mhurV621Wrapped=true;
      wrappedChoose.__mhurV621Original=currentChoose;

      window.chooseSlot=wrappedChoose;

      try{
        chooseSlot=wrappedChoose;
      }catch(_error){}
    }

    const currentEquip=window.equipTuning;

    if(
      typeof currentEquip==='function'&&
      !currentEquip.__mhurV621Wrapped
    ){
      const wrappedEquip=function(){
        const result=currentEquip.apply(this,arguments);
        navigate('slot');
        return result;
      };

      wrappedEquip.__mhurV621Wrapped=true;
      wrappedEquip.__mhurV621Original=currentEquip;

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

  window.MHUR_V621_TUNING_SMOOTH_NAV={
    toCompatible(){
      navigate('picker');
    },
    toActiveSlot(){
      navigate('slot');
    },
    stop:stopAnimation,
    reinstall:installWrappers
  };
})();
