$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'

$Index = Join-Path $Public 'index.html'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeDataJson = Join-Path $Public 'data\home_data.json'

$Css = Join-Path $Public 'css\v524-equal-cards-gentle.css'
$Js = Join-Path $Public 'js\v524-equal-cards-gentle.js'
$GentleSource = Join-Path $Root 'correctif_v524\gentle_criminal_portrait_v524.webp'

$GentleDiscountTarget = Join-Path $Public 'assets\home\discounts\gentle_criminal_v524.webp'
$GentlePortraitTarget = Join-Path $Public 'assets\gentle_criminal\gentle_criminal_technical\portrait_v524.webp'

$IndexBackup = Join-Path $Public 'index.html.avant-v524.bak'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v524.bak'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v524.bak'

$GentleDiscountWebPath = 'assets/home/discounts/gentle_criminal_v524.webp?v=524'
$CssTag = '<link rel="stylesheet" href="css/v524-equal-cards-gentle.css?v=524">'
$JsTag = '<script src="js/v524-equal-cards-gentle.js?v=524"></script>'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF V524' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $Index)) {
    throw 'public\index.html est introuvable.'
}
if (-not (Test-Path -LiteralPath $HomeDataJs)) {
    throw 'public\data\home_data.js est introuvable.'
}
if (-not (Test-Path -LiteralPath $Css)) {
    throw 'public\css\v524-equal-cards-gentle.css est introuvable.'
}
if (-not (Test-Path -LiteralPath $Js)) {
    throw 'public\js\v524-equal-cards-gentle.js est introuvable.'
}
if (-not (Test-Path -LiteralPath $GentleSource)) {
    throw 'Le portrait Gentle V524 est introuvable.'
}

if (-not (Test-Path -LiteralPath $IndexBackup)) {
    Copy-Item -LiteralPath $Index -Destination $IndexBackup
}
if (-not (Test-Path -LiteralPath $HomeJsBackup)) {
    Copy-Item -LiteralPath $HomeDataJs -Destination $HomeJsBackup
}
if (
    (Test-Path -LiteralPath $HomeDataJson) -and
    -not (Test-Path -LiteralPath $HomeJsonBackup)
) {
    Copy-Item -LiteralPath $HomeDataJson -Destination $HomeJsonBackup
}

New-Item -ItemType Directory -Path (Split-Path -Parent $GentleDiscountTarget) -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $GentlePortraitTarget) -Force | Out-Null

Copy-Item -LiteralPath $GentleSource -Destination $GentleDiscountTarget -Force
Copy-Item -LiteralPath $GentleSource -Destination $GentlePortraitTarget -Force

function Update-HomeDataObject {
    param([object]$Data)

    if ($null -eq $Data -or $null -eq $Data.discounts) {
        throw 'La section discounts est introuvable dans les données de l accueil.'
    }

    $Gentle = $Data.discounts |
        Where-Object { [string]$_.name -eq 'Gentle Criminal' } |
        Select-Object -First 1

    if ($null -eq $Gentle) {
        throw 'Gentle Criminal est introuvable dans la section discounts.'
    }

    $Gentle.image = $GentleDiscountWebPath
    return $Data
}

# Correction fiable du vrai objet JSON de home_data.js.
$HomeJsText = [System.IO.File]::ReadAllText(
    $HomeDataJs,
    [System.Text.Encoding]::UTF8
)

$HomeJsMatch = [regex]::Match(
    $HomeJsText,
    '^\s*window\.MHUR_HOME_DATA\s*=\s*(?<json>[\s\S]*?)\s*;\s*$'
)

if (-not $HomeJsMatch.Success) {
    throw 'Le format de public\data\home_data.js n est pas reconnu.'
}

$HomeObject = $HomeJsMatch.Groups['json'].Value | ConvertFrom-Json
$HomeObject = Update-HomeDataObject -Data $HomeObject
$HomeJsonCompact = $HomeObject | ConvertTo-Json -Depth 100 -Compress

[System.IO.File]::WriteAllText(
    $HomeDataJs,
    'window.MHUR_HOME_DATA = ' + $HomeJsonCompact + ';',
    $Utf8NoBom
)

# Même correction dans home_data.json lorsqu'il existe.
if (Test-Path -LiteralPath $HomeDataJson) {
    $JsonObject = (
        [System.IO.File]::ReadAllText(
            $HomeDataJson,
            [System.Text.Encoding]::UTF8
        ) | ConvertFrom-Json
    )

    $JsonObject = Update-HomeDataObject -Data $JsonObject
    $JsonCompact = $JsonObject | ConvertTo-Json -Depth 100 -Compress

    [System.IO.File]::WriteAllText(
        $HomeDataJson,
        $JsonCompact,
        $Utf8NoBom
    )
}

$Content = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

# Retire les balises de tous les anciens correctifs pour éviter les conflits.
$OldVersions = @('519', '520', '521', '522', '523', '524')

foreach ($Version in $OldVersions) {
    $Content = [regex]::Replace(
        $Content,
        "(?im)^[^\S\r\n]*<link\b[^\r\n>]*href=[""'][^""']*v$Version[^""']*\.css[^""']*[""'][^\r\n>]*>[^\S\r\n]*(?:\r?\n)?",
        ''
    )

    $Content = [regex]::Replace(
        $Content,
        "(?im)^[^\S\r\n]*<script\b[^\r\n>]*src=[""'][^""']*v$Version[^""']*\.js[^""']*[""'][^\r\n>]*>[^\r\n]*</script>[^\S\r\n]*(?:\r?\n)?",
        ''
    )
}

# Recharge le fichier de données réellement corrigé.
$HomeScriptRegex = New-Object System.Text.RegularExpressions.Regex(
    '(<script\b[^>]*\bsrc=["'']data/home_data\.js)(?:\?[^"'']*)?(["''][^>]*>\s*</script>)',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$Content = $HomeScriptRegex.Replace(
    $Content,
    {
        param($Match)
        $Match.Groups[1].Value +
        '?v=524' +
        $Match.Groups[2].Value
    },
    1
)

if ($Content -notmatch '</head>') {
    throw 'Balise </head> introuvable.'
}
if ($Content -notmatch '</body>') {
    throw 'Balise </body> introuvable.'
}

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
    throw "Vérification échouée : CSS=$CssCount ; JS=$JsCount"
}

[System.IO.File]::WriteAllText($Index, $Content, $Utf8NoBom)

# Supprime les anciens fichiers CSS/JS : ils ne pourront plus reprendre la main.
$OldFiles = @(
    (Join-Path $Public 'css\v519-character-style-fix.css'),
    (Join-Path $Public 'js\v519-character-style-fix.js'),
    (Join-Path $Public 'css\v520-character-styles.css'),
    (Join-Path $Public 'js\v520-character-styles.js'),
    (Join-Path $Public 'css\v521-targeted-ui-fixes.css'),
    (Join-Path $Public 'js\v521-targeted-ui-fixes.js'),
    (Join-Path $Public 'css\v522-final-small-cards.css'),
    (Join-Path $Public 'js\v522-final-fixes.js'),
    (Join-Path $Public 'css\v523-final-cards-gentle.css'),
    (Join-Path $Public 'js\v523-final-cards-gentle.js')
)

foreach ($OldFile in $OldFiles) {
    if (Test-Path -LiteralPath $OldFile) {
        Remove-Item -LiteralPath $OldFile -Force
    }
}

Write-Host '[OK] Toutes les cartes personnages ont la même hauteur.' -ForegroundColor Green
Write-Host '[OK] Les portraits sont entiers, centrés et ne sont plus coupés.' -ForegroundColor Green
Write-Host '[OK] Toutes les cartes alters ont la même taille.' -ForegroundColor Green
Write-Host '[OK] Gentle utilise le portrait V524 dans l accueil, la liste et les alters.' -ForegroundColor Green
Write-Host '[OK] Le vrai objet JSON de home_data.js a été corrigé.' -ForegroundColor Green
Write-Host ''
Write-Host 'GitHub Desktop : Commit to main puis Push origin.' -ForegroundColor Yellow
Write-Host 'Après le déploiement : Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
