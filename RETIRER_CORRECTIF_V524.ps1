$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'

$Index = Join-Path $Public 'index.html'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeDataJson = Join-Path $Public 'data\home_data.json'

$IndexBackup = Join-Path $Public 'index.html.avant-v524.bak'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v524.bak'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v524.bak'

if (Test-Path -LiteralPath $IndexBackup) {
    Copy-Item -LiteralPath $IndexBackup -Destination $Index -Force
}
if (Test-Path -LiteralPath $HomeJsBackup) {
    Copy-Item -LiteralPath $HomeJsBackup -Destination $HomeDataJs -Force
}
if (
    (Test-Path -LiteralPath $HomeJsonBackup) -and
    (Test-Path -LiteralPath $HomeDataJson)
) {
    Copy-Item -LiteralPath $HomeJsonBackup -Destination $HomeDataJson -Force
}

$Files = @(
    (Join-Path $Public 'css\v524-equal-cards-gentle.css'),
    (Join-Path $Public 'js\v524-equal-cards-gentle.js'),
    (Join-Path $Public 'assets\home\discounts\gentle_criminal_v524.webp'),
    (Join-Path $Public 'assets\gentle_criminal\gentle_criminal_technical\portrait_v524.webp')
)

foreach ($File in $Files) {
    if (Test-Path -LiteralPath $File) {
        Remove-Item -LiteralPath $File -Force
    }
}

Write-Host ''
Write-Host '[OK] V524 retiré et sauvegardes restaurées.' -ForegroundColor Green
Write-Host ''
