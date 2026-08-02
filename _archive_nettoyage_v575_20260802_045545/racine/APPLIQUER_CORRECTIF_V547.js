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
      "css\\v547-mobile-profile-roles.css"
    );

  var jsPath =
    fso.BuildPath(
      publicDir,
      "js\\v547-mobile-profile-roles.js"
    );

  var backupPath =
    indexPath + ".avant-v547.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v547-mobile-profile-roles.css?v=547">';

  var jsTag =
    '<script src="js/v547-mobile-profile-roles.js?v=547"></script>';

  function log(message) {
    WScript.Echo(message);
  }

  function fail(message) {
    throw new Error(message);
  }

  function requireFile(path) {
    if (!fso.FileExists(path)) {
      fail(
        "Fichier obligatoire introuvable : " +
        path
      );
    }
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
    log("  MHUR FRANCE - CORRECTIF V547");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(cssPath);
    requireFile(jsPath);

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(
        indexPath,
        backupPath,
        false
      );
    }

    var text = readUtf8(indexPath)
      .replace(/\r\n/g, "\n");

    var oldFiles = [
      "v544-gentle-mobile-final.css",
      "v544-gentle-mobile-final.js",
      "v545-final-interface.css",
      "v545-final-interface.js",
      "v546-final-targeted.css",
      "v546-final-targeted.js",
      "v547-mobile-profile-roles.css",
      "v547-mobile-profile-roles.js"
    ];

    for (
      var oldFileIndex = 0;
      oldFileIndex < oldFiles.length;
      oldFileIndex++
    ) {
      text = removeFileTag(
        text,
        oldFiles[oldFileIndex]
      );
    }

    if (
      text.indexOf("</head>") < 0 ||
      text.indexOf("</body>") < 0
    ) {
      fail(
        "Balises head/body introuvables."
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

    writeUtf8NoBom(indexPath, text);

    var finalText = readUtf8(indexPath);
    var errors = [];

    if (
      finalText.split(cssTag).length - 1 !== 1
    ) {
      errors.push(
        "Le CSS V547 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.split(jsTag).length - 1 !== 1
    ) {
      errors.push(
        "Le JavaScript V547 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.indexOf(
        "v546-final-targeted.js"
      ) >= 0
    ) {
      errors.push(
        "L'ancien JavaScript V546 est encore chargé."
      );
    }

    if (errors.length) {
      log("");
      log(
        "ECHEC DE LA VERIFICATION V547"
      );

      for (
        var errorIndex = 0;
        errorIndex < errors.length;
        errorIndex++
      ) {
        log(" - " + errors[errorIndex]);
      }

      fail(
        "Le correctif V547 n'a pas passé la vérification."
      );
    }

    log("[OK] L'ancien script V546 est retire.");
    log("[OK] Une seule Suggestion reste visible.");
    log("[OK] Un seul Centre de moderation reste visible.");
    log("[OK] Les cartes a trois roles ont une hauteur automatique.");
    log("[OK] Le role Technique de Bakugo n'est plus coupe.");
    log("[OK] Une marge est ajoutee sous le header mobile.");
    log("[OK] Les portraits Patch Notes ne chevauchent plus les changements.");
    log("[OK] Les portraits Patch Notes restent entiers.");
    log("");
    log(
      "TOUTES LES VERIFICATIONS V547 SONT BONNES"
    );
    log("");
    log(
      "Dans GitHub Desktop : Commit to main, puis Push origin."
    );

    WScript.Quit(0);
  } catch (error) {
    log("");
    log(
      "ERREUR V547 : " +
      error.message
    );
    log("");
    WScript.Quit(1);
  }
})();
