(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var shell = new ActiveXObject("WScript.Shell");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var paths = {
    index: fso.BuildPath(publicDir, "index.html"),
    homeJs: fso.BuildPath(publicDir, "data\\home_data.js"),
    homeJson: fso.BuildPath(publicDir, "data\\home_data.json"),
    seasonJs: fso.BuildPath(publicDir, "js\\season18-fixes.js"),
    v526Js: fso.BuildPath(publicDir, "js\\v526-ui-final.js"),
    css: fso.BuildPath(publicDir, "css\\v531-gentle-stable.css"),
    newImage: fso.BuildPath(publicDir, "assets\\home\\discounts\\gentle_criminal_v531.png"),
    oldDiscountImage: fso.BuildPath(publicDir, "assets\\home\\discounts\\gentle_criminal.webp"),
    oldSeasonImage: fso.BuildPath(publicDir, "assets\\home\\season18\\gentle_s18_portrait.webp"),
    payloadPng: fso.BuildPath(root, "correctif_v531\\gentle_criminal_v531.png"),
    payloadDiscountWebp: fso.BuildPath(root, "correctif_v531\\gentle_criminal_legacy.webp"),
    payloadSeasonWebp: fso.BuildPath(root, "correctif_v531\\gentle_s18_portrait_legacy.webp")
  };

  var backupSuffix = ".avant-v531.bak";
  var correctDataPath =
    "assets/home/discounts/gentle_criminal_v531.png?v=531";
  var correctRootPath =
    "/assets/home/discounts/gentle_criminal_v531.png?v=531";

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

  function ensureFolder(path) {
    if (fso.FolderExists(path)) return;
    var parent = fso.GetParentFolderName(path);
    if (parent && !fso.FolderExists(parent)) ensureFolder(parent);
    fso.CreateFolder(path);
  }

  function backup(path) {
    if (!fso.FileExists(path)) return;
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

  function replaceOnce(text, regex, replacement, label) {
    var changed = text.replace(regex, replacement);
    if (changed === text) {
      fail("Modification introuvable : " + label);
    }
    return changed;
  }

  function removeOldV525(indexText) {
    return indexText.replace(
      /<!-- MHUR_V525_START -->[\s\S]*?<!-- MHUR_V525_END -->\s*/gi,
      ""
    );
  }

  function patchIndex() {
    var text = readUtf8(paths.index).replace(/\r\n/g, "\n");

    text = removeOldV525(text);

    text = text.replace(
      /<link\b[^>]*href=["'][^"']*v530-gentle-only\.css[^"']*["'][^>]*>\s*/gi,
      ""
    );
    text = text.replace(
      /<script\b[^>]*src=["'][^"']*v530-gentle-only\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi,
      ""
    );
    text = text.replace(
      /<link\b[^>]*href=["'][^"']*v531-gentle-stable\.css[^"']*["'][^>]*>\s*/gi,
      ""
    );

    text = replaceOnce(
      text,
      /<script\b[^>]*src=["']data\/home_data\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i,
      '<script src="data/home_data.js?v=531"></script>',
      "version de home_data.js"
    );

    text = replaceOnce(
      text,
      /<script\b[^>]*src=["']js\/season18-fixes\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i,
      '<script src="js/season18-fixes.js?v=531"></script>',
      "version de season18-fixes.js"
    );

    text = replaceOnce(
      text,
      /<script\b[^>]*src=["']js\/v526-ui-final\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i,
      '<script src="js/v526-ui-final.js?v=531"></script>',
      "version de v526-ui-final.js"
    );

    if (text.indexOf("</head>") < 0) {
      fail("Balise de fermeture head introuvable.");
    }

    text = text.replace(
      "</head>",
      '<link rel="stylesheet" href="css/v531-gentle-stable.css?v=531">\n</head>'
    );

    writeUtf8NoBom(paths.index, text);
  }

  function patchHomeData(path) {
    if (!fso.FileExists(path)) return;

    var text = readUtf8(path).replace(/\r\n/g, "\n");
    var regex =
      /("name"\s*:\s*"Gentle Criminal"[\s\S]{0,700}?"image"\s*:\s*")[^"]*(")/i;

    text = replaceOnce(
      text,
      regex,
      "$1" + correctDataPath + "$2",
      "image Gentle dans " + path
    );

    writeUtf8NoBom(path, text);
  }

  function patchSeason18() {
    var text = readUtf8(paths.seasonJs).replace(/\r\n/g, "\n");

    var portraitStart = text.indexOf(
      "function discountPortraitV35(name,image){"
    );
    var portraitEnd = text.indexOf(
      "function renderDiscountCardV35",
      portraitStart
    );

    if (portraitStart < 0 || portraitEnd < 0) {
      fail("Fonction discountPortraitV35 introuvable.");
    }

    var newPortraitFunction =
      "function discountPortraitV35(name,image){\n" +
      "  const key=NORM(name);\n" +
      "  if(key==='gentle_criminal'){\n" +
      "    const fixed=absAsset('" + correctDataPath + "');\n" +
      "    return {src:fixed,fallback:fixed};\n" +
      "  }\n" +
      "  const styleKey=DISCOUNT_STYLE_KEYS[key]||'';\n" +
      "  const dbPath=styleKey ? window.MHUR_DATABASE_ASSETS?.styles?.[styleKey]?.portrait : '';\n" +
      "  const fallback=DISCOUNT_FALLBACK[key]||image||'';\n" +
      "  return {src:absAsset(dbPath||fallback),fallback:absAsset(fallback)};\n" +
      "}\n";

    text =
      text.substring(0, portraitStart) +
      newPortraitFunction +
      text.substring(portraitEnd);

    var runStart = text.indexOf("function runV35(){");
    var observerLine =
      "obs.observe(document.documentElement,{childList:true,subtree:true});";
    var observerPos = text.indexOf(observerLine, runStart);

    if (runStart < 0 || observerPos < 0) {
      fail("Bloc de lancement Saison 18 V35 introuvable.");
    }

    var closurePos = text.indexOf("})();", observerPos);
    if (closurePos < 0) {
      fail("Fin du bloc Saison 18 V35 introuvable.");
    }

    var stableRun =
      "function runV35(){\n" +
      "  wrapHomeDashboardV35();\n" +
      "  decorateMiniPortraitsV35(document);\n" +
      "}\n" +
      "if(document.readyState==='loading'){\n" +
      "  document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(runV35),{once:true});\n" +
      "}else{\n" +
      "  requestAnimationFrame(runV35);\n" +
      "}\n" +
      "window.addEventListener('mhur:languagechange',()=>requestAnimationFrame(runV35));\n" +
      "})();";

    text =
      text.substring(0, runStart) +
      stableRun +
      text.substring(closurePos + 5);

    writeUtf8NoBom(paths.seasonJs, text);
  }

  function patchV526() {
    var text = readUtf8(paths.v526Js).replace(/\r\n/g, "\n");

    text = replaceOnce(
      text,
      /const GENTLE_IMAGE\s*=\s*[\s\S]*?;/,
      'const GENTLE_IMAGE = "' + correctRootPath + '";',
      "constante GENTLE_IMAGE"
    );

    text = text.replace(
      'const image = card.querySelector(":scope > img");',
      'const image = card.querySelector(":scope > img, .s18DiscountArtV19 > img");'
    );

    var stableStart = text.indexOf("  let scheduled = false;");
    var finalClosure = text.lastIndexOf("})();");

    if (stableStart < 0 || finalClosure < stableStart) {
      fail("Ancien bloc instable V526 introuvable.");
    }

    var stableBottom =
      "  function installStableV531() {\n" +
      "    applyEverything();\n" +
      "    if (typeof window.render === \"function\" && !window.render.__v531Decorated) {\n" +
      "      const originalRender = window.render;\n" +
      "      const wrappedRender = function() {\n" +
      "        const result = originalRender.apply(this, arguments);\n" +
      "        requestAnimationFrame(applyEverything);\n" +
      "        return result;\n" +
      "      };\n" +
      "      wrappedRender.__v531Decorated = true;\n" +
      "      window.render = wrappedRender;\n" +
      "      try { render = wrappedRender; } catch (_) {}\n" +
      "    }\n" +
      "    console.info(\"[MHUR] Correctif stable V531 actif.\");\n" +
      "  }\n" +
      "  if (document.readyState === \"loading\") {\n" +
      "    document.addEventListener(\"DOMContentLoaded\", installStableV531, { once: true });\n" +
      "  } else {\n" +
      "    installStableV531();\n" +
      "  }\n" +
      "  window.addEventListener(\"mhur:languagechange\", () => requestAnimationFrame(applyEverything));\n" +
      "})();";

    text =
      text.substring(0, stableStart) +
      stableBottom +
      text.substring(finalClosure + 5);

    writeUtf8NoBom(paths.v526Js, text);
  }

  function copyImages() {
    requireFile(paths.payloadPng);
    requireFile(paths.payloadDiscountWebp);
    requireFile(paths.payloadSeasonWebp);

    ensureFolder(fso.GetParentFolderName(paths.newImage));
    ensureFolder(fso.GetParentFolderName(paths.oldDiscountImage));
    ensureFolder(fso.GetParentFolderName(paths.oldSeasonImage));

    backup(paths.oldDiscountImage);
    backup(paths.oldSeasonImage);

    fso.CopyFile(paths.payloadPng, paths.newImage, true);
    fso.CopyFile(paths.payloadDiscountWebp, paths.oldDiscountImage, true);
    fso.CopyFile(paths.payloadSeasonWebp, paths.oldSeasonImage, true);
  }

  function validate() {
    var errors = [];
    var indexText = readUtf8(paths.index);
    var seasonText = readUtf8(paths.seasonJs);
    var v526Text = readUtf8(paths.v526Js);
    var homeText = readUtf8(paths.homeJs);

    if (indexText.indexOf("MHUR_V525_START") >= 0) {
      errors.push("Le bloc V525 est encore present.");
    }
    if (indexText.indexOf("v530-gentle-only") >= 0) {
      errors.push("Le correctif V530 est encore charge.");
    }
    if (indexText.indexOf("season18-fixes.js?v=531") < 0) {
      errors.push("season18-fixes.js V531 n'est pas charge.");
    }
    if (indexText.indexOf("v526-ui-final.js?v=531") < 0) {
      errors.push("v526-ui-final.js V531 n'est pas charge.");
    }
    if (indexText.indexOf("v531-gentle-stable.css?v=531") < 0) {
      errors.push("Le CSS V531 n'est pas charge.");
    }
    if (seasonText.indexOf("const obs=new MutationObserver") >= 0) {
      errors.push("L'observateur instable Saison 18 est encore present.");
    }
    if (seasonText.indexOf(correctDataPath) < 0) {
      errors.push("Saison 18 ne pointe pas vers la bonne image.");
    }
    if (v526Text.indexOf("setTimeout(install") >= 0) {
      errors.push("Les installations retardees V526 sont encore presentes.");
    }
    if (v526Text.indexOf("MutationObserver(scheduleApply)") >= 0) {
      errors.push("L'observateur V526 est encore present.");
    }
    if (v526Text.indexOf(correctRootPath) < 0) {
      errors.push("V526 ne pointe pas vers la bonne image.");
    }
    if (homeText.indexOf(correctDataPath) < 0) {
      errors.push("home_data.js ne pointe pas vers la bonne image.");
    }
    if (!fso.FileExists(paths.newImage)) {
      errors.push("La nouvelle image Gentle est absente.");
    }

    if (errors.length) {
      log("");
      log("ECHEC DE LA VERIFICATION V531");
      for (var i = 0; i < errors.length; i++) {
        log(" - " + errors[i]);
      }
      fail("Le correctif n'a pas passe la verification.");
    }
  }

  try {
    log("");
    log("================================================");
    log("  MHUR FRANCE - GENTLE + STABILITE V531");
    log("================================================");
    log("");

    requireFile(paths.index);
    requireFile(paths.homeJs);
    requireFile(paths.seasonJs);
    requireFile(paths.v526Js);
    requireFile(paths.css);

    backup(paths.index);
    backup(paths.homeJs);
    backup(paths.homeJson);
    backup(paths.seasonJs);
    backup(paths.v526Js);

    copyImages();
    patchHomeData(paths.homeJs);
    patchHomeData(paths.homeJson);
    patchSeason18();
    patchV526();
    patchIndex();
    validate();

    log("[OK] Le vrai portrait Gentle est utilise par toutes les sources.");
    log("[OK] Le bloc V525 qui relancait layout/render a ete retire.");
    log("[OK] Les delais et observateurs V526/V530 ont ete retires.");
    log("[OK] La grille Saison 18 ne remplace plus Gentle par l'ancien visuel.");
    log("");
    log("TOUTES LES VERIFICATIONS V531 SONT BONNES");
    log("");
    log("Dans GitHub Desktop : Commit to main, puis Push origin.");
    log("Apres le deploiement : Ctrl + F5.");
    WScript.Quit(0);
  } catch (error) {
    log("");
    log("ERREUR V531 : " + error.message);
    log("");
    WScript.Quit(1);
  }
})();
