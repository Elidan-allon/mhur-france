(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var backupPath = indexPath + ".avant-v534.bak";

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(backupPath, indexPath, true);
  }

  var addedFiles = [
    fso.BuildPath(publicDir, "css\\v534-all-styles.css"),
    fso.BuildPath(publicDir, "js\\v534-all-styles.js")
  ];

  for (var i = 0; i < addedFiles.length; i++) {
    if (fso.FileExists(addedFiles[i])) {
      fso.DeleteFile(addedFiles[i], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Le correctif V534 a ete retire.");
  WScript.Echo("");
})();
