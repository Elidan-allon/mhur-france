(function(){
'use strict';
const isEn=()=>((typeof window.lang!=='undefined'?window.lang:localStorage.getItem('lang'))==='en');
const maps={
  fr:{
    'HEROES':'HÉROS','HERO':'HÉROS','SUPER-VILLAINS':'SUPER-VILAINS','VILLAINS':'SUPER-VILAINS','VILLAIN':'SUPER-VILAIN',
    'Assault':'Assaut','Strike':'Attaque','Rapid':'Vitesse','Technical':'Technique','Support':'Soutien',
    'Click to choose the T.U.N.I.N.G.':'Clique pour choisir le T.U.N.I.N.G.',
    'Click a character to view their T.U.N.I.N.G. skills.':'Clique sur un personnage pour voir ses compétences T.U.N.I.N.G.',
    'Memory Fragment of':'Éclat de souvenir de','T.U.N.I.N.G Skill SP':'Compétence T.U.N.I.N.G SP','T.U.N.I.N.G Skill':'Compétence T.U.N.I.N.G',
    'No T.U.N.I.N.G is available for this style.':'Aucun T.U.N.I.N.G renseigné pour ce style.'
  },
  en:{
    'HÉROS':'HEROES','HÉRO':'HERO','SUPER-VILAINS':'SUPER-VILLAINS','SUPER-VILAIN':'VILLAIN',
    'Assaut':'Assault','Attaque':'Strike','Vitesse':'Rapid','Technique':'Technical','Soutien':'Support',
    'Clique pour choisir le T.U.N.I.N.G.':'Click to choose the T.U.N.I.N.G.',
    'Clique sur un personnage pour voir ses compétences T.U.N.I.N.G.':'Click a character to view their T.U.N.I.N.G. skills.',
    'Éclat de souvenir de':'Memory Fragment of','Compétence T.U.N.I.N.G SP':'T.U.N.I.N.G Skill SP','Compétence T.U.N.I.N.G':'T.U.N.I.N.G Skill',
    'Aucun T.U.N.I.N.G renseigné pour ce style.':'No T.U.N.I.N.G is available for this style.'
  }
};
function translateText(text){
  const map=isEn()?maps.en:maps.fr;
  let out=String(text||'');
  for(const [a,b] of Object.entries(map)){
    if(out===a)return b;
    if(out.includes(a))out=out.split(a).join(b);
  }
  return out;
}
function apply(){
  const root=document.querySelector('.tuningsFrame, .tuningCard, [class*="tuningMode"], .styleChoiceCompact');
  if(!root)return;
  document.querySelectorAll('.tuningsFrame *, .tuningCard *, .card.tuningMode *, .styleChoiceCompact *').forEach(el=>{
    if(el.children.length===0 && el.textContent){
      const next=translateText(el.textContent.trim());
      if(next!==el.textContent.trim())el.textContent=next;
    }
    if(el.getAttribute?.('alt'))el.setAttribute('alt',translateText(el.getAttribute('alt')));
  });
}
let queued=false;
const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
window.addEventListener('mhur-language-change',schedule);
document.addEventListener('click',e=>{if(e.target.closest('[data-lang],#langBtn,.langBtn'))setTimeout(schedule,30)},true);
setInterval(schedule,1200);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
