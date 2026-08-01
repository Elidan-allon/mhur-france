@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo ERREUR : Node.js est introuvable.
  pause
  exit /b 1
)
node "ANNULER_CORRECTIF_V560.js"
echo.
pause
