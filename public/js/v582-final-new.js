
/* MHUR Nexus — V582 : NEW finaux indépendants */
(function(){
  'use strict';

  const BADGE = '<span class="mhurNewV582" aria-label="NEW"></span>';
  const GENTLE_CHARACTER = 'gentle_criminal';
  const GENTLE_STYLE = 'gentle_criminal_technical';
  const GENTLE_ORIGINAL = '108000000';

  function releaseDay(value){
    const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }

  function todayJst(){
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());

    const value = type =>
      parts.find(part => part.type === type)?.value || '';

    return value('year') + '-' + value('month') + '-' + value('day');
  }

  function currentSets(){
    const sync = window.MHUR_SEASON18_DATA || {};
    const active = sync.active_new_content || sync.new_content || {};
    const today = todayJst();

    const released = Object.entries(sync.costumes || {})
      .map(([id, row]) => ({
        id: String(id),
        row: row || {},
        day: releaseDay(row?.releaseDate || row?.release_date)
      }))
      .filter(item =>
        item.day &&
        item.day <= today &&
        !item.row.upcoming
      );

    const latestDay = released.length
      ? released.map(item => item.day).sort().at(-1)
      : '';

    const latestCostumes = released
      .filter(item => item.day === latestDay)
      .map(item => item.id);

    return {
      characters: new Set([
        ...(active.characters || []).map(String),
        GENTLE_CHARACTER
      ]),
      styles: new Set([
        ...(active.styles || []).map(String),
        GENTLE_STYLE
      ]),
      costumes: new Set([
        ...latestCostumes,
        ...(active.costumes || []).map(String),
        GENTLE_ORIGINAL
      ]),
      latestDay
    };
  }

  function directCustomBadges(node){
    try{
      return [...node.querySelectorAll(':scope > .mhurNewV582')];
    }catch(_error){
      return [...(node.children || [])]
        .filter(child => child.classList?.contains('mhurNewV582'));
    }
  }

  function setCustomBadge(node, active){
    if(!node) return;

    const badges = directCustomBadges(node);

    if(!active){
      badges.forEach(badge => badge.remove());
      return;
    }

    badges.slice(1).forEach(badge => badge.remove());

    if(!badges.length){
      node.insertAdjacentHTML('afterbegin', BADGE);
    }
  }

  function costumeId(card){
    if(!card) return '';

    const values = [
      card.dataset?.costumeId,
      card.dataset?.costume,
      card.dataset?.id,
      card.getAttribute('data-costume-id'),
      card.getAttribute('data-costume'),
      card.getAttribute('data-id'),
      card.id,
      card.getAttribute('onclick'),
      card.getAttribute('href')
    ];

    for(const value of values){
      const match = String(value || '').match(/(?:ur[_-]?)?(\d{4,})/i);
      if(match) return match[1];
    }

    return '';
  }

  function syncIncoming(){
    const twice = document.querySelector(
      '.s18PlannedCardV12[data-planned="twice"]'
    );
    const tsuyu = document.querySelector(
      '.s18PlannedCardV12[data-planned="tsuyu"]'
    );

    if(twice){
      twice.querySelectorAll(
        '.s18PlannedNewV12,[class*="s18PlannedIncoming"]'
      ).forEach(node => node.remove());

      twice.querySelector('.s18PlannedTextV12')
        ?.insertAdjacentHTML(
          'beforebegin',
          '<span class="mhurIncomingV582 mhurIncomingTwiceV582">INCOMING</span>'
        );
    }

    if(tsuyu){
      tsuyu.querySelectorAll(
        '.s18PlannedNewV12,[class*="s18PlannedIncoming"]'
      ).forEach(node => node.remove());

      tsuyu.querySelector('.s18PlannedTextV12')
        ?.insertAdjacentHTML(
          'beforebegin',
          '<span class="mhurIncomingV582 mhurIncomingTsuyuV582">INCOMING</span>'
        );
    }
  }

  function sync(){
    const sets = currentSets();

    syncIncoming();

    document.querySelectorAll('.card[data-char]').forEach(card => {
      setCustomBadge(
        card,
        sets.characters.has(String(card.dataset.char || ''))
      );
    });

    document.querySelectorAll('.styleCard[data-style]').forEach(card => {
      setCustomBadge(
        card,
        sets.styles.has(String(card.dataset.style || ''))
      );
    });

    document.querySelectorAll(
      '.costumeTile[data-costume-id],' +
      '.costumeCard[data-costume-id],' +
      '.costumeResult[data-costume-id],' +
      '.costumeTile[data-costume],' +
      '.costumeCard[data-costume],' +
      '.costumeResult[data-costume]'
    ).forEach(card => {
      const id = costumeId(card);
      const upcoming = Boolean(
        card.closest(
          '.s18UpcomingCostumeGroupV19,' +
          '.s18UpcomingCostumeGroupV23'
        )
      );

      setCustomBadge(
        card,
        Boolean(id && sets.costumes.has(id) && !upcoming)
      );
    });
  }

  let scheduled = false;

  function schedule(){
    if(scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      sync();
    });
  }

  function wrapRender(){
    if(typeof window.render !== 'function') return;
    if(window.render.__mhurV582Wrapped) return;

    const original = window.render;

    const wrapped = function(){
      const result = original.apply(this, arguments);

      /*
        Le script Saison 18 v12 a déjà fini de retirer ses anciens badges.
        V582 ajoute ensuite les siens, qui utilisent une autre classe.
      */
      sync();
      schedule();
      return result;
    };

    wrapped.__mhurV582Wrapped = true;
    window.render = wrapped;

    try{
      render = wrapped;
    }catch(_error){}
  }

  wrapRender();

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      wrapRender();
      sync();
      schedule();
    }, {once: true});
  }else{
    sync();
    schedule();
  }

  new MutationObserver(mutations => {
    if(mutations.some(mutation => mutation.addedNodes?.length)){
      schedule();
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener('load', () => {
    wrapRender();
    sync();
    schedule();
  }, {once: true});

  window.addEventListener('hashchange', schedule);
  window.addEventListener('mhur:languagechange', schedule);

  window.MHUR_V582 = {
    refresh: sync,
    sets: currentSets
  };
})();
