(() => {
  'use strict';

  const MARK='MHUR_V28_GENTLE_ADDITIONAL_SPLIT';

  function language(){
    try{
      return (typeof lang !== 'undefined' && lang === 'en') ? 'en' : 'fr';
    }catch(_e){
      return 'fr';
    }
  }

  function pick(value){
    if(value && typeof value==='object' && !Array.isArray(value)){
      return value[language()] ?? value.fr ?? value.en ?? '';
    }
    return value;
  }

  function clean(value){
    return String(pick(value) ?? '')
      .replace(/\s*[（(][^()（）]*[\u3040-\u30ff\u3400-\u9fff][^()（）]*[）)]/g,'')
      .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g,'')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  function norm(value){
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'_')
      .replace(/^_+|_+$/g,'');
  }

  function localizedArray(value){
    const selected=pick(value);
    return Array.isArray(selected) ? selected : [];
  }

  function translatedType(label){
    const key=norm(label);
    const english=language()==='en';

    const map={
      onde_de_choc:['Onde de choc','Shockwave'],
      shockwave:['Onde de choc','Shockwave'],
      projectile:['Projectile','Projectile'],
      bullet:['Projectile','Projectile'],
      ruee:['Ruée','Rush'],
      rush:['Ruée','Rush'],
      rebond:['Rebond','Rebound'],
      rebound:['Rebond','Rebound'],
      bounce:['Rebond','Rebound'],
      impact_final:['Impact final','Impact'],
      impact:['Impact final','Impact'],
      corps_a_corps:['Corps à corps','Melee Combat'],
      melee_combat:['Corps à corps','Melee Combat'],
      activation:['Activation','Activation']
    };

    const pair=map[key];
    return pair ? pair[english ? 1 : 0] : clean(label);
  }

  function splitTable(table){
    const cols=localizedArray(table?.cols || table?.columns);
    const rows=localizedArray(table?.rows);

    if(!cols.length || !rows.length) return [table];

    const normalizedCols=cols.map(norm);
    const typeIndex=normalizedCols.indexOf('type');
    const levelIndex=normalizedCols.findIndex(value=>
      value==='niveau' || value==='level'
    );

    if(typeIndex<0 || levelIndex<0) return [table];

    const groups=[];
    let current=null;
    let lastType='Valeur';

    rows.forEach(source=>{
      if(!Array.isArray(source)) return;

      const row=[...source];
      const level=clean(row[levelIndex]);

      if(!/^Lv\.\d+$/i.test(level)) return;

      let rawType=clean(row[typeIndex]);
      if(rawType) lastType=rawType;
      rawType=rawType || lastType || 'Valeur';

      const key=norm(rawType) || 'value';
      const restart=/^Lv\.1$/i.test(level) &&
        current &&
        current.rows.length>0;
      const changed=current && current.key!==key;

      if(!current || restart || changed){
        current={
          key,
          label:rawType,
          rows:[]
        };
        groups.push(current);
      }

      current.rows.push(row);
    });

    if(groups.length<=1) return [table];

    const baseTitle=clean(table?.title) ||
      (language()==='en'
        ?'Additional damage'
        :'Dégâts supplémentaires');

    return groups.map((group,index)=>{
      let label=translatedType(group.label);

      // Si une source future répète le même Type mais recommence Lv.1,
      // on ne remélange jamais les cycles.
      if(
        groups.filter(item=>item.key===group.key).length>1 &&
        !/gentle/i.test(baseTitle)
      ){
        const sameBefore=groups
          .slice(0,index+1)
          .filter(item=>item.key===group.key)
          .length;
        label=`${label} ${sameBefore}`;
      }

      return {
        title:`${baseTitle} — ${label}`,
        cols:cols.map(clean),
        rows:group.rows.map(row=>{
          const copy=[...row].map(clean);
          copy[typeIndex]=label;
          return copy;
        }),
        __mhurV28Split:true
      };
    });
  }

  function splitList(list){
    const source=Array.isArray(list) ? list : [];
    const output=source.flatMap(splitTable);

    const splitCount=output.length-source.length;

    window.__MHUR_V28_GENTLE_STATUS__={
      marker:MARK,
      inputTables:source.length,
      outputTables:output.length,
      splitCount
    };

    return output;
  }

  function install(){
    let current=null;

    try{
      if(typeof tables==='function') current=tables;
    }catch(_e){}

    if(!current && typeof window.tables==='function'){
      current=window.tables;
    }

    if(typeof current!=='function') return false;
    if(current.__mhurV28SplitWrapper) return true;

    const wrapped=function(list){
      return current.call(this,splitList(list));
    };

    wrapped.__mhurV28SplitWrapper=true;
    wrapped.__mhurV28Original=current;

    window.tables=wrapped;
    try{ tables=wrapped; }catch(_e){}

    return true;
  }

  function schedule(){
    install();
    setTimeout(install,0);
    setTimeout(install,100);
    setTimeout(install,300);
  }

  window.MHUR_V28_SPLIT_ADDITIONAL={
    install,
    splitList,
    splitTable
  };

  schedule();

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      schedule,
      {once:true}
    );
  }

  window.addEventListener('load',schedule,{once:true});
  window.addEventListener('mhur:languagechange',schedule);
})();
