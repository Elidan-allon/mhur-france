(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");

  var indexPath = fso.BuildPath(publicDir, "index.html");
  var backupPath = indexPath + ".avant-v538.bak";
  var patchPath = fso.BuildPath(
    publicDir,
    "js\\v538-level-up-effects-first.js"
  );

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(backupPath, indexPath, true);
  }

  if (fso.FileExists(patchPath)) {
    fso.DeleteFile(patchPath, true);
  }

  WScript.Echo("");
  WScript.Echo("[OK] Le correctif V538 a ete retire.");
  WScript.Echo("");
})();
