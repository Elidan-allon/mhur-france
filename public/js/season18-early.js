/* MHUR Nexus — Saison 18 v9
   Chargé juste après home.js et avant le premier rendu.
   Objectif : éviter le flash des cartes rouges vides sur l'accueil. */
(function(){
'use strict';

function currentLang(){ return typeof lang !== 'undefined' && lang === 'en' ? 'en' : 'fr'; }
function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function clean(value){ return String(value ?? '').replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g,'').replace(/\s{2,}/g,' ').trim(); }
function norm(value){ return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }

const numericCharacters = {
  '1':'midoriya','2':'bakugo','3':'ochaco','4':'shoto','5':'tenya','6':'tsuyu','7':'kaminari','8':'kirishima',
  '13':'aizawa','24':'mirio','34':'overhaul','37':'twice','108':'gentle_criminal','109':'present_mic','111':'mirko'
};

function releaseKind(item){
  const raw = norm(item?.release_kind || item?.type || '');
  if(raw.includes('costume')) return 'costume';
  if(raw.includes('character') || raw.includes('personnage')) return 'character';
  return 'style';
}
function labelFor(kind){
  if(currentLang()==='en') return kind==='character'?'Playable character':kind==='costume'?'New costume':'New style';
  return kind==='character'?'Personnage jouable':kind==='costume'?'Nouveau costume':'Nouveau style';
}
function resolveCharacter(item){
  if(typeof characters === 'undefined' || !Array.isArray(characters)) return null;
  let id = String(item?.character_id || item?.char_id || '');
  if(!id){
    const match = String(item?.source_url || item?.url || '').match(/\/character\/0*(\d+)/i);
    if(match) id = numericCharacters[String(Number(match[1]))] || '';
  }
  if(id){
    const direct = characters.find(c => String(c.id) === id);
    if(direct) return direct;
  }
  const title = norm(item?.title || '');
  return characters.find(c => norm(c.name) === title) || null;
}
function resolveStyle(item, character){
  if(typeof styles === 'undefined' || !character) return null;
  const explicit = String(item?.style_id || '');
  if(explicit && styles[explicit]) return {id:explicit, value:styles[explicit]};
  const subtitle = norm((currentLang()==='fr' ? item?.subtitle_fr : item?.subtitle_en) || item?.subtitle || '');
  const ids = Array.from(new Set((character.styles || []).map(String)));
  const id = ids.find(key => styles[key] && norm(typeof styles[key].name==='object' ? (styles[key].name[currentLang()] || styles[key].name.fr || styles[key].name.en) : styles[key].name) === subtitle) || ids[0];
  return id && styles[id] ? {id, value:styles[id]} : null;
}
function displayTitle(item, character){
  const raw = clean(item?.title || '');
  if(character && (!raw || /^character\s*\d+$/i.test(raw))) return character.name;
  return raw || character?.name || 'My Hero Ultra Rumble';
}

function install(){
  if(typeof releaseCard !== 'function') return;
  const next = function(item){
    const kind = releaseKind(item);
    const character = resolveCharacter(item);
    const style = resolveStyle(item, character);
    const title = displayTitle(item, character);
    const subtitleRaw = (currentLang()==='fr' ? item?.subtitle_fr : item?.subtitle_en) || item?.subtitle || '';
    const subtitle = kind==='style' && style ? (typeof style.value.name==='object' ? (style.value.name[currentLang()] || style.value.name.fr || style.value.name.en) : style.value.name) : (clean(subtitleRaw) || labelFor(kind));
    /* Les images de Latest Releases sont déjà des bannières officielles : on les utilise directement. */
    const banner = item?.image || item?.banner || item?.art || item?.character_art || style?.value?.portrait || character?.portrait || '';
    const typeIcon = kind==='character' ? 'assets/home/icons/release_character.png' : kind==='costume' ? 'assets/home/icons/release_costume.png' : 'assets/home/icons/release_style.png';
    const charId = character?.id || item?.character_id || '';
    const styleId = style?.id || item?.style_id || '';
    return `<button type="button" class="releaseCardV299 releaseBannerCardV9" data-release-char="${esc(charId)}" data-release-style="${esc(styleId)}" onclick="openHomeReleaseV298(this)" aria-label="${esc(title)} — ${esc(subtitle)}" title="${esc(title)} — ${esc(subtitle)}"><span class="releaseBannerImageV9">${typeof img==='function' ? img(banner,title,'releaseBannerImgV9') : `<img src="${esc(banner)}" alt="${esc(title)}">`}</span><span class="releaseBannerShadeV9"></span><span class="releaseBadgeV299 ${kind}">${typeof img==='function' ? img(typeIcon,labelFor(kind)) : ''}</span><span class="releaseNewBadgeV9" aria-hidden="true"></span><span class="releaseNamesV299"><b>${esc(title)}</b><small>${esc(subtitle)}</small></span></button>`;
  };
  window.releaseCard = next;
  try{ releaseCard = next; }catch(_e){}
}
install();
})();
