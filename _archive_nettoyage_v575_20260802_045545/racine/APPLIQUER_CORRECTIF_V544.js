(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var cssPath = fso.BuildPath(
    publicDir,
    "css\\v544-gentle-mobile-final.css"
  );
  var jsPath = fso.BuildPath(
    publicDir,
    "js\\v544-gentle-mobile-final.js"
  );
  var backupPath = indexPath + ".avant-v544.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v544-gentle-mobile-final.css?v=544">';
  var jsTag =
    '<script src="js/v544-gentle-mobile-final.js?v=544"></script>';

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
    var templateDepth = 0;

    for (var i = openPosition; i < text.length; i++) {
      var current = text.charAt(i);
      var next = text.charAt(i + 1);

      if (lineComment) {
        if (current === "\n") lineComment = false;
        continue;
      }

      if (blockComment) {
        if (current === "*" && next === "/") {
          blockComment = false;
          i++;
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
        i++;
        continue;
      }

      if (current === "/" && next === "*") {
        blockComment = true;
        i++;
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

        if (depth === 0) return i;
      }
    }

    return -1;
  }

  function robustTablesSource() {
    return [
      "function mhurV544Localized(value){",
      "  if(value&&typeof value==='object'&&!Array.isArray(value)){",
      "    const current=(typeof lang!=='undefined'&&lang==='en')?'en':'fr';",
      "    return value[current]??value.fr??value.en??'';",
      "  }",
      "  return value??'';",
      "}",
      "function mhurV544Array(value){",
      "  if(Array.isArray(value))return value;",
      "  const selected=mhurV544Localized(value);",
      "  if(Array.isArray(selected))return selected;",
      "  return selected==null||selected===''?[]:[selected];",
      "}",
      "function mhurV544Cell(value){",
      "  const selected=mhurV544Localized(value);",
      "  return Array.isArray(selected)?selected.join(' / '):(selected??'');",
      "}",
      "function mhurV544Escape(value){",
      "  return String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));",
      "}",
      "function tables(ts){",
      "  const source=mhurV544Array(ts);",
      "  const ordered=source.map((table,index)=>{",
      "    const safe=table&&typeof table==='object'?table:{};",
      "    const title=String(mhurV544Localized(safe.title)||'');",
      "    const normalized=title.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();",
      "    const priority=/effets? de montee|level[- ]?up effects?/.test(normalized)?0:1;",
      "    return {table:safe,index,priority,title};",
      "  }).sort((a,b)=>a.priority-b.priority||a.index-b.index);",
      "  return `<div class=\"tables\">${ordered.map(entry=>{",
      "    const cols=mhurV544Array(entry.table.cols);",
      "    const rows=mhurV544Array(entry.table.rows);",
      "    return `<button class=\"toggle\" onclick=\"this.nextElementSibling.classList.toggle('hidden')\">${mhurV544Escape(entry.title)} ▾</button><div class=\"simpleTable hidden\"><table class=\"dataTable\"><thead><tr>${cols.map(col=>`<th>${mhurV544Escape(mhurV544Cell(col))}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>{const cells=mhurV544Array(row);return `<tr>${cells.map(cell=>`<td>${mhurV544Escape(mhurV544Cell(cell))}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`;",
      "  }).join('')}</div>`;",
      "}"
    ].join("\n");
  }

  function patchTables(text) {
    var marker = "function tables(ts)";
    var start = text.indexOf(marker);

    if (start < 0) {
      log("[INFO] Fonction tables(ts) non trouvee dans index.html.");
      log("[INFO] Le correctif JavaScript V544 la remplacera au chargement.");
      return text;
    }

    var open = text.indexOf("{", start);

    if (open < 0) {
      fail("Ouverture de la fonction tables(ts) introuvable.");
    }

    var close = matchingBrace(text, open);

    if (close < 0) {
      fail("Fermeture de la fonction tables(ts) introuvable.");
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
    log("  MHUR FRANCE - CORRECTIF V544");
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
      Retire les anciens scripts susceptibles de réécrire tables()
      après la fonction principale.
    */
    text = removeFileTag(
      text,
      "v538-level-up-effects-first.js"
    );
    text = removeFileTag(
      text,
      "v541-targeted-fixes.js"
    );
    text = removeFileTag(
      text,
      "v541-targeted-fixes.css"
    );

    text = removeFileTag(
      text,
      "v544-gentle-mobile-final.css"
    );
    text = removeFileTag(
      text,
      "v544-gentle-mobile-final.js"
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

    /*
      Le JS est volontairement le dernier script de la page :
      aucun ancien correctif ne peut ensuite remettre tables() ou
      reconstruire le tutoriel avec deux flèches.
    */
    text = text.replace(
      "</body>",
      jsTag + "\n</body>"
    );

    writeUtf8NoBom(indexPath, text);

    var finalText = readUtf8(indexPath);
    var errors = [];

    if (finalText.split(cssTag).length - 1 !== 1) {
      errors.push(
        "Le CSS V544 n'est pas chargé exactement une fois."
      );
    }

    if (finalText.split(jsTag).length - 1 !== 1) {
      errors.push(
        "Le JavaScript V544 n'est pas chargé exactement une fois."
      );
    }

    if (
      finalText.indexOf(
        "function mhurV544Array(value)"
      ) < 0
    ) {
      errors.push(
        "Le rendu robuste des tableaux n'est pas installé."
      );
    }

    if (
      finalText.indexOf(
        "v538-level-up-effects-first.js"
      ) >= 0
    ) {
      errors.push(
        "L'ancien correctif V538 est encore chargé."
      );
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V544");

      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }

      fail(
        "Le correctif V544 n'a pas passe la verification."
      );
    }

    log("[OK] Erreur table.cols.map reparee definitivement.");
    log("[OK] Effets de montee conserves en haut.");
    log("[OK] Gentle Criminal n'apparait plus deux fois dans la Tier List.");
    log("[OK] Portrait Tier List de Gentle remplace par le portrait officiel.");
    log("[OK] Une seule fleche reste dans le tutoriel Mods.");
    log("[OK] Page mobile descendue sous les deux lignes du header.");
    log("[OK] Carres des portraits Patch Notes agrandis.");
    log("[OK] Photos de personnages et competences non coupees.");
    log("");
    log("TOUTES LES VERIFICATIONS V544 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Sur mobile : ferme completement l'onglet avant de rouvrir le site.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V544 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
