(() => {
  'use strict';

  let queued=false;
  let running=false;

  function currentLanguage(){
    try{
      if(typeof lang!=='undefined' && lang==='en'){
        return 'en';
      }
    }catch(_error){}

    return document.documentElement.lang
      ?.toLowerCase()
      .startsWith('en')
      ?'en'
      :'fr';
  }

  function clean(value){
    return String(value ?? '')
      .replace(/\s+/g,' ')
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


  const TUTORIAL_PAIRS=[
    [
      'Ce tutoriel concerne uniquement la version PC Steam de My Hero Ultra Rumble. Les mods ne fonctionnent pas sur console.',
      'This tutorial is only for the PC Steam version of My Hero Ultra Rumble. Mods do not work on console.'
    ],
    ['Activer l’option de lancement','Enable the launch option'],
    ['Va dans ta bibliothèque Steam.','Go to your Steam library.'],
    ['Fais un clic droit sur My Hero Ultra Rumble.','Right-click My Hero Ultra Rumble.'],
    ['Clique sur Propriétés.','Click Properties.'],
    ['Dans Général, trouve Options de lancement.','In General, find Launch Options.'],
    ['Copie-colle exactement cette commande :','Copy and paste this exact command:'],
    ['Copier','Copy'],
    ['Sans cette commande, le jeu ne chargera pas les mods.','Without this command, the game will not load mods.'],
    ['Ouvrir les fichiers locaux','Open local files'],
    ['Refais un clic droit sur My Hero Ultra Rumble.','Right-click My Hero Ultra Rumble again.'],
    ['Clique sur Gérer.','Click Manage.'],
    ['Puis clique sur Parcourir les fichiers locaux.','Then click Browse local files.'],
    ['Ouvrir HerovsGame','Open HerovsGame'],
    ['Dans le dossier du jeu, double-clique sur','In the game folder, double-click'],
    ['Ouvrir Content puis Paks','Open Content then Paks'],
    ['Dans HerovsGame, ouvre','Inside HerovsGame, open'],
    ['Ensuite, ouvre','Then open'],
    ['Créer le dossier Mods','Create the Mods folder'],
    ['Dans Paks, crée un nouveau dossier.','Inside Paks, create a new folder.'],
    ['Nomme-le exactement','Name it exactly'],
    ['(avec une majuscule).','(with a capital M).'],
    ['Ajouter les fichiers .pak','Add the .pak files'],
    ['Ouvre le dossier Mods.','Open the Mods folder.'],
    ['Place tous les fichiers .pak téléchargés dans ce dossier.','Place all downloaded .pak files in this folder.'],
    ['Lance ensuite le jeu depuis Steam.','Then launch the game from Steam.'],
    ['C’est terminé','You are done'],
    [
      'Si le mod est compatible et correctement installé, il sera chargé automatiquement. Pour retirer un mod, supprime simplement son fichier .pak du dossier Mods.',
      'If the mod is compatible and installed correctly, it will load automatically. To remove a mod, simply delete its .pak file from the Mods folder.'
    ]
  ];

  function translateTextValue(value,language){
    let out=String(value ?? '');

    TUTORIAL_PAIRS.forEach(([fr,en])=>{
      const from=language==='en'?fr:en;
      const to=language==='en'?en:fr;

      if(out.includes(from)){
        out=out.split(from).join(to);
      }
    });

    return out;
  }

  function syncTutorialLanguage(){
    const tutorial=document.querySelector('.modsTutorial');

    if(!tutorial){
      return;
    }

    const language=currentLanguage();

    const walker=document.createTreeWalker(
      tutorial,
      NodeFilter.SHOW_TEXT
    );

    const nodes=[];

    while(walker.nextNode()){
      nodes.push(walker.currentNode);
    }

    nodes.forEach(node=>{
      const next=translateTextValue(
        node.nodeValue,
        language
      );

      if(next!==node.nodeValue){
        node.nodeValue=next;
      }
    });

    tutorial
      .querySelectorAll(
        '.modsTutorialStepImage[data-fr-src][data-en-src]'
      )
      .forEach(image=>{
        const next=
          language==='en'
            ?image.dataset.enSrc
            :image.dataset.frSrc;

        if(next && image.getAttribute('src')!==next){
          image.setAttribute('src',next);
          image.removeAttribute('srcset');
        }
      });
  }


  function roleInfo(role){
    const key=norm(role);

    const values={
      assault:{
        fr:'ASSAUT',
        en:'ASSAULT',
        icon:'assets/roles/role_assault.webp'
      },
      strike:{
        fr:'ATTAQUE',
        en:'STRIKE',
        icon:'assets/roles/role_strike.webp'
      },
      rapid:{
        fr:'VITESSE',
        en:'RAPID',
        icon:'assets/roles/role_rapid.webp'
      },
      technical:{
        fr:'TECHNIQUE',
        en:'TECHNICAL',
        icon:'assets/roles/role_technical.webp'
      },
      support:{
        fr:'SOUTIEN',
        en:'SUPPORT',
        icon:'assets/roles/role_support.webp'
      }
    };

    return values[key] || {
      fr:key.toUpperCase(),
      en:key.toUpperCase(),
      icon:''
    };
  }

  function discountHeading(){
    return [
      ...document.querySelectorAll(
        'h1,h2,h3,h4,strong,div'
      )
    ].find(element=>{
      const value=norm(element.textContent);

      return (
        value.includes('reductions_de_points_personnage') ||
        value.includes('character_point_discounts') ||
        value.includes('entry_cost_discounts')
      );
    }) || null;
  }

  function discountSection(){
    const heading=discountHeading();

    if(!heading){
      return {heading:null,section:null};
    }

    let section=heading.parentElement;

    for(let depth=0;depth<7 && section;depth+=1){
      const text=clean(section.textContent);

      if(
        section.querySelectorAll(
          '.discountCardV296,'+
          '.s18DiscountCardV19,'+
          '.mhurV41DiscountCard'
        ).length>=3
        ||
        (
          section.querySelectorAll('img').length>=3 &&
          /\b\d{1,3}\s*Pts?\.?/i.test(text)
        )
      ){
        return {heading,section};
      }

      section=section.parentElement;
    }

    return {
      heading,
      section:heading.parentElement
    };
  }

  function localizedDiscountName(row){
    return currentLanguage()==='en'
      ?clean(row?.name_en || row?.name || row?.name_fr)
      :clean(row?.name_fr || row?.name || row?.name_en);
  }

  function createDiscountCard(row){
    const card=document.createElement('article');
    card.className='mhurV45DiscountCard';

    const art=document.createElement('div');
    art.className='mhurV45DiscountArt';

    const image=document.createElement('img');
    image.className='mhurV45DiscountImage';
    image.src=String(row?.image || '');
    image.alt=localizedDiscountName(row);
    image.loading='lazy';
    image.decoding='async';

    art.appendChild(image);

    const name=document.createElement('strong');
    name.className='mhurV45DiscountName';
    name.textContent=localizedDiscountName(row);

    const role=roleInfo(row?.role);
    const roleBox=document.createElement('div');
    roleBox.className=
      `mhurV45DiscountRole role-${norm(row?.role)}`;

    if(role.icon){
      const icon=document.createElement('img');
      icon.src=role.icon;
      icon.alt='';
      icon.setAttribute('aria-hidden','true');
      roleBox.appendChild(icon);
    }

    const roleLabel=document.createElement('span');
    roleLabel.textContent=
      currentLanguage()==='en'
        ?role.en
        :role.fr;

    roleBox.appendChild(roleLabel);

    const points=document.createElement('div');
    points.className='mhurV45DiscountPoints';
    points.textContent=`${Number(row?.points || 0)} Pts.`;

    card.append(
      art,
      name,
      roleBox,
      points
    );

    return card;
  }

  function hideOldDiscountRenders(section){
    section.querySelectorAll(
      '.mhurV41DiscountGrid,'+
      '.s18DiscountGridV19,'+
      '.discountGridV296,'+
      '.v559DiscountGrid,'+
      '[class*="discountGrid" i]'
    ).forEach(grid=>{
      if(!grid.classList.contains('mhurV45DiscountGrid')){
        grid.classList.add('mhurV45OldDiscountHidden');
      }
    });

    [...section.children].forEach(child=>{
      if(child.classList?.contains('mhurV45DiscountGrid')){
        return;
      }

      const count=child.querySelectorAll?.(
        '.discountCardV296,'+
        '.s18DiscountCardV19,'+
        '.mhurV41DiscountCard'
      ).length || 0;

      if(count>=3){
        child.classList.add('mhurV45OldDiscountHidden');
      }
    });
  }

  function renderDiscounts(){
    const rows=
      Array.isArray(window.MHUR_HOME_DATA?.discounts)
        ?window.MHUR_HOME_DATA.discounts
        :[];

    if(!rows.length){
      return;
    }

    const {heading,section}=discountSection();

    if(!heading || !section){
      return;
    }

    hideOldDiscountRenders(section);

    let grid=section.querySelector(
      ':scope > .mhurV45DiscountGrid'
    );

    if(!grid){
      grid=document.createElement('div');
      grid.className='mhurV45DiscountGrid';

      heading.insertAdjacentElement(
        'afterend',
        grid
      );
    }

    const signature=JSON.stringify(
      rows.map(row=>[
        localizedDiscountName(row),
        row?.points,
        row?.role,
        row?.image
      ])
    );

    if(grid.dataset.signature===signature){
      return;
    }

    grid.dataset.signature=signature;
    grid.replaceChildren(
      ...rows.map(createDiscountCard)
    );
  }


  function ensureCss(){
    if(document.getElementById('mhur-v45-final-css')){
      return;
    }

    const style=document.createElement('style');
    style.id='mhur-v45-final-css';

    style.textContent=`
      .mhurV45OldDiscountHidden{
        display:none!important;
        visibility:hidden!important;
      }

      .mhurV45DiscountGrid{
        display:grid!important;
        grid-template-columns:repeat(6,minmax(0,1fr))!important;
        gap:12px!important;
        width:100%!important;
        margin:14px 0 28px!important;
        align-items:stretch!important;
      }

      .mhurV45DiscountCard{
        display:grid!important;
        grid-template-rows:190px minmax(54px,auto) 48px 50px!important;
        min-width:0!important;
        overflow:hidden!important;
        border:4px solid #05070c!important;
        border-radius:8px!important;
        background:#11151e!important;
        color:#fff!important;
        text-align:center!important;
        box-sizing:border-box!important;
      }

      .mhurV45DiscountArt{
        width:100%!important;
        height:190px!important;
        overflow:hidden!important;
        display:flex!important;
        align-items:flex-end!important;
        justify-content:center!important;
        background:#17253a!important;
      }

      .mhurV45DiscountImage{
        display:block!important;
        width:100%!important;
        height:100%!important;
        max-width:100%!important;
        max-height:100%!important;
        object-fit:contain!important;
        object-position:center bottom!important;
      }

      .mhurV45DiscountName{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        min-width:0!important;
        padding:8px 7px!important;
        border-top:1px solid #26364d!important;
        background:#11151e!important;
        color:#fff!important;
        font-size:16px!important;
        font-weight:900!important;
        line-height:1.15!important;
        overflow-wrap:anywhere!important;
      }

      .mhurV45DiscountRole{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:8px!important;
        min-width:0!important;
        padding:7px!important;
        background:#29456d!important;
        color:#fff!important;
        font-size:14px!important;
        font-weight:1000!important;
        text-transform:uppercase!important;
      }

      .mhurV45DiscountRole img{
        width:25px!important;
        height:25px!important;
        object-fit:contain!important;
        flex:0 0 auto!important;
      }

      .mhurV45DiscountPoints{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        margin:7px!important;
        min-width:0!important;
        border-radius:4px!important;
        background:#ffe500!important;
        color:#000!important;
        font-size:18px!important;
        font-weight:1000!important;
      }

      @media(max-width:1200px){
        .mhurV45DiscountGrid{
          grid-template-columns:repeat(3,minmax(0,1fr))!important;
        }
      }

      @media(max-width:720px){
        .mhurV45DiscountGrid{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          gap:9px!important;
        }

        .mhurV45DiscountCard{
          grid-template-rows:150px minmax(50px,auto) 44px 46px!important;
        }

        .mhurV45DiscountArt{
          height:150px!important;
        }
      }

      @media(max-width:430px){
        .mhurV45DiscountGrid{
          grid-template-columns:1fr!important;
        }
      }
    `;

    document.head.appendChild(style);
  }


  function refresh(){
    if(running){
      return;
    }

    running=true;

    try{
      ensureCss();
      syncTutorialLanguage();
      renderDiscounts();
    }finally{
      running=false;
    }
  }

  function schedule(){
    if(queued){
      return;
    }

    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      refresh();
    });
  }

  function languageRefresh(){
    setTimeout(()=>{
      try{
        window.MHUR_MODS_RERENDER_LANGUAGE_V45?.();
      }catch(_error){}

      refresh();
    },0);

    setTimeout(refresh,100);
    setTimeout(refresh,300);
  }

  function install(){
    refresh();

    document.addEventListener(
      'click',
      event=>{
        if(event.target.closest('.lang')){
          languageRefresh();
        }
      },
      true
    );

    window.addEventListener(
      'mhur:languagechange',
      languageRefresh
    );

    window.addEventListener(
      'hashchange',
      schedule
    );

    if(document.body){
      const observer=new MutationObserver(
        mutations=>{
          if(
            mutations.some(
              mutation=>
                mutation.addedNodes?.length ||
                mutation.removedNodes?.length
            )
          ){
            schedule();
          }
        }
      );

      observer.observe(
        document.body,
        {
          childList:true,
          subtree:true
        }
      );
    }

    setTimeout(refresh,250);
    setTimeout(refresh,1000);
  }

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      install,
      {once:true}
    );
  }else{
    install();
  }

  window.addEventListener(
    'load',
    ()=>setTimeout(refresh,0),
    {once:true}
  );

  window.MHUR_V45_FINAL={
    refresh,
    syncTutorialLanguage,
    renderDiscounts
  };
})();
