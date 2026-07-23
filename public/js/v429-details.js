/* V429 — tableaux de compétences uniquement, sans aucun code de navigation. */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const frMap=[
    /* Titres et catégories de tableaux. Les expressions longues passent avant les mots seuls. */
    [/Ammo\s*(?:and|&)\s*Reload/gi,'Munitions et recharge'],
    [/Level[- ]?up Effects?/gi,'Effets de montée'],
    [/Base Values?/gi,'Valeurs de base'],
    [/Additional Values?/gi,'Valeurs supplémentaires'],
    [/Special Action Values?/gi,'Valeurs Action spéciale'],
    [/Aim Mode/gi,'Mode visée'],
    [/Short Range/gi,'Distance courte'],
    [/Medium Range/gi,'Distance moyenne'],
    [/Long Range/gi,'Distance longue'],
    [/Max[- ]?Range Hit/gi,'Coup à portée maximale'],
    [/Target Detection(?:\s*\([^)]*\))?/gi,'Détection de la cible'],
    [/Activation Checks?(?:\s*\([^)]*\))?/gi,"Vérifications d’activation"],
    [/Heel Drop(?:\s*\([^)]*\))?/gi,'Coup de talon'],
    [/Ground Shockwave(?:\s*\([^)]*\))?/gi,'Onde de choc au sol'],
    [/Ground Impact(?:\s*\([^)]*\))?/gi,'Impact au sol'],
    [/Aerial Grab(?:\s*\([^)]*\))?/gi,'Saisie aérienne'],
    [/Grab(?:\s*\([^)]*\))?/gi,'Saisie'],
    [/Slamming(?:\s*\([^)]*\))?/gi,'Écrasement'],
    [/Shockwave(?:\s*\([^)]*\))?/gi,'Onde de choc'],
    [/Aerial Attack/gi,'Attaque aérienne'],
    [/Initial Damage/gi,'Dégât initial'],
    [/Final Hit/gi,'Dernier coup'],
    [/Charged Hit/gi,'Coup chargé'],
    [/Charge Finisher/gi,'Finisher de charge'],
    [/First Shockwave/gi,'Première onde de choc'],
    [/Second Shockwave/gi,'Deuxième onde de choc'],
    [/Short Press/gi,'Appui court'],
    [/On Activation/gi,"À l’activation"],
    [/Max Charge/gi,'Charge max'],
    [/Aerial Rush/gi,'Rush aérien'],
    [/Aerial Spin/gi,'Rotation aérienne'],
    [/Binding Charge/gi,'Charge entravante'],
    [/Enhanced Projectile/gi,'Projectile renforcé'],
    [/Levitation Zone/gi,'Zone de lévitation'],
    [/Contact During Charge/gi,'Contact pendant la charge'],
    [/Use Again/gi,'Exécuter de nouveau'],
    [/Deployment/gi,'Déploiement'],
    [/Release/gi,'Relâchement'],
    [/Crouching/gi,'Accroupi'],
    [/Deployed/gi,'Déployée'],
    [/Pillar/gi,'Pilier'],
    [/Melee/gi,'Corps à corps'],
    [/Dive/gi,'Plongée'],
    [/Burn/gi,'Brûlure'],

    /* En-têtes et cellules génériques. */
    [/Use Ammo/gi,'Consommation'],
    [/Reload Speed/gi,'Vitesse de rechargement'],
    [/Down Power/gi,'Puissance de mise au sol'],
    [/Attack Power/gi,"Puissance d’attaque"],
    [/Movement Speed/gi,'Vitesse de déplacement'],
    [/Vertical Jump Height/gi,'Hauteur du saut vertical'],
    [/Max HP/gi,'PV Max'],
    [/Max GP/gi,'PG Max'],
    [/Level Up Effect/gi,'Effet de montée'],
    [/Level/gi,'Niveau'],
    [/Damage/gi,'Dégâts'],
    [/Ammo/gi,'Munitions'],
    [/Reload/gi,'Recharge'],
    [/Consumption/gi,'Consommation'],
    [/Duration/gi,'Durée'],
    [/Range/gi,'Portée'],
    [/Size/gi,'Taille'],
    [/Effect/gi,'Effet'],
    [/Values?/gi,'Valeurs'],
    [/Type/gi,'Type'],
    [/Value/gi,'Valeur'],
    [/Ground/gi,'Sol'],
    [/Hold/gi,'Maintenir'],
    [/Normal/gi,'Normal'],
    [/Quick/gi,'Rapide']
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
