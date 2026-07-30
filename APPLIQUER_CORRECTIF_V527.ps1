$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$Css = Join-Path $Public 'css\v527-compact-costume-tuning-detail.css'
$Backup = Join-Path $Public 'index.html.avant-v527.bak'

$CssTag = '<link rel="stylesheet" href="css/v527-compact-costume-tuning-detail.css?v=527">'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF V527' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $Index)) {
    throw 'public\index.html est introuvable.'
}

if (-not (Test-Path -LiteralPath $Css)) {
    throw 'public\css\v527-compact-costume-tuning-detail.css est introuvable.'
}

if (-not (Test-Path -LiteralPath $Backup)) {
    Copy-Item -LiteralPath $Index -Destination $Backup
    Write-Host '[OK] Sauvegarde de index.html créée.' -ForegroundColor Green
}

$Content = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

# Retire une ancienne installation V527 pour rendre le programme relançable.
$Content = [regex]::Replace(
    $Content,
    '(?im)^[^\S\r\n]*<link\b[^\r\n>]*v527-compact-costume-tuning-detail\.css[^\r\n>]*>[^\S\r\n]*(?:\r?\n)?',
    ''
)

if ($Content -notmatch '</head>') {
    throw 'Balise </head> introuvable.'
}

$Content = $Content.Replace(
    '</head>',
    $CssTag + [Environment]::NewLine + '</head>'
)

$Count = ([regex]::Matches(
    $Content,
    [regex]::Escape($CssTag)
)).Count

if ($Count -ne 1) {
    throw "Le lien V527 apparaît $Count fois au lieu d'une."
}

[System.IO.File]::WriteAllText(
    $Index,
    $Content,
    $Utf8NoBom
)

Write-Host '[OK] Cartes Costumes et T.U.N.I.N.G réduites à 230 x 550 px.' -ForegroundColor Green
Write-Host '[OK] Portrait de la fiche personnage réduit à 220 x 300 px.' -ForegroundColor Green
Write-Host '[OK] Les cartes d alters et les autres rubriques ne sont pas modifiées.' -ForegroundColor Green
Write-Host ''
Write-Host 'GitHub Desktop : Commit to main puis Push origin.' -ForegroundColor Yellow
Write-Host 'Après le déploiement : Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
