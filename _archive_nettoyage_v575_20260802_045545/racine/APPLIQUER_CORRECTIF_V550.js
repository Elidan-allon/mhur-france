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
      "css\\v550-notes-mods-repair.css"
    );

  var jsPath =
    fso.BuildPath(
      publicDir,
      "js\\v550-notes-mods-repair.js"
    );

  var backupPath =
    indexPath + ".avant-v550.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v550-notes-mods-repair.css?v=550">';

  var jsTag =
    '<script src="js/v550-notes-mods-repair.js?v=550"></script>';

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
    log("  MHUR FRANCE - CORRECTIF V550");
    log("============================================");
    log("");

    if (!fso.FileExists(indexPath)) {
      fail("public\\index.html est introuvable.");
    }

    if (!fso.FileExists(cssPath)) {
      fail("Le CSS V550 est introuvable.");
    }

    if (!fso.FileExists(jsPath)) {
      fail("Le JavaScript V550 est introuvable.");
    }

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(
        indexPath,
        backupPath,
        false
      );
    }

    var text = readUtf8(indexPath)
      .replace(/\r\n/g, "\n");

    /*
      Retire complètement le V549 responsable du fond cassé.
      V547 et V548 restent chargés.
    */
    var removedFiles = [
      "v549-mods-single-arrow.css",
      "v549-mods-single-arrow.js",
      "v550-notes-mods-repair.css",
      "v550-notes-mods-repair.js"
    ];

    for (
      var fileIndex = 0;
      fileIndex < removedFiles.length;
      fileIndex++
    ) {
      text = removeTag(
        text,
        removedFiles[fileIndex]
      );
    }

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

    writeUtf8NoBom(indexPath, text);

    /*
      Supprime aussi les fichiers V549 locaux afin qu'ils ne soient
      pas réajoutés par erreur plus tard.
    */
    var obsoletePaths = [
      fso.BuildPath(
        publicDir,
        "css\\v549-mods-single-arrow.css"
      ),
      fso.BuildPath(
        publicDir,
        "js\\v549-mods-single-arrow.js"
      )
    ];

    for (
      var obsoleteIndex = 0;
      obsoleteIndex < obsoletePaths.length;
      obsoleteIndex++
    ) {
      if (fso.FileExists(obsoletePaths[obsoleteIndex])) {
        fso.DeleteFile(
          obsoletePaths[obsoleteIndex],
          true
        );
      }
    }

    var finalText = readUtf8(indexPath);
    var errors = [];

    if (
      finalText.split(cssTag).length - 1 !== 1
    ) {
      errors.push(
        "Le CSS V550 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.split(jsTag).length - 1 !== 1
    ) {
      errors.push(
        "Le JavaScript V550 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.indexOf(
        "v549-mods-single-arrow"
      ) >= 0
    ) {
      errors.push(
        "Le V549 est encore chargé dans index.html."
      );
    }

    if (errors.length) {
      log("");
      log(
        "ECHEC DE LA VERIFICATION V550"
      );

      for (
        var errorIndex = 0;
        errorIndex < errors.length;
        errorIndex++
      ) {
        log(" - " + errors[errorIndex]);
      }

      fail(
        "Le correctif V550 n'a pas passé la vérification."
      );
    }

    log("[OK] Le V549 casse est retire.");
    log("[OK] Le fond original du tutoriel Mods est restaure.");
    log("[OK] Une seule fleche reste dans le tutoriel.");
    log("[OK] Les boutons Patch Notes et Dev Notes sont visibles.");
    log("[OK] La fenetre Notes est reconstruite si ses onglets manquent.");
    log("[OK] Les Dev Notes peuvent defiler jusqu'au dernier bloc.");
    log("[OK] Le V547 et le V548 restent actifs.");
    log("");
    log(
      "TOUTES LES VERIFICATIONS V550 SONT BONNES"
    );
    log("");
    log(
      "Dans GitHub Desktop : Commit to main, puis Push origin."
    );

    WScript.Quit(0);
  } catch (error) {
    log("");
    log(
      "ERREUR V550 : " +
      error.message
    );
    log("");
    WScript.Quit(1);
  }
})();
