@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V579
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V579.js"
echo.
pause
