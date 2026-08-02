(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var homePath = fso.BuildPath(publicDir, "js\\home.js");
  var modsPath = fso.BuildPath(publicDir, "js\\community-mods.js");
  var cssPath = fso.BuildPath(publicDir, "css\\v540-final-ui.css");
  var finalJsPath = fso.BuildPath(
    publicDir,
    "js\\v540-final-stability.js"
  );

  var suffix = ".avant-v540.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v540-final-ui.css?v=540">';

  var finalJsTag =
    '<script src="js/v540-final-stability.js?v=540"></script>';

  var bootTag =
    '<script id="mhur-v540-boot">document.documentElement.classList.add("mhurV540Boot");setTimeout(function(){document.documentElement.classList.remove("mhurV540Boot")},2500);</script>';

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
    var destination = path + suffix;

    if (!fso.FileExists(destination)) {
      fso.CopyFile(path, destination, false);
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
    var escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  function patchHome() {
    var text = readUtf8(homePath).replace(/\r\n/g, "\n");

    var anchor = text.indexOf("Latest patch note");

    if (anchor < 0) {
      anchor = text.indexOf("${latestPatchCard(latest)}");
    }

    if (anchor >= 0) {
      var start = text.lastIndexOf("${divider()}", anchor);
      var marker = "${latestPatchCard(latest)}";
      var end = text.indexOf(marker, anchor);

      if (start >= 0 && end >= 0) {
        text =
          text.substring(0, start) +
          text.substring(end + marker.length);

        log("[OK] Derniere mise a jour retiree de home.js.");
      } else {
        log("[INFO] Bloc de derniere mise a jour deja retire.");
      }
    } else {
      log("[INFO] Bloc de derniere mise a jour deja absent.");
    }

    writeUtf8NoBom(homePath, text);
  }

  function patchMods() {
    var text = readUtf8(modsPath).replace(/\r\n/g, "\n");

    var tutorialStart = text.indexOf(
      "function tutorial(){return `<details class=\"modsTutorial\">"
    );

    if (tutorialStart < 0) {
      tutorialStart = text.indexOf("function tutorial()");
    }

    if (tutorialStart < 0) {
      fail("Fonction tutorial introuvable dans community-mods.js.");
    }

    var summaryStart = text.indexOf("<summary", tutorialStart);
    var summaryEnd = text.indexOf("</summary>", summaryStart);

    if (summaryStart < 0 || summaryEnd < 0) {
      fail("Balise summary du tutoriel Mods introuvable.");
    }

    summaryEnd += "</summary>".length;

    var cleanSummary =
      '<summary class="modsTutorialSummaryV540">' +
      '<span class="modsTutorialBookV540" aria-hidden="true"></span>' +
      '<span class="modsTutorialTitleV540">${tx(\'Installer des mods - PC Steam uniquement\',\'Install mods - PC Steam only\')}</span>' +
      '<span class="modsTutorialHintV540">${tx(\'Clique ici pour ouvrir le tutoriel\',\'Click here to open the tutorial\')}</span>' +
      '<span class="modsTutorialChevronV540" aria-hidden="true"></span>' +
      '</summary>';

    text =
      text.substring(0, summaryStart) +
      cleanSummary +
      text.substring(summaryEnd);

    writeUtf8NoBom(modsPath, text);
  }

  function stableRenderSource() {
    return [
      "function render(){",
      "  const app=document.getElementById('app');",
      "  if(!app)return;",
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
      "  if(typeof html==='string'&&app.innerHTML!==html){",
      "    app.innerHTML=html;",
      "  }",
      "  if(page==='home'){",
      "    app.dataset.mhurHomeLang=String(typeof lang!=='undefined'?lang:'fr');",
      "    window.MHUR_HOME_REFRESH?.();",
      "  }else{",
      "    delete app.dataset.mhurHomeLang;",
      "  }",
      "  if(!window.__keepScroll){",
      "    window.scrollTo({top:0,left:0,behavior:'auto'});",
      "  }",
      "  window.__keepScroll=false;",
      "  queueMicrotask(()=>{",
      "    window.MHUR_ROUTER?.syncFromState?.('replace');",
      "    window.MHUR_SEO?.sync?.();",
      "  });",
      "}",
      "window.__MHUR_V540_STABLE_RENDER__=true;"
    ].join("\n");
  }

  function patchCoreRender(text) {
    if (text.indexOf("__MHUR_V540_STABLE_RENDER__") >= 0) {
      return text;
    }

    var start = text.indexOf(
      "function render(){const app=document.getElementById('app');"
    );

    if (start < 0) {
      fail("Fonction render principale introuvable.");
    }

    var end = text.indexOf("</script>", start);

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

  function delayFirstLayout(text) {
    var marker =
      "window.MHUR_CLEAN_ROUTES?.apply?.();if(!['home','characters','tunings','costumes','builds','mods'].includes(page))page='home';updateLanguageIndicator();";

    var start = text.indexOf(marker);

    if (start < 0) {
      fail("Initialisation principale introuvable.");
    }

    var end = text.indexOf("</script>", start);

    if (end < 0) {
      fail("Fin de l'initialisation principale introuvable.");
    }

    var replacement =
      marker +
      "window.__MHUR_FINAL_LAYOUT_PENDING__=true;";

    return (
      text.substring(0, start) +
      replacement +
      "\n" +
      text.substring(end)
    );
  }

  function patchIndex() {
    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    text = removeFileTag(text, "v540-final-ui.css");
    text = removeFileTag(text, "v540-final-stability.js");

    text = text.replace(
      /<script\b[^>]*id=["']mhur-v540-boot["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      ""
    );

    text = text.replace(
      /<script\b[^>]*id=["']mhur-v537-boot["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      ""
    );

    text = patchCoreRender(text);
    text = delayFirstLayout(text);

    text = text.replace(
      /<script\b[^>]*src=["']js\/home\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i,
      '<script src="js/home.js?v=540"></script>'
    );

    text = text.replace(
      /<script\b[^>]*src=["']js\/community-mods\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i,
      '<script src="js/community-mods.js?v=540"></script>'
    );

    if (
      text.indexOf("</head>") < 0 ||
      text.indexOf("</body>") < 0
    ) {
      fail("Balises head/body introuvables.");
    }

    text = text.replace(
      "</head>",
      bootTag + "\n" + cssTag + "\n</head>"
    );

    text = text.replace(
      "</body>",
      finalJsTag + "\n</body>"
    );

    writeUtf8NoBom(indexPath, text);
  }

  function validate() {
    var errors = [];
    var indexText = readUtf8(indexPath);
    var homeText = readUtf8(homePath);
    var modsText = readUtf8(modsPath);

    if (indexText.indexOf(cssTag) < 0) {
      errors.push("CSS V540 absent.");
    }

    if (indexText.indexOf(finalJsTag) < 0) {
      errors.push("JavaScript final V540 absent.");
    }

    if (
      indexText.indexOf("__MHUR_V540_STABLE_RENDER__") < 0
    ) {
      errors.push("Render stable V540 absent.");
    }

    if (
      indexText.indexOf(
        "window.__MHUR_FINAL_LAYOUT_PENDING__=true;"
      ) < 0
    ) {
      errors.push("Premier layout non retarde.");
    }

    if (homeText.indexOf("${latestPatchCard(latest)}") >= 0) {
      errors.push(
        "Derniere mise a jour encore presente dans l'accueil."
      );
    }

    if (
      modsText.indexOf("modsTutorialSummaryV540") < 0 ||
      modsText.indexOf("modsTutorialChevronV540") < 0
    ) {
      errors.push("Tutoriel Mods V540 absent.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V540");

      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }

      fail("Le correctif V540 n'a pas passe la verification.");
    }
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V540");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(homePath);
    requireFile(modsPath);
    requireFile(cssPath);
    requireFile(finalJsPath);

    backup(indexPath);
    backup(homePath);
    backup(modsPath);

    patchHome();
    patchMods();
    patchIndex();
    validate();

    log("[OK] Tutoriel Mods nettoye, sans caracteres casses.");
    log("[OK] Une seule fleche propre reste visible.");
    log("[OK] Portraits de tous les styles agrandis de 8 pour cent.");
    log("[OK] Premier layout repousse apres le chargement des scripts.");
    log("[OK] Les renders tardifs identiques ne reconstruisent plus l'accueil.");
    log("[OK] Derniere mise a jour supprimee du bas de l'accueil.");
    log("");
    log("TOUTES LES VERIFICATIONS V540 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Apres le deploiement : Ctrl + F5.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V540 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
