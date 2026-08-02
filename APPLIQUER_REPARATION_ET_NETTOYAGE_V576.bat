@echo off
chcp 65001 >nul
title MHUR FRANCE - Reparation et nettoyage V576
cd /d "%~dp0"

echo.
echo ============================================================
echo  MHUR FRANCE - REPARATION + NETTOYAGE V576
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js est introuvable.
  echo.
  pause
  exit /b 1
)

node "REPARER_ET_NETTOYER_V576.js"
echo.
pause
