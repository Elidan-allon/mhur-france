/* MHUR Nexus — V618
   Centre le contenu visible des PNG de costumes, pas leur toile transparente. */
(function(){
  'use strict';

  if(window.MHUR_V618_COSTUMES_LOADED) return;
  window.MHUR_V618_COSTUMES_LOADED=true;

  const MOBILE='(max-width:760px)';
  const alphaCache=new Map();
  let queued=false;

  function mobile(){
    return window.matchMedia(MOBILE).matches;
  }

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

  function directMainImage(card){
    return Array.from(card.children||[])
      .find(child=>child.tagName==='IMG')||null;
  }

  function isUpcoming(card){
    if(
      card.matches(
        '.s18UpcomingCostumeTileV25,'+
        '[class*="UpcomingCostumeTile"],'+
        '[class*="upcomingCostumeTile"]'
      )
    ) return true;

    if(
      card.closest(
        '.s18UpcomingCostumeGroupV19,'+
        '.s18UpcomingCostumeGroupV23,'+
        '[class*="UpcomingCostumeGroup"],'+
        '[class*="upcomingCostumeGroup"]'
      )
    ) return true;

    return Boolean(
      card.querySelector(
        '.s18UpcomingStatusV25,'+
        '.s18UpcomingDateV25,'+
        '[class*="UpcomingStatus"],'+
        '[class*="UpcomingDate"],'+
        '[class*="upcomingStatus"],'+
        '[class*="upcomingDate"]'
      )
    );
  }

  function isOriginal(card){
    const name=normal(
      card.querySelector('.costumeTileName')?.textContent||''
    );
    return name==='original'||name.startsWith('original_');
  }

  function imageKey(img){
    return clean(img.currentSrc||img.getAttribute('src')||img.src);
  }

  function fullBox(img){
    const width=Math.max(1,img.naturalWidth||1);
    const height=Math.max(1,img.naturalHeight||1);
    return {
      x:0,
      y:0,
      width,
      height,
      centerX:width/2,
      centerY:height/2
    };
  }

  function scanVisibleBox(img){
    const key=imageKey(img);
    if(alphaCache.has(key)) return alphaCache.get(key);

    const promise=new Promise(resolve=>{
      try{
        const naturalWidth=Math.max(1,img.naturalWidth||1);
        const naturalHeight=Math.max(1,img.naturalHeight||1);
        const longest=Math.max(naturalWidth,naturalHeight);
        const scale=Math.min(1,320/longest);
        const width=Math.max(1,Math.round(naturalWidth*scale));
        const height=Math.max(1,Math.round(naturalHeight*scale));

        const canvas=document.createElement('canvas');
        canvas.width=width;
        canvas.height=height;

        const context=canvas.getContext('2d',{
          alpha:true,
          willReadFrequently:true
        });

        if(!context){
          resolve(fullBox(img));
          return;
        }

        context.clearRect(0,0,width,height);
        context.drawImage(img,0,0,width,height);

        const data=context.getImageData(0,0,width,height).data;
        let minX=width;
        let minY=height;
        let maxX=-1;
        let maxY=-1;

        for(let y=0;y<height;y++){
          for(let x=0;x<width;x++){
            const index=(y*width+x)*4;
            if(data[index+3]>12){
              if(x<minX) minX=x;
              if(y<minY) minY=y;
              if(x>maxX) maxX=x;
              if(y>maxY) maxY=y;
            }
          }
        }

        if(maxX<minX||maxY<minY){
          resolve(fullBox(img));
          return;
        }

        const inverse=1/scale;
        const x=minX*inverse;
        const y=minY*inverse;
        const visibleWidth=(maxX-minX+1)*inverse;
        const visibleHeight=(maxY-minY+1)*inverse;

        resolve({
          x,
          y,
          width:visibleWidth,
          height:visibleHeight,
          centerX:x+(visibleWidth/2),
          centerY:y+(visibleHeight/2)
        });
      }catch(_error){
        resolve(fullBox(img));
      }
    });

    alphaCache.set(key,promise);
    return promise;
  }

  function relativeBottom(element,cardRect){
    if(!element) return 0;
    const rect=element.getBoundingClientRect();
    return Math.max(0,rect.bottom-cardRect.top);
  }

  function relativeTop(element,cardRect,fallback){
    if(!element) return fallback;
    const rect=element.getBoundingClientRect();
    const value=rect.top-cardRect.top;
    return Number.isFinite(value)?value:fallback;
  }

  function setPx(img,name,value){
    img.style.setProperty(name,`${Math.round(value*100)/100}px`);
  }

  async function fitCard(card){
    if(!mobile()||!card?.isConnected) return;

    const img=directMainImage(card);
    if(!img) return;

    if(!img.complete||!img.naturalWidth||!img.naturalHeight){
      img.addEventListener('load',schedule,{once:true});
      return;
    }

    const cardRect=card.getBoundingClientRect();
    if(cardRect.width<160||cardRect.height<220) return;

    const name=card.querySelector('.costumeTileName');
    const status=card.querySelector(
      '.s18UpcomingStatusV25,'+
      '[class*="UpcomingStatus"],'+
      '[class*="upcomingStatus"]'
    );
    const date=card.querySelector(
      '.s18UpcomingDateV25,'+
      '[class*="UpcomingDate"],'+
      '[class*="upcomingDate"]'
    );

    const upcoming=isUpcoming(card);
    const original=isOriginal(card);

    const horizontalPadding=Math.max(18,cardRect.width*0.045);
    const areaLeft=horizontalPadding;
    const areaRight=cardRect.width-horizontalPadding;
    const areaWidth=Math.max(80,areaRight-areaLeft);

    let areaTop=upcoming
      ?Math.max(92,relativeBottom(date||status,cardRect)+12)
      :Math.max(54,cardRect.height*0.075);

    const fallbackNameTop=cardRect.height-Math.max(120,cardRect.height*0.22);
    const nameTop=relativeTop(name,cardRect,fallbackNameTop);
    const areaBottom=Math.max(areaTop+120,nameTop-34);
    const areaHeight=Math.max(120,areaBottom-areaTop);

    const box=await scanVisibleBox(img);
    if(!card.isConnected) return;

    /*
      Le contenu visible occupe environ 82 % de la largeur et 88 % de
      la hauteur disponible. Les costumes à venir ont un peu moins de
      place à cause du statut et de la date.
    */
    const widthCoverage=upcoming?0.84:0.82;
    const heightCoverage=upcoming?0.84:0.88;

    let scale=Math.min(
      (areaWidth*widthCoverage)/Math.max(1,box.width),
      (areaHeight*heightCoverage)/Math.max(1,box.height)
    );

    if(original) scale*=1.03;
    if(upcoming) scale*=1.02;

    const naturalWidth=Math.max(1,img.naturalWidth);
    const naturalHeight=Math.max(1,img.naturalHeight);

    /*
      Tous les costumes normaux remontent. Original et À venir sont
      recentrés horizontalement d'après leur silhouette réelle.
    */
    const centerX=areaLeft+(areaWidth/2);
    const verticalRatio=upcoming?0.49:(original?0.45:0.40);
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

    if(visibleLeft<minLeft) left+=minLeft-visibleLeft;
    if(visibleRight>maxRight) left-=visibleRight-maxRight;
    if(visibleTop<minTop) top+=minTop-visibleTop;
    if(visibleBottom>maxBottom) top-=visibleBottom-maxBottom;

    img.dataset.v618Main='1';
    card.dataset.v618Upcoming=upcoming?'1':'0';
    card.dataset.v618Original=original?'1':'0';

    setPx(img,'--v618-left',left);
    setPx(img,'--v618-top',top);
    setPx(img,'--v618-width',naturalWidth*scale);
    setPx(img,'--v618-height',naturalHeight*scale);
  }

  async function refresh(){
    if(!mobile()) return;
    const cards=Array.from(document.querySelectorAll('.costumeTile'));
    await Promise.all(cards.map(card=>fitCard(card)));
  }

  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      refresh();
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',schedule,{once:true});
  }else{
    schedule();
  }

  window.addEventListener('load',schedule,{once:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('orientationchange',schedule);
  window.addEventListener('hashchange',schedule);
  window.addEventListener('popstate',schedule);
  window.addEventListener('mhur:languagechange',schedule);
  document.addEventListener('click',schedule,true);

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  window.MHUR_V618_COSTUMES={
    refresh,
    clearCache(){
      alphaCache.clear();
      schedule();
    }
  };
})();
