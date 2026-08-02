(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var suffix = ".avant-v540.bak";

  var files = [
    fso.BuildPath(publicDir, "index.html"),
    fso.BuildPath(publicDir, "js\\home.js"),
    fso.BuildPath(publicDir, "js\\community-mods.js")
  ];

  for (var i = 0; i < files.length; i++) {
    var backup = files[i] + suffix;

    if (fso.FileExists(backup)) {
      fso.CopyFile(backup, files[i], true);
    }
  }

  var added = [
    fso.BuildPath(publicDir, "css\\v540-final-ui.css"),
    fso.BuildPath(publicDir, "js\\v540-final-stability.js")
  ];

  for (var j = 0; j < added.length; j++) {
    if (fso.FileExists(added[j])) {
      fso.DeleteFile(added[j], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Le correctif V540 a ete retire.");
  WScript.Echo("");
})();
