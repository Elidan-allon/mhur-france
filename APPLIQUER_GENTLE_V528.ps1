$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Public = Join-Path $Root 'public'
$Index = Join-Path $Public 'index.html'
$HomeData = Join-Path $Public 'data\home_data.js'
$TargetImage = Join-Path $Public 'assets\home\discounts\gentle_criminal.webp'
$SourceImage = Join-Path $Root 'correctif_v528\gentle_criminal.webp'

$BackupImage = Join-Path $Public 'assets\home\discounts\gentle_criminal.avant-v528.webp'
$BackupHome = Join-Path $Public 'data\home_data.js.avant-v528.bak'
$BackupIndex = Join-Path $Public 'index.html.avant-v528.bak'

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host ''
Write-Host '==============================================' -ForegroundColor Cyan
Write-Host '  GENTLE CRIMINAL - CORRECTIF V528' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan
Write-Host ''

foreach ($Required in @($Index, $HomeData, $SourceImage)) {
    if (-not (Test-Path -LiteralPath $Required)) {
        throw "Fichier introuvable : $Required"
    }
}

$TargetFolder = Split-Path -Parent $TargetImage
if (-not (Test-Path -LiteralPath $TargetFolder)) {
    New-Item -ItemType Directory -Path $TargetFolder -Force | Out-Null
}

if ((Test-Path -LiteralPath $TargetImage) -and -not (Test-Path -LiteralPath $BackupImage)) {
    Copy-Item -LiteralPath $TargetImage -Destination $BackupImage
}

if (-not (Test-Path -LiteralPath $BackupHome)) {
    Copy-Item -LiteralPath $HomeData -Destination $BackupHome
}

if (-not (Test-Path -LiteralPath $BackupIndex)) {
    Copy-Item -LiteralPath $Index -Destination $BackupIndex
}

# Étape principale : remplace le fichier EXACT que le site utilise déjà.
Copy-Item -LiteralPath $SourceImage -Destination $TargetImage -Force

# Ajoute une version à l'URL de Gentle pour éviter l'ancienne image en cache.
$HomeText = [System.IO.File]::ReadAllText(
    $HomeData,
    [System.Text.Encoding]::UTF8
)

$Pattern = '("name"\s*:\s*"Gentle Criminal"[\s\S]{0,500}?"image"\s*:\s*")assets/home/discounts/gentle_criminal\.webp(?:\?[^"]*)?(")'
$Regex = New-Object System.Text.RegularExpressions.Regex(
    $Pattern,
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

$PatchedHome = $Regex.Replace(
    $HomeText,
    {
        param($Match)
        $Match.Groups[1].Value +
        'assets/home/discounts/gentle_criminal.webp?v=528' +
        $Match.Groups[2].Value
    },
    1
)

if ($PatchedHome -eq $HomeText -and $HomeText -notmatch 'gentle_criminal\.webp\?v=528') {
    throw 'La donnée Gentle Criminal n’a pas été trouvée dans public\data\home_data.js.'
}

[System.IO.File]::WriteAllText($HomeData, $PatchedHome, $Utf8NoBom)

# Recharge aussi home_data.js avec une nouvelle version.
$IndexText = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

$IndexText = [regex]::Replace(
    $IndexText,
    '(<script\b[^>]*\bsrc=["'']data/home_data\.js)(?:\?[^"'']*)?(["''][^>]*>\s*</script>)',
    '$1?v=528$2',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

[System.IO.File]::WriteAllText($Index, $IndexText, $Utf8NoBom)

# Vérification réelle.
$FinalHome = [System.IO.File]::ReadAllText(
    $HomeData,
    [System.Text.Encoding]::UTF8
)

$FinalIndex = [System.IO.File]::ReadAllText(
    $Index,
    [System.Text.Encoding]::UTF8
)

if (-not (Test-Path -LiteralPath $TargetImage)) {
    throw 'Le nouveau fichier gentle_criminal.webp n’a pas été copié.'
}

if ($FinalHome -notmatch 'assets/home/discounts/gentle_criminal\.webp\?v=528') {
    throw 'home_data.js ne pointe pas vers Gentle V528.'
}

if ($FinalIndex -notmatch 'data/home_data\.js\?v=528') {
    throw 'index.html ne recharge pas home_data.js V528.'
}

$SourceHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $SourceImage).Hash
$TargetHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $TargetImage).Hash

if ($SourceHash -ne $TargetHash) {
    throw 'L’image copiée ne correspond pas au portrait officiel inclus.'
}

Write-Host '[OK] L’ancien gentle_criminal.webp a été remplacé directement.' -ForegroundColor Green
Write-Host '[OK] home_data.js utilise gentle_criminal.webp?v=528.' -ForegroundColor Green
Write-Host '[OK] index.html recharge home_data.js?v=528.' -ForegroundColor Green
Write-Host '[OK] Les empreintes des deux images sont identiques.' -ForegroundColor Green
Write-Host ''
Write-Host 'Tu peux maintenant faire Commit to main puis Push origin.' -ForegroundColor Yellow
Write-Host 'Après le déploiement, recharge avec Ctrl + F5.' -ForegroundColor Yellow
Write-Host ''
