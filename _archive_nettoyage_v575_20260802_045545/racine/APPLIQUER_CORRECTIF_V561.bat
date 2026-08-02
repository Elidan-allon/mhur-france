@echo off
chcp 65001 >nul
title MHUR FRANCE - Correctif V561
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - V561 - CARTES REDUCTIONS PLEINE LARGEUR
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo Installe Node.js ou lance APPLIQUER_CORRECTIF_V561.js avec Node.
  echo.
  pause
  exit /b 1
)

node "APPLIQUER_CORRECTIF_V561.js"
echo.
pause
