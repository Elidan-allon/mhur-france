(function(){
'use strict';
const stack=[];
function pushScroll(){stack.push({y:window.scrollY,page:typeof page!=='undefined'?page:null,char:typeof selectedChar!=='undefined'?selectedChar:null,style:typeof selectedStyle!=='undefined'?selectedStyle:null});if(stack.length>20)stack.shift()}
function restoreScroll(){const item=stack.pop();const y=item?item.y:0;window.__keepScroll=true;requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:y,left:0,behavior:'auto'})))}
function wrap(name){const fn=window[name];if(typeof fn!=='function'||fn.__v382)return;const w=function(){pushScroll();return fn.apply(this,arguments)};w.__v382=true;window[name]=w}
wrap('selectChar');wrap('selectStyle');
document.addEventListener('click',e=>{
  const back=e.target.closest('.back');
  if(back){restoreScroll();return}
  const card=e.target.closest('[onclick*="selectChar("],[onclick*="selectStyle("]');
  if(card && !(card.closest('.back'))) pushScroll();
},true);
// Re-wrap after scripts rebuild functions.
setInterval(()=>{wrap('selectChar');wrap('selectStyle')},1500);
// Update an already-open auth modal when language changes.
const oldToggle=window.toggleLang;
if(typeof oldToggle==='function'&&!oldToggle.__v382){window.toggleLang=function(){const r=oldToggle.apply(this,arguments);if(document.getElementById('mhurAuthOverlay')?.classList.contains('open'))window.MHUR_AUTH?.open?.();return r};window.toggleLang.__v382=true}
})();