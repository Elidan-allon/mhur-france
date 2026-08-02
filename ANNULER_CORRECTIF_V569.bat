@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V569
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V569.js"
echo.
pause
