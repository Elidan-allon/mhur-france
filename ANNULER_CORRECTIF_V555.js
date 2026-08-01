(function () {
  "use strict";

  var fso =
    new ActiveXObject("Scripting.FileSystemObject");

  var root =
    fso.GetParentFolderName(WScript.ScriptFullName);

  var publicDir =
    fso.BuildPath(root, "public");

  var indexPath =
    fso.BuildPath(
      publicDir,
      "index.html"
    );

  var backupPath =
    indexPath + ".avant-v555.bak";

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v555-gentle-new-badges.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v555-gentle-new-badges.js"
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
    "[OK] Le correctif V555 a ete retire."
  );
  WScript.Echo("");
})();
