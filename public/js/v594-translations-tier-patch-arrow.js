
/* MHUR Nexus — V594 : traductions anglaises complètes + Tier NEW */
(function(){
  'use strict';

  const VERSION='594';
  const NEW_IMAGE='/assets/home/icons/new_badge_custom.png';
  const originalText=new WeakMap();
  const originalAttributes=new WeakMap();
  const tuningSnapshots=new WeakMap();

  function currentLanguage(){
    try{
      if(typeof lang!=='undefined'&&(lang==='fr'||lang==='en')){
        return lang;
      }
    }catch(_error){}

    const html=String(document.documentElement.lang||'').toLowerCase();
    if(html.startsWith('en'))return 'en';
    if(html.startsWith('fr'))return 'fr';

    try{
      const stored=localStorage.getItem('mhur_lang');
      if(stored==='en'||stored==='fr')return stored;
    }catch(_error){}

    return 'fr';
  }

  function english(){
    return currentLanguage()==='en';
  }

  const EXACT=new Map([
    ['Bonus de Login → 20 millions de téléchargements','Login Bonus → 20 Million Downloads'],
    ['Bonus de Login → 20 millions de téléchargements.','Login Bonus → 20 Million Downloads'],
    ['Clique pour choisir le T.U.N.I.N.G.','Click to choose the T.U.N.I.N.G.'],
    ['BUILD COMMUNAUTAIRE','COMMUNITY BUILD'],
    ['BUILDS COMMUNAUTÉ','COMMUNITY BUILDS'],
    ['Build communautaire','Community Build'],
    ['Builds communauté','Community Builds'],
    ['Builds de la communauté','Community Builds'],
    ['Tenue de Héros — Original','Hero Costume — Original'],
    ['Tenue de Héros','Hero Costume'],
    ['Par','By'],
    ['Signaler','Report'],
    ['Vérifier','Verify'],
    ['Masquer','Hide'],
    ['Votre build','Your build'],
    ['Aucune description.','No description.'],
    ['Aucune description','No description'],
    ['Utile','Helpful'],
    ['Testé en partie','Tested in game'],
    ['Recommandé','Recommended'],
    ['Ne fonctionne plus','No longer works'],
    ['Choisir pour comparaison','Choose for comparison'],
    ['Utiliser ce build','Use this build'],
    ['Partager','Share'],
    ['Modifier le build','Edit build'],
    ['Supprimer le build','Delete build'],
    ['Retour','Back'],
    ['Fermer','Close'],
    ['Aucun résultat','No results'],
    ['Aucun changement détecté.','No changes detected.'],

    /* T.U.N.I.N.G. spéciaux connus */
    ['Détecteur de Kota','Kota Detector'],
    ['Accélération','Acceleration'],
    ['Charge PU destructeur','Destructive PU Charge'],
    ['PU Turbo','PU Turbo'],
    ['Massacre de masse','Mass KO'],
    ['Récupération rapide de PV','Fast HP Recovery'],
    ['Attaque vengeresse','Vengeful Attack'],
    ['Fragilisation','Weakening'],
    ['Faculté de régénération extrême','Extreme Regeneration'],
    ['Bonus de rechargement spécial','Special Reload Bonus'],
    ['Annihilation','Annihilation'],
    ['Technique vengeresse','Vengeful Technique'],
    ['Auto-réanimation rapide','Fast Self-Revival'],
    ['Sangsue à PV','HP Leech'],
    ['Sangsue à PG','GP Leech'],
    ['Puissance de feu PU sup.','Enhanced PU Firepower'],
    ['Combustion totale','Full Combustion'],
    ['Pseudo-perméabilité','Pseudo-Permeation'],
    ['Analyse du Champ de paSize','Battlefield Analysis'],
    ['Analyse du champ de paSize','Battlefield Analysis'],
    ['Analyse du champ de bataille','Battlefield Analysis']
  ]);

  const PHRASES=[
    [/Défense\/Strike Melee/gi,'Melee Strike Defense'],
    [/Puissance d['’]attaque de l['’]Alter\s*α/gi,'Quirk Skill α Attack Power'],
    [/Puissance d['’]attaque de l['’]Alter\s*β/gi,'Quirk Skill β Attack Power'],
    [/Puissance d['’]attaque de l['’]Alter\s*γ/gi,'Quirk Skill γ Attack Power'],
    [/Attack Power de l['’]Alter\s*α/gi,'Quirk Skill α Attack Power'],
    [/Attack Power de l['’]Alter\s*β/gi,'Quirk Skill β Attack Power'],
    [/Attack Power de l['’]Alter\s*γ/gi,'Quirk Skill γ Attack Power'],
    [/Défense de l['’]Alter\s*α/gi,'Quirk Skill α Defense'],
    [/Défense de l['’]Alter\s*β/gi,'Quirk Skill β Defense'],
    [/Défense de l['’]Alter\s*γ/gi,'Quirk Skill γ Defense'],
    [/Quirk Skill Defense\s*α/gi,'Quirk Skill α Defense'],
    [/Quirk Skill Defense\s*β/gi,'Quirk Skill β Defense'],
    [/Quirk Skill Defense\s*γ/gi,'Quirk Skill γ Defense'],
    [/Rechargement de l['’]Alter\s*α/gi,'Quirk Skill α Reload Speed'],
    [/Rechargement de l['’]Alter\s*β/gi,'Quirk Skill β Reload Speed'],
    [/Rechargement de l['’]Alter\s*γ/gi,'Quirk Skill γ Reload Speed'],
    [/Rechargement actions spéciales/gi,'Special Action Reload Speed'],
    [/Puissance d['’]attaque au corps à corps/gi,'Melee Attack Power'],
    [/Défense\/Attaque corps à corps/gi,'Melee Attack Defense'],
    [/Défense au corps à corps/gi,'Melee Defense'],
    [/Hauteur saut vertical/gi,'Vertical Jump Height'],
    [/Hauteur saut sur les murs/gi,'Wall Jump Height'],
    [/Hauteur saut en avant/gi,'Forward Jump Height'],
    [/Vitesse de course/gi,'Running Speed'],
    [/Rapid du sprint/gi,'Sprint Speed'],
    [/Vitesse du sprint/gi,'Sprint Speed'],
    [/Vitesse de déplacement en état critique/gi,'Movement Speed while Critical'],
    [/PV Max en état critique/gi,'Max HP while Critical'],
    [/PV Max/gi,'Max HP'],
    [/Défense PV/gi,'HP Defense'],
    [/Attaque PV/gi,'HP Attack'],
    [/Attaque PG/gi,'GP Attack'],
    [/Défense PG/gi,'GP Defense'],
    [/Action spéciale/gi,'Special Action'],
    [/actions spéciales/gi,'Special Actions'],
    [/état critique/gi,'Critical State'],
    [/au corps à corps/gi,'Melee'],
    [/Tenue de Héros/gi,'Hero Costume'],
    [/Build communautaire/gi,'Community Build'],
    [/Builds communauté/gi,'Community Builds'],
    [/juil\./gi,'Jul'],
    [/août/gi,'Aug'],
    [/sept\./gi,'Sep']
  ];

  const SENTENCES=[
    [/Augmente les dégâts infligés par l['’]Alter\s*α/gi,'Increases damage dealt by Quirk Skill α'],
    [/Augmente les dégâts infligés par l['’]Alter\s*β/gi,'Increases damage dealt by Quirk Skill β'],
    [/Augmente les dégâts infligés par l['’]Alter\s*γ/gi,'Increases damage dealt by Quirk Skill γ'],
    [/Réduit les dégâts subis par l['’]Alter\s*α/gi,'Reduces damage taken from Quirk Skill α'],
    [/Réduit les dégâts subis par l['’]Alter\s*β/gi,'Reduces damage taken from Quirk Skill β'],
    [/Réduit les dégâts subis par l['’]Alter\s*γ/gi,'Reduces damage taken from Quirk Skill γ'],
    [/Augmente la vitesse de rechargement de l['’]Alter\s*α/gi,'Increases Quirk Skill α reload speed'],
    [/Augmente la vitesse de rechargement de l['’]Alter\s*β/gi,'Increases Quirk Skill β reload speed'],
    [/Augmente la vitesse de rechargement de l['’]Alter\s*γ/gi,'Increases Quirk Skill γ reload speed'],
    [/Augmente la vitesse de rechargement des actions spéciales/gi,'Increases Special Action reload speed'],
    [/Augmente les dégâts infligés par les attaques au corps à corps/gi,'Increases melee attack damage'],
    [/Réduit les dégâts subis par les attaques au corps à corps/gi,'Reduces damage taken from melee attacks'],
    [/Augmente la hauteur du saut vertical/gi,'Increases vertical jump height'],
    [/Augmente la hauteur du saut sur les murs/gi,'Increases wall jump height'],
    [/Augmente la hauteur du saut en avant/gi,'Increases forward jump height'],
    [/Augmente la vitesse de course/gi,'Increases running speed'],
    [/Augmente la vitesse de déplacement en état critique/gi,'Increases movement speed while in Critical State'],
    [/Augmente les PV max/gi,'Increases max HP'],
    [/Réduit les dégâts subis \(PV\)/gi,'Reduces HP damage taken'],
    [/Augmente les dégâts infligés aux PV/gi,'Increases HP damage dealt'],
    [/Augmente les dégâts infligés aux PG/gi,'Increases GP damage dealt'],
    [/pendant une durée limitée/gi,'for a limited time'],
    [/pendant un certain temps/gi,'for a limited time'],
    [/au début de la bataille/gi,'at the start of the battle'],
    [/lorsqu['’]un ennemi est mis au sol/gi,'when an enemy is downed'],
    [/après avoir subi un brise-garde/gi,'after suffering a Guard Break'],
    [/en mettant un ennemi au sol/gi,'by downing an enemy'],
    [/Augmente la durée des effets à chaque niveau gagné\./gi,'Increases the effect duration with each level gained.'],
    [/Diminue le délai d['’]activation à chaque niveau gagné\./gi,'Reduces the activation delay with each level gained.'],
    [/Augmente la quantité régénérée à chaque niveau gagné\./gi,'Increases the recovered amount with each level gained.'],
    [/Augmente la quantité accumulée à chaque niveau gagné\./gi,'Increases the amount gained with each level.'],
    [/Permet de récupérer des PV/gi,'Recovers HP'],
    [/Permet de récupérer des PG/gi,'Recovers GP'],
    [/Remplit la jauge de PU\/PC/gi,'Fills the PU/PC gauge'],
    [/Augmente la puissance d['’]attaque/gi,'Increases attack power'],
    [/Réduit temporairement le temps d['’]utilisation des objets de récupération de PV/gi,'Temporarily reduces HP recovery item use time']
  ];

  function translateString(value){
    const source=String(value??'');
    const leading=source.match(/^\s*/)?.[0]||'';
    const trailing=source.match(/\s*$/)?.[0]||'';
    const core=source.trim();

    if(!core)return source;

    let result=EXACT.get(core)||core;

    SENTENCES.forEach(([pattern,replacement])=>{
      result=result.replace(pattern,replacement);
    });

    PHRASES.forEach(([pattern,replacement])=>{
      result=result.replace(pattern,replacement);
    });

    result=result
      .replace(/\bPar\b/g,'By')
      .replace(/\bVotre build\b/g,'Your build')
      .replace(/\bAucune description\.\b/g,'No description.')
      .replace(/\bSignaler\b/g,'Report')
      .replace(/\bVérifier\b/g,'Verify')
      .replace(/\bMasquer\b/g,'Hide')
      .replace(/\bUtile\b/g,'Helpful')
      .replace(/\bTesté en partie\b/g,'Tested in game')
      .replace(/\bRecommandé\b/g,'Recommended')
      .replace(/\bNe fonctionne plus\b/g,'No longer works');

    return leading+result+trailing;
  }

  function rememberAttribute(element){
    if(originalAttributes.has(element))return;

    const data={};

    for(const name of ['title','aria-label','placeholder']){
      if(element.hasAttribute?.(name)){
        data[name]=element.getAttribute(name);
      }
    }

    originalAttributes.set(element,data);
  }

  function translateDom(root=document){
    const skip=new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE']);

    const walker=document.createTreeWalker(
      root instanceof Document?root.documentElement:root,
      NodeFilter.SHOW_TEXT
    );

    const nodes=[];

    while(walker.nextNode()){
      const node=walker.currentNode;
      const parent=node.parentElement;

      if(!parent||skip.has(parent.tagName))continue;
      if(parent.closest?.('[data-no-v594-translation]'))continue;

      nodes.push(node);
    }

    nodes.forEach(node=>{
      if(!originalText.has(node)){
        originalText.set(node,node.nodeValue);
      }

      const french=originalText.get(node);

      node.nodeValue=english()
        ?translateString(french)
        :french;
    });

    root.querySelectorAll?.('[title],[aria-label],[placeholder]').forEach(element=>{
      rememberAttribute(element);
      const values=originalAttributes.get(element)||{};

      for(const [name,french] of Object.entries(values)){
        element.setAttribute(
          name,
          english()?translateString(french):french
        );
      }
    });
  }

  function getTunings(){
    try{
      if(typeof tunings!=='undefined'&&tunings)return tunings;
    }catch(_error){}

    return window.tunings||null;
  }

  function snapshotTuning(object){
    if(!object||typeof object!=='object'||tuningSnapshots.has(object))return;

    tuningSnapshots.set(object,{
      name:object.name,
      desc:object.desc
    });
  }

  function localizeTuningObject(object){
    if(!object||typeof object!=='object')return;

    snapshotTuning(object);

    const snapshot=tuningSnapshots.get(object);

    if('name' in object){
      object.name=english()
        ?translateString(snapshot.name)
        :snapshot.name;
    }

    if('desc' in object){
      object.desc=english()
        ?translateString(snapshot.desc)
        :snapshot.desc;
    }

    (object.effects||[]).forEach(localizeTuningObject);
  }

  function localizeAllTunings(){
    const data=getTunings();
    if(!data)return;

    Object.values(data).forEach(list=>{
      if(Array.isArray(list)){
        list.forEach(localizeTuningObject);
      }
    });
  }

  function cleanModsArrow(tutorial){
    if(!(tutorial instanceof HTMLElement))return;

    const summary=tutorial.querySelector(':scope > summary');
    if(!summary)return;

    summary.querySelectorAll('*').forEach(element=>{
      if(!(element instanceof HTMLElement))return;
      if(element.classList.contains('mhurModsArrowV594'))return;

      const className=String(element.className||'');
      const text=String(element.textContent||'')
        .replace(/\s+/g,'')
        .trim();

      const arrowClass=/arrow|chevron/i.test(className);
      const arrowData=(
        element.hasAttribute('data-mods-arrow')||
        element.hasAttribute('data-mhur-extra-mod-arrow')||
        element.hasAttribute('data-v549-old-arrow')||
        element.hasAttribute('data-v592-old-arrow')
      );
      const arrowOnly=/^(?:v|⌄|⌃|▼|▲|▾|▴|▽|△|↓|↑)$/i.test(text);

      if(arrowClass||arrowData||arrowOnly){
        element.dataset.v594OldArrow='1';
        element.remove();
      }
    });

    let arrow=summary.querySelector(':scope > .mhurModsArrowV594');

    if(!arrow){
      arrow=document.createElement('span');
      arrow.className='mhurModsArrowV594';
      arrow.setAttribute('aria-hidden','true');
      summary.appendChild(arrow);
    }

    const open=tutorial.hasAttribute('open');

    /*
      Deux tracés SVG distincts : aucun retournement du cercle,
      aucune ancienne ligne jaune ne peut rester visible.
    */
    const path=open
      ?'M18 39 L32 25 L46 39'
      :'M18 25 L32 39 L46 25';

    arrow.innerHTML=
      '<svg viewBox="0 0 64 64">'+
      '<circle class="mhurModsArrowCircleV594" cx="32" cy="32" r="28"/>'+
      '<path class="mhurModsArrowPathV594" d="'+path+'"/>'+
      '</svg>';
  }

  function cleanAllModsArrows(){
    document.querySelectorAll('.modsTutorial').forEach(cleanModsArrow);
  }

  function tierStyleId(item){
    const direct=(
      item.dataset?.style||
      item.dataset?.styleId||
      item.dataset?.character||
      ''
    );

    if(direct)return String(direct);

    const handler=item.getAttribute('ondragstart')||'';
    const match=handler.match(
      /dragStart\s*\(\s*event\s*,\s*['"]([^'"]+)['"]/i
    );

    if(match)return match[1];

    const image=item.querySelector('img')?.getAttribute('src')||'';

    if(/gentle[_/-]criminal/i.test(image)){
      return 'gentle_criminal';
    }

    return '';
  }

  function addGentleTierNew(){
    document.querySelectorAll('.mhurTierItem,.mhurPublishedMini').forEach(item=>{
      const styleId=tierStyleId(item);
      const text=String(item.textContent||'');

      const gentle=(
        /gentle[_ -]?criminal/i.test(styleId)||
        /gentle criminal/i.test(text)
      );

      if(!gentle)return;

      let badge=item.querySelector(':scope > .mhurGentleTierNewV594');

      if(!badge){
        badge=document.createElement('img');
        badge.className='mhurGentleTierNewV594';
        badge.src=NEW_IMAGE;
        badge.alt='NEW';
        badge.setAttribute('aria-label','NEW');
        item.appendChild(badge);
      }
    });
  }

  function refresh(){
    localizeAllTunings();
    cleanAllModsArrows();
    addGentleTierNew();
    translateDom(document);
  }

  function wrapRender(){
    if(typeof window.render!=='function')return;
    if(window.render.__mhurV594)return;

    const original=window.render;

    const wrapped=function(){
      localizeAllTunings();
      const result=original.apply(this,arguments);

      requestAnimationFrame(refresh);
      setTimeout(refresh,30);

      return result;
    };

    wrapped.__mhurV594=true;
    window.render=wrapped;

    try{
      render=wrapped;
    }catch(_error){}
  }

  let queued=false;

  function schedule(){
    if(queued)return;
    queued=true;

    requestAnimationFrame(()=>{
      queued=false;
      refresh();
    });
  }

  new MutationObserver(mutations=>{
    if(mutations.some(mutation=>mutation.addedNodes?.length)){
      schedule();
    }
  }).observe(document.documentElement,{
    childList:true,
    subtree:true
  });

  document.addEventListener('toggle',event=>{
    if(event.target?.classList?.contains('modsTutorial')){
      cleanModsArrow(event.target);
    }
  },true);

  window.addEventListener('mhur:languagechange',()=>{
    /*
      Les données T.U.N.I.N.G. sont changées avant le prochain rendu.
      Plusieurs passages corrigent aussi les interfaces asynchrones.
    */
    localizeAllTunings();
    setTimeout(refresh,0);
    setTimeout(refresh,60);
    setTimeout(refresh,220);
  });

  wrapRender();

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      wrapRender();
      refresh();
    },{once:true});
  }else{
    refresh();
  }

  window.addEventListener('load',refresh,{once:true});
  window.addEventListener('hashchange',schedule);

  window.MHUR_V594={
    version:VERSION,
    refresh,
    translateString,
    localizeAllTunings,
    addGentleTierNew,
    cleanAllModsArrows
  };
})();
