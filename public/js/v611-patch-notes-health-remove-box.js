/* MHUR Nexus - V611
   Patch Notes : supprime aussi le cadre vide des changements PV / HP.
*/
(function(){
  'use strict';

  if (window.MHUR_V611_HEALTH_REMOVE_BOX) return;
  window.MHUR_V611_HEALTH_REMOVE_BOX = true;

  const CARD_SELECTOR = [
    '.s18PatchChangeV10',
    '.s18PatchChangeV11',
    '.s18PatchChangeV12',
    '.s18PatchChangeV13',
    '.s18PatchChangeV14',
    '[class*="s18PatchChangeV"]'
  ].join(',');

  const SKILL_AREA_SELECTOR = [
    '.s18PatchSkillV10',
    '.s18PatchSkillV11',
    '.s18PatchSkillV12',
    '.s18PatchSkillV13',
    '.s18PatchSkillV14',
    '[class*="s18PatchSkillV"]'
  ].join(',');

  function normalize(value){
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  function isHealthText(value){
    const key = normalize(value);
    if (!key) return false;

    return new Set([
      'hp',
      'pv',
      'health',
      'sante',
      'hit_points',
      'points_de_vie',
      'max_hp',
      'maximum_hp',
      'max_health',
      'maximum_health',
      'pv_max',
      'pv_maximum',
      'sante_max',
      'sante_maximum'
    ]).has(key) ||
      key.includes('balance_changes_health') ||
      key.includes('balance_change_health') ||
      key.includes('equilibrage_pv') ||
      key.includes('equilibrage_sante');
  }

  function cardIsHealth(card){
    if (!card) return false;

    const section = card.closest('[class*="s18PatchSection"]');
    const sectionTitle = section?.querySelector(
      ':scope > h3, :scope > h4'
    )?.textContent || '';

    const title = card.querySelector(
      'h5, [data-skill-name], [class*="PatchSkillTitle"], [class*="PatchLabel"]'
    )?.textContent || '';

    return isHealthText(title) || isHealthText(sectionTitle);
  }

  function findSkillArea(card){
    return Array.from(card.querySelectorAll(SKILL_AREA_SELECTOR))
      .find(area => Array.from(area.children).some(
        child => child.tagName === 'MAIN'
      )) || null;
  }

  function removeHealthBox(card){
    if (!cardIsHealth(card)) return false;

    card.dataset.v611HealthNoImage = '1';

    const area = findSkillArea(card);
    if (!area) return false;

    area.classList.add('mhur-v611-health-no-image');

    /*
      Dans ce bloc, le contenu utile est dans <main>.
      Tout autre enfant direct correspond a l'emplacement image :
      image, cadre vide ou ancien conteneur de compatibilite.
    */
    Array.from(area.children).forEach(child => {
      if (child.tagName !== 'MAIN') child.remove();
    });

    const main = Array.from(area.children).find(
      child => child.tagName === 'MAIN'
    );

    if (main) {
      main.removeAttribute('style');
      main.dataset.v611HealthText = '1';
    }

    return true;
  }

  function repair(root = document){
    root.querySelectorAll(CARD_SELECTOR).forEach(removeHealthBox);
  }

  let scheduled = false;

  function schedule(){
    if (scheduled) return;

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      repair();
    });
  }

  function start(){
    repair();

    if (!window.MHUR_V611_HEALTH_OBSERVER && document.body) {
      const observer = new MutationObserver(schedule);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      window.MHUR_V611_HEALTH_OBSERVER = observer;
    }

    document.addEventListener('click', schedule, true);
    window.addEventListener('mhur:languagechange', schedule);

    setTimeout(schedule, 0);
    setTimeout(schedule, 80);
    setTimeout(schedule, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  window.MHUR_V611_PATCH_HEALTH = {
    repair,
    refresh: schedule
  };
})();
