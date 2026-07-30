$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root "public"

$Index = Join-Path $Public "index.html"
$HomeDataJs = Join-Path $Public "data\home_data.js"
$HomeDataJson = Join-Path $Public "data\home_data.json"
$V526Js = Join-Path $Public "js\v526-ui-final.js"
$Portrait = Join-Path $Public "assets\gentle_criminal\gentle_criminal_technical\portrait.png"

$IndexBackup = Join-Path $Public "index.html.avant-v529.bak"
$HomeJsBackup = Join-Path $Public "data\home_data.js.avant-v529.bak"
$HomeJsonBackup = Join-Path $Public "data\home_data.json.avant-v529.bak"
$V526Backup = Join-Path $Public "js\v526-ui-final.js.avant-v529.bak"

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$CorrectRootPath = "/assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=529"
$CorrectDataPath = "assets/gentle_criminal/gentle_criminal_technical/portrait.png?v=529"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  GENTLE CRIMINAL - CORRECTIF V529" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($Required in @($Index, $HomeDataJs, $V526Js, $Portrait)) {
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
if (-not (Test-Path -LiteralPath $V526Backup)) {
    Copy-Item -LiteralPath $V526Js -Destination $V526Backup
}
if ((Test-Path -LiteralPath $HomeDataJson) -and -not (Test-Path -LiteralPath $HomeJsonBackup)) {
    Copy-Item -LiteralPath $HomeDataJson -Destination $HomeJsonBackup
}

function Read-TextFile {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-TextFile {
    param(
        [string]$Path,
        [string]$Content
    )
    [System.IO.File]::WriteAllText($Path, $Content, $Utf8NoBom)
}

# ------------------------------------------------------------
# 1. INDEX.HTML
# V525 contient un ancien GENTLE_IMAGE integre directement.
# On le remplace par le vrai portrait officiel.
# ------------------------------------------------------------
$IndexText = Read-TextFile -Path $Index

$IndexOldPaths = @(
    "/assets/gentle_criminal/gentle_criminal_technical/portrait_v525.png?v=525",
    "/assets/home/discounts/gentle_criminal_correct_v526.png?v=526",
    "/assets/home/discounts/gentle_criminal.webp?v=528",
    "/assets/home/discounts/gentle_criminal.webp"
)

foreach ($OldPath in $IndexOldPaths) {
    $IndexText = $IndexText.Replace($OldPath, $CorrectRootPath)
}

$IndexText = $IndexText.Replace(
    'src="js/v526-ui-final.js?v=526"',
    'src="js/v526-ui-final.js?v=529"'
)

$IndexText = $IndexText.Replace(
    'src="data/home_data.js"',
    'src="data/home_data.js?v=529"'
)

foreach ($OldVersion in @("v=520", "v=525", "v=526", "v=527", "v=528")) {
    $IndexText = $IndexText.Replace(
        ('src="data/home_data.js?' + $OldVersion + '"'),
        'src="data/home_data.js?v=529"'
    )
}

Write-TextFile -Path $Index -Content $IndexText

# ------------------------------------------------------------
# 2. V526-UI-FINAL.JS
# Ce fichier est charge apres V525 et remplacait encore l image.
# ------------------------------------------------------------
$V526Text = Read-TextFile -Path $V526Js

$V526OldPaths = @(
    "/assets/home/discounts/gentle_criminal_correct_v526.png?v=526",
    "/assets/gentle_criminal/gentle_criminal_technical/portrait_v525.png?v=525",
    "/assets/home/discounts/gentle_criminal.webp?v=528",
    "/assets/home/discounts/gentle_criminal.webp"
)

foreach ($OldPath in $V526OldPaths) {
    $V526Text = $V526Text.Replace($OldPath, $CorrectRootPath)
}

Write-TextFile -Path $V526Js -Content $V526Text

# ------------------------------------------------------------
# 3. HOME_DATA.JS
# La source de la carte pointe aussi directement vers le portrait.
# ------------------------------------------------------------
$HomeJsText = Read-TextFile -Path $HomeDataJs

$HomeOldPaths = @(
    "assets/home/discounts/gentle_criminal.webp?v=528",
    "assets/home/discounts/gentle_criminal.webp",
    "assets/home/discounts/gentle_criminal_fix.png?v=1",
    "assets/home/discounts/gentle_criminal_correct_v526.png?v=526",
    "assets/gentle_criminal/gentle_criminal_technical/portrait_v525.png?v=525"
)

foreach ($OldPath in $HomeOldPaths) {
    $HomeJsText = $HomeJsText.Replace($OldPath, $CorrectDataPath)
}

Write-TextFile -Path $HomeDataJs -Content $HomeJsText

# Corrige aussi home_data.json s il existe.
if (Test-Path -LiteralPath $HomeDataJson) {
    $HomeJsonText = Read-TextFile -Path $HomeDataJson

    foreach ($OldPath in $HomeOldPaths) {
        $HomeJsonText = $HomeJsonText.Replace($OldPath, $CorrectDataPath)
    }

    Write-TextFile -Path $HomeDataJson -Content $HomeJsonText
}

# ------------------------------------------------------------
# 4. VERIFICATIONS
# ------------------------------------------------------------
$FinalIndex = Read-TextFile -Path $Index
$FinalV526 = Read-TextFile -Path $V526Js
$FinalHome = Read-TextFile -Path $HomeDataJs

$Errors = New-Object System.Collections.Generic.List[string]

if ($FinalIndex -notmatch [regex]::Escape($CorrectRootPath)) {
    $Errors.Add("index.html ne contient pas le portrait officiel V529.")
}
if ($FinalV526 -notmatch [regex]::Escape($CorrectRootPath)) {
    $Errors.Add("v526-ui-final.js ne contient pas le portrait officiel V529.")
}
if ($FinalHome -notmatch [regex]::Escape($CorrectDataPath)) {
    $Errors.Add("home_data.js ne contient pas le portrait officiel V529.")
}
if ($FinalIndex -notmatch 'js/v526-ui-final\.js\?v=529') {
    $Errors.Add("index.html ne recharge pas v526-ui-final.js en version 529.")
}
if ($FinalIndex -notmatch 'data/home_data\.js\?v=529') {
    $Errors.Add("index.html ne recharge pas home_data.js en version 529.")
}
if ($FinalIndex -match 'portrait_v525\.png\?v=525') {
    $Errors.Add("L ancien portrait V525 est encore present dans index.html.")
}
if ($FinalV526 -match 'gentle_criminal_correct_v526\.png\?v=526') {
    $Errors.Add("L ancienne image V526 est encore presente dans le JavaScript.")
}

if ($Errors.Count -gt 0) {
    Write-Host ""
    Write-Host "ECHEC DE LA VERIFICATION V529" -ForegroundColor Red
    foreach ($Item in $Errors) {
        Write-Host (" - " + $Item) -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

Write-Host "[OK] V525 utilise maintenant le vrai portrait.png." -ForegroundColor Green
Write-Host "[OK] V526 utilise maintenant le meme vrai portrait.png." -ForegroundColor Green
Write-Host "[OK] home_data.js pointe vers le vrai portrait.png." -ForegroundColor Green
Write-Host "[OK] Les caches JS et donnees passent en version 529." -ForegroundColor Green
Write-Host ""
Write-Host "TOUTES LES VERIFICATIONS V529 SONT BONNES" -ForegroundColor Green
Write-Host ""
Write-Host "Fais maintenant Commit to main puis Push origin." -ForegroundColor Yellow
Write-Host "Apres le deploiement, recharge avec Ctrl + F5." -ForegroundColor Yellow
Write-Host ""
