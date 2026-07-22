(()=>{
  'use strict';
  if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
  const SCRIPT='/service-worker-v25.js?v=25';
  let reloading=false;

  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloading)return;
    reloading=true;
    location.reload();
  });

  addEventListener('load',async()=>{
    try{
      const registration=await navigator.serviceWorker.register(SCRIPT,{scope:'/',updateViaCache:'none'});
      await registration.update().catch(()=>{});
      registration.waiting?.postMessage({type:'SKIP_WAITING'});
      document.addEventListener('visibilitychange',()=>{
        if(document.visibilityState==='visible')registration.update().catch(()=>{});
      });
    }catch(error){
      console.warn('MHUR Nexus PWA v25:',error);
    }
  },{once:true});
})();
