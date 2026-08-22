(() => {
  'use strict';

  const RELEASE_AT = Date.parse('2026-08-19T13:00:00+09:00');
  let queued = false;

  function langNow(){
    try{
      if(typeof lang !== 'undefined' && lang === 'en') return 'en';
    }catch(_error){}
    return document.documentElement.lang?.toLowerCase().startsWith('en')
      ? 'en'
      : 'fr';
  }

  function clean(value){
    return String(value ?? '')
      .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]+/g,'')
      .replace(/\(\s*\)/g,'')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  function norm(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[’']/g,'')
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function charactersNow(){
    try{
      if(typeof characters !== 'undefined' && Array.isArray(characters)){
        return characters;
      }
    }catch(_error){}
    return Array.isArray(window.characters) ? window.characters : [];
  }

  function stylesNow(){
    try{
      if(typeof styles !== 'undefined' && styles && typeof styles === 'object'){
        return styles;
      }
    }catch(_error){}
    return window.styles || {};
  }

  function localizedStyleNames(style){
    const value = style?.name;
    if(value && typeof value === 'object' && !Array.isArray(value)){
      return [clean(value.fr), clean(value.en)].filter(Boolean);
    }
    return [clean(value)].filter(Boolean);
  }

  function twiceSupport(){
    const chars = charactersNow();
    const allStyles = stylesNow();
    const twice = chars.find(character =>
      norm(character?.id) === 'twice' ||
      norm(character?.name) === 'twice'
    );

    if(!twice) return {character:null, styleId:'', style:null};

    let styleId = (twice.styles || []).map(String).find(id => {
      const style = allStyles[id];
      const aliases = localizedStyleNames(style).map(norm);
      return (
        norm(style?.role) === 'support' ||
        aliases.includes('sad_man_s_parade') ||
        aliases.includes('parade_miserable')
      );
    }) || '';

    if(!styleId){
      styleId = Object.keys(allStyles).find(id => {
        const style = allStyles[id];
        return (
          norm(style?.role) === 'support' &&
          (
            /twice/i.test(id) ||
            localizedStyleNames(style).map(norm).some(name =>
              name === 'sad_man_s_parade' ||
              name === 'parade_miserable'
            )
          )
        );
      }) || '';
    }

    return {
      character: twice,
      styleId,
      style: allStyles[styleId] || null
    };
  }

  function twiceOriginalPortrait(){
    const chars = charactersNow();
    const allStyles = stylesNow();
    const twice = chars.find(character =>
      norm(character?.id) === 'twice' ||
      norm(character?.name) === 'twice'
    );

    if(!twice) return '';

    if(twice.portrait) return String(twice.portrait);

    const ids = (twice.styles || []).map(String);
    const originalId = ids.find(id => {
      const style = allStyles[id];
      const aliases = localizedStyleNames(style).map(norm);
      return (
        aliases.includes('original') ||
        (!norm(style?.role) && aliases.length === 0)
      );
    }) || ids[0];

    return String(allStyles[originalId]?.portrait || '');
  }

  function translatePatch(value){
    let out = String(value ?? '')
      .replace(/クリティカル/gi,'Critical')
      .replace(/分身Shot/gi,'Clone Shot');

    out = clean(out);

    if(langNow() === 'en') return out;

    const replacements = [
      [/New Content Added/gi,'Nouveau contenu ajouté'],
      [/Quirk Skill/gi,'Alter'],
      [/Twice\s*["“”']Sad Man['’]s Parade["“”']/gi,'Twice « Parade misérable »'],
      [/Critical Tape Measure/gi,'Rubans critiques'],
      [/Sad Man['’]s Parade/gi,'Parade misérable'],
      [/Help Duplicate/gi,'Soutien-clonage'],
      [/Mad Imitation/gi,'Folle imitation'],
      [/\(Critical\)/gi,'(Critique)'],
      [/\bCritical\b/gi,'Critique'],
      [/\(Near\)/gi,'(Proximité)'],
      [/\bNear\b/gi,'Proximité'],
      [/\(Melee\)/gi,'(Corps à corps)'],
      [/\bMelee\b/gi,'Corps à corps'],
      [/\(Deploy\)/gi,'(Déploiement)'],
      [/\bDeploy\b/gi,'Déploiement'],
      [/\(Set\)/gi,'(Placement)'],
      [/\bSet\b/gi,'Placement'],
      [/\(Body\s*Shot\)/gi,'(Tir corporel)'],
      [/\bBody\s*Shot\b/gi,'Tir corporel'],
      [/\(Clone\s*Shot\)/gi,'(Tir du clone)'],
      [/\bClone\s*Shot\b/gi,'Tir du clone'],
      [/\(Shot\)/gi,'(Tir)'],
      [/\bShot\b/gi,'Tir'],
      [/\bLv\.?\s*(\d+)/gi,'Nv.$1']
    ];

    replacements.forEach(([from,to]) => {
      out = out.replace(from,to);
    });

    return clean(out);
  }

  /* ============================================================
     1. TWICE HOME: INCOMING -> NEW
     ============================================================ */
  function twicePlannedCard(root=document){
    const direct = root.querySelector?.('article[data-planned="twice"]');
    if(direct) return direct;

    const cards = [
      ...(root.querySelectorAll?.(
        '.s18PlannedCardV14,.s18PlannedCardV13,.s18PlannedCardV12'
      ) || [])
    ].filter(card => /\bTwice\b/i.test(clean(card.textContent)));

    return cards[0] || null;
  }

  function makeNewBadge(){
    const badge = document.createElement('span');
    badge.className =
      's18NewBadge s18NewBadgeV9 s18NewBadgeV24 s18NewBadgeV581 s18NewBadgeV42';
    badge.setAttribute('aria-label','NEW');
    badge.textContent = 'NEW!';
    return badge;
  }

  function patchTwiceCard(card){
    if(!card || Date.now() < RELEASE_AT) return;

    card.dataset.planned = 'twice';
    card.dataset.releaseState = 'released';
    card.classList.add('mhurV42TwiceReleased');

    card.querySelectorAll('[class*="s18PlannedIncoming"]').forEach(node => {
      node.remove();
    });

    [...card.querySelectorAll('span,div,b,strong,em')].forEach(node => {
      if(clean(node.textContent) === 'INCOMING'){
        node.remove();
      }
    });

    if(!card.querySelector(':scope > .s18NewBadgeV42')){
      card.insertAdjacentElement('afterbegin', makeNewBadge());
    }

    const textBlock = card.querySelector('.s18PlannedTextV12');
    const small = textBlock?.querySelector('small');
    const em = textBlock?.querySelector('em');

    if(small){
      small.textContent = langNow() === 'fr'
        ? 'Parade misérable · Soutien'
        : "Sad Man's Parade · Support";
    }

    if(em){
      em.textContent = langNow() === 'fr'
        ? 'Disponible depuis le 19 août'
        : 'Available since August 19';
    }

    /* Fallback for markup without .s18PlannedTextV12. */
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      let value = node.nodeValue || '';

      if(langNow() === 'fr'){
        value = value
          .replace(/Sad Man['’]s Parade/gi,'Parade misérable')
          .replace(/Sortie le 19 août/gi,'Disponible depuis le 19 août');
      }else{
        value = value
          .replace(/Parade misérable/gi,"Sad Man's Parade")
          .replace(/Sortie le 19 août|Disponible depuis le 19 août/gi,'Available since August 19');
      }

      node.nodeValue = value;
    });
  }

  function fixIncoming(){
    patchTwiceCard(twicePlannedCard(document));
  }

  function wrapPlannedHtml(){
    const original = window.MHUR_S18_PLANNED_HTML;

    if(typeof original !== 'function' || original.__mhurV42) return;

    const wrapped = function(){
      const html = String(original.apply(this,arguments) || '');

      if(Date.now() < RELEASE_AT || !/\bTwice\b/i.test(html)){
        return html;
      }

      const template = document.createElement('template');
      template.innerHTML = html;
      patchTwiceCard(twicePlannedCard(template.content));
      return template.innerHTML;
    };

    wrapped.__mhurV42 = true;
    wrapped.__mhurV42Original = original;
    window.MHUR_S18_PLANNED_HTML = wrapped;
  }

  /* ============================================================
     2. DISCOUNT CARD: portrait + role + FR name
     ============================================================ */
  function discountCards(){
    return [
      ...document.querySelectorAll(
        '.discountCardV296,.s18DiscountCardV19,.mhurV41DiscountCard'
      )
    ];
  }

  function fixDiscount(){
    const card = discountCards().find(node =>
      /Sad Man['’]s Parade|Parade misérable/i.test(clean(node.textContent))
    );

    if(!card) return;

    const info = twiceSupport();
    const portrait = String(
      info.style?.portrait ||
      info.character?.portrait ||
      ''
    );

    card.dataset.discount = 'sad_man_s_parade';
    card.dataset.role = 'support';
    if(info.styleId) card.dataset.styleId = info.styleId;

    const nameNode =
      card.querySelector('.v559DiscountName,.mhurV41DiscountName') ||
      [...card.querySelectorAll('b,strong')].find(node =>
        /Sad Man['’]s Parade|Parade misérable/i.test(clean(node.textContent))
      );

    if(nameNode){
      nameNode.textContent = langNow() === 'fr'
        ? 'Parade misérable'
        : "Sad Man's Parade";
    }

    if(portrait){
      let image = card.querySelector(
        '.s18DiscountArtV19 img,.mhurV41DiscountImage,img'
      );

      if(image){
        image.src = portrait;
        image.alt = langNow() === 'fr'
          ? 'Twice — Parade misérable'
          : "Twice — Sad Man's Parade";
      }else{
        let holder = card.querySelector(
          '.s18DiscountArtV19,.mhurV42DiscountArt'
        );

        if(!holder){
          holder = document.createElement('div');
          holder.className = 's18DiscountArtV19 mhurV42DiscountArt';
          card.insertAdjacentElement('afterbegin',holder);
        }

        image = document.createElement('img');
        image.src = portrait;
        image.alt = langNow() === 'fr'
          ? 'Twice — Parade misérable'
          : "Twice — Sad Man's Parade";

        holder.replaceChildren(image);
      }
    }

    const label = langNow() === 'fr' ? 'SOUTIEN' : 'SUPPORT';
    let role = card.querySelector(
      '.v559RoleBadge,.mhurV41DiscountRole,.mhurV42DiscountRole'
    );

    if(role){
      role.textContent = label;
      role.classList.add('mhurV42DiscountRole');
    }else{
      role = document.createElement('div');
      role.className = 'mhurV42DiscountRole';

      const icon = document.createElement('img');
      icon.src = 'assets/roles/role_support.webp';
      icon.alt = label;

      const span = document.createElement('span');
      span.textContent = label;

      role.append(icon,span);

      const points = card.querySelector(
        '.v559DiscountPoints,.mhurV41DiscountPoints'
      );

      if(points){
        points.insertAdjacentElement('beforebegin',role);
      }else{
        card.appendChild(role);
      }
    }
  }

  /* ============================================================
     3. PATCH NOTES: translate raw new-content + Twice portrait
     ============================================================ */
  function patchMain(){
    const modal = document.getElementById('s18NotesDevModalV10');

    if(modal){
      return modal.querySelector('.s18NotesBodyV10 > main');
    }

    return [...document.querySelectorAll('main,section,div')].find(node =>
      /Patch Notes\s*\/\s*Dev Notes/i.test(clean(node.textContent)) &&
      /Critical Tape Measure|Sad Man['’]s Parade|Help Duplicate/i.test(clean(node.textContent))
    ) || null;
  }

  function fixPatchNotes(){
    const main = patchMain();
    if(!main) return;

    const allText = clean(main.textContent);
    if(
      !/Twice|Critical Tape Measure|Sad Man['’]s Parade|Help Duplicate|Rubans critiques|Parade misérable|Soutien-clonage/i
        .test(allText)
    ){
      return;
    }

    const walker = document.createTreeWalker(main,NodeFilter.SHOW_TEXT);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const value = node.nodeValue || '';

      if(
        /New Content Added|Quirk Skill|Critical Tape Measure|Sad Man['’]s Parade|Help Duplicate|クリティカル|分身Shot|Critical|Near|Melee|Deploy|Set|BodyShot|Clone Shot|\bShot\b/i
          .test(value)
      ){
        node.nodeValue = translatePatch(value);
      }
    });

    const portrait = twiceOriginalPortrait();
    if(!portrait) return;

    /*
      The current new-content block places the Support-role icon before
      the raw list. Replace that visual with the real original Twice portrait.
    */
    const entries = [
      ...main.querySelectorAll(
        '.s18NewContentV593 article,.s18NewContentEntryV42,article'
      )
    ].filter(article =>
      /\bTwice\b|Rubans critiques|Critical Tape Measure/i.test(clean(article.textContent))
    );

    if(entries.length){
      entries.forEach(article => {
        let holder = article.querySelector('.s18NewContentPortraitV42');

        if(!holder){
          holder = document.createElement('div');
          holder.className = 's18NewContentPortraitV42';
          article.insertAdjacentElement('afterbegin',holder);
        }

        let image = holder.querySelector('img');
        if(!image){
          image = document.createElement('img');
          holder.appendChild(image);
        }

        image.src = portrait;
        image.alt = 'Twice';

        article.querySelectorAll('img').forEach(other => {
          if(other === image) return;
          const src = String(other.getAttribute('src') || '');
          if(/role_support|support|action_icon_mark/i.test(src)){
            other.remove();
          }
        });
      });
    }else{
      const firstImage = main.querySelector('img');

      if(firstImage){
        const src = String(firstImage.getAttribute('src') || '');
        if(
          /role_support|support|action_icon_mark/i.test(src) ||
          firstImage.width < 180
        ){
          firstImage.src = portrait;
          firstImage.alt = 'Twice';
        }
      }
    }
  }

  function ensureCss(){
    if(document.getElementById('mhur-v42-final-css')) return;

    const style = document.createElement('style');
    style.id = 'mhur-v42-final-css';
    style.textContent = `
      article[data-planned="twice"].mhurV42TwiceReleased [class*="s18PlannedIncoming"],
      .mhurV42TwiceReleased [class*="s18PlannedIncoming"]{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
      }

      article[data-planned="twice"] > .s18NewBadgeV42,
      .mhurV42TwiceReleased > .s18NewBadgeV42{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
        position:absolute!important;
        z-index:130!important;
        top:8px!important;
        right:10px!important;
        left:auto!important;
        width:88px!important;
        height:44px!important;
        background:transparent url('assets/home/icons/new_badge_custom.png') center/contain no-repeat!important;
        color:transparent!important;
        text-indent:-9999px!important;
        animation:mhurNewPulseV581 .9s ease-in-out infinite!important;
      }

      .mhurV42DiscountRole{
        min-height:48px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:9px!important;
        padding:7px 8px!important;
        background:#29456d!important;
        color:#fff!important;
        font-weight:900!important;
        text-transform:uppercase!important;
      }

      .mhurV42DiscountRole img{
        width:28px!important;
        height:28px!important;
        object-fit:contain!important;
      }

      .s18NewContentEntryV42{
        display:grid!important;
        grid-template-columns:112px minmax(0,1fr)!important;
        gap:16px!important;
        align-items:start!important;
      }

      .s18NewContentPortraitV42{
        width:106px!important;
        height:106px!important;
        border:3px solid #31557f!important;
        border-radius:14px!important;
        overflow:hidden!important;
        background:#07101f!important;
      }

      .s18NewContentPortraitV42 img{
        width:100%!important;
        height:100%!important;
        object-fit:contain!important;
        object-position:center bottom!important;
      }

      @media(max-width:650px){
        .s18NewContentEntryV42{
          grid-template-columns:82px minmax(0,1fr)!important;
          gap:10px!important;
        }

        .s18NewContentPortraitV42{
          width:78px!important;
          height:78px!important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function refresh(){
    [
      ensureCss,
      wrapPlannedHtml,
      fixIncoming,
      fixDiscount,
      fixPatchNotes
    ].forEach(task => {
      try{
        task();
      }catch(error){
        console.warn('[MHUR V42]',task.name,error);
      }
    });
  }

  function schedule(){
    if(queued) return;

    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refresh();
    });
  }

  function install(){
    refresh();

    if(document.body){
      const observer = new MutationObserver(mutations => {
        if(mutations.some(mutation =>
          mutation.addedNodes?.length ||
          mutation.removedNodes?.length
        )){
          schedule();
        }
      });

      observer.observe(document.body,{
        childList:true,
        subtree:true
      });
    }

    window.addEventListener('hashchange',schedule);
    window.addEventListener('mhur:languagechange',schedule);

    setTimeout(refresh,150);
    setTimeout(refresh,650);
    setTimeout(refresh,1600);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }

  window.addEventListener('load',() => setTimeout(refresh,0),{once:true});

  window.MHUR_V42_FINAL = {refresh};
})();
