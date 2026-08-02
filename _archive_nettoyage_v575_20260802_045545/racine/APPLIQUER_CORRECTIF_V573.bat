@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V573
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V573 - NEW DROITE / ANIMATION / TENUES
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V573.js"
echo.
pause
