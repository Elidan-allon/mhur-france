(function () {
  "use strict";

  var fso =
    new ActiveXObject("Scripting.FileSystemObject");

  var root =
    fso.GetParentFolderName(WScript.ScriptFullName);

  var publicDir =
    fso.BuildPath(root, "public");

  var suffix = ".avant-v546.bak";

  var files = [
    fso.BuildPath(publicDir, "index.html"),
    fso.BuildPath(
      publicDir,
      "js\\community-hub.js"
    )
  ];

  for (
    var index = 0;
    index < files.length;
    index++
  ) {
    var backup = files[index] + suffix;

    if (fso.FileExists(backup)) {
      fso.CopyFile(
        backup,
        files[index],
        true
      );
    }
  }

  var added = [
    fso.BuildPath(
      publicDir,
      "css\\v546-final-targeted.css"
    ),
    fso.BuildPath(
      publicDir,
      "js\\v546-final-targeted.js"
    )
  ];

  for (
    var addedIndex = 0;
    addedIndex < added.length;
    addedIndex++
  ) {
    if (fso.FileExists(added[addedIndex])) {
      fso.DeleteFile(
        added[addedIndex],
        true
      );
    }
  }

  WScript.Echo("");
  WScript.Echo(
    "[OK] Le correctif V546 a ete retire."
  );
  WScript.Echo("");
})();
