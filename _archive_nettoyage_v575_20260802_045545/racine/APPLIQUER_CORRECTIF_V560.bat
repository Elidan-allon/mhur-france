@echo off
cd /d "%~dp0"
echo.
echo === MHUR FRANCE - CORRECTIF V560 ===
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  pause
  exit /b 1
)
node APPLIQUER_CORRECTIF_V560.js
if errorlevel 1 (
  pause
  exit /b 1
)
pause
