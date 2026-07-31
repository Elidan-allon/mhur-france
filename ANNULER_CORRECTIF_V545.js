(function () {
  "use strict";

  var fso =
    new ActiveXObject("Scripting.FileSystemObject");

  var root =
    fso.GetParentFolderName(WScript.ScriptFullName);

  var publicDir =
    fso.BuildPath(root, "public");

  var indexPath =
    fso.BuildPath(publicDir, "index.html");

  var backupPath =
    indexPath + ".avant-v545.bak";

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(
      backupPath,
      indexPath,
      true
    );
  }

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v545-final-interface.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v545-final-interface.js"
    )
  ];

  for (
    var index = 0;
    index < files.length;
    index++
  ) {
    if (fso.FileExists(files[index])) {
      fso.DeleteFile(files[index], true);
    }
  }

  WScript.Echo("");
  WScript.Echo(
    "[OK] Le correctif V545 a ete retire."
  );
  WScript.Echo("");
})();
