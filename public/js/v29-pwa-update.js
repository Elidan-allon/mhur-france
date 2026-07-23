(()=>{
  'use strict';

  if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;

  const RELEASE='29';
  const SCRIPT=`/service-worker.js?v=${RELEASE}`;
  const RELOAD_KEY=`mhur-pwa-controller-reload-${RELEASE}`;
  let registration=null;
  let updateInProgress=false;

  /* Reload at most once for this release. sessionStorage survives a reload,
     which prevents a controllerchange -> reload -> controllerchange loop. */
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(sessionStorage.getItem(RELOAD_KEY)==='1')return;
    sessionStorage.setItem(RELOAD_KEY,'1');
    location.reload();
  });

  async function requestUpdate(){
    if(!registration||updateInProgress)return;
    updateInProgress=true;
    try{
      await registration.update();
      if(registration.waiting){
        registration.waiting.postMessage({type:'SKIP_WAITING'});
      }
    }catch(error){
      console.warn('MHUR Nexus PWA update:',error);
    }finally{
      updateInProgress=false;
    }
  }

  addEventListener('load',async()=>{
    try{
      /* A single, stable worker URL and scope are used by the entire site. */
      registration=await navigator.serviceWorker.register(SCRIPT,{
        scope:'/',
        updateViaCache:'none'
      });

      if(registration.waiting){
        registration.waiting.postMessage({type:'SKIP_WAITING'});
      }

      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        if(!worker)return;
        worker.addEventListener('statechange',()=>{
          if(worker.state==='installed'&&navigator.serviceWorker.controller){
            registration.waiting?.postMessage({type:'SKIP_WAITING'});
          }
        });
      });

      await requestUpdate();

      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible')requestUpdate();
      });

      addEventListener('online',requestUpdate);
    }catch(error){
      console.warn('MHUR Nexus PWA v29:',error);
    }
  },{once:true});
})();
