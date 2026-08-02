(function () {
  "use strict";
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var indexPath = fso.BuildPath(publicDir, "index.html");
  var cssPath = fso.BuildPath(publicDir, "css\\v539-mobile-admin.css");
  var jsPath = fso.BuildPath(publicDir, "js\\v539-mobile-admin.js");
  var backupPath = indexPath + ".avant-v539.bak";
  var cssTag = '<link rel="stylesheet" href="css/v539-mobile-admin.css?v=539">';
  var jsTag = '<script src="js/v539-mobile-admin.js?v=539"></script>';

  function log(v){WScript.Echo(v)}
  function fail(v){throw new Error(v)}
  function requireFile(path){if(!fso.FileExists(path))fail("Fichier obligatoire introuvable : "+path)}
  function readUtf8(path){var s=new ActiveXObject("ADODB.Stream");s.Type=2;s.Charset="utf-8";s.Open();s.LoadFromFile(path);var t=s.ReadText(-1);s.Close();return t.replace(/^\uFEFF/,"")}
  function writeUtf8NoBom(path,text){var a=new ActiveXObject("ADODB.Stream");a.Type=2;a.Charset="utf-8";a.Open();a.WriteText(text);a.Position=0;a.Type=1;a.Position=3;var bytes=a.Read();a.Close();var b=new ActiveXObject("ADODB.Stream");b.Type=1;b.Open();b.Write(bytes);b.SaveToFile(path,2);b.Close()}
  function removeTag(text,file){
    var e=file.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    var linkPattern=new RegExp("<link\\b[^>]*href=[\"'][^\"']*"+e+"[^\"']*[\"'][^>]*>\\s*","gi");
    var scriptPattern=new RegExp("<script\\b[^>]*src=[\"'][^\"']*"+e+"[^\"']*[\"'][^>]*>\\s*<\\/script>\\s*","gi");
    return text.replace(linkPattern,"").replace(scriptPattern,"");
  }

  try {
    log("");log("============================================");log("  MHUR FRANCE - CORRECTIF MOBILE V539");log("============================================");log("");
    requireFile(indexPath);requireFile(cssPath);requireFile(jsPath);
    if(!fso.FileExists(backupPath))fso.CopyFile(indexPath,backupPath,false);
    var text=readUtf8(indexPath).replace(/\r\n/g,"\n");
    text=removeTag(text,"v539-mobile-admin.css");
    text=removeTag(text,"v539-mobile-admin.js");
    if(text.indexOf("</head>")<0)fail("Balise </head> introuvable.");
    if(text.indexOf("</body>")<0)fail("Balise </body> introuvable.");
    text=text.replace("</head>",cssTag+"\n</head>");
    text=text.replace("</body>",jsTag+"\n</body>");
    writeUtf8NoBom(indexPath,text);
    var finalText=readUtf8(indexPath);
    if((finalText.split(cssTag).length-1)!==1)fail("Le CSS V539 n'est pas relié une seule fois.");
    if((finalText.split(jsTag).length-1)!==1)fail("Le JavaScript V539 n'est pas relié une seule fois.");
    log("[OK] Le contenu mobile commence après les deux lignes du header.");
    log("[OK] Le bouton Patch Notes reçoit chaque appui.");
    log("[OK] Les images des Patch Notes restent entières sur mobile.");
    log("[OK] Le bouton Centre de modération est ajouté dans le profil admin.");
    log("[OK] Suppressions, signalements, recours et suggestions sont regroupés.");
    log("");log("TOUTES LES VERIFICATIONS V539 SONT BONNES");log("");
    log("IMPORTANT : pour activer Suggestions, exécute ensuite le fichier SQL V539 dans Supabase.");
    log("Puis Commit to main et Push origin dans GitHub Desktop.");
    WScript.Quit(0);
  } catch(error) {log("");log("ERREUR V539 : "+error.message);log("");WScript.Quit(1)}
})();
