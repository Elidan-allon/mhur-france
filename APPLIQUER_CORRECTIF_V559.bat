@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo === APPLICATION DU CORRECTIF V559 ===
where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo Installe Node.js puis relance ce fichier.
  pause
  exit /b 1
)
node "APPLIQUER_CORRECTIF_V559.js"
set CODE=%ERRORLEVEL%
echo.
pause
exit /b %CODE%
