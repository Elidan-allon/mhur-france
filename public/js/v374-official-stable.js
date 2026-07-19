(function(){
'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const canonical=[
  ['recherche globale','global search'],['tier list'],['classement createurs','creator leaderboard'],['installation','install app']
];
function keyFor(el){
 const t=norm(el.textContent);
 if(t.includes('classement createur')||t.includes('creator leaderboard'))return 'creator';
 if(t.includes('recherche globale')||t.includes('global search'))return 'search';
 if(t.includes('tier list'))return 'tier';
 if(t.includes('installation')||t.includes('install app'))return 'install';
 return '';
}
let cleaning=false;
function cleanMenu(){
 if(cleaning)return; cleaning=true;
 try{
   const menu=document.querySelector('.sideMenu,.sidebar,#sideMenu,.menuPanel,.navMenu');
   if(!menu)return;
   const seen=new Set();
   [...menu.querySelectorAll('button,a')].forEach(el=>{
     const k=keyFor(el); if(!k)return;
     if(seen.has(k)) el.remove(); else seen.add(k);
   });
 }finally{cleaning=false;}
}
function safeText(v){
 if(v==null)return '';
 if(typeof v==='string')return v;
 if(typeof v==='number')return String(v);
 if(typeof v==='object'){
   const l=(typeof lang!=='undefined'?lang:(localStorage.getItem('lang')||'fr'));
   return safeText(v[l]??v.en??v.fr??v.text??v.description??v.name??'');
 }
 return String(v);
}
window.MHUR_SAFE_TEXT=safeText;
function killObjectObject(){
 document.querySelectorAll('.skillDesc,.specialDesc,.description,.quirkDesc,.skill-description,.cardDescription').forEach(el=>{
   if(/\[object Object\]/i.test(el.textContent||'')) el.textContent='';
 });
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;cleanMenu();killObjectObject();});}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',schedule);
setTimeout(schedule,0);setTimeout(schedule,500);
// Wrap render only once, without recursion.
if(typeof window.render==='function'&&!window.render.__v374){
 const old=window.render;
 const wrapped=function(){const r=old.apply(this,arguments);schedule();return r;};
 wrapped.__v374=true;window.render=wrapped;
}
})();