@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V563
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V563.js"
echo.
pause
