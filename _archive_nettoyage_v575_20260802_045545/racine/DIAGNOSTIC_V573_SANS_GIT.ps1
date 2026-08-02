$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$report = Join-Path $root "RAPPORT_DIAGNOSTIC_V573.txt"
"MHUR FRANCE - DIAGNOSTIC V573" | Out-File $report -Encoding utf8
("Date : " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) | Out-File $report -Append -Encoding utf8
("Dossier : " + $root) | Out-File $report -Append -Encoding utf8
"" | Out-File $report -Append -Encoding utf8

function Add-Line($text) {
    $text | Tee-Object -FilePath $report -Append
}

function Check-File($relative) {
    $path = Join-Path $root $relative
    if (Test-Path $path) {
        $item = Get-Item $path
        Add-Line ("[OK] " + $relative + " existe - " + $item.Length + " octets - modifié " + $item.LastWriteTime)
        return $true
    } else {
        Add-Line ("[ABSENT] " + $relative)
        return $false
    }
}

Add-Line "=== FICHIERS PRINCIPAUX ==="
$hasIndex = Check-File "public\index.html"
$hasFixes = Check-File "public\js\season18-fixes.js"
$hasSync = Check-File "public\data\season18_sync.js"
$hasV572Js = Check-File "public\js\v572-source-new-gentle-costumes.js"
$hasV572Css = Check-File "public\css\v572-source-new-gentle-costumes.css"
$hasV573Js = Check-File "public\js\v573-new-right-animation-costumes.js"
$hasV573Css = Check-File "public\css\v573-new-right-animation-costumes.css"

Add-Line ""
Add-Line "=== CHARGEMENT DANS INDEX.HTML ==="
if ($hasIndex) {
    $index = Get-Content (Join-Path $root "public\index.html") -Raw
    foreach ($needle in @(
        "v572-source-new-gentle-costumes.css",
        "v572-source-new-gentle-costumes.js",
        "v573-new-right-animation-costumes.css",
        "v573-new-right-animation-costumes.js"
    )) {
        if ($index -match [regex]::Escape($needle)) {
            Add-Line ("[CHARGE] " + $needle)
        } else {
            Add-Line ("[NON CHARGE] " + $needle)
        }
    }
}

Add-Line ""
Add-Line "=== DONNEES NEW ==="
if ($hasSync) {
    $sync = Get-Content (Join-Path $root "public\data\season18_sync.js") -Raw
    foreach ($needle in @(
        "gentle_criminal",
        "gentle_criminal_technical",
        "108000000"
    )) {
        if ($sync -match [regex]::Escape($needle)) {
            Add-Line ("[PRESENT] " + $needle)
        } else {
            Add-Line ("[ABSENT] " + $needle)
        }
    }
}

Add-Line ""
Add-Line "=== MODIFICATIONS DU RENDU COSTUME ==="
if ($hasFixes) {
    $fixes = Get-Content (Join-Path $root "public\js\season18-fixes.js") -Raw
    foreach ($needle in @(
        "data-costume",
        "V572 merge latest costume wave",
        "108000000"
    )) {
        if ($fixes -match [regex]::Escape($needle)) {
            Add-Line ("[PRESENT] " + $needle)
        } else {
            Add-Line ("[ABSENT] " + $needle)
        }
    }
}

Add-Line ""
Add-Line "=== CONCLUSION AUTOMATIQUE ==="

$indexText = ""
if ($hasIndex) {
    $indexText = Get-Content (Join-Path $root "public\index.html") -Raw
}

if (-not $hasIndex -or -not $hasFixes -or -not $hasSync) {
    Add-Line "[ERREUR] Ce script n'est probablement pas placé à la racine du bon dossier mhur-france."
} elseif (($indexText -notmatch "v573-new-right-animation-costumes") -and ($indexText -notmatch "v572-source-new-gentle-costumes")) {
    Add-Line "[PROBLEME] Les fichiers du correctif peuvent exister, mais index.html ne les charge pas."
} elseif (-not $hasV573Js -or -not $hasV573Css) {
    Add-Line "[PROBLEME] V573 est mentionné dans index.html mais ses fichiers sont absents."
} else {
    Add-Line "[OK] V573 semble installé. Si le site ne change pas, le problème vient probablement du commit/deploiement ou du cache Cloudflare."
}

Add-Line ""
Add-Line "Le rapport complet est enregistré ici :"
Add-Line $report

Write-Host ""
Write-Host "Appuie sur Entrée pour fermer."
Read-Host
