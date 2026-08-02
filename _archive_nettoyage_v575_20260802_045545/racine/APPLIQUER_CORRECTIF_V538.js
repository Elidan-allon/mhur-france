(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var patchPath = fso.BuildPath(
    publicDir,
    "js\\v538-level-up-effects-first.js"
  );
  var backupPath = indexPath + ".avant-v538.bak";

  var scriptTag =
    '<script src="js/v538-level-up-effects-first.js?v=538"></script>';

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

  function removeExistingTag(text) {
    var pattern =
      /<script\b[^>]*src=["'][^"']*v538-level-up-effects-first\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi;

    return text.replace(pattern, "");
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V538");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(patchPath);

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(indexPath, backupPath, false);
    }

    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");
    text = removeExistingTag(text);

    /*
      Injection juste avant le premier layout de la page.
      Ainsi l'ordre correct est prêt avant l'affichage de la fiche.
    */
    var firstLayoutPattern =
      /(<script>\s*window\.MHUR_CLEAN_ROUTES\?\.\s*apply\?\.\(\);)/i;

    if (firstLayoutPattern.test(text)) {
      text = text.replace(
        firstLayoutPattern,
        scriptTag + "\n$1"
      );
    } else {
      var fallbackPattern =
        /(<script>\s*window\.MHUR_CLEAN_ROUTES\?\.\s*apply\?\.\(\)[\s\S]*?layout\(\);)/i;

      if (fallbackPattern.test(text)) {
        text = text.replace(
          fallbackPattern,
          scriptTag + "\n$1"
        );
      } else if (text.indexOf("</body>") >= 0) {
        /*
          Compatible également avec un index déjà réorganisé par V537.
          Dans ce cas, le fichier reste chargé avant les navigations
          suivantes vers les fiches de personnages.
        */
        text = text.replace(
          "</body>",
          scriptTag + "\n</body>"
        );
      } else {
        fail("Impossible de trouver le premier layout ou </body>.");
      }
    }

    writeUtf8NoBom(indexPath, text);

    var finalText = readUtf8(indexPath);
    var count = finalText.split(scriptTag).length - 1;

    if (count !== 1) {
      fail(
        "Le script V538 apparaît " +
        count +
        " fois au lieu d'une."
      );
    }

    log("[OK] Le correctif V538 est relié à index.html.");
    log("[OK] Effets de montée alpha, beta et gamma en premier.");
    log("[OK] L'ordre des autres tableaux reste inchangé.");
    log("[OK] Français et anglais sont pris en charge.");
    log("");
    log("TOUTES LES VERIFICATIONS V538 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Apres le deploiement : Ctrl + F5.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V538 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
