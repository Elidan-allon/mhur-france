(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var suffix = ".avant-v532.bak";

  var files = [
    fso.BuildPath(publicDir, "index.html"),
    fso.BuildPath(publicDir, "js\\season18-fixes.js")
  ];

  for (var i = 0; i < files.length; i++) {
    var backup = files[i] + suffix;

    if (fso.FileExists(backup)) {
      fso.CopyFile(backup, files[i], true);
    }
  }

  var added = [
    fso.BuildPath(publicDir, "css\\v532-grid-photo-stable.css"),
    fso.BuildPath(publicDir, "js\\v532-render-stable.js")
  ];

  for (var j = 0; j < added.length; j++) {
    if (fso.FileExists(added[j])) {
      fso.DeleteFile(added[j], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Les sauvegardes V532 ont ete restaurees.");
  WScript.Echo("");
})();
