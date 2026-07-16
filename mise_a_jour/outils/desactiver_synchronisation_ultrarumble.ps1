$ErrorActionPreference = "SilentlyContinue"
$taskNames = @(
    "MHUR France - Synchronisation UltraRumble",
    "MHUR France - Mise a jour hebdomadaire",
    "MHUR France - Mise a jour hebdomadaire V290",
    "MHUR France - Mise a jour hebdomadaire V291"
)
$removed = $false
foreach ($taskName in $taskNames) {
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        $removed = $true
    }
}
if ($removed) {
    Write-Host "[OK] Synchronisation automatique désactivée." -ForegroundColor Green
} else {
    Write-Host "Aucune tâche automatique MHUR n'était active."
}
