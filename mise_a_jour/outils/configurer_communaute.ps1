$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$configPath = Join-Path $root "js\community-config.js"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION DES BUILDS COMMUNAUTAIRES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Entre les deux valeurs visibles dans Supabase > Project Settings > API."
Write-Host "Utilise la Publishable key / anon key. JAMAIS la service_role key." -ForegroundColor Yellow
Write-Host ""

$url = (Read-Host "Project URL (https://xxxxx.supabase.co)").Trim().TrimEnd("/")
$key = (Read-Host "Publishable key / anon key").Trim()

if ($url -notmatch '^https://.+\.supabase\.co$') {
    throw "L URL Supabase est invalide."
}
if ($key.Length -lt 20) {
    throw "La cle semble invalide."
}

$config = @{
    supabaseUrl = $url
    supabaseKey = $key
} | ConvertTo-Json -Compress

$content = "window.MHUR_COMMUNITY_CONFIG = $config;`r`n"
[System.IO.File]::WriteAllText(
    $configPath,
    $content,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host ""
Write-Host "[OK] La communaute en ligne est configuree." -ForegroundColor Green
Write-Host "Ferme puis rouvre index.html."
