(function(){
'use strict';
function bi(v,en){return (v&&typeof v==='object'&&!Array.isArray(v))?Object.assign({},v,{en:en}):{fr:String(v||''),en:en};}
const Q={
 kendo_assault:[
  ['Stone-throwing Fist','Throws and scatters a massive quantity of rocks using a Gigantified hand.'],
  ['Big Fist Shield','Guards with a Gigantified hand to deflect attacks and projectiles. The guard breaks after taking sustained damage.'],
  ['Big Fist Grip','Steps forward and traps an opponent between two Gigantified hands.']
 ],
 kendo_strike:[
  ['Gale Burst','Fires a shockwave that pierces opponents using Gigantified hands. Hold to charge for a stronger wave.'],
  ['Twin Palm Strike','Dashes in and strikes with a Gigantified palm thrust. It deals more damage as more of the gauge is spent.'],
  ['Whirlwind Fist','Gigantifies both hands and dashes while spinning. Keep holding to continue dashing, then release to attack forward.']
 ],
 nejire_technical:[
  ['Spiraling Wave','Rapidly fires spiraling waves.'],
  ['Spiraling Surge','Fires spiraling waves from both hands. Hold to keep attacking and use aim to change direction.'],
  ['Spiraling Surf','Fires a spiraling shockwave at your feet and uses the recoil to jump high. Hold to charge for a stronger blast and greater height.']
 ],
 nejire_support:[
  ['Spiraling Pike','Fires a spear-shaped twisting shockwave that spreads on impact. Hold to keep firing. The spread shockwave hits allies and restores their GP.'],
  ['Spiraling Fairy','Creates a spiraling shockwave around the user. Hold to keep the shockwave active and move while using it.'],
  ['Spiraling Veil','Deploys a spiraling veil that protects nearby allies and pushes opponents away.']
 ],
 aizawa_technical:[
  ['Binding Cloth: Capture','Restrains an opponent with a binding cloth and pulls them in. Press again while they are restrained to pull them in instantly. Use it in midair to perform a flying kick toward the impact point.'],
  ['Powerhouse Kick Barrage','Dashes forward in the aim direction while unleashing rapid kicks.'],
  ['Binding Cloth: Serpent','Swings the binding cloth around the user to strike opponents in a wide area.']
 ],
 aizawa_strike:[
  ['Binding Cloth: Leap','Binds an opponent and pulls them in. Press again to kick them in the aim direction. Colliding with another opponent or an obstacle deals additional damage.'],
  ['Binding Cloth: Flow Runner','Uses the binding cloth to move quickly and unleash a powerful shockwave attack.'],
  ['Binding Cloth: Instance','Launches the binding cloth around the user and strikes nearby opponents in rapid succession.']
 ],
 endeavor_strike:[
  ['Burning Ray','Fires a heat ray from the hand. Hold to keep firing.'],
  ['Searing Arrow','Throws a flaming arrow that explodes on impact and creates a pillar of fire. The pillar pierces walls and can hit opponents on the other side.'],
  ['Prominence Burn','Emits heat rays from the entire body. Hold to extend the active duration. Aim to adjust direction slightly and hit opponents through walls.']
 ],
 endeavor_assault:[
  ['Inferno Fist: Jet Burn','Shoots flames from the fist that pierce opponents. Flames spread from the impact point and damage anyone they touch.'],
  ['Vanishing Storm','Summons a flame tornado in the aimed area. Hold to expand it into a lingering circular wall of fire that pulls in opponents.'],
  ['Prominence Nova','Releases an enormous burst of fire around the user, damaging and launching nearby opponents.']
 ],
 hawks_rapid:[
  ['Wingbeat','Sends homing feathers toward an opponent. Hold to keep firing. In Aim Mode, the feathers fly in straight lines.'],
  ['Wind Cross','Dashes in the aim direction and enters free flight after hitting an opponent. Press again to slash nearby opponents, or hold to end flight.'],
  ['Storm Wings','Fires feathers that scatter on impact. Hold to increase their speed and gain recoil. Opponents hit are marked and visible through walls to you and your allies.']
 ],
 hawks_strike:[
  ['Cold Wind','Unleashes a tornado with the wings and sends it forward. Hold to make it hit multiple times and launch enemies. At higher levels, it splits into three directions.'],
  ['Slicing Wind','Dashes forward at high speed and slashes with wing blades. Hold to take a stance, then release slashes along the traveled path.'],
  ['Spiral Slash','Rises while spinning and slashes opponents. Hold to increase ascent distance. At higher levels, opponents hit are marked for tracking.']
 ],
 star_and_stripe_strike:[
  ['Diffusion Laser','Grabs a laser from above and hurls it in the aim direction. It pierces opponents and diffuses on impact. Hold to retain the laser for a set time.'],
  ['Zero Air','Turns the air at the target point into a vacuum that pulls enemies toward the center. Hold to adjust the vacuum position.'],
  ['Keraunos','Dashes in the aim direction and launches enemies upward with a punch. On hit, slams down a massive laser together with compressed air.']
 ],
 shigaraki_strike:[
  ['Earth Crack','Decays the ground in the forward direction. Opponents touching the decayed ground are hit repeatedly.'],
  ['Ground Destruction','Decays a wide area around the contact point. Use it in midair to leap up before diving down.'],
  ['Area Glitch','Rushes forward, grabs an opponent, and inflicts Decay while throwing them away.']
 ],
 shigaraki_assault:[
  ['Earth Break','Throws rubble that causes the ground to Decay in a fan shape from the impact point.'],
  ['Grudge Shoot','Decays the area where the rubble lands. Opponents hit suffer damage over time, and the Decay spreads to nearby enemies.'],
  ['Catastrophe','Charges forward while destroying the ground and anything in the path.']
 ],
 shigaraki_technical:[
  ['Thousand-Hand Break','Stretches expanded arms in the aim direction. The attack pierces walls and deals area damage in front when activated.'],
  ['Shake Heaven and Earth','Strikes the ground with countless hands, creating a destructive shockwave over a wide area.'],
  ['Super Regeneration','Activates rapid regeneration, gradually restoring HP and GP for a limited time.']
 ],
 all_for_one_technical:[
  ['Final Blow','Fires a shockwave from the palm that pierces opponents. Hold to charge, lowering speed while increasing power.'],
  ['Manipulative Claw','Extends claws forward to grab opponents and pull them toward the user.'],
  ['Black Field','Creates a dark field that warps opponents within its area toward the user.']
 ],
 all_for_one_strike:[
  ['Gale Rend','Fires five wind blades one after another. Hold to remain airborne while firing continuously.'],
  ['Skybreaker','Calls down lightning that creates shockwaves at the impact points. The first strike hits the center, while the rest land randomly in the area and paralyze opponents.'],
  ['Factor Fusion: I\'ll Punch You','Combines multiple Quirk Factors into a devastating close-range punch.']
 ],
 all_for_one_young_assault:[
  ['Thunder Sepulture','Fires lightning projectiles that explode on impact and damage nearby opponents.'],
  ['Meteor Annihilation','Calls down a massive meteor-like attack that devastates a wide area.'],
  ['Divine Judgment','Unleashes a powerful area attack from above, striking opponents with overwhelming force.']
 ]
};
function apply(){
 if(typeof styles==='undefined')return;
 Object.keys(Q).forEach(function(key){
  const st=styles[key]; if(!st||!Array.isArray(st.skills))return;
  Q[key].forEach(function(entry,i){
   const sk=st.skills[i]; if(!sk)return;
   sk.name=bi(sk.name,entry[0]);
   sk.desc=bi(sk.desc,entry[1]);
  });
 });
}
function wrap(){
 if(typeof render==='function'&&!render.__v381){const base=render;render=function(){apply();return base.apply(this,arguments)};render.__v381=true;}
 if(typeof layout==='function'&&!layout.__v381){const base=layout;layout=function(){apply();return base.apply(this,arguments)};layout.__v381=true;}
}
function boot(){apply();wrap();if(typeof render==='function')render();}
document.addEventListener('DOMContentLoaded',boot,{once:true});
setTimeout(boot,0);
})();
