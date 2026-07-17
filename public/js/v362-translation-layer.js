(function(){
'use strict';
/* V365: lightweight post-render translator. No MutationObserver, no render loop. */
const isEN=()=>{
  try{return typeof lang!=='undefined' && lang==='en';}catch(_){return false;}
};
const exact=new Map(Object.entries({
  'Infernal':'Hellfire',"D'enfer":'Hellfire','Élégant':'Elegant','Elegant':'Elegant','Combat':'Combat','Dangereux':'Dangerous',
  'Bleu foncé':'Dark Blue','Bleu ciel':'Sky Blue','Orange':'Orange','Noir':'Black','Rose':'Pink',
  'Crépuscule':'Twilight','Ardent':'Fiery','Érable':'Maple','Marin':'Navy','Horizon':'Horizon','Citronnelle':'Lemongrass',
  'Original':'Original','Vilain':'Villain','Super-vilain':'Super Villain','Personnage jouable':'Playable character',
  'Nouveau personnage':'New character','Nouveau style':'New style','Personnage':'Character','Alter':'Quirk Skill','Costume':'Costume',
  'Ver. Héros':'Hero Ver.','Héros':'Hero','Super-vilain':'Super Villain',

  /* Common costume family names */
  'Tenue de Héros':'Hero Costume','Tenue de héros':'Hero Costume','Tenue de Cyber-héros':'Cyber Hero Costume',
  'Tenue ordinaire':'Casual Outfit',"Tenue de l'autre monde":'Otherworld Outfit','Cœur vaillant':'Brave Heart',
  'Style décontracté':'Casual Style','Tenue de Super-vilain':'Super Villain Costume','Tenue de Kung-fu':'Kung Fu Outfit',
  'Tenue de Noël':'Christmas Outfit',"Uniforme d'antan":'Old-Fashioned Uniform',"Tenue de soutien d'Alters":'Quirk Support Outfit',
  'Tenue de festival':'Festival Outfit','Volontariat':'Volunteer Outfit','Tenue sportive Yuei':'U.A. Sports Uniform',
  'Costume formel':'Formal Costume','Costume de l’Alliance des Super-vilains':'League of Villains Costume',
  'Tenue de soirée':'Evening Outfit',"Fan d'aventure":'Adventure Fan','Tenue de tous les jours':'Everyday Outfit',
  "Tenue d'été Yuei":'U.A. Summer Uniform','Carte à jouer : Valet de pique':'Playing Card: Jack of Spades',
  'Carte a jouer : Valet de trèfle':'Playing Card: Jack of Clubs','Carte à jouer : Dame de cœur':'Playing Card: Queen of Hearts',
  'Robe chinoise':'Chinese Dress','Festival des héros ver.2019':'Hero Festival Ver. 2019','Jour de repos':'Day Off',
  'Tenue des Sables brûlants':'Scorching Sands Outfit','Tenue de Héros : version α':'Hero Costume: Alpha Ver.',
  'Tenue de Héros : version β':'Hero Costume: Beta Ver.','Pirate ennemi':'Enemy Pirate',"Loisirs d'été":'Summer Leisure',
  'Sans masque':'Maskless','Style cuir':'Leather Style','À visage découvert':'Unmasked','Revêtement intégral à 100 %':'100% Full Cowling',
  'Costume ε':'Costume Epsilon','One For All ver. Bataille décisive':'One For All: Decisive Battle Ver.',
  "Tenue de soutien d'Alters OFA":'OFA Quirk Support Outfit','Tenue de Héros : version hiver':'Hero Costume: Winter Ver.',
  'Tenue de Héros : version All Might':'Hero Costume: All Might Ver.','Sans casque':'Helmetless','Tenue Jiangshi':'Jiangshi Outfit',
  'Sans masque : version α':'Maskless: Alpha Ver.','Armure abyssale':'Abyssal Armor','Sans lunettes':'Without Glasses',
  'Armure céleste':'Celestial Armor',"Tenue d'hiver Yuei":'U.A. Winter Uniform','Tenue de Miss':'Pageant Outfit',
  'Costume de soutien':'Support Costume','Seigneur invincible':'Invincible Lord','Tenue de Héros ver. métallique':'Hero Costume: Metallic Ver.',
  'Tenue de Héros ver. camouflage':'Hero Costume: Camouflage Ver.','Tenue de Héros ver. endommagée':'Hero Costume: Damaged Ver.',
  'Plaqués en arrière':'Slicked Back','Seigneur calme':'Calm Lord','Seigneur tumultueux':'Tempestuous Lord',
  'Un proviseur qui ne lâche rien':'A Never-Give-Up Principal','Seigneur du feu ardent':'Lord of Blazing Fire',
  'Seigneur des bourrasques':'Lord of Gusts','Tenue de Héros ver. Bataille décisive':'Hero Costume: Decisive Battle Ver.',
  "Tenue d'entraînement":'Training Outfit','Éveil':'Awakening','Déguisement : long manteau':'Disguise: Long Coat',
  'Chevalier du mal':'Evil Knight','Évadé de prison':'Prison Escapee','Chevalier diabolique':'Diabolical Knight',
  'Tenue de Super-vilain ver. Standard':'Super Villain Costume: Standard Ver.',
  'Tenue de Super-vilain ver. Rembobinée':'Super Villain Costume: Rewind Ver.',
  'Tenue de Super-vilain : cheveux blancs':'Super Villain Costume: White Hair',
  'Déguisement : Sweat':'Disguise: Sweatshirt','Assassin vengeur':'Vengeful Assassin','Déguisement : Tenue de réunion':'Disguise: Meeting Outfit',
  'Uniforme : Usé':'Uniform: Worn','Déguisement sac en papier':'Paper Bag Disguise','Seigneur de mauvais augure':'Ominous Lord',
  "Blouse d'hôpital":'Hospital Gown','Costume à rayures':'Striped Costume','Costume de soirée':'Evening Costume'
}));
const boundaryPairs=[
  ['Personnage jouable','Playable character'],['Nouveau personnage','New character'],['Nouveau style','New style'],
  ['Bleu foncé','Dark Blue'],['Bleu ciel','Sky Blue'],['Crépuscule','Twilight'],['Citronnelle','Lemongrass'],
  ['Élégant','Elegant'],['Érable','Maple'],['Ardent','Fiery'],['Marin','Navy'],['Rose','Pink'],['Noir','Black'],
  ["D'enfer",'Hellfire'],['Super-vilain','Super Villain'],['Tenue de Héros','Hero Costume'],['Tenue de héros','Hero Costume'],
  ['Bataille décisive','Decisive Battle'],['version hiver','Winter Ver.'],['version α','Alpha Ver.'],['version β','Beta Ver.']
];
function translate(value){
  let s=String(value??'');
  if(!isEN()||!s.trim())return s;
  const core=s.trim();
  let out=exact.get(core)||core;
  if(out===core){for(const [fr,en] of boundaryPairs)out=out.split(fr).join(en);}
  return s.replace(core,out);
}
function apply(){
  if(!isEN())return;
  const root=document.getElementById('app')||document.body;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node,count=0;
  while((node=walker.nextNode())&&count<20000){
    count++;
    const p=node.parentElement;
    if(!p||p.closest('script,style,textarea,input,select,[contenteditable="true"]'))continue;
    const next=translate(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
  }
  document.querySelectorAll('option').forEach(o=>{const next=translate(o.textContent);if(next!==o.textContent)o.textContent=next});
}
function schedule(){requestAnimationFrame(()=>apply());}
function wrap(name){
  const old=window[name];
  if(typeof old!=='function'||old.__v365)return;
  const fn=function(){const result=old.apply(this,arguments);schedule();return result};
  fn.__v365=true;window[name]=fn;
}
wrap('render');wrap('toggleLang');
window.MHUR_V365_TRANSLATE=apply;
window.addEventListener('load',schedule,{once:true});
setTimeout(()=>{wrap('render');wrap('toggleLang');schedule()},250);
})();
