$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'

if (-not (Test-Path -LiteralPath $Index)) { throw 'public\index.html est introuvable.' }

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$Content = [System.IO.File]::ReadAllText($Index, [System.Text.Encoding]::UTF8)
$Content = [regex]::Replace($Content, '(?im)^\s*<link\b[^\r\n>]*v521-targeted-ui-fixes\.css[^\r\n>]*>\s*\r?\n?', '')
$Content = [regex]::Replace($Content, '(?im)^\s*<script\b[^\r\n>]*v521-targeted-ui-fixes\.js[^\r\n>]*>\s*</script>\s*\r?\n?', '')
[System.IO.File]::WriteAllText($Index, $Content, $Utf8NoBom)

$Files = @(
  (Join-Path $Public 'css\v521-targeted-ui-fixes.css'),
  (Join-Path $Public 'js\v521-targeted-ui-fixes.js')
)
foreach ($File in $Files) {
  if (Test-Path -LiteralPath $File) { Remove-Item -LiteralPath $File -Force }
}

Write-Host ''
Write-Host '[OK] Correctif V521 retire sans restaurer les mauvais V519/V520.' -ForegroundColor Green
Write-Host 'Fais Commit to main puis Push origin dans GitHub Desktop.' -ForegroundColor Yellow
Write-Host ''
