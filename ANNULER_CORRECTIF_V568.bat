@echo off
chcp 65001 >nul
title MHUR FRANCE - Annuler V568
cd /d "%~dp0"
node "ANNULER_CORRECTIF_V568.js"
echo.
pause
