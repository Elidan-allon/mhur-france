@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V567
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V567.js"
echo.
pause
