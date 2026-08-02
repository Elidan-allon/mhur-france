@echo off
chcp 65001 >nul
title MHUR FRANCE - Simulation nettoyage V575
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - SIMULATION NETTOYAGE V575
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "NETTOYER_SITE_V575.js" --simulate
echo.
pause
