@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V564
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V564.js"
echo.
pause
