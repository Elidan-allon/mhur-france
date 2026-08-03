(function () {
  'use strict';
  if (window.MHUR_V605_MIDORIYA_ALPHA_FIX) return;
  window.MHUR_V605_MIDORIYA_ALPHA_FIX = true;

  function clean(v){ return String(v ?? '').trim(); }
  function normalize(v){
    return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
      .replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  }
  function isMidoriyaText(v){
    const n = normalize(v);
    return n.includes('izuku_midoriya') || n.includes('midoriya') || n.includes('deku');
  }
  function isAlphaSkill(skill){
    const letter = normalize(skill?.letter || skill?.slot || skill?.key || skill?.skillLetter);
    const title = normalize(skill?.name || skill?.title || skill?.label || skill?.skillName);
    return letter === 'a' || letter === 'alpha' || title.includes('delaware_smash') || title.includes('air_force') || title.includes('airblast');
  }
  function getSkillImage(skill){
    return skill?.image || skill?.img || skill?.icon || skill?.thumbnail || skill?.src || '';
  }
  function sources(){
    const out = [];
    if (window.styles && typeof window.styles === 'object') out.push(window.styles);
    if (window.styleData && typeof window.styleData === 'object') out.push(window.styleData);
    if (window.characters && typeof window.characters === 'object') out.push(window.characters);
    if (window.characterData && typeof window.characterData === 'object') out.push(window.characterData);
    return out;
  }
  function styleLabel(style, id){
    return normalize([style?.id, style?.styleId, style?.slug, style?.key, style?.name, style?.role, style?.character, style?.characterName, id].join(' '));
  }
  function styleId(style, id){
    return normalize(style?.id || style?.styleId || style?.slug || style?.key || style?.name || id);
  }
  function buildMap(){
    const map = new Map();
    for (const source of sources()){
      for (const [id, style] of Object.entries(source)){
        const label = styleLabel(style, id);
        if (!isMidoriyaText(label)) continue;
        const skills = Array.isArray(style?.skills) ? style.skills : [];
        const alpha = skills.find(isAlphaSkill);
        const image = alpha ? getSkillImage(alpha) : '';
        if (!image) continue;
        const sid = styleId(style, id);
        map.set(sid, image);
        if (label.includes('ofa')) map.set('izuku_midoriya_ofa', image);
        if (label.includes('full_bullet')) map.set('izuku_midoriya_full_bullet', image);
      }
    }
    return map;
  }
  function wrong(src){
    const n = normalize(src);
    return n.includes('gamma') || n.includes('beta') || n.includes('special') || n.includes('action') || n.includes('_y_');
  }
  function hpCard(el){
    const t = normalize(el?.textContent || '');
    return t.includes('hp') || t.includes('pv') || t.includes('health');
  }
  function alphaCard(el){
    const t = normalize(el?.textContent || '');
    return isMidoriyaText(t) && (t.includes('delaware_smash') || t.includes('air_force') || t.includes('airblast') || t.includes('alpha') || t.includes('ammo'));
  }
  function keyFor(el){
    const t = normalize(el?.textContent || '');
    if (t.includes('full_bullet')) return 'izuku_midoriya_full_bullet';
    return 'izuku_midoriya_ofa';
  }
  function patchData(map){
    for (const source of sources()){
      for (const [id, style] of Object.entries(source)){
        const label = styleLabel(style, id);
        if (!isMidoriyaText(label)) continue;
        const image = map.get(styleId(style,id)) || map.get('izuku_midoriya_ofa') || '';
        if (!image) continue;
        const skills = Array.isArray(style?.skills) ? style.skills : [];
        for (const skill of skills){
          if (isAlphaSkill(skill) && (!getSkillImage(skill) || wrong(getSkillImage(skill)))){
            skill.image = image;
            if ('img' in skill) skill.img = image;
            if ('icon' in skill) skill.icon = image;
            if ('thumbnail' in skill) skill.thumbnail = image;
            if ('src' in skill) skill.src = image;
          }
        }
      }
    }
  }
  function patchDom(map){
    document.querySelectorAll('.skill,.gamePanel,.char-skill,.skill-card,.patch-card,.balance-card,.patchSkillCard,.noteCard').forEach(el => {
      const img = el.querySelector('img');
      if (!img) return;
      if (hpCard(el)) {
        img.style.display = 'none';
        const frame = img.closest('.skillIcon,.skillImage,.gameImage,.patchImage,.noteImage,.skill-thumb,.thumb');
        if (frame) frame.style.display = 'none';
        return;
      }
      if (!alphaCard(el)) return;
      const replacement = map.get(keyFor(el)) || map.get('izuku_midoriya_ofa') || '';
      if (!replacement) return;
      const cur = img.getAttribute('src') || '';
      if (!cur || wrong(cur) || cur !== replacement) img.setAttribute('src', replacement);
    });
  }
  function run(){
    const map = buildMap();
    patchData(map);
    patchDom(map);
  }
  let queued = false;
  function schedule(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; try { run(); } catch(e) {} });
  }
  const obs = new MutationObserver(ms => { if (ms.some(m => m.addedNodes && m.addedNodes.length)) schedule(); });
  function start(){
    run();
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener('click', () => { setTimeout(schedule,0); setTimeout(schedule,120); }, true);
  window.addEventListener('load', schedule, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
