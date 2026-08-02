@echo off
chcp 65001 >nul
title MHUR FRANCE - Nettoyage securise V575
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - NETTOYAGE SECURISE V575
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "NETTOYER_SITE_V575.js"
echo.
pause
