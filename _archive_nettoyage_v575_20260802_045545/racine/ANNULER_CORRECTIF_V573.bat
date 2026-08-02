@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V573
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V573.js"
echo.
pause
