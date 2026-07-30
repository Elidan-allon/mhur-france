$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root "public"
$Index = Join-Path $Public "index.html"
$Backup = Join-Path $Public "index.html.avant-v530.bak"

if (Test-Path -LiteralPath $Backup) {
    Copy-Item -LiteralPath $Backup -Destination $Index -Force
}

foreach ($File in @(
    (Join-Path $Public "css\v530-gentle-only.css"),
    (Join-Path $Public "js\v530-gentle-only.js"),
    (Join-Path $Public "assets\home\discounts\gentle_criminal_v530.png")
)) {
    if (Test-Path -LiteralPath $File) {
        Remove-Item -LiteralPath $File -Force
    }
}

Write-Host ""
Write-Host "[OK] Le correctif Gentle V530 a ete retire." -ForegroundColor Green
Write-Host ""
