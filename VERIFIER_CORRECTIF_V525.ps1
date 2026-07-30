$ErrorActionPreference = 'SilentlyContinue'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$GentleTarget = Join-Path $Public 'assets\gentle_criminal\gentle_criminal_technical\portrait_v525.png'

$Errors = 0

function Test-V525 {
    param(
        [bool]$Condition,
        [string]$Success,
        [string]$Failure
    )

    if ($Condition) {
        Write-Host ('[OK] ' + $Success) -ForegroundColor Green
    }
    else {
        Write-Host ('[ERREUR] ' + $Failure) -ForegroundColor Red
        $script:Errors++
    }
}

$IndexExists = Test-Path -LiteralPath $Index
Test-V525 $IndexExists 'public\index.html existe.' 'public\index.html est introuvable.'

if ($IndexExists) {
    $Content = [System.IO.File]::ReadAllText($Index, [System.Text.Encoding]::UTF8)

    Test-V525 ($Content.Contains('<!-- MHUR_V525_START -->')) `
        'Le bloc V525 est bien dans index.html.' `
        'Le bloc V525 n est pas dans index.html.'

    Test-V525 ($Content.Contains('id="mhur-v525-final"')) `
        'Le CSS V525 est charge directement.' `
        'Le CSS V525 n est pas charge.'

    Test-V525 ($Content.Contains('id="mhur-v525-final-js"')) `
        'Le JavaScript V525 est charge directement.' `
        'Le JavaScript V525 n est pas charge.'

    Test-V525 (-not ($Content -match 'v520-character-styles')) `
        'La reference V520 inexistante a ete retiree.' `
        'La reference V520 inexistante est encore presente.'

    Test-V525 (-not ($Content -match 'v524-equal-cards-gentle')) `
        'L ancien V524 ne peut plus entrer en conflit.' `
        'Une reference V524 est encore presente.'

    Test-V525 ($Content -match 'data/home_data\.js\?v=525') `
        'Les donnees accueil sont rechargees en V525.' `
        'home_data.js ne possede pas le numero V525.'
}

Test-V525 (Test-Path -LiteralPath $GentleTarget) `
    'Le portrait Gentle V525 existe dans les assets.' `
    'Le portrait Gentle V525 est absent des assets.'

if (Test-Path -LiteralPath $HomeDataJs) {
    $HomeContent = [System.IO.File]::ReadAllText($HomeDataJs, [System.Text.Encoding]::UTF8)
    Test-V525 ($HomeContent.Contains('portrait_v525.png?v=525')) `
        'home_data.js pointe vers le portrait Gentle V525.' `
        'home_data.js ne pointe pas vers le portrait Gentle V525.'
}

if ($Errors -gt 0) {
    Write-Host ''
    Write-Host "$Errors verification(s) en erreur. Ne fais pas le Push." -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host 'Toutes les verifications V525 sont bonnes.' -ForegroundColor Green
exit 0
