/* MHUR France V345 — finition builds + traduction des fiches */
(function(){
  'use strict';

  const isEnglish=()=>typeof lang!=='undefined' && lang==='en';
  const escHtml=(v)=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function translateGameText(value){
    if(!isEnglish() || value==null) return value;
    let s=String(value);
    const exact={
      'Niveau':'Level','Effet':'Effect','Dégâts':'Damage','Munitions':'Ammo',
      'Consommation':'Consumption','Recharge':'Reload','Type':'Type','Durée':'Duration',
      'Portée':'Range','Taille':'Size','Endurance':'Endurance','PV':'HP','PG':'GP',
      'Action spéciale':'Special Action','Compétence':'Skill','Rôle':'Role','Style':'Style',
      'Avant':'Before','Après':'After','Charge':'Charge','Projection':'Knockback','Attraction':'Pull'
    };
    if(exact[s]) return exact[s];
    const replacements=[
      [/Effets de montée/gi,'Level-up Effects'],
      [/Valeurs Action spéciale/gi,'Special Action Values'],
      [/Action spéciale/gi,'Special Action'],
      [/Vitesse de rechargement/gi,'Reload Speed'],
      [/Dégâts de finition/gi,'Finishing Damage'],
      [/Dégâts de rotation/gi,'Spin Damage'],
      [/Dégâts/gi,'Damage'],
      [/Munitions/gi,'Ammo'],
      [/Consommation/gi,'Consumption'],
      [/Recharge/gi,'Reload'],
      [/Niveau/gi,'Level'],
      [/Effet/gi,'Effect'],
      [/Portée/gi,'Range'],
      [/Taille/gi,'Size'],
      [/Durée/gi,'Duration'],
      [/Puissance d'attaque/gi,'Attack Power'],
      [/Défense/gi,'Defense'],
      [/Vitesse de déplacement/gi,'Movement Speed'],
      [/Hauteur saut vertical/gi,'Vertical Jump Height'],
      [/PV Max/gi,'Max HP'],
      [/PG Max/gi,'Max GP'],
      [/corps à corps/gi,'melee'],
      [/À compléter/gi,'To be completed'],
      [/Valeurs/gi,'Values']
    ];
    replacements.forEach(([a,b])=>{s=s.replace(a,b)});
    return s;
  }
  window.MHUR_TRANSLATE_GAME_TEXT=translateGameText;

  // Traduction des tableaux de compétences sans modifier les données officielles.
  window.tables=function(ts){
    const ordered=[...ts].sort((a,b)=>(String(b.title).includes('Effets')?1:0)-(String(a.title).includes('Effets')?1:0));
    return `<div class="tables">${ordered.map(tb=>`<button class="toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">${escHtml(translateGameText(tb.title))} ▾</button><div class="simpleTable hidden"><table class="dataTable"><thead><tr>${tb.cols.map(c=>`<th>${escHtml(translateGameText(c))}</th>`).join('')}</tr></thead><tbody>${tb.rows.map(r=>`<tr>${r.map(x=>`<td>${escHtml(translateGameText(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
  };

  window.skillSection=function(k,isSpecial){
    const head=isSpecial?label(k.name):`${k.letter} — ${label(k.name)}`;
    const badge=isSpecial?`<div class="skillTypeBadge">${isEnglish()?'SKILL':'COMPÉTENCE'}</div>`:'';
    return `<div class="skill ${isSpecial?'specialSkill':''}"><div class="skillImgBox">${asset(k.img,label(k.name))}</div><div class="skillText">${badge}<div class="skillBox"><div class="skillHead">${head}</div><div class="skillDesc">${label(k.desc)}</div></div>${k.tables?tables(k.tables):''}</div></div>${k.sub?skillSection(k.sub,false):''}`;
  };

  window.characterDetail=function(s){
    const st=styles[s];
    const ch=characters.find(x=>x.styles.includes(s))||{name:'Izuku Midoriya'};
    const back=isEnglish()?'Back':tr('back');
    const roleLabel=isEnglish()?'Role':'Rôle';
    const styleLabel=isEnglish()?'Style':'Style';
    const quirkLabel=isEnglish()?'Quirks':'Alters';
    return `<button class="back" onclick="selectedStyle=null;if((characters.find(x=>x.id===selectedChar)||{}).styles?.length===1)selectedChar=null;render()">← ${back}</button><div class="charPanel role-${st.role}"><div class="charTop"><div class="portrait">${asset(st.portrait,'portrait')}</div><div class="meta"><h2>${ch.name}</h2><div class="badges">${roleBadge(st.role)}<span class="badge">${isEnglish()?'HP':'PV'} : ${st.pv}</span></div><p><b>${styleLabel} :</b> ${label(st.name)}</p><p>${label(st.description)}</p><p><b>${roleLabel} :</b> ${label(st.roleDesc)}</p></div></div>${skillSection({letter:'SP',...st.special},true)}<h2 class="quirkSectionTitle">${quirkLabel}</h2>${st.skills.map(k=>skillSection(k,false)).join('')}</div>`;
  };

  // Icônes modernes pour favoris et cœurs.
  const iconStar=(filled)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.7l2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 16.9l-5.56 2.92 1.06-6.2L3 9.23l6.22-.9L12 2.7z" ${filled?'fill="currentColor"':'fill="none"'} stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;
  const iconHeart=(filled)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" ${filled?'fill="currentColor"':'fill="none"'} stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>`;

  if(typeof cbHeartHtml==='function'){
    window.cbHeartHtml=function(build,compact=false){
      const liked=cbLikedSet().has(build.id);
      const title=isEnglish()?(liked?'Remove like':'Like'):(liked?'Retirer le cœur':'Ajouter un cœur');
      return `<button class="cbHeart cbIconAction ${liked?'liked':''} ${compact?'compact':''}" title="${title}" aria-label="${title}" onclick="event.stopPropagation();communityToggleHeart('${cbEsc(build.id)}')"><span class="cbActionIcon">${iconHeart(liked)}</span><b>${build.likes_count||0}</b></button>`;
    };
  }
  window.cbFavoriteHtml=function(build){
    const active=window.MHUR_PROFILES?.isFavorite?.(build.id);
    const title=isEnglish()?(active?'Remove from favorites':'Add to favorites'):(active?'Retirer des favoris':'Ajouter aux favoris');
    return `<button class="cbFavorite cbIconAction ${active?'active':''}" title="${title}" aria-label="${title}" onclick="event.stopPropagation();communityToggleFavorite('${cbEsc(build.id)}')"><span class="cbActionIcon">${iconStar(active)}</span></button>`;
  };

  const genericAvatar=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm-7.5 8.5c.55-4.2 3.05-6.3 7.5-6.3s6.95 2.1 7.5 6.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  window.cbAuthorProfile=function(build){
    const p=build.author_profile||{};
    const currentUser=window.MHUR_AUTH?.getUser?.();
    const currentProfile=window.MHUR_AUTH?.getProfile?.();
    if(currentUser && String(build.creator_id||'')===String(currentUser.id||'')){
      return {
        id:currentProfile?.id||currentUser.id,
        username:currentProfile?.username||build.author||'Anonyme',
        avatar_url:currentProfile?.avatar_url||currentUser.user_metadata?.avatar_url||currentUser.user_metadata?.picture||'',
        provider:currentProfile?.provider||currentUser.app_metadata?.provider||''
      };
    }
    return {id:p.id||build.creator_id||'',username:p.username||build.author||'Anonyme',avatar_url:p.avatar_url||'',provider:p.provider||''};
  };
  window.cbAuthorAvatar=function(profile){
    return profile.avatar_url
      ?`<img class="cbAuthorAvatar" src="${cbEsc(profile.avatar_url)}" alt="${cbEsc(profile.username||'')}">`
      :`<span class="cbAuthorAvatar cbAuthorAvatarFallback">${genericAvatar}</span>`;
  };

  // Repeint les cartes visibles après le chargement du profil.
  document.addEventListener('mhur:authchange',()=>{try{cbRefreshVisible?.()}catch(_){}});
})();
