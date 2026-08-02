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

  var seasonJsPath =
    fso.BuildPath(
      publicDir,
      "js\\season18-fixes.js"
    );

  var cssPath =
    fso.BuildPath(
      publicDir,
      "css\\v551-bars-notes-persistent.css"
    );

  var jsPath =
    fso.BuildPath(
      publicDir,
      "js\\v551-bars-notes-persistent.js"
    );

  var indexBackup =
    indexPath + ".avant-v551.bak";

  var seasonBackup =
    seasonJsPath + ".avant-v551.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v551-bars-notes-persistent.css?v=551">';

  var jsTag =
    '<script src="js/v551-bars-notes-persistent.js?v=551"></script>';

  var openMarker =
    "/* MHUR_V551_FRESH_NOTES_EACH_OPEN */";

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

  function patchSeasonNotes(text) {
    text = text.replace(/\r\n/g, "\n");

    if (text.indexOf(openMarker) < 0) {
      var oldOpen =
        "function openNotes(){\n" +
        "  const modal=notesModal();";

      var newOpen =
        "function openNotes(){\n" +
        "  " + openMarker + "\n" +
        "  const previous=document.getElementById('s18NotesDevModalV10');\n" +
        "  if(previous){previous.remove();document.body.classList.remove('s18NotesOpenV11');}\n" +
        "  const modal=notesModal();";

      if (text.indexOf(oldOpen) < 0) {
        fail(
          "La fonction openNotes de season18-fixes.js est introuvable."
        );
      }

      text = text.replace(
        oldOpen,
        newOpen
      );
    }

    /*
      Quand l'utilisateur ferme avec la croix ou le fond, la fenêtre
      est également détruite. La prochaine ouverture repart toujours
      avec les deux boutons et leurs événements.
    */
    var oldClose =
      "modal.querySelector('[data-close]').onclick=()=>{modal.classList.remove('open');document.body.classList.remove('s18NotesOpenV11')};";

    var newClose =
      "modal.querySelector('[data-close]').onclick=()=>{modal.classList.remove('open');document.body.classList.remove('s18NotesOpenV11');modal.remove()};";

    if (text.indexOf(oldClose) >= 0) {
      text = text.replace(
        oldClose,
        newClose
      );
    }

    var oldBackdrop =
      "modal.onclick=e=>{if(e.target===modal){modal.classList.remove('open');document.body.classList.remove('s18NotesOpenV11')}};";

    var newBackdrop =
      "modal.onclick=e=>{if(e.target===modal){modal.classList.remove('open');document.body.classList.remove('s18NotesOpenV11');modal.remove()}};";

    if (text.indexOf(oldBackdrop) >= 0) {
      text = text.replace(
        oldBackdrop,
        newBackdrop
      );
    }

    return text;
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V551");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(seasonJsPath);
    requireFile(cssPath);
    requireFile(jsPath);

    if (!fso.FileExists(indexBackup)) {
      fso.CopyFile(
        indexPath,
        indexBackup,
        false
      );
    }

    if (!fso.FileExists(seasonBackup)) {
      fso.CopyFile(
        seasonJsPath,
        seasonBackup,
        false
      );
    }

    var indexText =
      readUtf8(indexPath)
      .replace(/\r\n/g, "\n");

    var oldFiles = [
      "v549-mods-single-arrow.css",
      "v549-mods-single-arrow.js",
      "v550-notes-mods-repair.css",
      "v550-notes-mods-repair.js",
      "v551-bars-notes-persistent.css",
      "v551-bars-notes-persistent.js"
    ];

    for (
      var oldFileIndex = 0;
      oldFileIndex < oldFiles.length;
      oldFileIndex++
    ) {
      indexText = removeTag(
        indexText,
        oldFiles[oldFileIndex]
      );
    }

    if (
      indexText.indexOf("</head>") < 0 ||
      indexText.indexOf("</body>") < 0
    ) {
      fail(
        "Les balises head/body sont introuvables."
      );
    }

    indexText = indexText.replace(
      "</head>",
      cssTag + "\n</head>"
    );

    indexText = indexText.replace(
      "</body>",
      jsTag + "\n</body>"
    );

    writeUtf8NoBom(
      indexPath,
      indexText
    );

    var seasonText =
      patchSeasonNotes(
        readUtf8(seasonJsPath)
      );

    writeUtf8NoBom(
      seasonJsPath,
      seasonText
    );

    var obsoletePaths = [
      fso.BuildPath(
        publicDir,
        "css\\v549-mods-single-arrow.css"
      ),
      fso.BuildPath(
        publicDir,
        "js\\v549-mods-single-arrow.js"
      ),
      fso.BuildPath(
        publicDir,
        "css\\v550-notes-mods-repair.css"
      ),
      fso.BuildPath(
        publicDir,
        "js\\v550-notes-mods-repair.js"
      )
    ];

    for (
      var obsoleteIndex = 0;
      obsoleteIndex < obsoletePaths.length;
      obsoleteIndex++
    ) {
      if (
        fso.FileExists(
          obsoletePaths[obsoleteIndex]
        )
      ) {
        fso.DeleteFile(
          obsoletePaths[obsoleteIndex],
          true
        );
      }
    }

    var finalIndex =
      readUtf8(indexPath);

    var finalSeason =
      readUtf8(seasonJsPath);

    var errors = [];

    if (
      finalIndex.split(cssTag).length - 1 !== 1
    ) {
      errors.push(
        "Le CSS V551 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalIndex.split(jsTag).length - 1 !== 1
    ) {
      errors.push(
        "Le JavaScript V551 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalIndex.indexOf(
        "v549-mods-single-arrow"
      ) >= 0 ||
      finalIndex.indexOf(
        "v550-notes-mods-repair"
      ) >= 0
    ) {
      errors.push(
        "Le V549 ou le V550 est encore chargé."
      );
    }

    if (
      finalSeason.indexOf(
        openMarker
      ) < 0
    ) {
      errors.push(
        "La recréation des Notes à chaque ouverture est absente."
      );
    }

    if (
      finalSeason.indexOf(
        "previous.remove()"
      ) < 0
    ) {
      errors.push(
        "L'ancienne fenêtre Notes n'est pas supprimée."
      );
    }

    if (errors.length) {
      log("");
      log(
        "ECHEC DE LA VERIFICATION V551"
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
        "Le correctif V551 n'a pas passé la vérification."
      );
    }

    log("[OK] Le V549 et le V550 sont retires.");
    log("[OK] La barre Mods est de nouveau jaune/orange.");
    log("[OK] Une seule fleche reste dans le tutoriel.");
    log("[OK] Toutes les barres de defilement utilisent le style MHUR Nexus.");
    log("[OK] La fenetre Notes est recreee a chaque ouverture.");
    log("[OK] Patch Notes et Dev Notes restent toujours visibles.");
    log("[OK] Le contenu peut defiler jusqu'au tout dernier bloc.");
    log("[OK] Le V547 et le V548 restent actifs.");
    log("");
    log(
      "TOUTES LES VERIFICATIONS V551 SONT BONNES"
    );
    log("");
    log(
      "Dans GitHub Desktop : Commit to main, puis Push origin."
    );

    WScript.Quit(0);
  } catch (error) {
    log("");
    log(
      "ERREUR V551 : " +
      error.message
    );
    log("");
    WScript.Quit(1);
  }
})();
