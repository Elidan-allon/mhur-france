(()=>{
  'use strict';
  const root=document.documentElement;
  const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isStandalone=()=>navigator.standalone===true||window.matchMedia?.('(display-mode: standalone)').matches===true;
  const sync=()=>root.classList.toggle('mhur-ios-standalone',Boolean(isIOS()&&isStandalone()));
  sync();
  addEventListener('pageshow',sync);
  addEventListener('orientationchange',()=>setTimeout(sync,50));
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change',sync);
})();
