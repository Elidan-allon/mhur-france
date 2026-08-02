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
    indexPath + ".avant-v549.bak";

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v549-mods-single-arrow.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v549-mods-single-arrow.js"
    )
  ];

  if (fso.FileExists(backupPath)) {
    fso.CopyFile(
      backupPath,
      indexPath,
      true
    );
  }

  for (
    var index = 0;
    index < files.length;
    index++
  ) {
    if (fso.FileExists(files[index])) {
      fso.DeleteFile(
        files[index],
        true
      );
    }
  }

  WScript.Echo("");
  WScript.Echo(
    "[OK] Le correctif V549 a ete retire."
  );
  WScript.Echo("");
})();
