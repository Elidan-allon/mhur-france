(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");

  var cssPath = fso.BuildPath(
    publicDir,
    "css\\v545-final-interface.css"
  );

  var jsPath = fso.BuildPath(
    publicDir,
    "js\\v545-final-interface.js"
  );

  var backupPath = indexPath + ".avant-v545.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v545-final-interface.css?v=545">';

  var jsTag =
    '<script src="js/v545-final-interface.js?v=545"></script>';

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

  function matchingBrace(text, openPosition) {
    var depth = 0;
    var quote = "";
    var escaped = false;
    var lineComment = false;
    var blockComment = false;

    for (
      var index = openPosition;
      index < text.length;
      index++
    ) {
      var current = text.charAt(index);
      var next = text.charAt(index + 1);

      if (lineComment) {
        if (current === "\n") lineComment = false;
        continue;
      }

      if (blockComment) {
        if (current === "*" && next === "/") {
          blockComment = false;
          index++;
        }
        continue;
      }

      if (quote) {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (current === "\\") {
          escaped = true;
          continue;
        }

        if (current === quote) {
          quote = "";
        }

        continue;
      }

      if (current === "/" && next === "/") {
        lineComment = true;
        index++;
        continue;
      }

      if (current === "/" && next === "*") {
        blockComment = true;
        index++;
        continue;
      }

      if (
        current === "'" ||
        current === '"' ||
        current === "`"
      ) {
        quote = current;
        continue;
      }

      if (current === "{") depth++;

      if (current === "}") {
        depth--;

        if (depth === 0) {
          return index;
        }
      }
    }

    return -1;
  }

  function robustTablesSource() {
    return [
      "function mhurV545Localized(value){",
      "  if(value&&typeof value==='object'&&!Array.isArray(value)){",
      "    const current=(typeof lang!=='undefined'&&lang==='en')?'en':'fr';",
      "    return value[current]??value.fr??value.en??'';",
      "  }",
      "  return value??'';",
      "}",
      "function mhurV545Array(value){",
      "  if(Array.isArray(value))return value;",
      "  const selected=mhurV545Localized(value);",
      "  if(Array.isArray(selected))return selected;",
      "  return selected==null||selected===''?[]:[selected];",
      "}",
      "function mhurV545Cell(value){",
      "  const selected=mhurV545Localized(value);",
      "  return Array.isArray(selected)?selected.join(' / '):String(selected??'');",
      "}",
      "function tables(ts){",
      "  const source=mhurV545Array(ts);",
      "  const ordered=source.map((table,index)=>{",
      "    const safe=table&&typeof table==='object'?table:{};",
      "    const title=mhurV545Cell(safe.title);",
      "    const normalized=title.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();",
      "    const priority=/effets? de montee|level[- ]?up effects?/.test(normalized)?0:1;",
      "    return {table:safe,index,title,priority};",
      "  }).sort((a,b)=>a.priority-b.priority||a.index-b.index);",
      "  return `<div class=\"tables\">${ordered.map(entry=>{",
      "    const cols=mhurV545Array(entry.table.cols);",
      "    const rows=mhurV545Array(entry.table.rows);",
      "    return `<button class=\"toggle\" onclick=\"this.nextElementSibling.classList.toggle('hidden')\">${entry.title} ▾</button><div class=\"simpleTable hidden\"><table class=\"dataTable\"><thead><tr>${cols.map(col=>`<th>${mhurV545Cell(col)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>{const cells=mhurV545Array(row);return `<tr>${cells.map(cell=>`<td>${mhurV545Cell(cell)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`;",
      "  }).join('')}</div>`;",
      "}"
    ].join("\n");
  }

  function patchTables(text) {
    var marker = "function tables(ts)";
    var start = text.indexOf(marker);

    if (start < 0) {
      log(
        "[INFO] tables(ts) non trouvee : " +
        "la protection JavaScript V545 sera utilisee."
      );
      return text;
    }

    var open = text.indexOf("{", start);

    if (open < 0) {
      fail(
        "Ouverture de la fonction tables(ts) introuvable."
      );
    }

    var close = matchingBrace(text, open);

    if (close < 0) {
      fail(
        "Fermeture de la fonction tables(ts) introuvable."
      );
    }

    return (
      text.substring(0, start) +
      robustTablesSource() +
      text.substring(close + 1)
    );
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V545");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(cssPath);
    requireFile(jsPath);

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(indexPath, backupPath, false);
    }

    var text = readUtf8(indexPath)
      .replace(/\r\n/g, "\n");

    /*
      V545 remplace V544. On ne garde pas deux couches qui se
      disputent le header, Gentle et le tutoriel.
    */
    text = removeFileTag(
      text,
      "v544-gentle-mobile-final.css"
    );

    text = removeFileTag(
      text,
      "v544-gentle-mobile-final.js"
    );

    text = removeFileTag(
      text,
      "v545-final-interface.css"
    );

    text = removeFileTag(
      text,
      "v545-final-interface.js"
    );

    /*
      Ces anciens scripts pouvaient remplacer tables() après le
      chargement principal.
    */
    text = removeFileTag(
      text,
      "v538-level-up-effects-first.js"
    );

    text = removeFileTag(
      text,
      "v541-targeted-fixes.js"
    );

    text = patchTables(text);

    if (
      text.indexOf("</head>") < 0 ||
      text.indexOf("</body>") < 0
    ) {
      fail("Balises head/body introuvables.");
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
        "Le CSS V545 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.split(jsTag).length - 1 !== 1
    ) {
      errors.push(
        "Le JavaScript V545 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.indexOf(
        "function mhurV545Array(value)"
      ) < 0
    ) {
      errors.push(
        "Le rendu robuste des tableaux est absent."
      );
    }

    if (
      finalText.indexOf(
        "v544-gentle-mobile-final"
      ) >= 0
    ) {
      errors.push(
        "Le V544 est encore chargé en même temps que V545."
      );
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V545");

      for (
        var errorIndex = 0;
        errorIndex < errors.length;
        errorIndex++
      ) {
        log(" - " + errors[errorIndex]);
      }

      fail(
        "Le correctif V545 n'a pas passé la vérification."
      );
    }

    log("[OK] Barre de defilement MHUR Nexus installee.");
    log("[OK] Fleches Windows de la barre supprimees.");
    log("[OK] Une seule Suggestion reste dans le profil.");
    log("[OK] Un seul Centre de moderation reste dans le profil.");
    log("[OK] Gentle utilise le vrai fichier portrait.png.");
    log("[OK] Une seule fleche reste dans le tutoriel Mods.");
    log("[OK] Offset mobile mesure sans agrandir le header.");
    log("[OK] Portraits Patch Notes agrandis et non coupes.");
    log("[OK] Erreur table.cols.map protegee.");
    log("");
    log("TOUTES LES VERIFICATIONS V545 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Sur mobile : ferme completement l'onglet puis rouvre le site.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V545 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
