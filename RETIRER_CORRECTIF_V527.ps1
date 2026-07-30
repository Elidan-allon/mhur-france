$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$Backup = Join-Path $Public 'index.html.avant-v527.bak'
$Css = Join-Path $Public 'css\v527-compact-costume-tuning-detail.css'

if (Test-Path -LiteralPath $Backup) {
    Copy-Item -LiteralPath $Backup -Destination $Index -Force
}

if (Test-Path -LiteralPath $Css) {
    Remove-Item -LiteralPath $Css -Force
}

Write-Host ''
Write-Host '[OK] V527 retiré et index.html restauré.' -ForegroundColor Green
Write-Host ''
