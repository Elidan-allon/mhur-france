$ErrorActionPreference = "SilentlyContinue"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$bat = Join-Path $PSScriptRoot "VERIFIER_ET_SYNCHRONISER_SILENCIEUX.bat"
if (-not (Test-Path $bat)) { exit 2 }
$process = Start-Process `
    -FilePath $env:ComSpec `
    -ArgumentList "/d /c call `"$bat`"" `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -Wait `
    -PassThru
exit $process.ExitCode
