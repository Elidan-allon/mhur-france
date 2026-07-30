$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root "public"
$Index = Join-Path $Public "index.html"
$Css = Join-Path $Public "css\v530-gentle-only.css"
$Js = Join-Path $Public "js\v530-gentle-only.js"
$Image = Join-Path $Public "assets\home\discounts\gentle_criminal_v530.png"
$Backup = Join-Path $Public "index.html.avant-v530.bak"

$CssTag = '<link rel="stylesheet" href="css/v530-gentle-only.css?v=530">'
$JsTag = '<script src="js/v530-gentle-only.js?v=530"></script>'
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  GENTLE CRIMINAL - CORRECTIF V530" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($Required in @($Index, $Css, $Js, $Image)) {
    if (-not (Test-Path -LiteralPath $Required)) {
        throw "Fichier obligatoire introuvable : $Required"
    }
}

if (-not (Test-Path -LiteralPath $Backup)) {
    Copy-Item -LiteralPath $Index -Destination $Backup
}

$Content = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

$Content = $Content.Replace(
    $CssTag + [Environment]::NewLine,
    ""
)

$Content = $Content.Replace(
    $JsTag + [Environment]::NewLine,
    ""
)

$Content = $Content.Replace($CssTag, "")
$Content = $Content.Replace($JsTag, "")

if (-not $Content.Contains("</head>")) {
    throw "Balise head de fermeture introuvable."
}

if (-not $Content.Contains("</body>")) {
    throw "Balise body de fermeture introuvable."
}

$Content = $Content.Replace(
    "</head>",
    $CssTag + [Environment]::NewLine + "</head>"
)

$Content = $Content.Replace(
    "</body>",
    $JsTag + [Environment]::NewLine + "</body>"
)

[System.IO.File]::WriteAllText(
    $Index,
    $Content,
    $Utf8NoBom
)

$Final = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

$CssCount = (
    [regex]::Matches(
        $Final,
        [regex]::Escape($CssTag)
    )
).Count

$JsCount = (
    [regex]::Matches(
        $Final,
        [regex]::Escape($JsTag)
    )
).Count

if ($CssCount -ne 1) {
    throw "Le CSS V530 apparait $CssCount fois."
}

if ($JsCount -ne 1) {
    throw "Le JavaScript V530 apparait $JsCount fois."
}

Write-Host "[OK] Le portrait V530 est present." -ForegroundColor Green
Write-Host "[OK] Le CSS Gentle est charge dans le head." -ForegroundColor Green
Write-Host "[OK] Le JavaScript Gentle est charge tout en bas du body." -ForegroundColor Green
Write-Host "[OK] Le correctif sera execute apres les anciens scripts." -ForegroundColor Green
Write-Host ""
Write-Host "TOUTES LES VERIFICATIONS V530 SONT BONNES" -ForegroundColor Green
Write-Host ""
Write-Host "Commit to main, puis Push origin." -ForegroundColor Yellow
Write-Host "Apres le deploiement : Ctrl + F5." -ForegroundColor Yellow
Write-Host ""
