$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'

$Index = Join-Path $Public 'index.html'
$HomeData = Join-Path $Public 'data\home_data.js'
$Image = Join-Path $Public 'assets\home\discounts\gentle_criminal.webp'

$BackupIndex = Join-Path $Public 'index.html.avant-v528.bak'
$BackupHome = Join-Path $Public 'data\home_data.js.avant-v528.bak'
$BackupImage = Join-Path $Public 'assets\home\discounts\gentle_criminal.avant-v528.webp'

if (Test-Path -LiteralPath $BackupIndex) {
    Copy-Item -LiteralPath $BackupIndex -Destination $Index -Force
}

if (Test-Path -LiteralPath $BackupHome) {
    Copy-Item -LiteralPath $BackupHome -Destination $HomeData -Force
}

if (Test-Path -LiteralPath $BackupImage) {
    Copy-Item -LiteralPath $BackupImage -Destination $Image -Force
}

Write-Host ''
Write-Host '[OK] Le correctif Gentle V528 a été annulé.' -ForegroundColor Green
Write-Host ''
