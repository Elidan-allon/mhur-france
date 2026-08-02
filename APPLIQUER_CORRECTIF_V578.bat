@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif source V578
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V578 - NEW SOURCE ROBUSTE
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V578.js"
echo.
pause
