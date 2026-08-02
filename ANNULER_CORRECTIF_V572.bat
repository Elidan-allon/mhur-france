@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V572
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V572.js"
echo.
pause
