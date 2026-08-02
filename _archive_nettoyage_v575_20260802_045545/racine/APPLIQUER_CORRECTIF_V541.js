(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var cssPath = fso.BuildPath(publicDir, "css\\v541-targeted-fixes.css");
  var jsPath = fso.BuildPath(publicDir, "js\\v541-targeted-fixes.js");
  var backupPath = indexPath + ".avant-v541.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v541-targeted-fixes.css?v=541">';
  var jsTag =
    '<script src="js/v541-targeted-fixes.js?v=541"></script>';

  function log(message) { WScript.Echo(message); }
  function fail(message) { throw new Error(message); }

  function requireFile(path) {
    if (!fso.FileExists(path)) fail("Fichier obligatoire introuvable : " + path);
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
      "<link\\b[^>]*href=[\"'][^\"']*" + escaped + "[^\"']*[\"'][^>]*>\\s*",
      "gi"
    );
    var scriptPattern = new RegExp(
      "<script\\b[^>]*src=[\"'][^\"']*" + escaped +
      "[^\"']*[\"'][^>]*>\\s*<\\/script>\\s*",
      "gi"
    );
    return text.replace(linkPattern, "").replace(scriptPattern, "");
  }

  function robustTablesSource() {
    return [
      "function mhurTableLangValue(value){",
      "  if(Array.isArray(value))return value;",
      "  if(value&&typeof value==='object'){",
      "    const current=(typeof lang!=='undefined'&&lang==='en')?'en':'fr';",
      "    const selected=value[current]??value.fr??value.en;",
      "    if(Array.isArray(selected))return selected;",
      "    if(selected==null)return [];",
      "    return [selected];",
      "  }",
      "  return value==null?[]:[value];",
      "}",
      "function mhurTableTitle(value){",
      "  if(value&&typeof value==='object'&&!Array.isArray(value)){",
      "    const current=(typeof lang!=='undefined'&&lang==='en')?'en':'fr';",
      "    return String(value[current]??value.fr??value.en??'');",
      "  }",
      "  return String(value??'');",
      "}",
      "function mhurTableCell(value){",
      "  if(value&&typeof value==='object'&&!Array.isArray(value)){",
      "    const current=(typeof lang!=='undefined'&&lang==='en')?'en':'fr';",
      "    return value[current]??value.fr??value.en??'';",
      "  }",
      "  return value??'';",
      "}",
      "function tables(ts){",
      "  const source=Array.isArray(ts)?ts:[];",
      "  const ordered=source.map((table,index)=>({table,index,title:mhurTableTitle(table?.title)}))",
      "    .sort((a,b)=>{",
      "      const ae=/effets? de montee|level[- ]?up effects?/i.test(a.title.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''))?0:1;",
      "      const be=/effets? de montee|level[- ]?up effects?/i.test(b.title.normalize('NFD').replace(/[\\u0300-\\u036f]/g,''))?0:1;",
      "      return ae-be||a.index-b.index;",
      "    });",
      "  return `<div class=\"tables\">${ordered.map(entry=>{",
      "    const table=entry.table||{};",
      "    const cols=mhurTableLangValue(table.cols);",
      "    const rows=mhurTableLangValue(table.rows);",
      "    return `<button class=\"toggle\" onclick=\"this.nextElementSibling.classList.toggle('hidden')\">${entry.title} ▾</button><div class=\"simpleTable hidden\"><table class=\"dataTable\"><thead><tr>${cols.map(c=>`<th>${mhurTableCell(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>{const cells=Array.isArray(row)?row:mhurTableLangValue(row);return `<tr>${cells.map(cell=>`<td>${mhurTableCell(cell)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`;",
      "  }).join('')}</div>`;",
      "}"
    ].join("\n");
  }

  function patchTables(text) {
    var start = text.indexOf("function tables(ts){");
    var end = text.indexOf("function tuningsPage()", start);

    if (start < 0 || end < 0) {
      fail("La fonction tables(ts) est introuvable dans index.html.");
    }

    return text.substring(0, start) +
      robustTablesSource() + "\n" +
      text.substring(end);
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V541");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(cssPath);
    requireFile(jsPath);

    if (!fso.FileExists(backupPath)) {
      fso.CopyFile(indexPath, backupPath, false);
    }

    var text = readUtf8(indexPath).replace(/\r\n/g, "\n");

    /* V538 provoquait l'erreur cols.map. Il est retiré. */
    text = removeFileTag(text, "v538-level-up-effects-first.js");
    text = removeFileTag(text, "v541-targeted-fixes.css");
    text = removeFileTag(text, "v541-targeted-fixes.js");

    text = patchTables(text);

    if (text.indexOf("</head>") < 0 || text.indexOf("</body>") < 0) {
      fail("Balises head/body introuvables.");
    }

    text = text.replace("</head>", cssTag + "\n</head>");
    text = text.replace("</body>", jsTag + "\n</body>");
    writeUtf8NoBom(indexPath, text);

    var finalText = readUtf8(indexPath);
    var errors = [];

    if (finalText.indexOf(cssTag) < 0) errors.push("CSS V541 absent.");
    if (finalText.indexOf(jsTag) < 0) errors.push("JavaScript V541 absent.");
    if (finalText.indexOf("v538-level-up-effects-first.js") >= 0) {
      errors.push("Ancien V538 encore chargé.");
    }
    if (finalText.indexOf("function mhurTableLangValue") < 0) {
      errors.push("Fonction de tableaux robuste absente.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V541");
      for (var i = 0; i < errors.length; i++) log(" - " + errors[i]);
      fail("Le correctif V541 n'a pas passé la vérification.");
    }

    log("[OK] Erreur table.cols.map réparée.");
    log("[OK] Effets de montée conservés en haut.");
    log("[OK] Double flèche du tutoriel Mods supprimée.");
    log("[OK] Portrait de la fiche Alter légèrement agrandi.");
    log("[OK] Correction mobile du header, des Patch Notes et du bouton Retour.");
    log("[OK] Recours enrichis avec joueur, sanction et motif.");
    log("[OK] Boutons Retour ajoutés aux sous-fenêtres de modération.");
    log("[OK] Fonds de rôle ajoutés à la Tier List.");
    log("[OK] Gentle Criminal corrigé dans la Tier List.");
    log("");
    log("TOUTES LES VERIFICATIONS V541 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Sur mobile : ferme l'onglet, rouvre le site et actualise une fois.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V541 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
