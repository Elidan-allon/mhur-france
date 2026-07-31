(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var cssPath = fso.BuildPath(
    publicDir,
    "css\\v543-moderation-evidence.css"
  );
  var jsPath = fso.BuildPath(
    publicDir,
    "js\\v543-moderation-evidence.js"
  );
  var backupPath = indexPath + ".avant-v543.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v543-moderation-evidence.css?v=543">';
  var jsTag =
    '<script src="js/v543-moderation-evidence.js?v=543"></script>';

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

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V543");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(cssPath);
    requireFile(jsPath);

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(indexPath, backupPath, false);
    }

    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    text = removeFileTag(
      text,
      "v543-moderation-evidence.css"
    );
    text = removeFileTag(
      text,
      "v543-moderation-evidence.js"
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

    var finalText = readUtf8(indexPath);
    var errors = [];

    if (finalText.split(cssTag).length - 1 !== 1) {
      errors.push("Le CSS V543 n'est pas chargé exactement une fois.");
    }

    if (finalText.split(jsTag).length - 1 !== 1) {
      errors.push("Le JavaScript V543 n'est pas chargé exactement une fois.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V543");

      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }

      fail("Le correctif V543 n'a pas passé la vérification.");
    }

    log("[OK] Nouveau centre de modération chargé.");
    log("[OK] Signalements de mods avec auteur, message, mod et actions.");
    log("[OK] Signalements de builds avec auteur, message, build et actions.");
    log("[OK] Trois images maximum par signalement ou suggestion.");
    log("[OK] Réponses de modération visibles par la personne.");
    log("[OK] Demandes de suppression compatibles avec toutes les réponses API.");
    log("[OK] Bouton Retour présent dans chaque rubrique.");
    log("[OK] Fenêtre descendue sous le header.");
    log("");
    log("TOUTES LES VERIFICATIONS V543 SONT BONNES");
    log("");
    log("IMPORTANT : execute ensuite le fichier SQL V543 dans Supabase.");
    log("Puis Commit to main et Push origin.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V543 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
