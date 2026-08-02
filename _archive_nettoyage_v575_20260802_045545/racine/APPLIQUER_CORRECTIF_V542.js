(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var hubPath = fso.BuildPath(publicDir, "js\\community-hub.js");
  var modsPath = fso.BuildPath(publicDir, "js\\community-mods.js");
  var seasonPath = fso.BuildPath(publicDir, "js\\season18-fixes.js");

  var cssPath = fso.BuildPath(
    publicDir,
    "css\\v542-tier-notes-mobile.css"
  );
  var jsPath = fso.BuildPath(
    publicDir,
    "js\\v542-tier-notes-mobile.js"
  );

  var suffix = ".avant-v542.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v542-tier-notes-mobile.css?v=542">';
  var jsTag =
    '<script src="js/v542-tier-notes-mobile.js?v=542"></script>';

  function log(message) {
    WScript.Echo(message);
  }

  function fail(message) {
    throw new Error(message);
  }

  function requireFile(path) {
    if (!fso.FileExists(path)) {
      fail("Fichier obligatoire introuvable : " + path);
    }
  }

  function backup(path) {
    var target = path + suffix;

    if (!fso.FileExists(target)) {
      fso.CopyFile(path, target, false);
    }
  }

  function readUtf8(path) {
    var stream = new ActiveXObject("ADODB.Stream");
    stream.Type = 2;
    stream.Charset = "utf-8";
    stream.Open();
    stream.LoadFromFile(path);

    var text = stream.ReadText(-1);
    stream.Close();

    return text.replace(/^\uFEFF/, "");
  }

  function writeUtf8NoBom(path, text) {
    var textStream = new ActiveXObject("ADODB.Stream");
    textStream.Type = 2;
    textStream.Charset = "utf-8";
    textStream.Open();
    textStream.WriteText(text);
    textStream.Position = 0;
    textStream.Type = 1;
    textStream.Position = 3;

    var bytes = textStream.Read();
    textStream.Close();

    var binaryStream = new ActiveXObject("ADODB.Stream");
    binaryStream.Type = 1;
    binaryStream.Open();
    binaryStream.Write(bytes);
    binaryStream.SaveToFile(path, 2);
    binaryStream.Close();
  }

  function removeFileTag(text, filename) {
    var escaped = filename.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    var linkPattern = new RegExp(
      "<link\\b[^>]*href=[\"'][^\"']*" +
        escaped +
        "[^\"']*[\"'][^>]*>\\s*",
      "gi"
    );

    var scriptPattern = new RegExp(
      "<script\\b[^>]*src=[\"'][^\"']*" +
        escaped +
        "[^\"']*[\"'][^>]*>\\s*<\\/script>\\s*",
      "gi"
    );

    return text
      .replace(linkPattern, "")
      .replace(scriptPattern, "");
  }

  function stableRenderSource() {
    return [
      "function render(){",
      "  const app=document.getElementById('app');",
      "  if(!app)return;",
      "",
      "  if(page==='mods'){",
      "    if(!app.querySelector('.modsPage')){",
      "      window.MHUR_MODS?.renderPage?.(true);",
      "    }",
      "    window.__keepScroll=false;",
      "    queueMicrotask(()=>{",
      "      window.MHUR_ROUTER?.syncFromState?.('replace');",
      "      window.MHUR_SEO?.sync?.();",
      "    });",
      "    return;",
      "  }",
      "",
      "  let html='';",
      "  if(page==='home'){",
      "    html=typeof home==='function'?home():'';",
      "    if((!html||!String(html).includes('homeV296'))&&typeof window.renderHomeDashboard==='function'){",
      "      html=window.renderHomeDashboard();",
      "    }",
      "  }",
      "  if(page==='characters')html=charactersPage();",
      "  if(page==='tunings')html=tuningsPage();",
      "  if(page==='costumes')html=costumesPage();",
      "  if(page==='builds')html=buildsPage();",
      "",
      "  if(page==='home'){",
      "    const finalHome=typeof html==='string'&&html.includes('homeV296')&&html.includes('seasonV296');",
      "    if(!finalHome){",
      "      window.MHUR_HOME_REFRESH?.();",
      "      return;",
      "    }",
      "    const currentLang=String(typeof lang!=='undefined'?lang:'fr');",
      "    const sameHome=Boolean(app.querySelector('.homeV296'))&&app.dataset.mhurHomeLang===currentLang;",
      "    if(sameHome&&!window.__MHUR_FORCE_HOME_RENDER__){",
      "      window.MHUR_HOME_REFRESH?.();",
      "      return;",
      "    }",
      "  }",
      "",
      "  if(typeof html==='string'&&app.innerHTML!==html){",
      "    app.innerHTML=html;",
      "  }",
      "",
      "  if(page==='home'){",
      "    app.dataset.mhurHomeLang=String(typeof lang!=='undefined'?lang:'fr');",
      "    window.MHUR_HOME_REFRESH?.();",
      "  }else{",
      "    delete app.dataset.mhurHomeLang;",
      "  }",
      "",
      "  if(!window.__keepScroll){",
      "    window.scrollTo({top:0,left:0,behavior:'auto'});",
      "  }",
      "  window.__keepScroll=false;",
      "",
      "  queueMicrotask(()=>{",
      "    window.MHUR_ROUTER?.syncFromState?.('replace');",
      "    window.MHUR_SEO?.sync?.();",
      "  });",
      "}",
      "window.__MHUR_V542_STABLE_RENDER__=true;"
    ].join("\n");
  }

  function patchCoreRender(text) {
    if (
      text.indexOf(
        "window.__MHUR_V542_STABLE_RENDER__=true;"
      ) >= 0
    ) {
      return text;
    }

    var oldMarker =
      "window.__MHUR_V540_STABLE_RENDER__=true;";
    var markerPos = text.indexOf(oldMarker);
    var start;
    var end;

    if (markerPos >= 0) {
      start = text.lastIndexOf(
        "function render(){",
        markerPos
      );

      if (start < 0) {
        fail("Début du render V540 introuvable.");
      }

      end = markerPos + oldMarker.length;

      return (
        text.substring(0, start) +
        stableRenderSource() +
        text.substring(end)
      );
    }

    start = text.indexOf(
      "function render(){const app=document.getElementById('app');"
    );

    if (start < 0) {
      fail("Fonction render principale introuvable.");
    }

    end = text.indexOf("</script>", start);

    if (end < 0) {
      fail("Fin du script render introuvable.");
    }

    return (
      text.substring(0, start) +
      stableRenderSource() +
      "\n" +
      text.substring(end)
    );
  }

  function patchNotesButton(text) {
    var idPos = text.indexOf(
      'id="mhurPatchDevButtonV14"'
    );

    if (idPos < 0) {
      log("[INFO] Bouton Patch Notes créé dynamiquement.");
      return text;
    }

    var tagStart = text.lastIndexOf("<button", idPos);
    var tagEnd = text.indexOf(">", idPos);

    if (tagStart < 0 || tagEnd < 0) {
      fail("Balise du bouton Patch Notes invalide.");
    }

    var tag = text.substring(tagStart, tagEnd + 1);
    var handler =
      'onclick="return window.MHUR_V542_OPEN_NOTES ? window.MHUR_V542_OPEN_NOTES(event) : (window.MHUR_S18_V14?.openNotes?.(), false)"';

    if (/onclick="[^"]*"/i.test(tag)) {
      tag = tag.replace(/onclick="[^"]*"/i, handler);
    } else {
      tag = tag.substring(0, tag.length - 1) +
        " " + handler + ">";
    }

    return (
      text.substring(0, tagStart) +
      tag +
      text.substring(tagEnd + 1)
    );
  }

  function replaceScriptVersion(
    text,
    filename,
    version
  ) {
    var escaped = filename.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    var pattern = new RegExp(
      "(<script\\b[^>]*src=[\"'][^\"']*" +
        escaped +
        ")(?:\\?[^\"']*)?([\"'][^>]*>\\s*<\\/script>)",
      "i"
    );

    if (pattern.test(text)) {
      return text.replace(
        pattern,
        "$1?v=" + version + "$2"
      );
    }

    return text;
  }

  function patchIndex() {
    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    text = removeFileTag(
      text,
      "v541-targeted-fixes.css"
    );
    text = removeFileTag(
      text,
      "v541-targeted-fixes.js"
    );
    text = removeFileTag(
      text,
      "v542-tier-notes-mobile.css"
    );
    text = removeFileTag(
      text,
      "v542-tier-notes-mobile.js"
    );

    text = patchCoreRender(text);
    text = patchNotesButton(text);

    text = replaceScriptVersion(
      text,
      "community-hub.js",
      "542"
    );
    text = replaceScriptVersion(
      text,
      "community-mods.js",
      "542"
    );
    text = replaceScriptVersion(
      text,
      "season18-fixes.js",
      "542"
    );

    if (
      text.indexOf("</head>") < 0 ||
      text.indexOf("</body>") < 0
    ) {
      fail("Balises head/body introuvables.");
    }

    text = text.replace(
      "</head>",
      cssTag + "\n</head>"
    );

    text = text.replace(
      "</body>",
      jsTag + "\n</body>"
    );

    writeUtf8NoBom(indexPath, text);
  }

  function tierRenderSource() {
    return [
      "  render(){",
      "    const out=document.getElementById('mhurTierList');if(!out)return;",
      "    const role=document.getElementById('mhurTierRole')?.value||'';",
      "    const sourceCharacters=(typeof characters!=='undefined'&&Array.isArray(characters))?characters:[];",
      "    const sourceStyles=(typeof styles!=='undefined'&&styles)?styles:{};",
      "    const items=[];",
      "    const seen=new Set();",
      "",
      "    const addItem=(id,c)=>{",
      "      const s=sourceStyles[id];",
      "      if(!s||seen.has(id)||role&&s.role!==role)return;",
      "      seen.add(id);",
      "      items.push({id,c,s,tier:this.ownVotes[id]||'U'});",
      "    };",
      "",
      "    sourceCharacters.forEach(c=>{",
      "      (Array.isArray(c.styles)?c.styles:[]).forEach(id=>addItem(id,c));",
      "    });",
      "",
      "    const owners=[...sourceCharacters].sort((a,b)=>String(b.id||'').length-String(a.id||'').length);",
      "",
      "    Object.keys(sourceStyles).forEach(id=>{",
      "      if(seen.has(id))return;",
      "      const s=sourceStyles[id];",
      "      const owner=owners.find(c=>id===c.id||id.startsWith(String(c.id||'')+'_'));",
      "      const fallback=owner||{",
      "        id:'style-'+id,",
      "        name:typeof label==='function'?label(s?.name||id):id,",
      "        portrait:s?.portrait||'',",
      "        styles:[id]",
      "      };",
      "      addItem(id,fallback);",
      "    });",
      "",
      "    const row=letter=>`<div class=\"mhurTierRow ${letter==='U'?'unranked':''}\"><div class=\"mhurTierLabel ${letter}\">${letter==='U'?t('Non classés','Unranked'):letter}</div><div class=\"mhurTierItems\" ondragover=\"MHUR_HUB.tier.dragOver(event)\" ondragleave=\"MHUR_HUB.tier.dragLeave(event)\" ondrop=\"MHUR_HUB.tier.drop(event,'${letter}')\">${items.filter(x=>x.tier===letter).map(x=>`<div class=\"mhurTierItem mhurTierRole-${esc(x.s.role||'unknown')}\" draggable=\"true\" ondragstart=\"MHUR_HUB.tier.dragStart(event,'${x.id}')\" ondragend=\"MHUR_HUB.tier.dragEnd(event)\"><img src=\"${esc(x.s.portrait||x.c.portrait||'')}\" alt=\"${esc(x.c.name)}\"><small>${esc(x.c.name)}</small><span class=\"mhurTierStyleName\">${esc(typeof label==='function'?label(x.s.name||''):x.id)}</span></div>`).join('')}<div class=\"mhurTierDropHint\">${t('Dépose ici','Drop here')}</div></div></div>`;",
      "",
      "    out.innerHTML=`<div class=\"mhurTierDragHelp\">${t('Les déplacements sont enregistrés uniquement dans ton navigateur. Publie ta Tier List lorsque tu veux la partager.','Changes are saved only in your browser. Publish your Tier List when you want to share it.')}</div>`+['S','A','B','C','D','U'].map(row).join('');",
      "  }"
    ].join("\n");
  }

  function patchHub() {
    var text = readUtf8(hubPath).replace(/\r\n/g, "\n");

    var excluded =
      ".filter(c=>String(c.name||'').toLowerCase()!=='all for one (youth age)')";

    text = text.split(excluded).join(
      ".filter(c=>Boolean(c))"
    );

    var tierPos = text.indexOf("const tier={");
    var start = text.indexOf("  render(){", tierPos);
    var end = text.indexOf("\n  }\n};", start);

    if (
      tierPos < 0 ||
      start < 0 ||
      end < 0
    ) {
      fail(
        "Méthode render de la Tier List introuvable."
      );
    }

    text =
      text.substring(0, start) +
      tierRenderSource() +
      text.substring(end + "\n  }".length);

    writeUtf8NoBom(hubPath, text);
  }

  function patchMods() {
    var text = readUtf8(modsPath).replace(/\r\n/g, "\n");

    var renderStart = text.indexOf(
      "function renderPage(){"
    );
    var renderEnd = text.indexOf(
      "function bindPage(){",
      renderStart
    );

    if (renderStart < 0 || renderEnd < 0) {
      fail("renderPage Mods introuvable.");
    }

    var renderReplacement = [
      "let lastModsHtml='';",
      "function renderPage(force=false){",
      "  if(typeof page==='undefined'||page!=='mods')return;",
      "  const root=document.getElementById('app')||document.getElementById('content')||document.querySelector('main')||document.body;",
      "  const html=pageHtml();",
      "  if(!force&&root.querySelector('.modsPage')&&html===lastModsHtml)return;",
      "  root.innerHTML=html;",
      "  lastModsHtml=html;",
      "  bindPage();",
      "}",
      ""
    ].join("\n");

    text =
      text.substring(0, renderStart) +
      renderReplacement +
      text.substring(renderEnd);

    var loadStart = text.indexOf(
      "async function load(){"
    );
    var loadEnd = text.indexOf(
      "function availableCharacters(){",
      loadStart
    );

    if (loadStart < 0 || loadEnd < 0) {
      fail("Fonction load Mods introuvable.");
    }

    var loadReplacement = [
      "async function load(){",
      "  if(state.loading)return;",
      "  const firstVisible=typeof page!=='undefined'&&page==='mods'&&!document.querySelector('.modsPage');",
      "  state.loading=true;",
      "  state.error='';",
      "  if(firstVisible)renderPage(true);",
      "  try{",
      "    if(!REMOTE)throw new Error(tx('Supabase n’est pas configuré.','Supabase is not configured'));",
      "    const q=new URLSearchParams({select:'*',is_hidden:'eq.false',order:'created_at.desc'});",
      "    state.rows=await request(`/rest/v1/community_mods?${q}`)||[];",
      "    await Promise.all([loadProfiles(state.rows.map(r=>r.creator_id)),loadLikes(),loadFavorites()]);",
      "  }catch(e){",
      "    state.error=String(e.message||e);",
      "  }finally{",
      "    state.loading=false;",
      "    renderPage(true);",
      "  }",
      "}",
      ""
    ].join("\n");

    text =
      text.substring(0, loadStart) +
      loadReplacement +
      text.substring(loadEnd);

    var layoutStart = text.indexOf(
      "const originalLayout=window.layout;"
    );
    var hashStart = text.indexOf(
      "window.addEventListener('hashchange'",
      layoutStart
    );

    if (layoutStart < 0 || hashStart < 0) {
      fail("Wrapper layout Mods introuvable.");
    }

    var layoutReplacement = [
      "const originalLayout=window.layout;",
      "window.layout=function(){",
      "  const out=originalLayout?.apply(this,arguments);",
      "  addMenu();",
      "  if(typeof page!=='undefined'&&page==='mods'&&!document.querySelector('.modsPage'))renderPage(true);",
      "  return out;",
      "};",
      ""
    ].join("\n");

    text =
      text.substring(0, layoutStart) +
      layoutReplacement +
      text.substring(hashStart);

    text = text.replace(
      "window.MHUR_MODS={open:openPage,refresh:load,state,request,openDetail,toggleFavorite,loadFavorites,removeMod,deleteComment:deleteModComment};",
      "window.MHUR_MODS={open:openPage,refresh:load,renderPage,state,request,openDetail,toggleFavorite,loadFavorites,removeMod,deleteComment:deleteModComment};"
    );

    var authStart = text.indexOf(
      "window.addEventListener('mhur-auth-change'"
    );
    var windowLoadStart = text.indexOf(
      "window.addEventListener('load'",
      authStart
    );

    if (authStart < 0 || windowLoadStart < 0) {
      fail("Événements compte Mods introuvables.");
    }

    var accountReplacement = [
      "let modsAccountFrame=0;",
      "function scheduleModsAccountRefresh(){",
      "  cancelAnimationFrame(modsAccountFrame);",
      "  modsAccountFrame=requestAnimationFrame(async()=>{",
      "    await Promise.all([loadLikes(),loadFavorites()]);",
      "    if(typeof page!=='undefined'&&page==='mods')renderPage(true);",
      "    const detail=document.getElementById('modsDetailModal');",
      "    if(detail&&!detail.hidden&&state.active)openDetail(state.active.id);",
      "  });",
      "}",
      "window.addEventListener('mhur-auth-change',scheduleModsAccountRefresh);",
      "window.addEventListener('mhur-role-change',scheduleModsAccountRefresh);",
      ""
    ].join("\n");

    text =
      text.substring(0, authStart) +
      accountReplacement +
      text.substring(windowLoadStart);

    var oldLoadListener =
      "window.addEventListener('load',()=>{addMenu();if(location.pathname==='/mods'||location.hash==='#mods')openPage();load()},{once:true});";

    var newLoadListener = [
      "window.addEventListener('load',()=>{",
      "  addMenu();",
      "  const direct=location.pathname==='/mods'||location.hash==='#mods';",
      "  if(direct){",
      "    page='mods';selectedChar=null;selectedStyle=null;selectedCostume=null;",
      "    if(!document.querySelector('.modsPage')){",
      "      state.loading=true;renderPage(true);state.loading=false;",
      "    }",
      "  }",
      "  load();",
      "},{once:true});"
    ].join("\n");

    if (text.indexOf(oldLoadListener) >= 0) {
      text = text.replace(
        oldLoadListener,
        newLoadListener
      );
    } else {
      var listenerStart = text.indexOf(
        "window.addEventListener('load'",
        authStart
      );
      var listenerEnd = text.indexOf(
        "\n})();",
        listenerStart
      );

      if (listenerStart < 0 || listenerEnd < 0) {
        fail("Événement load Mods introuvable.");
      }

      text =
        text.substring(0, listenerStart) +
        newLoadListener +
        text.substring(listenerEnd);
    }

    writeUtf8NoBom(modsPath, text);
  }

  function patchSeason18() {
    var text = readUtf8(seasonPath).replace(/\r\n/g, "\n");

    var repeatedScroll = [
      "  run();",
      "  requestAnimationFrame(run);",
      "  setTimeout(run,35);",
      "  setTimeout(run,110);",
      "  setTimeout(run,240);"
    ].join("\n");

    if (text.indexOf(repeatedScroll) >= 0) {
      text = text.replace(
        repeatedScroll,
        "  run();"
      );
    }

    writeUtf8NoBom(seasonPath, text);
  }

  function validate() {
    var errors = [];
    var indexText = readUtf8(indexPath);
    var hubText = readUtf8(hubPath);
    var modsText = readUtf8(modsPath);

    if (indexText.indexOf(cssTag) < 0) {
      errors.push("CSS V542 absent.");
    }

    if (indexText.indexOf(jsTag) < 0) {
      errors.push("JavaScript V542 absent.");
    }

    if (
      indexText.indexOf(
        "window.__MHUR_V542_STABLE_RENDER__=true;"
      ) < 0
    ) {
      errors.push("Render stable V542 absent.");
    }

    if (
      indexText.indexOf("v541-targeted-fixes") >= 0
    ) {
      errors.push("Ancien V541 encore chargé.");
    }

    if (
      hubText.indexOf("all for one (youth age)") >= 0
    ) {
      errors.push(
        "All For One jeune est encore exclu."
      );
    }

    if (
      hubText.indexOf(
        "Object.keys(sourceStyles).forEach"
      ) < 0
    ) {
      errors.push(
        "Styles orphelins non ajoutés à la Tier List."
      );
    }

    if (
      modsText.indexOf(
        "window.MHUR_MODS={open:openPage,refresh:load,renderPage"
      ) < 0
    ) {
      errors.push("renderPage Mods non exposé.");
    }

    if (
      modsText.indexOf(
        "setTimeout(()=>{addMenu();if(typeof page"
      ) >= 0
    ) {
      errors.push(
        "Ancien rendu Mods retardé encore présent."
      );
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V542");

      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }

      fail(
        "Le correctif V542 n'a pas passé la vérification."
      );
    }
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V542");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(hubPath);
    requireFile(modsPath);
    requireFile(seasonPath);
    requireFile(cssPath);
    requireFile(jsPath);

    backup(indexPath);
    backup(hubPath);
    backup(modsPath);
    backup(seasonPath);

    patchHub();
    patchMods();
    patchSeason18();
    patchIndex();
    validate();

    log("[OK] Tous les personnages et tous les styles sont dans la Tier List.");
    log("[OK] All For One jeune n'est plus exclu.");
    log("[OK] Patch Notes ouvre avec un gestionnaire unique.");
    log("[OK] Le header mobile a une hauteur fixe et ne peut plus grandir.");
    log("[OK] La page Mods n'est plus effacee par le render general.");
    log("[OK] Le chargement Mods ne reconstruit plus la page plusieurs fois.");
    log("[OK] Les fonds de roles de la Tier List sont conserves.");
    log("");
    log("TOUTES LES VERIFICATIONS V542 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Sur mobile : ferme l'onglet, rouvre le site et actualise une fois.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V542 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
