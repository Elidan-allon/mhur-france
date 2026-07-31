(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var backupPath = indexPath + ".avant-v543.bak";

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(backupPath, indexPath, true);
  }

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v543-moderation-evidence.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v543-moderation-evidence.js"
    )
  ];

  for (var i = 0; i < files.length; i++) {
    if (fso.FileExists(files[i])) {
      fso.DeleteFile(files[i], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Le correctif V543 a ete retire du site.");
  WScript.Echo("[INFO] Le SQL Supabase n'a pas ete annule automatiquement.");
  WScript.Echo("");
})();
