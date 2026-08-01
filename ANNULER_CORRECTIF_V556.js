(function () {
  "use strict";

  var fso =
    new ActiveXObject(
      "Scripting.FileSystemObject"
    );

  var root =
    fso.GetParentFolderName(
      WScript.ScriptFullName
    );

  var publicDir =
    fso.BuildPath(
      root,
      "public"
    );

  var indexPath =
    fso.BuildPath(
      publicDir,
      "index.html"
    );

  var backupPath =
    indexPath + ".avant-v556.bak";

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v556-global-new-repair.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v556-global-new-repair.js"
    )
  ];

  if (
    fso.FileExists(backupPath)
  ) {
    fso.CopyFile(
      backupPath,
      indexPath,
      true
    );
  }

  var index;

  for (
    index = 0;
    index < files.length;
    index++
  ) {
    if (
      fso.FileExists(files[index])
    ) {
      fso.DeleteFile(
        files[index],
        true
      );
    }
  }

  WScript.Echo("");
  WScript.Echo(
    "[OK] Le correctif V556 a ete retire."
  );
  WScript.Echo("");
})();
