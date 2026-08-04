/* MHUR Nexus — V644
   Maintient les tableaux « Effets de montée / Level Up Effects »
   tout en haut après chaque rendu ou changement de langue. */
(function(){
  'use strict';

  if(window.MHUR_V644_ALTER_ORDER_LOADED)return;
  window.MHUR_V644_ALTER_ORDER_LOADED=true;

  let queued=false;

  function normalize(value){
    return String(value||'')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[’']/g,' ')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
  }

  function isLevelUpLabel(value){
    const label=normalize(value);

    return /(?:effets?\s*(?:de\s*)?(?:montee|niveau)|(?:montee|progression)\s+(?:de\s+)?l?\s*alter|level\s*[- ]?\s*up\s*effects?|levelup\s*effects?|upgrade\s*effects?)/.test(label);
  }

  function sortContainer(container){
    if(!(container instanceof Element))return false;

    const children=Array.from(container.children);
    const pairs=[];

    for(let index=0;index<children.length;index++){
      const toggle=children[index];

      if(!toggle.matches?.('button.toggle,.toggle'))continue;

      const panel=toggle.nextElementSibling;
      const hasPanel=Boolean(
        panel&&panel.matches?.('.simpleTable')
      );

      pairs.push({
        toggle,
        panel:hasPanel?panel:null,
        priority:isLevelUpLabel(toggle.textContent)
      });

      if(hasPanel)index++;
    }

    const firstPriority=pairs.findIndex(pair=>pair.priority);

    if(firstPriority<=0)return false;

    const priorityPairs=pairs.filter(pair=>pair.priority);

    if(!priorityPairs.length)return false;

    const fragment=document.createDocumentFragment();

    priorityPairs.forEach(pair=>{
      fragment.appendChild(pair.toggle);

      if(pair.panel){
        fragment.appendChild(pair.panel);
      }
    });

    container.prepend(fragment);
    container.dataset.v644AlterOrdered='1';
    return true;
  }

  function sortAll(root=document){
    const containers=[];

    if(root instanceof Element&&root.matches('.tables')){
      containers.push(root);
    }

    root.querySelectorAll?.('.tables').forEach(container=>{
      containers.push(container);
    });

    containers.forEach(sortContainer);
  }

  function schedule(root=document){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      sortAll(root);
    });
  }

  function boot(){
    const app=document.getElementById('app')||document.body;

    sortAll(app);

    new MutationObserver(records=>{
      let relevant=false;

      for(const record of records){
        if(
          record.type==='characterData'||
          record.addedNodes.length||
          record.removedNodes.length
        ){
          relevant=true;
          break;
        }
      }

      if(relevant){
        schedule(app);
      }
    }).observe(app,{
      childList:true,
      subtree:true,
      characterData:true
    });

    window.addEventListener('pageshow',()=>{
      schedule(app);
    });

    window.MHUR_V644_ALTER_ORDER={
      refresh:()=>sortAll(app),
      isLevelUpLabel
    };
  }

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {once:true}
    );
  }else{
    boot();
  }
})();
