(function(){
'use strict';
const RELEASE='373'; window.MHUR_RELEASE=RELEASE;
const isEN=()=>{try{return typeof lang!=='undefined'&&lang==='en'}catch(_){return document.documentElement.lang==='en'}};
const tr=(fr,en)=>isEN()?en:fr;

/* One stable menu pass: remove duplicates, keep every useful entry exactly once. */
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function ensureMenu(){
  const drawer=document.getElementById('drawer'); if(!drawer)return;
  const buttons=[...drawer.querySelectorAll('button,a')];
  const groups={search:[],tier:[],rank:[],install:[]};
  for(const el of buttons){const t=norm(el.textContent);
    if(t.includes('recherche globale')||t.includes('global search'))groups.search.push(el);
    else if(t.includes('tier list'))groups.tier.push(el);
    else if(t.includes('classement createurs')||t.includes('creator ranking')||t.includes('creator leaderboard'))groups.rank.push(el);
    else if(t.includes('installer')||t.includes('install the app')||t.includes('installation indisponible'))groups.install.push(el);
  }
  for(const arr of Object.values(groups))arr.slice(1).forEach(x=>x.remove());
  function make(group,label,click){let el=groups[group][0];if(!el){el=document.createElement('button');el.type='button';el.className='navItem';drawer.appendChild(el)}el.textContent=label;el.onclick=click;return el}
  make('search','🔎 '+tr('Recherche globale','Global search'),e=>{e.preventDefault();window.MHUR_HUB?.search?.open?.()});
  make('tier','🏆 Tier List',e=>{e.preventDefault();window.MHUR_HUB?.tier?.open?.()});
  make('rank','🏅 '+tr('Classement créateurs','Creator ranking'),e=>{e.preventDefault();window.MHUR_V370?.openLeaderboard?.()});
  const install=groups.install[0]; if(install && typeof window.MHUR_V371_WIRE_INSTALL==='function')window.MHUR_V371_WIRE_INSTALL();
}

/* Never show half-French/half-English text. */
const roleEN={strike:'Increases the entire team’s attack power. The effect grows when more teammates use the same role.',assault:'Increases the entire team’s defense. The effect grows when more teammates use the same role.',rapid:'Increases the entire team’s movement speed. The effect grows when more teammates use the same role.',support:'Increases the entire team’s recovery effect. The effect grows when more teammates use the same role.',technical:'Increases the entire team’s reload speed. The effect grows when more teammates use the same role.'};
const exact={
 'Brillant élève de la Filière générale de Yuei aspirant à devenir un Héros. Il neutralise les ennemis à l’aide de son Alter « Lavage de cerveau ».':'A brilliant U.A. General Studies student who aspires to become a Pro Hero. He incapacitates enemies with his Brainwashing Quirk.',
 'Lance un ruban de capture pour attraper un ennemi et le secouer violemment. Appuyer une nouvelle fois sur la commande pendant la prise permet de l’éjecter instantanément.':'Launches a binding cloth to grab an enemy and slam them around. Press the button again during the grab to throw them immediately.',
 'Lance un ruban de capture pour attraper un ennemi et le secouer violemment. Appuyer une nouvelle fois sur la commande pendant la prise permet de l\'éjecter instantanément.':'Launches a binding cloth to grab an enemy and slam them around. Press the button again during the grab to throw them immediately.',
 'Émet un son en direction de la cible. Les ennemis touchés lâchent un butin et sont incapables de bouger pendant un certain temps.':'Sends a sound toward the target. Enemies hit drop an item and are unable to move for a short time.',
 'Durcit et aiguise tout son corps afin d’améliorer son attaque et sa défense. Faites le mâle et le mal en un seul coup !':'Hardens his entire body to improve both attack and defense, then crushes evil with overwhelming force.',
 'Durcit et aiguise tout son corps afin d\'améliorer son attaque et sa défense. Faites le mâle et le mal en un seul coup !':'Hardens his entire body to improve both attack and defense, then crushes evil with overwhelming force.'
};
const frenchWords=/\b(le|la|les|un|une|des|de|du|dans|avec|pour|pendant|ennemi|allié|attaque|défense|dégâts|commande|permet|lance|frappe|réduit|augmente|brillant|élève)\b/i;
function plain(s){return String(s||'').replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
function fallback(skillName){return `Uses ${skillName} as a Quirk Skill.`}
function fixDescriptions(){
  if(typeof styles==='undefined')return;
  for(const st of Object.values(styles)){
    if(!st)continue;
    if(st.roleDesc){const fr=typeof st.roleDesc==='object'?st.roleDesc.fr:String(st.roleDesc||'');const en=roleEN[st.role]||'Provides a team-wide role bonus.';st.roleDesc={fr,en}}
    if(st.description){const fr=typeof st.description==='object'?st.description.fr:String(st.description||'');let en=typeof st.description==='object'?st.description.en:'';if(!en||frenchWords.test(en))en=exact[plain(fr)]||'A playable fighter with a unique Quirk and combat style.';st.description={fr,en}}
    const fix=(obj,name)=>{if(!obj)return;const fr=typeof obj.desc==='object'?obj.desc.fr:String(obj.desc||'');let en=typeof obj.desc==='object'?obj.desc.en:'';const p=plain(fr);if(!en||frenchWords.test(en)||/^Uses .+one of/i.test(en))en=exact[p]||fallback(name||'this ability');obj.desc={fr,en}};
    if(st.special)fix(st.special,typeof st.special.name==='object'?st.special.name.en||st.special.name.fr:st.special.name);
    for(const sk of st.skills||[]){fix(sk,sk.name);if(sk.sub)fix(sk.sub,sk.sub.name)}
  }
}

function translateStatic(){if(!isEN())return;const map={'Personnage jouable':'Playable character','Aucun build pour ce style.':'No build for this style.','Sois le premier à en publier un.':'Be the first to publish one.','Personnage introuvable.':'Character not found.','Retour':'Back'};const root=document.getElementById('app')||document.body;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.nodeValue.trim();if(map[t])n.nodeValue=n.nodeValue.replace(t,map[t])}}
function after(){fixDescriptions();ensureMenu();translateStatic()}
function wrap(name){try{const fn=window[name];if(typeof fn!=='function'||fn.__v373)return;const w=function(){fixDescriptions();const r=fn.apply(this,arguments);setTimeout(after,0);return r};w.__v373=true;window[name]=w;if(typeof globalThis[name]!=='undefined')globalThis[name]=w}catch(_){}}
function boot(){document.documentElement.dataset.release=RELEASE;fixDescriptions();['layout','render','toggleLang'].forEach(wrap);after();setTimeout(after,250)}
document.addEventListener('DOMContentLoaded',boot,{once:true});setTimeout(boot,50);
})();
