@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V572 SOURCE
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V572 - NEW GENTLE / COSTUMES / TYPO
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V572.js"
echo.
pause
