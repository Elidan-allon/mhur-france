(function () {
  "use strict";
  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var indexPath = fso.BuildPath(publicDir, "index.html");
  var backupPath = indexPath + ".avant-v548.bak";
  var cssPath = fso.BuildPath(publicDir, "css\\v548-mobile-season-offset.css");

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(backupPath, indexPath, true);
  }

  if (fso.FileExists(cssPath)) {
    fso.DeleteFile(cssPath, true);
  }

  WScript.Echo("");
  WScript.Echo("[OK] L'ajustement V548 a ete retire.");
  WScript.Echo("");
})();
