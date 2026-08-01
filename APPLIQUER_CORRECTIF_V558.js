// Correctif MHUR France V558 — Windows Script Host (double-cliquer via le .bat)
(function () {
  var fso = new ActiveXObject('Scripting.FileSystemObject');
  var shell = new ActiveXObject('WScript.Shell');
  var root = fso.GetParentFolderName(WScript.ScriptFullName);
  var indexPath = fso.BuildPath(root, 'public\\index.html');
  var cssPath = fso.BuildPath(root, 'public\\css\\v558-requested-fixes.css');
  var jsPath = fso.BuildPath(root, 'public\\js\\v558-requested-fixes.js');
  var backupPath = indexPath + '.avant-v558.bak';
  var cssTag = '<link rel="stylesheet" href="css/v558-requested-fixes.css?v=558">';
  var jsTag = '<script src="js/v558-requested-fixes.js?v=558"></script>';

  function fail(message) {
    WScript.Echo('\nERREUR : ' + message + '\n');
    WScript.Quit(1);
  }

  function readUtf8(path) {
    var stream = new ActiveXObject('ADODB.Stream');
    stream.Type = 2;
    stream.Charset = 'utf-8';
    stream.Open();
    stream.LoadFromFile(path);
    var text = stream.ReadText();
    stream.Close();
    return text;
  }

  function writeUtf8(path, text) {
    var stream = new ActiveXObject('ADODB.Stream');
    stream.Type = 2;
    stream.Charset = 'utf-8';
    stream.Open();
    stream.WriteText(text);
    stream.Position = 0;
    stream.Type = 1;
    stream.Position = 3; // retire le BOM UTF-8
    var binary = stream.Read();
    stream.Close();

    var output = new ActiveXObject('ADODB.Stream');
    output.Type = 1;
    output.Open();
    output.Write(binary);
    output.SaveToFile(path, 2);
    output.Close();
  }

  function count(text, needle) {
    var total = 0;
    var position = 0;
    while ((position = text.indexOf(needle, position)) !== -1) {
      total += 1;
      position += needle.length;
    }
    return total;
  }

  if (!fso.FileExists(indexPath)) fail('public\\index.html est introuvable. Mets ce dossier à la racine du dépôt mhur-france.');
  if (!fso.FileExists(cssPath)) fail('public\\css\\v558-requested-fixes.css est introuvable.');
  if (!fso.FileExists(jsPath)) fail('public\\js\\v558-requested-fixes.js est introuvable.');

  if (!fso.FileExists(backupPath)) fso.CopyFile(indexPath, backupPath, true);

  var html = readUtf8(indexPath);
  html = html.replace(/\s*<link[^>]+href=["'][^"']*v558-requested-fixes\.css[^"']*["'][^>]*>/gi, '');
  html = html.replace(/\s*<script[^>]+src=["'][^"']*v558-requested-fixes\.js[^"']*["'][^>]*><\/script>/gi, '');

  var headClose = html.toLowerCase().lastIndexOf('</head>');
  var bodyClose = html.toLowerCase().lastIndexOf('</body>');
  if (headClose < 0) fail('Balise </head> introuvable dans public\\index.html.');
  if (bodyClose < 0) fail('Balise </body> introuvable dans public\\index.html.');

  html = html.slice(0, headClose) + '  ' + cssTag + '\r\n' + html.slice(headClose);
  bodyClose = html.toLowerCase().lastIndexOf('</body>');
  html = html.slice(0, bodyClose) + '  ' + jsTag + '\r\n' + html.slice(bodyClose);

  if (count(html, 'v558-requested-fixes.css') !== 1) fail('La feuille CSS V558 n’a pas été ajoutée exactement une fois.');
  if (count(html, 'v558-requested-fixes.js') !== 1) fail('Le script V558 n’a pas été ajouté exactement une fois.');

  writeUtf8(indexPath, html);

  WScript.Echo('Correctif V558 appliqué avec succès.');
  WScript.Echo('Sauvegarde créée : public\\index.html.avant-v558.bak');
  WScript.Echo('Étape suivante : ouvre GitHub Desktop, vérifie les 3 fichiers modifiés/ajoutés, puis Commit et Push.');
  shell.Popup('Correctif MHUR V558 appliqué avec succès.\n\nTu peux maintenant Commit puis Push dans GitHub Desktop.', 0, 'MHUR France V558', 64);
})();
