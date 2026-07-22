(function(){
'use strict';
const ID='G-86E185WXCT';
const KEY='mhur_ga_consent_v1';
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){dataLayer.push(arguments)};
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
gtag('js',new Date());
gtag('config',ID,{send_page_view:false,anonymize_ip:true});
const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ID);document.head.appendChild(s);
function route(){
  const p=(location.pathname||'/').replace(/\/+$/,'')||'/';
  const h=(location.hash||'').replace(/^#/,'');
  return h&&p==='/'?'/'+h.replace(/^\//,''):p;
}
function pageTitle(){return document.title||'MHUR Nexus'}
function pageView(){if(localStorage.getItem(KEY)!=='granted')return;gtag('event','page_view',{page_title:pageTitle(),page_location:location.href,page_path:route()});}
function track(name,params){if(localStorage.getItem(KEY)!=='granted')return;const clean={};Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')clean[k]=typeof v==='string'?v.slice(0,100):v});gtag('event',name,clean)}
window.MHUR_ANALYTICS={track,pageView,consent(value){localStorage.setItem(KEY,value?'granted':'denied');gtag('consent','update',{analytics_storage:value?'granted':'denied'});if(value)pageView();document.getElementById('mhurAnalyticsConsent')?.remove();}};
function banner(){if(localStorage.getItem(KEY))return;const el=document.createElement('div');el.id='mhurAnalyticsConsent';el.innerHTML='<div><b>Statistiques anonymes</b><span>Autoriser Google Analytics pour nous aider à améliorer MHUR Nexus.</span></div><div><button data-no>Refuser</button><button data-yes>Accepter</button></div>';document.body.appendChild(el);el.querySelector('[data-no]').onclick=()=>MHUR_ANALYTICS.consent(false);el.querySelector('[data-yes]').onclick=()=>MHUR_ANALYTICS.consent(true);}
function init(){const v=localStorage.getItem(KEY);if(v==='granted'){gtag('consent','update',{analytics_storage:'granted'});pageView()}banner();let last=route();setInterval(()=>{const now=route();if(now!==last){last=now;setTimeout(pageView,50)}},500);window.addEventListener('popstate',()=>setTimeout(pageView,50));window.addEventListener('hashchange',()=>setTimeout(pageView,50));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
