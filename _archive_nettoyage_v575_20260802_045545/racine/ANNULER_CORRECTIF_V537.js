(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var suffix = ".avant-v537.bak";

  var restore = [
    fso.BuildPath(publicDir, "index.html"),
    fso.BuildPath(publicDir, "js\\home.js"),
    fso.BuildPath(publicDir, "js\\season18-fixes.js"),
    fso.BuildPath(publicDir, "js\\season18-v12.js"),
    fso.BuildPath(publicDir, "js\\community-mods.js")
  ];

  for (var i = 0; i < restore.length; i++) {
    var backup = restore[i] + suffix;

    if (fso.FileExists(backup)) {
      fso.CopyFile(backup, restore[i], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Les sauvegardes V537 ont ete restaurees.");
  WScript.Echo("");
})();
