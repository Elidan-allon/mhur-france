(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var suffix = ".avant-v531.bak";

  var files = [
    fso.BuildPath(publicDir, "index.html"),
    fso.BuildPath(publicDir, "data\\home_data.js"),
    fso.BuildPath(publicDir, "data\\home_data.json"),
    fso.BuildPath(publicDir, "js\\season18-fixes.js"),
    fso.BuildPath(publicDir, "js\\v526-ui-final.js"),
    fso.BuildPath(publicDir, "assets\\home\\discounts\\gentle_criminal.webp"),
    fso.BuildPath(publicDir, "assets\\home\\season18\\gentle_s18_portrait.webp")
  ];

  for (var i = 0; i < files.length; i++) {
    var backup = files[i] + suffix;
    if (fso.FileExists(backup)) {
      fso.CopyFile(backup, files[i], true);
    }
  }

  var added = [
    fso.BuildPath(publicDir, "css\\v531-gentle-stable.css"),
    fso.BuildPath(publicDir, "assets\\home\\discounts\\gentle_criminal_v531.png")
  ];

  for (var j = 0; j < added.length; j++) {
    if (fso.FileExists(added[j])) {
      fso.DeleteFile(added[j], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Les sauvegardes V531 ont ete restaurees.");
  WScript.Echo("");
})();
