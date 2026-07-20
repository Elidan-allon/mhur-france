/* V401 — navigation, retours, Tier List, menu et installation. */
(()=>{
  'use strict';
  let activeKey='home';
  let installPrompt=null;
  let tierDragging=false;

  const navKey=node=>node?.dataset?.v395Key||node?.dataset?.page||node?.dataset?.mhurFinalNav||'';
  function activate(key){
    if(!key)return;
    activeKey=key;
    const drawer=document.getElementById('drawer');
    if(!drawer)return;
    drawer.querySelectorAll('.navItem').forEach(node=>{
      const yes=navKey(node)===key;
      node.classList.toggle('active',yes);
      if(yes)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');
    });
  }

  function infer(){
    const hash=(location.hash||'').replace(/^#/,'').split(/[?&]/)[0];
    if(hash==='mods')return 'mods';
    if(document.querySelector('.mhurTierPage'))return 'tier';
    try{if(typeof page!=='undefined'&&page)return String(page)}catch(_){}
    return hash||activeKey||'home';
  }

  function refresh(){activate(infer())}

  function closeDrawer(){document.getElementById('drawer')?.classList.remove('open')}

  /* Rend les anciens boutons Retour fiables même lorsqu'un autre patch intercepte le clic. */
  document.addEventListener('click',event=>{
    const back=event.target.closest('button.back,button.mhurTierBack');
    if(!back||back.dataset.v401BackRunning==='1')return;
    const handler=back.onclick;
    if(typeof handler==='function'){
      event.preventDefault();
      event.stopImmediatePropagation();
      back.dataset.v401BackRunning='1';
      try{handler.call(back,event)}finally{delete back.dataset.v401BackRunning}
      setTimeout(refresh,0);
    }
  },true);

  /* Un seul onglet actif et fermeture du menu au clic extérieur. */
  document.addEventListener('click',event=>{
    const item=event.target.closest('#drawer .navItem');
    if(item){
      const key=navKey(item);
      if(key)activate(key);
      setTimeout(closeDrawer,0);
      return;
    }
    const drawer=document.getElementById('drawer');
    if(drawer?.classList.contains('open')&&!event.target.closest('#drawer,.menuBtn'))closeDrawer();
  },true);

  /* Corrige aussi les ouvertures lancées depuis d'autres boutons du site. */
  function wrapOpen(object,name,key){
    if(!object||typeof object[name]!=='function'||object[name].__v401)return;
    const old=object[name];
    const wrapped=function(){activate(key);closeDrawer();return old.apply(this,arguments)};
    wrapped.__v401=true;object[name]=wrapped;
  }
  function wireRoutes(){
    wrapOpen(window.MHUR_MODS,'open','mods');
    wrapOpen(window.MHUR_HUB?.tier,'open','tier');
    wrapOpen(window.MHUR_HUB?.search,'open','search');
    wrapOpen(window.MHUR_V370,'openLeaderboard','creator');
    refresh();
  }

  /* Auto-défilement de la page pendant un glisser-déposer dans la Tier List. */
  document.addEventListener('dragstart',event=>{
    if(event.target.closest('.mhurTierItem')){
      tierDragging=true;
      document.body.classList.add('v401-tier-dragging');
    }
  },true);
  document.addEventListener('dragend',()=>{
    tierDragging=false;
    document.body.classList.remove('v401-tier-dragging');
  },true);
  document.addEventListener('drop',()=>{
    tierDragging=false;
    document.body.classList.remove('v401-tier-dragging');
  },true);
  document.addEventListener('dragover',event=>{
    if(!tierDragging||!document.querySelector('.mhurTierPage'))return;
    const edge=Math.max(90,Math.min(180,innerHeight*.16));
    let amount=0;
    if(event.clientY<edge)amount=-Math.ceil((edge-event.clientY)/5)-8;
    else if(event.clientY>innerHeight-edge)amount=Math.ceil((event.clientY-(innerHeight-edge))/5)+8;
    if(amount)window.scrollBy(0,amount);
  },true);

  /* Images du tutoriel : chargement seulement à l'ouverture, sans étirement. */
  document.addEventListener('toggle',event=>{
    const tutorial=event.target.closest?.('.modsTutorial');
    if(!tutorial?.open)return;
    tutorial.querySelectorAll('.modsTutorialStepImage').forEach(img=>{
      img.loading='eager';
      img.decoding='async';
    });
  },true);

  /* Installation PWA : vrai prompt si Brave/Chrome le fournit, aide précise sinon. */
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
  });
  window.addEventListener('appinstalled',()=>{installPrompt=null});
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  function installHelp(){
    let box=document.getElementById('v401InstallHelp');
    if(!box){
      box=document.createElement('div');box.id='v401InstallHelp';box.className='v401InstallHelp';box.hidden=true;
      box.innerHTML='<section class="v401InstallCard"><h2>Installer MHUR France</h2><div class="v401InstallText"></div><button type="button">OK</button></section>';
      box.querySelector('button').onclick=()=>box.hidden=true;
      box.onclick=e=>{if(e.target===box)box.hidden=true};
      document.body.appendChild(box);
    }
    const brave=!!navigator.brave||/Brave/i.test(navigator.userAgent);
    const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
    const en=(()=>{try{return (typeof lang!=='undefined'?lang:window.lang)==='en'}catch(_){return false}})();
    let html;
    if(ios)html=en?'In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.':'Dans Safari, touche <b>Partager</b>, puis <b>Sur l’écran d’accueil</b>.';
    else if(brave)html=en?'In Brave, click the install icon at the right of the address bar. If it is hidden, open the <b>☰ menu</b> and choose <b>Install MHUR France</b>.':'Dans Brave, clique sur l’icône d’installation à droite de la barre d’adresse. Si elle est cachée, ouvre le <b>menu ☰</b> puis choisis <b>Installer MHUR France</b>.';
    else html=en?'Open the browser menu and choose <b>Install app</b>.':'Ouvre le menu du navigateur puis choisis <b>Installer l’application</b>.';
    box.querySelector('.v401InstallText').innerHTML=`<p>${html}</p>`;box.hidden=false;
  }
  async function install(){
    if(standalone())return;
    if('serviceWorker'in navigator&&location.protocol==='https:'){
      try{const r=await navigator.serviceWorker.register('/service-worker.js?v=401',{scope:'/',updateViaCache:'none'});await r.update().catch(()=>{});await navigator.serviceWorker.ready}catch(_){}
    }
    if(installPrompt){
      const prompt=installPrompt;installPrompt=null;
      try{await prompt.prompt();await prompt.userChoice}catch(_){}
      return;
    }
    installHelp();
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('#drawer [data-v395-key="install"],#drawer [data-mhur-install]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();closeDrawer();install();
  },true);

  document.addEventListener('DOMContentLoaded',()=>{wireRoutes();setTimeout(wireRoutes,80);setTimeout(wireRoutes,500)},{once:true});
  window.addEventListener('hashchange',()=>setTimeout(refresh,0));
  window.addEventListener('load',()=>setTimeout(wireRoutes,50),{once:true});
  window.MHUR_V401={activate,refresh,install};
})();
