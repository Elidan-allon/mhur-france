@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler nettoyage V575
cd /d "%~dp0"
node "ANNULER_NETTOYAGE_V575.js"
echo.
pause
