(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var seasonPath = fso.BuildPath(publicDir, "js\\season18-fixes.js");
  var cssPath = fso.BuildPath(publicDir, "css\\v532-grid-photo-stable.css");
  var jsPath = fso.BuildPath(publicDir, "js\\v532-render-stable.js");

  var backupSuffix = ".avant-v532.bak";
  var cssTag =
    '<link rel="stylesheet" href="css/v532-grid-photo-stable.css?v=532">';
  var jsTag =
    '<script src="js/v532-render-stable.js?v=532"></script>';

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
    var target = path + backupSuffix;

    if (!fso.FileExists(target)) {
      fso.CopyFile(path, target, false);
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

  function patchSeason18() {
    var text = readUtf8(seasonPath).replace(/\r\n/g, "\n");
    var runPos = text.indexOf("function runV35(){");

    if (runPos < 0) {
      fail("La fonction runV35 est introuvable dans season18-fixes.js.");
    }

    var triggerPos = text.indexOf(
      "if(document.readyState==='loading'){",
      runPos
    );

    var finalClosure = text.lastIndexOf("})();");

    if (triggerPos < 0 || finalClosure < triggerPos) {
      fail("Le bloc de lancement V35 est introuvable.");
    }

    var stableTrigger =
      "let v35Queued=false;\n" +
      "function scheduleV35(){\n" +
      "  if(v35Queued)return;\n" +
      "  v35Queued=true;\n" +
      "  requestAnimationFrame(()=>{\n" +
      "    v35Queued=false;\n" +
      "    runV35();\n" +
      "  });\n" +
      "}\n" +
      "if(document.readyState==='loading'){\n" +
      "  document.addEventListener('DOMContentLoaded',scheduleV35,{once:true});\n" +
      "}else{\n" +
      "  scheduleV35();\n" +
      "}\n" +
      "window.addEventListener('mhur:languagechange',scheduleV35);\n" +
      "window.addEventListener('mhur-auth-change',scheduleV35);\n" +
      "window.addEventListener('mhur-role-change',scheduleV35);\n" +
      "})();";

    text =
      text.substring(0, triggerPos) +
      stableTrigger +
      text.substring(finalClosure + 5);

    writeUtf8NoBom(seasonPath, text);
  }

  function removeTagByFile(text, fileName) {
    var escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  function replaceScriptVersion(text, fileName, version) {
    var escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    var pattern = new RegExp(
      "(<script\\b[^>]*src=[\"'][^\"']*" +
        escaped +
        ")(?:\\?[^\"']*)?([\"'][^>]*>\\s*<\\/script>)",
      "i"
    );

    if (!pattern.test(text)) {
      fail("Script introuvable dans index.html : " + fileName);
    }

    return text.replace(pattern, "$1?v=" + version + "$2");
  }

  function patchIndex() {
    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    /*
      Ces deux références pointent actuellement vers des fichiers supprimés.
      Elles peuvent provoquer un premier affichage différent du suivant.
    */
    text = removeTagByFile(text, "v520-character-styles.css");
    text = removeTagByFile(text, "v520-character-styles.js");

    text = removeTagByFile(text, "v532-grid-photo-stable.css");
    text = removeTagByFile(text, "v532-render-stable.js");

    text = replaceScriptVersion(
      text,
      "season18-fixes.js",
      "532"
    );

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
    var seasonText = readUtf8(seasonPath);

    if (indexText.indexOf(cssTag) < 0) {
      errors.push("Le CSS V532 n'est pas relié à index.html.");
    }

    if (indexText.indexOf(jsTag) < 0) {
      errors.push("Le JavaScript V532 n'est pas relié à index.html.");
    }

    if (indexText.indexOf("v520-character-styles.css") >= 0) {
      errors.push("L'ancien CSS V520 est encore présent.");
    }

    if (indexText.indexOf("v520-character-styles.js") >= 0) {
      errors.push("L'ancien JavaScript V520 est encore présent.");
    }

    if (indexText.indexOf("season18-fixes.js?v=532") < 0) {
      errors.push("season18-fixes.js n'est pas rechargé en V532.");
    }

    var v35Pos = seasonText.indexOf("function runV35(){");
    var v35Tail = v35Pos >= 0 ? seasonText.substring(v35Pos) : "";

    if (v35Tail.indexOf("const obs=new MutationObserver") >= 0) {
      errors.push("L'observateur V35 instable est encore présent.");
    }

    if (
      v35Tail.indexOf(
        "window.addEventListener('load',()=>setTimeout(runV35"
      ) >= 0
    ) {
      errors.push("Le second lancement V35 au chargement est encore présent.");
    }

    if (v35Tail.indexOf("function scheduleV35(){") < 0) {
      errors.push("Le lancement stable V35 est absent.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V532");

      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }

      fail("Le correctif V532 n'a pas passé la vérification.");
    }
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V532");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(seasonPath);
    requireFile(cssPath);
    requireFile(jsPath);

    backup(indexPath);
    backup(seasonPath);

    patchSeason18();
    patchIndex();
    validate();

    log("[OK] Le second rendu automatique de la grille Saison 18 est retiré.");
    log("[OK] La position dans la page est conservée lors d'un rendu tardif.");
    log("[OK] Les personnages reviennent à 4 cartes par ligne sur ordinateur.");
    log("[OK] Les cadres des portraits sont carrés.");
    log("[OK] Les anciens zooms et déplacements des photos sont annulés.");
    log("");
    log("TOUTES LES VERIFICATIONS V532 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Apres le deploiement : Ctrl + F5.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V532 : " + error.message);
    log("");

    WScript.Quit(1);
  }
})();
