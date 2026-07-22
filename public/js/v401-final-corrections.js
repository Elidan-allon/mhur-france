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

  /* Installation PWA : prompt natif quand disponible, raccourci téléchargeable sinon. */
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
  });
  window.addEventListener('appinstalled',()=>{installPrompt=null});

  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const ua=()=>String(navigator.userAgent||'');
  const isIOS=()=>/iphone|ipad|ipod/i.test(ua());
  const isAndroid=()=>/android/i.test(ua());
  const isMac=()=>/macintosh|mac os x/i.test(ua())&&!isIOS();
  const isLinux=()=>/linux/i.test(ua())&&!isAndroid();
  const isFirefox=()=>/firefox\//i.test(ua());
  const isSafari=()=>/safari/i.test(ua())&&!/chrome|chromium|crios|edg|opr|firefox/i.test(ua());
  const isMobile=()=>isIOS()||isAndroid()||/mobile/i.test(ua());
  const english=()=>{try{return (typeof lang!=='undefined'?lang:window.lang)==='en'}catch(_){return false}};
  const tr=(fr,en)=>english()?en:fr;

  function appHomeUrl(){
    try{return new URL('/#home',location.origin).href}catch(_){return location.href.split('#')[0]+'#home'}
  }

  function downloadShortcut(){
    if(isMobile())return false;
    const url=appHomeUrl();
    let name='MHUR-France.url';
    let type='application/internet-shortcut;charset=utf-8';
    let content=`[InternetShortcut]\r\nURL=${url}\r\nIconFile=${location.origin}/favicon.ico\r\nIconIndex=0\r\n`;

    if(isMac()){
      name='MHUR Nexus.webloc';
      type='application/xml;charset=utf-8';
      const safe=url.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      content=`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>URL</key><string>${safe}</string></dict></plist>`;
    }else if(isLinux()){
      name='MHUR-France.html';
      type='text/html;charset=utf-8';
      const safe=url.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      content=`<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${safe}"><title>MHUR Nexus</title><p><a href="${safe}">Open MHUR Nexus</a></p>`;
    }

    const blob=new Blob([content],{type});
    const objectUrl=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=objectUrl;
    link.download=name;
    link.style.display='none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);
    return true;
  }

  function installHelp(shortcutDownloaded=false){
    let box=document.getElementById('v401InstallHelp');
    if(!box){
      box=document.createElement('div');
      box.id='v401InstallHelp';
      box.className='v401InstallHelp';
      box.hidden=true;
      box.innerHTML='<section class="v401InstallCard" role="dialog" aria-modal="true"><button class="v401InstallClose" type="button" aria-label="Close">×</button><h2></h2><div class="v401InstallText"></div><div class="v401InstallActions"><button class="v401InstallDownload" type="button"></button><button class="v401InstallOk" type="button"></button></div></section>';
      box.querySelector('.v401InstallClose').onclick=()=>box.hidden=true;
      box.querySelector('.v401InstallOk').onclick=()=>box.hidden=true;
      box.querySelector('.v401InstallDownload').onclick=()=>{
        if(downloadShortcut())installHelp(true);
      };
      box.onclick=event=>{if(event.target===box)box.hidden=true};
      document.body.appendChild(box);
    }

    const title=box.querySelector('h2');
    const text=box.querySelector('.v401InstallText');
    const download=box.querySelector('.v401InstallDownload');
    const ok=box.querySelector('.v401InstallOk');
    title.textContent=tr('Installer MHUR Nexus','Install MHUR Nexus');
    ok.textContent=tr('Fermer','Close');
    download.textContent=tr('Télécharger le raccourci','Download shortcut');
    download.hidden=isMobile();

    let html='';
    if(isIOS()){
      html=tr('Dans <b>Safari</b>, touche <b>Partager</b>, puis <b>Sur l’écran d’accueil</b>.','In <b>Safari</b>, tap <b>Share</b>, then <b>Add to Home Screen</b>.');
    }else if(isAndroid()){
      html=tr('Ouvre le menu du navigateur puis choisis <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>.','Open the browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.');
    }else if(isMac()&&isSafari()){
      html=tr('Dans Safari, ouvre le menu <b>Fichier</b> puis choisis <b>Ajouter au Dock</b>.','In Safari, open the <b>File</b> menu, then choose <b>Add to Dock</b>.');
    }else if(isFirefox()){
      html=tr('Firefox ne propose pas toujours l’installation automatique. Utilise le raccourci téléchargé pour ouvrir MHUR Nexus directement.','Firefox does not always offer automatic installation. Use the downloaded shortcut to open MHUR Nexus directly.');
    }else{
      html=tr('Ton navigateur n’a pas affiché la fenêtre native. Tu peux utiliser son menu <b>Installer l’application</b> ou ouvrir le raccourci téléchargé.','Your browser did not show the native prompt. Use its <b>Install app</b> menu or open the downloaded shortcut.');
    }
    if(shortcutDownloaded&&!isMobile()){
      html=`<p>${html}</p>`+tr('<p class="v401InstallSuccess">✅ Le raccourci MHUR Nexus a été téléchargé.</p>','<p class="v401InstallSuccess">✅ The MHUR Nexus shortcut was downloaded.</p>');
    }else{
      html=`<p>${html}</p>`;
    }
    text.innerHTML=html;
    box.hidden=false;
  }

  async function waitForInstallPrompt(timeout=900){
    if(installPrompt)return installPrompt;
    return new Promise(resolve=>{
      const started=Date.now();
      const timer=setInterval(()=>{
        if(installPrompt||Date.now()-started>=timeout){clearInterval(timer);resolve(installPrompt||null)}
      },60);
    });
  }

  async function install(){
    if(standalone())return;
    if('serviceWorker'in navigator&&location.protocol==='https:'){
      try{
        const registration=await navigator.serviceWorker.register('/service-worker.js?v=406',{scope:'/',updateViaCache:'none'});
        await registration.update().catch(()=>{});
        await navigator.serviceWorker.ready;
      }catch(_){ }
    }

    const prompt=installPrompt||await waitForInstallPrompt();
    if(prompt){
      installPrompt=null;
      try{await prompt.prompt();await prompt.userChoice}catch(_){ }
      return;
    }

    const downloaded=downloadShortcut();
    installHelp(downloaded);
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest('#drawer [data-v395-key="install"],#drawer [data-mhur-install]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();closeDrawer();install();
  },true);

  document.addEventListener('DOMContentLoaded',()=>{wireRoutes();setTimeout(wireRoutes,80);setTimeout(wireRoutes,500)},{once:true});
  window.addEventListener('hashchange',()=>setTimeout(refresh,0));
  window.addEventListener('load',()=>setTimeout(wireRoutes,50),{once:true});
  window.MHUR_V401={activate,refresh,install,downloadShortcut};
})();
