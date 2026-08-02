@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V574
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V574 - CHARGE V573 SANS INDEX.HTML
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V574.js"
echo.
pause
