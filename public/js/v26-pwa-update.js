(()=>{
  'use strict';
  if(!('serviceWorker' in navigator)||location.protocol!=='https:')return;
  const SCRIPT='/service-worker-v26.js?v=26';
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
      console.warn('MHUR Nexus PWA v26:',error);
    }
  },{once:true});
})();
