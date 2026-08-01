@echo off
setlocal
cd /d "%~dp0"
echo Application du correctif MHUR France V558...
cscript //nologo "APPLIQUER_CORRECTIF_V558.js"
if errorlevel 1 (
  echo.
  echo Le correctif n'a pas ete applique. Lis l'erreur ci-dessus.
  pause
  exit /b 1
)
echo.
echo Termine. Fais maintenant Commit puis Push dans GitHub Desktop.
pause
