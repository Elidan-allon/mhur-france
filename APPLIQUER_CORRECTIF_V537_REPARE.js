(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var homePath = fso.BuildPath(publicDir, "js\\home.js");
  var seasonPath = fso.BuildPath(publicDir, "js\\season18-fixes.js");
  var seasonV12Path = fso.BuildPath(publicDir, "js\\season18-v12.js");
  var modsPath = fso.BuildPath(publicDir, "js\\community-mods.js");
  var cssPath = fso.BuildPath(publicDir, "css\\v520-character-styles.css");
  var navPath = fso.BuildPath(publicDir, "js\\v520-character-styles.js");

  var suffix = ".avant-v537-repare.bak";
  var cssTag =
    '<link rel="stylesheet" href="css/v520-character-styles.css?v=537r">';
  var navTag =
    '<script src="js/v520-character-styles.js?v=537r"></script>';
  var seasonTag =
    '<script src="js/season18-fixes.js?v=537r"></script>';
  var seasonV12Tag =
    '<script src="js/season18-v12.js?v=537r"></script>';
  var bootTag =
    '<script id="mhur-v537-boot">document.documentElement.classList.add("mhurV537Boot");setTimeout(function(){document.documentElement.classList.remove("mhurV537Boot")},1500);</script>';

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
    return text.replace(linkPattern, "").replace(scriptPattern, "");
  }

  function patchHome() {
    var text = readUtf8(homePath).replace(/\r\n/g, "\n");

    // Retire tout démarrage retardé qui rappelle render() sur l'accueil.
    text = text.replace(
      /setInterval\(refresh,1000\);setTimeout\(\(\)=>\{[\s\S]*?refresh\(\)\},0\);/g,
      "window.MHUR_HOME_REFRESH=refresh;setInterval(refresh,1000);"
    );

    if (text.indexOf("window.MHUR_HOME_REFRESH=refresh") < 0) {
      text = text.replace(
        /setInterval\(refresh,1000\);/,
        "window.MHUR_HOME_REFRESH=refresh;setInterval(refresh,1000);"
      );
    }

    // Remplace l'ancienne section sorties seulement si elle existe encore.
    var releasesPattern =
      /\$\{heading\(ht\('Dernières sorties','Latest releases'\),'orange'\)\}\s*<div class="releaseGridV296">\$\{\(d\.latest_releases\|\|\[\]\)\.map\(releaseCard\)\.join\(''\)\|\|\('<div class="emptyV296">'\+ht\('Aucune sortie\.','No releases\.'\)\+'<\/div>'\)\}<\/div>/;

    if (releasesPattern.test(text)) {
      text = text.replace(
        releasesPattern,
        "${heading(ht('SORTIES PRÉVUES — SAISON 18','SEASON 18 PLANNED RELEASES'),'orange')}\n" +
        "    <div class=\"releaseGridV296 s18PlannedGridV12 s18PlannedGridV13 s18PlannedGridV14\">${typeof window.MHUR_S18_PLANNED_HTML==='function'?window.MHUR_S18_PLANNED_HTML():((d.latest_releases||[]).map(releaseCard).join('')||('<div class=\"emptyV296\">'+ht('Aucune sortie.','No releases.')+'</div>'))}</div>"
      );
      log("[OK] Section Sorties Saison 18 préparée.");
    } else {
      log("[INFO] Section Sorties déjà modifiée ou différente : aucune erreur.");
    }

    // Supprime la note de patch située tout en bas de l'accueil.
    text = text.replace(
      /\s*\$\{divider\(\)\}\s*\$\{heading\(ht\('Dernière note de mise à jour','Latest patch note'\),'orange'\)\}\s*\$\{latestPatchCard\(latest\)\}/g,
      ""
    );

    writeUtf8NoBom(homePath, text);
  }

  function patchSeasonFixes() {
    var text = readUtf8(seasonPath).replace(/\r\n/g, "\n");

    text = text.replace(
      /const wrapped=function\(\)\{const result=original\.apply\(this,arguments\);requestAnimationFrame\(afterDom\);return result;\};/g,
      "const wrapped=function(){const result=original.apply(this,arguments);afterDom();return result;};"
    );

    text = text.replace(
      /const result=original\.apply\(this,arguments\);\s*requestAnimationFrame\(afterNavigationV23\);\s*return result;/g,
      "const result=original.apply(this,arguments);afterNavigationV23();return result;"
    );

    text = text.replace(
      /const wrapped=function\(\)\{const result=original\.apply\(this,arguments\);requestAnimationFrame\(syncNewBadges\);return result\};/g,
      "const wrapped=function(){const result=original.apply(this,arguments);syncNewBadges();return result};"
    );

    var v35Pattern =
      /function runV35\(\)\{\s*wrapHomeDashboardV35\(\);\s*decorateMiniPortraitsV35\(document\);\s*\}/;

    if (v35Pattern.test(text)) {
      text = text.replace(
        v35Pattern,
        "wrapHomeDashboardV35();\nfunction runV35(){\n  decorateMiniPortraitsV35(document);\n}"
      );
    }

    writeUtf8NoBom(seasonPath, text);
  }

  function patchSeasonV12() {
    var text = readUtf8(seasonV12Path).replace(/\r\n/g, "\n");

    text = text.replace(
      /const result=original\.apply\(this,arguments\);\s*requestAnimationFrame\(afterRender\);\s*return result;/g,
      "const result=original.apply(this,arguments);afterRender();return result;"
    );

    text = text.replace(
      /if\(document\.readyState==='loading'\)\s*document\.addEventListener\('DOMContentLoaded',\(\)=>requestAnimationFrame\(afterRender\),\{once:true\}\);\s*else\s*requestAnimationFrame\(afterRender\);/g,
      "if(document.readyState!=='loading') afterRender();"
    );

    writeUtf8NoBom(seasonV12Path, text);
  }

  function patchMods() {
    var text = readUtf8(modsPath).replace(/\r\n/g, "\n");

    if (text.indexOf("modsTutorialSummaryV537") < 0) {
      var exact =
        /<summary>📘 \$\{tx\('Installer des mods — PC Steam uniquement','Install mods — PC Steam only'\)\}<\/summary>/;

      var replacement =
        '<summary class="modsTutorialSummaryV537">' +
        '<span class="modsTutorialTitleV537">📘 ${tx(\'Installer des mods — PC Steam uniquement\',\'Install mods — PC Steam only\')}</span>' +
        '<span class="s18ModsHintV10 modsTutorialHintV537">👆 ${tx(\'Clique ici pour ouvrir le tutoriel\',\'Click here to open the tutorial\')}</span>' +
        '<span class="modsTutorialChevronV537" aria-hidden="true"></span>' +
        '</summary>';

      if (exact.test(text)) {
        text = text.replace(exact, replacement);
      } else {
        text = text.replace(
          /<summary>[^<]*Installer des mods[\s\S]*?<\/summary>/i,
          replacement
        );
      }
    }

    writeUtf8NoBom(modsPath, text);
  }

  function patchIndex() {
    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    var oldFiles = [
      "v532-grid-photo-stable.css",
      "v532-render-stable.js",
      "v533-portraits-navigation.css",
      "v533-portraits-navigation.js",
      "v534-all-styles.css",
      "v534-all-styles.js",
      "v535-complete-images.css",
      "v535-navigation-only.js",
      "v520-character-styles.css",
      "v520-character-styles.js",
      "season18-fixes.js",
      "season18-v12.js"
    ];

    for (var i = 0; i < oldFiles.length; i++) {
      text = removeFileTag(text, oldFiles[i]);
    }

    text = text.replace(
      /<script\b[^>]*id=["']mhur-v537-boot["'][^>]*>[\s\S]*?<\/script>\s*/gi,
      ""
    );

    var earlyPattern =
      /(<script\b[^>]*src=["']js\/season18-early\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>)/i;

    if (earlyPattern.test(text)) {
      text = text.replace(
        earlyPattern,
        "$1\n" + seasonTag + "\n" + seasonV12Tag
      );
    } else {
      log("[INFO] season18-early.js non trouvé : scripts Saison 18 conservés en fin de page.");
    }

    text = text.replace(
      /updateLanguageIndicator\(\);layout\(\);(?:window\.MHUR_HOME_REFRESH\?\.\(\);)?(?:document\.documentElement\.classList\.remove\(["']mhurV537Boot["']\);)?window\.MHUR_SEO\?\.\.sync\?\.\(\);/,
      'updateLanguageIndicator();layout();window.MHUR_HOME_REFRESH?.();document.documentElement.classList.remove("mhurV537Boot");window.MHUR_SEO?.sync?.();'
    );

    text = text.replace(
      /<script\b[^>]*src=["']js\/home\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i,
      '<script src="js/home.js?v=537r"></script>'
    );

    text = text.replace(
      /<script\b[^>]*src=["']js\/community-mods\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i,
      '<script src="js/community-mods.js?v=537r"></script>'
    );

    if (text.indexOf("</head>") < 0 || text.indexOf("</body>") < 0) {
      fail("Balises </head> ou </body> introuvables.");
    }

    text = text.replace("</head>", bootTag + "\n" + cssTag + "\n</head>");
    text = text.replace("</body>", navTag + "\n</body>");

    writeUtf8NoBom(indexPath, text);
  }

  function validate() {
    var errors = [];
    var indexText = readUtf8(indexPath);
    var homeText = readUtf8(homePath);
    var modsText = readUtf8(modsPath);

    if (indexText.indexOf(cssTag) < 0) {
      errors.push("Le CSS V537 réparé n'est pas chargé.");
    }

    if (indexText.indexOf(navTag) < 0) {
      errors.push("Le JavaScript V537 réparé n'est pas chargé.");
    }

    if (homeText.indexOf("window.MHUR_HOME_REFRESH=refresh") < 0) {
      errors.push("Le timer direct n'est pas activé.");
    }

    if (
      homeText.indexOf("Dernière note de mise à jour") >= 0 &&
      homeText.indexOf("${latestPatchCard(latest)}") >= 0
    ) {
      errors.push("La note de patch est encore présente en bas de l'accueil.");
    }

    if (modsText.indexOf("modsTutorialSummaryV537") < 0) {
      errors.push("Le nouveau tutoriel Mods est absent.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V537 REPARE");

      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }

      fail("Le correctif réparé n'a pas passé la vérification.");
    }
  }

  try {
    log("");
    log("================================================");
    log("  MHUR FRANCE - CORRECTIF V537 REPARE");
    log("================================================");
    log("");

    requireFile(indexPath);
    requireFile(homePath);
    requireFile(seasonPath);
    requireFile(seasonV12Path);
    requireFile(modsPath);
    requireFile(cssPath);
    requireFile(navPath);

    backup(indexPath);
    backup(homePath);
    backup(seasonPath);
    backup(seasonV12Path);
    backup(modsPath);

    patchHome();
    patchSeasonFixes();
    patchSeasonV12();
    patchMods();
    patchIndex();
    validate();

    log("[OK] L'ancienne erreur sur la section Sorties ne bloque plus.");
    log("[OK] Le timer ne relance plus toute la page.");
    log("[OK] La note de patch du bas de l'accueil est supprimée.");
    log("[OK] Le tutoriel Mods indique clairement qu'il faut cliquer.");
    log("[OK] Les styles restent légèrement agrandis.");
    log("");
    log("TOUTES LES VERIFICATIONS V537 REPARE SONT BONNES");
    log("");
    log("Ensuite seulement : lance le correctif mobile V539.");
    log("Puis Commit to main et Push origin.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V537 REPARE : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
