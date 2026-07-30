$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$Css = Join-Path $Public 'css\v526-ui-final.css'
$Js = Join-Path $Public 'js\v526-ui-final.js'
$Gentle = Join-Path $Public 'assets\home\discounts\gentle_criminal_correct_v526.png'

$Errors = New-Object System.Collections.Generic.List[string]

foreach ($Required in @($Index, $HomeDataJs, $Css, $Js, $Gentle)) {
    if (-not (Test-Path -LiteralPath $Required)) {
        $Errors.Add("Fichier manquant : $Required")
    }
}

if (Test-Path -LiteralPath $Index) {
    $IndexText = [System.IO.File]::ReadAllText(
        $Index,
        [System.Text.Encoding]::UTF8
    )

    $CssCount = ([regex]::Matches(
        $IndexText,
        'v526-ui-final\.css\?v=526'
    )).Count

    $JsCount = ([regex]::Matches(
        $IndexText,
        'v526-ui-final\.js\?v=526'
    )).Count

    if ($CssCount -ne 1) {
        $Errors.Add("Le CSS V526 apparaît $CssCount fois dans index.html.")
    }
    if ($JsCount -ne 1) {
        $Errors.Add("Le JavaScript V526 apparaît $JsCount fois dans index.html.")
    }
}

if (Test-Path -LiteralPath $HomeDataJs) {
    $HomeText = [System.IO.File]::ReadAllText(
        $HomeDataJs,
        [System.Text.Encoding]::UTF8
    )

    if ($HomeText -notmatch 'gentle_criminal_correct_v526\.png') {
        $Errors.Add('home_data.js ne contient pas encore la nouvelle image Gentle.')
    }
}

if (Test-Path -LiteralPath $Css) {
    $CssText = [System.IO.File]::ReadAllText(
        $Css,
        [System.Text.Encoding]::UTF8
    )

    foreach ($Needle in @(
        '.charPanel .meta',
        '.styleGrid > .styleCard[data-style]',
        '.pageFrame.costumesFrame .cardsGrid',
        '.pageFrame.tuningsFrame .cardsGrid',
        '.mhurTierItem.v526-role-assault'
    )) {
        if ($CssText -notmatch [regex]::Escape($Needle)) {
            $Errors.Add("Sélecteur absent du CSS : $Needle")
        }
    }
}

if ($Errors.Count -gt 0) {
    Write-Host ''
    Write-Host 'VÉRIFICATION V526 ÉCHOUÉE' -ForegroundColor Red
    foreach ($Item in $Errors) {
        Write-Host " - $Item" -ForegroundColor Red
    }
    Write-Host ''
    exit 1
}

Write-Host ''
Write-Host '==============================================' -ForegroundColor Green
Write-Host '  TOUTES LES VÉRIFICATIONS V526 SONT BONNES' -ForegroundColor Green
Write-Host '==============================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Tu peux maintenant faire Commit to main puis Push origin.' -ForegroundColor Yellow
Write-Host 'Après le déploiement, recharge avec Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
