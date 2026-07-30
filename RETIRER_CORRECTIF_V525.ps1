$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'

$Index = Join-Path $Public 'index.html'
$IndexBackup = Join-Path $Public 'index.html.avant-v525.bak'

$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v525.bak'

$HomeDataJson = Join-Path $Public 'data\home_data.json'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v525.bak'

$GentleTarget = Join-Path $Public 'assets\gentle_criminal\gentle_criminal_technical\portrait_v525.png'

if (Test-Path -LiteralPath $IndexBackup) {
    Copy-Item -LiteralPath $IndexBackup -Destination $Index -Force
}
if (Test-Path -LiteralPath $HomeJsBackup) {
    Copy-Item -LiteralPath $HomeJsBackup -Destination $HomeDataJs -Force
}
if ((Test-Path -LiteralPath $HomeJsonBackup) -and (Test-Path -LiteralPath $HomeDataJson)) {
    Copy-Item -LiteralPath $HomeJsonBackup -Destination $HomeDataJson -Force
}
if (Test-Path -LiteralPath $GentleTarget) {
    Remove-Item -LiteralPath $GentleTarget -Force
}

Write-Host ''
Write-Host '[OK] V525 retire et sauvegardes restaurees.' -ForegroundColor Green
Write-Host ''
