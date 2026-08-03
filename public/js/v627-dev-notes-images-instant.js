/* MHUR Nexus — V627
   - répare la hauteur des Notes ;
   - affiche les costumes immédiatement avec un cadrage précalculé. */
(function(){
  'use strict';

  if(window.MHUR_V627_LOADED)return;
  window.MHUR_V627_LOADED=true;

  const MOBILE_QUERY='(max-width:760px)';
  const prepared=new WeakSet();
  const preloadLinks=new Set();
  let queued=false;

  function mobile(){
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function normalPath(value){
    let raw=String(value||'').trim();

    try{
      raw=new URL(raw,document.baseURI).pathname;
    }catch(_error){}

    return decodeURIComponent(raw)
      .replace(/^\/+/,'')
      .replace(/^public\//,'')
      .replace(/[?#].*$/,'');
  }

  function boundsFor(image){
    const map=window.MHUR_V627_COSTUME_BOUNDS||{};
    const keys=[
      normalPath(image.currentSrc),
      normalPath(image.getAttribute('src')),
      normalPath(image.src)
    ].filter(Boolean);

    for(const key of keys){
      if(map[key])return map[key];
    }

    return null;
  }

  function isUpcoming(card){
    return Boolean(
      card.matches(
        '.s18UpcomingCostumeTileV25,'+
        '[class*="UpcomingCostumeTile"],'+
        '[class*="upcomingCostumeTile"]'
      )||
      card.closest(
        '.s18UpcomingCostumeGroupV19,'+
        '.s18UpcomingCostumeGroupV23,'+
        '[class*="UpcomingCostumeGroup"],'+
        '[class*="upcomingCostumeGroup"]'
      )||
      card.querySelector(
        '.s18UpcomingStatusV25,'+
        '.s18UpcomingDateV25,'+
        '[class*="UpcomingStatus"],'+
        '[class*="UpcomingDate"]'
      )
    );
  }

  function isOriginal(card){
    const text=String(
      card.querySelector('.costumeTileName')?.textContent||''
    )
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .trim()
      .toLowerCase();

    return text==='original'||text.startsWith('original ');
  }

  function setPx(image,name,value){
    image.style.setProperty(
      name,
      `${Math.round(value*100)/100}px`
    );
  }

  function preload(image,index){
    image.loading='eager';
    image.decoding='async';

    try{
      image.fetchPriority=index<10?'high':'auto';
    }catch(_error){}

    const source=image.currentSrc||
      image.getAttribute('src')||
      image.src;

    if(!source||preloadLinks.has(source)||index>=12)return;

    preloadLinks.add(source);

    const link=document.createElement('link');
    link.rel='preload';
    link.as='image';
    link.href=source;
    link.fetchPriority=index<6?'high':'auto';
    document.head.appendChild(link);
  }

  function applyCostumeImage(image,index=0){
    if(
      !mobile()||
      !(image instanceof HTMLImageElement)||
      !image.parentElement?.matches?.('.costumeTile')
    ){
      return;
    }

    preload(image,index);

    const card=image.parentElement;
    const cardRect=card.getBoundingClientRect();

    if(cardRect.width<120||cardRect.height<180){
      requestAnimationFrame(
        ()=>applyCostumeImage(image,index)
      );
      return;
    }

    const meta=boundsFor(image);

    if(!meta){
      image.dataset.v627CostumeFallback='1';
      delete image.dataset.v627CostumeReady;
      return;
    }

    delete image.dataset.v627CostumeFallback;

    const name=card.querySelector('.costumeTileName');
    const status=card.querySelector(
      '.s18UpcomingStatusV25,'+
      '[class*="UpcomingStatus"]'
    );
    const date=card.querySelector(
      '.s18UpcomingDateV25,'+
      '[class*="UpcomingDate"]'
    );

    const upcoming=isUpcoming(card);
    const original=isOriginal(card);

    const horizontalPadding=Math.max(
      18,
      cardRect.width*0.045
    );

    const areaLeft=horizontalPadding;
    const areaRight=cardRect.width-horizontalPadding;
    const areaWidth=Math.max(80,areaRight-areaLeft);

    const relativeBottom=element=>{
      if(!element)return 0;
      return Math.max(
        0,
        element.getBoundingClientRect().bottom-cardRect.top
      );
    };

    let areaTop=upcoming
      ?Math.max(92,relativeBottom(date||status)+12)
      :Math.max(54,cardRect.height*0.075);

    const nameTop=name
      ?name.getBoundingClientRect().top-cardRect.top
      :cardRect.height-Math.max(120,cardRect.height*0.22);

    const areaBottom=Math.max(areaTop+120,nameTop-34);
    const areaHeight=Math.max(120,areaBottom-areaTop);

    const box={
      x:Number(meta.x)||0,
      y:Number(meta.y)||0,
      width:Math.max(1,Number(meta.width)||Number(meta.nw)||1),
      height:Math.max(1,Number(meta.height)||Number(meta.nh)||1),
      centerX:Number(meta.centerX)||
        ((Number(meta.x)||0)+(Number(meta.width)||Number(meta.nw)||1)/2),
      centerY:Number(meta.centerY)||
        ((Number(meta.y)||0)+(Number(meta.height)||Number(meta.nh)||1)/2)
    };

    const widthCoverage=upcoming?0.84:0.82;
    const heightCoverage=upcoming?0.84:0.88;

    let scale=Math.min(
      (areaWidth*widthCoverage)/box.width,
      (areaHeight*heightCoverage)/box.height
    );

    if(original)scale*=1.03;
    if(upcoming)scale*=1.02;

    const naturalWidth=Math.max(1,Number(meta.nw)||1);
    const naturalHeight=Math.max(1,Number(meta.nh)||1);

    const centerX=areaLeft+(areaWidth/2);
    const verticalRatio=upcoming
      ?0.49
      :(original?0.45:0.40);
    const centerY=areaTop+(areaHeight*verticalRatio);

    let left=centerX-(box.centerX*scale);
    let top=centerY-(box.centerY*scale);

    let visibleLeft=left+(box.x*scale);
    let visibleRight=visibleLeft+(box.width*scale);
    let visibleTop=top+(box.y*scale);
    let visibleBottom=visibleTop+(box.height*scale);

    const minLeft=areaLeft+2;
    const maxRight=areaRight-2;
    const minTop=areaTop+2;
    const maxBottom=areaBottom-2;

    if(visibleLeft<minLeft)left+=minLeft-visibleLeft;
    if(visibleRight>maxRight)left-=visibleRight-maxRight;
    if(visibleTop<minTop)top+=minTop-visibleTop;
    if(visibleBottom>maxBottom)top-=visibleBottom-maxBottom;

    setPx(image,'--v627-left',left);
    setPx(image,'--v627-top',top);
    setPx(image,'--v627-width',naturalWidth*scale);
    setPx(image,'--v627-height',naturalHeight*scale);

    image.dataset.v627CostumeReady='1';

    /*
      Compatibilité : empêche les anciens moteurs d'attendre une analyse
      de pixels déjà faite pendant le workflow.
    */
    image.dataset.v618Main='1';
    image.dataset.v622Ready='1';
  }

  function scanCostumes(root=document){
    if(!mobile())return;

    const images=[];

    if(
      root instanceof HTMLImageElement&&
      root.parentElement?.matches?.('.costumeTile')
    ){
      images.push(root);
    }

    root.querySelectorAll?.('.costumeTile > img')
      .forEach(image=>images.push(image));

    images.forEach((image,index)=>{
      if(!prepared.has(image)){
        prepared.add(image);
      }

      applyCostumeImage(image,index);
    });
  }

  function headerBottom(){
    const selectors=[
      '#siteHeader',
      '.nexusHeader',
      'header.top',
      '#topbar',
      '.topbar',
      'header'
    ];

    let bottom=0;

    selectors.forEach(selector=>{
      document.querySelectorAll(selector).forEach(element=>{
        const style=getComputedStyle(element);
        const rect=element.getBoundingClientRect();

        if(
          rect.width>0&&
          rect.height>0&&
          (
            style.position==='fixed'||
            style.position==='sticky'||
            element.tagName==='HEADER'
          )
        ){
          bottom=Math.max(bottom,rect.bottom);
        }
      });
    });

    return Math.max(0,Math.ceil(bottom));
  }

  function refreshNotes(){
    const modal=document.getElementById(
      's18NotesDevModalV10'
    );

    document.documentElement.style.setProperty(
      '--mhur-v627-notes-top',
      `${headerBottom()}px`
    );

    if(!modal)return;

    const devActive=Boolean(
      modal.querySelector('[data-tab="dev"].active')
    );

    modal.classList.toggle(
      'mhurV627DevActive',
      devActive
    );

    const panel=modal.querySelector('.s18NotesPanelV10');
    const body=modal.querySelector('.s18NotesBodyV10');

    if(panel){
      panel.style.removeProperty('max-height');
      panel.style.removeProperty('height');
    }

    if(body){
      body.style.removeProperty('max-height');
      body.style.removeProperty('height');
    }
  }

  function refresh(root=document){
    scanCostumes(root);
    refreshNotes();
  }

  function schedule(root=document){
    if(queued)return;

    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      refresh(root);
    });
  }

  new MutationObserver(mutations=>{
    mutations.forEach(mutation=>{
      mutation.addedNodes.forEach(node=>{
        if(node.nodeType===Node.ELEMENT_NODE){
          scanCostumes(node);
        }
      });
    });

    schedule();
  }).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','src']
  });

  document.addEventListener(
    'click',
    event=>{
      if(
        event.target?.closest?.(
          '#mhurPatchDevButtonV14,'+
          '.mhurPatchDevButtonV14,'+
          '[data-s18-notes-button],'+
          '#s18NotesDevModalV10 [data-tab]'
        )
      ){
        setTimeout(refreshNotes,0);
        setTimeout(refreshNotes,80);
      }
    },
    true
  );

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      ()=>refresh(),
      {once:true}
    );
  }else{
    refresh();
  }

  window.addEventListener('load',()=>refresh(),{once:true});
  window.addEventListener('resize',()=>schedule());
  window.addEventListener('orientationchange',()=>schedule());
  window.addEventListener('hashchange',()=>schedule());
  window.addEventListener('popstate',()=>schedule());

  window.MHUR_V627={
    refresh,
    refreshNotes,
    refreshCostumes:scanCostumes
  };
})();
