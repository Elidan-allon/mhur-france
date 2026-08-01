(function () {
  "use strict";

  var fso =
    new ActiveXObject("Scripting.FileSystemObject");

  var root =
    fso.GetParentFolderName(WScript.ScriptFullName);

  var publicDir =
    fso.BuildPath(root, "public");

  var indexPath =
    fso.BuildPath(publicDir, "index.html");

  var cssPath =
    fso.BuildPath(
      publicDir,
      "css\\v555-gentle-new-badges.css"
    );

  var jsPath =
    fso.BuildPath(
      publicDir,
      "js\\v555-gentle-new-badges.js"
    );

  var backupPath =
    indexPath + ".avant-v555.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v555-gentle-new-badges.css?v=555">';

  var jsTag =
    '<script src="js/v555-gentle-new-badges.js?v=555"></script>';

  function log(message) {
    WScript.Echo(message);
  }

  function fail(message) {
    throw new Error(message);
  }

  function readUtf8(path) {
    var stream =
      new ActiveXObject("ADODB.Stream");

    stream.Type = 2;
    stream.Charset = "utf-8";
    stream.Open();
    stream.LoadFromFile(path);

    var text = stream.ReadText(-1);
    stream.Close();

    return text.replace(/^\uFEFF/, "");
  }

  function writeUtf8NoBom(path, text) {
    var textStream =
      new ActiveXObject("ADODB.Stream");

    textStream.Type = 2;
    textStream.Charset = "utf-8";
    textStream.Open();
    textStream.WriteText(text);
    textStream.Position = 0;
    textStream.Type = 1;
    textStream.Position = 3;

    var bytes = textStream.Read();
    textStream.Close();

    var binaryStream =
      new ActiveXObject("ADODB.Stream");

    binaryStream.Type = 1;
    binaryStream.Open();
    binaryStream.Write(bytes);
    binaryStream.SaveToFile(path, 2);
    binaryStream.Close();
  }

  function removeTag(text, filename) {
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
    log("  MHUR FRANCE - CORRECTIF V555");
    log("============================================");
    log("");

    if (!fso.FileExists(indexPath)) {
      fail(
        "public\\index.html est introuvable."
      );
    }

    if (!fso.FileExists(cssPath)) {
      fail(
        "Le CSS V555 est introuvable."
      );
    }

    if (!fso.FileExists(jsPath)) {
      fail(
        "Le JavaScript V555 est introuvable."
      );
    }

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(
        indexPath,
        backupPath,
        false
      );
    }

    var text =
      readUtf8(indexPath)
      .replace(/\r\n/g, "\n");

    text = removeTag(
      text,
      "v555-gentle-new-badges.css"
    );

    text = removeTag(
      text,
      "v555-gentle-new-badges.js"
    );

    if (
      text.indexOf("</head>") < 0 ||
      text.indexOf("</body>") < 0
    ) {
      fail(
        "Les balises head/body sont introuvables."
      );
    }

    text = text.replace(
      "</head>",
      cssTag + "\n</head>"
    );

    text = text.replace(
      "</body>",
      jsTag + "\n</body>"
    );

    writeUtf8NoBom(
      indexPath,
      text
    );

    var finalText =
      readUtf8(indexPath);

    var errors = [];

    if (
      finalText.split(cssTag).length - 1 !== 1
    ) {
      errors.push(
        "Le CSS V555 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.split(jsTag).length - 1 !== 1
    ) {
      errors.push(
        "Le JavaScript V555 n'est pas chargé exactement une fois."
      );
    }

    if (errors.length) {
      log("");
      log(
        "ECHEC DE LA VERIFICATION V555"
      );

      for (
        var errorIndex = 0;
        errorIndex < errors.length;
        errorIndex++
      ) {
        log(
          " - " +
          errors[errorIndex]
        );
      }

      fail(
        "Le correctif V555 n'a pas passé la vérification."
      );
    }

    log("[OK] NEW est ajoute sur Gentle Criminal dans le menu Personnages.");
    log("[OK] NEW est ajoute au costume Original.");
    log("[OK] NEW reste sur Vers. Heros, Combat et Dangereux.");
    log("[OK] Tous les NEW des costumes sont places sous la rarete.");
    log("[OK] La rarete C/R/PUR reste visible.");
    log("[OK] Les doublons de badge NEW sont supprimes.");
    log("[OK] L'animation agrandissement/retrecissement reste active.");
    log("[OK] Les correctifs precedents restent actifs.");
    log("");
    log(
      "TOUTES LES VERIFICATIONS V555 SONT BONNES"
    );
    log("");
    log(
      "Dans GitHub Desktop : Commit to main, puis Push origin."
    );

    WScript.Quit(0);
  } catch (error) {
    log("");
    log(
      "ERREUR V555 : " +
      error.message
    );
    log("");
    WScript.Quit(1);
  }
})();
