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
    indexPath + ".avant-v554.bak";

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v554-new-released-pulse.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v554-new-released-pulse.js"
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
    "[OK] Le correctif V554 a ete retire."
  );
  WScript.Echo("");
})();
