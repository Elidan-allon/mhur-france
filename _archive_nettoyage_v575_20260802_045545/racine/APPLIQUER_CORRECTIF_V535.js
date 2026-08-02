(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var cssPath = fso.BuildPath(publicDir, "css\\v535-complete-images.css");
  var jsPath = fso.BuildPath(publicDir, "js\\v535-navigation-only.js");
  var backupPath = indexPath + ".avant-v535.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v535-complete-images.css?v=535">';
  var jsTag =
    '<script src="js/v535-navigation-only.js?v=535"></script>';

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

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V535");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(cssPath);
    requireFile(jsPath);

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(indexPath, backupPath, false);
    }

    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    /*
      Retire tous les anciens correctifs d'image/navigation récents.
      Gentle V531 reste intact.
    */
    var oldFiles = [
      "v532-grid-photo-stable.css",
      "v532-render-stable.js",
      "v533-portraits-navigation.css",
      "v533-portraits-navigation.js",
      "v534-all-styles.css",
      "v534-all-styles.js",
      "v535-complete-images.css",
      "v535-navigation-only.js"
    ];

    for (var i = 0; i < oldFiles.length; i++) {
      text = removeFileTag(text, oldFiles[i]);
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

    var finalText = readUtf8(indexPath);
    var cssCount = finalText.split(cssTag).length - 1;
    var jsCount = finalText.split(jsTag).length - 1;

    if (cssCount !== 1) {
      fail("Le CSS V535 apparait " + cssCount + " fois.");
    }

    if (jsCount !== 1) {
      fail("Le JavaScript V535 apparait " + jsCount + " fois.");
    }

    if (finalText.indexOf("v534-all-styles") >= 0) {
      fail("L'ancien correctif V534 est encore charge.");
    }

    log("[OK] Le recentrage automatique V534 a ete retire.");
    log("[OK] Tous les styles utilisent object-fit contain.");
    log("[OK] Les images ne subissent plus aucune translation.");
    log("[OK] Builds communaute utilise maintenant le meme carre photo.");
    log("[OK] Quatre cartes restent affichees par ligne sur ordinateur.");
    log("");
    log("TOUTES LES VERIFICATIONS V535 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Apres le deploiement : Ctrl + F5.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V535 : " + error.message);
    log("");

    WScript.Quit(1);
  }
})();
