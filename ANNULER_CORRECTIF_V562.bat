@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V562
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V562.js"
echo.
pause
