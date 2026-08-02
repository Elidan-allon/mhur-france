@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V571
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V571.js"
echo.
pause
