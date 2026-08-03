/* MHUR Nexus - V610.1
   Patch Notes : les changements PV / HP ne montrent aucune image de competence.
*/
(function(){
  'use strict';

  if (window.MHUR_V6101_HEALTH_NO_IMAGE) return;
  window.MHUR_V6101_HEALTH_NO_IMAGE = true;

  const CARD_SELECTOR = [
    '.s18PatchChangeV10',
    '.s18PatchChangeV11',
    '.s18PatchChangeV12',
    '.s18PatchChangeV13',
    '.s18PatchChangeV14',
    '[class*="s18PatchChange"]'
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

    const exact = new Set([
      'hp', 'pv', 'health', 'sante', 'hit_points', 'points_de_vie',
      'max_hp', 'maximum_hp', 'max_health', 'maximum_health',
      'pv_max', 'pv_maximum', 'sante_max', 'sante_maximum'
    ]);

    return exact.has(key) ||
      key.includes('balance_changes_health') ||
      key.includes('balance_change_health') ||
      key.includes('equilibrage_pv') ||
      key.includes('equilibrage_sante');
  }

  function cardIsHealth(card){
    if (!card) return false;

    const title = card.querySelector(
      'h5, [data-skill-name], [class*="PatchSkillTitle"], [class*="PatchLabel"]'
    )?.textContent || '';

    const section = card.closest('[class*="s18PatchSection"]');
    const sectionTitle = section?.querySelector(':scope > h3, :scope > h4')?.textContent || '';

    return isHealthText(title) || isHealthText(sectionTitle);
  }

  function removeHealthImage(card){
    if (!cardIsHealth(card)) return;

    card.dataset.v610HealthNoImage = '1';

    const skillArea = card.querySelector('[class*="PatchSkill"]');
    if (!skillArea) return;

    skillArea.classList.add('mhur-v610-health-no-image');

    skillArea.querySelectorAll(
      '[class*="PatchImage"], [class*="SkillImage"], img'
    ).forEach(node => {
      const removable = node.closest('[class*="PatchImage"], [class*="SkillImage"]') || node;
      removable.remove();
    });
  }

  function sanitizeData(){
    const notes = window.MHUR_HOME_DATA?.patch_notes;
    if (!Array.isArray(notes)) return;

    notes.forEach(note => {
      const sections = Array.isArray(note?.details) ? note.details : [];
      sections.forEach(section => {
        const healthSection = isHealthText(section?.title);
        const changes = Array.isArray(section?.changes) ? section.changes : [];

        changes.forEach(change => {
          if (
            healthSection ||
            isHealthText(change?.skill_name) ||
            isHealthText(change?.label)
          ) {
            change.skill_image = '';
            change.mhur_no_skill_image = true;
          }
        });
      });
    });
  }

  function repair(root = document){
    sanitizeData();
    root.querySelectorAll(CARD_SELECTOR).forEach(removeHealthImage);
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

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('click', schedule, true);
    window.addEventListener('mhur:languagechange', schedule);
    setTimeout(schedule, 50);
    setTimeout(schedule, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
