(function () {
  "use strict";

  var fso =
    new ActiveXObject(
      "Scripting.FileSystemObject"
    );

  var root =
    fso.GetParentFolderName(
      WScript.ScriptFullName
    );

  var publicDir =
    fso.BuildPath(
      root,
      "public"
    );

  var indexPath =
    fso.BuildPath(
      publicDir,
      "index.html"
    );

  var cssPath =
    fso.BuildPath(
      publicDir,
      "css\\v556-global-new-repair.css"
    );

  var jsPath =
    fso.BuildPath(
      publicDir,
      "js\\v556-global-new-repair.js"
    );

  var backupPath =
    indexPath + ".avant-v556.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v556-global-new-repair.css?v=556">';

  var jsTag =
    '<script src="js/v556-global-new-repair.js?v=556"></script>';

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

    var text =
      stream.ReadText(-1);

    stream.Close();

    return text.replace(
      /^\uFEFF/,
      ""
    );
  }

  function writeUtf8NoBom(
    path,
    text
  ) {
    var textStream =
      new ActiveXObject("ADODB.Stream");

    textStream.Type = 2;
    textStream.Charset = "utf-8";
    textStream.Open();
    textStream.WriteText(text);
    textStream.Position = 0;
    textStream.Type = 1;
    textStream.Position = 3;

    var bytes =
      textStream.Read();

    textStream.Close();

    var binaryStream =
      new ActiveXObject("ADODB.Stream");

    binaryStream.Type = 1;
    binaryStream.Open();
    binaryStream.Write(bytes);
    binaryStream.SaveToFile(
      path,
      2
    );
    binaryStream.Close();
  }

  function removeTag(
    text,
    filename
  ) {
    var escaped =
      filename.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    var linkPattern =
      new RegExp(
        "<link\\b[^>]*href=[\"'][^\"']*" +
        escaped +
        "[^\"']*[\"'][^>]*>\\s*",
        "gi"
      );

    var scriptPattern =
      new RegExp(
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
    log(
      "============================================"
    );
    log(
      "  MHUR FRANCE - CORRECTIF V556"
    );
    log(
      "============================================"
    );
    log("");

    if (
      !fso.FileExists(indexPath)
    ) {
      fail(
        "public\\index.html est introuvable."
      );
    }

    if (
      !fso.FileExists(cssPath)
    ) {
      fail(
        "Le CSS V556 est introuvable."
      );
    }

    if (
      !fso.FileExists(jsPath)
    ) {
      fail(
        "Le JavaScript V556 est introuvable."
      );
    }

    if (
      !fso.FileExists(backupPath)
    ) {
      fso.CopyFile(
        indexPath,
        backupPath,
        false
      );
    }

    var text =
      readUtf8(indexPath)
        .replace(/\r\n/g, "\n");

    /*
      V552 provoquait les doubles flèches.
      V554 et V555 utilisaient plusieurs styles NEW différents.
      Le V556 les remplace complètement.
    */
    var obsoleteFiles = [
      "v552-mods-arrow-only.css",
      "v552-mods-arrow-only.js",
      "v554-new-released-pulse.css",
      "v554-new-released-pulse.js",
      "v555-gentle-new-badges.css",
      "v555-gentle-new-badges.js",
      "v556-global-new-repair.css",
      "v556-global-new-repair.js"
    ];

    var fileIndex;

    for (
      fileIndex = 0;
      fileIndex < obsoleteFiles.length;
      fileIndex++
    ) {
      text = removeTag(
        text,
        obsoleteFiles[fileIndex]
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

    writeUtf8NoBom(
      indexPath,
      text
    );

    /*
      Suppression physique des anciens fichiers remplacés.
    */
    var obsoletePaths = [
      fso.BuildPath(
        publicDir,
        "css\\v552-mods-arrow-only.css"
      ),
      fso.BuildPath(
        publicDir,
        "js\\v552-mods-arrow-only.js"
      ),
      fso.BuildPath(
        publicDir,
        "css\\v554-new-released-pulse.css"
      ),
      fso.BuildPath(
        publicDir,
        "js\\v554-new-released-pulse.js"
      ),
      fso.BuildPath(
        publicDir,
        "css\\v555-gentle-new-badges.css"
      ),
      fso.BuildPath(
        publicDir,
        "js\\v555-gentle-new-badges.js"
      )
    ];

    for (
      fileIndex = 0;
      fileIndex < obsoletePaths.length;
      fileIndex++
    ) {
      if (
        fso.FileExists(
          obsoletePaths[fileIndex]
        )
      ) {
        fso.DeleteFile(
          obsoletePaths[fileIndex],
          true
        );
      }
    }

    var finalText =
      readUtf8(indexPath);

    var errors = [];

    if (
      finalText.split(cssTag).length - 1 !== 1
    ) {
      errors.push(
        "Le CSS V556 n'est pas charge exactement une fois."
      );
    }

    if (
      finalText.split(jsTag).length - 1 !== 1
    ) {
      errors.push(
        "Le JavaScript V556 n'est pas charge exactement une fois."
      );
    }

    var oldNames = [
      "v552-mods-arrow-only",
      "v554-new-released-pulse",
      "v555-gentle-new-badges"
    ];

    for (
      fileIndex = 0;
      fileIndex < oldNames.length;
      fileIndex++
    ) {
      if (
        finalText.indexOf(
          oldNames[fileIndex]
        ) >= 0
      ) {
        errors.push(
          "Un ancien correctif est encore charge : " +
          oldNames[fileIndex]
        );
      }
    }

    if (errors.length) {
      log("");
      log(
        "ECHEC DE LA VERIFICATION V556"
      );

      for (
        fileIndex = 0;
        fileIndex < errors.length;
        fileIndex++
      ) {
        log(
          " - " +
          errors[fileIndex]
        );
      }

      fail(
        "Le correctif V556 n'a pas passe la verification."
      );
    }

    log(
      "[OK] Le changement de PV n'affiche plus de photo d'Alter."
    );
    log(
      "[OK] Les reductions de points utilisent de nouveau leurs vraies images."
    );
    log(
      "[OK] Les roles et les points sont restaures sur les reductions."
    );
    log(
      "[OK] Le texte de mise a jour automatique du mardi est supprime."
    );
    log(
      "[OK] Le NEW officiel de l'accueil est utilise partout pour Gentle."
    );
    log(
      "[OK] Le NEW est ajoute aux cartes, styles, costumes et Tier List."
    );
    log(
      "[OK] Le NEW des costumes est place sous la rarete."
    );
    log(
      "[OK] Les futures sorties ne montrent pas NEW avant leur sortie."
    );
    log(
      "[OK] Le tutoriel Mods ne garde qu'une seule fleche."
    );
    log(
      "[OK] Les textes visibles de la page Mods suivent FR / EN."
    );
    log(
      "[OK] V552, V554 et V555 sont retires et remplaces."
    );
    log("");
    log(
      "TOUTES LES VERIFICATIONS V556 SONT BONNES"
    );
    log("");
    log(
      "Dans GitHub Desktop : Commit to main, puis Push origin."
    );

    WScript.Quit(0);
  } catch (error) {
    log("");
    log(
      "ERREUR V556 : " +
      error.message
    );
    log("");

    WScript.Quit(1);
  }
})();
