$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$runner = Join-Path $PSScriptRoot "lancer_synchronisation_cachee.ps1"
$taskName = "MHUR France - Synchronisation UltraRumble"

if (-not (Test-Path $runner)) {
    throw "Fichier introuvable : $runner"
}

$oldTaskNames = @(
    "MHUR France - Mise a jour hebdomadaire",
    "MHUR France - Mise a jour hebdomadaire V290",
    "MHUR France - Mise a jour hebdomadaire V291",
    "MHUR France - Synchronisation UltraRumble"
)
foreach ($oldName in $oldTaskNames) {
    Unregister-ScheduledTask -TaskName $oldName -Confirm:$false -ErrorAction SilentlyContinue
}

$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runner`"" `
    -WorkingDirectory $root

$repeatTrigger = New-ScheduledTaskTrigger `
    -Once `
    -At ((Get-Date).AddMinutes(1)) `
    -RepetitionInterval (New-TimeSpan -Minutes 30) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $identity

$principal = New-ScheduledTaskPrincipal `
    -UserId $identity `
    -LogonType Interactive `
    -RunLevel Limited

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Hours 4)

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger @($repeatTrigger, $logonTrigger) `
    -Principal $principal `
    -Settings $settings `
    -Description "Vérifie UltraRumble toutes les 30 minutes et met à jour MHUR France seulement si les données ont changé." `
    -Force | Out-Null

Write-Host "[OK] Synchronisation automatique activée." -ForegroundColor Green
Write-Host "Vérification : au démarrage de session puis toutes les 30 minutes."
Write-Host "Le PC doit être allumé, connecté à Internet et la session Windows ouverte."
