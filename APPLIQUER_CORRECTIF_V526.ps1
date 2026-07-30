$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeDataJson = Join-Path $Public 'data\home_data.json'

$Css = Join-Path $Public 'css\v526-ui-final.css'
$Js = Join-Path $Public 'js\v526-ui-final.js'
$Gentle = Join-Path $Public 'assets\home\discounts\gentle_criminal_correct_v526.png'

$IndexBackup = Join-Path $Public 'index.html.avant-v526.bak'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v526.bak'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v526.bak'

$CssTag = '<link rel="stylesheet" href="css/v526-ui-final.css?v=526">'
$JsTag = '<script src="js/v526-ui-final.js?v=526"></script>'
$GentleWebPath = 'assets/home/discounts/gentle_criminal_correct_v526.png?v=526'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF FINAL V526' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''

foreach ($Required in @($Index, $HomeDataJs, $Css, $Js, $Gentle)) {
    if (-not (Test-Path -LiteralPath $Required)) {
        throw "Fichier obligatoire introuvable : $Required"
    }
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

function Patch-HomeData {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }

    $Original = [System.IO.File]::ReadAllText(
        $Path,
        [System.Text.Encoding]::UTF8
    )

    $PrefixMatch = [regex]::Match(
        $Original,
        '^\s*window\.MHUR_HOME_DATA\s*=\s*',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    if ($PrefixMatch.Success) {
        $JsonText = $Original.Substring($PrefixMatch.Length)
        $JsonText = [regex]::Replace($JsonText, ';\s*$', '')

        try {
            $Data = $JsonText | ConvertFrom-Json

            $GentleEntry = @($Data.discounts) |
                Where-Object { $_.name -eq 'Gentle Criminal' } |
                Select-Object -First 1

            if ($null -ne $GentleEntry) {
                $GentleEntry.image = $GentleWebPath

                $NewJson = $Data | ConvertTo-Json -Depth 100 -Compress
                $Output = 'window.MHUR_HOME_DATA = ' + $NewJson + ';'
                [System.IO.File]::WriteAllText($Path, $Output, $Utf8NoBom)
                return $true
            }
        }
        catch {
            Write-Host "[INFO] Lecture JSON impossible dans $Path : remplacement textuel utilise." -ForegroundColor Yellow
        }
    }

    $Pattern = '("name"\s*:\s*"Gentle Criminal"[\s\S]{0,1200}?"image"\s*:\s*")[^"]*(")'
    $Regex = New-Object System.Text.RegularExpressions.Regex(
        $Pattern,
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    $Patched = $Regex.Replace(
        $Original,
        {
            param($Match)
            $Match.Groups[1].Value +
            $GentleWebPath +
            $Match.Groups[2].Value
        },
        1
    )

    if ($Patched -ne $Original) {
        [System.IO.File]::WriteAllText($Path, $Patched, $Utf8NoBom)
        return $true
    }

    return ($Original -match [regex]::Escape($GentleWebPath))
}

$HomeJsOk = Patch-HomeData -Path $HomeDataJs
$HomeJsonOk = Patch-HomeData -Path $HomeDataJson

$Content = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

# Retirer les blocs injectés V519 à V525, lorsqu'ils utilisent un identifiant.
$Content = [regex]::Replace(
    $Content,
    '(?is)<style\b[^>]*\bid=["'']v52[0-5][^"'']*["''][^>]*>.*?</style>',
    ''
)
$Content = [regex]::Replace(
    $Content,
    '(?is)<script\b[^>]*\bid=["'']v52[0-5][^"'']*["''][^>]*>.*?</script>',
    ''
)
$Content = [regex]::Replace(
    $Content,
    '(?is)<!--\s*MHUR\s+V52[0-5]\s+START\s*-->.*?<!--\s*MHUR\s+V52[0-5]\s+END\s*-->',
    ''
)

# Retirer seulement les fichiers des anciens correctifs, sans toucher aux versions normales du site.
$OldPatchFiles = @(
    'v519-character-style-fix',
    'v520-character-styles',
    'v521-targeted-ui-fixes',
    'v522-final-small-cards',
    'v522-final-fixes',
    'v523-final-cards-gentle',
    'v524-equal-cards-gentle',
    'v525-ui-final',
    'v525-final',
    'v525'
)

foreach ($Name in $OldPatchFiles) {
    $Escaped = [regex]::Escape($Name)

    $Content = [regex]::Replace(
        $Content,
        "(?im)^[^\S\r\n]*<link\b[^\r\n>]*href=[""'][^""']*$Escaped[^""']*\.css[^""']*[""'][^\r\n>]*>[^\S\r\n]*(?:\r?\n)?",
        ''
    )

    $Content = [regex]::Replace(
        $Content,
        "(?im)^[^\S\r\n]*<script\b[^\r\n>]*src=[""'][^""']*$Escaped[^""']*\.js[^""']*[""'][^\r\n>]*>[^\r\n]*</script>[^\S\r\n]*(?:\r?\n)?",
        ''
    )
}

# Rendre le programme relançable sans doublon.
$Content = [regex]::Replace(
    $Content,
    '(?im)^[^\S\r\n]*<link\b[^\r\n>]*v526-ui-final\.css[^\r\n>]*>[^\S\r\n]*(?:\r?\n)?',
    ''
)
$Content = [regex]::Replace(
    $Content,
    '(?im)^[^\S\r\n]*<script\b[^\r\n>]*v526-ui-final\.js[^\r\n>]*>[^\r\n]*</script>[^\S\r\n]*(?:\r?\n)?',
    ''
)

# Renouveler le fichier de données dans le navigateur.
$HomeScriptRegex = New-Object System.Text.RegularExpressions.Regex(
    '(<script\b[^>]*\bsrc=["'']data/home_data\.js)(?:\?[^"'']*)?(["''][^>]*>\s*</script>)',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$Content = $HomeScriptRegex.Replace(
    $Content,
    {
        param($Match)
        $Match.Groups[1].Value +
        '?v=526' +
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
    throw "Échec de vérification : CSS V526=$CssCount ; JS V526=$JsCount"
}

[System.IO.File]::WriteAllText($Index, $Content, $Utf8NoBom)

# Supprimer les anciens fichiers personnalisés afin qu'ils ne puissent plus être remis par erreur.
$OldFiles = @(
    'public\css\v519-character-style-fix.css',
    'public\js\v519-character-style-fix.js',
    'public\css\v520-character-styles.css',
    'public\js\v520-character-styles.js',
    'public\css\v521-targeted-ui-fixes.css',
    'public\js\v521-targeted-ui-fixes.js',
    'public\css\v522-final-small-cards.css',
    'public\js\v522-final-fixes.js',
    'public\css\v523-final-cards-gentle.css',
    'public\js\v523-final-cards-gentle.js',
    'public\css\v524-equal-cards-gentle.css',
    'public\js\v524-equal-cards-gentle.js',
    'public\css\v525-ui-final.css',
    'public\js\v525-ui-final.js'
)

foreach ($RelativePath in $OldFiles) {
    $OldFile = Join-Path $Root $RelativePath
    if (Test-Path -LiteralPath $OldFile) {
        Remove-Item -LiteralPath $OldFile -Force
    }
}

Write-Host '[OK] Texte de la fiche personnage forcé en blanc.' -ForegroundColor Green
Write-Host '[OK] Cartes Personnages / Costumes / T.U.N.I.N.G / Builds de taille identique.' -ForegroundColor Green
Write-Host '[OK] Cartes d alters de taille identique.' -ForegroundColor Green
Write-Host '[OK] Couleurs des rôles ajoutées à la Tier List.' -ForegroundColor Green
Write-Host '[OK] Le vrai portrait officiel de Gentle est copié sous un nouveau nom.' -ForegroundColor Green

if (-not $HomeJsOk) {
    Write-Host '[ATTENTION] La donnée Gentle n a pas été trouvée dans home_data.js.' -ForegroundColor Yellow
    Write-Host 'Le JavaScript V526 forcera quand même la vraie image dans la page.' -ForegroundColor Yellow
}
else {
    Write-Host '[OK] home_data.js pointe directement vers la nouvelle image Gentle.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Lancement de la vérification...' -ForegroundColor Cyan
Write-Host ''

& (Join-Path $Root 'VERIFIER_CORRECTIF_V526.ps1')
