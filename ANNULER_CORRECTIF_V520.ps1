$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$Backup = Join-Path $Public 'index.html.avant-v520.bak'

if (-not (Test-Path -LiteralPath $Backup)) {
    throw 'La sauvegarde public\index.html.avant-v520.bak est introuvable.'
}

Copy-Item -LiteralPath $Backup -Destination $Index -Force

$Files = @(
    (Join-Path $Public 'css\v520-character-styles.css'),
    (Join-Path $Public 'js\v520-character-styles.js')
)

foreach ($File in $Files) {
    if (Test-Path -LiteralPath $File) {
        Remove-Item -LiteralPath $File -Force
    }
}

Write-Host ''
Write-Host '[OK] index.html restaure avant V520.' -ForegroundColor Green
Write-Host '[OK] Fichiers V520 retires.' -ForegroundColor Green
Write-Host 'Fais ensuite Commit to main et Push origin dans GitHub Desktop.' -ForegroundColor Yellow
Write-Host ''
