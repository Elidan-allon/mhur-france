(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var backupPath = indexPath + ".avant-v535.bak";

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(backupPath, indexPath, true);
  }

  var addedFiles = [
    fso.BuildPath(publicDir, "css\\v535-complete-images.css"),
    fso.BuildPath(publicDir, "js\\v535-navigation-only.js")
  ];

  for (var i = 0; i < addedFiles.length; i++) {
    if (fso.FileExists(addedFiles[i])) {
      fso.DeleteFile(addedFiles[i], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Le correctif V535 a ete retire.");
  WScript.Echo("");
})();
