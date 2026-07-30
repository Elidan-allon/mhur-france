$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$Backup = Join-Path $Public 'index.html.avant-v520.bak'
$Css = Join-Path $Public 'css\v520-character-styles.css'
$Js = Join-Path $Public 'js\v520-character-styles.js'

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF V520' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $Index)) {
    throw "public\index.html est introuvable. Place le correctif dans le dossier principal du depot."
}

if (-not (Test-Path -LiteralPath $Css)) {
    throw "public\css\v520-character-styles.css est introuvable."
}

if (-not (Test-Path -LiteralPath $Js)) {
    throw "public\js\v520-character-styles.js est introuvable."
}

if (-not (Test-Path -LiteralPath $Backup)) {
    Copy-Item -LiteralPath $Index -Destination $Backup
    Write-Host '[OK] Sauvegarde V520 creee.' -ForegroundColor Green
}
else {
    Write-Host '[OK] La sauvegarde V520 existe deja.' -ForegroundColor Green
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Content = [System.IO.File]::ReadAllText($Index, [System.Text.Encoding]::UTF8)

# Retire le mauvais V519, qu'il ait ete insere correctement ou avec les guillemets casses.
$Content = [regex]::Replace(
    $Content,
    '(?im)^\s*<link\b[^\r\n>]*v519-character-style-fix\.css[^\r\n>]*>\s*\r?\n?',
    ''
)
$Content = [regex]::Replace(
    $Content,
    '(?im)^\s*<script\b[^\r\n>]*v519-character-style-fix\.js[^\r\n>]*>\s*</script>\s*\r?\n?',
    ''
)

# Evite les doublons si V520 est relance.
$Content = [regex]::Replace(
    $Content,
    '(?im)^\s*<link\b[^\r\n>]*v520-character-styles\.css[^\r\n>]*>\s*\r?\n?',
    ''
)
$Content = [regex]::Replace(
    $Content,
    '(?im)^\s*<script\b[^\r\n>]*v520-character-styles\.js[^\r\n>]*>\s*</script>\s*\r?\n?',
    ''
)

if ($Content -notmatch '</head>') {
    throw 'La balise </head> est introuvable. Le fichier index.html ne sera pas modifie.'
}

if ($Content -notmatch '</body>') {
    throw 'La balise </body> est introuvable. Le fichier index.html ne sera pas modifie.'
}

# Ces chaines sont dans un fichier PowerShell separe :
# aucun passage par les guillemets du fichier .bat.
$CssTag = '<link rel="stylesheet" href="css/v520-character-styles.css?v=520">'
$JsTag = '<script src="js/v520-character-styles.js?v=520"></script>'

$Content = $Content.Replace(
    '</head>',
    $CssTag + [Environment]::NewLine + '</head>'
)

$Content = $Content.Replace(
    '</body>',
    $JsTag + [Environment]::NewLine + '</body>'
)

$CssCount = ([regex]::Matches(
    $Content,
    [regex]::Escape($CssTag)
)).Count

$JsCount = ([regex]::Matches(
    $Content,
    [regex]::Escape($JsTag)
)).Count

if ($CssCount -ne 1 -or $JsCount -ne 1) {
    throw "Verification echouee : CSS=$CssCount, JS=$JsCount. index.html ne sera pas ecrit."
}

if ($Content -match 'rel="stylesheet href=') {
    throw 'Une ancienne balise stylesheet mal formee est encore presente. index.html ne sera pas ecrit.'
}

[System.IO.File]::WriteAllText($Index, $Content, $Utf8NoBom)

# Nettoie uniquement les fichiers du mauvais correctif V519.
$ObsoleteFiles = @(
    (Join-Path $Public 'css\v519-character-style-fix.css'),
    (Join-Path $Public 'js\v519-character-style-fix.js'),
    (Join-Path $Root 'APPLIQUER_CORRECTIF_V519.bat'),
    (Join-Path $Root 'A_LIRE_CORRECTIF_V519.txt')
)

foreach ($File in $ObsoleteFiles) {
    if (Test-Path -LiteralPath $File) {
        Remove-Item -LiteralPath $File -Force
    }
}

Write-Host '[OK] Ancien V519 retire sans toucher au header.' -ForegroundColor Green
Write-Host '[OK] Gentle Criminal utilise le portrait Technique.' -ForegroundColor Green
Write-Host '[OK] Petites cartes colorees selon leur propre role.' -ForegroundColor Green
Write-Host '[OK] Role affiche et explication du personnage en blanc.' -ForegroundColor Green
Write-Host ''
Write-Host 'Dans GitHub Desktop : Commit to main, puis Push origin.' -ForegroundColor Yellow
Write-Host 'Ensuite recharge le site avec Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
