// Annulation du correctif MHUR France V558
(function () {
  var fso = new ActiveXObject('Scripting.FileSystemObject');
  var shell = new ActiveXObject('WScript.Shell');
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var indexPath = fso.BuildPath(root, 'public\\index.html');
  var backupPath = indexPath + '.avant-v558.bak';

  if (!fso.FileExists(backupPath)) {
    WScript.Echo('ERREUR : sauvegarde public\\index.html.avant-v558.bak introuvable.');
    WScript.Quit(1);
  }

  fso.CopyFile(backupPath, indexPath, true);
  WScript.Echo('public\\index.html a été restauré.');
  WScript.Echo('Les fichiers V558 peuvent rester : ils ne seront plus chargés.');
  shell.Popup('Le correctif V558 a été retiré de public/index.html.', 0, 'MHUR France V558', 64);
})();
