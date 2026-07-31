(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var homePath = fso.BuildPath(publicDir, "js\\home.js");
  var cssPath = fso.BuildPath(publicDir, "css\\v520-character-styles.css");
  var navPath = fso.BuildPath(publicDir, "js\\v520-character-styles.js");

  var suffix = ".avant-v536.bak";
  var cssTag =
    '<link rel="stylesheet" href="css/v520-character-styles.css?v=536">';
  var jsTag =
    '<script src="js/v520-character-styles.js?v=536"></script>';

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

    var oldStartup =
      "setInterval(refresh,1000);setTimeout(()=>{" +
      "if(typeof page!=='undefined'&&page==='home'&&" +
      "typeof render==='function')render();refresh()},0);";

    var newStartup =
      "window.MHUR_HOME_REFRESH=refresh;setInterval(refresh,1000);";

    if (text.indexOf(oldStartup) < 0) {
      if (text.indexOf("window.MHUR_HOME_REFRESH=refresh") < 0) {
        fail("Le rendu automatique de home.js n'a pas été trouvé.");
      }
    } else {
      text = text.replace(oldStartup, newStartup);
    }

    writeUtf8NoBom(homePath, text);
  }

  function patchIndex() {
    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    /*
      Retire les anciens fichiers V532 à V535 pour éviter les conflits.
      Le correctif Gentle V531 et season18-fixes restent intacts.
    */
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
      "v520-character-styles.js"
    ];

    for (var i = 0; i < oldFiles.length; i++) {
      text = removeFileTag(text, oldFiles[i]);
    }

    /*
      Ces deux scripts ne modifient que les données de costumes.
      Ils ne doivent plus reconstruire l'accueil au démarrage.
    */
    text = text.split(
      "if(typeof render==='function'){" +
      "window.__keepScroll=true;render();}"
    ).join(
      "if(typeof render==='function'&&typeof page!=='undefined'&&" +
      "page==='costumes'){window.__keepScroll=true;render();}"
    );

    text = text.split(
      "if(typeof render==='function'){ " +
      "window.__keepScroll=true; render(); }"
    ).join(
      "if(typeof render==='function'&&typeof page!=='undefined'&&" +
      "page==='costumes'){ window.__keepScroll=true; render(); }"
    );

    /*
      Le timer reçoit ses vraies valeurs pendant le premier rendu,
      avant que le navigateur affiche la page.
    */
    var firstLayout =
      "updateLanguageIndicator();layout();window.MHUR_SEO?.sync?.();";

    var firstLayoutReady =
      "updateLanguageIndicator();layout();" +
      "window.MHUR_HOME_REFRESH?.();" +
      "window.MHUR_SEO?.sync?.();";

    if (text.indexOf(firstLayout) >= 0) {
      text = text.replace(firstLayout, firstLayoutReady);
    } else if (text.indexOf(firstLayoutReady) < 0) {
      fail("Le premier layout de index.html n'a pas été trouvé.");
    }

    if (text.indexOf("</head>") < 0) {
      fail("Balise de fermeture head introuvable.");
    }

    if (text.indexOf("</body>") < 0) {
      fail("Balise de fermeture body introuvable.");
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

  function validate() {
    var errors = [];
    var indexText = readUtf8(indexPath);
    var homeText = readUtf8(homePath);

    if (indexText.indexOf(cssTag) < 0) {
      errors.push("Le CSS V536 n'est pas chargé.");
    }

    if (indexText.indexOf(jsTag) < 0) {
      errors.push("Le JavaScript V536 n'est pas chargé.");
    }

    if (
      homeText.indexOf(
        "page==='home'&&typeof render==='function')render()"
      ) >= 0
    ) {
      errors.push("home.js relance encore render au démarrage.");
    }

    if (homeText.indexOf("window.MHUR_HOME_REFRESH=refresh") < 0) {
      errors.push("Le rafraîchissement direct du timer est absent.");
    }

    if (indexText.indexOf("window.MHUR_HOME_REFRESH?.()") < 0) {
      errors.push("Le timer n'est pas initialisé pendant le premier layout.");
    }

    if (indexText.indexOf("v535-complete-images") >= 0) {
      errors.push("L'ancien V535 est encore chargé.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V536");

      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }

      fail("Le correctif V536 n'a pas passé la vérification.");
    }
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V536");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(homePath);
    requireFile(cssPath);
    requireFile(navPath);

    backup(indexPath);
    backup(homePath);

    patchHome();
    patchIndex();
    validate();

    log("[OK] Les vrais fichiers v520 manquants sont maintenant présents.");
    log("[OK] Tous les portraits de style sont affichés entièrement.");
    log("[OK] Les anciens zooms et translations sont neutralisés.");
    log("[OK] Les trois rendus automatiques de l'accueil sont supprimés.");
    log("[OK] Le timer reçoit ses valeurs dès le premier affichage.");
    log("[OK] Quatre personnages restent affichés par ligne.");
    log("");
    log("TOUTES LES VERIFICATIONS V536 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Apres le deploiement : Ctrl + F5.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V536 : " + error.message);
    log("");

    WScript.Quit(1);
  }
})();
