@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V567
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V567 - BADGES PROPRES

echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo Lance APPLIQUER_CORRECTIF_V567.js avec Node.js.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V567.js"
echo.
pause
