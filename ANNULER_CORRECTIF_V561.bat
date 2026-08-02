@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V561
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V561.js"
echo.
pause
