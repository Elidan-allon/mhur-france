(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var backupPath = indexPath + ".avant-v544.bak";

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(backupPath, indexPath, true);
  }

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v544-gentle-mobile-final.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v544-gentle-mobile-final.js"
    )
  ];

  for (var i = 0; i < files.length; i++) {
    if (fso.FileExists(files[i])) {
      fso.DeleteFile(files[i], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Le correctif V544 a ete retire.");
  WScript.Echo("");
})();
