(function(){
'use strict';
const isEN=()=>typeof window.lang!=='undefined'&&window.lang==='en';
const exact=new Map(Object.entries({
  'Infernal':'Hellfire','Élégant':'Elegant','Elegant':'Elegant','Combat':'Combat','Dangereux':'Dangerous',
  'Bleu foncé':'Dark Blue','Bleu ciel':'Sky Blue','Orange':'Orange','Noir':'Black','Rose':'Pink',
  'Crépuscule':'Twilight','Ardent':'Fiery','Érable':'Maple','Marin':'Navy','Horizon':'Horizon','Citronnelle':'Lemongrass',
  'Original':'Original','Vilain':'Villain','Personnage jouable':'Playable character','Nouveau personnage':'New character',
  'Nouveau style':'New style','Personnage':'Character','Alter':'Quirk Skill','Costume':'Costume'
}));
const boundaryPairs=[
  ['Personnage jouable','Playable character'],['Nouveau personnage','New character'],['Nouveau style','New style'],
  ['Bleu foncé','Dark Blue'],['Bleu ciel','Sky Blue'],['Crépuscule','Twilight'],['Citronnelle','Lemongrass'],
  ['Élégant','Elegant'],['Érable','Maple'],['Ardent','Fiery'],['Marin','Navy'],['Rose','Pink'],['Noir','Black']
];
function translate(value){
  let s=String(value??'');
  if(!isEN()||!s.trim())return s;
  const core=s.trim();
  let out=exact.get(core)||core;
  if(out===core){
    for(const [fr,en] of boundaryPairs) out=out.replaceAll(fr,en);
  }
  return s.replace(core,out);
}
function apply(){
  if(!isEN())return;
  const root=document.getElementById('app')||document.body;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node,count=0;
  while((node=walker.nextNode())&&count<12000){
    count++;
    const p=node.parentElement;
    if(!p||p.closest('script,style,textarea,input,select,[contenteditable="true"]'))continue;
    const next=translate(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
  }
  document.querySelectorAll('option').forEach(o=>{const next=translate(o.textContent);if(next!==o.textContent)o.textContent=next});
  // Home release data is rendered from data, so translate its visible labels explicitly.
  document.querySelectorAll('.releaseNamesV299 small,.releaseCaptionV296 small,.releaseNamesV299 b,.releaseCaptionV296 b').forEach(el=>{
    const next=translate(el.textContent);if(next!==el.textContent)el.textContent=next;
  });
}
function schedule(){requestAnimationFrame(()=>{apply();setTimeout(apply,120)});}
function wrap(name){
  const old=window[name];
  if(typeof old!=='function'||old.__v362)return;
  const fn=function(){const result=old.apply(this,arguments);schedule();return result};
  fn.__v362=true;window[name]=fn;
}
wrap('render');wrap('toggleLang');
window.MHUR_V362_TRANSLATE=apply;
window.addEventListener('load',schedule,{once:true});
setTimeout(()=>{wrap('render');wrap('toggleLang');schedule()},250);
})();
