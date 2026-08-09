(() => {
  'use strict';

  const MARK = 'MHUR_V28_PATCH_NOTES_FINAL';
  let bodyLock = null;
  let modalObserver = null;
  let documentObserver = null;
  let refreshQueued = false;

  function language(){
    try{
      return (typeof lang !== 'undefined' && lang === 'en') ? 'en' : 'fr';
    }catch(_e){
      return 'fr';
    }
  }

  function localized(value){
    if(value && typeof value === 'object' && !Array.isArray(value)){
      return String(value[language()] ?? value.fr ?? value.en ?? '');
    }
    return String(value ?? '');
  }

  function clean(value){
    return localized(value).replace(/\s+/g,' ').trim();
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

  function basename(value){
    const raw=clean(value).split('?')[0].split('#')[0];
    return raw.split('/').pop()?.toLowerCase() || '';
  }

  function activeNote(){
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

  function allChanges(note){
    const output=[];
    (Array.isArray(note?.details) ? note.details : []).forEach(
      (section,sectionIndex)=>{
        (Array.isArray(section?.changes) ? section.changes : []).forEach(
          (change,changeIndex)=>{
            if(change){
              output.push({
                change,
                sectionIndex,
                changeIndex,
                used:false
              });
            }
          }
        );
      }
    );
    return output;
  }

  function normalizedLabel(value){
    const key=norm(value);
    if(['damage','degats','degat'].includes(key)) return 'damage';
    if(['guard_break','brise_garde','guardbreak'].includes(key)) return 'guard_break';
    if(['ammo','munitions','magazine','no_of_rounds'].includes(key)) return 'ammo';
    if(['hp','pv','health','max_hp','max_health'].includes(key)) return 'hp';
    return key;
  }

  function skillCore(value){
    let raw=clean(value);
    raw=raw.replace(/\s*[（(][^()（）]*[）)]\s*$/,'').trim();
    raw=raw.replace(/^[αβγabg]\s*[-—:]\s*/i,'').trim();
    return norm(raw);
  }

  function subtypeFromSkill(value){
    const raw=clean(value);
    const match=raw.match(/[（(]\s*([^()（）]+?)\s*[）)]\s*$/);
    return match ? clean(match[1]) : '';
  }

  function prettySubtype(raw){
    const key=norm(raw);
    const english=language()==='en';

    const map={
      normal: english ? 'Normal attack' : 'Attaque normale',
      explosion: 'Explosion',
      explosionfollow_up: english ? 'Explosion Follow-up' : 'Explosion suivante',
      explosion_follow_up: english ? 'Explosion Follow-up' : 'Explosion suivante',
      follow_up: english ? 'Follow-up' : 'Enchaînement',
      shockwave: english ? 'Shockwave' : 'Onde de choc',
      bullet: 'Projectile',
      projectile: 'Projectile',
      rush: english ? 'Rush' : 'Ruée',
      rebound: english ? 'Rebound' : 'Rebond',
      bounce: english ? 'Rebound' : 'Rebond',
      impact: english ? 'Impact' : 'Impact final',
      burn: english ? 'Burn' : 'Brûlure',
      melee_combat: english ? 'Melee Combat' : 'Corps à corps',
      melee: english ? 'Melee Combat' : 'Corps à corps',
      activation: 'Activation',
      short_range: english ? 'Short range' : 'Distance courte',
      middle_range: english ? 'Medium range' : 'Distance moyenne',
      medium_range: english ? 'Medium range' : 'Distance moyenne',
      long_range: english ? 'Long range' : 'Distance longue'
    };

    return map[key] || clean(raw);
  }

  function sourceMatch(card,article,candidates){
    const character=norm(
      article?.dataset?.v608Character ||
      article?.querySelector('h4')?.textContent ||
      ''
    );
    const label=normalizedLabel(
      card.querySelector('.s18PatchLabelV10')?.textContent || ''
    );
    const heading=norm(card.querySelector('h5')?.textContent || '');
    const image=basename(card.querySelector('img')?.getAttribute('src') || '');

    let best=null;
    let bestScore=-1;

    candidates.forEach(row=>{
      if(row.used) return;
      const change=row.change || {};
      let score=0;

      const sourceCharacter=norm(change.character || '');
      if(character && sourceCharacter===character) score+=400;
      else if(character && sourceCharacter && (
        character.includes(sourceCharacter) ||
        sourceCharacter.includes(character)
      )) score+=250;

      const sourceImage=basename(change.skill_image || '');
      if(image && sourceImage && image===sourceImage) score+=1200;

      const sourceLabel=normalizedLabel(change.label || '');
      if(label && sourceLabel===label) score+=350;

      const core=skillCore(
        change.display_skill_name ||
        change.skill_name ||
        ''
      );
      if(core && heading && (
        heading.includes(core) ||
        core.includes(heading.replace(/^(alpha|beta|gamma|a|b|g)_/,''))
      )) score+=250;

      if(score>bestScore){
        bestScore=score;
        best=row;
      }
    });

    if(best && bestScore>=300){
      best.used=true;
      return best.change;
    }

    return null;
  }

  function enrichDetails(){
    const modal=document.getElementById('s18NotesDevModalV10');
    if(!modal || !modal.classList.contains('open')) return 0;

    const note=activeNote();
    if(!note) return 0;

    const candidates=allChanges(note);
    const cards=[
      ...modal.querySelectorAll(
        '[data-v608-patch-content] .s18PatchChangeV10'
      )
    ];

    let details=0;

    cards.forEach(card=>{
      const article=card.closest('.s18PatchCharacterV10');
      const change=sourceMatch(card,article,candidates);
      const rawSubtype=subtypeFromSkill(
        change?.display_skill_name ||
        change?.skill_name ||
        ''
      );

      const main=card.querySelector('.s18PatchSkillV10>main') ||
        card.querySelector('main');
      const heading=main?.querySelector('h5');
      let line=main?.querySelector('.mhurV28PatchSubtype');

      if(!rawSubtype){
        if(line) line.remove();
        return;
      }

      const label=prettySubtype(rawSubtype);
      const text=language()==='en'
        ? `Modified part: ${label}`
        : `Partie modifiée : ${label}`;

      if(!line){
        line=document.createElement('p');
        line.className='mhurV28PatchSubtype';
        if(heading){
          heading.insertAdjacentElement('afterend',line);
        }else if(main){
          main.prepend(line);
        }
      }

      if(line && line.textContent!==text){
        line.textContent=text;
      }

      if(line){
        line.dataset.v28SourceSkill=clean(
          change?.skill_name || ''
        );
        details+=1;
      }
    });

    window.__MHUR_V28_PATCH_STATUS__={
      marker:MARK,
      details,
      cards:cards.length,
      locked:Boolean(bodyLock)
    };

    return details;
  }

  function lockBackground(){
    if(bodyLock) return;

    const y=window.scrollY || window.pageYOffset || 0;
    const style=document.body.style;

    bodyLock={
      y,
      position:style.position,
      top:style.top,
      left:style.left,
      right:style.right,
      width:style.width,
      overflow:style.overflow
    };

    style.position='fixed';
    style.top=`-${y}px`;
    style.left='0';
    style.right='0';
    style.width='100%';
    style.overflow='hidden';
  }

  function unlockBackground(){
    if(!bodyLock) return;

    const saved=bodyLock;
    bodyLock=null;
    const style=document.body.style;

    style.position=saved.position;
    style.top=saved.top;
    style.left=saved.left;
    style.right=saved.right;
    style.width=saved.width;
    style.overflow=saved.overflow;

    window.scrollTo(0,saved.y);
  }

  function syncLock(){
    const modal=document.getElementById('s18NotesDevModalV10');
    const open=Boolean(modal?.classList.contains('open'));

    if(open) lockBackground();
    else unlockBackground();

    if(window.__MHUR_V28_PATCH_STATUS__){
      window.__MHUR_V28_PATCH_STATUS__.locked=Boolean(bodyLock);
    }
  }

  function protectScroll(modal){
    if(!modal || modal.dataset.v28ScrollBound==='1') return;
    modal.dataset.v28ScrollBound='1';

    modal.addEventListener('touchmove',event=>{
      const allowed=event.target?.closest?.(
        '.s18NotesBodyV10>main,.s18NotesBodyV10>aside'
      );

      if(allowed){
        event.stopPropagation();
        return;
      }

      event.preventDefault();
    },{passive:false});

    modal.addEventListener('wheel',event=>{
      const allowed=event.target?.closest?.(
        '.s18NotesBodyV10>main,.s18NotesBodyV10>aside'
      );

      if(allowed){
        event.stopPropagation();
        return;
      }

      event.preventDefault();
    },{passive:false});
  }

  function scheduleRefresh(){
    if(refreshQueued) return;
    refreshQueued=true;
    requestAnimationFrame(()=>{
      refreshQueued=false;
      const modal=document.getElementById('s18NotesDevModalV10');
      if(modal){
        protectScroll(modal);
        syncLock();
        enrichDetails();
        observeModal(modal);
      }else{
        unlockBackground();
      }
    });
  }

  function observeModal(modal){
    if(!modal || modalObserver?.__target===modal) return;

    if(modalObserver) modalObserver.disconnect();

    modalObserver=new MutationObserver(scheduleRefresh);
    modalObserver.__target=modal;
    modalObserver.observe(modal,{
      attributes:true,
      attributeFilter:['class'],
      childList:true,
      subtree:true
    });
  }

  function start(){
    scheduleRefresh();

    if(!documentObserver){
      documentObserver=new MutationObserver(scheduleRefresh);
      documentObserver.observe(document.body,{
        childList:true,
        subtree:true
      });
    }

    document.addEventListener('click',event=>{
      if(event.target?.closest?.(
        '#mhurPatchDevButtonV14,'+
        '.mhurPatchDevButtonV14,'+
        '[data-s18-notes-button],'+
        '#s18NotesDevModalV10 [data-v608-patch-index],'+
        '#s18NotesDevModalV10 [data-tab],'+
        '#s18NotesDevModalV10 [data-close]'
      )){
        setTimeout(scheduleRefresh,0);
        setTimeout(scheduleRefresh,40);
      }
    },true);

    window.addEventListener(
      'mhur:languagechange',
      ()=>setTimeout(scheduleRefresh,0)
    );
    window.addEventListener(
      'pagehide',
      unlockBackground,
      {once:true}
    );
  }

  window.MHUR_V28_PATCH_NOTES={
    refresh:scheduleRefresh,
    enrich:enrichDetails,
    unlock:unlockBackground
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
    ()=>setTimeout(scheduleRefresh,0),
    {once:true}
  );
})();
