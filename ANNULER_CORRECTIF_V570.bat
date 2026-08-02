@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V570
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V570.js"
echo.
pause
