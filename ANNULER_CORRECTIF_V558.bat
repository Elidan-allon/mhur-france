@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === ANNULATION DU CORRECTIF V558 ===
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  pause
  exit /b 1
)
node "ANNULER_CORRECTIF_V558.js"
set CODE=%ERRORLEVEL%
echo.
pause
exit /b %CODE%
