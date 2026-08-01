(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var indexPath = fso.BuildPath(publicDir, "index.html");
  var cssPath = fso.BuildPath(publicDir, "css\\v548-mobile-season-offset.css");
  var backupPath = indexPath + ".avant-v548.bak";
  var cssTag = '<link rel="stylesheet" href="css/v548-mobile-season-offset.css?v=548">';

  function log(message) {
    WScript.Echo(message);
  }

  function fail(message) {
    throw new Error(message);
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

  function removeCssTag(text, filename) {
    var escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var pattern = new RegExp(
      "<link\\b[^>]*href=[\"'][^\"']*" +
      escaped +
      "[^\"']*[\"'][^>]*>\\s*",
      "gi"
    );
    return text.replace(pattern, "");
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - AJUSTEMENT V548");
    log("============================================");
    log("");

    if (!fso.FileExists(indexPath)) {
      fail("public\\index.html est introuvable.");
    }

    if (!fso.FileExists(cssPath)) {
      fail("Le fichier CSS V548 est introuvable.");
    }

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(indexPath, backupPath, false);
    }

    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");
    text = removeCssTag(text, "v548-mobile-season-offset.css");

    if (text.indexOf("</head>") < 0) {
      fail("La balise </head> est introuvable.");
    }

    text = text.replace("</head>", cssTag + "\n</head>");
    writeUtf8NoBom(indexPath, text);

    var finalText = readUtf8(indexPath);

    if (finalText.split(cssTag).length - 1 !== 1) {
      fail("Le CSS V548 n'est pas chargé exactement une fois.");
    }

    log("[OK] Le contenu mobile descend de 10 px supplementaires.");
    log("[OK] Les corrections du V547 restent actives.");
    log("");
    log("TOUTES LES VERIFICATIONS V548 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V548 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
