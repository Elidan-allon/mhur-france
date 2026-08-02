@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V569
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V569 - SUPPRIMER NEW TWICE TSUYU ACCUEIL
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo Lance APPLIQUER_CORRECTIF_V569.js avec Node.js.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V569.js"
echo.
pause
