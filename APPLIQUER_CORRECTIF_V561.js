const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const BACKUP = path.join(ROOT, '.mhur-v561-backup');

function fail(message) {
  console.error('\nERREUR V561: ' + message);
  process.exit(1);
}

function read(relative) {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) fail('Fichier introuvable: ' + relative + '. Lance le script depuis la racine de mhur-france.');
  return fs.readFileSync(file, 'utf8');
}

function write(relative, content) {
  const file = path.join(ROOT, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function backup(relative) {
  const source = path.join(ROOT, relative);
  const target = path.join(BACKUP, relative);
  if (!fs.existsSync(source) || fs.existsSync(target)) return;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function replaceRequired(source, regex, replacement, label) {
  if (!regex.test(source)) {
    if (source.includes('MHUR V561 PATCHED: ' + label)) return source;
    fail('La version GitHub ne correspond plus au correctif pour: ' + label + '. Aucun fichier n’a été écrasé pour cette étape.');
  }
  return source.replace(regex, replacement);
}

if (!fs.existsSync(path.join(PUBLIC, 'index.html'))) {
  fail('public/index.html absent. Copie le contenu du ZIP dans la racine du dépôt mhur-france.');
}

const filesToBackup = [
  'public/index.html',
  'public/js/season18-fixes.js',
  'public/js/v559-stable-ui-fixes.js',
  'public/js/community-builds.js',
  'public/js/community-mods.js'
];
filesToBackup.forEach(backup);

/* ------------------------------------------------------------------------- */
/* 1. Patch notes: exact Alter, official skill name, no image for HP/general. */
/* ------------------------------------------------------------------------- */
let season = read('public/js/season18-fixes.js');
if (!season.includes('MHUR V561 PATCHED: patch skills')) {
  const helperBlock = `/* MHUR V561 PATCHED: patch skills */
function patchChangeText(change){
  return [change?.skill_name,change?.label,change?.title,change?.description,change?.text,change?.note,(change?.bullets||[]).join(' ')].map(CLEAN).filter(Boolean).join(' ');
}
function patchSkillKind(change){
  const raw=patchChangeText(change).toLowerCase();
  if(/α|\\balpha\\b/i.test(raw))return 'alpha';
  if(/β|\\bbeta\\b/i.test(raw))return 'beta';
  if(/γ|\\bgamma\\b/i.test(raw))return 'gamma';
  if(/special action|action sp[ée]ciale|\\bspecial\\b/i.test(raw))return 'special';
  return '';
}
function patchGeneralStat(change){
  const raw=patchChangeText(change).toLowerCase();
  return /(^|[^a-z])(hp|pv|health|max(?:imum)? hp|max(?:imum)? health|max(?:imum)? main health|pv maximum)([^a-z]|$)/i.test(raw);
}
function forcedPatchStyleId(change){
  const ch=NORM(change?.character||'');const st=NORM(change?.style||'');
  if(/gentle/.test(ch))return 'gentle_criminal_technical';
  if(/bakugo|katsuki/.test(ch)&&/cluster/.test(st))return 'bakugo_technical';
  if(/aizawa|shota/.test(ch)&&/flow_runner|strike/.test(st))return 'aizawa_strike';
  if(/present_mic|hizashi/.test(ch)&&/d_j_board|technical/.test(st))return 'present_mic_technical';
  if(/all_for_one|afo/.test(ch)&&/factor_fusion|strike/.test(st))return 'all_for_one_strike';
  if(/midoriya|izuku/.test(ch)&&/ofa|one_for_all/.test(st))return 'ofa';
  if(/mirko|rumi/.test(ch))return 'mirko_rapid';
  return '';
}
function styleForChange(change){
  const ch=characterBy(change?.character||'');if(!ch)return {ch:null,id:'',st:null};
  const ids=styleIds(ch);const forced=forcedPatchStyleId(change);const wanted=NORM(change?.style||'Original');
  let id=forced&&styles?.[forced]?forced:'';
  if(!id)id=ids.find(x=>NORM(typeof label==='function'?label(styles[x]?.name||'Original'):styles[x]?.name||'Original')===wanted)||'';
  if(!id){
    const skill=NORM(patchChangeText(change));
    id=ids.find(x=>[{...(styles[x]?.special||{}),letter:'SP'},...(styles[x]?.skills||[])].some(s=>{const n=NORM(typeof label==='function'?label(s?.name||''):s?.name||''),l=NORM(s?.letter);return (n&&skill.includes(n))||(l&&skill.includes(l))}))||'';
  }
  if(!id)id=ids[0]||'';
  return {ch,id,st:styles[id]||null};
}
function skillForChange(st,change){
  if(!st||patchGeneralStat(change))return null;
  const raw=patchChangeText(change);const normalized=NORM(raw);const kind=patchSkillKind(change);
  const all=[{...(st.special||{}),letter:'SP'},...(st.skills||[])];
  if(kind==='special')return all.find(s=>NORM(s?.letter)==='sp'||/special/.test(NORM(s?.letter)))||st.special||null;
  const wanted={alpha:['α','alpha'],beta:['β','beta'],gamma:['γ','gamma']}[kind]||[];
  if(wanted.length){const byLetter=all.find(s=>wanted.includes(String(s?.letter||'').toLowerCase())||wanted.includes(NORM(s?.letter)));if(byLetter)return byLetter;}
  return all.find(s=>{const n=NORM(typeof label==='function'?label(s?.name||''):s?.name||''),l=NORM(s?.letter);return (n&&normalized.includes(n))||(l&&normalized.includes(l))})||null;
}
function patchSkillDisplayName(skill,change){
  if(!skill)return translatePatch(CLEAN(change?.skill_name||change?.label||TX('Ajustement','Adjustment')));
  let name='';try{name=typeof label==='function'?label(skill.name||skill.label||''):CLEAN(skill.name||skill.label||'')}catch(_e){name=CLEAN(skill.name||skill.label||'')}
  return translatePatch(name||CLEAN(change?.skill_name||change?.label||TX('Ajustement','Adjustment')));
}
`;
  season = replaceRequired(
    season,
    /function styleForChange\(change\)\{[\s\S]*?\nfunction average\(values\)/,
    helperBlock + 'function average(values)',
    'patch skills'
  );
}

if (!season.includes('MHUR V561 PATCHED: patch renderer')) {
  const groupBlock = `/* MHUR V561 PATCHED: patch renderer */
function groupHtml(group,sectionTitle){
  const role=ROLE(group.st?.role||'technical');const side=group.ch?.side||'hero';
  return \`<article class="s18PatchCharacterV10 role-\${role}"><header><div class="s18PatchPortraitV10">\${group.st?.portrait&&typeof asset==='function'?asset(group.st.portrait,group.character):''}</div><div><h4>\${ESC(group.character)}</h4><strong>\${ESC(typeof label==='function'?label(group.st?.name||group.style):group.style)}</strong><div class="s18PatchBadgesV10"><span class="badge \${side==='villain'?'villain':'hero'}">\${ESC(SIDE_TEXT(side))}</span><span class="badge \${role}">\${ESC(ROLE_TEXT(role))}</span></div></div></header><div class="s18PatchChangesV10">\${group.changes.map(change=>{const tone=toneFor(change,sectionTitle);const skill=skillForChange(group.st,change);const title=patchSkillDisplayName(skill,change);const picture=skill?.img||'';const bullets=(change?.bullets||[]).map(translatePatch).filter(Boolean);return \`<section class="s18PatchChangeV10 \${tone} \${skill?'':'mhurPatchNoSkillImageV561'}"><span class="s18ToneV10 \${tone}">\${tone==='buff'?'BUFF':tone==='nerf'?'NERF':TX('NEUTRE','NEUTRAL')}</span><div class="s18PatchSkillV10">\${picture&&typeof asset==='function'?\`<div>\${asset(picture,title)}</div>\`:''}<main><h5>\${ESC(title)}</h5>\${change?.label?\`<p class="s18PatchLabelV10">\${ESC(translatePatch(change.label))}</p>\`:''}\${valuesHtml(change,tone)}\${bullets.length?\`<ul>\${bullets.map(b=>\`<li>\${ESC(b)}</li>\`).join('')}</ul>\`:''}</main></div></section>\`}).join('')}</div></article>\`;
}
`;
  season = replaceRequired(
    season,
    /function groupHtml\(group,sectionTitle\)\{[\s\S]*?\n\}\nfunction patchDetailHtml/,
    groupBlock + 'function patchDetailHtml',
    'patch renderer'
  );
}
write('public/js/season18-fixes.js', season);

/* ------------------------------------------------------------------------- */
/* 2. V559 corrections: All For One Strike and no forced removal of new skins. */
/* ------------------------------------------------------------------------- */
let v559 = read('public/js/v559-stable-ui-fixes.js');
v559 = v559.replace(
  /factor_fusion:\s*\{\s*style:\s*'overhaul_assault',\s*role:\s*'assault',\s*fallback:\s*'assets\/overhaul\/overhaul_assault\/portrait\.png'\s*\}/,
  "factor_fusion: {\n      style: 'all_for_one_strike',\n      role: 'strike',\n      fallback: 'assets/all_for_one/all_for_one_strike/portrait.png'\n    }"
);
v559 = v559.replace(
  /\{ character: \/overhaul\|kai chisaki\/, style: \/factor fusion\|assault\/, key: 'overhaul_assault' \}/,
  "{ character: /all for one|all_for_one|afo/, style: /factor fusion|strike/, key: 'all_for_one_strike' }"
);
v559 = v559.replace(
  /\s*\/\* La galerie « Loisirs d'été » montrée comme ancienne ne doit plus garder NEW\. \*\/\s*var groupText = normalize\([\s\S]*?active = false;\s*/,
  '\n'
);
write('public/js/v559-stable-ui-fixes.js', v559);


/* ------------------------------------------------------------------------- */
/* 3a. Mods: make language detection follow the actual selected language.    */
/* ------------------------------------------------------------------------- */
let mods = read('public/js/community-mods.js');
mods = mods.replace(
  "const tx=(fr,en)=>{try{return typeof lang!=='undefined'&&lang==='en'?en:fr}catch(_){return fr}};",
  "const tx=(fr,en)=>{try{const saved=localStorage.getItem('mhur_lang');const html=String(document.documentElement.lang||'').toLowerCase();const english=saved==='en'||html.startsWith('en')||(typeof lang!=='undefined'&&lang==='en');return english?en:fr}catch(_){return (typeof lang!=='undefined'&&lang==='en')?en:fr}};"
);
write('public/js/community-mods.js', mods);

/* ------------------------------------------------------------------------- */
/* 3. Build English strings that were hard-coded in French.                  */
/* ------------------------------------------------------------------------- */
let builds = read('public/js/community-builds.js');
builds = builds.replace("function cbIsEnglish(){return typeof lang!=='undefined'&&lang==='en'}", "function cbIsEnglish(){try{const saved=localStorage.getItem('mhur_lang');const html=String(document.documentElement.lang||'').toLowerCase();return saved==='en'||html.startsWith('en')||(typeof lang!=='undefined'&&lang==='en')}catch(_){return typeof lang!=='undefined'&&lang==='en'}}");
builds = builds.replaceAll("build.description||'Aucune description.'", "build.description||(cbIsEnglish()?'No description.':'Aucune description.')");
builds = builds.replace('<div><span>BUILD COMMUNAUTAIRE</span><h2>', "<div><span>${cbIsEnglish()?'COMMUNITY BUILD':'BUILD COMMUNAUTAIRE'}</span><h2>");
builds = builds.replace('<div class="cbDetailAuthor">Par ${cbAuthorButton(build)}', "<div class=\"cbDetailAuthor\">${cbIsEnglish()?'By':'Par'} ${cbAuthorButton(build)}");
builds = builds.replace('<b>● Communauté en ligne</b><span>Les builds et les cœurs sont partagés avec tous les visiteurs.</span>', "<b>● ${cbIsEnglish()?'Community online':'Communauté en ligne'}</b><span>${cbIsEnglish()?'Builds and hearts are shared with every visitor.':'Les builds et les cœurs sont partagés avec tous les visiteurs.'}</span>");
builds = builds.replace('return `<div class="cbLoading"><span></span>Chargement des builds…</div>`;', "return `<div class=\"cbLoading\"><span></span>${cbIsEnglish()?'Loading builds…':'Chargement des builds…'}</div>`;");
builds = builds.replace('return `<div class="cbEmpty">Aucun build pour ce style.<strong>Sois le premier à en publier un.</strong></div>`;', "return `<div class=\"cbEmpty\">${cbIsEnglish()?'No build for this style.':'Aucun build pour ce style.'}<strong>${cbIsEnglish()?'Be the first to publish one.':'Sois le premier à en publier un.'}</strong></div>`;");
write('public/js/community-builds.js', builds);

/* ------------------------------------------------------------------------- */
/* 4. Load V561 last and fix the CHARACTER tag in English.                    */
/* ------------------------------------------------------------------------- */
let index = read('public/index.html');
index = index.replace("`<div class=\"cardModeTag\">PERSONNAGE</div>`", "`<div class=\"cardModeTag\">${tr('charactersTag')}</div>`");
const cssTag = '<link rel="stylesheet" href="css/v561-github-final-fixes.css?v=561">';
const jsTag = '<script src="js/v561-github-final-fixes.js?v=561"></script>';
if (!index.includes('v561-github-final-fixes.css')) index = index.replace('</head>', '  <!-- V561 GitHub targeted fixes -->\n  ' + cssTag + '\n</head>');
if (!index.includes('v561-github-final-fixes.js')) index = index.replace('</body>', '  <!-- V561 must remain last -->\n  ' + jsTag + '\n</body>');
write('public/index.html', index);

console.log('\nCorrectif V561 applique avec succes.');
console.log('- Source utilisee: version actuelle du depot GitHub mhur-france');
console.log('- Sauvegarde: .mhur-v561-backup');
console.log('- Fais maintenant Commit to main puis Push origin.');
