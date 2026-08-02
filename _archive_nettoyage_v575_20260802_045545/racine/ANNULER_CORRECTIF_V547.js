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
    indexPath + ".avant-v547.bak";

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
      "css\\v547-mobile-profile-roles.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v547-mobile-profile-roles.js"
    )
  ];

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
    "[OK] Le correctif V547 a ete retire."
  );
  WScript.Echo("");
})();
