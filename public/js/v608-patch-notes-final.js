/* MHUR Nexus — V608
   Rendu autonome et stable des Patch Notes.
   - restaure le contenu vide
   - sélectionne les bons styles Midoriya
   - affiche les images locales exactes dès le premier rendu
   - ne modifie pas les pages personnages
*/
(function(){
  'use strict';

  if(window.MHUR_V608_LOADED)return;
  window.MHUR_V608_LOADED=true;

  const VERSION='662';

  function clean(value){
    return String(value??'').trim();
  }

  function normal(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function language(){
    try{
      if(
        typeof lang!=='undefined'&&
        (lang==='fr'||lang==='en')
      ){
        return lang;
      }
    }catch(_error){}

    return String(document.documentElement.lang||'')
      .toLowerCase()
      .startsWith('en')
      ?'en'
      :'fr';
  }

  function tx(fr,en){
    return language()==='en'?en:fr;
  }

  function localized(value){
    if(
      value&&
      typeof value==='object'&&
      !Array.isArray(value)
    ){
      const current=language();

      return clean(
        value[current]??
        value.fr??
        value.en??
        ''
      );
    }

    return clean(value);
  }

  function escapeHtml(value){
    return clean(value).replace(
      /[&<>"']/g,
      character=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      })[character]
    );
  }

  function charactersList(){
    try{
      if(
        typeof characters!=='undefined'&&
        Array.isArray(characters)
      ){
        return characters;
      }
    }catch(_error){}

    return [];
  }

  function stylesMap(){
    try{
      if(
        typeof styles!=='undefined'&&
        styles&&
        typeof styles==='object'
      ){
        return styles;
      }
    }catch(_error){}

    return {};
  }

  function roleKey(value){
    return ({
      strike:'attack',
      attack:'attack',
      assault:'assault',
      technical:'technical',
      support:'support',
      rapid:'rapid',
      speed:'rapid'
    })[normal(value)]||'technical';
  }

  function roleText(value){
    const role=roleKey(value);

    const translations={
      attack:{
        fr:'Attaque',
        en:'Strike'
      },
      assault:{
        fr:'Assaut',
        en:'Assault'
      },
      technical:{
        fr:'Technique',
        en:'Technical'
      },
      support:{
        fr:'Soutien',
        en:'Support'
      },
      rapid:{
        fr:'Vitesse',
        en:'Rapid'
      }
    };

    return translations[role]?.[language()]||role;
  }

  function sideText(side){
    return normal(side)==='villain'
      ?tx('VILAINS','VILLAINS')
      :tx('HÉROS','HEROES');
  }

  function findCharacter(value){
    const wanted=normal(value);

    if(!wanted)return null;

    const list=charactersList();

    const exact=list.find(character=>
      normal(character?.id)===wanted||
      normal(character?.name)===wanted
    );

    if(exact)return exact;

    let best=null;
    let bestScore=0;

    list.forEach(character=>{
      const id=normal(character?.id);
      const name=normal(character?.name);
      let score=0;

      if(id&&wanted.includes(id)){
        score=Math.max(score,1000+id.length);
      }

      if(name&&wanted.includes(name)){
        score=Math.max(score,1000+name.length);
      }

      if(id&&id.includes(wanted)){
        score=Math.max(score,500+wanted.length);
      }

      if(name&&name.includes(wanted)){
        score=Math.max(score,500+wanted.length);
      }

      if(score>bestScore){
        bestScore=score;
        best=character;
      }
    });

    return best;
  }

  function styleIds(character){
    const map=stylesMap();

    return Array.from(
      new Set(
        Array.isArray(character?.styles)
          ?character.styles.map(String)
          :[]
      )
    ).filter(id=>map[id]);
  }

  function healthChange(change,sectionTitle=''){
    const value=normal(
      [
        sectionTitle,
        change?.skill_name,
        change?.label
      ].filter(Boolean).join(' ')
    );

    return (
      normal(change?.skill_name)==='hp'||
      normal(change?.skill_name)==='pv'||
      normal(change?.label)==='hp'||
      normal(change?.label)==='pv'||
      value.includes('balance_changes_health')||
      value.includes('equilibrage_pv')||
      value.includes('maximum_main_health')||
      value.includes('maximum_hp')
    );
  }

  function midoriyaStyleId(change,character){
    const characterKey=normal(
      change?.character||
      character?.name||
      character?.id
    );

    const skillKey=normal(
      change?.skill_name||
      change?.label
    );

    if(
      characterKey.includes('midoriya_ofa')||
      (
        skillKey.includes('delaware_smash_airblast')||
        skillKey.includes('rafale_d_air')||
        skillKey.includes('airblast')
      )
    ){
      return 'ofa';
    }

    if(
      skillKey.includes('delaware_smash_full_bullet')||
      skillKey.includes('full_bullet')
    ){
      return 'fullbullet';
    }

    if(
      skillKey.includes('delaware_smash_air_force')||
      skillKey.includes('air_force')
    ){
      return 'assault';
    }

    return '';
  }

  function skillLetter(value){
    const raw=clean(value);

    if(/^(?:α|a|alpha)(?:\s|[-—:(]|$)/i.test(raw)){
      return 'alpha';
    }

    if(/^(?:β|b|beta)(?:\s|[-—:(]|$)/i.test(raw)){
      return 'beta';
    }

    if(/^(?:γ|g|y|gamma)(?:\s|[-—:(]|$)/i.test(raw)){
      return 'gamma';
    }

    if(
      /^(?:sp|special|special action|action spéciale)(?:\s|[-—:(]|$)/i
        .test(raw)
    ){
      return 'special';
    }

    return '';
  }

  function inferredSkillKey(change){
    if(healthChange(change))return '';

    const raw=clean(
      change?.skill_name||
      change?.label
    );

    const direct=skillLetter(raw);

    if(direct)return direct;

    const value=normal(raw);

    const alpha=[
      'delaware_smash',
      'air_force',
      'airblast',
      'full_bullet',
      'ap_shot_cluster',
      'electro_target',
      'phantom_smash',
      'ice_bullet_shot',
      'wingbeat',
      'hollow_point_shot'
    ];

    if(alpha.some(key=>value.includes(key))){
      return 'alpha';
    }

    const beta=[
      'nitro_cluster',
      'wind_cross',
      'high_angle_fire'
    ];

    if(beta.some(key=>value.includes(key))){
      return 'beta';
    }

    const gamma=[
      'howitzer_impact',
      'big_fist_grip',
      'foot_boost',
      'kickback_shot'
    ];

    if(gamma.some(key=>value.includes(key))){
      return 'gamma';
    }

    const special=[
      'electrification',
      'scope_mode'
    ];

    if(special.some(key=>value.includes(key))){
      return 'special';
    }

    return '';
  }

  function allSkills(style){
    return [
      ...(Array.isArray(style?.skills)?style.skills:[]),
      style?.special
        ?{
          ...style.special,
          letter:'SP'
        }
        :null
    ].filter(Boolean);
  }

  function skillFromStyle(style,change){
    if(!style||healthChange(change))return null;

    const raw=normal(
      change?.skill_name||
      change?.label
    );

    const skills=allSkills(style);

    const exact=skills
      .map(skill=>{
        const name=normal(localized(skill?.name));
        let score=0;

        if(name&&raw===name){
          score=4000;
        }else if(name&&raw.includes(name)){
          score=3000+name.length;
        }else if(name&&name.includes(raw)){
          score=2000+raw.length;
        }

        return {
          skill,
          score
        };
      })
      .sort((a,b)=>b.score-a.score)
      .find(row=>row.score>0)
      ?.skill;

    if(exact)return exact;

    const key=inferredSkillKey(change);

    if(!key)return null;

    return skills.find(skill=>{
      const letter=skillLetter(skill?.letter);

      return letter===key;
    })||null;
  }

  function resolveStyle(change){
    const map=stylesMap();
    const explicitId=clean(
      change?.style_id||
      change?.styleId||
      ''
    );

    const explicitCharacter=explicitId
      ?charactersList().find(character=>
        Array.isArray(character?.styles)&&
        character.styles.map(String).includes(explicitId)
      )
      :null;

    const character=
      explicitCharacter||
      findCharacter(change?.character);

    const ids=styleIds(character);

    if(
      explicitId&&
      ids.includes(explicitId)&&
      map[explicitId]
    ){
      return {
        character,
        id:explicitId,
        style:map[explicitId]
      };
    }

    const midoriyaId=midoriyaStyleId(
      change,
      character
    );

    if(midoriyaId&&map[midoriyaId]){
      return {
        character,
        id:midoriyaId,
        style:map[midoriyaId]
      };
    }

    const wanted=normal(change?.style||'Original');

    const byStyle=ids.find(id=>
      normal(localized(map[id]?.name)||'Original')===wanted
    );

    if(byStyle){
      return {
        character,
        id:byStyle,
        style:map[byStyle]
      };
    }

    const id=ids[0]||'';

    return {
      character,
      id,
      style:map[id]||null
    };
  }

  function translatePatch(value){
    let output=localized(value);

    if(language()==='en')return output;

    const exact={
      HP:'PV',
      Health:'PV',
      Ammo:'Munitions',
      Magazine:'Munitions',
      Damage:'Dégâts',
      'Guard Break':'Brise-garde',
      'Special Action':'Action spéciale',
      'No. of Rounds':'Munitions',
      Adjustment:'Neutre'
    };

    if(exact[output])return exact[output];

    const replacements=[
      [/^Data Update/i,'Mise à jour des données'],
      [/^Balance Changes:\s*/i,'Équilibrage : '],
      [/Maximum Main Health|Maximum HP|Max HP/gi,'PV maximum'],
      [/\bHP\b/gi,'PV'],
      [/No\. of Rounds|Magazine/gi,'Munitions'],
      [/Ammo/gi,'Munitions'],
      [/Guard Break/gi,'Brise-garde'],
      [/Damage/gi,'Dégâts'],
      [/Special Action/gi,'Action spéciale'],
      [/Before/gi,'Avant'],
      [/After/gi,'Après'],
      [/Adjustment/gi,'Neutre']
    ];

    replacements.forEach(([pattern,replacement])=>{
      output=output.replace(pattern,replacement);
    });

    return output;
  }

  function imageHtml(src,alt,className=''){
    if(!src)return '';

    const cleanSrc=clean(src);
    const separator=cleanSrc.includes('?')?'&':'?';

    return `<img
      src="${escapeHtml(cleanSrc+separator+'v='+VERSION)}"
      alt="${escapeHtml(alt)}"
      class="${escapeHtml(className)}"
      loading="eager"
      decoding="async"
      fetchpriority="high"
    >`;
  }

  function average(values){
    const numbers=(
      Array.isArray(values)
        ?values
        :[values]
    )
      .map(value=>
        parseFloat(
          clean(value).replace(',','.')
        )
      )
      .filter(Number.isFinite);

    if(!numbers.length)return null;

    return numbers.reduce(
      (sum,value)=>sum+value,
      0
    )/numbers.length;
  }

  function toneFor(change,sectionTitle=''){
    const explicit=normal(
      change?.tone||
      change?.type
    );

    if(/buff|increase|improve|up/.test(explicit)){
      return 'buff';
    }

    if(/nerf|decrease|reduce|down/.test(explicit)){
      return 'nerf';
    }

    const before=average(change?.before);
    const after=average(change?.after);

    if(
      before==null||
      after==null||
      before===after
    ){
      return 'adjust';
    }

    const context=normal(
      sectionTitle+' '+
      localized(change?.label)+' '+
      localized(change?.skill_name)
    );

    const lowerIsBetter=
      /reload|cooldown|recharge|time|second|seconde/
        .test(context);

    if(lowerIsBetter){
      return after<before?'buff':'nerf';
    }

    return after>before?'buff':'nerf';
  }

  function valuesHtml(change,tone){
    const before=Array.isArray(change?.before)
      ?change.before
      :[change?.before];

    const after=Array.isArray(change?.after)
      ?change.after
      :[change?.after];

    const count=Math.max(
      before.length,
      after.length
    );

    if(count>1){
      return `<div class="s18PatchTableWrapV10">
        <table class="s18PatchTableV10">
          <thead>
            <tr>
              <th></th>
              ${Array.from(
                {length:count},
                (_value,index)=>`<th>Lv.${index+1}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="before">
              <th>${tx('Avant','Before')}</th>
              ${Array.from(
                {length:count},
                (_value,index)=>`<td>${
                  escapeHtml(before[index]??'')
                }</td>`
              ).join('')}
            </tr>
            <tr class="after ${tone}">
              <th>${tx('Après','After')}</th>
              ${Array.from(
                {length:count},
                (_value,index)=>`<td>${
                  escapeHtml(after[index]??'')
                }</td>`
              ).join('')}
            </tr>
          </tbody>
        </table>
      </div>`;
    }

    if(
      change?.before!=null||
      change?.after!=null
    ){
      return `<div class="s18PatchRow">
        <span class="s18PatchBefore">
          ${escapeHtml(before[0]??'—')}
        </span>
        <span class="s18PatchArrow">→</span>
        <span class="s18PatchAfter ${tone}">
          ${escapeHtml(after[0]??'—')}
        </span>
      </div>`;
    }

    return '';
  }

  function groupChanges(section){
    const groups=[];
    const map=new Map();

    (
      Array.isArray(section?.changes)
        ?section.changes
        :[]
    ).filter(Boolean).forEach(change=>{
      const resolved=resolveStyle(change);

      const key=[
        normal(
          resolved.character?.id||
          change?.character
        ),
        resolved.id||
        normal(change?.style||'Original')
      ].join('__');

      if(!map.has(key)){
        const group={
          character:resolved.character,
          id:resolved.id,
          style:resolved.style,
          name:resolved.character?.name||
            localized(change?.character),
          changes:[]
        };

        map.set(key,group);
        groups.push(group);
      }

      map.get(key).changes.push(change);
    });

    return groups;
  }

  function changeHtml(group,change,sectionTitle){
    const tone=toneFor(change,sectionTitle);
    const health=healthChange(
      change,
      sectionTitle
    );

    const skill=health
      ?null
      :skillFromStyle(group.style,change);

    const title=translatePatch(
      localized(change?.display_skill_name)||
      localized(change?.skill_name)||
      localized(change?.label)||
      tx('Ajustement','Adjustment')
    );

    /*
      Pour Midoriya, l'image vient toujours du style exact
      choisi par resolveStyle. skill_image ne peut plus
      imposer Gamma ou Action spéciale.
    */
    const isMidoriya=normal(group.name)
      .includes('midoriya');

    const picture=health
      ?''
      :(
        isMidoriya
          ?(skill?.img||change?.skill_image||'')
          :(change?.skill_image||skill?.img||'')
      );

    const bullets=(
      Array.isArray(change?.bullets)
        ?change.bullets
        :[]
    )
      .map(translatePatch)
      .filter(Boolean);

    return `<section
      class="s18PatchChangeV10 ${tone}"
      data-v608-style="${escapeHtml(group.id)}"
    >
      <span class="s18ToneV10 ${tone}">
        ${
          tone==='buff'
            ?'BUFF'
            :tone==='nerf'
              ?'NERF'
              :tx('NEUTRE','NEUTRAL')
        }
      </span>

      <div class="s18PatchSkillV10${
        picture?'':' s18NoSkillImageV608'
      }">
        ${
          picture
            ?`<div class="s18PatchImageV608">${
              imageHtml(picture,title)
            }</div>`
            :''
        }

        <main>
          <h5>${escapeHtml(title)}</h5>

          ${
            change?.label
              ?`<p class="s18PatchLabelV10">${
                escapeHtml(
                  translatePatch(change.label)
                )
              }</p>`
              :''
          }

          ${valuesHtml(change,tone)}

          ${
            bullets.length
              ?`<ul>${
                bullets.map(
                  bullet=>`<li>${
                    escapeHtml(bullet)
                  }</li>`
                ).join('')
              }</ul>`
              :''
          }
        </main>
      </div>
    </section>`;
  }

  function groupHtml(group,sectionTitle){
    const style=group.style||{};
    const role=roleKey(style.role);
    const side=group.character?.side||'hero';
    const styleName=
      localized(style.name)||
      tx('Original','Original');

    return `<article
      class="s18PatchCharacterV10 role-${role}"
      data-v608-character="${
        escapeHtml(group.name)
      }"
      data-v608-style="${
        escapeHtml(group.id)
      }"
    >
      <header>
        <div class="s18PatchPortraitV10">
          ${
            style.portrait
              ?imageHtml(
                style.portrait,
                group.name
              )
              :''
          }
        </div>

        <div>
          <h4>${escapeHtml(group.name)}</h4>
          <strong>${escapeHtml(styleName)}</strong>

          <div class="s18PatchBadgesV10">
            <span class="badge ${
              normal(side)==='villain'
                ?'villain'
                :'hero'
            }">
              ${escapeHtml(sideText(side))}
            </span>

            <span class="badge ${role}">
              ${escapeHtml(roleText(role))}
            </span>
          </div>
        </div>
      </header>

      <div class="s18PatchChangesV10">
        ${group.changes.map(change=>
          changeHtml(
            group,
            change,
            sectionTitle
          )
        ).join('')}
      </div>
    </article>`;
  }

  function patchDetailHtml(note){
    const sections=(
      Array.isArray(note?.details)
        ?note.details
        :[]
    )
      .map(section=>({
        ...section,
        changes:(
          Array.isArray(section?.changes)
            ?section.changes
            :[]
        ).filter(Boolean)
      }))
      .filter(section=>section.changes.length);

    if(sections.length){
      return sections.map(section=>
        `<section class="s18PatchSectionV10">
          <h3>${
            escapeHtml(
              translatePatch(section.title)
            )
          }</h3>

          ${
            section.note
              ?`<p>${
                escapeHtml(
                  translatePatch(section.note)
                )
              }</p>`
              :''
          }

          <div class="s18PatchSeparatedV10">
            ${groupChanges(section).map(group=>
              groupHtml(
                group,
                localized(section.title)
              )
            ).join('')}
          </div>
        </section>`
      ).join('');
    }

    const blocks=Array.isArray(note?.rich_blocks)
      ?note.rich_blocks
      :[];

    if(blocks.length){
      return `<div class="s18DevArticleV10">
        ${blocks.map(block=>{
          if(block?.type==='heading'){
            return `<h3>${
              escapeHtml(
                translatePatch(block.text)
              )
            }</h3>`;
          }

          if(block?.type==='image'&&block.src){
            return `<figure>${
              imageHtml(
                block.src,
                block.alt||''
              )
            }</figure>`;
          }

          return `<p>${
            escapeHtml(
              translatePatch(block?.text)
            )
          }</p>`;
        }).join('')}
      </div>`;
    }

    return `<p>${
      tx(
        'Aucun détail disponible.',
        'No details available.'
      )
    }</p>`;
  }

  function devHtml(){
    const sources=[
      window.MHUR_S18_V14?.devHtml,
      window.MHUR_S18_V13?.devHtml,
      window.MHUR_S18_V10?.devHtml
    ];

    for(const source of sources){
      if(
        typeof source==='function'&&
        source!==devHtml
      ){
        try{
          const result=String(source()||'').trim();

          if(result){
            return result;
          }
        }catch(_error){}
      }
    }

    return `<article class="s18DevArticleV10">
      <div class="s18DevHeroV10">
        <span>DEV BLOG VOL. 27</span>
        <h2>Developer Notes — Season 18</h2>
        <p>29/07/2026 · Bandai Namco / Byking</p>
      </div>

      <section>
        <h3>${tx(
          '20 millions de téléchargements',
          '20 million downloads'
        )}</h3>
        <p>${tx(
          'Un bonus de connexion spécial de 28 jours célèbre ce cap, avec notamment 6 000 Cristaux Héros et 100 Tickets de tirage.',
          'A special 28-day login bonus celebrates the milestone, including 6,000 Hero Crystals and 100 Roll Tickets.'
        )}</p>
      </section>

      <section>
        <h3>Gentle Criminal & La Brava</h3>
        <p>${tx(
          "Gentle est pensé comme un personnage Technique très mobile. Son Alter Élasticité crée des rebonds, une barrière d'air et un trampoline utilisable par les alliés. La Brava le soutient avec son drone et Lover Mode augmente sa puissance et sa recharge pendant Plus Chaos.",
          'Gentle is designed as a highly mobile Technical character. Elasticity creates rebounds, an air barrier, and an ally-usable trampoline. La Brava supports him with her drone, while Lover Mode boosts attack and reload during Plus Chaos.'
        )}</p>
      </section>

      <section>
        <h3>Chaos City Ver. 02</h3>
        <p>${tx(
          'Le quartier commercial a été profondément rénové et une nouvelle zone souterraine, Tentoin Alley, permet de circuler par des passages sous la ville.',
          'The shopping district has been heavily renovated, with the new underground Tentoin Alley area connecting parts of the city.'
        )}</p>
      </section>

      <section>
        <h3>Research Notebook</h3>
        <p>${tx(
          'La Mission n° 3, plus difficile, est ajoutée. Le niveau maximum passe à 200 avec de nouvelles récompenses, dont des Tickets et des objets T.U.N.I.N.G.',
          'The more challenging Mission No. 3 is added. The level cap rises to 200 with new rewards, including Tickets and T.U.N.I.N.G items.'
        )}</p>
      </section>

      <section>
        <h3>3-Pick Battle</h3>
        <p>${tx(
          'Ce nouveau mode est prévu à partir de la fin août. Chaque joueur choisit trois styles et le vainqueur est celui qui inflige le plus de dégâts.',
          'This new mode is planned from late August. Each player selects three styles, and the winner is the player who deals the most damage.'
        )}</p>
      </section>

      <div class="s18OfficialLinksV10">
        <a
          href="https://en.bandainamcoent.eu/my-hero-academia/news/my-hero-ultra-rumble-development-blog-vol-27"
          target="_blank"
          rel="noopener"
        >
          ${tx(
            'Lire la Dev Note officielle',
            'Read the official Dev Note'
          )}
        </a>

        <a
          href="https://en.bandainamcoent.eu/my-hero-academia/news/my-hero-ultra-rumble-season-18"
          target="_blank"
          rel="noopener"
        >
          ${tx(
            'Voir la page officielle Saison 18',
            'View the official Season 18 page'
          )}
        </a>
      </div>
    </article>`;
  }

  function ensureModal(){
    let modal=document.getElementById(
      's18NotesDevModalV10'
    );

    if(!modal){
      modal=document.createElement('div');
      modal.id='s18NotesDevModalV10';
      modal.className='s18NotesOverlayV10';

      modal.innerHTML=`<section
        class="s18NotesPanelV10"
        tabindex="-1"
      >
        <header>
          <div>
            <span>MHUR NEXUS</span>
            <h2 data-notes-title>
              Patch Notes / Dev Notes
            </h2>
          </div>

          <button type="button" data-close>
            ×
          </button>
        </header>

        <nav>
          <button
            type="button"
            data-tab="patch"
            class="active"
          >
            Patch Notes
          </button>

          <button
            type="button"
            data-tab="dev"
          >
            Dev Notes
          </button>
        </nav>

        <div class="s18NotesBodyV10">
          <aside></aside>
          <main></main>
        </div>
      </section>`;

      document.body.appendChild(modal);
    }

    modal.querySelector('[data-notes-title]')
      .textContent='Patch Notes / Dev Notes';

    modal.querySelector('[data-tab="patch"]')
      .textContent='Patch Notes';

    modal.querySelector('[data-tab="dev"]')
      .textContent='Dev Notes';

    const close=modal.querySelector('[data-close]');

    if(close){
      close.onclick=closeNotes;
    }

    modal.onclick=event=>{
      if(event.target===modal){
        closeNotes();
      }
    };

    return modal;
  }

  function closeNotes(){
    const modal=document.getElementById(
      's18NotesDevModalV10'
    );

    if(!modal)return;

    modal.classList.remove('open');
    document.body.classList.remove(
      's18NotesOpenV11'
    );
  }

  function resetScroll(modal,asideToo=false){
    const main=modal.querySelector(
      '.s18NotesBodyV10>main'
    );

    const aside=modal.querySelector(
      '.s18NotesBodyV10>aside'
    );

    if(main)main.scrollTop=0;
    if(asideToo&&aside)aside.scrollTop=0;
  }

  function notes(){
    const rows=window.MHUR_HOME_DATA?.patch_notes;

    return Array.isArray(rows)?rows:[];
  }

  function showPatch(index=0){
    const modal=ensureModal();
    const rows=notes();
    const safeIndex=Math.max(
      0,
      Math.min(
        Number(index)||0,
        Math.max(0,rows.length-1)
      )
    );

    const note=rows[safeIndex];
    const aside=modal.querySelector(
      '.s18NotesBodyV10>aside'
    );

    const main=modal.querySelector(
      '.s18NotesBodyV10>main'
    );

    aside.innerHTML=rows.length
      ?rows.map((row,rowIndex)=>
        `<button
          type="button"
          data-v608-patch-index="${rowIndex}"
          class="${
            rowIndex===safeIndex
              ?'active'
              :''
          }"
        >
          <b>${
            escapeHtml(
              translatePatch(row.title)
            )
          }</b>

          <small>${
            row.date
              ?new Date(row.date).toLocaleDateString(
                language()==='fr'
                  ?'fr-FR'
                  :'en-US'
              )
              :''
          }</small>
        </button>`
      ).join('')
      :`<p>${
        tx(
          'Aucune note disponible.',
          'No notes available.'
        )
      }</p>`;

    if(!note){
      main.innerHTML=`<p>${
        tx(
          'Aucune note disponible.',
          'No notes available.'
        )
      }</p>`;

      return;
    }

    /*
      Le titre est posé avant les détails. Même si une donnée future est
      imparfaite, le panneau ne reste jamais entièrement vide.
    */
    main.innerHTML=`<div
      class="s18PatchDetailHeadV10"
    >
      <h2>${
        escapeHtml(
          translatePatch(note.title)
        )
      }</h2>

      <div>
        <span class="buff">BUFF</span>
        <span class="nerf">NERF</span>
        <span class="adjust">
          ${tx('NEUTRE','NEUTRAL')}
        </span>
      </div>
    </div>

    <div data-v608-patch-content>
      ${patchDetailHtml(note)}
    </div>`;

    resetScroll(modal,false);
  }

  function showDev(){
    const modal=ensureModal();

    modal.querySelector(
      '.s18NotesBodyV10>aside'
    ).innerHTML=`<div class="s18DevSideV10">
      <b>DEV BLOG VOL. 27</b>
      <small>${tx('Saison 18','Season 18')}</small>
    </div>`;

    modal.querySelector(
      '.s18NotesBodyV10>main'
    ).innerHTML=devHtml();

    resetScroll(modal,true);
  }

  function selectTab(tab){
    const modal=ensureModal();

    modal.querySelectorAll(
      '[data-tab]'
    ).forEach(button=>{
      button.classList.toggle(
        'active',
        button.dataset.tab===tab
      );
    });

    if(tab==='dev'){
      showDev();
    }else{
      showPatch(0);
    }
  }

  function openNotes(){
    const modal=ensureModal();

    modal.classList.add('open');
    document.body.classList.add(
      's18NotesOpenV11'
    );

    selectTab('patch');

    requestAnimationFrame(()=>{
      window.MHUR_S18_V18
        ?.refreshNotesLayout?.();

      window.MHUR_S18_V17
        ?.refreshNotesLayout?.();

      resetScroll(modal,true);

      modal.querySelector(
        '.s18NotesPanelV10'
      )?.focus?.({
        preventScroll:true
      });
    });
  }

  function installApi(){
    for(const key of [
      'MHUR_S18_V10',
      'MHUR_S18_V13',
      'MHUR_S18_V14'
    ]){
      const current=window[key]||{};

      window[key]={
        ...current,
        openNotes,
        showPatch
      };
    }

    window.MHUR_V608={
      openNotes,
      showPatch,
      selectTab,
      refresh:()=>showPatch(0)
    };
  }

  function installButton(){
    const buttons=document.querySelectorAll(
      '#mhurPatchDevButtonV14,'+
      '.mhurPatchDevButtonV14,'+
      '[data-s18-notes-button]'
    );

    buttons.forEach(button=>{
      button.onclick=openNotes;
    });
  }

  /*
    Capture avant les anciens onclick :
    l'ancien moteur ne peut plus effacer notre rendu.
  */
  document.addEventListener(
    'click',
    event=>{
      const notesButton=event.target?.closest?.(
        '#mhurPatchDevButtonV14,'+
        '.mhurPatchDevButtonV14,'+
        '[data-s18-notes-button]'
      );

      if(notesButton){
        event.preventDefault();
        event.stopImmediatePropagation();
        openNotes();
        return;
      }

      const tab=event.target?.closest?.(
        '#s18NotesDevModalV10 [data-tab]'
      );

      if(tab){
        event.preventDefault();
        event.stopImmediatePropagation();
        selectTab(tab.dataset.tab);
        return;
      }

      const patchButton=event.target?.closest?.(
        '#s18NotesDevModalV10 '+
        '[data-v608-patch-index]'
      );

      if(patchButton){
        event.preventDefault();
        event.stopImmediatePropagation();
        showPatch(
          Number(
            patchButton.dataset.v608PatchIndex
          )
        );
      }
    },
    true
  );

  function start(){
    installApi();
    installButton();

    /*
      Si la fenêtre était déjà ouverte et vide au moment du chargement,
      elle est réparée immédiatement.
    */
    const modal=document.getElementById(
      's18NotesDevModalV10'
    );

    if(modal?.classList.contains('open')){
      showPatch(0);
    }
  }

  window.addEventListener(
    'mhur:languagechange',
    ()=>{
      installApi();
      installButton();

      const modal=document.getElementById(
        's18NotesDevModalV10'
      );

      if(modal?.classList.contains('open')){
        const devActive=modal.querySelector(
          '[data-tab="dev"]'
        )?.classList.contains('active');

        if(devActive){
          selectTab('dev');
        }else{
          showPatch(0);
        }
      }
    }
  );

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
    ()=>{
      installApi();
      installButton();
    },
    {once:true}
  );
})();
