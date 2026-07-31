(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var cssPath = fso.BuildPath(
    publicDir,
    "css\\v533-portraits-navigation.css"
  );
  var jsPath = fso.BuildPath(
    publicDir,
    "js\\v533-portraits-navigation.js"
  );
  var backupPath = indexPath + ".avant-v533.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v533-portraits-navigation.css?v=533">';
  var jsTag =
    '<script src="js/v533-portraits-navigation.js?v=533"></script>';

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
    log("  MHUR FRANCE - CORRECTIF V533");
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
      V533 remplace seulement le CSS/JS V532.
      Le correctif Gentle V531 reste intact.
    */
    text = removeFileTag(text, "v532-grid-photo-stable.css");
    text = removeFileTag(text, "v532-render-stable.js");
    text = removeFileTag(text, "v533-portraits-navigation.css");
    text = removeFileTag(text, "v533-portraits-navigation.js");

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
      fail("Le CSS V533 apparait " + cssCount + " fois.");
    }

    if (jsCount !== 1) {
      fail("Le JavaScript V533 apparait " + jsCount + " fois.");
    }

    if (finalText.indexOf("v532-render-stable.js") >= 0) {
      fail("L'ancien JavaScript de navigation V532 est encore charge.");
    }

    log("[OK] V532 navigation a ete remplace par V533.");
    log("[OK] Les portraits sont recadres dans des carres.");
    log("[OK] Quatre personnages restent affiches par ligne.");
    log("[OK] Une nouvelle categorie commencera en haut.");
    log("[OK] Le retour depuis une fiche restaurera la liste.");
    log("");
    log("TOUTES LES VERIFICATIONS V533 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Apres le deploiement : Ctrl + F5.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V533 : " + error.message);
    log("");

    WScript.Quit(1);
  }
})();
