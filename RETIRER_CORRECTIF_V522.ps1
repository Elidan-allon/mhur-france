$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$IndexBackup = Join-Path $Public 'index.html.avant-v522.bak'
$HomeDataJs = Join-Path $Public 'data\home_data.js'
$HomeJsBackup = Join-Path $Public 'data\home_data.js.avant-v522.bak'
$HomeDataJson = Join-Path $Public 'data\home_data.json'
$HomeJsonBackup = Join-Path $Public 'data\home_data.json.avant-v522.bak'

if (Test-Path -LiteralPath $IndexBackup) {
    Copy-Item -LiteralPath $IndexBackup -Destination $Index -Force
}
if (Test-Path -LiteralPath $HomeJsBackup) {
    Copy-Item -LiteralPath $HomeJsBackup -Destination $HomeDataJs -Force
}
if ((Test-Path -LiteralPath $HomeJsonBackup) -and (Test-Path -LiteralPath $HomeDataJson)) {
    Copy-Item -LiteralPath $HomeJsonBackup -Destination $HomeDataJson -Force
}

$Files = @(
    (Join-Path $Public 'css\v522-final-small-cards.css'),
    (Join-Path $Public 'js\v522-final-fixes.js')
)
foreach ($File in $Files) {
    if (Test-Path -LiteralPath $File) {
        Remove-Item -LiteralPath $File -Force
    }
}

Write-Host ''
Write-Host '[OK] V522 retire. Les sauvegardes ont ete restaurees.' -ForegroundColor Green
Write-Host ''
