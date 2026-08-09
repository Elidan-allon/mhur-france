(() => {
  'use strict';

  let observer=null;
  let queued=false;

  function langNow(){
    try{
      return (typeof lang!=='undefined' && lang==='en') ? 'en' : 'fr';
    }catch(_e){
      return 'fr';
    }
  }

  function local(value){
    if(value && typeof value==='object' && !Array.isArray(value)){
      return String(value[langNow()] ?? value.fr ?? value.en ?? '');
    }
    return String(value ?? '');
  }

  function clean(value){
    return local(value).replace(/\s+/g,' ').trim();
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

  function baseName(value){
    return clean(value)
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .pop()
      ?.toLowerCase() || '';
  }

  function parseSkill(value){
    const raw=clean(value);
    const symbol=(raw.match(/^\s*([αβγabg])\s*[-—:]\s*/i)||[])[1] || '';
    const subtype=(raw.match(/[（(]\s*([^()（）]+?)\s*[）)]\s*$/)||[])[1] || '';
    const base=raw
      .replace(/^\s*[αβγabg]\s*[-—:]\s*/i,'')
      .replace(/\s*[（(][^()（）]+[）)]\s*$/,'')
      .trim();

    return {
      raw,
      symbol,
      base,
      subtype:clean(subtype)
    };
  }

  function subtypeLabel(raw){
    const en=langNow()==='en';
    const key=norm(raw);
    const map={
      normal:['Normal','Normal'],
      explosion:['Explosion','Explosion'],
      explosionfollow_up:['Explosion suivante','Explosion Follow-up'],
      explosion_follow_up:['Explosion suivante','Explosion Follow-up'],
      follow_up:['Enchaînement','Follow-up'],
      shockwave:['Onde de choc','Shockwave'],
      projectile:['Projectile','Projectile'],
      bullet:['Projectile','Projectile'],
      rush:['Ruée','Rush'],
      rebound:['Rebond','Rebound'],
      bounce:['Rebond','Rebound'],
      impact:['Impact final','Impact'],
      melee:['Corps à corps','Melee Combat'],
      melee_combat:['Corps à corps','Melee Combat'],
      activation:['Activation','Activation'],
      short_range:['Distance courte','Short Range'],
      middle_range:['Distance moyenne','Medium Range'],
      medium_range:['Distance moyenne','Medium Range'],
      long_range:['Distance longue','Long Range'],
      max_range:['Distance longue','Max Range'],
      burn:['Brûlure','Burn']
    };

    const pair=map[key];
    return pair ? pair[en ? 1 : 0] : clean(raw);
  }

  function labelKind(value){
    const key=norm(value);
    if(['damage','degats','degat'].includes(key)) return 'damage';
    if(['guard_break','guardbreak','brise_garde'].includes(key)) return 'guard';
    if(['ammo','munition','munitions'].includes(key)) return 'ammo';
    return key;
  }

  function detailText(change,subtype){
    const part=subtypeLabel(subtype);
    const kind=labelKind(change?.label || '');
    const en=langNow()==='en';

    if(en){
      if(kind==='damage') return `Damage modified: ${part}`;
      if(kind==='guard') return `Guard Break modified: ${part}`;
      if(kind==='ammo') return `Ammo modified: ${part}`;
      return `Modified part: ${part}`;
    }

    if(kind==='damage') return `Dégâts modifiés : ${part}`;
    if(kind==='guard') return `Brise-garde modifié : ${part}`;
    if(kind==='ammo') return `Munitions modifiées : ${part}`;
    return `Partie modifiée : ${part}`;
  }

  function activePatch(){
    const rows=window.MHUR_HOME_DATA?.patch_notes;
    if(!Array.isArray(rows) || !rows.length) return null;

    const active=document.querySelector(
      '#s18NotesDevModalV10 [data-v608-patch-index].active'
    );

    const index=Math.max(
      0,
      Math.min(
        Number(active?.dataset?.v608PatchIndex || 0),
        rows.length-1
      )
    );

    return rows[index] || null;
  }

  function changesOf(note){
    const result=[];
    (Array.isArray(note?.details) ? note.details : []).forEach(section=>{
      (Array.isArray(section?.changes) ? section.changes : []).forEach(change=>{
        if(change) result.push(change);
      });
    });
    return result;
  }

  function matchChange(card,changes,used){
    const image=baseName(
      card.querySelector('img')?.getAttribute('src') || ''
    );
    const label=labelKind(
      card.querySelector('.s18PatchLabelV10')?.textContent || ''
    );

    let best=null;
    let bestScore=-1;

    changes.forEach((change,index)=>{
      if(used.has(index)) return;

      let score=0;

      const sourceImage=baseName(change?.skill_image || '');
      const sourceLabel=labelKind(change?.label || '');

      if(image && sourceImage && image===sourceImage) score+=1000;
      if(label && sourceLabel===label) score+=500;

      if(score>bestScore){
        bestScore=score;
        best={change,index};
      }
    });

    if(best && bestScore>=500){
      used.add(best.index);
      return best.change;
    }

    return null;
  }

  function translatedBase(heading,sourceBase){
    const current=clean(heading)
      .replace(/^\s*[αβγabg]\s*[-—:]\s*/i,'')
      .replace(/\s*[（(][^()（）]+[）)]\s*$/,'')
      .trim();

    return current || sourceBase;
  }

  function apply(){
    const modal=document.getElementById('s18NotesDevModalV10');
    if(!modal || !modal.classList.contains('open')) return 0;

    const note=activePatch();
    if(!note) return 0;

    const changes=changesOf(note);
    const used=new Set();
    const cards=[
      ...modal.querySelectorAll(
        '[data-v608-patch-content] .s18PatchChangeV10'
      )
    ];

    let detailed=0;

    cards.forEach(card=>{
      const main=card.querySelector('.s18PatchSkillV10>main') ||
        card.querySelector('main');
      const heading=main?.querySelector('h5');

      if(!main || !heading) return;

      const change=matchChange(card,changes,used);
      if(!change) return;

      const parts=parseSkill(
        change?.display_skill_name ||
        change?.skill_name ||
        ''
      );

      // On ne touche QUE les changements où UltraRumble précise
      // une sous-partie entre parenthèses.
      if(!parts.subtype) return;

      const subtype=subtypeLabel(parts.subtype);
      const base=translatedBase(
        heading.textContent,
        parts.base
      );
      const symbol=parts.symbol ? `${parts.symbol} — ` : '';
      const title=`${symbol}${base} (${subtype})`;

      if(clean(heading.textContent)!==title){
        heading.textContent=title;
      }

      // Une seule ligne explicative, juste sous le titre.
      main
        .querySelectorAll('.mhurV28PatchSubtype')
        .forEach(node=>{
          if(!node.classList.contains('mhurV29PatchExactDetail')){
            node.remove();
          }
        });

      let line=main.querySelector('.mhurV29PatchExactDetail');

      if(!line){
        line=document.createElement('p');
        line.className=
          'mhurV28PatchSubtype mhurV29PatchExactDetail';
        heading.insertAdjacentElement('afterend',line);
      }

      line.textContent=detailText(change,parts.subtype);
      line.dataset.v29SourceSkill=clean(
        change?.skill_name || ''
      );

      detailed+=1;
    });

    window.__MHUR_V29_PATCH_STATUS__={
      cards:cards.length,
      detailed,
      marker:'MHUR_V29_PATCH_DETAIL_ONLY'
    };

    return detailed;
  }

  function schedule(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      apply();
    });
  }

  function start(){
    schedule();

    if(!observer){
      observer=new MutationObserver(schedule);
      observer.observe(document.body,{
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:['class']
      });
    }

    document.addEventListener('click',event=>{
      if(event.target?.closest?.(
        '#mhurPatchDevButtonV14,'+
        '.mhurPatchDevButtonV14,'+
        '[data-s18-notes-button],'+
        '#s18NotesDevModalV10 [data-v608-patch-index],'+
        '#s18NotesDevModalV10 [data-tab]'
      )){
        setTimeout(schedule,0);
        setTimeout(schedule,40);
      }
    },true);

    window.addEventListener(
      'mhur:languagechange',
      ()=>setTimeout(schedule,0)
    );
  }

  window.MHUR_V29_PATCH_DETAIL={
    apply,
    schedule,
    parseSkill,
    subtypeLabel
  };

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {once:true}
    );
  }else{
    start();
  }

  window.addEventListener(
    'load',
    ()=>setTimeout(schedule,0),
    {once:true}
  );
})();
