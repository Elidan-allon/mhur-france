/* MHUR Nexus — V643
   Centre de notifications canonique, migration et compteur fiable. */
(function(){
  'use strict';

  if(window.MHUR_V643_NOTIFICATIONS_LOADED)return;
  window.MHUR_V643_NOTIFICATIONS_LOADED=true;

  const STORE='mhur_notifications_v643';
  const LEGACY='mhur_notifications_v327';
  const SNAPSHOT='mhur_notifications_snapshot_v643';
  const MIGRATION='mhur_notifications_migrated_v643';
  const MAX_ITEMS=100;

  let filter='all';
  let bell=null;
  let bellAttributeObserver=null;
  let bodyObserver=null;
  let lastSerialized='';

  const tr=(fr,en)=>{
    try{
      return typeof lang!=='undefined'&&lang==='en'?en:fr;
    }catch(_error){
      return fr;
    }
  };

  const text=value=>String(value??'').trim();

  const escapeHtml=value=>text(value).replace(
    /[&<>"']/g,
    character=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    }[character])
  );

  function safeDate(value){
    const parsed=new Date(value||Date.now());
    const time=parsed.getTime();

    if(
      !Number.isFinite(time)||
      time<946684800000||
      time>Date.now()+86400000
    ){
      return new Date().toISOString();
    }

    return parsed.toISOString();
  }

  function entryKey(item){
    return [
      text(item.title).toLowerCase(),
      text(item.text).toLowerCase(),
      safeDate(item.date).slice(0,16)
    ].join('|');
  }

  function normalizeEntry(raw,index=0){
    if(!raw||typeof raw!=='object')return null;

    const title=text(
      raw.title||
      raw.name||
      raw.subject||
      raw.heading
    );

    const body=text(
      raw.text||
      raw.message||
      raw.body||
      raw.description
    );

    if(!title&&!body)return null;

    const date=safeDate(
      raw.date||
      raw.created_at||
      raw.createdAt||
      raw.time||
      raw.timestamp
    );

    const read=(
      typeof raw.read==='boolean'
        ? raw.read
        : typeof raw.unread==='boolean'
          ? !raw.unread
          : false
    );

    const sourceId=text(raw.id||raw.uuid||raw.key);
    const id=sourceId||[
      Date.parse(date)||Date.now(),
      index,
      Math.random().toString(36).slice(2,8)
    ].join('-');

    return {
      id,
      title:title||tr('Notification','Notification'),
      text:body,
      date,
      read,
      type:text(raw.type||'site'),
      link:text(raw.link||raw.url||'')
    };
  }

  function normalizeList(input){
    const array=(
      Array.isArray(input)
        ? input
        : Array.isArray(input?.items)
          ? input.items
          : Array.isArray(input?.notifications)
            ? input.notifications
            : []
    );

    const seen=new Set();
    const output=[];

    array.forEach((raw,index)=>{
      const item=normalizeEntry(raw,index);
      if(!item)return;

      const key=entryKey(item);
      if(seen.has(key))return;

      seen.add(key);
      output.push(item);
    });

    return output
      .sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))
      .slice(0,MAX_ITEMS);
  }

  function parseStorage(key){
    try{
      const value=localStorage.getItem(key);
      if(!value)return [];
      return normalizeList(JSON.parse(value));
    }catch(_error){
      return [];
    }
  }

  function rawPhantomCount(){
    let count=0;

    const currentBell=document.getElementById('mhurNoticeBell');
    const dataValue=Number.parseInt(
      currentBell?.dataset?.count||'0',
      10
    );

    if(Number.isFinite(dataValue)){
      count=Math.max(count,dataValue);
    }

    document.querySelectorAll('button').forEach(button=>{
      const match=text(button.textContent).match(
        /non\s*lues?\s*\((\d+)\)/i
      );

      if(match){
        count=Math.max(
          count,
          Number.parseInt(match[1],10)||0
        );
      }
    });

    return count;
  }

  function migrate(){
    const phantom=rawPhantomCount();
    const combined=[];

    const keys=new Set([STORE,LEGACY]);

    for(let index=0;index<localStorage.length;index++){
      const key=localStorage.key(index);

      if(
        key&&
        /mhur.*notif/i.test(key)&&
        !/snapshot|migrated/i.test(key)
      ){
        keys.add(key);
      }
    }

    keys.forEach(key=>{
      combined.push(...parseStorage(key));
    });

    let list=normalizeList(combined);

    if(
      !list.length&&
      phantom>0&&
      localStorage.getItem(MIGRATION)!=='1'
    ){
      list=[{
        id:`repair-${Date.now()}`,
        title:tr(
          'Centre de notifications réparé',
          'Notification center repaired'
        ),
        text:tr(
          'Un ancien compteur fantôme a été supprimé. Les prochaines notifications apparaîtront normalement ici.',
          'An old phantom counter was removed. Future notifications will now appear normally here.'
        ),
        date:new Date().toISOString(),
        read:false,
        type:'system',
        link:''
      }];
    }

    write(list,false);
    localStorage.setItem(MIGRATION,'1');
    return list;
  }

  function read(){
    return parseStorage(STORE);
  }

  function write(input,notify=true){
    const list=normalizeList(input);
    const serialized=JSON.stringify(list);

    if(serialized!==lastSerialized){
      localStorage.setItem(STORE,serialized);

      /*
        L'ancien moteur lit encore cette clé dans certaines pages.
        On lui fournit exactement les mêmes données propres afin qu'il
        ne puisse plus recréer un nombre fantôme.
      */
      localStorage.setItem(LEGACY,serialized);
      lastSerialized=serialized;
    }

    updateBadge(list);

    if(notify){
      renderOpenModal();
    }

    return list;
  }

  function unreadCount(list=read()){
    return list.reduce(
      (total,item)=>total+(item.read?0:1),
      0
    );
  }

  function removeDuplicateBells(){
    const candidates=[
      ...document.querySelectorAll(
        '#mhurNoticeBell,.mhurNoticeBell,'+
        '#notificationBell,#notificationsBell,'+
        '.notificationBell'
      )
    ];

    let kept=false;

    candidates.forEach(candidate=>{
      if(
        candidate.id==='mhurNoticeBell'&&
        candidate.classList.contains('v643NoticeBell')&&
        !kept
      ){
        kept=true;
        bell=candidate;
        return;
      }

      candidate.remove();
    });
  }

  function createBell(){
    removeDuplicateBells();

    if(bell&&bell.isConnected)return bell;

    bell=document.createElement('button');
    bell.id='mhurNoticeBell';
    bell.type='button';
    bell.className='mhurNoticeBell v643NoticeBell';
    bell.setAttribute(
      'aria-label',
      tr('Ouvrir les notifications','Open notifications')
    );
    bell.innerHTML=(
      '<span aria-hidden="true">🔔</span>'+
      '<span class="v643NoticeBadge" hidden></span>'
    );
    bell.addEventListener('click',open);
    document.body.appendChild(bell);

    bellAttributeObserver?.disconnect();
    bellAttributeObserver=new MutationObserver(()=>{
      if(bell.hasAttribute('data-count')){
        bell.removeAttribute('data-count');
      }
    });

    bellAttributeObserver.observe(bell,{
      attributes:true,
      attributeFilter:['data-count']
    });

    return bell;
  }

  function updateBadge(list=read()){
    const target=createBell();
    const badge=target.querySelector('.v643NoticeBadge');
    const count=unreadCount(list);

    target.removeAttribute('data-count');
    target.dataset.unread=String(count);
    target.setAttribute(
      'aria-label',
      count
        ? tr(
            `${count} notification${count>1?'s':''} non lue${count>1?'s':''}`,
            `${count} unread notification${count>1?'s':''}`
          )
        : tr('Aucune notification non lue','No unread notifications')
    );

    if(!badge)return;

    badge.textContent=count>99?'99+':String(count);
    badge.hidden=count===0;
  }

  function ensureModal(){
    let overlay=document.getElementById('mhurNoticesModal');

    if(
      overlay&&
      !overlay.classList.contains('v643NoticeOverlay')
    ){
      overlay.remove();
      overlay=null;
    }

    document.querySelectorAll(
      '#notificationCenterModal,'+
      '#notificationsModal,'+
      '.notificationCenterModal'
    ).forEach(node=>node.remove());

    if(overlay)return overlay;

    overlay=document.createElement('div');
    overlay.id='mhurNoticesModal';
    overlay.className='v643NoticeOverlay';
    overlay.innerHTML=`
      <section class="v643NoticePanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v643NoticeTitle">
        <header class="v643NoticeHead">
          <h2 id="v643NoticeTitle"></h2>
        </header>
        <button
          type="button"
          class="v643NoticeClose"
          aria-label="${escapeHtml(tr('Fermer','Close'))}">
          ×
        </button>
        <div class="v643NoticeTools"></div>
        <div class="v643NoticeBrowser"></div>
        <div class="v643NoticeList"></div>
      </section>
    `;

    overlay.addEventListener('click',event=>{
      if(event.target===overlay)close();
    });

    overlay.querySelector('.v643NoticeClose')
      .addEventListener('click',close);

    document.body.appendChild(overlay);
    return overlay;
  }

  function dateLabel(value){
    try{
      return new Intl.DateTimeFormat(
        tr('fr-FR','en-GB'),
        {
          dateStyle:'medium',
          timeStyle:'short'
        }
      ).format(new Date(value));
    }catch(_error){
      return '';
    }
  }

  function render(){
    const overlay=ensureModal();
    const list=read();
    const unread=unreadCount(list);
    const visible=(
      filter==='unread'
        ? list.filter(item=>!item.read)
        : list
    );

    overlay.querySelector('#v643NoticeTitle').textContent=
      tr('Centre de notifications','Notification center');

    const tools=overlay.querySelector('.v643NoticeTools');

    tools.innerHTML=`
      <button type="button"
        data-filter="all"
        class="${filter==='all'?'active':''}">
        ${escapeHtml(tr('Toutes','All'))}
      </button>
      <button type="button"
        data-filter="unread"
        class="${filter==='unread'?'active':''}">
        ${escapeHtml(tr('Non lues','Unread'))} (${unread})
      </button>
      <button type="button"
        data-read-all
        ${unread?'':'disabled'}>
        ${escapeHtml(tr(
          'Tout marquer comme lu',
          'Mark all as read'
        ))}
      </button>
      <button type="button"
        data-delete-read
        ${list.some(item=>item.read)?'':'disabled'}>
        ${escapeHtml(tr(
          'Supprimer les lues',
          'Delete read'
        ))}
      </button>
    `;

    tools.querySelectorAll('[data-filter]').forEach(button=>{
      button.addEventListener('click',()=>{
        filter=button.dataset.filter;
        render();
      });
    });

    tools.querySelector('[data-read-all]')
      .addEventListener('click',readAll);

    tools.querySelector('[data-delete-read]')
      .addEventListener('click',deleteRead);

    const browser=overlay.querySelector('.v643NoticeBrowser');

    if(!('Notification' in window)){
      browser.innerHTML='';
    }else{
      const permission=Notification.permission;
      const label=(
        permission==='granted'
          ? tr(
              '✓ Notifications du navigateur activées',
              '✓ Browser notifications enabled'
            )
          : permission==='denied'
            ? tr(
                'Notifications du navigateur refusées',
                'Browser notifications denied'
              )
            : tr(
                'Activer les notifications du navigateur',
                'Enable browser notifications'
              )
      );

      browser.innerHTML=`
        <button type="button"
          data-browser-permission
          ${permission==='denied'?'disabled':''}>
          ${escapeHtml(label)}
        </button>
      `;

      browser.querySelector('[data-browser-permission]')
        .addEventListener('click',requestPermission);
    }

    const target=overlay.querySelector('.v643NoticeList');

    if(!visible.length){
      target.innerHTML=`
        <div class="v643NoticeEmpty">
          ${escapeHtml(
            filter==='unread'
              ? tr(
                  'Aucune notification non lue.',
                  'No unread notifications.'
                )
              : tr(
                  'Aucune notification.',
                  'No notifications.'
                )
          )}
        </div>
      `;
      return;
    }

    target.innerHTML=visible.map(item=>`
      <article
        class="v643NoticeItem ${item.read?'':'unread'}"
        data-notice-id="${escapeHtml(item.id)}">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          ${item.text
            ? `<p>${escapeHtml(item.text)}</p>`
            : ''}
          <time datetime="${escapeHtml(item.date)}">
            ${escapeHtml(dateLabel(item.date))}
          </time>
        </div>
        <div class="v643NoticeItemActions">
          <button type="button"
            data-toggle-read="${escapeHtml(item.id)}"
            title="${escapeHtml(
              item.read
                ? tr('Marquer comme non lue','Mark as unread')
                : tr('Marquer comme lue','Mark as read')
            )}">
            ${item.read?'○':'✓'}
          </button>
          <button type="button"
            class="danger"
            data-delete="${escapeHtml(item.id)}"
            title="${escapeHtml(tr('Supprimer','Delete'))}">
            🗑
          </button>
        </div>
      </article>
    `).join('');

    target.querySelectorAll('[data-toggle-read]').forEach(button=>{
      button.addEventListener('click',()=>{
        toggleRead(button.dataset.toggleRead);
      });
    });

    target.querySelectorAll('[data-delete]').forEach(button=>{
      button.addEventListener('click',()=>{
        remove(button.dataset.delete);
      });
    });
  }

  function renderOpenModal(){
    const overlay=document.getElementById('mhurNoticesModal');

    if(
      overlay?.classList.contains('v643NoticeOverlay')&&
      overlay.classList.contains('open')
    ){
      render();
    }
  }

  function open(){
    render();
    ensureModal().classList.add('open');
    document.body.classList.add('v643NoticeOpen');
  }

  function close(){
    document.getElementById('mhurNoticesModal')
      ?.classList.remove('open');
    document.body.classList.remove('v643NoticeOpen');
  }

  function add(titleValue,textValue,options={}){
    const title=text(titleValue);
    const body=text(textValue);

    if(!title&&!body)return null;

    const list=read();
    const candidate=normalizeEntry({
      id:options.id||`${Date.now()}-${Math.random()
        .toString(36).slice(2,8)}`,
      title,
      text:body,
      date:options.date||new Date().toISOString(),
      read:Boolean(options.read),
      type:options.type||'site',
      link:options.link||''
    });

    const duplicate=list.find(
      item=>entryKey(item)===entryKey(candidate)
    );

    if(duplicate){
      if(duplicate.read&&options.read===false){
        duplicate.read=false;
        write(list);
      }
      return duplicate;
    }

    list.unshift(candidate);
    write(list);

    if(
      options.browser!==false&&
      'Notification' in window&&
      Notification.permission==='granted'
    ){
      try{
        new Notification(candidate.title,{
          body:candidate.text,
          icon:'assets/home/icons/release_character.png',
          tag:`mhur-${candidate.id}`
        });
      }catch(_error){}
    }

    return candidate;
  }

  function readAll(){
    write(read().map(item=>({
      ...item,
      read:true
    })));
  }

  function deleteRead(){
    write(read().filter(item=>!item.read));
  }

  function toggleRead(id){
    write(read().map(item=>(
      String(item.id)===String(id)
        ? {...item,read:!item.read}
        : item
    )));
  }

  function remove(id){
    write(read().filter(
      item=>String(item.id)!==String(id)
    ));
  }

  async function requestPermission(){
    if(!('Notification' in window))return 'unsupported';

    try{
      const result=await Notification.requestPermission();
      renderOpenModal();
      return result;
    }catch(_error){
      return Notification.permission;
    }
  }

  function snapshotFromHome(){
    const data=window.MHUR_HOME_DATA||{};

    const release=data.latest_releases?.[0]||{};
    const patch=data.patch_notes?.[0]||{};
    const event=data.events?.[0]||{};

    return {
      release:text(
        release.id||
        release.title||
        release.name
      ),
      patch:text(
        patch.id||
        patch.title||
        patch.name
      ),
      event:text(
        event.id||
        event.title||
        event.name
      )
    };
  }

  async function check(){
    let version='';
    let changes=[];

    try{
      const response=await fetch(
        `version.json?t=${Date.now()}`,
        {cache:'no-store'}
      );

      if(response.ok){
        const info=await response.json();
        version=text(info.version);

        const source=(
          tr(info.changes_fr,info.changes_en)||
          info.changes||
          []
        );

        changes=Array.isArray(source)?source:[];
      }
    }catch(_error){}

    const next={
      version,
      ...snapshotFromHome()
    };

    let previous={};

    try{
      previous=JSON.parse(
        localStorage.getItem(SNAPSHOT)||'{}'
      )||{};
    }catch(_error){
      previous={};
    }

    if(previous.version&&next.version&&
       previous.version!==next.version){
      add(
        tr(
          `Mise à jour ${next.version}`,
          `${next.version} update`
        ),
        changes.length
          ? changes.map(value=>`• ${text(value)}`).join('\n')
          : tr(
              'Consulte les notes de version pour découvrir les changements.',
              'Check the release notes to see what changed.'
            ),
        {
          id:`version:${next.version}`,
          type:'version'
        }
      );
    }

    if(
      previous.release&&
      next.release&&
      previous.release!==next.release
    ){
      add(
        tr('Nouvelle sortie','New release'),
        next.release,
        {
          id:`release:${next.release}`,
          type:'release'
        }
      );
    }

    if(
      previous.patch&&
      next.patch&&
      previous.patch!==next.patch
    ){
      add(
        tr(
          'Nouvelles notes de patch',
          'New patch notes'
        ),
        next.patch,
        {
          id:`patch:${next.patch}`,
          type:'patch'
        }
      );
    }

    if(
      previous.event&&
      next.event&&
      previous.event!==next.event
    ){
      add(
        tr('Nouvel événement','New event'),
        next.event,
        {
          id:`event:${next.event}`,
          type:'event'
        }
      );
    }

    localStorage.setItem(
      SNAPSHOT,
      JSON.stringify(next)
    );

    updateBadge();
  }

  function installApi(){
    const existing=window.MHUR_HUB?.notifications||{};

    const api={
      ...existing,
      key:STORE,
      list:read,
      save:write,
      add,
      open,
      close,
      readAll,
      deleteRead,
      toggleRead,
      remove,
      badge:updateBadge,
      check,
      request:requestPermission,
      requestPermission
    };

    if(window.MHUR_HUB){
      window.MHUR_HUB.notifications=api;
    }else{
      window.MHUR_HUB={
        notifications:api
      };
    }

    window.MHUR_NOTIFICATIONS=api;
  }

  function watchBody(){
    bodyObserver?.disconnect();

    bodyObserver=new MutationObserver(records=>{
      let needsCleanup=false;

      records.forEach(record=>{
        record.addedNodes.forEach(node=>{
          if(!(node instanceof Element))return;

          if(
            node.matches?.(
              '#mhurNoticeBell,.mhurNoticeBell,'+
              '#notificationBell,#notificationsBell'
            )||
            node.querySelector?.(
              '#mhurNoticeBell,.mhurNoticeBell,'+
              '#notificationBell,#notificationsBell'
            )
          ){
            needsCleanup=true;
          }
        });
      });

      if(needsCleanup){
        queueMicrotask(()=>{
          createBell();
          updateBadge();
        });
      }
    });

    bodyObserver.observe(document.body,{
      childList:true,
      subtree:true
    });
  }

  function boot(){
    migrate();
    installApi();
    createBell();
    updateBadge();
    watchBody();

    window.addEventListener('storage',event=>{
      if(event.key===STORE||event.key===LEGACY){
        const merged=normalizeList([
          ...parseStorage(STORE),
          ...parseStorage(LEGACY)
        ]);

        write(merged);
      }
    });

    window.addEventListener('mhur-auth-change',()=>{
      setTimeout(check,500);
    });

    setTimeout(check,700);
  }

  if(document.readyState==='loading'){
    document.addEventListener(
      'DOMContentLoaded',
      boot,
      {once:true}
    );
  }else{
    boot();
  }
})();
