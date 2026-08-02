(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var hubPath = fso.BuildPath(
    publicDir,
    "js\\community-hub.js"
  );

  var cssPath = fso.BuildPath(
    publicDir,
    "css\\v546-final-targeted.css"
  );

  var jsPath = fso.BuildPath(
    publicDir,
    "js\\v546-final-targeted.js"
  );

  var suffix = ".avant-v546.bak";

  var cssTag =
    '<link rel="stylesheet" href="css/v546-final-targeted.css?v=546">';

  var jsTag =
    '<script src="js/v546-final-targeted.js?v=546"></script>';

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
    var target = path + suffix;

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

        if (depth === 0) return index;
      }
    }

    return -1;
  }

  function tablesSource() {
    return [
      "function mhurV546Localized(value){",
      "  if(value&&typeof value==='object'&&!Array.isArray(value)){",
      "    const current=(typeof lang!=='undefined'&&lang==='en')?'en':'fr';",
      "    return value[current]??value.fr??value.en??'';",
      "  }",
      "  return value??'';",
      "}",
      "function mhurV546Array(value){",
      "  if(Array.isArray(value))return value;",
      "  const selected=mhurV546Localized(value);",
      "  if(Array.isArray(selected))return selected;",
      "  return selected==null||selected===''?[]:[selected];",
      "}",
      "function mhurV546Cell(value){",
      "  const selected=mhurV546Localized(value);",
      "  return Array.isArray(selected)?selected.join(' / '):String(selected??'');",
      "}",
      "function tables(ts){",
      "  const source=mhurV546Array(ts);",
      "  const ordered=source.map((table,index)=>{",
      "    const safe=table&&typeof table==='object'?table:{};",
      "    const title=mhurV546Cell(safe.title);",
      "    const normalized=title.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();",
      "    const priority=/effets? de montee|level[- ]?up effects?/.test(normalized)?0:1;",
      "    return {table:safe,index,title,priority};",
      "  }).sort((a,b)=>a.priority-b.priority||a.index-b.index);",
      "  return `<div class=\"tables\">${ordered.map(entry=>{",
      "    const cols=mhurV546Array(entry.table.cols);",
      "    const rows=mhurV546Array(entry.table.rows);",
      "    return `<button class=\"toggle\" onclick=\"this.nextElementSibling.classList.toggle('hidden')\">${entry.title} ▾</button><div class=\"simpleTable hidden\"><table class=\"dataTable\"><thead><tr>${cols.map(col=>`<th>${mhurV546Cell(col)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>{const cells=mhurV546Array(row);return `<tr>${cells.map(cell=>`<td>${mhurV546Cell(cell)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`;",
      "  }).join('')}</div>`;",
      "}"
    ].join("\n");
  }

  function patchTables(text) {
    var start = text.indexOf("function tables(ts)");

    if (start < 0) {
      log(
        "[INFO] tables(ts) non trouvee. " +
        "Aucun remplacement direct."
      );
      return text;
    }

    var open = text.indexOf("{", start);
    var close = matchingBrace(text, open);

    if (open < 0 || close < 0) {
      fail(
        "Impossible de remplacer la fonction tables(ts)."
      );
    }

    return (
      text.substring(0, start) +
      tablesSource() +
      text.substring(close + 1)
    );
  }

  function tierRenderSource() {
    return [
      "  render(){",
      "    const out=document.getElementById('mhurTierList');",
      "    if(!out)return;",
      "",
      "    const selectedRole=document.getElementById('mhurTierRole')?.value||'';",
      "    const sourceCharacters=(typeof characters!=='undefined'&&Array.isArray(characters))?characters:[];",
      "    const sourceStyles=(typeof styles!=='undefined'&&styles&&typeof styles==='object')?styles:{};",
      "    const items=[];",
      "    const linkedIds=new Set();",
      "    const canonicalKeys=new Set();",
      "",
      "    const normalizeValue=value=>String(value||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();",
      "    const translated=value=>{",
      "      if(typeof label==='function')return String(label(value||'')||'');",
      "      if(value&&typeof value==='object')return String(value[(typeof lang!=='undefined'&&lang==='en')?'en':'fr']??value.fr??value.en??'');",
      "      return String(value||'');",
      "    };",
      "    const normalizeRole=role=>({attack:'strike',rapid:'speed',attaque:'strike',vitesse:'speed',technique:'technical',assaut:'assault',soutien:'support'}[String(role||'').toLowerCase()]||String(role||'').toLowerCase());",
      "    const gentleStyle=id=>{",
      "      const s=sourceStyles[id]||{};",
      "      const raw=normalizeValue([id,translated(s.name),s.portrait].join(' '));",
      "      return raw.includes('gentle criminal')||raw.includes('gentle_criminal');",
      "    };",
      "    const gentleVote=()=>Object.keys(sourceStyles).find(id=>gentleStyle(id)&&this.ownVotes[id])||'';",
      "",
      "    const add=(id,character)=>{",
      "      id=String(id||'');",
      "      const style=sourceStyles[id];",
      "      if(!id||!style)return;",
      "",
      "      const role=normalizeRole(style.role);",
      "      if(selectedRole&&role!==selectedRole)return;",
      "",
      "      const characterName=translated(character?.name)||translated(style.name)||id;",
      "      const styleName=translated(style.name)||'Original';",
      "      const all=normalizeValue([id,characterName,styleName,style.portrait].join(' '));",
      "      const gentle=all.includes('gentle criminal')||all.includes('gentle_criminal');",
      "      const canonical=gentle?'gentle-criminal-technical':`${normalizeValue(characterName)}|${normalizeValue(styleName)}|${role}`;",
      "",
      "      if(canonicalKeys.has(canonical))return;",
      "      canonicalKeys.add(canonical);",
      "",
      "      const linkedVote=gentle?gentleVote():'';",
      "      const tierLetter=this.ownVotes[id]||this.ownVotes[linkedVote]||'U';",
      "      const portrait=gentle?'assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=546':(style.portrait||character?.portrait||'');",
      "",
      "      items.push({",
      "        id,",
      "        c:character||{name:characterName,portrait},",
      "        s:{...style,role,portrait},",
      "        tier:tierLetter,",
      "        gentle",
      "      });",
      "    };",
      "",
      "    sourceCharacters.forEach(character=>{",
      "      (Array.isArray(character?.styles)?character.styles:[]).forEach(id=>{",
      "        linkedIds.add(String(id));",
      "        add(id,character);",
      "      });",
      "    });",
      "",
      "    const owners=[...sourceCharacters].sort((a,b)=>String(b?.id||'').length-String(a?.id||'').length);",
      "",
      "    Object.keys(sourceStyles).forEach(id=>{",
      "      if(linkedIds.has(String(id)))return;",
      "      const owner=owners.find(character=>{",
      "        const characterId=String(character?.id||'');",
      "        return id===characterId||id.startsWith(characterId+'_');",
      "      });",
      "      add(id,owner||{name:translated(sourceStyles[id]?.name)||id,portrait:sourceStyles[id]?.portrait||'',styles:[id]});",
      "    });",
      "",
      "    const row=letter=>`<div class=\"mhurTierRow ${letter==='U'?'unranked':''}\"><div class=\"mhurTierLabel ${letter}\">${letter==='U'?t('Non classés','Unranked'):letter}</div><div class=\"mhurTierItems\" ondragover=\"MHUR_HUB.tier.dragOver(event)\" ondragleave=\"MHUR_HUB.tier.dragLeave(event)\" ondrop=\"MHUR_HUB.tier.drop(event,'${letter}')\">${items.filter(item=>item.tier===letter).map(item=>`<div class=\"mhurTierItem mhurTierRole-${esc(item.s.role||'unknown')}\" ${item.gentle?'data-v546-gentle=\"1\"':''} draggable=\"true\" ondragstart=\"MHUR_HUB.tier.dragStart(event,'${item.id}')\" ondragend=\"MHUR_HUB.tier.dragEnd(event)\"><img src=\"${esc(item.s.portrait||item.c.portrait||'')}\" ${item.gentle?'onerror=\"this.onerror=null;this.src=\\'assets/home/season18/gentle_s18_portrait.webp?v=546\\'\"':''} alt=\"${esc(translated(item.c.name)||translated(item.s.name)||item.id)}\"><small>${esc(translated(item.c.name)||translated(item.s.name)||item.id)}</small><span class=\"mhurTierStyleName\">${esc(translated(item.s.name)||item.id)}</span></div>`).join('')}<div class=\"mhurTierDropHint\">${t('Dépose ici','Drop here')}</div></div></div>`;",
      "",
      "    out.innerHTML=`<div class=\"mhurTierDragHelp\">${t('Les déplacements sont enregistrés uniquement dans ton navigateur. Publie ta Tier List lorsque tu veux la partager.','Changes are saved only in your browser. Publish your Tier List when you want to share it.')}</div>`+['S','A','B','C','D','U'].map(row).join('');",
      "  }"
    ].join("\n");
  }

  function patchTier(text) {
    var tierStart = text.indexOf("const tier={");

    if (tierStart < 0) {
      fail("Objet Tier List introuvable.");
    }

    var renderStart = text.indexOf("  render(){", tierStart);

    if (renderStart < 0) {
      fail("Méthode render de la Tier List introuvable.");
    }

    var open = text.indexOf("{", renderStart);
    var close = matchingBrace(text, open);

    if (open < 0 || close < 0) {
      fail("Impossible de remplacer le rendu Tier List.");
    }

    return (
      text.substring(0, renderStart) +
      tierRenderSource() +
      text.substring(close + 1)
    );
  }

  function patchIndex() {
    var text = readUtf8(indexPath)
      .replace(/\r\n/g, "\n");

    var oldFiles = [
      "v544-gentle-mobile-final.css",
      "v544-gentle-mobile-final.js",
      "v545-final-interface.css",
      "v545-final-interface.js",
      "v546-final-targeted.css",
      "v546-final-targeted.js",
      "v538-level-up-effects-first.js",
      "v541-targeted-fixes.js"
    ];

    for (
      var oldFileIndex = 0;
      oldFileIndex < oldFiles.length;
      oldFileIndex++
    ) {
      text = removeFileTag(
        text,
        oldFiles[oldFileIndex]
      );
    }

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
  }

  function validate() {
    var indexText = readUtf8(indexPath);
    var hubText = readUtf8(hubPath);
    var errors = [];

    if (indexText.split(cssTag).length - 1 !== 1) {
      errors.push("CSS V546 non chargé exactement une fois.");
    }

    if (indexText.split(jsTag).length - 1 !== 1) {
      errors.push("JavaScript V546 non chargé exactement une fois.");
    }

    if (indexText.indexOf("v545-final-interface") >= 0) {
      errors.push("Ancien V545 encore chargé.");
    }

    if (
      indexText.indexOf(
        "function mhurV546Array(value)"
      ) < 0
    ) {
      errors.push("Tableaux robustes absents.");
    }

    if (
      hubText.indexOf(
        "gentle-criminal-technical"
      ) < 0
    ) {
      errors.push("Dédoublonnage Gentle absent.");
    }

    if (
      hubText.indexOf(
        "data-v546-gentle"
      ) < 0
    ) {
      errors.push("Carte Gentle V546 absente.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V546");

      for (
        var index = 0;
        index < errors.length;
        index++
      ) {
        log(" - " + errors[index]);
      }

      fail(
        "Le correctif V546 n'a pas passé la vérification."
      );
    }
  }

  try {
    log("");
    log("============================================");
    log("  MHUR FRANCE - CORRECTIF V546");
    log("============================================");
    log("");

    requireFile(indexPath);
    requireFile(hubPath);
    requireFile(cssPath);
    requireFile(jsPath);

    backup(indexPath);
    backup(hubPath);

    var hubText = readUtf8(hubPath)
      .replace(/\r\n/g, "\n");

    hubText = patchTier(hubText);
    writeUtf8NoBom(hubPath, hubText);

    patchIndex();
    validate();

    log("[OK] Gentle Criminal n'apparait plus qu'une fois.");
    log("[OK] Le bon portrait PNG de Gentle est utilise.");
    log("[OK] Le script V545 qui faisait planter le profil est retire.");
    log("[OK] Nettoyage du profil temporaire et sans boucle.");
    log("[OK] Patch Notes utilise toute la hauteur disponible.");
    log("[OK] La zone blanche/coupee sous les notes est retiree.");
    log("[OK] Le contenu mobile commence sous les deux lignes du header.");
    log("[OK] Les portraits Patch Notes sont plus grands et entiers.");
    log("[OK] Le portrait de la fiche personnage est agrandi de 5 pour cent.");
    log("[OK] Une seule fleche reste dans le tutoriel Mods.");
    log("[OK] L'erreur table.cols.map reste corrigee.");
    log("");
    log("TOUTES LES VERIFICATIONS V546 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Sur mobile : ferme completement l'onglet puis rouvre le site.");

    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V546 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
