$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeDataJson = Join-Path $Public 'data\home_data.json'

$Payload = Join-Path $Root 'correctif_v525'
$CssFile = Join-Path $Payload 'v525.css'
$JsFile = Join-Path $Payload 'v525.js'
$GentleSource = Join-Path $Payload 'gentle_criminal_portrait_v525.png'
$GentleFolder = Join-Path $Public 'assets\gentle_criminal\gentle_criminal_technical'
$GentleTarget = Join-Path $GentleFolder 'portrait_v525.png'

$IndexBackup = Join-Path $Public 'index.html.avant-v525.bak'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v525.bak'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v525.bak'

$MarkerStart = '<!-- MHUR_V525_START -->'
$MarkerEnd = '<!-- MHUR_V525_END -->'
$GentleWebPath = 'assets/gentle_criminal/gentle_criminal_technical/portrait_v525.png?v=525'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  MHUR FRANCE - CORRECTIF V525' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path -LiteralPath $Index)) {
    throw 'public\index.html est introuvable. Place le correctif dans le dossier principal du depot.'
}
if (-not (Test-Path -LiteralPath $CssFile)) {
    throw 'correctif_v525\v525.css est introuvable.'
}
if (-not (Test-Path -LiteralPath $JsFile)) {
    throw 'correctif_v525\v525.js est introuvable.'
}
if (-not (Test-Path -LiteralPath $GentleSource)) {
    throw 'Le portrait Gentle V525 est introuvable.'
}

if (-not (Test-Path -LiteralPath $IndexBackup)) {
    Copy-Item -LiteralPath $Index -Destination $IndexBackup
}
if ((Test-Path -LiteralPath $HomeDataJs) -and -not (Test-Path -LiteralPath $HomeJsBackup)) {
    Copy-Item -LiteralPath $HomeDataJs -Destination $HomeJsBackup
}
if ((Test-Path -LiteralPath $HomeDataJson) -and -not (Test-Path -LiteralPath $HomeJsonBackup)) {
    Copy-Item -LiteralPath $HomeDataJson -Destination $HomeJsonBackup
}

if (-not (Test-Path -LiteralPath $GentleFolder)) {
    New-Item -ItemType Directory -Path $GentleFolder -Force | Out-Null
}
Copy-Item -LiteralPath $GentleSource -Destination $GentleTarget -Force

function Patch-HomeDataFile {
    param(
        [string]$Path,
        [bool]$Wrapped
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }

    $Raw = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
    $Start = $Raw.IndexOf('{')
    $End = $Raw.LastIndexOf('}')

    if ($Start -lt 0 -or $End -le $Start) {
        return $false
    }

    $Json = $Raw.Substring($Start, $End - $Start + 1)

    try {
        $Data = $Json | ConvertFrom-Json
    }
    catch {
        return $false
    }

    $Gentle = $Data.discounts | Where-Object {
        $_.name -eq 'Gentle Criminal'
    } | Select-Object -First 1

    if ($null -eq $Gentle) {
        return $false
    }

    $Gentle.image = $GentleWebPath
    $Serialized = $Data | ConvertTo-Json -Depth 100 -Compress

    if ($Wrapped) {
        $Output = 'window.MHUR_HOME_DATA = ' + $Serialized + ';'
    }
    else {
        $Output = $Serialized
    }

    [System.IO.File]::WriteAllText($Path, $Output, $Utf8NoBom)
    return $true
}

$HomeJsPatched = Patch-HomeDataFile -Path $HomeDataJs -Wrapped $true
$HomeJsonPatched = Patch-HomeDataFile -Path $HomeDataJson -Wrapped $false

$Css = [System.IO.File]::ReadAllText($CssFile, [System.Text.Encoding]::UTF8)
$Js = [System.IO.File]::ReadAllText($JsFile, [System.Text.Encoding]::UTF8)
$Content = [System.IO.File]::ReadAllText($Index, [System.Text.Encoding]::UTF8)

# Retire une ancienne installation V525 complète.
$V525BlockPattern = '(?s)\s*<!-- MHUR_V525_START -->.*?<!-- MHUR_V525_END -->\s*'
$Content = [regex]::Replace($Content, $V525BlockPattern, [Environment]::NewLine)

# Retire les références des anciens correctifs qui entraient en conflit.
$OldNames = @(
    'v519-character-style-fix',
    'v520-character-styles',
    'v521-targeted-ui-fixes',
    'v522-final-small-cards',
    'v522-final-fixes',
    'v523-final-cards-gentle',
    'v524-equal-cards-gentle'
)

$Lines = $Content -split "\r?\n"
$FilteredLines = foreach ($Line in $Lines) {
    $Keep = $true

    foreach ($Name in $OldNames) {
        if ($Line -match [regex]::Escape($Name)) {
            $Keep = $false
            break
        }
    }

    if ($Keep) {
        $Line
    }
}
$Content = $FilteredLines -join [Environment]::NewLine

# Recharge les données d'accueil sans reprendre l'ancienne version en cache.
$HomeScriptPattern = @'
src=(["'])data/home_data\.js(?:\?[^"']*)?\1
'@

$Content = [regex]::Replace(
    $Content,
    $HomeScriptPattern,
    {
        param($Match)
        'src=' +
        $Match.Groups[1].Value +
        'data/home_data.js?v=525' +
        $Match.Groups[1].Value
    },
    1
)

$BodyIndex = $Content.LastIndexOf('</body>')
if ($BodyIndex -lt 0) {
    throw 'Balise </body> introuvable. Le fichier index.html n a pas ete modifie.'
}

$Block =
    [Environment]::NewLine +
    $MarkerStart +
    [Environment]::NewLine +
    '<style id="mhur-v525-final">' +
    [Environment]::NewLine +
    $Css +
    [Environment]::NewLine +
    '</style>' +
    [Environment]::NewLine +
    '<script id="mhur-v525-final-js">' +
    [Environment]::NewLine +
    $Js +
    [Environment]::NewLine +
    '</script>' +
    [Environment]::NewLine +
    $MarkerEnd +
    [Environment]::NewLine

$Content = $Content.Insert($BodyIndex, $Block)

$StartCount = ([regex]::Matches($Content, [regex]::Escape($MarkerStart))).Count
$EndCount = ([regex]::Matches($Content, [regex]::Escape($MarkerEnd))).Count

if ($StartCount -ne 1 -or $EndCount -ne 1) {
    throw "Verification interne echouee : debut=$StartCount ; fin=$EndCount"
}

[System.IO.File]::WriteAllText($Index, $Content, $Utf8NoBom)

Write-Host '[OK] V525 est integre directement dans public\index.html.' -ForegroundColor Green
Write-Host '[OK] Les anciennes references V519 a V524 ont ete retirees.' -ForegroundColor Green
Write-Host '[OK] Toutes les cartes personnages auront le meme haut et le meme bas.' -ForegroundColor Green
Write-Host '[OK] Toutes les cartes d alters auront exactement la meme taille.' -ForegroundColor Green
Write-Host '[OK] Le portrait Gentle V525 a ete copie dans le site.' -ForegroundColor Green

if ($HomeJsPatched) {
    Write-Host '[OK] public\data\home_data.js utilise le portrait Gentle V525.' -ForegroundColor Green
}
else {
    Write-Host '[INFO] home_data.js n a pas pu etre reecrit ; le JavaScript V525 forcera quand meme la bonne image.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Verification automatique :' -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'VERIFIER_CORRECTIF_V525.ps1')
if ($LASTEXITCODE -ne 0) {
    throw 'La verification V525 a echoue. Ne fais pas le Push.'
}

Write-Host ''
Write-Host 'Tu peux maintenant faire Commit to main puis Push origin.' -ForegroundColor Yellow
Write-Host 'Apres le deploiement : Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
