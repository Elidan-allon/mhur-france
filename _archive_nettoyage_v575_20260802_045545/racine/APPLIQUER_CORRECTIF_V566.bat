@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V566
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V566 - BADGES NEW / INCOMING FINAL

echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo Lance APPLIQUER_CORRECTIF_V566.js avec Node.js.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V566.js"
echo.
pause
