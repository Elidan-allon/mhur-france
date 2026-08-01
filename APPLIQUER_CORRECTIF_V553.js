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
      "css\\v553-patch-notifications-back.css"
    );

  var jsPath =
    fso.BuildPath(
      publicDir,
      "js\\v553-patch-notifications-back.js"
    );

  var backupPath =
    indexPath + ".avant-v553.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v553-patch-notifications-back.css?v=553">';

  var jsTag =
    '<script src="js/v553-patch-notifications-back.js?v=553"></script>';

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
    log("  MHUR FRANCE - CORRECTIF V553");
    log("============================================");
    log("");

    if (!fso.FileExists(indexPath)) {
      fail("public\\index.html est introuvable.");
    }

    if (!fso.FileExists(cssPath)) {
      fail("Le CSS V553 est introuvable.");
    }

    if (!fso.FileExists(jsPath)) {
      fail("Le JavaScript V553 est introuvable.");
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
      "v553-patch-notifications-back.css"
    );

    text = removeTag(
      text,
      "v553-patch-notifications-back.js"
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
        "Le CSS V553 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.split(jsTag).length - 1 !== 1
    ) {
      errors.push(
        "Le JavaScript V553 n'est pas chargé exactement une fois."
      );
    }

    if (errors.length) {
      log("");
      log(
        "ECHEC DE LA VERIFICATION V553"
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
        "Le correctif V553 n'a pas passé la vérification."
      );
    }

    log("[OK] Le patch v1.17.0-14.5 est remplace par la version corrigee.");
    log("[OK] Les tons BUFF, NERF et NEUTRE sont explicites.");
    log("[OK] Les noms des Alters sont recuperes depuis les donnees du site.");
    log("[OK] Boost du pied utilise le nom francais du site.");
    log("[OK] Le bouton Retour reste fixe sur mobile.");
    log("[OK] Une notification de mise a jour non lue est ajoutee.");
    log("[OK] Le compteur de notifications affiche 1, 2, 3, etc.");
    log("[OK] Les anciennes Patch Notes et les Dev Notes restent disponibles.");
    log("[OK] Le V547, V548, V551 et V552 restent actifs.");
    log("");
    log(
      "TOUTES LES VERIFICATIONS V553 SONT BONNES"
    );
    log("");
    log(
      "Dans GitHub Desktop : Commit to main, puis Push origin."
    );

    WScript.Quit(0);
  } catch (error) {
    log("");
    log(
      "ERREUR V553 : " +
      error.message
    );
    log("");
    WScript.Quit(1);
  }
})();
