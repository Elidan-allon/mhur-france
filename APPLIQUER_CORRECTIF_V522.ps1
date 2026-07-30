$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$Css = Join-Path $Public 'css\v522-final-small-cards.css'
$Js = Join-Path $Public 'js\v522-final-fixes.js'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeDataJson = Join-Path $Public 'data\home_data.json'
$GentlePortrait = Join-Path $Public 'assets\gentle_criminal\gentle_criminal_technical\portrait.png'

$IndexBackup = Join-Path $Public 'index.html.avant-v522.bak'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v522.bak'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v522.bak'

$GentleWebPath = 'assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=522'
$CssTag = '<link rel="stylesheet" href="css/v522-final-small-cards.css?v=522">'
$JsTag = '<script src="js/v522-final-fixes.js?v=522"></script>'

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF V522' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $Index)) {
    throw "public\index.html est introuvable. Place le correctif dans le dossier principal du depot."
}
if (-not (Test-Path -LiteralPath $Css)) {
    throw "public\css\v522-final-small-cards.css est introuvable."
}
if (-not (Test-Path -LiteralPath $Js)) {
    throw "public\js\v522-final-fixes.js est introuvable."
}
if (-not (Test-Path -LiteralPath $HomeDataJs)) {
    throw "public\data\home_data.js est introuvable."
}
if (-not (Test-Path -LiteralPath $GentlePortrait)) {
    throw "Le bon portrait de Gentle est introuvable : public\assets\gentle_criminal\gentle_criminal_technical\portrait.png"
}

if (-not (Test-Path -LiteralPath $IndexBackup)) {
    Copy-Item -LiteralPath $Index -Destination $IndexBackup
}
if (-not (Test-Path -LiteralPath $HomeJsBackup)) {
    Copy-Item -LiteralPath $HomeDataJs -Destination $HomeJsBackup
}
if ((Test-Path -LiteralPath $HomeDataJson) -and -not (Test-Path -LiteralPath $HomeJsonBackup)) {
    Copy-Item -LiteralPath $HomeDataJson -Destination $HomeJsonBackup
}

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# Corrige directement la source de données chargée avant l'accueil.
$DiscountPattern = '("discounts"\s*:\s*\[[\s\S]*?\{\s*"name"\s*:\s*"Gentle Criminal"\s*,\s*"points"\s*:\s*\d+\s*,\s*"image"\s*:\s*")[^"]+(")'
$DiscountRegex = New-Object System.Text.RegularExpressions.Regex($DiscountPattern)

$HomeJsContent = [System.IO.File]::ReadAllText($HomeDataJs, [System.Text.Encoding]::UTF8)
$HomeJsPatched = $DiscountRegex.Replace(
    $HomeJsContent,
    {
        param($Match)
        $Match.Groups[1].Value + $GentleWebPath + $Match.Groups[2].Value
    },
    1
)

if ($HomeJsPatched -eq $HomeJsContent -and $HomeJsContent -notmatch [regex]::Escape($GentleWebPath)) {
    throw "La ligne Gentle Criminal n'a pas ete trouvee dans public\data\home_data.js."
}

[System.IO.File]::WriteAllText($HomeDataJs, $HomeJsPatched, $Utf8NoBom)

if (Test-Path -LiteralPath $HomeDataJson) {
    $HomeJsonContent = [System.IO.File]::ReadAllText($HomeDataJson, [System.Text.Encoding]::UTF8)
    $HomeJsonPatched = $DiscountRegex.Replace(
        $HomeJsonContent,
        {
            param($Match)
            $Match.Groups[1].Value + $GentleWebPath + $Match.Groups[2].Value
        },
        1
    )
    [System.IO.File]::WriteAllText($HomeDataJson, $HomeJsonPatched, $Utf8NoBom)
}

# Relie V522 au site et renouvelle le cache du fichier de données.
$Content = [System.IO.File]::ReadAllText($Index, [System.Text.Encoding]::UTF8)

$Content = [regex]::Replace(
    $Content,
    '(?im)^\s*<link\b[^\r\n>]*v522-final-small-cards\.css(?:\?[^"''>\s]*)?[^\r\n>]*>\s*\r?\n?',
    ''
)
$Content = [regex]::Replace(
    $Content,
    '(?im)^\s*<script\b[^\r\n>]*v522-final-fixes\.js(?:\?[^"''>\s]*)?[^\r\n>]*>\s*</script>\s*\r?\n?',
    ''
)

$Content = [regex]::Replace(
    $Content,
    '(<script\b[^>]*\bsrc=["'']data/home_data\.js)(?:\?[^"'']*)?(["''][^>]*>\s*</script>)',
    '$1?v=522$2',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

if ($Content -notmatch '</head>') {
    throw 'Balise </head> introuvable. Aucun fichier ne sera ecrit.'
}
if ($Content -notmatch '</body>') {
    throw 'Balise </body> introuvable. Aucun fichier ne sera ecrit.'
}

$Content = $Content.Replace('</head>', $CssTag + [Environment]::NewLine + '</head>')
$Content = $Content.Replace('</body>', $JsTag + [Environment]::NewLine + '</body>')

$CssCount = ([regex]::Matches($Content, [regex]::Escape($CssTag))).Count
$JsCount = ([regex]::Matches($Content, [regex]::Escape($JsTag))).Count

if ($CssCount -ne 1 -or $JsCount -ne 1) {
    throw "Verification echouee : CSS=$CssCount, JS=$JsCount. index.html ne sera pas ecrit."
}

[System.IO.File]::WriteAllText($Index, $Content, $Utf8NoBom)

Write-Host '[OK] Les cartes de la liste des personnages sont moins hautes.' -ForegroundColor Green
Write-Host '[OK] Les cartes d alters V521 ne sont pas modifiees.' -ForegroundColor Green
Write-Host '[OK] Le tutoriel des mods ne possede plus qu une seule fleche.' -ForegroundColor Green
Write-Host '[OK] Gentle utilise maintenant le portrait du dossier gentle_criminal_technical.' -ForegroundColor Green
Write-Host '[OK] home_data.js utilise ?v=522 pour eviter l ancienne image en cache.' -ForegroundColor Green
Write-Host ''
Write-Host 'Dans GitHub Desktop : Commit to main, puis Push origin.' -ForegroundColor Yellow
Write-Host 'Apres le deploiement : Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
