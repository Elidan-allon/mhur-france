(()=>{
  if(!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  const KEY='mhur-v19-controller-reload';
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloading) return;
    reloading=true;
    if(sessionStorage.getItem(KEY)!=='1'){
      sessionStorage.setItem(KEY,'1');
      location.reload();
    }
  });
  window.addEventListener('load',async()=>{
    try{
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
      const reg=await navigator.serviceWorker.register('/service-worker.js?v=21',{scope:'/',updateViaCache:'none'});
      await reg.update().catch(()=>{});
      if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
      setInterval(()=>reg.update().catch(()=>{}),60*60*1000);
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})});
      sessionStorage.removeItem(KEY);
    }catch(err){console.warn('MHUR PWA update:',err)}
  },{once:true});
})();
