@echo off
setlocal
cd /d "%~dp0"
echo.
echo Installation du correctif MHUR V560...
where node >nul 2>nul
if errorlevel 1 (
  echo ERREUR : Node.js est introuvable sur ce PC.
  echo Ouvre le projet avec ton environnement habituel puis installe Node.js.
  pause
  exit /b 1
)
node "APPLIQUER_CORRECTIF_V560.js"
if errorlevel 1 (
  echo.
  echo Le correctif n'a pas ete installe.
  pause
  exit /b 1
)
echo.
pause
