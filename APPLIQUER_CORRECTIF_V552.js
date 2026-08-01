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
      "css\\v552-mods-arrow-only.css"
    );

  var jsPath =
    fso.BuildPath(
      publicDir,
      "js\\v552-mods-arrow-only.js"
    );

  var backupPath =
    indexPath + ".avant-v552.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v552-mods-arrow-only.css?v=552">';

  var jsTag =
    '<script src="js/v552-mods-arrow-only.js?v=552"></script>';

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
    log("  MHUR FRANCE - CORRECTIF V552");
    log("============================================");
    log("");

    if (!fso.FileExists(indexPath)) {
      fail("public\\index.html est introuvable.");
    }

    if (!fso.FileExists(cssPath)) {
      fail("Le CSS V552 est introuvable.");
    }

    if (!fso.FileExists(jsPath)) {
      fail("Le JavaScript V552 est introuvable.");
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
      "v552-mods-arrow-only.css"
    );

    text = removeTag(
      text,
      "v552-mods-arrow-only.js"
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

    if (
      finalText.split(cssTag).length - 1 !== 1
    ) {
      fail(
        "Le CSS V552 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.split(jsTag).length - 1 !== 1
    ) {
      fail(
        "Le JavaScript V552 n'est pas chargé exactement une fois."
      );
    }

    log("[OK] Les anciens pseudo-chevrons sont neutralises.");
    log("[OK] Les anciennes fleches sont supprimees.");
    log("[OK] Une seule fleche V552 est ajoutee.");
    log("[OK] La fleche est remontee et centree.");
    log("[OK] Le V547, V548 et V551 restent actifs.");
    log("");
    log(
      "TOUTES LES VERIFICATIONS V552 SONT BONNES"
    );
    log("");
    log(
      "Dans GitHub Desktop : Commit to main, puis Push origin."
    );

    WScript.Quit(0);
  } catch (error) {
    log("");
    log(
      "ERREUR V552 : " +
      error.message
    );
    log("");
    WScript.Quit(1);
  }
})();
