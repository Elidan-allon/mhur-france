(function () {
  "use strict";

  var fso = new ActiveXObject("Scripting.FileSystemObject");
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var publicDir = fso.BuildPath(root, "public");
  var suffix = ".avant-v536.bak";

  var restore = [
    fso.BuildPath(publicDir, "index.html"),
    fso.BuildPath(publicDir, "js\\home.js")
  ];

  for (var i = 0; i < restore.length; i++) {
    var backup = restore[i] + suffix;

    if (fso.FileExists(backup)) {
      fso.CopyFile(backup, restore[i], true);
    }
  }

  var remove = [
    fso.BuildPath(publicDir, "css\\v520-character-styles.css"),
    fso.BuildPath(publicDir, "js\\v520-character-styles.js")
  ];

  for (var j = 0; j < remove.length; j++) {
    if (fso.FileExists(remove[j])) {
      fso.DeleteFile(remove[j], true);
    }
  }

  WScript.Echo("");
  WScript.Echo("[OK] Le correctif V536 a ete retire.");
  WScript.Echo("");
})();
