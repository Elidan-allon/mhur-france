@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V579
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V579 - NEW + VAGUE COMPLETE
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V579.js"
echo.
pause
