@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V570
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V570 - ACCUEIL ET COSTUMES SOURCE

echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V570.js"
echo.
pause
