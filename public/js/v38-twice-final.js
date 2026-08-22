(() => {
  'use strict';

  const FR = {
    style: 'Parade misérable',
    alpha: 'Rubans critiques',
    beta: 'Parade misérable',
    gamma: 'Soutien-clonage',
    special: 'Folle imitation'
  };

  const EN = {
    style: "Sad Man's Parade",
    alpha: 'Critical Tape Measure',
    beta: "Sad Man's Parade",
    gamma: 'Help Duplicate',
    special: 'Mad Imitation'
  };

  /* MHUR_V41_TWICE_DATA */
  const DESCRIPTIONS={
    alpha:{fr:"Projette les rubans de Twice pour attaquer à distance. Les dégâts critiques sont détaillés séparément dans les valeurs supplémentaires.",en:"Launches Twice's tape measures for a ranged attack. Critical damage is listed separately in the additional values."},
    beta:{fr:"Déploie les doubles de Twice pour attaquer autour de la zone. Les dégâts de proximité, de tir et de déploiement sont détaillés séparément ci-dessous.",en:"Deploys Twice's doubles to attack around the area. Near, shot and deploy damage are listed separately below."},
    gamma:{fr:"Crée un double de soutien. Les différents tirs du double sont détaillés séparément dans les valeurs supplémentaires.",en:"Creates a support duplicate. The duplicate's different shots are listed separately in the additional values."},
    special:{fr:"Achève un adversaire à terre et crée son clone. Le clone reste présent jusqu'à ce qu'il soit vaincu ou que l'adversaire soit réanimé.",en:"Finishes off a downed opponent and creates their clone. The clone remains until defeated or the opponent revives."}
  };

  function language(){
    try{
      return window.lang === 'en' ? 'en' : 'fr';
    }catch(_error){
      return 'fr';
    }
  }

  function localized(value){
    if(value && typeof value === 'object' && !Array.isArray(value)){
      return value[language()] ?? value.fr ?? value.en ?? '';
    }
    return value ?? '';
  }

  function clean(value){
    return String(localized(value) ?? '')
      .replace(/\s+/g,' ')
      .trim();
  }

  function normal(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[’']/g,'')
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function stylesData(){
    try{
      if(typeof styles!=='undefined' && styles) return styles;
    }catch(_error){}
    return window.styles || {};
  }

  function charactersData(){
    try{
      if(typeof characters!=='undefined' && Array.isArray(characters)){
        return characters;
      }
    }catch(_error){}
    return Array.isArray(window.characters) ? window.characters : [];
  }

  function exactPayload(){
    try{
      const node=document.getElementById('ultrarumble-exact-data');
      return node ? JSON.parse(node.textContent || '{}') : {};
    }catch(_error){
      return {};
    }
  }

  function withoutJapanese(value){
    return String(value ?? '')
      .replace(/クリティカル/gi,'Critical')
      .replace(/分身Shot/gi,'Clone Shot')
      .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]+/g,'')
      .replace(/\(\s*\)/g,'')
      .replace(/\s+/g,' ')
      .trim();
  }

  function translateEffect(value){
    let output=withoutJapanese(value);

    if(language()==='en') return output;

    const replacements=[
      [/Clone Battle Time/gi,'Durée du clone'],
      [/Clone Skill Level/gi,'Niveau des Alters du clone'],
      [/No\. of Rounds/gi,'Munitions'],
      [/Reload Speed/gi,'Vitesse de recharge'],
      [/Damage Area/gi,'Zone de dégâts'],
      [/Attack Range/gi,"Portée d'attaque"],
      [/Connection Distance/gi,'Distance de connexion'],
      [/Movement Distance/gi,'Distance de déplacement'],
      [/Dash Range/gi,'Distance de ruée'],
      [/Attack Power/gi,"Puissance d'attaque"],
      [/Damage/gi,'Dégâts'],
      [/Ammo/gi,'Munitions'],
      [/Reload/gi,'Recharge'],
      [/Range/gi,'Portée'],
      [/Size/gi,'Taille'],
      [/Speed/gi,'Vitesse']
    ];

    replacements.forEach(([from,to])=>{
      output=output.replace(from,to);
    });

    return output;
  }

  function translateType(value){
    const output=withoutJapanese(value);
    if(language()==='en') return output;

    const key=normal(output);

    if(key.includes('critical')) return 'Critique';
    if(key.includes('melee')) return 'Corps à corps';
    if(key==='set'||key.includes('placement')) return 'Placement';
    if(key.includes('bodyshot')||key.includes('body_shot')) return 'Tir corporel';
    if(key.includes('clone_shot')) return 'Tir du clone';
    if(key==='shot'||key.endsWith('_shot')) return 'Tir';
    if(key.includes('bullet')) return 'Projectile';
    if(key.includes('rush')) return 'Ruée';
    if(key.includes('rebound')||key.includes('bounce')) return 'Rebond';
    return output;
  }

  function columnFr(value){
    const key=normal(value);
    return ({
      level:'Niveau',
      level_up_effect:'Effet de montée',
      effect:'Effet de montée',
      damage:'Dégâts',
      ammo:'Munitions',
      no_of_rounds:'Munitions',
      use_ammo:'Consommation',
      reload:'Recharge',
      down_power:'Down Power',
      guard_break:'Brise-garde',
      type:'Type'
    })[key] || withoutJapanese(value);
  }

  function tableFromSource(source,titleFr,titleEn,mode=''){
    if(!source || typeof source !== 'object') return null;

    const columns=Array.isArray(source.columns)
      ?source.columns.map(withoutJapanese)
      :[];

    const rows=Array.isArray(source.rows)
      ?source.rows.filter(Array.isArray)
      :[];

    if(!columns.length || !rows.length) return null;

    const typeIndex=columns.findIndex(column=>normal(column)==='type');
    let effectIndex=columns.findIndex(column=>
      ['level_up_effect','effect'].includes(normal(column))
    );
    if(mode==='effect' && effectIndex<0 && columns.length>=2){
      effectIndex=1;
    }

    const enRows=rows.map(row=>row.map(withoutJapanese));
    const frRows=enRows.map(row=>row.map((cell,index)=>{
      if(mode==='effect' && index===effectIndex){
        const current=language();
        try{
          window.lang='fr';
          return translateEffect(cell);
        }catch(_error){
          return cell;
        }finally{
          try{ window.lang=current; }catch(_error){}
        }
      }

      if(mode==='type' && index===typeIndex){
        const current=language();
        try{
          window.lang='fr';
          return translateType(cell);
        }catch(_error){
          return cell;
        }finally{
          try{ window.lang=current; }catch(_error){}
        }
      }

      return cell;
    }));

    return {
      title:{fr:titleFr,en:titleEn},
      cols:{
        fr:columns.map(columnFr),
        en:columns
      },
      rows:{
        fr:frRows,
        en:enRows
      },
      __v38:true
    };
  }

  function isTwiceSupport(row){
    if(!row || typeof row !== 'object') return false;
    if(normal(row.base_name || row.name)!=='twice') return false;

    const skillNames=['α','β','γ']
      .map(symbol=>normal(row.skills?.[symbol]?.name || ''))
      .join(' ');

    return (
      normal(row.role)==='support' ||
      skillNames.includes('critical_tape_measure') ||
      skillNames.includes('sad_mans_parade') ||
      skillNames.includes('help_duplicate')
    );
  }

  function findTwice(){
    const payload=exactPayload();
    const exact=payload.exact_by_style || {};

    for(const [styleId,row] of Object.entries(exact)){
      if(isTwiceSupport(row)){
        return {payload,row,styleId:String(styleId)};
      }
    }

    const row=(payload.characters || []).find(isTwiceSupport) || null;
    let styleId='';

    try{
      const character=charactersData().find(item=>
        normal(item?.id)==='twice' ||
        normal(item?.name)==='twice'
      );

      styleId=String(
        (character?.styles || []).find(id=>
          normal(stylesData()?.[id]?.role)==='support'
        ) || ''
      );
    }catch(_error){}

    return {payload,row,styleId};
  }

  function assetValues(row){
    return Object.values(row?.assets || {})
      .map(String)
      .filter(Boolean);
  }

  function assetByToken(row,token){
    return assetValues(row).find(value=>
      new RegExp(token,'i').test(value)
    ) || '';
  }

  function quirkImage(row,number){
    const namedKey={1:'alpha',2:'beta',3:'gamma'}[number];
    const named=String(row?.assets?.[namedKey] || '');
    if(named) return named;

    const direct=assetByToken(row,`Unique${number}`);
    if(direct) return direct;

    const base=[assetByToken(row,'Unique1'),assetByToken(row,'Unique2'),assetByToken(row,'Unique3')].find(Boolean);
    return base ? base.replace(/Unique[123]/i,`Unique${number}`) :'';
  }

  function specialImage(row){
    return (
      assetByToken(row,'SpecialSkill') ||
      String(row?.assets?.special || '') ||
      'https://ultrarumble.com/assets/Character/Ch037/GUI/Skill/T_ui_SpecialSkill_Ch037.png'
    );
  }

  function makeFrenchRows(columns,rows,mode){
    const typeIndex=columns.findIndex(column=>normal(column)==='type');
    let effectIndex=columns.findIndex(column=>
      ['level_up_effect','effect'].includes(normal(column))
    );
    if(mode==='effect' && effectIndex<0 && columns.length>=2){
      effectIndex=1;
    }

    return rows.map(row=>row.map((cell,index)=>{
      if(mode==='effect' && index===effectIndex){
        let out=withoutJapanese(cell);
        [
          [/Clone Battle Time/gi,'Durée du clone'],
          [/Clone Skill Level/gi,'Niveau des Alters du clone'],
          [/No\. of Rounds/gi,'Munitions'],
          [/Reload Speed/gi,'Vitesse de recharge'],
          [/Damage Area/gi,'Zone de dégâts'],
          [/Attack Range/gi,"Portée d'attaque"],
          [/Connection Distance/gi,'Distance de connexion'],
          [/Movement Distance/gi,'Distance de déplacement'],
          [/Dash Range/gi,'Distance de ruée'],
          [/Attack Power/gi,"Puissance d'attaque"],
          [/Damage/gi,'Dégâts'],
          [/Ammo/gi,'Munitions'],
          [/Reload/gi,'Recharge'],
          [/Range/gi,'Portée'],
          [/Size/gi,'Taille'],
          [/Speed/gi,'Vitesse']
        ].forEach(([from,to])=>{out=out.replace(from,to);});
        return out;
      }

      if(mode==='type' && index===typeIndex){
        const out=withoutJapanese(cell);
        const key=normal(out);
        if(key.includes('critical')) return 'Critique';
        if(key.includes('melee')) return 'Corps à corps';
        if(key==='set'||key.includes('placement')) return 'Placement';
        if(key.includes('bodyshot')||key.includes('body_shot')) return 'Tir corporel';
        if(key.includes('clone_shot')) return 'Tir du clone';
        if(key==='shot'||key.endsWith('_shot')) return 'Tir';
        return out;
      }

      return withoutJapanese(cell);
    }));
  }

  function bilingualTable(source,titleFr,titleEn,mode=''){
    if(!source || typeof source!=='object') return null;
    const columns=Array.isArray(source.columns)
      ?source.columns.map(withoutJapanese)
      :[];
    const rawRows=Array.isArray(source.rows)
      ?source.rows.filter(Array.isArray)
      :[];
    if(!columns.length || !rawRows.length) return null;

    const enRows=rawRows.map(row=>row.map(withoutJapanese));
    const frRows=makeFrenchRows(columns,enRows,mode);

    return {
      title:{fr:titleFr,en:titleEn},
      cols:{fr:columns.map(columnFr),en:columns},
      rows:{fr:frRows,en:enRows},
      __v38:true
    };
  }

  function patch(){
    const allCharacters=charactersData();
    const allStyles=stylesData();

    if(!allCharacters.length || !allStyles || typeof allStyles!=='object'){
      return false;
    }

    const info=findTwice();
    const row=info.row;
    if(!row) return false;

    let styleId=info.styleId;

    if(!styleId){
      const character=allCharacters.find(item=>
        normal(item?.id)==='twice' ||
        normal(item?.name)==='twice'
      );
      styleId=String(
        (character?.styles || []).find(id=>
          normal(stylesData()?.[id]?.role)==='support'
        ) || ''
      );
    }

    const style=allStyles?.[styleId];
    if(!style) return false;

    style.name={fr:FR.style,en:EN.style};
    style.role='support';

    const character=allCharacters.find(item=>
      normal(item?.id)==='twice' ||
      normal(item?.name)==='twice'
    );

    if(character){
      character.name='Twice';
      if(!Array.isArray(character.styles)) character.styles=[];
      if(!character.styles.map(String).includes(String(styleId))){
        character.styles.push(styleId);
      }
    }

    const oldSkills=Array.isArray(style.skills) ? style.skills : [];
    const names={
      'α':{fr:FR.alpha,en:EN.alpha},
      'β':{fr:FR.beta,en:EN.beta},
      'γ':{fr:FR.gamma,en:EN.gamma}
    };
    const images={
      'α':quirkImage(row,1),
      'β':quirkImage(row,2),
      'γ':quirkImage(row,3)
    };

    style.skills=['α','β','γ'].map(symbol=>{
      const old=oldSkills.find(skill=>
        String(skill?.letter || '')===symbol
      ) || {};
      const remote=row.skills?.[symbol] || {};
      const tables=[];

      const effects=bilingualTable(
        remote.level_up_effects,
        `Effets de montée ${symbol}`,
        `${symbol} Skill Level Effects`,
        'effect'
      );
      const base=bilingualTable(
        remote.base_values,
        `Valeurs de base ${symbol}`,
        `Base ${symbol} Values`
      );
      const additional=bilingualTable(
        remote.additional_values,
        `Valeurs supplémentaires ${symbol}`,
        `Additional ${symbol} Values`,
        'type'
      );

      if(effects) tables.push(effects);
      if(base) tables.push(base);
      if(additional) tables.push(additional);

      if(!tables.length && Array.isArray(old.tables)){
        tables.push(...old.tables);
      }

      const descriptionKey={'α':'alpha','β':'beta','γ':'gamma'}[symbol];
      return {
        ...old,
        letter:symbol,
        name:names[symbol],
        img:images[symbol] || old.img || style.portrait,
        desc:DESCRIPTIONS[descriptionKey],
        tables
      };
    });

    const specialSource=(
      row.special_action?.values &&
      Array.isArray(row.special_action.values.rows) &&
      row.special_action.values.rows.length
    )
      ?row.special_action.values
      :{
        columns:['Ammo','Use Ammo','Reload'],
        rows:[['x1','x1','10s']]
      };

    const specialTable=bilingualTable(
      specialSource,
      "Valeurs de l'action spéciale",
      'Special Action Values'
    );

    style.special={
      ...(style.special || {}),
      name:{fr:FR.special,en:EN.special},
      img:specialImage(row) || style.special?.img || style.portrait,
      desc:DESCRIPTIONS.special,
      tables:specialTable
        ?[specialTable]
        :(style.special?.tables || [])
    };

    if(Date.now()>=Date.parse('2026-08-19T13:00:00+09:00')){
      const season=window.MHUR_SEASON18_DATA || (
        window.MHUR_SEASON18_DATA={}
      );

      ['active_new_content','new_content'].forEach(key=>{
        const bucket=season[key] || (season[key]={});
        const list=Array.isArray(bucket.styles)
          ?bucket.styles.map(String)
          :[];
        if(!list.includes(String(styleId))) list.push(String(styleId));
        bucket.styles=list;
      });

      const home=window.MHUR_HOME_DATA;
      if(home && Array.isArray(home.latest_releases)){
        home.latest_releases.forEach(release=>{
          if(normal(release?.title)==='twice'){
            release.style_id=styleId;
            release.release_kind='style';
            release.releaseDate='2026-08-19T13:00:00+09:00';
            release.word='NEW!';
            release.subtitle_fr='Parade misérable · Soutien';
            release.subtitle_en="Sad Man's Parade · Support";
            release.subtitle_fr=FR.style;
            release.subtitle_en=EN.style;
          }
        });
      }
    }

    window.__MHUR_V38_TWICE_STATUS__={
      ok:true,
      styleId,
      style:FR.style,
      alpha:FR.alpha,
      beta:FR.beta,
      gamma:FR.gamma,
      special:FR.special
    };

    return true;
  }

  function install(){
    patch();

    if(
      typeof window.render==='function' &&
      !window.render.__mhurV38Twice
    ){
      const original=window.render;
      const wrapped=function(){
        patch();
        const result=original.apply(this,arguments);
        patch();
        queueMicrotask(()=>{
          patch();
          try{ window.MHUR_V41_UI_REFRESH?.(); }catch(_error){}
        });
        return result;
      };
      wrapped.__mhurV38Twice=true;
      window.render=wrapped;
      try{ render=wrapped; }catch(_error){}
    }

    window.addEventListener(
      'mhur:languagechange',
      ()=>patch()
    );
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }

  window.addEventListener('load',()=>setTimeout(patch,0),{once:true});
})();
