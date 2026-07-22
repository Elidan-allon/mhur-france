(()=>{
  'use strict';

  const iconSvg={
    discord:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.3 4.4A16.4 16.4 0 0 0 16.2 3l-.5 1.1a15 15 0 0 0-7.4 0L7.8 3a16.6 16.6 0 0 0-4.1 1.4C1.1 8.3.4 12.1.7 15.8a16.8 16.8 0 0 0 5.1 2.6l1.3-1.8c-.7-.3-1.4-.7-2-1.2l.5-.4c3.9 1.8 8.1 1.8 12 0l.5.4c-.6.5-1.3.9-2 1.2l1.3 1.8a16.7 16.7 0 0 0 5.1-2.6c.4-4.3-.7-8-2.2-11.4ZM8.3 13.8c-1.2 0-2.1-1.1-2.1-2.4S7.1 9 8.3 9s2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Zm7.4 0c-1.2 0-2.1-1.1-2.1-2.4S14.5 9 15.7 9s2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z"/></svg>',
    youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z"/></svg>',
    twitch:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2h18v13l-5 5h-4l-3 3H7v-3H2V5l2-3Zm2 4v11h5v3l3-3h4l2-2V4H6v2Zm5 1h2v6h-2V7Zm5 0h2v6h-2V7Z"/></svg>',
    email:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>',
    x:'<span aria-hidden="true">𝕏</span>',
    tiktok:'<span aria-hidden="true">♪</span>',
    website:'🔗'
  };

  const platformLabels={youtube:'YouTube',twitch:'Twitch',discord:'Discord',x:'X',tiktok:'TikTok',email:'E-mail'};
  const flagSvg={
    fr:'<svg viewBox="0 0 3 2" aria-hidden="true"><path fill="#0055a4" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#ef4135" d="M2 0h1v2H2z"/></svg>',
    en:'<svg viewBox="0 0 7410 3900" aria-hidden="true"><path fill="#b22234" d="M0 0h7410v3900H0z"/><path stroke="#fff" stroke-width="300" d="M0 450h7410M0 1050h7410M0 1650h7410M0 2250h7410M0 2850h7410M0 3450h7410"/><path fill="#3c3b6e" d="M0 0h2964v2100H0z"/><g fill="#fff"><circle cx="247" cy="210" r="70"/><circle cx="741" cy="210" r="70"/><circle cx="1235" cy="210" r="70"/><circle cx="1729" cy="210" r="70"/><circle cx="2223" cy="210" r="70"/><circle cx="2717" cy="210" r="70"/><circle cx="494" cy="525" r="70"/><circle cx="988" cy="525" r="70"/><circle cx="1482" cy="525" r="70"/><circle cx="1976" cy="525" r="70"/><circle cx="2470" cy="525" r="70"/></g></svg>',
    jp:'<svg viewBox="0 0 3 2" aria-hidden="true"><path fill="#fff" d="M0 0h3v2H0z"/><circle cx="1.5" cy="1" r=".6" fill="#bc002d"/></svg>',
    br:'<svg viewBox="0 0 10 7" aria-hidden="true"><path fill="#009b3a" d="M0 0h10v7H0z"/><path fill="#ffdf00" d="M5 .7 9.2 3.5 5 6.3.8 3.5z"/><circle cx="5" cy="3.5" r="1.55" fill="#002776"/><path d="M3.65 3.2c1.05-.45 2.25-.3 3.2.35" fill="none" stroke="#fff" stroke-width=".18"/></svg>'
  };
  const flagMarkup=(key,fallback='🌐')=>flagSvg[key]?`<span class="nexusFlagIcon nexusFlag-${esc(key)}">${flagSvg[key]}</span>`:`<span class="nexusFlagEmoji">${esc(fallback)}</span>`;
  const getLang=()=>{
    try{
      if(typeof lang!=='undefined'&&(lang==='en'||lang==='fr'))return lang;
      const stored=localStorage.getItem('mhur_lang')||localStorage.getItem('lang');
      if(stored==='en'||stored==='fr')return stored;
    }catch(_){}
    return String(document.documentElement.lang||'fr').toLowerCase().startsWith('en')?'en':'fr';
  };
  const text=(obj)=>typeof obj==='string'?obj:(obj?.[getLang()]||obj?.fr||obj?.en||'');
  const validUrl=u=>typeof u==='string'&&/^(https?:\/\/|mailto:)/i.test(u.trim());
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let overlay,panel,active=null,history=[];

  function labels(){return getLang()==='en'
    ?{social:'Social networks',youtube:'Content creators',close:'Close',back:'Back',choose:'Choose a language',config:'Link unavailable',open:'Open link',channels:'content creator(s)',empty:'No content creator has been added yet.'}
    :{social:'Réseaux sociaux',youtube:'Créateurs de contenu',close:'Fermer',back:'Retour',choose:'Choisir une langue',config:'Lien indisponible',open:'Ouvrir le lien',channels:'créateur(s) de contenu',empty:'Aucun créateur de contenu ajouté pour le moment.'};
  }

  function serviceIcon(type){return `<span class="nexusServiceIcon ${esc(type||'website')}">${iconSvg[type]||iconSvg.website}</span>`}
  function close(){active=null;history=[];overlay?.classList.remove('is-open');document.querySelectorAll('.nexusHeaderBtn').forEach(b=>b.setAttribute('aria-expanded','false'))}
  function open(type,button){active=type;history=[];document.querySelectorAll('.nexusHeaderBtn').forEach(b=>b.setAttribute('aria-expanded',String(b===button)));renderRoot();overlay.classList.add('is-open')}
  function shell(title,body,back=false){const l=labels();panel.innerHTML=`<div class="nexusLinksTitle"><span>${esc(title)}</span><button class="nexusLinksClose" type="button" aria-label="${esc(l.close)}">×</button></div>${back?`<button class="nexusBackBtn" type="button">← ${esc(l.back)}</button>`:''}${body}`;panel.querySelector('.nexusLinksClose').onclick=close;panel.querySelector('.nexusBackBtn')?.addEventListener('click',()=>{const fn=history.pop();fn?fn():renderRoot()})}

  function linkRow(item){
    const ok=validUrl(item.url),label=text(item.label)||item.name||'Lien',note=text(item.note||item.description),target=item.type==='email'?'':' target="_blank" rel="noopener noreferrer"';
    const icon=item.avatar
      ?`<img class="nexusChannelAvatar" src="${esc(item.avatar)}" alt="" loading="lazy">`
      :serviceIcon(item.type);
    return `${ok?`<a class="nexusLinkRow" href="${esc(item.url)}"${target}>`:'<div class="nexusLinkRow is-disabled">'}${icon}<span class="nexusLinkText"><b>${esc(label)}</b><small>${esc(note||labels().config)}</small></span><span class="nexusLinkArrow">${ok?'↗':'⚙'}</span>${ok?'</a>':'</div>'}`;
  }

  function creatorCard(item,langKey,flag){
    const links=Object.entries(item.links||{}).filter(([,url])=>validUrl(url));
    const avatar=item.avatar
      ?`<img class="nexusCreatorAvatar" src="${esc(item.avatar)}" alt="${esc(item.name)}" loading="lazy">`
      :`<span class="nexusCreatorAvatar nexusCreatorInitials">${esc((item.name||'?').trim().slice(0,2).toUpperCase())}</span>`;
    const buttons=links.map(([type,url])=>`<a class="nexusPlatformBtn is-${esc(type)}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(platformLabels[type]||type)} — ${esc(item.name)}">${serviceIcon(type)}<span>${esc(platformLabels[type]||type)}</span></a>`).join('');
    return `<article class="nexusCreatorCard">${avatar}<div class="nexusCreatorInfo"><div class="nexusCreatorHeading"><h3>${esc(item.name)}</h3><span class="nexusCreatorFlag">${flagMarkup(langKey,flag)}</span></div><p>${esc(text(item.description))}</p><div class="nexusCreatorLinks">${buttons}</div></div></article>`;
  }

  function renderRoot(){
    const data=window.MHUR_NEXUS_LINKS||{};
    if(active==='social'){
      const rows=(data.social||[]).map(linkRow).join('');
      shell(labels().social,rows||`<div class="nexusEmptyHint">${esc(labels().config)}</div>`);
      return;
    }
    const langs=data.youtubers||{};
    const rows=Object.entries(langs).map(([key,v])=>`<button type="button" class="nexusLanguageRow" data-lang-key="${esc(key)}"><span class="nexusServiceIcon nexusLanguageFlag">${flagMarkup(key,v.flag)}</span><span class="nexusLinkText"><b>${esc(text(v.label)||key)}</b><small>${(v.channels||[]).length} ${esc(labels().channels)}</small></span><span class="nexusLinkArrow">›</span></button>`).join('');
    shell(`${labels().youtube} · ${labels().choose}`,rows);
    panel.querySelectorAll('[data-lang-key]').forEach(btn=>btn.onclick=()=>renderChannels(btn.dataset.langKey));
  }

  function renderChannels(key){
    const group=window.MHUR_NEXUS_LINKS?.youtubers?.[key];
    if(!group)return;
    history.push(renderRoot);
    const cards=(group.channels||[]).map(x=>creatorCard(x,key,group.flag)).join('');
    shell(`${text(group.label)}`,cards?`<div class="nexusCreatorGrid">${cards}</div>`:`<div class="nexusEmptyHint">${esc(labels().empty)}</div>`,true);
  }

  function refreshLanguage(){
    const l=labels();
    const socialBtn=document.querySelector('[data-nexus-menu="social"] .nexusHeaderBtnLabel');
    const creatorsBtn=document.querySelector('[data-nexus-menu="youtube"] .nexusHeaderBtnLabel');
    if(socialBtn)socialBtn.textContent=l.social;
    if(creatorsBtn)creatorsBtn.textContent=l.youtube;
    if(overlay?.classList.contains('is-open'))renderRoot();
  }

  function mount(){
    const header=document.querySelector('header.top');
    if(!header||document.querySelector('.nexusHeaderLinks'))return;
    const l=labels();
    const wrap=document.createElement('div');
    wrap.className='nexusHeaderLinks';
    wrap.innerHTML=`<button type="button" class="nexusHeaderBtn" data-nexus-menu="social" aria-expanded="false"><span class="nexusHeaderIcon">🌐</span><span class="nexusHeaderBtnLabel">${esc(l.social)}</span><span class="nexusHeaderChevron">▼</span></button><button type="button" class="nexusHeaderBtn" data-nexus-menu="youtube" aria-expanded="false"><span class="nexusHeaderIcon">🎬</span><span class="nexusHeaderBtnLabel">${esc(l.youtube)}</span><span class="nexusHeaderChevron">▼</span></button>`;
    header.appendChild(wrap);
    overlay=document.createElement('div');
    overlay.className='nexusLinksOverlay';
    overlay.innerHTML='<div class="nexusLinksBackdrop"></div><div class="nexusLinksPanel" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(overlay);
    panel=overlay.querySelector('.nexusLinksPanel');
    overlay.querySelector('.nexusLinksBackdrop').onclick=close;
    wrap.querySelectorAll('[data-nexus-menu]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const type=btn.dataset.nexusMenu;if(active===type&&overlay.classList.contains('is-open'))close();else open(type,btn)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }

  document.addEventListener('DOMContentLoaded',mount,{once:true});
  window.addEventListener('load',mount,{once:true});
  setTimeout(mount,200);
  document.addEventListener('click',e=>{if(e.target.closest('#langBtn,.langBtn,[data-lang],.lang'))setTimeout(refreshLanguage,80)});
  new MutationObserver(refreshLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('storage',e=>{if(e.key==='mhur_lang'||e.key==='lang')refreshLanguage()});
})();
