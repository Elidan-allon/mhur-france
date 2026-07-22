/* V429 — tableaux de compétences uniquement, sans aucun code de navigation. */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const frMap=[
    [/Activation Checks(?:\s*\([^)]*\))?/gi,"Vérifications d’activation"],
    [/Heel Drop(?:\s*\([^)]*\))?/gi,'Coup de talon'],
    [/Slamming(?:\s*\([^)]*\))?/gi,'Écrasement'],
    [/Grab(?:\s*\([^)]*\))?/gi,'Saisie'],
    [/Target Detection(?:\s*\([^)]*\))?/gi,'Détection de la cible'],
    [/Ground Impact(?:\s*\([^)]*\))?/gi,'Impact au sol'],
    [/Shockwave(?:\s*\([^)]*\))?/gi,'Onde de choc']
  ];
  function translated(value){
    let text=String(value??'');
    try{
      if(typeof lang!=='undefined'&&lang==='en'){
        return typeof window.MHUR_TRANSLATE_GAME_TEXT==='function'?window.MHUR_TRANSLATE_GAME_TEXT(text):text;
      }
    }catch(_e){}
    for(const [rx,to] of frMap)text=text.replace(rx,to);
    return text.replace(/\s*\([^)]*[\u3040-\u30ff\u3400-\u9fff][^)]*\)/g,'').replace(/\s{2,}/g,' ').trim();
  }
  window.toggleStatsTable=function(button){
    if(!button)return;
    const panel=button.nextElementSibling;
    if(!panel?.classList.contains('simpleTable'))return;
    const opening=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(opening));
    panel.classList.toggle('hidden',!opening);
    panel.hidden=!opening;
    panel.setAttribute('aria-hidden',String(!opening));
    panel.style.setProperty('display',opening?'block':'none','important');
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.skillText .toggle');
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.toggleStatsTable(button);
  },true);
  try{
    tables=function(items){
      const ordered=[...(items||[])].sort((a,b)=>(String(b.title).includes('Effets')?1:0)-(String(a.title).includes('Effets')?1:0));
      return `<div class="tables">${ordered.map(table=>`<button type="button" class="toggle" aria-expanded="false"><span class="statsToggleTitle">${esc(translated(table.title))}</span><span class="statsToggleArrow" aria-hidden="true">▾</span></button><div class="simpleTable hidden" hidden aria-hidden="true" style="display:none!important"><table class="dataTable"><thead><tr>${(table.cols||[]).map(col=>`<th>${esc(translated(col))}</th>`).join('')}</tr></thead><tbody>${(table.rows||[]).map(row=>`<tr>${(row||[]).map(cell=>`<td>${esc(translated(cell))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
    };
  }catch(error){console.error('[V429] impossible de remplacer le rendu des tableaux',error)}
  function normalize(root=document){
    root.querySelectorAll?.('.skillText .toggle').forEach(button=>{
      const panel=button.nextElementSibling;
      if(!panel?.classList.contains('simpleTable'))return;
      if(button.getAttribute('aria-expanded')==='true')return;
      button.setAttribute('aria-expanded','false');
      panel.classList.add('hidden');
      panel.hidden=true;
      panel.setAttribute('aria-hidden','true');
      panel.style.setProperty('display','none','important');
    });
  }
  const start=()=>{
    normalize();
    const app=document.getElementById('app');
    if(app)new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)normalize(node);
    }).observe(app,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
