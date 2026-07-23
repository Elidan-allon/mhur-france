(()=>{
  'use strict';

  const CURRENT='3.6';
  const VERSION_URL='/version.json';
  const CHECK_EVERY=15000;
  const RELOAD_KEY='mhur-live-update-reloaded-version';
  let checking=false;
  let registration=null;

  async function fetchVersion(){
    const response=await fetch(`${VERSION_URL}?t=${Date.now()}`,{
      cache:'no-store',
      headers:{'Cache-Control':'no-cache'}
    });
    if(!response.ok)throw new Error(`version ${response.status}`);
    return response.json();
  }

  async function activateWaitingWorker(){
    if(!registration&&'serviceWorker' in navigator){
      registration=await navigator.serviceWorker.getRegistration('/');
    }
    if(registration){
      await registration.update();
      registration.waiting?.postMessage({type:'SKIP_WAITING'});
    }
  }

  async function checkForSiteUpdate(){
    if(checking||document.visibilityState==='hidden'||!navigator.onLine)return;
    checking=true;
    try{
      const remote=await fetchVersion();
      const remoteVersion=String(remote?.version||'');
      if(!remoteVersion||remoteVersion===CURRENT)return;

      await activateWaitingWorker();

      if(sessionStorage.getItem(RELOAD_KEY)===remoteVersion)return;
      sessionStorage.setItem(RELOAD_KEY,remoteVersion);

      /* Automatic reload: the user never has to press Refresh. */
      location.reload();
    }catch(error){
      console.debug('MHUR Nexus live update check:',error);
    }finally{
      checking=false;
    }
  }

  addEventListener('load',async()=>{
    if('serviceWorker' in navigator&&location.protocol==='https:'){
      try{
        registration=await navigator.serviceWorker.register('/service-worker.js?v=36',{
          scope:'/',
          updateViaCache:'none'
        });
        registration.waiting?.postMessage({type:'SKIP_WAITING'});
      }catch(error){
        console.debug('MHUR Nexus SW v36:',error);
      }
    }

    checkForSiteUpdate();
    setInterval(checkForSiteUpdate,CHECK_EVERY);
  },{once:true});

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')checkForSiteUpdate();
  });
  addEventListener('focus',checkForSiteUpdate);
  addEventListener('online',checkForSiteUpdate);
})();
