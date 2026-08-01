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

  var seasonJsPath =
    fso.BuildPath(
      publicDir,
      "js\\season18-fixes.js"
    );

  var indexBackup =
    indexPath + ".avant-v551.bak";

  var seasonBackup =
    seasonJsPath + ".avant-v551.bak";

  var files = [
    fso.BuildPath(
      publicDir,
      "css\\v551-bars-notes-persistent.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v551-bars-notes-persistent.js"
    )
  ];

  if (fso.FileExists(indexBackup)) {
    fso.CopyFile(
      indexBackup,
      indexPath,
      true
    );
  }

  if (fso.FileExists(seasonBackup)) {
    fso.CopyFile(
      seasonBackup,
      seasonJsPath,
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
    "[OK] Le correctif V551 a ete retire."
  );
  WScript.Echo("");
})();
