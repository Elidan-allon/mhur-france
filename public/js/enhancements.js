(function(){
'use strict';

function v305ColorOptions(selected=''){
  return [
    ['','Tous'],
    ['yellow','Assaut'],
    ['red','Attaque'],
    ['cyan','Vitesse'],
    ['violet','Technique'],
    ['green','Soutien']
  ].map(([value,name])=>`<option value="${value}" ${selected===value?'selected':''}>${name}</option>`).join('');
}
function v305RarityOptions(selected=''){
  return [
    ['','Toutes'],
    ['PUR','PUR ★★★'],
    ['SR','SR ★★'],
    ['R','R ★'],
    ['C','C']
  ].map(([value,name])=>`<option value="${value}" ${selected===value?'selected':''}>${name}</option>`).join('');
}
window.costumeFilterPanel=function(target='costumes'){
  return `<div class="filterPanel inlineCostumeFilters v305CostumeFilters">
    <h3>Filtres costumes</h3>
    <div class="filterGrid">
      <label>Rareté<select id="slotRarity" onchange="applyCostumeFilter('${target}')">${v305RarityOptions()}</select></label>
      <label>T.U.N.I.N.G SP rapide<select id="slotAny" onchange="applyCostumeFilter('${target}')">${v305ColorOptions()}</select></label>
      <label>SP gauche<select id="slotLeft" onchange="applyCostumeFilter('${target}')">${v305ColorOptions()}</select></label>
      <label>SP droite<select id="slotRight" onchange="applyCostumeFilter('${target}')">${v305ColorOptions()}</select></label>
      <label>Condition droite<select id="slotCond" onchange="applyCostumeFilter('${target}')">
        <option value="">Toutes</option><option>Héros</option><option>Vilain</option><option>Tous</option>
      </select></label>
      <button type="button" class="v305ResetFilter" onclick="resetCostumeFiltersV305('${target}')">Réinitialiser</button>
    </div>
    <p>Tu peux combiner la rareté, les deux emplacements SP et la condition Héros/Vilain.</p>
    <div id="costumeResults"></div>
  </div>`;
};
window.applyCostumeFilter=function(target='costumes'){
  const rarity=document.getElementById('slotRarity')?.value||'';
  const left=document.getElementById('slotLeft')?.value||'';
  const right=document.getElementById('slotRight')?.value||'';
  const cond=document.getElementById('slotCond')?.value||'';
  const any=document.getElementById('slotAny')?.value||'';
  const active=Boolean(rarity||left||right||cond||any);
  const list=getCurrentCostumes().filter(ct=>
    (!rarity||String(ct.rarity||'C').toUpperCase()===rarity)
    &&(!left||ct.spLeft===left)
    &&(!right||ct.spRight===right)
    &&(!cond||String(ct.condition||'Tous')===cond)
    &&(!any||ct.spLeft===any||ct.spRight===any)
  );
  const box=document.getElementById('costumeResults');
  if(box){
    box.innerHTML=active
      ?`<div class="v305FilterCount">${list.length} costume${list.length>1?'s':''}</div><div class="costumeGalleryGrid">${list.map(costumeCard).join('')||'<div class="homeBox">Aucun costume trouvé.</div>'}</div>`
      :'';
  }
  document.querySelectorAll('.costumeGroupsWrap').forEach(el=>el.hidden=active);
};
window.resetCostumeFiltersV305=function(target='costumes'){
  ['slotRarity','slotAny','slotLeft','slotRight','slotCond'].forEach(id=>{
    const el=document.getElementById(id); if(el)el.value='';
  });
  applyCostumeFilter(target);
};
})();
