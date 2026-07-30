$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$Backup = Join-Path $Public 'index.html.avant-v521.bak'
$Css = Join-Path $Public 'css\v521-targeted-ui-fixes.css'
$Js = Join-Path $Public 'js\v521-targeted-ui-fixes.js'

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF V521' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $Index)) {
    throw "public\index.html est introuvable. Place le correctif dans le dossier principal du depot."
}
if (-not (Test-Path -LiteralPath $Css)) {
    throw "public\css\v521-targeted-ui-fixes.css est introuvable."
}
if (-not (Test-Path -LiteralPath $Js)) {
    throw "public\js\v521-targeted-ui-fixes.js est introuvable."
}

if (-not (Test-Path -LiteralPath $Backup)) {
    Copy-Item -LiteralPath $Index -Destination $Backup
    Write-Host '[OK] Sauvegarde index.html.avant-v521.bak creee.' -ForegroundColor Green
} else {
    Write-Host '[OK] La sauvegarde V521 existe deja.' -ForegroundColor Green
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Content = [System.IO.File]::ReadAllText($Index, [System.Text.Encoding]::UTF8)

# Retire proprement tous les anciens correctifs V519, V520 et une ancienne installation V521.
$CssPatterns = @(
    'v519-character-style-fix\.css(?:\?[^"''>\s]*)?',
    'v520-character-styles\.css(?:\?[^"''>\s]*)?',
    'v521-targeted-ui-fixes\.css(?:\?[^"''>\s]*)?'
)
$JsPatterns = @(
    'v519-character-style-fix\.js(?:\?[^"''>\s]*)?',
    'v520-character-styles\.js(?:\?[^"''>\s]*)?',
    'v521-targeted-ui-fixes\.js(?:\?[^"''>\s]*)?'
)

foreach ($Pattern in $CssPatterns) {
    $Content = [regex]::Replace(
        $Content,
        '(?im)^\s*<link\b[^\r\n>]*' + $Pattern + '[^\r\n>]*>\s*\r?\n?',
        ''
    )
}
foreach ($Pattern in $JsPatterns) {
    $Content = [regex]::Replace(
        $Content,
        '(?im)^\s*<script\b[^\r\n>]*' + $Pattern + '[^\r\n>]*>\s*</script>\s*\r?\n?',
        ''
    )
}

if ($Content -notmatch '</head>') { throw 'Balise </head> introuvable. Aucun fichier ne sera ecrit.' }
if ($Content -notmatch '</body>') { throw 'Balise </body> introuvable. Aucun fichier ne sera ecrit.' }

$CssTag = '<link rel="stylesheet" href="css/v521-targeted-ui-fixes.css?v=521">'
$JsTag = '<script src="js/v521-targeted-ui-fixes.js?v=521"></script>'

$Content = $Content.Replace('</head>', $CssTag + [Environment]::NewLine + '</head>')
$Content = $Content.Replace('</body>', $JsTag + [Environment]::NewLine + '</body>')

$CssCount = ([regex]::Matches($Content, [regex]::Escape($CssTag))).Count
$JsCount = ([regex]::Matches($Content, [regex]::Escape($JsTag))).Count
if ($CssCount -ne 1 -or $JsCount -ne 1) {
    throw "Verification echouee : CSS=$CssCount, JS=$JsCount. index.html ne sera pas ecrit."
}

[System.IO.File]::WriteAllText($Index, $Content, $Utf8NoBom)

# Supprime les fichiers des deux mauvais correctifs precedents.
$ObsoleteFiles = @(
    (Join-Path $Public 'css\v519-character-style-fix.css'),
    (Join-Path $Public 'js\v519-character-style-fix.js'),
    (Join-Path $Public 'css\v520-character-styles.css'),
    (Join-Path $Public 'js\v520-character-styles.js'),
    (Join-Path $Root 'APPLIQUER_CORRECTIF_V519.bat'),
    (Join-Path $Root 'A_LIRE_CORRECTIF_V519.txt'),
    (Join-Path $Root 'APPLIQUER_CORRECTIF_V520.bat'),
    (Join-Path $Root 'APPLIQUER_CORRECTIF_V520.ps1'),
    (Join-Path $Root 'ANNULER_CORRECTIF_V520.bat'),
    (Join-Path $Root 'ANNULER_CORRECTIF_V520.ps1'),
    (Join-Path $Root 'A_LIRE_CORRECTIF_V520.txt')
)
foreach ($File in $ObsoleteFiles) {
    if (Test-Path -LiteralPath $File) { Remove-Item -LiteralPath $File -Force }
}

Write-Host '[OK] V519 et V520 retires.' -ForegroundColor Green
Write-Host '[OK] Gentle utilise assets/gentle_criminal/gentle_criminal_technical/portrait.png.' -ForegroundColor Green
Write-Host '[OK] Logos des roles ajoutes aux reductions.' -ForegroundColor Green
Write-Host '[OK] Cartes de styles remises en portrait, seulement moins hautes.' -ForegroundColor Green
Write-Host '[OK] Fiche personnage raccourcie.' -ForegroundColor Green
Write-Host '[OK] Onglets des builds colores selon leur role.' -ForegroundColor Green
Write-Host '[OK] Tutoriel des mods rendu clairement cliquable.' -ForegroundColor Green
Write-Host ''
Write-Host 'Dans GitHub Desktop : Commit to main, puis Push origin.' -ForegroundColor Yellow
Write-Host 'Apres le deploiement, recharge avec Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
