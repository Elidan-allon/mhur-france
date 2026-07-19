(function(){
'use strict';
function bi(v,en){return (v&&typeof v==='object'&&!Array.isArray(v))?Object.assign({},v,{en:en}):{fr:String(v||''),en:en};}
const roleEN={
 assault:'Gives your entire team Defense UP! The more teammates with the same role, the stronger the effect!',
 strike:'Gives your entire team Attack Power UP! The more teammates with the same role, the stronger the effect!',
 technical:'Gives your entire team Reload Speed UP! The more teammates with the same role, the stronger the effect!',
 speed:'Gives your entire team Movement Speed UP! The more teammates with the same role, the stronger the effect!',
 support:'Gives your entire team Recovery Item effect UP! The more teammates with the same role, the stronger the effect!'
};
const patches={
 kendo_assault:{name:'Original',description:'Attack and protect with her giant fists! A leader who settles conflicts with her fists!',specialName:'Big Fist Carry',specialDesc:'Carry an ally on a Gigantified hand. Press again to throw the ally in the aim direction.'},
 kendo_strike:{name:'Twin Palm Strike',description:'Attack and protect with her giant fists! A leader who settles conflicts with her fists!',specialName:'Big Fist Carry',specialDesc:'Carry an ally on a Gigantified hand. Press again to throw the ally in the aim direction.'},
 nejire_technical:{name:'Original',description:"With boundless, cheerful energy as her weapon, she blasts out shockwaves packed with spiraling power!",specialName:'Surge',specialDesc:'Performs a midair dash in the movement direction. Use jump while airborne to hover.'},
 nejire_support:{name:'Fairy',description:"With boundless, cheerful energy as her weapon, she blasts out shockwaves packed with spiraling power!",specialName:'Surge',specialDesc:'Performs a midair dash in the movement direction. Use jump while airborne to hover.'},
 aizawa_technical:{name:'Original',description:"Seal your opponent's Quirk and bind them with your cloth! Land sharp strikes while they try to figure out what is going on!",specialName:'Erasure',specialDesc:"Seals the Quirks of opponents visible on screen. It can also interrupt active Quirk Skills."},
 aizawa_strike:{name:'Flow Runner',description:"Seal your opponent's Quirk and bind them with your cloth! Land sharp strikes while they try to figure out what is going on!",specialName:'Erasure',specialDesc:"Seals the Quirks of opponents visible on screen. It can also interrupt active Quirk Skills."},
 endeavor_strike:{name:'Original',description:'Use the flames covering his body to crush opponents in his path and reduce everything around him to ashes!',specialName:'Flight / High Jump',specialDesc:'Flight: use Sprint while airborne to fly and Jump to hover. High Jump: perform a powerful leap to reach higher places.'},
 endeavor_assault:{name:'Inferno Fist',description:'Use the flames covering his body to crush opponents in his path and reduce everything around him to ashes!',specialName:'Flight / High Jump',specialDesc:'Flight: use Sprint while airborne to fly and Jump to hover. High Jump: perform a powerful leap to reach higher places.'},
 hawks_rapid:{name:'Original',description:'A man with exceptional speed and his eyes set on the future! Soar through the sky with unparalleled aerial abilities!',specialName:'Fierce Wings: Carry / Flight',specialDesc:'Carry an ally and fly with them. Press again to set them down. Jump to ascend and crouch to descend. When not carrying an ally, use the gauge to fly freely.'},
 hawks_strike:{name:'Slicing Wind',description:'A man with exceptional speed and his eyes set on the future! Soar through the sky with unparalleled aerial abilities!',specialName:'Fierce Wings: Carry / Flight',specialDesc:'Carry an ally and fly with them. Press again to set them down. Jump to ascend and crouch to descend. When not carrying an ally, use the gauge to fly freely.'},
 star_and_stripe_strike:{name:'Original',description:'An international star from the birthplace of heroes joins the battle! Overcome evil with New Order!',specialName:'Area Reversal',specialDesc:'Creates a protective area around the user. You and nearby allies take no damage from the danger zone and gradually recover HP. Aim at an ally to place the area around them.'},
 shigaraki_strike:{name:'Original',description:'An arrogant king of destruction who disintegrates everything he touches.',specialName:'Destruction Hand',specialDesc:'Destroys a building in a single blow. Hitting an opponent deals damage and lowers their Defense.'},
 shigaraki_assault:{name:'Catastrophe',description:'An arrogant king of destruction who disintegrates everything he touches.',specialName:'Destruction Hand',specialDesc:'Destroys a building in a single blow. Hitting an opponent deals damage and lowers their Defense.'},
 shigaraki_technical:{name:'Thousand-Hand Break',description:'An arrogant king of destruction who disintegrates everything he touches.',specialName:'Destruction Hand',specialDesc:'Destroys a building in a single blow. Hitting an opponent deals damage and lowers their Defense.'},
 all_for_one_technical:{name:'Original',description:"A charismatic villain who steals his opponents' techniques. Master a variety of stolen Quirks and crush your enemies!",specialName:'Plunder',specialDesc:"Finish off a downed opponent and steal their Quirk Skills. Use the Special Action again to switch to the stolen skill set."},
 all_for_one_strike:{name:'Factor Fusion',description:"A charismatic villain who steals his opponents' techniques. Master a variety of stolen Quirks and crush your enemies!",specialName:'Plunder',specialDesc:"Finish off a downed opponent and steal their Quirk Skills. Use the Special Action again to switch to the stolen skill set."},
 all_for_one_young_assault:{name:'Youth Age',description:'The Demon Lord at the dawn of his golden age. Release the full potential of his Quirks and pulverize your opponents!',specialName:'Flight / Void Piercing',specialDesc:"Flight: use Sprint while airborne to fly. Void Piercing: blocks the Special Actions of opponents hit for a set time and passes through walls."}
};
function apply(){
 if(typeof styles==='undefined') return;
 Object.keys(patches).forEach(function(key){
  const s=styles[key],p=patches[key]; if(!s)return;
  s.name=bi(s.name,p.name);
  s.description=bi(s.description,p.description);
  s.roleDesc=bi(s.roleDesc,roleEN[s.role]||'');
  if(s.special){s.special.name=bi(s.special.name,p.specialName);s.special.desc=bi(s.special.desc,p.specialDesc);}
 });
 if(typeof characters!=='undefined'){
  const y=characters.find(c=>c.id==='all_for_one_young'); if(y)y.name='All For One (Youth Age)';
 }
}
function moveInstallLast(){
 const drawer=document.getElementById('drawer'); if(!drawer)return;
 const installs=[...drawer.querySelectorAll('[data-mhur-install], [data-mhur-final-nav="install"]')];
 if(installs.length){
  installs.slice(1).forEach(x=>x.remove());
  drawer.appendChild(installs[0]);
 }
}
function wrap(){
 if(typeof layout==='function'&&!layout.__v380){const base=layout;layout=function(){apply();const r=base.apply(this,arguments);setTimeout(moveInstallLast,0);return r};layout.__v380=true;}
 if(typeof render==='function'&&!render.__v380){const base=render;render=function(){apply();return base.apply(this,arguments)};render.__v380=true;}
}
function boot(){apply();wrap();moveInstallLast();if(typeof render==='function')render();}
document.addEventListener('DOMContentLoaded',boot,{once:true});
setTimeout(boot,0);setTimeout(moveInstallLast,300);setTimeout(moveInstallLast,1000);
})();
