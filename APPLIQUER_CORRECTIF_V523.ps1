$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeDataJson = Join-Path $Public 'data\home_data.json'

$CssSource = Join-Path $Root 'public\css\v523-final-cards-gentle.css'
$JsSource = Join-Path $Root 'public\js\v523-final-cards-gentle.js'
$GentleSource = Join-Path $Root 'correctif_v523\gentle_criminal_v523.webp'
$GentleTarget = Join-Path $Public 'assets\home\discounts\gentle_criminal_v523.webp'

$IndexBackup = Join-Path $Public 'index.html.avant-v523.bak'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v523.bak'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v523.bak'

$GentleWebPath = 'assets/home/discounts/gentle_criminal_v523.webp?v=523'
$CssTag = '<link rel="stylesheet" href="css/v523-final-cards-gentle.css?v=523">'
$JsTag = '<script src="js/v523-final-cards-gentle.js?v=523"></script>'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF V523' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $Index)) {
    throw 'public\index.html est introuvable.'
}
if (-not (Test-Path -LiteralPath $HomeDataJs)) {
    throw 'public\data\home_data.js est introuvable.'
}
if (-not (Test-Path -LiteralPath $CssSource)) {
    throw 'Le fichier CSS V523 est introuvable.'
}
if (-not (Test-Path -LiteralPath $JsSource)) {
    throw 'Le fichier JavaScript V523 est introuvable.'
}
if (-not (Test-Path -LiteralPath $GentleSource)) {
    throw 'La nouvelle image Gentle V523 est introuvable.'
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

$GentleFolder = Split-Path -Parent $GentleTarget
if (-not (Test-Path -LiteralPath $GentleFolder)) {
    New-Item -ItemType Directory -Path $GentleFolder -Force | Out-Null
}

# Nouveau nom de fichier : impossible de récupérer l'ancienne image en cache.
Copy-Item -LiteralPath $GentleSource -Destination $GentleTarget -Force

function Patch-GentleDataFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }

    $Content = [System.IO.File]::ReadAllText(
        $Path,
        [System.Text.Encoding]::UTF8
    )

    $Pattern = '("name"\s*:\s*"Gentle Criminal"[\s\S]{0,900}?"image"\s*:\s*")[^"]*(")'
    $Regex = New-Object System.Text.RegularExpressions.Regex(
        $Pattern,
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    $Patched = $Regex.Replace(
        $Content,
        {
            param($Match)
            $Match.Groups[1].Value +
            $GentleWebPath +
            $Match.Groups[2].Value
        },
        1
    )

    if ($Patched -ne $Content) {
        [System.IO.File]::WriteAllText($Path, $Patched, $Utf8NoBom)
        return $true
    }

    return ($Content -match [regex]::Escape($GentleWebPath))
}

$HomeJsPatched = Patch-GentleDataFile -Path $HomeDataJs
$HomeJsonPatched = Patch-GentleDataFile -Path $HomeDataJson

$Content = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

# Retire totalement les anciens correctifs problématiques.
$OldCssNames = @(
    'v519-character-style-fix',
    'v520-character-styles',
    'v521-targeted-ui-fixes',
    'v522-final-small-cards'
)

$OldJsNames = @(
    'v519-character-style-fix',
    'v520-character-styles',
    'v521-targeted-ui-fixes',
    'v522-final-fixes'
)

foreach ($Name in $OldCssNames) {
    $Escaped = [regex]::Escape($Name)
    $Pattern = "(?im)^[^\S\r\n]*<link\b[^\r\n>]*href=[""'][^""']*$Escaped\.css[^""']*[""'][^\r\n>]*>[^\S\r\n]*(?:\r?\n)?"
    $Content = [regex]::Replace($Content, $Pattern, '')
}

foreach ($Name in $OldJsNames) {
    $Escaped = [regex]::Escape($Name)
    $Pattern = "(?im)^[^\S\r\n]*<script\b[^\r\n>]*src=[""'][^""']*$Escaped\.js[^""']*[""'][^\r\n>]*>[^\r\n]*</script>[^\S\r\n]*(?:\r?\n)?"
    $Content = [regex]::Replace($Content, $Pattern, '')
}

# Retire une ancienne installation V523 pour rendre le programme relançable.
$Content = [regex]::Replace(
    $Content,
    '(?im)^[^\S\r\n]*<link\b[^\r\n>]*v523-final-cards-gentle\.css[^\r\n>]*>[^\S\r\n]*(?:\r?\n)?',
    ''
)
$Content = [regex]::Replace(
    $Content,
    '(?im)^[^\S\r\n]*<script\b[^\r\n>]*v523-final-cards-gentle\.js[^\r\n>]*>[^\r\n]*</script>[^\S\r\n]*(?:\r?\n)?',
    ''
)

# Recharge explicitement les nouvelles données de l'accueil.
$HomeScriptRegex = New-Object System.Text.RegularExpressions.Regex(
    '(<script\b[^>]*\bsrc=["'']data/home_data\.js)(?:\?[^"'']*)?(["''][^>]*>\s*</script>)',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$Content = $HomeScriptRegex.Replace(
    $Content,
    {
        param($Match)
        $Match.Groups[1].Value +
        '?v=523' +
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

# Supprime les anciens fichiers afin qu'ils ne puissent plus être rechargés.
$OldFiles = @(
    (Join-Path $Public 'css\v519-character-style-fix.css'),
    (Join-Path $Public 'js\v519-character-style-fix.js'),
    (Join-Path $Public 'css\v520-character-styles.css'),
    (Join-Path $Public 'js\v520-character-styles.js'),
    (Join-Path $Public 'css\v521-targeted-ui-fixes.css'),
    (Join-Path $Public 'js\v521-targeted-ui-fixes.js'),
    (Join-Path $Public 'css\v522-final-small-cards.css'),
    (Join-Path $Public 'js\v522-final-fixes.js')
)

foreach ($OldFile in $OldFiles) {
    if (Test-Path -LiteralPath $OldFile) {
        Remove-Item -LiteralPath $OldFile -Force
    }
}

Write-Host '[OK] Le bas des cartes personnages est remis comme avant.' -ForegroundColor Green
Write-Host '[OK] Seule la photo du haut est raccourcie et carrée.' -ForegroundColor Green
Write-Host '[OK] Les photos des cartes d alters sont aussi raccourcies.' -ForegroundColor Green
Write-Host '[OK] Gentle utilise un nouveau fichier image V523.' -ForegroundColor Green
Write-Host '[OK] Une seule flèche reste dans le tutoriel des mods.' -ForegroundColor Green

if (-not $HomeJsPatched) {
    Write-Host '[INFO] La donnée Gentle n a pas été trouvée, mais le JavaScript V523 forcera quand même la bonne photo.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'GitHub Desktop : Commit to main puis Push origin.' -ForegroundColor Yellow
Write-Host 'Après le déploiement : Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
