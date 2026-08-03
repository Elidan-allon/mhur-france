/* MHUR Nexus — V614
   Photos des costumes sur mobile :
   - utilise toujours la vraie photo, meme si NEW est insere avant elle ;
   - donne aux images verticales toute la hauteur de la zone photo ;
   - remonte legerement tous les costumes ;
   - NEW ne reduit plus la photo ;
   - ne touche pas aux icones T.U.N.I.N.G, aux etoiles ou aux textes.
*/
(function(){
  'use strict';

  if(window.MHUR_V614_COSTUME_PHOTOS_LOADED)return;
  window.MHUR_V614_COSTUME_PHOTOS_LOADED=true;

  const STYLE_ID='mhur-v614-mobile-costume-photos-style';
  const CARD_SELECTOR=
    '#app .costumeTile,'+
    '#app .costumeCard,'+
    '#app .costumeResult';

  const CSS=`
@media (max-width:760px){
  html body #app .costumeTile,
  html body #app .costumeCard,
  html body #app .costumeResult{
    position:relative!important;
    overflow:hidden!important;
  }

  /*
    La zone photo prend toute la carte jusqu'au debut du nom.
    Les anciennes hauteurs fixes (150/166 px) rendaient les images
    verticales minuscules, notamment les costumes portant NEW.
  */
  html body #app .costumeTile > img.mhurCostumePhotoV614,
  html body #app .costumeCard > img.mhurCostumePhotoV614,
  html body #app .costumeResult > img.mhurCostumePhotoV614{
    position:absolute!important;
    inset:2px 6px 84px 6px!important;
    top:2px!important;
    right:6px!important;
    bottom:84px!important;
    left:6px!important;
    width:calc(100% - 12px)!important;
    height:auto!important;
    min-width:0!important;
    min-height:0!important;
    max-width:none!important;
    max-height:none!important;
    padding:0!important;
    margin:0!important;
    border:0!important;
    object-fit:contain!important;
    object-position:center center!important;
    transform:translateY(-6px)!important;
    transform-origin:center center!important;
    translate:none!important;
    background:transparent!important;
    opacity:1!important;
    visibility:visible!important;
    display:block!important;
    z-index:2!important;
  }

  /*
    Meme geometrie quand NEW existe : aucune reduction, aucun
    changement de hauteur et aucune dependance a :first-child.
  */
  html body #app [data-mhur-v614-new="1"]
  > img.mhurCostumePhotoV614{
    inset:2px 6px 84px 6px!important;
    width:calc(100% - 12px)!important;
    height:auto!important;
    object-fit:contain!important;
    object-position:center center!important;
    transform:translateY(-6px)!important;
  }

  /* NEW reste une surcouche et ne participe jamais au placement. */
  html body #app .costumeTile > .mhurNewV582,
  html body #app .costumeCard > .mhurNewV582,
  html body #app .costumeResult > .mhurNewV582{
    position:absolute!important;
    top:34px!important;
    right:7px!important;
    bottom:auto!important;
    left:auto!important;
    width:54px!important;
    height:29px!important;
    min-width:0!important;
    min-height:0!important;
    margin:0!important;
    padding:0!important;
    pointer-events:none!important;
    z-index:90!important;
  }

  /* Les elements de la carte restent au-dessus de la photo. */
  html body #app .costumeTile .costumeTileRarity,
  html body #app .costumeTile .costumeTileStars,
  html body #app .costumeTile .costumeTileBadge,
  html body #app .costumeTile .costumeTileName,
  html body #app .costumeTile .costumeMiniDesc{
    position:absolute!important;
  }

  html body #app .costumeTile .costumeTileRarity,
  html body #app .costumeTile .costumeTileStars{
    z-index:95!important;
  }

  html body #app .costumeTile .costumeTileBadge{
    z-index:40!important;
  }

  html body #app .costumeTile .costumeTileName,
  html body #app .costumeTile .costumeMiniDesc{
    z-index:20!important;
  }
}
`;

  function installStyle(){
    let style=document.getElementById(STYLE_ID);

    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }

    if(style.textContent!==CSS){
      style.textContent=CSS;
    }
  }

  function directChildren(node){
    return Array.from(node?.children||[]);
  }

  function isMainPhoto(image){
    if(!(image instanceof HTMLImageElement))return false;

    return !(
      image.classList.contains('costumeTileBadgeIcon')||
      image.classList.contains('roleIcon')||
      image.closest('.costumeTileBadge')||
      image.closest('.costumeTileStars')||
      image.closest('.costumeTileRarity')
    );
  }

  function mainPhoto(card){
    /*
      On inspecte les enfants directs au lieu d'utiliser
      img:first-child. Le span NEW peut etre le premier enfant.
    */
    return directChildren(card).find(isMainPhoto)||null;
  }

  function patchCard(card){
    if(!(card instanceof HTMLElement))return;

    const photo=mainPhoto(card);

    directChildren(card).forEach(child=>{
      if(
        child instanceof HTMLImageElement&&
        child!==photo
      ){
        child.classList.remove('mhurCostumePhotoV614');
      }
    });

    if(photo){
      photo.classList.add('mhurCostumePhotoV614');
      photo.dataset.mhurV614MainPhoto='1';
    }

    const hasNew=Boolean(
      directChildren(card).find(child=>
        child.classList?.contains('mhurNewV582')||
        child.classList?.contains('s18NewBadge')
      )
    );

    if(hasNew){
      card.dataset.mhurV614New='1';
    }else{
      delete card.dataset.mhurV614New;
    }
  }

  function sync(root=document){
    installStyle();

    if(root instanceof Element&&root.matches(CARD_SELECTOR)){
      patchCard(root);
    }

    root.querySelectorAll?.(CARD_SELECTOR).forEach(patchCard);
  }

  let scheduled=false;

  function schedule(){
    if(scheduled)return;
    scheduled=true;

    requestAnimationFrame(()=>{
      scheduled=false;
      sync();
    });
  }

  function start(){
    sync();
    schedule();

    new MutationObserver(mutations=>{
      if(
        mutations.some(mutation=>
          mutation.type==='childList'||
          mutation.attributeName==='class'||
          mutation.attributeName==='src'
        )
      ){
        schedule();
      }
    }).observe(document.documentElement,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','src','data-costume-id']
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once:true}
    );
  }else{
    start();
  }

  window.addEventListener('load',schedule,{once:true});
  window.addEventListener('pageshow',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>
    setTimeout(schedule,80),
    {passive:true}
  );
  window.addEventListener('mhur:languagechange',schedule);

  window.MHUR_V614_COSTUME_PHOTOS={
    version:'614',
    refresh:schedule,
    sync
  };
})();
